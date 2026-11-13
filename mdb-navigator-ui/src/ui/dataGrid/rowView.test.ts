import { describe, expect, it } from 'vitest'
import { CellValue } from '../../models/databaseCommand/result/cellValue'
import { DbTypeCategory } from '../../models/databaseCommand/result/dbTypeCategory'
import { buildSearchText, buildView, compareValues, matchParts, nextSort, SortState } from './rowView'

const asc = (column: number): SortState => ({ column, direction: 'asc' })
const desc = (column: number): SortState => ({ column, direction: 'desc' })

// The values of one column in displayed order, for readable expectations.
function sortedColumn(values: CellValue[], category: DbTypeCategory, sort: SortState): CellValue[] {
  const rows = values.map(v => [v])
  const view = buildView(rows, [category], null, '', sort)
  return Array.from(view ?? [], i => values[i])
}

describe('nextSort', () => {
  it('goes off, ascending, descending, off on one column', () => {
    const first = nextSort(null, 2)
    expect(first).toEqual(asc(2))
    const second = nextSort(first, 2)
    expect(second).toEqual(desc(2))
    expect(nextSort(second, 2)).toBeNull()
  })

  it('starts another column ascending, whatever the current sort', () => {
    expect(nextSort(asc(1), 3)).toEqual(asc(3))
    expect(nextSort(desc(1), 3)).toEqual(asc(3))
  })
})

describe('buildView', () => {
  const categories: DbTypeCategory[] = ['Number', 'Text']
  const rows: CellValue[][] = [
    [1, 'Alpha'],
    [2, 'beta'],
    [3, 'Gamma'],
    [4, null],
  ]

  it('gives null when there is no filter and no sort', () => {
    expect(buildView(rows, categories, null, '', null)).toBeNull()
    expect(buildView(rows, categories, null, '   ', null)).toBeNull()
  })

  it('filters across columns, in any letter case', () => {
    expect(Array.from(buildView(rows, categories, null, 'ALPHA', null) ?? [])).toEqual([0])
    expect(Array.from(buildView(rows, categories, null, 'a', null) ?? [])).toEqual([0, 1, 2])
    expect(Array.from(buildView(rows, categories, null, '3', null) ?? [])).toEqual([2])
  })

  it('uses a prepared search text when given one, and builds it when not', () => {
    const prepared = buildSearchText(rows)
    expect(Array.from(buildView(rows, categories, prepared, 'beta', null) ?? [])).toEqual([1])
    expect(Array.from(buildView(rows, categories, null, 'beta', null) ?? [])).toEqual([1])
  })

  it('trims the filter', () => {
    expect(Array.from(buildView(rows, categories, null, '  beta ', null) ?? [])).toEqual([1])
  })

  it('does not match across two cells', () => {
    // Joined naively the first row would read "1alpha", so '1a' would match.
    expect(Array.from(buildView(rows, categories, null, '1a', null) ?? [])).toEqual([])
  })

  it('never matches NULL with the filter "null"', () => {
    expect(Array.from(buildView(rows, categories, null, 'null', null) ?? [])).toEqual([])
  })

  it('returns an empty view when nothing matches', () => {
    const view = buildView(rows, categories, null, 'zzz', null)
    expect(view).not.toBeNull()
    expect(view?.length).toBe(0)
  })

  it('sorts numbers ascending and descending', () => {
    expect(sortedColumn([10, 9, 100, -5, 0], 'Number', asc(0))).toEqual([-5, 0, 9, 10, 100])
    expect(sortedColumn([10, 9, 100, -5, 0], 'Number', desc(0))).toEqual([100, 10, 9, 0, -5])
  })

  it('sorts bigint strings beyond 2^53 exactly', () => {
    const values = ['9007199254740993', '9007199254740992', '9007199254740994', '-9007199254740993', '-9007199254740992']
    expect(sortedColumn(values, 'Number', asc(0))).toEqual([
      '-9007199254740993',
      '-9007199254740992',
      '9007199254740992',
      '9007199254740993',
      '9007199254740994',
    ])
    expect(sortedColumn(values, 'Number', desc(0))).toEqual([
      '9007199254740994',
      '9007199254740993',
      '9007199254740992',
      '-9007199254740992',
      '-9007199254740993',
    ])
  })

  it('sorts numeric strings by value, not as text', () => {
    expect(sortedColumn(['10.5', '9.75', '-3', '10.50', '2'], 'Number', asc(0))).toEqual(['-3', '2', '9.75', '10.5', '10.50'])
  })

  it('compares numeric strings with the same leading digits by their fractions', () => {
    expect(sortedColumn(['12345678901234567.5', '12345678901234567.25', '12345678901234567.50'], 'Number', asc(0))).toEqual([
      '12345678901234567.25',
      '12345678901234567.5',
      '12345678901234567.50',
    ])
  })

  it('puts NaN last and Infinity after every number', () => {
    const values = ['NaN', 'Infinity', '5', '-Infinity', '-2']
    expect(sortedColumn(values, 'Number', asc(0))).toEqual(['-Infinity', '-2', '5', 'Infinity', 'NaN'])
  })

  it('puts NULLs last in both directions', () => {
    const values: CellValue[] = [3, null, 1, null, 2]
    expect(sortedColumn(values, 'Number', asc(0))).toEqual([1, 2, 3, null, null])
    expect(sortedColumn(values, 'Number', desc(0))).toEqual([3, 2, 1, null, null])
  })

  it('keeps equal values in their original order, in both directions', () => {
    const rowsWithTies: CellValue[][] = [['b', 1], ['a', 2], ['b', 3], ['a', 4]]
    const ascending = buildView(rowsWithTies, ['Text', 'Number'], null, '', asc(0))
    const descending = buildView(rowsWithTies, ['Text', 'Number'], null, '', desc(0))
    expect(Array.from(ascending ?? [])).toEqual([1, 3, 0, 2])
    expect(Array.from(descending ?? [])).toEqual([0, 2, 1, 3])
  })

  it('sorts text without putting every upper-case word before the lower-case ones', () => {
    expect(sortedColumn(['cherry', 'Banana', 'apple'], 'Text', asc(0))).toEqual(['apple', 'Banana', 'cherry'])
  })

  it('sorts booleans with false first', () => {
    expect(sortedColumn([true, false, true, false], 'Boolean', asc(0))).toEqual([false, false, true, true])
    expect(sortedColumn([true, false, true, false], 'Boolean', desc(0))).toEqual([true, true, false, false])
  })

  it('sorts ISO timestamps in time order', () => {
    const values = ['2026-11-13T09:00:00.000Z', '2025-01-01T23:59:59.000Z', '2026-11-13T08:59:59.000Z']
    expect(sortedColumn(values, 'DateTime', asc(0))).toEqual([
      '2025-01-01T23:59:59.000Z',
      '2026-11-13T08:59:59.000Z',
      '2026-11-13T09:00:00.000Z',
    ])
  })

  it('filters and sorts together, as indexes into the original rows', () => {
    const data: CellValue[][] = [['x1', 3], ['y', 1], ['x2', 1], ['x3', 2]]
    const view = buildView(data, ['Text', 'Number'], null, 'X', asc(1))
    expect(Array.from(view ?? [])).toEqual([2, 3, 0])
  })

  it('treats a missing cell like NULL', () => {
    const ragged: CellValue[][] = [[1, 'a'], [2], [0, 'c']]
    expect(Array.from(buildView(ragged, ['Number', 'Text'], null, '', asc(1)) ?? [])).toEqual([0, 2, 1])
  })
})

