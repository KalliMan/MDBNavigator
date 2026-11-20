import { describe, expect, it } from 'vitest'
import { formatTimeLeft } from './timeLeft'

describe('formatTimeLeft', () => {
  it('shows a full session in minutes', () => {
    expect(formatTimeLeft(10 * 60_000)).toBe('10 min left')
  })

  it('rounds minutes up, so part of a minute still counts', () => {
    expect(formatTimeLeft(9 * 60_000 + 1)).toBe('10 min left')
    expect(formatTimeLeft(61_000)).toBe('2 min left')
  })

  it('says 1 min at exactly one minute', () => {
    expect(formatTimeLeft(60_000)).toBe('1 min left')
  })

  it('counts the last minute in seconds', () => {
    expect(formatTimeLeft(59_000)).toBe('0:59 left')
    expect(formatTimeLeft(5_000)).toBe('0:05 left')
    expect(formatTimeLeft(4_200)).toBe('0:05 left')
  })

  it('stops at zero', () => {
    expect(formatTimeLeft(0)).toBe('0:00 left')
    expect(formatTimeLeft(-3_000)).toBe('0:00 left')
  })
})
