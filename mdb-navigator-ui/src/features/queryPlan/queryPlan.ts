import { CellValue } from '../../models/databaseCommand/result/cellValue';

// Reads PostgreSQL's EXPLAIN (FORMAT JSON), which the server sends as one string cell (see docs/api.md, "plan"),
// and works out what the plan viewer shows. Pure functions, no React. A later provider with another plan format
// would bring its own parser.

export const HIGH_SHARE = 0.3;
export const MEDIUM_SHARE = 0.1;
// Rows expected against rows got, either way, from which a step is marked.
export const MISESTIMATE_FACTOR = 10;

export type ShareLevel = 'high' | 'medium' | null;

// A step's share as a whole percentage; "<1 %" for a share that rounds to 0 but isn't 0, so no step that did work reads 0 %.
export function formatShare(share: number): string {
  const percent = Math.round(share * 100);
  return share > 0 && percent === 0 ? '<1 %' : `${percent} %`;
}

export interface PlanNode {
  // Path from the root: "0", "0.1", "0.1.0". Unique within a plan, and stable for the same plan.
  id: string;
  depth: number;
  label: string;                 // planNodeLabel
  // "SubPlan 1", "InitPlan 2", "CTE films": EXPLAIN's "Subplan Name"; null when absent.
  subplanName: string | null;
  estimatedRows: number;         // "Plan Rows" (per loop)
  actualRows: number | null;     // "Actual Rows" (per loop); null without ANALYZE
  loops: number | null;          // "Actual Loops"; null without ANALYZE
  neverExecuted: boolean;        // ANALYZE and Actual Loops = 0
  totalCost: number;             // "Total Cost"
  ownCost: number;               // Total Cost minus the children's Total Cost, at least 0
  totalMs: number | null;        // Actual Total Time × Actual Loops; null without ANALYZE
  ownMs: number | null;          // totalMs minus the children's totalMs, at least 0
  share: number;                 // 0..1: ownMs (ANALYZE) or ownCost, divided by the sum over all steps
  level: ShareLevel;             // share >= HIGH_SHARE: 'high', >= MEDIUM_SHARE: 'medium'
  // PostgreSQL expected far fewer ('under') or far more ('over') rows than it got. ANALYZE only, not for steps never run.
  misestimate: { factor: number; direction: 'under' | 'over' } | null;
  // The step's own properties as EXPLAIN gave them, in its order, without "Plans", formatted (formatPlanValue).
  details: [string, string][];
  children: PlanNode[];
}

export interface PlanTrigger { name: string; relation: string | null; ms: number; calls: number }

export interface ParsedPlan {
  analyzed: boolean;
  root: PlanNode;
  planningMs: number | null;     // "Planning Time"
  executionMs: number | null;    // "Execution Time"
  totalCost: number;             // the root's Total Cost
  triggers: PlanTrigger[];       // "Triggers" (ANALYZE of a statement that fired triggers); [] otherwise
  // The plan as EXPLAIN gave it, indented with 2 spaces: the JSON view and Copy JSON.
  json: string;
}

export type PlanParseResult = { plan: ParsedPlan } | { error: string };

type Raw = Record<string, unknown>;