describe('compareValues', () => {
  it('compares other categories by their text', () => {
    expect(compareValues('a', 'b', 'Other')).toBeLessThan(0)
    expect(compareValues('b', 'a', 'Other')).toBeGreaterThan(0)
    expect(compareValues('a', 'a', 'Other')).toBe(0)
  })

  it('compares numbers that arrive as JSON numbers', () => {
    expect(compareValues(2, 10, 'Number')).toBeLessThan(0)
    expect(compareValues(2, 2, 'Number')).toBe(0)
  })
})

describe('matchParts', () => {
  it('gives one unmarked part when there is no match', () => {
    expect(matchParts('hello', 'xyz')).toEqual([{ text: 'hello', match: false }])
  })

  it('gives one part for an empty needle', () => {
    expect(matchParts('hello', '')).toEqual([{ text: 'hello', match: false }])
  })

  it('splits around one match', () => {
    expect(matchParts('hello world', 'o w')).toEqual([
      { text: 'hell', match: false },
      { text: 'o w', match: true },
      { text: 'orld', match: false },
    ])
  })

  it('finds two matches', () => {
    expect(matchParts('abcabc', 'b')).toEqual([
      { text: 'a', match: false },
      { text: 'b', match: true },
      { text: 'ca', match: false },
      { text: 'b', match: true },
      { text: 'c', match: false },
    ])
  })

  it('has no empty parts when the match is at each end', () => {
    expect(matchParts('abab', 'ab')).toEqual([
      { text: 'ab', match: true },
      { text: 'ab', match: true },
    ])
    expect(matchParts('xay', 'x')).toEqual([
      { text: 'x', match: true },
      { text: 'ay', match: false },
    ])
    expect(matchParts('xay', 'y')).toEqual([
      { text: 'xa', match: false },
      { text: 'y', match: true },
    ])
  })

  it('matches in any letter case and keeps the text as written', () => {
    expect(matchParts('Hello HELLO', 'hello')).toEqual([
      { text: 'Hello', match: true },
      { text: ' ', match: false },
      { text: 'HELLO', match: true },
    ])
    expect(matchParts('Hello', 'HELL')).toEqual([
      { text: 'Hell', match: true },
      { text: 'o', match: false },
    ])
  })
})
