import { describe, expect, it } from 'vitest'
import { activeResultTabId, executingLabel, parseRunError, recordsAffectedText, rowLimitText, statementsAroundFailure } from './runStatus'

describe('executingLabel', () => {
  it('says "Executing query..." before any statement is announced', () => {
    expect(executingLabel(null, [])).toBe('Executing query...')
  })

  it('says "Executing query..." for a script of one statement', () => {
    expect(executingLabel({ index: 0, count: 1 }, [])).toBe('Executing query...')
  })

  it('names the running statement of a longer script, counting from 1', () => {
    expect(executingLabel({ index: 1, count: 3 }, [])).toBe('Executing statement 2 of 3...')
  })

  it('says the rest of a result is skipped, naming its tab', () => {
    const resultSets = [{ resultSetIndex: 0, skippingRest: true }]
    expect(executingLabel({ index: 0, count: 2 }, resultSets)).toBe('Skipping the remaining rows of Result 1 (row limit reached)...')
  })

  it('numbers the tab by position, not by resultSetIndex', () => {
    const resultSets = [
      { resultSetIndex: 1, skippingRest: false },
      { resultSetIndex: 3, skippingRest: true }
    ]
    expect(executingLabel({ index: 3, count: 5 }, resultSets)).toBe('Skipping the remaining rows of Result 2 (row limit reached)...')
  })

  it('ignores a skipping result set of an earlier statement', () => {
    const resultSets = [{ resultSetIndex: 0, skippingRest: true }]
    expect(executingLabel({ index: 1, count: 3 }, resultSets)).toBe('Executing statement 2 of 3...')
  })
})

describe('rowLimitText', () => {
  it('is null when no result stopped at the limit', () => {
    expect(rowLimitText(2001, 3, 0)).toBeNull()
  })

  it('keeps the single-result text', () => {
    expect(rowLimitText(1000, 1, 1)).toBe('Showing first 1,000 rows (row limit reached). Sort and filter cover these rows only.')
  })

  it('sums up several results, two of them stopped', () => {
    expect(rowLimitText(200010, 4, 2)).toBe(
      '200,010 rows in 4 results. Row limit reached in 2 results; sort and filter cover the loaded rows only.'
    )
  })

  it('says "result" in the singular when one of several stopped', () => {
    expect(rowLimitText(1002, 3, 1)).toBe(
      '1,002 rows in 3 results. Row limit reached in 1 result; sort and filter cover the loaded rows only.'
    )
  })
})

describe('recordsAffectedText', () => {
  it('says "record" in the singular', () => {
    expect(recordsAffectedText(1)).toBe('1 record affected')
  })

  it('says "records" for zero and for many, with thousands separators', () => {
    expect(recordsAffectedText(0)).toBe('0 records affected')
    expect(recordsAffectedText(1234)).toBe('1,234 records affected')
  })
})

describe('activeResultTabId', () => {
  it('shows the first result when nothing was picked', () => {
    expect(activeResultTabId(['a', 'b'], null, false)).toBe('a')
  })

  it('keeps the picked result', () => {
    expect(activeResultTabId(['a', 'b'], 'b', false)).toBe('b')
  })

  it('falls back to the first result when the picked tab is gone', () => {
    expect(activeResultTabId(['a', 'b'], 'gone', false)).toBe('a')
  })

  it('opens the Error tab by itself when the picked tab is gone and the run failed', () => {
    expect(activeResultTabId(['a', 'b'], 'gone', true)).toBe('error')
  })

  it('keeps a result the user picked while an Error tab exists', () => {
    expect(activeResultTabId(['a', 'b'], 'a', true)).toBe('a')
  })

  it('keeps the Error tab when it was picked and still exists', () => {
    expect(activeResultTabId(['a'], 'error', true)).toBe('error')
  })

  it('falls back to the first result when the picked Error tab is gone', () => {
    expect(activeResultTabId(['a'], 'error', false)).toBe('a')
  })

  it('shows the Error tab when there are no results but an error, else nothing', () => {
    expect(activeResultTabId([], null, true)).toBe('error')
    expect(activeResultTabId([], null, false)).toBeNull()
  })
})

describe('parseRunError', () => {
  it('splits the statement number, count and line from the message', () => {
    expect(parseRunError('Statement 2 of 3 (line 2): 42P01: relation "x" does not exist')).toEqual({
      statement: { number: 2, count: 3, line: 2 },
      message: '42P01: relation "x" does not exist',
    })
  })

  it('keeps a message that spans several lines', () => {
    expect(parseRunError('Statement 1 of 2 (line 1): first\nsecond').message).toBe('first\nsecond')
  })

  it('leaves an error without a statement prefix as it is', () => {
    expect(parseRunError('42601: syntax error')).toEqual({ statement: null, message: '42601: syntax error' })
  })
})

describe('statementsAroundFailure', () => {
  it('names the statement before and the one after', () => {
    expect(statementsAroundFailure(2, 3)).toBe('Statement 1 ran. Statement 3 was not run.')
  })

  it('says only what was not run when the first statement failed', () => {
    expect(statementsAroundFailure(1, 3)).toBe('Statements 2 to 3 were not run.')
  })

  it('says only what ran when the last statement failed', () => {
    expect(statementsAroundFailure(3, 3)).toBe('Statements 1 to 2 ran.')
  })

  it('names ranges on both sides', () => {
    expect(statementsAroundFailure(4, 9)).toBe('Statements 1 to 3 ran. Statements 5 to 9 were not run.')
  })

  it('uses the singular for one statement left', () => {
    expect(statementsAroundFailure(1, 2)).toBe('Statement 2 was not run.')
  })
})