function isRaw(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Missing or not a number counts as 0.
function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function optionalNum(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function unreadable(reason: string): { error: string } {
  return { error: `The plan couldn't be read: ${reason}` };
}

export function parsePlan(cell: CellValue): PlanParseResult {
  let top: unknown = cell;
  if (typeof cell === 'string') {
    try {
      top = JSON.parse(cell);
    } catch (error) {
      return unreadable(error instanceof Error ? error.message : 'not valid JSON.');
    }
  }

  const first: unknown = Array.isArray(top) ? top[0] : undefined;
  if (!isRaw(first) || !isRaw(first['Plan'])) {
    return unreadable('unexpected format.');
  }
  const rootRaw = first['Plan'];
  const analyzed = 'Execution Time' in first || 'Actual Loops' in rootRaw;

  const nodes: PlanNode[] = [];
  const root = buildNode(rootRaw, '0', 0, analyzed, nodes);

  // The shares: each step's own time (ANALYZE) or cost, over the sum of all steps.
  const own = (node: PlanNode) => (analyzed ? node.ownMs ?? 0 : node.ownCost);
  const sum = nodes.reduce((total, node) => total + own(node), 0);
  for (const node of nodes) {
    node.share = sum > 0 ? own(node) / sum : 0;
    node.level = node.share >= HIGH_SHARE ? 'high' : node.share >= MEDIUM_SHARE ? 'medium' : null;
  }

  const triggersRaw = first['Triggers'];
  const triggers: PlanTrigger[] = Array.isArray(triggersRaw)
    ? triggersRaw.filter(isRaw).map(trigger => ({
        name: str(trigger['Trigger Name']) ?? '',
        relation: str(trigger['Relation']),
        ms: num(trigger['Time']),
        calls: num(trigger['Calls']),
      }))
    : [];

  return {
    plan: {
      analyzed,
      root,
      planningMs: optionalNum(first['Planning Time']),
      executionMs: optionalNum(first['Execution Time']),
      totalCost: root.totalCost,
      triggers,
      json: JSON.stringify(top, null, 2),
    },
  };
}

// Builds the node and its children; every node, in depth-first order, is also pushed to `all` for the shares.
function buildNode(raw: Raw, id: string, depth: number, analyzed: boolean, all: PlanNode[]): PlanNode {
  const childrenRaw = Array.isArray(raw['Plans']) ? raw['Plans'].filter(isRaw) : [];

  const loops = analyzed ? num(raw['Actual Loops']) : null;
  const neverExecuted = analyzed && loops === 0;
  const estimatedRows = num(raw['Plan Rows']);
  const actualRows = analyzed ? num(raw['Actual Rows']) : null;

  const node: PlanNode = {
    id,
    depth,
    label: planNodeLabel(raw),
    subplanName: str(raw['Subplan Name']),
    estimatedRows,
    actualRows,
    loops,
    neverExecuted,
    totalCost: num(raw['Total Cost']),
    ownCost: 0,
    totalMs: analyzed && loops !== null ? (neverExecuted ? 0 : num(raw['Actual Total Time']) * loops) : null,
    ownMs: null,
    share: 0,
    level: null,
    misestimate: null,
    details: Object.entries(raw)
      .filter(([key]) => key !== 'Plans')
      .map(([key, value]): [string, string] => [key, formatPlanValue(value)]),
    children: [],
  };
  all.push(node);
  node.children = childrenRaw.map((child, index) => buildNode(child, `${id}.${index}`, depth + 1, analyzed, all));

  // A step's own part is what is left after its children's, never below 0 (parallel workers and rounding can
  // make the children add up to more).
  node.ownCost = Math.max(0, node.totalCost - node.children.reduce((total, child) => total + child.totalCost, 0));
  if (node.totalMs !== null) {
    node.ownMs = Math.max(0, node.totalMs - node.children.reduce((total, child) => total + (child.totalMs ?? 0), 0));
  }

  if (analyzed && !neverExecuted && actualRows !== null) {
    const hi = Math.max(estimatedRows, actualRows);
    const lo = Math.max(Math.min(estimatedRows, actualRows), 1);
    const factor = hi / lo;
    if (factor >= MISESTIMATE_FACTOR) {
      node.misestimate = { factor: Math.round(factor), direction: actualRows > estimatedRows ? 'under' : 'over' };
    }
  }

  return node;
}

// The step's name as PostgreSQL's text EXPLAIN writes it: "Seq Scan on film f", "Hash Left Join".
export function planNodeLabel(node: Record<string, unknown>): string {
  const type = str(node['Node Type']) ?? 'Unknown';
  let label = type;

  if (type === 'Aggregate') {
    const strategy = str(node['Strategy']);
    label = strategy === 'Sorted' ? 'GroupAggregate'
      : strategy === 'Hashed' ? 'HashAggregate'
      : strategy === 'Mixed' ? 'MixedAggregate'
      : 'Aggregate';
    const mode = str(node['Partial Mode']);
    if (mode === 'Partial' || mode === 'Finalize') {
      label = `${mode} ${label}`;
    }
  } else if (type === 'ModifyTable') {
    // INSERT, UPDATE, DELETE and MERGE: the text EXPLAIN names the operation ("Update on actor"), not the node type.
    label = str(node['Operation']) ?? type;
  } else if (type === 'SetOp') {
    label = str(node['Strategy']) === 'Hashed' ? 'HashSetOp' : 'SetOp';
  } else if (type === 'Nested Loop' || type === 'Hash Join' || type === 'Merge Join') {
    const joinType = str(node['Join Type']);
    if (joinType && joinType !== 'Inner') {
      label = type === 'Nested Loop' ? `Nested Loop ${joinType} Join`
        : type === 'Hash Join' ? `Hash ${joinType} Join`
        : `Merge ${joinType} Join`;
    }
  }

  if (node['Parallel Aware'] === true) {
    label = `Parallel ${label}`;
  }

  const indexName = str(node['Index Name']);
  if (type === 'Index Scan' || type === 'Index Only Scan') {
    if (node['Scan Direction'] === 'Backward') {
      label += ' Backward';
    }
    if (indexName) {
      label += ` using ${indexName}`;
    }
  } else if (type === 'Bitmap Index Scan' && indexName) {
    label += ` on ${indexName}`;
  }

  // What the step works on.
  const alias = str(node['Alias']);
  const target = str(node['Relation Name']) ?? str(node['CTE Name']) ?? str(node['Function Name']);
  if (target) {
    label += ` on ${target}`;
    if (alias && alias !== target) {
      label += ` ${alias}`;
    }
  } else if ((type === 'Subquery Scan' || type === 'Values Scan') && alias) {
    label += ` on ${alias}`;
  }

  return label;
}

export function formatPlanValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { maximumFractionDigits: 3 });
  }
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => (isRaw(item) || Array.isArray(item) ? JSON.stringify(item) : formatPlanValue(item))).join(', ');
  }
  return JSON.stringify(value);
}

