import { RunSource } from '../../models/databaseCommand/query/runSource';

// The failing line is shown whole up to this many characters; a longer one is cut around the error.
export const EXCERPT_MAX = 120;
// How much of a cut line is kept in front of the error.
export const EXCERPT_LEAD = 40;

// Indexes into the run's text; end is exclusive.
export interface ErrorSpan { start: number; end: number }

export interface ErrorExcerpt { before: string; marked: string; after: string }

export interface ErrorLocation {
  // In the editor, 1-based, as Monaco counts (a column is one UTF-16 unit).
  line: number;
  column: number;
  // What to mark, in the run's text.
  span: ErrorSpan;
  // The line the error is on, for the Error tab.
  excerpt: ErrorExcerpt;
}

// The same set the server's script splitter calls a word (letters, digits, _, $ and everything from U+0080 up).
// It covers both halves of an emoji, so a surrogate pair is never cut.
const WORD_CHAR = /[A-Za-z0-9_$\u0080-\uFFFF]/
const WHITE_SPACE = /\s/

function isWordChar(c: string): boolean {
  return WORD_CHAR.test(c)
}

function clampOffset(text: string, offset: number): number {
  return Math.min(Math.max(offset, 0), text.length)
}

// 1-based line and column of an offset. \n starts a new line; so does a \r that is not followed by \n, so \r\n
// counts once, at its \n (the same lines Monaco counts).
export function offsetToPosition(text: string, offset: number): { line: number; column: number } {
  const o = clampOffset(text, offset)
  let line = 1
  let lineStart = 0
  for (let i = 0; i < o; i++) {
    const c = text[i]
    if (c === '\n' || (c === '\r' && text[i + 1] !== '\n')) {
      line++
      lineStart = i + 1
    }
  }
  return { line, column: o - lineStart + 1 }
}

// What to mark for the place the database reported: the word there (a dotted name whole), a quoted name or string
// up to its closing quote, otherwise one character. "Syntax error at end of input" points after the text (or at
// white space), so the last word before it is marked instead.
export function errorSpan(text: string, offset: number): ErrorSpan {
  const o = clampOffset(text, offset)

  if (o < text.length && !WHITE_SPACE.test(text[o])) {
    const first = text[o]

    if (isWordChar(first)) {
      // A "." continues the name when a word character follows it (schema.table).
      let end = o + 1
      while (end < text.length) {
        if (isWordChar(text[end])) {
          end++
        } else if (text[end] === '.' && end + 1 < text.length && isWordChar(text[end + 1])) {
          end += 2
        } else {
          break
        }
      }
      return { start: o, end }
    }

    if (first === '"' || first === "'") {
      // The same quote twice in a row is inside the quoted text. An unclosed quote stops at the end of its line.
      let end = o + 1
      while (end < text.length) {
        const c = text[end]
        if (c === '\n' || c === '\r') {
          break
        }
        if (c === first) {
          if (text[end + 1] === first) {
            end += 2
            continue
          }
          end++
          break
        }
        end++
      }
      return { start: o, end }
    }

    return { start: o, end: o + 1 }
  }

  // White space or the end of the text: the last thing before it.
  let p = o - 1
  while (p >= 0 && WHITE_SPACE.test(text[p])) {
    p--
  }
  if (p < 0) {
    return { start: o, end: o }
  }
  if (isWordChar(text[p])) {
    let start = p
    while (start > 0 && isWordChar(text[start - 1])) {
      start--
    }
    return { start, end: p + 1 }
  }
  return { start: p, end: p + 1 }
}

// The line the span is on, cut to about EXCERPT_MAX characters around the span when it is longer (a one-line INSERT
// can be megabytes), split into what comes before the mark, the mark, and what comes after it.
export function errorExcerpt(text: string, span: ErrorSpan): ErrorExcerpt {
  const isBreak = (c: string) => c === '\n' || c === '\r'

  let lineStart = span.start
  while (lineStart > 0 && !isBreak(text[lineStart - 1])) {
    lineStart--
  }
  let lineEnd = span.start
  while (lineEnd < text.length && !isBreak(text[lineEnd])) {
    lineEnd++
  }

  let from = lineStart
  let to = lineEnd
  if (lineEnd - lineStart > EXCERPT_MAX) {
    from = Math.max(lineStart, span.start - EXCERPT_LEAD)
    to = Math.min(lineEnd, from + EXCERPT_MAX)
    if (to - from < EXCERPT_MAX) {
      from = Math.max(lineStart, to - EXCERPT_MAX)
    }
  }
  const markEnd = Math.min(span.end, to)

  // A tab is one space here, so the line reads the same in the Error tab's monospace text.
  const plain = (s: string) => s.replace(/\t/g, ' ')
  return {
    before: (from > lineStart ? '…' : '') + plain(text.slice(from, span.start)),
    marked: plain(text.slice(span.start, markEnd)),
    after: plain(text.slice(markEnd, to)) + (to < lineEnd ? '…' : ''),
  }
}

// Where the database's place is in the editor, and what to show of it.
export function locateError(source: RunSource, offset: number): ErrorLocation {
  const p = offsetToPosition(source.text, offset)
  const span = errorSpan(source.text, offset)
  return {
    line: source.line + p.line - 1,
    // The first line of a selection starts in the middle of an editor line; later lines start at column 1.
    column: p.line === 1 ? source.column + p.column - 1 : p.column,
    span,
    excerpt: errorExcerpt(source.text, span),
  }
}

// For a Monaco hover, which reads its text as Markdown.
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!|<>~]/g, '\\$&')
}
