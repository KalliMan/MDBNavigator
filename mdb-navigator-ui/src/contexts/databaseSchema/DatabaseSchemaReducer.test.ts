import { describe, expect, it } from 'vitest'
import { Database } from '../../models/schema/database/database'
import { ProceduresDetails } from '../../models/schema/procedure/proceduresDetails'
import { TableDefinitionDetails } from '../../models/schema/table/tableDefinitionDetails'
import { TablesDetails } from '../../models/schema/table/tablesDetails'
import { ViewDetails } from '../../models/schema/view/viewsDetails'
import { DatabaseSchemaActions, DatabaseSchemaActionTypes, DatabaseSchemaErrorScope } from './DatabaseSchemaActionTypes'
import {
  DatabaseSchema,
  databaseSchemaReducer,
  DatabaseSchemaState,
  initialDatabaseConnectState,
} from './DatabaseSchemaReducer'

function database(name: string, overrides: Partial<Database> = {}): Database {
  return {
    internalId: name,
    name,
    tablesDetails: null,
    tableDefinitionDetails: null,
    storedProceduresDetails: null,
    functionsDetails: null,
    viewsDetails: null,
    ...overrides,
  }
}

// A schema entry that already has a database list.
function schema(connectionId: string, databases: Database[] = [database('db1')], overrides: Partial<DatabaseSchema> = {}): DatabaseSchema {
  return {
    connectionId,
    isLoading: true,
    error: 'old error',
    databasesDetails: { connectionId, dataSource: 'host', databases },
    ...overrides,
  }
}

function stateOf(...schemas: DatabaseSchema[]): DatabaseSchemaState {
  return { ...initialDatabaseConnectState, isLoading: true, databaseSchemas: schemas }
}

function tables(connectionId: string, databaseName: string): TablesDetails {
  return { connectionId, databaseName, tables: [{ databaseSchema: 'public', name: 't' }] }
}

function routines(connectionId: string, databaseName: string): ProceduresDetails {
  return { connectionId, dataSource: 'host', databaseName, procedures: [] }
}

function views(connectionId: string, databaseName: string): ViewDetails {
  return { connectionId, dataSource: 'host', databaseName, views: [{ databaseSchema: 'public', name: 'v' }] }
}

function definition(name: string, overrides: Partial<TableDefinitionDetails> = {}): TableDefinitionDetails {
  return {
    connectionId: 'c1',
    databaseName: 'db1',
    databaseSchema: 'public',
    name,
    columns: [],
    indexes: [],
    constraints: [],
    ...overrides,
  }
}

// Runs the reducer and checks that it did not change the state it was given.
function reduce(state: DatabaseSchemaState, action: DatabaseSchemaActions): DatabaseSchemaState {
  const copy = structuredClone(state)
  const next = databaseSchemaReducer(state, action)
  expect(state).toEqual(copy)
  return next
}

// The first database of the first schema, after a reduce.
function firstDatabase(state: DatabaseSchemaState): Database {
  return state.databaseSchemas![0].databasesDetails!.databases[0]
}

describe('AddedSchema', () => {
  it('adds a schema', () => {
    const entry: DatabaseSchema = { connectionId: 'c1', isLoading: false, error: null, databasesDetails: null }

    const next = reduce(initialDatabaseConnectState, { type: DatabaseSchemaActionTypes.AddedSchema, payload: entry })

    expect(next.databaseSchemas).toEqual([entry])
  })

  it('keeps one entry when the same connection is added again', () => {
    const entry: DatabaseSchema = { connectionId: 'c1', isLoading: false, error: null, databasesDetails: null }
    const once = reduce(initialDatabaseConnectState, { type: DatabaseSchemaActionTypes.AddedSchema, payload: entry })

    const twice = reduce(once, { type: DatabaseSchemaActionTypes.AddedSchema, payload: { ...entry, error: 'other' } })

    expect(twice.databaseSchemas).toHaveLength(1)
    expect(twice.databaseSchemas![0].error).toBeNull()
  })
})

describe('RemovedSchema', () => {
  it('removes only that connection\'s schema', () => {
    const next = reduce(stateOf(schema('c1'), schema('c2')), { type: DatabaseSchemaActionTypes.RemovedSchema, payload: 'c1' })

    expect(next.databaseSchemas!.map(s => s.connectionId)).toEqual(['c2'])
  })
})

