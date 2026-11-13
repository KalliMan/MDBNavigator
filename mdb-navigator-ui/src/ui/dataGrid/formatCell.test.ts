import { describe, expect, it } from 'vitest'
import { cellToText, formatCell } from './formatCell'

describe('cellToText', () => {
  it('gives the empty string for NULL and for a missing cell', () => {
    expect(cellToText(null)).toBe('')
    expect(cellToText(undefined)).toBe('')
  })

  it('writes booleans as true and false', () => {
    expect(cellToText(true)).toBe('true')
    expect(cellToText(false)).toBe('false')
  })

  it('returns a string as it is', () => {
    expect(cellToText('a\tb')).toBe('a\tb')
    expect(cellToText('')).toBe('')
  })

  it('writes numbers with toString', () => {
    expect(cellToText(42)).toBe('42')
    expect(cellToText(-1.5)).toBe('-1.5')
    expect(cellToText(0)).toBe('0')
  })

  it('writes arrays as JSON, including nested ones', () => {
    expect(cellToText([1, 2, 3])).toBe('[1,2,3]')
    expect(cellToText([[1, null], ['a', true]])).toBe('[[1,null],["a",true]]')
  })

  it('writes an hstore object as JSON', () => {
    expect(cellToText({ a: '1', b: null })).toBe('{"a":"1","b":null}')
  })

  it('never cuts long text', () => {
    expect(cellToText('x'.repeat(5000))).toHaveLength(5000)
  })
})

describe('formatCell', () => {
  it('shows NULL for null and flags it', () => {
    expect(formatCell(null)).toEqual({ text: 'NULL', isNull: true })
  })

  it('shows NULL for a missing cell', () => {
    expect(formatCell(undefined)).toEqual({ text: 'NULL', isNull: true })
  })

  it('cuts a 1,001-character string to 1,000 characters plus an ellipsis', () => {
    const cell = formatCell('a'.repeat(1001))
    expect(cell.isNull).toBe(false)
    expect(cell.text).toBe('a'.repeat(1000) + '…')
  })

  it('does not cut a 1,000-character string', () => {
    expect(formatCell('a'.repeat(1000)).text).toBe('a'.repeat(1000))
  })

  it('formats the other kinds like cellToText', () => {
    expect(formatCell(true).text).toBe('true')
    expect(formatCell(12).text).toBe('12')
    expect(formatCell([1, 2]).text).toBe('[1,2]')
  })
})
