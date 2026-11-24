import { describe, expect, it } from 'vitest'
import { DatabaseSQLCommandQuery } from '../../models/databaseCommand/query/databaseSQLCommandQuery'
import { CommandFinishedResult } from '../../models/databaseCommand/result/commandFinishedResult'
import { DatabaseCommandBatchResult } from '../../models/databaseCommand/result/databaseCommandBatchResult'
import { DatabaseCommandResultField } from '../../models/databaseCommand/result/databaseCommandResultField'
import { StatementStartedResult } from '../../models/databaseCommand/result/statementStartedResult'
import { HubStatus } from '../../services/commandResultHub'
import { DatabaseCommandActions, DatabaseCommandActionTypes } from './DatabaseCommandActionType'
import {
  DatabaseCommand,
  databaseCommandReducer,
  DatabaseCommandState,
  initialDatabaseCommandState,
} from './DatabaseCommandReducer'

const ranOn = { connectionId: 'c1', databaseName: 'db' }
const source = { text: 'select 1', line: 1, column: 1 }

function command(overrides: Partial<DatabaseCommand> = {}): DatabaseCommand {
  return {
    id: 'cmd-1',
    isExecuting: false,
    error: null,
    executionId: null,
    status: null,
    stats: null,
    ranOn: null,
    runningStatement: null,
    plan: null,
    source: null,
    errorOffset: null,
    query: null,
    resultSets: [],
    ...overrides,
  }
}

function stateOf(...commands: DatabaseCommand[]): DatabaseCommandState {
  return { ...initialDatabaseCommandState, commands }
}

function query(id: string, cmdQuery = 'select 1'): DatabaseSQLCommandQuery {
  return { connectionId: 'c1', id, name: id, databaseName: 'db', cmdQuery, executeImmediately: false }
}

const field: DatabaseCommandResultField = { index: 0, fieldName: 'id', category: 'Number', dataTypeName: 'int4' }

function batch(overrides: Partial<DatabaseCommandBatchResult> = {}): DatabaseCommandBatchResult {
  return {
    id: 'run-1_0',
    executionId: 'run-1',
    index: 0,
    resultSetIndex: 0,
    isFirstBatch: false,
    isLastBatch: false,
    rows: [],
    truncated: false,
    skippingRest: false,
    ...overrides,
  }
}

function finished(overrides: Partial<CommandFinishedResult> = {}): CommandFinishedResult {
  return {
    executionId: 'run-1',
    status: 'Completed',
    rowCount: 0,
    recordsAffected: 0,
    elapsedMs: 0,
    truncated: false,
    ...overrides,
  }
}

function started(overrides: Partial<StatementStartedResult> = {}): StatementStartedResult {
  return { executionId: 'run-1', statementIndex: 0, statementCount: 1, line: 1, ...overrides }
}

// Runs the reducer and checks that it did not change the state it was given.
function reduce(state: DatabaseCommandState, action: DatabaseCommandActions): DatabaseCommandState {
  const copy = structuredClone(state)
  const next = databaseCommandReducer(state, action)
  expect(state).toEqual(copy)
  return next
}