describe('FetchedDatabases', () => {
  it('sets the database list and clears isLoading and error of that schema only', () => {
    const state = stateOf(
      schema('c1', [], { databasesDetails: null }),
      schema('c2', [], { databasesDetails: null }),
    )
    const details = { connectionId: 'c1', dataSource: 'host', databases: [database('db1'), database('db2')] }

    const next = reduce(state, { type: DatabaseSchemaActionTypes.FetchedDatabases, payload: details })

    expect(next.databaseSchemas![0]).toMatchObject({ isLoading: false, error: null, databasesDetails: details })
    expect(next.databaseSchemas![1]).toMatchObject({ isLoading: true, error: 'old error', databasesDetails: null })
  })
})

describe('Fetched tables, views, functions and stored procedures', () => {
  const cases: { name: string, action: (db: string) => DatabaseSchemaActions, field: keyof Database }[] = [
    {
      name: 'FetchedTables',
      action: db => ({ type: DatabaseSchemaActionTypes.FetchedTables, payload: tables('c1', db) }),
      field: 'tablesDetails',
    },
    {
      name: 'FetchedViews',
      action: db => ({ type: DatabaseSchemaActionTypes.FetchedViews, payload: views('c1', db) }),
      field: 'viewsDetails',
    },
    {
      name: 'FetchedFunctions',
      action: db => ({ type: DatabaseSchemaActionTypes.FetchedFunctions, payload: routines('c1', db) }),
      field: 'functionsDetails',
    },
    {
      name: 'FetchedStoredProcedures',
      action: db => ({ type: DatabaseSchemaActionTypes.FetchedStoredProcedures, payload: routines('c1', db) }),
      field: 'storedProceduresDetails',
    },
  ]

  it.each(cases)('$name sets $field on the right database only', ({ action, field }) => {
    const state = stateOf(schema('c1', [database('db1'), database('db2')]))

    const next = reduce(state, action('db2'))

    const [first, second] = next.databaseSchemas![0].databasesDetails!.databases
    expect(first[field]).toBeNull()
    expect(second[field]).toEqual((action('db2') as { payload: unknown }).payload)
    expect(next.databaseSchemas![0]).toMatchObject({ isLoading: false, error: null })
  })

  it.each(cases)('$name for a database that is not in the list changes nothing but isLoading', ({ action }) => {
    const state = stateOf(schema('c1', [database('db1')]))

    const next = reduce(state, action('missing'))

    expect(next.isLoading).toBe(false)
    expect(next.databaseSchemas).toEqual(state.databaseSchemas)
  })
})

describe('FetchedTableDefinition', () => {
  it('replaces the entry of the same schema and table and keeps the other tables', () => {
    const state = stateOf(schema('c1', [database('db1', {
      tableDefinitionDetails: [
        definition('a', { tableDefinitionError: 'old' }),
        definition('b'),
        definition('a', { databaseSchema: 'other' }),
      ],
    })]))
    const fresh = definition('a', { columns: [{ columnName: 'id', dataType: 'integer', isNullable: false }] })

    const next = reduce(state, { type: DatabaseSchemaActionTypes.FetchedTableDefinition, payload: fresh })

    const entries = firstDatabase(next).tableDefinitionDetails!
    expect(entries).toHaveLength(3)
    expect(entries.filter(t => t.databaseSchema === 'public' && t.name === 'a')).toEqual([fresh])
    expect(entries.find(t => t.name === 'b')).toEqual(definition('b'))
    expect(entries.find(t => t.databaseSchema === 'other')).toEqual(definition('a', { databaseSchema: 'other' }))
    expect(next.databaseSchemas![0].error).toBeNull()
  })
})

