import { describe, expect, it } from 'vitest'
import {
  extendTo,
  GridSelection,
  isInRange,
  isMoveKey,
  MoveKey,
  moveSelection,
  rangeOf,
  selectAll,
  selectCell,
  selectColumns,
  selectRows,
  sizeOf,
} from './selection'

const at = (row: number, column: number) => ({ row, column })
const cell = (row: number, column: number): GridSelection => selectCell(at(row, column))
const none = { extend: false, jump: false }

describe('rangeOf and sizeOf', () => {
  it('orders the corners when the focus is above and left of the anchor', () => {
    const selection: GridSelection = { anchor: at(5, 4), focus: at(2, 1) }
    expect(rangeOf(selection)).toEqual({ top: 2, bottom: 5, left: 1, right: 4 })
  })

  it('keeps the order when the focus is below and right of the anchor', () => {
    const selection: GridSelection = { anchor: at(2, 1), focus: at(5, 4) }
    expect(rangeOf(selection)).toEqual({ top: 2, bottom: 5, left: 1, right: 4 })
  })

  it('counts both corners in the size', () => {
    expect(sizeOf({ anchor: at(5, 4), focus: at(2, 1) })).toEqual({ rows: 4, columns: 4 })
    expect(sizeOf(cell(3, 3))).toEqual({ rows: 1, columns: 1 })
  })
})

describe('isInRange', () => {
  const range = { top: 2, bottom: 4, left: 1, right: 3 }

  it('includes every edge', () => {
    expect(isInRange(range, 2, 1)).toBe(true)
    expect(isInRange(range, 4, 3)).toBe(true)
    expect(isInRange(range, 2, 3)).toBe(true)
    expect(isInRange(range, 4, 1)).toBe(true)
  })

  it('excludes cells just outside', () => {
    expect(isInRange(range, 1, 2)).toBe(false)
    expect(isInRange(range, 5, 2)).toBe(false)
    expect(isInRange(range, 3, 0)).toBe(false)
    expect(isInRange(range, 3, 4)).toBe(false)
  })
})

describe('building selections', () => {
  it('selectCell puts both corners on the cell', () => {
    expect(selectCell(at(2, 3))).toEqual({ anchor: at(2, 3), focus: at(2, 3) })
  })

  it('extendTo keeps the anchor and moves the focus', () => {
    const next = extendTo({ anchor: at(1, 1), focus: at(2, 2) }, at(7, 0))
    expect(next).toEqual({ anchor: at(1, 1), focus: at(7, 0) })
  })

  it('selectRows spans every column', () => {
    expect(selectRows(2, 4, 5)).toEqual({ anchor: at(2, 0), focus: at(4, 4) })
  })

  it('selectRows can go upwards', () => {
    expect(rangeOf(selectRows(4, 2, 5))).toEqual({ top: 2, bottom: 4, left: 0, right: 4 })
  })

  it('selectColumns spans every row', () => {
    expect(selectColumns(1, 3, 10)).toEqual({ anchor: at(0, 1), focus: at(9, 3) })
  })

  it('selectAll spans the whole grid', () => {
    expect(selectAll(10, 4)).toEqual({ anchor: at(0, 0), focus: at(9, 3) })
  })
})

describe('isMoveKey', () => {
  it('accepts the navigation keys only', () => {
    expect(isMoveKey('ArrowUp')).toBe(true)
    expect(isMoveKey('PageDown')).toBe(true)
    expect(isMoveKey('Home')).toBe(true)
    expect(isMoveKey('a')).toBe(false)
    expect(isMoveKey('Enter')).toBe(false)
  })
})

describe('moveSelection', () => {
  // A grid of 10 rows and 5 columns, a page of 4 rows.
  const move = (selection: GridSelection, key: MoveKey, modifiers = none) =>
    moveSelection(selection, key, modifiers, 10, 5, 4)

  it('moves one step with each arrow', () => {
    expect(move(cell(5, 2), 'ArrowUp')).toEqual(cell(4, 2))
    expect(move(cell(5, 2), 'ArrowDown')).toEqual(cell(6, 2))
    expect(move(cell(5, 2), 'ArrowLeft')).toEqual(cell(5, 1))
    expect(move(cell(5, 2), 'ArrowRight')).toEqual(cell(5, 3))
  })

  it('stays inside the grid at all four edges', () => {
    expect(move(cell(0, 2), 'ArrowUp')).toEqual(cell(0, 2))
    expect(move(cell(9, 2), 'ArrowDown')).toEqual(cell(9, 2))
    expect(move(cell(5, 0), 'ArrowLeft')).toEqual(cell(5, 0))
    expect(move(cell(5, 4), 'ArrowRight')).toEqual(cell(5, 4))
  })

  it('jumps to the edge in the arrow direction', () => {
    const jump = { extend: false, jump: true }
    expect(move(cell(5, 2), 'ArrowUp', jump)).toEqual(cell(0, 2))
    expect(move(cell(5, 2), 'ArrowDown', jump)).toEqual(cell(9, 2))
    expect(move(cell(5, 2), 'ArrowLeft', jump)).toEqual(cell(5, 0))
    expect(move(cell(5, 2), 'ArrowRight', jump)).toEqual(cell(5, 4))
  })

  it('Home and End go to the first and last column of the same row', () => {
    expect(move(cell(5, 2), 'Home')).toEqual(cell(5, 0))
    expect(move(cell(5, 2), 'End')).toEqual(cell(5, 4))
  })

  it('Home and End with jump go to the first and last cell of the grid', () => {
    const jump = { extend: false, jump: true }
    expect(move(cell(5, 2), 'Home', jump)).toEqual(cell(0, 0))
    expect(move(cell(5, 2), 'End', jump)).toEqual(cell(9, 4))
  })

  it('PageDown and PageUp move a page of rows', () => {
    expect(move(cell(2, 3), 'PageDown')).toEqual(cell(6, 3))
    expect(move(cell(6, 3), 'PageUp')).toEqual(cell(2, 3))
  })

  it('clamps PageDown at the last row and PageUp at the first', () => {
    expect(move(cell(8, 3), 'PageDown')).toEqual(cell(9, 3))
    expect(move(cell(1, 3), 'PageUp')).toEqual(cell(0, 3))
  })

  it('with extend, moves only the focus', () => {
    const selection: GridSelection = { anchor: at(2, 1), focus: at(4, 3) }
    const next = move(selection, 'ArrowDown', { extend: true, jump: false })
    expect(next).toEqual({ anchor: at(2, 1), focus: at(5, 3) })
  })

  it('with extend, can pull the focus past the anchor and still clamps', () => {
    expect(move(cell(2, 2), 'ArrowUp', { extend: true, jump: false })).toEqual({ anchor: at(2, 2), focus: at(1, 2) })
    expect(move(cell(0, 0), 'ArrowLeft', { extend: true, jump: false })).toEqual(cell(0, 0))
  })

  it('without extend, a range collapses to one cell next to the anchor', () => {
    const selection: GridSelection = { anchor: at(2, 1), focus: at(6, 4) }
    expect(move(selection, 'ArrowRight')).toEqual(cell(2, 2))
    expect(move(selection, 'ArrowDown')).toEqual(cell(3, 1))
    expect(move(selection, 'ArrowUp')).toEqual(cell(1, 1))
  })
})