describe('Executing', () => {
  it('adds a command for an unknown id', () => {
    const next = reduce(initialDatabaseCommandState, {
      type: DatabaseCommandActionTypes.Executing,
      payload: { commandId: 'cmd-1', executionId: 'run-1', ranOn, plan: null, source },
    })

    expect(next.commands).toHaveLength(1)
    expect(next.commands[0]).toMatchObject({
      id: 'cmd-1',
      isExecuting: true,
      executionId: 'run-1',
      ranOn,
      resultSets: [],
    })
  })

  it('restarts an existing command: keeps the query, clears the earlier run', () => {
    const q = query('cmd-1')
    const state = stateOf(command({
      query: q,
      executionId: 'run-0',
      status: 'Failed',
      error: 'boom',
      stats: { rowCount: 1, recordsAffected: 0, elapsedMs: 5, truncated: false },
      runningStatement: { index: 1, count: 2 },
      resultSets: [{ id: 'run-0_0', resultSetIndex: 0, fields: [], rows: [[1]], isComplete: true, truncated: false, skippingRest: false }],
    }))

    const next = reduce(state, {
      type: DatabaseCommandActionTypes.Executing,
      payload: { commandId: 'cmd-1', executionId: 'run-1', ranOn, plan: null, source },
    })

    expect(next.commands).toHaveLength(1)
    expect(next.commands[0]).toMatchObject({
      query: q,
      isExecuting: true,
      executionId: 'run-1',
      resultSets: [],
      error: null,
      status: null,
      stats: null,
      runningStatement: null,
    })
  })

  it('stores the plan mode of the run, and a later normal run clears it', () => {
    const planned = reduce(initialDatabaseCommandState, {
      type: DatabaseCommandActionTypes.Executing,
      payload: { commandId: 'cmd-1', executionId: 'run-1', ranOn, plan: 'Analyze', source },
    })
    expect(planned.commands[0].plan).toBe('Analyze')

    const normal = reduce(planned, {
      type: DatabaseCommandActionTypes.Executing,
      payload: { commandId: 'cmd-1', executionId: 'run-2', ranOn, plan: null, source },
    })
    expect(normal.commands[0].plan).toBeNull()
  })

  it('stores what the run sent and clears the error place of an earlier run', () => {
    const state = stateOf(command({ source: null, errorOffset: 14, status: 'Failed', error: 'boom' }))
    const sent = { text: 'select * from nope', line: 3, column: 2 }

    const next = reduce(state, {
      type: DatabaseCommandActionTypes.Executing,
      payload: { commandId: 'cmd-1', executionId: 'run-1', ranOn, plan: null, source: sent },
    })

    expect(next.commands[0].source).toEqual(sent)
    expect(next.commands[0].errorOffset).toBeNull()
  })
})

describe('Queried', () => {
  it('adds a command with that query for an unknown id', () => {
    const q = query('cmd-1')

    const next = reduce(initialDatabaseCommandState, { type: DatabaseCommandActionTypes.Queried, payload: q })

    expect(next.commands).toHaveLength(1)
    expect(next.commands[0].id).toBe('cmd-1')
    expect(next.commands[0].query).toEqual(q)
  })

  it('sets the query of an existing command and clears its results and error', () => {
    const state = stateOf(command({
      query: query('cmd-1', 'select 1'),
      error: 'boom',
      resultSets: [{ id: 'x_0', resultSetIndex: 0, fields: [], rows: [], isComplete: true, truncated: false, skippingRest: false }],
    }))
    const q = query('cmd-1', 'select 2')

    const next = reduce(state, { type: DatabaseCommandActionTypes.Queried, payload: q })

    expect(next.commands).toHaveLength(1)
    expect(next.commands[0]).toMatchObject({ query: q, resultSets: [], error: null })
  })
})