describe('Error', () => {
  const error = (payload: Omit<Extract<DatabaseSchemaActions, { type: DatabaseSchemaActionTypes.Error }>['payload'], 'message'>): DatabaseSchemaActions =>
    ({ type: DatabaseSchemaActionTypes.Error, payload: { message: 'it failed', ...payload } })

  it('Databases scope sets the schema error even before a database list arrived', () => {
    const state = stateOf(schema('c1', [], { databasesDetails: null }))

    const next = reduce(state, error({ connectionId: 'c1', scope: DatabaseSchemaErrorScope.Databases }))

    expect(next.databaseSchemas![0]).toMatchObject({ error: 'it failed', isLoading: false, databasesDetails: null })
    expect(next.error).toBeNull()
    expect(next.isLoading).toBe(false)
  })

  it('Databases scope keeps the list a schema already had', () => {
    const state = stateOf(schema('c1', [database('db1')]))

    const next = reduce(state, error({ connectionId: 'c1', scope: DatabaseSchemaErrorScope.Databases }))

    expect(next.databaseSchemas![0].error).toBe('it failed')
    expect(next.databaseSchemas![0].databasesDetails).toEqual(state.databaseSchemas![0].databasesDetails)
  })

  it('an error without a connectionId sets the state error', () => {
    const next = reduce(stateOf(schema('c1')), error({}))

    expect(next.error).toBe('it failed')
    expect(next.databaseSchemas![0].error).toBe('old error')
  })

  it('Tables scope sets tablesError and clears the tables of that database', () => {
    const state = stateOf(schema('c1', [database('db1', { tablesDetails: tables('c1', 'db1') }), database('db2', { tablesDetails: tables('c1', 'db2') })]))

    const next = reduce(state, error({ connectionId: 'c1', databaseName: 'db1', scope: DatabaseSchemaErrorScope.Tables }))

    const [first, second] = next.databaseSchemas![0].databasesDetails!.databases
    expect(first).toMatchObject({ tablesDetails: null, tablesError: 'it failed' })
    expect(second.tablesDetails).toEqual(tables('c1', 'db2'))
  })

  it('TableDefinition scope replaces only that table\'s entry with an error entry', () => {
    const state = stateOf(schema('c1', [database('db1', {
      tableDefinitionDetails: [definition('a', { columns: [{ columnName: 'id', dataType: 'integer', isNullable: false }] }), definition('b')],
    })]))

    const next = reduce(state, error({
      connectionId: 'c1',
      databaseName: 'db1',
      databaseSchema: 'public',
      tableName: 'a',
      scope: DatabaseSchemaErrorScope.TableDefinition,
    }))

    const entries = firstDatabase(next).tableDefinitionDetails!
    expect(entries).toHaveLength(2)
    expect(entries.find(t => t.name === 'b')).toEqual(definition('b'))
    expect(entries.find(t => t.name === 'a')).toEqual(definition('a', { tableDefinitionError: 'it failed' }))
  })

  it.each([
    [DatabaseSchemaErrorScope.Functions, 'functionsDetails', 'functionsError'],
    [DatabaseSchemaErrorScope.Procedures, 'storedProceduresDetails', 'storedProceduresError'],
    [DatabaseSchemaErrorScope.Views, 'viewsDetails', 'viewsError'],
  ] as const)('%s scope sets %s to null and %s', (scope, detailsField, errorField) => {
    const state = stateOf(schema('c1', [database('db1', {
      functionsDetails: routines('c1', 'db1'),
      storedProceduresDetails: routines('c1', 'db1'),
      viewsDetails: views('c1', 'db1'),
    })]))

    const next = reduce(state, error({ connectionId: 'c1', databaseName: 'db1', scope }))

    expect(firstDatabase(next)[detailsField]).toBeNull()
    expect(firstDatabase(next)[errorField]).toBe('it failed')
  })
})

describe('Reset', () => {
  it.each([
    [DatabaseSchemaActionTypes.ResetTables, 'tablesDetails'],
    [DatabaseSchemaActionTypes.ResetViews, 'viewsDetails'],
    [DatabaseSchemaActionTypes.ResetFunctions, 'functionsDetails'],
    [DatabaseSchemaActionTypes.ResetStoredProcedures, 'storedProceduresDetails'],
  ] as const)('%s clears %s', (type, field) => {
    const state = stateOf(schema('c1', [database('db1', {
      tablesDetails: tables('c1', 'db1'),
      viewsDetails: views('c1', 'db1'),
      functionsDetails: routines('c1', 'db1'),
      storedProceduresDetails: routines('c1', 'db1'),
    })]))

    const next = reduce(state, { type, payload: { connectionId: 'c1', databaseName: 'db1' } })

    const db = firstDatabase(next)
    expect(db[field]).toBeNull()
    // The other three are still there.
    const others = (['tablesDetails', 'viewsDetails', 'functionsDetails', 'storedProceduresDetails'] as const).filter(f => f !== field)
    for (const other of others) {
      expect(db[other]).not.toBeNull()
    }
  })
})

describe('immer', () => {
  it('returns a frozen state', () => {
    const next = reduce(stateOf(schema('c1')), {
      type: DatabaseSchemaActionTypes.FetchedTables,
      payload: tables('c1', 'db1'),
    })

    expect(Object.isFrozen(next.databaseSchemas![0])).toBe(true)
  })
})
