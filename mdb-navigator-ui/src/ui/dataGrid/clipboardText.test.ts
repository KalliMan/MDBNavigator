import { describe, expect, it } from 'vitest'
import { CellValue } from '../../models/databaseCommand/result/cellValue'
import { selectionToText } from './clipboardText'

const names = ['id', 'name', 'meta']
const rows: CellValue[][] = [
  [1, 'a', '{"a":1}'],
  [2, null, true],
  [3, 'c', [1, 2]],
]
const getRow = (index: number) => rows[index]
const range = (top: number, bottom: number, left: number, right: number) => ({ top, bottom, left, right })

describe('selectionToText', () => {
  describe('one cell', () => {
    it('is the exact value, a JSON string unchanged', () => {
      expect(selectionToText(range(0, 0, 2, 2), names, getRow, false)).toBe('{"a":1}')
    })

    it('is the empty string for NULL', () => {
      expect(selectionToText(range(1, 1, 1, 1), names, getRow, false)).toBe('')
    })

    it('is not quoted even when it holds a tab or a quote', () => {
      const special = [['a\tb'], ['"x"']]
      expect(selectionToText(range(0, 0, 0, 0), ['c'], i => special[i], false)).toBe('a\tb')
      expect(selectionToText(range(1, 1, 0, 0), ['c'], i => special[i], false)).toBe('"x"')
    })
  })

  describe('several cells', () => {
    it('joins a 2x2 range with tabs and line breaks', () => {
      expect(selectionToText(range(0, 1, 0, 1), names, getRow, false)).toBe('1\ta\n2\t')
    })

    it('writes booleans and arrays as text', () => {
      expect(selectionToText(range(1, 2, 2, 2), names, getRow, false)).toBe('true\n[1,2]')
    })

    it('adds a header line with the names of the selected columns only', () => {
      expect(selectionToText(range(0, 1, 1, 2), names, getRow, true)).toBe('name\tmeta\na\t{"a":1}\n\ttrue')
    })

    it('adds the header line to a single cell too', () => {
      expect(selectionToText(range(0, 0, 1, 1), names, getRow, true)).toBe('name\na')
    })

    it('quotes a field with a tab and doubles its quotes', () => {
      const data: CellValue[][] = [['a\tb', 'x'], ['say "hi"\tnow', 'y']]
      expect(selectionToText(range(0, 1, 0, 1), ['p', 'q'], i => data[i], false))
        .toBe('"a\tb"\tx\n"say ""hi""\tnow"\ty')
    })

    it('quotes a field with a line break', () => {
      const data: CellValue[][] = [['line1\nline2', 'x'], ['r\r\ns', 'y']]
      expect(selectionToText(range(0, 1, 0, 1), ['p', 'q'], i => data[i], false))
        .toBe('"line1\nline2"\tx\n"r\r\ns"\ty')
    })

    it('quotes a field that starts with a quote', () => {
      const data: CellValue[][] = [['"quoted" text', 'x']]
      expect(selectionToText(range(0, 0, 0, 1), ['p', 'q'], i => data[i], false)).toBe('"""quoted"" text"\tx')
    })

    it('quotes a header name the same way', () => {
      expect(selectionToText(range(0, 0, 0, 1), ['a\tb', 'c'], () => [1, 2], true)).toBe('"a\tb"\tc\n1\t2')
    })

    it('keeps JSON object text unquoted', () => {
      const data: CellValue[][] = [['{"a":1}', 'x'], ['{"b":"c"}', 'y']]
      expect(selectionToText(range(0, 1, 0, 1), ['p', 'q'], i => data[i], false)).toBe('{"a":1}\tx\n{"b":"c"}\ty')
    })

    it('gives empty fields for a row shorter than the range', () => {
      const data: CellValue[][] = [[1], [2, 'b', 'c']]
      expect(selectionToText(range(0, 1, 0, 2), names, i => data[i], false)).toBe('1\t\t\n2\tb\tc')
    })
  })
})