describe('RowsAppended', () => {
  const running = () => command({ executionId: 'run-1', isExecuting: true })

  it('creates a result set with its fields from the first batch', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [batch({ isFirstBatch: true, fields: [field], rows: [[1]] })],
    })

    expect(next.commands[0].resultSets).toEqual([{
      id: 'run-1_0',
      resultSetIndex: 0,
      fields: [field],
      rows: [[1]],
      isComplete: false,
      truncated: false,
      skippingRest: false,
    }])
  })

  it('appends the rows of several batches in one action in order', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [
        batch({ index: 0, isFirstBatch: true, fields: [field], rows: [[1], [2]] }),
        batch({ index: 1, rows: [[3]] }),
        batch({ index: 2, rows: [[4], [5]] }),
      ],
    })

    expect(next.commands[0].resultSets[0].rows).toEqual([[1], [2], [3], [4], [5]])
  })

  it('appends to a result set that an earlier action created', () => {
    const first = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [batch({ isFirstBatch: true, fields: [field], rows: [[1]] })],
    })

    const next = reduce(first, {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [batch({ index: 1, rows: [[2]] })],
    })

    expect(next.commands[0].resultSets).toHaveLength(1)
    expect(next.commands[0].resultSets[0].rows).toEqual([[1], [2]])
    expect(next.commands[0].resultSets[0].fields).toEqual([field])
  })

  it('marks the result set complete from the last batch, with truncated and skippingRest', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [batch({ isFirstBatch: true, isLastBatch: true, fields: [field], rows: [[1]], truncated: true, skippingRest: true })],
    })

    expect(next.commands[0].resultSets[0]).toMatchObject({ isComplete: true, truncated: true, skippingRest: true })
  })

  it('keeps two result set indexes separate', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [
        batch({ id: 'run-1_0', resultSetIndex: 0, isFirstBatch: true, fields: [field], rows: [[1]] }),
        batch({ id: 'run-1_1', resultSetIndex: 1, isFirstBatch: true, fields: [field], rows: [[2]], isLastBatch: true }),
        batch({ id: 'run-1_0', resultSetIndex: 0, index: 1, rows: [[3]] }),
      ],
    })

    const [first, second] = next.commands[0].resultSets
    expect(first.rows).toEqual([[1], [3]])
    expect(first.isComplete).toBe(false)
    expect(second.rows).toEqual([[2]])
    expect(second.isComplete).toBe(true)
  })

  it('ignores batches of another (older) run and keeps the same command object', () => {
    const state = stateOf(running())

    const next = reduce(state, {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [batch({ executionId: 'run-0', rows: [[1]] })],
    })

    expect(next.commands[0]).toBe(state.commands[0])
  })

  it('ignores batches for a command without an executionId', () => {
    const state = stateOf(command({ executionId: null }))

    const next = reduce(state, {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [batch({ executionId: 'run-1', rows: [[1]] })],
    })

    expect(next.commands[0]).toBe(state.commands[0])
  })

  it('keeps isExecuting true', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [batch({ isFirstBatch: true, isLastBatch: true, fields: [field], rows: [[1]] })],
    })

    expect(next.commands[0].isExecuting).toBe(true)
  })

  it('updates the commands of several runs from one action', () => {
    const state = stateOf(
      command({ id: 'a', executionId: 'run-a', isExecuting: true }),
      command({ id: 'b', executionId: 'run-b', isExecuting: true }),
    )

    const next = reduce(state, {
      type: DatabaseCommandActionTypes.RowsAppended,
      payload: [
        batch({ id: 'run-a_0', executionId: 'run-a', isFirstBatch: true, fields: [field], rows: [[1]] }),
        batch({ id: 'run-b_0', executionId: 'run-b', isFirstBatch: true, fields: [field], rows: [[2]] }),
      ],
    })

    expect(next.commands[0].resultSets[0].rows).toEqual([[1]])
    expect(next.commands[1].resultSets[0].rows).toEqual([[2]])
  })
})

describe('StatementStarted', () => {
  it('sets the running statement of the current run only', () => {
    const state = stateOf(
      command({ id: 'a', executionId: 'run-1', isExecuting: true }),
      command({ id: 'b', executionId: 'run-2', isExecuting: true }),
    )

    const next = reduce(state, {
      type: DatabaseCommandActionTypes.StatementStarted,
      payload: started({ executionId: 'run-1', statementIndex: 2, statementCount: 5 }),
    })

    expect(next.commands[0].runningStatement).toEqual({ index: 2, count: 5 })
    expect(next.commands[1]).toBe(state.commands[1])
  })
})

