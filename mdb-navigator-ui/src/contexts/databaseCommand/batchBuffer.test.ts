import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DatabaseCommandBatchResult } from '../../models/databaseCommand/result/databaseCommandBatchResult'
import { StatementStartedResult } from '../../models/databaseCommand/result/statementStartedResult'
import { createBatchBuffer } from './batchBuffer'
import { DatabaseCommandActions, DatabaseCommandActionTypes } from './DatabaseCommandActionType'

// FLUSH_INTERVAL_MS in batchBuffer.ts is not exported; this is its value.
const FLUSH_MS = 150

function batch(overrides: Partial<DatabaseCommandBatchResult> = {}): DatabaseCommandBatchResult {
  return {
    id: 'run-1_0',
    executionId: 'run-1',
    index: 0,
    resultSetIndex: 0,
    isFirstBatch: true,
    isLastBatch: false,
    rows: [],
    truncated: false,
    skippingRest: false,
    ...overrides,
  }
}

function started(overrides: Partial<StatementStartedResult> = {}): StatementStartedResult {
  return { executionId: 'run-1', statementIndex: 0, statementCount: 3, line: 1, ...overrides }
}

function setup() {
  const dispatch = vi.fn<(action: DatabaseCommandActions) => void>()
  const buffer = createBatchBuffer(dispatch)
  return { dispatch, buffer }
}

describe('createBatchBuffer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for the interval, then dispatches all pushed batches once, in push order', () => {
    const { dispatch, buffer } = setup()
    const first = batch({ index: 0 })
    const second = batch({ index: 1 })

    buffer.push(first)
    buffer.push(second)
    expect(dispatch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(FLUSH_MS)
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: DatabaseCommandActionTypes.RowsAppended, payload: [first, second] })
  })

  it('puts batches pushed while a timer is running into the same dispatch', () => {
    const { dispatch, buffer } = setup()
    const first = batch({ index: 0 })
    const second = batch({ index: 1 })

    buffer.push(first)
    vi.advanceTimersByTime(100)
    buffer.push(second)
    vi.advanceTimersByTime(50)

    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: DatabaseCommandActionTypes.RowsAppended, payload: [first, second] })
  })

  it('keeps only the latest statement message of each run', () => {
    const { dispatch, buffer } = setup()

    buffer.pushStatement(started({ executionId: 'run-1', statementIndex: 0 }))
    buffer.pushStatement(started({ executionId: 'run-2', statementIndex: 0 }))
    buffer.pushStatement(started({ executionId: 'run-1', statementIndex: 1 }))
    buffer.pushStatement(started({ executionId: 'run-1', statementIndex: 2 }))
    vi.advanceTimersByTime(FLUSH_MS)

    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenCalledWith({
      type: DatabaseCommandActionTypes.StatementStarted,
      payload: started({ executionId: 'run-1', statementIndex: 2 }),
    })
    expect(dispatch).toHaveBeenCalledWith({
      type: DatabaseCommandActionTypes.StatementStarted,
      payload: started({ executionId: 'run-2', statementIndex: 0 }),
    })
  })

  it('dispatches rows before statement messages on one flush', () => {
    const { dispatch, buffer } = setup()

    // The statement message is pushed first, to show the order comes from the buffer and not from the pushes.
    buffer.pushStatement(started())
    buffer.push(batch())
    vi.advanceTimersByTime(FLUSH_MS)

    const types = dispatch.mock.calls.map(call => call[0].type)
    expect(types).toEqual([DatabaseCommandActionTypes.RowsAppended, DatabaseCommandActionTypes.StatementStarted])
  })

  it('flush dispatches at once and cancels the timer', () => {
    const { dispatch, buffer } = setup()

    buffer.push(batch())
    buffer.flush()
    expect(dispatch).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(FLUSH_MS)
    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  it('flush with nothing queued dispatches nothing', () => {
    const { dispatch, buffer } = setup()

    buffer.flush()
    vi.advanceTimersByTime(FLUSH_MS)

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('starts a new timer for a push after a flush', () => {
    const { dispatch, buffer } = setup()

    buffer.push(batch({ index: 0 }))
    buffer.flush()
    expect(dispatch).toHaveBeenCalledTimes(1)

    const later = batch({ index: 1 })
    buffer.push(later)
    expect(dispatch).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(FLUSH_MS)
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenLastCalledWith({ type: DatabaseCommandActionTypes.RowsAppended, payload: [later] })
  })
})
