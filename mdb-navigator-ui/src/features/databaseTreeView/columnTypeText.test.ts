import { describe, expect, it } from 'vitest'
import { fullTypeName, shortTypeName } from './columnTypeText'

describe('shortTypeName', () => {
  it.each([
    ['character varying', 'varchar'],
    ['character', 'char'],
    ['timestamp without time zone', 'timestamp'],
    ['timestamp with time zone', 'timestamptz'],
    ['time without time zone', 'time'],
    ['time with time zone', 'timetz'],
  ])('shortens "%s" to "%s"', (dataType, expected) => {
    expect(shortTypeName(dataType)).toBe(expected)
  })

  it('adds the length after the short name', () => {
    expect(shortTypeName('CHARACTER VARYING', 50)).toBe('varchar(50)')
    expect(shortTypeName('character', 1)).toBe('char(1)')
  })

  it('only lower-cases names it does not know', () => {
    expect(shortTypeName('INTEGER')).toBe('integer')
    expect(shortTypeName('USER-DEFINED')).toBe('user-defined')
    expect(shortTypeName('double precision')).toBe('double precision')
  })

  it('adds nothing for a missing or zero length', () => {
    expect(shortTypeName('integer', undefined)).toBe('integer')
    expect(shortTypeName('integer', 0)).toBe('integer')
  })
})

describe('fullTypeName', () => {
  it('keeps the long name and adds the length', () => {
    expect(fullTypeName('character varying', 50)).toBe('character varying(50)')
  })

  it('lower-cases and adds nothing for a zero length', () => {
    expect(fullTypeName('TIMESTAMP WITHOUT TIME ZONE', 0)).toBe('timestamp without time zone')
  })
})
