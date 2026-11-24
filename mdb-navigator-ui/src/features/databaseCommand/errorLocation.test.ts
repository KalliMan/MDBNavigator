import { describe, expect, it } from 'vitest'
import { EXCERPT_MAX, errorExcerpt, errorSpan, escapeMarkdown, locateError, offsetToPosition } from './errorLocation'

describe('offsetToPosition', () => {
  it.each([
    ['select 1', 0, 1, 1],
    ['select 1', 7, 1, 8],
    ['a\nbc', 1, 1, 2],
    ['a\nbc', 2, 2, 1],
    ['a\nbc', 4, 2, 3],
    ['a\r\nbc', 3, 2, 1],
    ['a\rb', 2, 2, 1],
    ['ab', 99, 1, 3],
    ['ab', -5, 1, 1],
  ])('%j at %i is line %i, column %i', (text, offset, line, column) => {
    expect(offsetToPosition(text, offset)).toEqual({ line, column })
  })
})

describe('errorSpan', () => {
  it.each([
    ['a word', 'select * from no_such_table where x', 14, 14, 27],
    ['a dotted name, whole', 'select * from pg_temp.zz', 14, 14, 24],
    ['a string, with its quotes', "select 'abc'::int", 7, 7, 12],
    ['a quoted name, with its quotes', 'select "No Such" from t', 7, 7, 16],
    ['a doubled quote inside the name', 'select "a""b" from t', 7, 7, 13],
    ['a string that is never closed', "select 'abc", 7, 7, 11],
    ['an unclosed string, up to the line break', "select 'ab\ncd'", 7, 7, 10],
    ['one character', 'where relname = 5', 14, 14, 15],
    ['the last word, at the end of the text', 'select * from', 13, 9, 13],
    ['the last word, before white space', 'select * from\n;', 13, 9, 13],
    ['one character, when it is not white space', 'select * from;', 13, 13, 14],
    ['the last character, when it is not a word', 'select (', 8, 7, 8],
    ['an emoji as part of a word', 'select 😀x', 7, 7, 10],
    ['nothing, in an empty text', '', 0, 0, 0],
    ['nothing, in white space only', '   ', 3, 3, 3],
  ])('marks %s', (_what, text, offset, start, end) => {
    expect(errorSpan(text, offset)).toEqual({ start, end })
  })
})

describe('errorExcerpt', () => {
  it('shows a short line whole, up to its end', () => {
    expect(errorExcerpt('select 1;\nselect * from nope', { start: 24, end: 28 }))
      .toEqual({ before: 'select * from ', marked: 'nope', after: '' })
  })

  it('keeps the text after the mark', () => {
    expect(errorExcerpt('select nope from t', { start: 7, end: 11 }))
      .toEqual({ before: 'select ', marked: 'nope', after: ' from t' })
  })

  it('cuts a long line around the mark', () => {
    const text = 'x'.repeat(300)
    const excerpt = errorExcerpt(text, { start: 200, end: 204 })

    expect(excerpt.before.startsWith('…')).toBe(true)
    expect(excerpt.before).toHaveLength(41)
    expect(excerpt.after.endsWith('…')).toBe(true)
    expect(excerpt.before.length + excerpt.marked.length + excerpt.after.length).toBe(EXCERPT_MAX + 2)
  })

  it('cuts only the end of a long line when the mark is near its start', () => {
    const excerpt = errorExcerpt('x'.repeat(300), { start: 2, end: 6 })

    expect(excerpt.before).toBe('xx')
    expect(excerpt.after.endsWith('…')).toBe(true)
    expect(excerpt.before.includes('…')).toBe(false)
  })

  it('keeps a full window when the mark is near the end of a long line', () => {
    const excerpt = errorExcerpt('x'.repeat(300), { start: 296, end: 300 })

    expect(excerpt.before.startsWith('…')).toBe(true)
    expect(excerpt.after).toBe('')
    expect(excerpt.before.length - 1 + excerpt.marked.length).toBe(EXCERPT_MAX)
  })

  it('has nothing marked for an empty span', () => {
    expect(errorExcerpt('select ', { start: 7, end: 7 }).marked).toBe('')
  })

  it('shows a tab as a space', () => {
    expect(errorExcerpt('\tselect nope', { start: 8, end: 12 }).before).toBe(' select ')
  })
})

describe('locateError', () => {
  it('gives the editor line and column in a script that starts at the top', () => {
    const location = locateError({ text: 'select 1;\nselect * from nope', line: 1, column: 1 }, 24)

    expect(location.line).toBe(2)
    expect(location.column).toBe(15)
    expect(location.span).toEqual({ start: 24, end: 28 })
  })

  it('adds the selection start to the column on its first line', () => {
    const location = locateError({ text: 'select nope', line: 10, column: 5 }, 7)

    expect(location.line).toBe(10)
    expect(location.column).toBe(12)
  })

  it('does not add it on the lines after', () => {
    const location = locateError({ text: 'select\n  nope', line: 10, column: 5 }, 9)

    expect(location.line).toBe(11)
    expect(location.column).toBe(3)
  })
})

describe('escapeMarkdown', () => {
  it.each([
    ['a_b', 'a\\_b'],
    ['*x*', '\\*x\\*'],
    ['plain', 'plain'],
  ])('%j becomes %j', (text, escaped) => {
    expect(escapeMarkdown(text)).toBe(escaped)
  })
})
