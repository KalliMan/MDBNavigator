import { describe, expect, it } from 'vitest'
import { DatabaseSchema } from '../../contexts/databaseSchema/DatabaseSchemaReducer'
import { DatabaseServerConnection } from '../../contexts/databaseServerConnect/DatabaseServerConnectReducer'
import { ServerType } from '../../types/serverTypeOptions'
import { newQueryTarget } from './queryTargets'

function connection(id: string, name: string, color: string, defaultDatabase: string | null): DatabaseServerConnection {
  return {
    isConnectedToDB: true,
    isConnecting: false,
    color,
    name,
    connectionSettings: null,
    connectedResult: {
      connectionId: id,
      connectionName: name,
      serverType: ServerType.PostgreSQL,
      serverName: 'localhost',
      port: 5432,
      userName: 'user',
      databaseName: defaultDatabase,
    },
    error: null,
  }
}

function schema(connectionId: string, databaseNames: string[] | null): DatabaseSchema {
  return {
    connectionId,
    isLoading: false,
    error: null,
    databasesDetails: databaseNames && {
      connectionId,
      dataSource: 'localhost',
      databases: databaseNames.map(name => ({
        internalId: name,
        name,
        tablesDetails: null,
        tableDefinitionDetails: null,
        storedProceduresDetails: null,
        functionsDetails: null,
        viewsDetails: null,
      })),
    },
  }
}

const first = connection('c1', 'First', '#111111', 'main')
const second = connection('c2', 'Second', '#222222', 'other')

describe('newQueryTarget', () => {
  it('opens on the database clicked last in the tree', () => {
    expect(newQueryTarget({ connectionId: 'c2', databaseName: 'sales' }, [first, second], null)).toEqual({
      connectionId: 'c2',
      databaseName: 'sales',
      serverName: 'Second',
      color: '#222222',
    })
  })

  it('falls back to the first server when the last clicked database\'s server is gone', () => {
    expect(newQueryTarget({ connectionId: 'gone', databaseName: 'sales' }, [first, second], null)).toEqual({
      connectionId: 'c1',
      databaseName: 'main',
      serverName: 'First',
      color: '#111111',
    })
  })

  it('opens on the first server\'s default database', () => {
    expect(newQueryTarget(null, [first, second], null)?.databaseName).toBe('main')
  })

  it('opens on the first loaded database when the server has no default', () => {
    const noDefault = connection('c1', 'First', '#111111', null)
    expect(newQueryTarget(null, [noDefault], [schema('c1', ['alpha', 'beta'])])?.databaseName).toBe('alpha')
  })

  it('is null when the server has no default and its list is not loaded', () => {
    const noDefault = connection('c1', 'First', '#111111', null)
    expect(newQueryTarget(null, [noDefault], null)).toBeNull()
    expect(newQueryTarget(null, [noDefault], [schema('c1', null)])).toBeNull()
  })

  it('is null without connections', () => {
    expect(newQueryTarget(null, [], null)).toBeNull()
  })
})
