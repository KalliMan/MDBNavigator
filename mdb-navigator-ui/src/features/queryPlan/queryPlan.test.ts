import { describe, expect, it } from 'vitest'
import {
  formatPlanValue,
  formatShare,
  mayChangeData,
  parsePlan,
  planKeyAction,
  planNodeLabel,
  visiblePlanRows,
  type ParsedPlan,
  type PlanNode,
} from './queryPlan'

// The plan as the server sends it: EXPLAIN's JSON in one string cell.
function cellOf(top: unknown): string {
  return JSON.stringify(top)
}

function parsed(top: unknown): ParsedPlan {
  const result = parsePlan(cellOf(top))
  if ('error' in result) {
    throw new Error(result.error)
  }
  return result.plan
}

describe('parsePlan', () => {
  it('reads an estimated plan: costs and shares, no times', () => {
    // Limit (cost 10) over Seq Scan (cost 8): own costs 2 and 8, so shares 0.2 and 0.8.
    const plan = parsed([{
      Plan: {
        'Node Type': 'Limit', 'Total Cost': 10, 'Plan Rows': 5,
        Plans: [{ 'Node Type': 'Seq Scan', 'Relation Name': 't', Alias: 't', 'Total Cost': 8, 'Plan Rows': 100 }],
      },
    }])

    expect(plan.analyzed).toBe(false)
    expect(plan.totalCost).toBe(10)
    expect(plan.planningMs).toBeNull()
    expect(plan.executionMs).toBeNull()
    expect(plan.root.id).toBe('0')
    expect(plan.root.children[0].id).toBe('0.0')
    expect(plan.root.children[0].depth).toBe(1)
    expect(plan.root.ownCost).toBeCloseTo(2)
    expect(plan.root.share).toBeCloseTo(0.2)
    expect(plan.root.level).toBe('medium')
    expect(plan.root.children[0].ownCost).toBe(8)
    expect(plan.root.children[0].share).toBeCloseTo(0.8)
    expect(plan.root.children[0].level).toBe('high')
    expect(plan.root.totalMs).toBeNull()
    expect(plan.root.ownMs).toBeNull()
    expect(plan.root.loops).toBeNull()
    expect(plan.root.misestimate).toBeNull()
  })

  it('reads a real-shaped analyzed plan: own times, shares, levels and misestimates', () => {
    // Hash Join (total 100 ms)
    //   Seq Scan a (40 ms)
    //   Hash (30 ms)
    //     Seq Scan b (28 ms)
    // Own time: join 100 - 40 - 30 = 30, a 40, hash 30 - 28 = 2, b 28. The sum is 100, so the shares are
    // 0.30 (high: at least 0.3), 0.40 (high), 0.02 (none) and 0.28 (medium: at least 0.1).
    // Rows, estimated -> got: join 50 -> 500 (factor 10, under), a 1000 -> 900 (1.1, none),
    // hash 100 -> 100 (none), b 1000 -> 100 (factor 10, over).
    const plan = parsed([{
      Plan: {
        'Node Type': 'Hash Join', 'Join Type': 'Inner', 'Total Cost': 100, 'Plan Rows': 50, 'Actual Rows': 500,
        'Actual Loops': 1, 'Actual Total Time': 100,
        Plans: [
          { 'Node Type': 'Seq Scan', 'Relation Name': 'a', Alias: 'a', 'Total Cost': 40, 'Plan Rows': 1000, 'Actual Rows': 900,
            'Actual Loops': 1, 'Actual Total Time': 40 },
          { 'Node Type': 'Hash', 'Total Cost': 30, 'Plan Rows': 100, 'Actual Rows': 100, 'Actual Loops': 1, 'Actual Total Time': 30,
            Plans: [
              { 'Node Type': 'Seq Scan', 'Relation Name': 'b', Alias: 'b', 'Total Cost': 25, 'Plan Rows': 1000, 'Actual Rows': 100,
                'Actual Loops': 1, 'Actual Total Time': 28 },
            ] },
        ],
      },
      'Planning Time': 0.21,
      'Execution Time': 100.5,
    }])

    expect(plan.analyzed).toBe(true)
    expect(plan.planningMs).toBe(0.21)
    expect(plan.executionMs).toBe(100.5)

    const [join, a, hash, b] = visiblePlanRows(plan.root, new Set())
    expect(join.label).toBe('Hash Join')
    expect(join.ownMs).toBe(30)
    expect(join.share).toBeCloseTo(0.3)
    expect(join.level).toBe('high')
    expect(join.misestimate).toEqual({ factor: 10, direction: 'under' })

    expect(a.ownMs).toBe(40)
    expect(a.level).toBe('high')
    expect(a.misestimate).toBeNull()

    expect(hash.ownMs).toBe(2)
    expect(hash.share).toBeCloseTo(0.02)
    expect(hash.level).toBeNull()
    expect(hash.misestimate).toBeNull()

    expect(b.ownMs).toBe(28)
    expect(b.level).toBe('medium')
    expect(b.misestimate).toEqual({ factor: 10, direction: 'over' })

    const sum = [join, a, hash, b].reduce((total, node) => total + node.share, 0)
    expect(sum).toBeCloseTo(1)
  })

  it('multiplies a step\'s time by its loops', () => {
    // Nested Loop 10 ms, inner scan 0.5 ms x 8 loops = 4 ms total: the loop's own time is 6 ms.
    const plan = parsed([{
      Plan: {
        'Node Type': 'Nested Loop', 'Total Cost': 5, 'Actual Total Time': 10, 'Actual Loops': 1, 'Actual Rows': 8, 'Plan Rows': 8,
        Plans: [{ 'Node Type': 'Index Scan', 'Total Cost': 1, 'Actual Total Time': 0.5, 'Actual Loops': 8, 'Actual Rows': 1, 'Plan Rows': 1 }],
      },
      'Execution Time': 10,
    }])

    expect(plan.root.children[0].totalMs).toBe(4)
    expect(plan.root.ownMs).toBe(6)
  })

  it('never lets an own time go below 0', () => {
    // The children take more than the parent (parallel workers add up).
    const plan = parsed([{
      Plan: {
        'Node Type': 'Gather', 'Total Cost': 10, 'Actual Total Time': 5, 'Actual Loops': 1, 'Actual Rows': 1, 'Plan Rows': 1,
        Plans: [{ 'Node Type': 'Seq Scan', 'Total Cost': 12, 'Actual Total Time': 9, 'Actual Loops': 1, 'Actual Rows': 1, 'Plan Rows': 1 }],
      },
      'Execution Time': 5,
    }])

    expect(plan.root.ownMs).toBe(0)
    expect(plan.root.ownCost).toBe(0)
    expect(plan.root.children[0].share).toBe(1)
  })

  it('marks a step that never ran: no time, no misestimate, no share', () => {
    const plan = parsed([{
      Plan: {
        'Node Type': 'Nested Loop', 'Total Cost': 5, 'Actual Total Time': 2, 'Actual Loops': 1, 'Actual Rows': 0, 'Plan Rows': 1,
        Plans: [
          { 'Node Type': 'Seq Scan', 'Total Cost': 1, 'Actual Total Time': 2, 'Actual Loops': 1, 'Actual Rows': 0, 'Plan Rows': 1 },
          { 'Node Type': 'Index Scan', 'Total Cost': 1, 'Actual Total Time': 0, 'Actual Loops': 0, 'Actual Rows': 0, 'Plan Rows': 5000 },
        ],
      },
      'Execution Time': 2,
    }])

    const never = plan.root.children[1]
    expect(never.neverExecuted).toBe(true)
    expect(never.totalMs).toBe(0)
    expect(never.share).toBe(0)
    expect(never.misestimate).toBeNull()
    expect(plan.root.children[0].neverExecuted).toBe(false)
  })

  it('gives a one-step plan a share of 100 %, or 0 when its cost is 0', () => {
    expect(parsed([{ Plan: { 'Node Type': 'Result', 'Total Cost': 0.01, 'Plan Rows': 1 } }]).root.share).toBe(1)
    expect(parsed([{ Plan: { 'Node Type': 'Result', 'Total Cost': 0, 'Plan Rows': 1 } }]).root.share).toBe(0)
  })

  it('counts a missing number as 0', () => {
    const plan = parsed([{ Plan: { 'Node Type': 'Result' } }])

    expect(plan.root.totalCost).toBe(0)
    expect(plan.root.estimatedRows).toBe(0)
    expect(plan.root.share).toBe(0)
  })

  it('takes the plan as analyzed when only the root has Actual Loops', () => {
    const plan = parsed([{ Plan: { 'Node Type': 'Result', 'Actual Loops': 1, 'Actual Total Time': 0.01, 'Actual Rows': 1, 'Plan Rows': 1 } }])

    expect(plan.analyzed).toBe(true)
  })

  it('keeps the subplan name and the step\'s properties in order, formatted', () => {
    const plan = parsed([{
      Plan: {
        'Node Type': 'Result', 'Total Cost': 1,
        Plans: [{
          'Node Type': 'Seq Scan', 'Subplan Name': 'InitPlan 1', 'Parallel Aware': false, 'Total Cost': 1234.5678,
          'Output': ['a', 'b'], Plans: [],
        }],
      },
    }])

    const child = plan.root.children[0]
    expect(child.subplanName).toBe('InitPlan 1')
    expect(child.details).toEqual([
      ['Node Type', 'Seq Scan'],
      ['Subplan Name', 'InitPlan 1'],
      ['Parallel Aware', 'no'],
      ['Total Cost', '1,234.568'],
      ['Output', 'a, b'],
    ])
    expect(plan.root.subplanName).toBeNull()
  })

  it('reads the triggers of an analyzed statement', () => {
    const plan = parsed([{
      Plan: { 'Node Type': 'Insert', 'Total Cost': 1, 'Actual Total Time': 1, 'Actual Loops': 1, 'Actual Rows': 0, 'Plan Rows': 0 },
      Triggers: [{ 'Trigger Name': 'audit', Relation: 'film', Time: 0.3, Calls: 2 }, { 'Trigger Name': 'RI_ConstraintTrigger_c_1', Time: 0.1, Calls: 1 }],
      'Execution Time': 1.5,
    }])

    expect(plan.triggers).toEqual([
      { name: 'audit', relation: 'film', ms: 0.3, calls: 2 },
      { name: 'RI_ConstraintTrigger_c_1', relation: null, ms: 0.1, calls: 1 },
    ])
    expect(parsed([{ Plan: { 'Node Type': 'Result' } }]).triggers).toEqual([])
  })

  it('gives the plan back as indented JSON', () => {
    const top = [{ Plan: { 'Node Type': 'Result' } }]

    expect(parsed(top).json).toBe(JSON.stringify(top, null, 2))
  })

  it('accepts an array that is already parsed', () => {
    const result = parsePlan([{ Plan: { 'Node Type': 'Result', 'Total Cost': 1 } }])

    expect('plan' in result && result.plan.root.label).toBe('Result')
  })

  it('reports text that is not JSON', () => {
    const result = parsePlan('Seq Scan on film')

    expect('error' in result && result.error).toMatch(/^The plan couldn't be read: .+/)
  })

  it('reports a plan that was cut at the row limit', () => {
    const result = parsePlan('[{"Plan": {"Node Type": "Seq Scan", "Output": ["a", "b"… [cut: 2 MB in total]')

    expect('error' in result && result.error).toMatch(/^The plan couldn't be read: /)
  })

  it.each([
    ['an empty array', '[]'],
    ['an object', '{"Plan": {}}'],
    ['an array without Plan', '[{"Node Type": "Seq Scan"}]'],
    ['a Plan that is not an object', '[{"Plan": 5}]'],
    ['a number', '5'],
  ])('reports the wrong shape: %s', (_name, cell) => {
    expect(parsePlan(cell)).toEqual({ error: "The plan couldn't be read: unexpected format." })
  })

  it('reports a cell that is not text', () => {
    expect(parsePlan(null)).toEqual({ error: "The plan couldn't be read: unexpected format." })
  })
})

describe('planNodeLabel', () => {
  it.each<[string, Record<string, unknown>, string]>([
    ['a scan with an alias', { 'Node Type': 'Seq Scan', 'Relation Name': 'film', Alias: 'f' }, 'Seq Scan on film f'],
    ['an alias equal to the table', { 'Node Type': 'Seq Scan', 'Relation Name': 'film', Alias: 'film' }, 'Seq Scan on film'],
    ['an index scan', { 'Node Type': 'Index Scan', 'Index Name': 'film_pkey', 'Relation Name': 'film', Alias: 'film' }, 'Index Scan using film_pkey on film'],
    ['a backward index scan', { 'Node Type': 'Index Scan', 'Scan Direction': 'Backward', 'Index Name': 'idx', 'Relation Name': 't', Alias: 't' }, 'Index Scan Backward using idx on t'],
    ['an index only scan', { 'Node Type': 'Index Only Scan', 'Index Name': 'idx', 'Relation Name': 't', Alias: 't' }, 'Index Only Scan using idx on t'],
    ['a bitmap heap scan', { 'Node Type': 'Bitmap Heap Scan', 'Relation Name': 'rental', Alias: 'r' }, 'Bitmap Heap Scan on rental r'],
    ['a bitmap index scan', { 'Node Type': 'Bitmap Index Scan', 'Index Name': 'idx_fk_customer_id' }, 'Bitmap Index Scan on idx_fk_customer_id'],
    ['an inner hash join', { 'Node Type': 'Hash Join', 'Join Type': 'Inner' }, 'Hash Join'],
    ['a left hash join', { 'Node Type': 'Hash Join', 'Join Type': 'Left' }, 'Hash Left Join'],
    ['an anti nested loop', { 'Node Type': 'Nested Loop', 'Join Type': 'Anti' }, 'Nested Loop Anti Join'],
    ['an inner nested loop', { 'Node Type': 'Nested Loop', 'Join Type': 'Inner' }, 'Nested Loop'],
    ['a left nested loop', { 'Node Type': 'Nested Loop', 'Join Type': 'Left' }, 'Nested Loop Left Join'],
    ['a full merge join', { 'Node Type': 'Merge Join', 'Join Type': 'Full' }, 'Merge Full Join'],
    ['a right anti hash join', { 'Node Type': 'Hash Join', 'Join Type': 'Right Anti' }, 'Hash Right Anti Join'],
    ['a hashed aggregate', { 'Node Type': 'Aggregate', Strategy: 'Hashed' }, 'HashAggregate'],
    ['a sorted aggregate', { 'Node Type': 'Aggregate', Strategy: 'Sorted' }, 'GroupAggregate'],
    ['a mixed aggregate', { 'Node Type': 'Aggregate', Strategy: 'Mixed' }, 'MixedAggregate'],
    ['a plain aggregate', { 'Node Type': 'Aggregate', Strategy: 'Plain' }, 'Aggregate'],
    ['an aggregate without a strategy', { 'Node Type': 'Aggregate' }, 'Aggregate'],
    ['a finalize group aggregate', { 'Node Type': 'Aggregate', Strategy: 'Sorted', 'Partial Mode': 'Finalize' }, 'Finalize GroupAggregate'],
    ['a partial hash aggregate', { 'Node Type': 'Aggregate', Strategy: 'Hashed', 'Partial Mode': 'Partial' }, 'Partial HashAggregate'],
    ['a simple aggregate', { 'Node Type': 'Aggregate', Strategy: 'Plain', 'Partial Mode': 'Simple' }, 'Aggregate'],
    ['a hashed set operation', { 'Node Type': 'SetOp', Strategy: 'Hashed' }, 'HashSetOp'],
    ['a sorted set operation', { 'Node Type': 'SetOp', Strategy: 'Sorted' }, 'SetOp'],
    ['a parallel scan', { 'Node Type': 'Seq Scan', 'Parallel Aware': true, 'Relation Name': 'payment', Alias: 'p' }, 'Parallel Seq Scan on payment p'],
    ['a CTE scan', { 'Node Type': 'CTE Scan', 'CTE Name': 'x', Alias: 'x' }, 'CTE Scan on x'],
    ['a CTE scan with another alias', { 'Node Type': 'CTE Scan', 'CTE Name': 'x', Alias: 'y' }, 'CTE Scan on x y'],
    ['a function scan', { 'Node Type': 'Function Scan', 'Function Name': 'generate_series', Alias: 'g' }, 'Function Scan on generate_series g'],
    ['a subquery scan', { 'Node Type': 'Subquery Scan', Alias: 'sub' }, 'Subquery Scan on sub'],
    ['a values scan', { 'Node Type': 'Values Scan', Alias: '*VALUES*' }, 'Values Scan on *VALUES*'],
    ['a sort', { 'Node Type': 'Sort' }, 'Sort'],
    ['a limit', { 'Node Type': 'Limit' }, 'Limit'],
    ['an update', { 'Node Type': 'ModifyTable', Operation: 'Update', 'Relation Name': 'actor', Alias: 'actor' }, 'Update on actor'],
    ['an insert with an alias', { 'Node Type': 'ModifyTable', Operation: 'Insert', 'Relation Name': 'film', Alias: 'f' }, 'Insert on film f'],
    ['a modify step without an operation', { 'Node Type': 'ModifyTable', 'Relation Name': 't' }, 'ModifyTable on t'],
  ])('%s', (_name, node, label) => {
    expect(planNodeLabel(node)).toBe(label)
  })
})

describe('formatShare', () => {
  it.each<[number, string]>([
    [0, '0 %'],
    [0.004, '<1 %'],
    [0.005, '1 %'],
    [0.123, '12 %'],
    [1, '100 %'],
  ])('%s is %s', (share, text) => {
    expect(formatShare(share)).toBe(text)
  })
})

describe('formatPlanValue', () => {
  it('formats numbers with thousands separators and up to 3 decimals', () => {
    expect(formatPlanValue(1234567)).toBe('1,234,567')
    expect(formatPlanValue(0.12345)).toBe('0.123')
    expect(formatPlanValue(2)).toBe('2')
  })

  it('writes booleans as yes and no', () => {
    expect(formatPlanValue(true)).toBe('yes')
    expect(formatPlanValue(false)).toBe('no')
  })

  it('keeps strings as they are', () => {
    expect(formatPlanValue('(a = 1)')).toBe('(a = 1)')
  })

  it('joins arrays with commas, formatting each item', () => {
    expect(formatPlanValue(['a', 'b'])).toBe('a, b')
    expect(formatPlanValue([1000, true])).toBe('1,000, yes')
    expect(formatPlanValue([{ Worker: 1 }, 'x'])).toBe('{"Worker":1}, x')
  })

  it('writes objects as JSON and null as nothing', () => {
    expect(formatPlanValue({ a: 1 })).toBe('{"a":1}')
    expect(formatPlanValue(null)).toBe('')
  })
})

describe('visiblePlanRows', () => {
  const plan = parsed([{
    Plan: {
      'Node Type': 'Limit', 'Total Cost': 3,
      Plans: [
        { 'Node Type': 'Sort', 'Total Cost': 2, Plans: [{ 'Node Type': 'Seq Scan', 'Total Cost': 1 }] },
        { 'Node Type': 'Result', 'Total Cost': 1 },
      ],
    },
  }])

  it('lists the steps depth first', () => {
    expect(visiblePlanRows(plan.root, new Set()).map(row => row.id)).toEqual(['0', '0.0', '0.0.0', '0.1'])
  })

  it('leaves out the children of a collapsed step', () => {
    expect(visiblePlanRows(plan.root, new Set(['0.0'])).map(row => row.id)).toEqual(['0', '0.0', '0.1'])
    expect(visiblePlanRows(plan.root, new Set(['0'])).map(row => row.id)).toEqual(['0'])
  })
})

describe('planKeyAction', () => {
  // 0 Limit
  //   0.0 Sort
  //     0.0.0 Seq Scan
  //   0.1 Result
  const plan = parsed([{
    Plan: {
      'Node Type': 'Limit', 'Total Cost': 3,
      Plans: [
        { 'Node Type': 'Sort', 'Total Cost': 2, Plans: [{ 'Node Type': 'Seq Scan', 'Total Cost': 1 }] },
        { 'Node Type': 'Result', 'Total Cost': 1 },
      ],
    },
  }])
  const none: ReadonlySet<string> = new Set()
  const rowsOf = (collapsed: ReadonlySet<string>): PlanNode[] => visiblePlanRows(plan.root, collapsed)

  it('moves down and up, and stays at the ends', () => {
    expect(planKeyAction(rowsOf(none), '0', 'ArrowDown', none)?.selectedId).toBe('0.0')
    expect(planKeyAction(rowsOf(none), '0.0.0', 'ArrowDown', none)?.selectedId).toBe('0.1')
    expect(planKeyAction(rowsOf(none), '0.1', 'ArrowDown', none)?.selectedId).toBe('0.1')
    expect(planKeyAction(rowsOf(none), '0.1', 'ArrowUp', none)?.selectedId).toBe('0.0.0')
    expect(planKeyAction(rowsOf(none), '0', 'ArrowUp', none)?.selectedId).toBe('0')
  })

  it('goes to the first and last row', () => {
    expect(planKeyAction(rowsOf(none), '0.0', 'Home', none)?.selectedId).toBe('0')
    expect(planKeyAction(rowsOf(none), '0', 'End', none)?.selectedId).toBe('0.1')
  })

  it('skips the children of a collapsed step', () => {
    const collapsed = new Set(['0.0'])

    expect(planKeyAction(rowsOf(collapsed), '0.0', 'ArrowDown', collapsed)?.selectedId).toBe('0.1')
  })

  it('ArrowRight expands a collapsed step, and otherwise selects the first child', () => {
    const collapsed = new Set(['0.0'])
    const expanded = planKeyAction(rowsOf(collapsed), '0.0', 'ArrowRight', collapsed)

    expect(expanded?.selectedId).toBe('0.0')
    expect(expanded?.collapsed.has('0.0')).toBe(false)
    // The old Set is not changed.
    expect(collapsed.has('0.0')).toBe(true)

    expect(planKeyAction(rowsOf(none), '0.0', 'ArrowRight', none)?.selectedId).toBe('0.0.0')
  })

  it('ArrowRight on a leaf is handled and does nothing', () => {
    expect(planKeyAction(rowsOf(none), '0.1', 'ArrowRight', none)).toEqual({ selectedId: '0.1', collapsed: none })
  })

  it('ArrowLeft collapses an expanded step, and otherwise selects the parent', () => {
    const collapsedNow = planKeyAction(rowsOf(none), '0.0', 'ArrowLeft', none)

    expect(collapsedNow?.selectedId).toBe('0.0')
    expect(collapsedNow?.collapsed.has('0.0')).toBe(true)
    expect(none.has('0.0')).toBe(false)

    expect(planKeyAction(rowsOf(none), '0.0.0', 'ArrowLeft', none)?.selectedId).toBe('0.0')
    expect(planKeyAction(rowsOf(none), '0.1', 'ArrowLeft', none)?.selectedId).toBe('0')

    const collapsed = new Set(['0.0'])
    expect(planKeyAction(rowsOf(collapsed), '0.0', 'ArrowLeft', collapsed)?.selectedId).toBe('0')
  })

  it('ArrowLeft on the root, collapsed or a leaf, stays', () => {
    const collapsed = new Set(['0'])

    expect(planKeyAction(rowsOf(collapsed), '0', 'ArrowLeft', collapsed)).toEqual({ selectedId: '0', collapsed })
  })

  it('does not handle other keys', () => {
    expect(planKeyAction(rowsOf(none), '0', 'a', none)).toBeNull()
    expect(planKeyAction(rowsOf(none), '0', 'Enter', none)).toBeNull()
  })
})

describe('mayChangeData', () => {
  it.each([
    ['update t set a=1', true],
    ['INSERT INTO t VALUES (1)', true],
    ['delete from t', true],
    ['merge into t using s on true when matched then delete', true],
    ['with d as (delete from t returning *) select * from d', true],
    ["select 'delete'", false],
    ["select 'it''s an update'", false],
    ['-- delete\nselect 1', false],
    ['/* insert */ select 1', false],
    ['select "update" from t', false],
    ['select $$insert$$', false],
    ['select $tag$ delete $tag$', false],
    ['select * from t', false],
    ['select updated_at from t', false],
  ])('%s -> %s', (sql, expected) => {
    expect(mayChangeData(sql)).toBe(expected)
  })

  it('does not take a comment marker inside a string for a comment', () => {
    expect(mayChangeData("select '--'; delete from t")).toBe(true)
  })
})