// The rows on screen: depth-first, children of collapsed steps left out.
export function visiblePlanRows(root: PlanNode, collapsed: ReadonlySet<string>): PlanNode[] {
  const rows: PlanNode[] = [];
  const visit = (node: PlanNode) => {
    rows.push(node);
    if (!collapsed.has(node.id)) {
      node.children.forEach(visit);
    }
  };
  visit(root);
  return rows;
}

// What a key does in the tree. null: the key isn't handled. A handled key always returns both values, unchanged
// when it does nothing; `collapsed` is a new Set whenever it changes, never a mutated one.
export function planKeyAction(
  rows: PlanNode[], selectedId: string, key: string, collapsed: ReadonlySet<string>
): { selectedId: string; collapsed: ReadonlySet<string> } | null {
  const found = rows.findIndex(row => row.id === selectedId);
  const index = Math.max(found, 0);
  const current = rows[index];
  const select = (id: string) => ({ selectedId: id, collapsed });

  switch (key) {
    case 'ArrowDown':
      return select(rows[Math.min(index + 1, rows.length - 1)]?.id ?? selectedId);
    case 'ArrowUp':
      return select(rows[Math.max(index - 1, 0)]?.id ?? selectedId);
    case 'Home':
      return select(rows[0]?.id ?? selectedId);
    case 'End':
      return select(rows[rows.length - 1]?.id ?? selectedId);
    case 'ArrowRight': {
      if (!current || current.children.length === 0) {
        return select(selectedId);
      }
      if (collapsed.has(current.id)) {
        const next = new Set(collapsed);
        next.delete(current.id);
        return { selectedId, collapsed: next };
      }
      return select(current.children[0].id);
    }
    case 'ArrowLeft': {
      if (current && current.children.length > 0 && !collapsed.has(current.id)) {
        return { selectedId, collapsed: new Set(collapsed).add(current.id) };
      }
      const dot = selectedId.lastIndexOf('.');
      return select(dot === -1 ? selectedId : selectedId.slice(0, dot));
    }
    default:
      return null;
  }
}

// What a script may not hold for the check: comments, quoted text, quoted names and dollar-quoted text.
// One pass from the left, so a "--" inside a string is not a comment and a quote inside a comment is not a string.
const IGNORED_TEXT = /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^']|'')*'|"(?:[^"]|"")*"|\$([A-Za-z_][A-Za-z0-9_]*)?\$[\s\S]*?\$\1\$/g;

// True when the SQL may change data: insert, update, delete or merge as a word outside comments and quoted text.
// A wrong "yes" only costs one click in the confirmation; a wrong "no" is still rolled back by the server.
export function mayChangeData(sql: string): boolean {
  return /\b(insert|update|delete|merge)\b/i.test(sql.replace(IGNORED_TEXT, ' '));
}
