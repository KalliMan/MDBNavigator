import { describe, expect, it } from 'vitest'
import { clampMenuPosition, columnOffsets, HEADER_HEIGHT, ROW_HEIGHT, scrollToReveal } from './gridGeometry'

describe('columnOffsets', () => {
  it('starts after the row-number column and adds up the widths', () => {
    expect(columnOffsets([100, 50], 44)).toEqual([44, 144])
  })

  it('gives nothing for no columns', () => {
    expect(columnOffsets([], 44)).toEqual([])
  })
})

describe('scrollToReveal', () => {
  // A 400 x 300 viewport scrolled to (100, 200); the header is 28px tall and the row numbers 44px wide.
  const viewport = { scrollTop: 200, scrollLeft: 100, clientWidth: 400, clientHeight: 300 }
  const sticky = { top: HEADER_HEIGHT, left: 44 }
  const cellAt = (top: number, left: number, width = 100) => ({ top, left, width, height: ROW_HEIGHT })

  it('leaves a visible cell alone', () => {
    expect(scrollToReveal(viewport, cellAt(300, 200), sticky)).toEqual({ scrollTop: 200, scrollLeft: 100 })
  })

  it('scrolls up when the cell is hidden under the header', () => {
    // The cell's top is above scrollTop + header (228): its top must land just under the header.
    expect(scrollToReveal(viewport, cellAt(210, 200), sticky)).toEqual({ scrollTop: 182, scrollLeft: 100 })
  })

  it('scrolls down when the cell is below the bottom edge', () => {
    // The cell ends at 520, the viewport at 500: move by 20.
    expect(scrollToReveal(viewport, cellAt(496, 200), sticky)).toEqual({ scrollTop: 220, scrollLeft: 100 })
  })

  it('scrolls left when the cell is hidden under the row-number column', () => {
    // The visible content starts at 100 + 44: the cell's left edge must land there.
    expect(scrollToReveal(viewport, cellAt(300, 120), sticky)).toEqual({ scrollTop: 200, scrollLeft: 76 })
  })

  it('scrolls right when the cell is past the right edge', () => {
    // The cell ends at 550, the viewport at 500: move by 50.
    expect(scrollToReveal(viewport, cellAt(300, 450), sticky)).toEqual({ scrollTop: 200, scrollLeft: 150 })
  })

  it('aligns the left edge of a cell wider than the visible area', () => {
    expect(scrollToReveal(viewport, cellAt(300, 500, 1000), sticky)).toEqual({ scrollTop: 200, scrollLeft: 456 })
  })

  it('never scrolls below zero', () => {
    const atStart = { scrollTop: 10, scrollLeft: 10, clientWidth: 400, clientHeight: 300 }
    expect(scrollToReveal(atStart, cellAt(0, 0), sticky)).toEqual({ scrollTop: 0, scrollLeft: 0 })
  })
})

describe('clampMenuPosition', () => {
  const menu = { width: 250, height: 110 }
  const page = { scrollX: 0, scrollY: 0, innerWidth: 1000, innerHeight: 800 }

  it('leaves a position inside the window alone', () => {
    expect(clampMenuPosition(300, 200, menu, page)).toEqual({ x: 300, y: 200 })
  })

  it('pulls the menu back from the right edge', () => {
    expect(clampMenuPosition(950, 200, menu, page)).toEqual({ x: 742, y: 200 })
  })

  it('pulls the menu back from the bottom edge', () => {
    expect(clampMenuPosition(300, 780, menu, page)).toEqual({ x: 300, y: 682 })
  })

  it('keeps 8px from the top and left edges', () => {
    expect(clampMenuPosition(2, 3, menu, page)).toEqual({ x: 8, y: 8 })
  })

  it('works with page coordinates when the page is scrolled', () => {
    const scrolled = { scrollX: 100, scrollY: 500, innerWidth: 1000, innerHeight: 800 }
    // Window spans x 100..1100 and y 500..1300.
    expect(clampMenuPosition(1090, 1290, menu, scrolled)).toEqual({ x: 842, y: 1182 })
    expect(clampMenuPosition(105, 505, menu, scrolled)).toEqual({ x: 108, y: 508 })
    expect(clampMenuPosition(600, 900, menu, scrolled)).toEqual({ x: 600, y: 900 })
  })
})
