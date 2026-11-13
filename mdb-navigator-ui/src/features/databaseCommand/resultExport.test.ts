import { describe, expect, it } from 'vitest'
import { CellValue } from '../../models/databaseCommand/result/cellValue'
import { exportFileName, ExportColumn, jsonKeys, toCsv, toJson } from './resultExport'

describe('toCsv', () => {
  it('writes a header line and one line per row, joined by CRLF with none at the end', () => {
    const rows: CellValue[][] = [[1, 'a', true], [2, 'b', false]]
    expect(toCsv(['id', 'name', 'ok'], rows, null)).toBe('id,name,ok\r\n1,a,true\r\n2,b,false')
  })

  it('writes NULL as an empty field and an empty string as ""', () => {
    expect(toCsv(['a', 'b', 'c'], [[null, '', 'x']], null)).toBe('a,b,c\r\n,"",x')
  })

  it('gives a missing cell an empty field', () => {
    expect(toCsv(['a', 'b'], [[1]], null)).toBe('a,b\r\n1,')
  })

  it('quotes a field with a comma, a quote or a line break, and doubles its quotes', () => {
    const rows: CellValue[][] = [['a,b', 'say "hi"', 'two\nlines', 'one\r\nmore']]
    expect(toCsv(['c', 'q', 'l', 'm'], rows, null))
      .toBe('c,q,l,m\r\n"a,b","say ""hi""","two\nlines","one\r\nmore"')
  })

  it('quotes a header name the same way', () => {
    expect(toCsv(['a,b', 'say "x"'], [], null)).toBe('"a,b","say ""x"""')
  })

  it('writes the rows of a view in its order and leaves the others out', () => {
    const rows: CellValue[][] = [[10], [20], [30], [40]]
    expect(toCsv(['n'], rows, Int32Array.of(2, 0))).toBe('n\r\n30\r\n10')
  })

  it('writes only the header line when there are no rows', () => {
    expect(toCsv(['a', 'b'], [], null)).toBe('a,b')
    expect(toCsv(['a'], [[1]], new Int32Array(0))).toBe('a')
  })

  it('writes arrays and objects as JSON text', () => {
    expect(toCsv(['a'], [[[1, 2]]], null)).toBe('a\r\n"[1,2]"')
  })
})

describe('toJson', () => {
  const column = (name: string, category: ExportColumn['category']): ExportColumn => ({ name, category })

  it('writes numbers, booleans and NULL as JSON values, one row per line', () => {
    const columns = [column('n', 'Number'), column('f', 'Boolean'), column('x', 'Text')]
    expect(toJson(columns, [[1, true, null], [2.5, false, 'a"b']], null))
      .toBe('[\n  {"n": 1, "f": true, "x": null},\n  {"n": 2.5, "f": false, "x": "a\\"b"}\n]')
  })

  it('keeps a bigint as the string the server sent', () => {
    const json = toJson([column('big', 'Number')], [['9007199254740993']], null)
    expect(json).toBe('[\n  {"big": "9007199254740993"}\n]')
    const parsed: unknown = JSON.parse(json)
    expect(parsed).toEqual([{ big: '9007199254740993' }])
  })

  it('embeds a Json column as JSON, with every digit of a large number', () => {
    const columns = [column('id', 'Number'), column('doc', 'Json')]
    const json = toJson(columns, [[1, ' {"a": 12345678901234567890} ']], null)
    expect(json).toBe('[\n  {"id": 1, "doc": {"a": 12345678901234567890}}\n]')
    // The output parses as JSON, and the rest of the document is intact (the number itself rounds when parsed).
    const parsed: unknown = JSON.parse(json)
    expect(parsed).toHaveLength(1)
  })

  it('writes a Json column that holds invalid JSON as a string', () => {
    const json = toJson([column('doc', 'Json')], [['{not json']], null)
    expect(json).toBe('[\n  {"doc": "{not json"}\n]')
    const parsed: unknown = JSON.parse(json)
    expect(parsed).toEqual([{ doc: '{not json' }])
  })

  it('writes JSON-looking text in a Text column as a string', () => {
    const json = toJson([column('t', 'Text')], [['{"a": 1}']], null)
    expect(json).toBe('[\n  {"t": "{\\"a\\": 1}"}\n]')
  })

  it('writes an array value as a JSON array', () => {
    const json = toJson([column('tags', 'Other')], [[['a', 'b']]], null)
    expect(json).toBe('[\n  {"tags": ["a","b"]}\n]')
  })

  it('names a repeated column _2, _3', () => {
    const json = toJson([column('id', 'Number'), column('id', 'Number')], [[1, 2]], null)
    expect(json).toBe('[\n  {"id": 1, "id_2": 2}\n]')
  })

  it('writes the rows of a view in its order and leaves the others out', () => {
    const rows: CellValue[][] = [[10], [20], [30]]
    expect(toJson([column('n', 'Number')], rows, Int32Array.of(2, 1)))
      .toBe('[\n  {"n": 30},\n  {"n": 20}\n]')
  })

  it('writes [] when there are no rows', () => {
    expect(toJson([column('n', 'Number')], [], null)).toBe('[]')
    expect(toJson([column('n', 'Number')], [[1]], new Int32Array(0))).toBe('[]')
  })
})

describe('jsonKeys', () => {
  it('gives every column a different key', () => {
    const keys = jsonKeys(['id', 'id', 'name', 'id', 'id_2'])
    expect(new Set(keys).size).toBe(5)
    expect(keys.slice(0, 3)).toEqual(['id', 'id_2', 'name'])
  })

  it('leaves unique names alone', () => {
    expect(jsonKeys(['a', 'b'])).toEqual(['a', 'b'])
  })
})

describe('exportFileName', () => {
  const at = new Date(2026, 10, 13, 9, 5, 7)

  it('writes the database, the result number and the local time', () => {
    expect(exportFileName('my db/1', 2, at, 'csv')).toBe('my_db_1_result2_20261113_090507.csv')
  })

  it('uses the format as the extension', () => {
    expect(exportFileName('postgres', 1, at, 'json')).toBe('postgres_result1_20261113_090507.json')
  })

  it('falls back to "query" when no database name is left', () => {
    expect(exportFileName('', 1, at, 'csv')).toBe('query_result1_20261113_090507.csv')
  })
})
