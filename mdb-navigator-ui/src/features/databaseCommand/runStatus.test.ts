import { describe, expect, it } from 'vitest'
import { executingLabel, rowLimitText } from './runStatus'

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
