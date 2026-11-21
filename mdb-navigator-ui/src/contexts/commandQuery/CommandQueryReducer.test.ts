import { describe, expect, it } from 'vitest'
import { DatabaseSQLCommandQuery } from '../../models/databaseCommand/query/databaseSQLCommandQuery'
import { CommandQueryActionTypes } from './CommandQueryActionType'
import { commandQueryReducer, CommandQueryState, initialCommandQueryState } from './CommandQueryReducer'

function query(id: string): DatabaseSQLCommandQuery {
  return { connectionId: 'c1', id, name: id, databaseName: 'db', cmdQuery: 'select 1', executeImmediately: false }
}

describe('commandQueryReducer', () => {
  it('appends a query and keeps the earlier ones', () => {
    const state: CommandQueryState = { ...initialCommandQueryState, databaseCommandQueries: [query('a')] }
    const copy = structuredClone(state)

    const next = commandQueryReducer(state, { type: CommandQueryActionTypes.Queried, payload: query('b') })

    expect(next.databaseCommandQueries.map(q => q.id)).toEqual(['a', 'b'])
    expect(state).toEqual(copy)
  })

  it('remembers the database picked in the tree', () => {
    const copy = structuredClone(initialCommandQueryState)

    const next = commandQueryReducer(initialCommandQueryState, {
      type: CommandQueryActionTypes.TreeDatabasePicked,
      payload: { connectionId: 'c1', databaseName: 'db1' },
    })

    expect(next.lastTreeDatabase).toEqual({ connectionId: 'c1', databaseName: 'db1' })
    expect(initialCommandQueryState).toEqual(copy)
  })

  it('returns the same state when the same connection and database are picked again (no re-render)', () => {
    const state = commandQueryReducer(initialCommandQueryState, {
      type: CommandQueryActionTypes.TreeDatabasePicked,
      payload: { connectionId: 'c1', databaseName: 'db1' },
    })

    const next = commandQueryReducer(state, {
      type: CommandQueryActionTypes.TreeDatabasePicked,
      payload: { connectionId: 'c1', databaseName: 'db1' },
    })

    expect(next).toBe(state)
  })

  it('changes the state when another database of the same connection is picked', () => {
    const state = commandQueryReducer(initialCommandQueryState, {
      type: CommandQueryActionTypes.TreeDatabasePicked,
      payload: { connectionId: 'c1', databaseName: 'db1' },
    })

    const next = commandQueryReducer(state, {
      type: CommandQueryActionTypes.TreeDatabasePicked,
      payload: { connectionId: 'c1', databaseName: 'db2' },
    })

    expect(next).not.toBe(state)
    expect(next.lastTreeDatabase).toEqual({ connectionId: 'c1', databaseName: 'db2' })
  })
})
