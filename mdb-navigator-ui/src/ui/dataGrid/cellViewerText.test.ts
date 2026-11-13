import { describe, expect, it } from 'vitest'
import { prettyJsonText, viewerText } from './cellViewerText'

describe('prettyJsonText', () => {
  it('indents a nested object with an array', () => {
    expect(prettyJsonText('{"a":1,"b":[1,2,{"c":"x"}],"d":{"e":true,"f":null}}')).toBe(
      [
        '{',
        '  "a": 1,',
        '  "b": [',
        '    1,',
        '    2,',
        '    {',
        '      "c": "x"',
        '    }',
        '  ],',
        '  "d": {',
        '    "e": true,',
        '    "f": null',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('keeps an empty object and an empty array on one line', () => {
    expect(prettyJsonText('{}')).toBe('{}')
    expect(prettyJsonText('[]')).toBe('[]')
    expect(prettyJsonText('{"a":{},"b":[ ]}')).toBe('{\n  "a": {},\n  "b": []\n}')
  })

  it('leaves the inside of a string untouched', () => {
    const json = '{"s":"{ a, b: c } \\" , :"}'
    expect(prettyJsonText(json)).toBe('{\n  "s": "{ a, b: c } \\" , :"\n}')
  })

  it('does not end a string at an escaped backslash followed by a quote', () => {
    // The string is  a\\  (an escaped backslash); the quote after it really ends the string.
    expect(prettyJsonText('{"s":"a\\\\","t":1}')).toBe('{\n  "s": "a\\\\",\n  "t": 1\n}')
  })

  it('keeps every digit of a number', () => {
    expect(prettyJsonText('[12345678901234567890,1.10]')).toBe('[\n  12345678901234567890,\n  1.10\n]')
  })

  it('gives the same output for indented and compact input', () => {
    const compact = '{"a":[1,2],"b":{"c":"d"}}'
    const indented = '{\n    "a" : [ 1 ,\n 2 ],\n\t"b" : {\n "c" : "d" }\n}'
    expect(prettyJsonText(indented)).toBe(prettyJsonText(compact))
  })
})

describe('viewerText', () => {
  it('is empty for NULL and a missing value', () => {
    expect(viewerText(null, 'Json')).toEqual({ text: '', formatted: false })
    expect(viewerText(undefined, 'Text')).toEqual({ text: '', formatted: false })
  })

  it('formats a Json string', () => {
    expect(viewerText('{"a":12345678901234567890}', 'Json')).toEqual({
      text: '{\n  "a": 12345678901234567890\n}',
      formatted: true,
    })
  })

  it('shows a Json string that is not valid JSON as it is', () => {
    expect(viewerText('{not json', 'Json')).toEqual({ text: '{not json', formatted: false })
  })

  it('shows a Text string that looks like JSON as it is, because only the category decides', () => {
    expect(viewerText('{"a":1}', 'Text')).toEqual({ text: '{"a":1}', formatted: false })
  })

  it('formats an array value with JSON.stringify', () => {
    expect(viewerText([1, [2, 3]], 'Other')).toEqual({
      text: JSON.stringify([1, [2, 3]], null, 2),
      formatted: true,
    })
  })

  it('formats an object value (hstore)', () => {
    expect(viewerText({ k: 'v' }, 'Other')).toEqual({ text: '{\n  "k": "v"\n}', formatted: true })
  })

  it('shows a number as its text', () => {
    expect(viewerText(42, 'Number')).toEqual({ text: '42', formatted: false })
  })
})