describe('CommandFinished', () => {
  const running = () => command({ executionId: 'run-1', isExecuting: true, runningStatement: { index: 0, count: 1 } })

  it('Completed stops the run and records status and stats', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.CommandFinished,
      payload: finished({ rowCount: 10, recordsAffected: 3, elapsedMs: 42, truncated: true }),
    })

    expect(next.commands[0]).toMatchObject({
      isExecuting: false,
      runningStatement: null,
      status: 'Completed',
      error: null,
      stats: { rowCount: 10, recordsAffected: 3, elapsedMs: 42, truncated: true },
    })
  })

  it('Failed keeps the error message', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.CommandFinished,
      payload: finished({ status: 'Failed', error: 'relation "x" does not exist' }),
    })

    expect(next.commands[0]).toMatchObject({ status: 'Failed', error: 'relation "x" does not exist' })
  })

  it('Failed without an error gets a default message', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.CommandFinished,
      payload: finished({ status: 'Failed' }),
    })

    expect(next.commands[0].error).toBe('Query execution failed')
  })

  it('Failed keeps the place of the error', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.CommandFinished,
      payload: finished({ status: 'Failed', error: 'no such table', errorOffset: 14 }),
    })

    expect(next.commands[0].errorOffset).toBe(14)
  })

  it('Failed without a place stores null', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.CommandFinished,
      payload: finished({ status: 'Failed', error: 'division by zero' }),
    })

    expect(next.commands[0].errorOffset).toBeNull()
  })

  it('Completed stores no place even if the message has one', () => {
    const next = reduce(stateOf(running()), {
      type: DatabaseCommandActionTypes.CommandFinished,
      payload: finished({ errorOffset: 3 }),
    })

    expect(next.commands[0].errorOffset).toBeNull()
  })

  it('changes nothing for a message of an older run', () => {
    const state = stateOf(running())

    const next = reduce(state, {
      type: DatabaseCommandActionTypes.CommandFinished,
      payload: finished({ executionId: 'run-0' }),
    })

    expect(next.commands[0]).toBe(state.commands[0])
  })
})

describe('CommandRemoved', () => {
  it('removes only that command', () => {
    const state = stateOf(command({ id: 'a' }), command({ id: 'b' }))

    const next = reduce(state, { type: DatabaseCommandActionTypes.CommandRemoved, payload: 'a' })

    expect(next.commands.map(c => c.id)).toEqual(['b'])
  })
})

describe('HubStatusChanged', () => {
  it.each<HubStatus>(['reconnecting', 'disconnected'])('%s fails every executing command that has an executionId', hubStatus => {
    const state = stateOf(
      command({ id: 'a', executionId: 'run-a', isExecuting: true, runningStatement: { index: 0, count: 1 } }),
      command({ id: 'b', executionId: 'run-b', isExecuting: true }),
    )

    const next = reduce(state, { type: DatabaseCommandActionTypes.HubStatusChanged, payload: hubStatus })

    expect(next.hubStatus).toBe(hubStatus)
    for (const c of next.commands) {
      expect(c).toMatchObject({
        isExecuting: false,
        runningStatement: null,
        status: 'Failed',
        error: 'Connection to server lost during execution',
        errorOffset: null,
      })
    }
  })

  it('leaves commands that are not executing untouched', () => {
    const idle = command({ id: 'idle', status: 'Completed' })
    // Executing, but without an executionId (not a streamed run): nothing to lose.
    const noRun = command({ id: 'no-run', isExecuting: true, executionId: null })

    const next = reduce(stateOf(idle, noRun), { type: DatabaseCommandActionTypes.HubStatusChanged, payload: 'disconnected' })

    expect(next.commands[0]).toBe(idle)
    expect(next.commands[1]).toBe(noRun)
  })

  it('connected changes only hubStatus', () => {
    const state: DatabaseCommandState = {
      hubStatus: 'reconnecting',
      commands: [command({ executionId: 'run-1', isExecuting: true })],
    }

    const next = reduce(state, { type: DatabaseCommandActionTypes.HubStatusChanged, payload: 'connected' })

    expect(next.hubStatus).toBe('connected')
    expect(next.commands).toBe(state.commands)
  })
})

describe('Error', () => {
  it('fails that command only', () => {
    const a = command({ id: 'a', isExecuting: true, executionId: 'run-a', runningStatement: { index: 0, count: 1 } })
    const b = command({ id: 'b', isExecuting: true, executionId: 'run-b' })

    const next = reduce(stateOf(a, b), {
      type: DatabaseCommandActionTypes.Error,
      payload: { commandId: 'a', message: 'could not send' },
    })

    expect(next.commands[0]).toMatchObject({ status: 'Failed', error: 'could not send', isExecuting: false, runningStatement: null, errorOffset: null })
    expect(next.commands[1]).toBe(b)
  })
})

describe('unknown action', () => {
  it('returns the same state', () => {
    const state = stateOf(command())

    const next = databaseCommandReducer(state, { type: 'command/unknown' } as unknown as DatabaseCommandActions)

    expect(next).toBe(state)
  })
})
