import { describe, expect, it } from 'vitest'
import { ConnectedResult } from '../../models/connect/connectedResult'
import { ServerType } from '../../types/serverTypeOptions'
import { CONNECTION_COLORS } from '../../utils/connectionColor'
import { DatabaseConnectActions, DatabaseServerConnectActionTypes } from './DatabaseServerConnectActionTypes'
import {
  databaseConnectReducer,
  DatabaseConnectState,
  DatabaseServerConnection,
  initialDatabaseConnectState,
} from './DatabaseServerConnectReducer'

function connected(overrides: Partial<ConnectedResult> = {}): ConnectedResult {
  return {
    connectionId: 'c1',
    connectionName: 'c1',
    serverType: ServerType.PostgreSQL,
    serverName: 'db.example.test',
    port: 5432,
    userName: 'reader',
    ...overrides,
  }
}

function connection(overrides: Partial<DatabaseServerConnection> = {}): DatabaseServerConnection {
  return {
    isConnectedToDB: true,
    isConnecting: false,
    color: CONNECTION_COLORS[0],
    name: 'Server',
    connectionSettings: null,
    connectedResult: connected(),
    error: null,
    ...overrides,
  }
}

function stateOf(overrides: Partial<DatabaseConnectState> = {}): DatabaseConnectState {
  return { ...initialDatabaseConnectState, ...overrides }
}

// Runs the reducer and checks that it did not change the state it was given.
function reduce(state: DatabaseConnectState, action: DatabaseConnectActions): DatabaseConnectState {
  const copy = structuredClone(state)
  const next = databaseConnectReducer(state, action)
  expect(state).toEqual(copy)
  return next
}

describe('Connecting', () => {
  it('sets isConnecting, clears the error and leaves the dialog open', () => {
    const state = stateOf({ connectNewDatabaseServer: true, error: 'old' })

    const next = reduce(state, { type: DatabaseServerConnectActionTypes.Connecting, payload: null })

    expect(next).toMatchObject({ isConnecting: true, error: null, connectNewDatabaseServer: true })
  })
})

describe('Connected', () => {
  it('adds the connection and closes the dialog', () => {
    const state = stateOf({
      isConnecting: true,
      connectNewDatabaseServer: true,
      reconnectDatabaseServer: true,
      reconnectDatabaseServerId: 'c9',
      captchaRequired: true,
    })
    const result = connected()

    const next = reduce(state, {
      type: DatabaseServerConnectActionTypes.Connected,
      payload: result,
      display: { name: null, color: null },
    })

    expect(next).toMatchObject({
      isConnecting: false,
      connectNewDatabaseServer: false,
      reconnectDatabaseServer: false,
      reconnectDatabaseServerId: null,
      captchaRequired: false,
    })
    expect(next.databaseServerConnections).toHaveLength(1)
    expect(next.databaseServerConnections[0]).toMatchObject({
      isConnectedToDB: true,
      isConnecting: false,
      error: null,
      connectedResult: result,
    })
  })

  it('names the connection after the chosen name, else after the server', () => {
    const named = reduce(initialDatabaseConnectState, {
      type: DatabaseServerConnectActionTypes.Connected,
      payload: connected(),
      display: { name: 'My server', color: null },
    })
    const unnamed = reduce(initialDatabaseConnectState, {
      type: DatabaseServerConnectActionTypes.Connected,
      payload: connected(),
      display: { name: null, color: null },
    })

    expect(named.databaseServerConnections[0].name).toBe('My server')
    expect(unnamed.databaseServerConnections[0].name).toBe('db.example.test')
  })

  it('uses the chosen color', () => {
    const next = reduce(initialDatabaseConnectState, {
      type: DatabaseServerConnectActionTypes.Connected,
      payload: connected(),
      display: { name: null, color: '#123456' },
    })

    expect(next.databaseServerConnections[0].color).toBe('#123456')
  })

  it('picks a color from the palette when none is chosen, and a different one for the same server again', () => {
    const first = reduce(initialDatabaseConnectState, {
      type: DatabaseServerConnectActionTypes.Connected,
      payload: connected({ connectionId: 'c1' }),
      display: { name: null, color: null },
    })
    const second = reduce(first, {
      type: DatabaseServerConnectActionTypes.Connected,
      payload: connected({ connectionId: 'c2' }),
      display: { name: null, color: null },
    })

    const [a, b] = second.databaseServerConnections.map(c => c.color)
    expect(CONNECTION_COLORS).toContain(a)
    expect(CONNECTION_COLORS).toContain(b)
    expect(a).not.toBe(b)
  })
})

describe('Reconnected', () => {
  it('replaces the connected result and keeps the name and color', () => {
    const state = stateOf({
      databaseServerConnections: [
        connection({ name: 'Mine', color: '#123456', isConnectedToDB: false, error: 'lost' }),
        connection({ name: 'Other', connectedResult: connected({ connectionId: 'c2' }) }),
      ],
      reconnectDatabaseServer: true,
      reconnectDatabaseServerId: 'c1',
    })
    const result = connected({ serverName: 'new-host.example.test' })

    const next = reduce(state, { type: DatabaseServerConnectActionTypes.Reconnected, payload: result })

    expect(next.databaseServerConnections[0]).toMatchObject({
      name: 'Mine',
      color: '#123456',
      isConnectedToDB: true,
      error: null,
      connectedResult: result,
    })
    expect(next.databaseServerConnections[1]).toBe(state.databaseServerConnections[1])
    expect(next).toMatchObject({ reconnectDatabaseServer: false, reconnectDatabaseServerId: null, isConnecting: false })
  })
})

describe('Disconnected', () => {
  it('removes only that connection', () => {
    const state = stateOf({
      databaseServerConnections: [
        connection({ connectedResult: connected({ connectionId: 'c1' }) }),
        connection({ connectedResult: connected({ connectionId: 'c2' }) }),
      ],
    })

    const next = reduce(state, { type: DatabaseServerConnectActionTypes.Disconnected, payload: 'c1' })

    expect(next.databaseServerConnections.map(c => c.connectedResult?.connectionId)).toEqual(['c2'])
  })
})

describe('Dialog actions', () => {
  const dirty = () => stateOf({ error: 'old', captchaRequired: true })

  it('ConnectNewDatabaseServer opens the new-connection dialog', () => {
    const next = reduce(
      stateOf({ error: 'old', captchaRequired: true, reconnectDatabaseServer: true, reconnectDatabaseServerId: 'c1' }),
      { type: DatabaseServerConnectActionTypes.ConnectNewDatabaseServer },
    )

    expect(next).toMatchObject({
      connectNewDatabaseServer: true,
      reconnectDatabaseServer: false,
      reconnectDatabaseServerId: null,
      error: null,
      captchaRequired: false,
    })
  })

  it('PromptReconnectWithSettings opens the reconnect dialog for that connection', () => {
    const next = reduce(dirty(), { type: DatabaseServerConnectActionTypes.PromptReconnectWithSettings, payload: 'c7' })

    expect(next).toMatchObject({
      connectNewDatabaseServer: false,
      reconnectDatabaseServer: true,
      reconnectDatabaseServerId: 'c7',
      error: null,
      captchaRequired: false,
    })
  })

  it('ConnectDialogCancelled closes both dialogs', () => {
    const next = reduce(
      stateOf({ error: 'old', captchaRequired: true, connectNewDatabaseServer: true, reconnectDatabaseServer: true, reconnectDatabaseServerId: 'c1' }),
      { type: DatabaseServerConnectActionTypes.ConnectDialogCancelled },
    )

    expect(next).toMatchObject({
      connectNewDatabaseServer: false,
      reconnectDatabaseServer: false,
      reconnectDatabaseServerId: null,
      error: null,
      captchaRequired: false,
    })
  })
})

describe('Error', () => {
  it('sets the error and stops connecting', () => {
    const next = reduce(stateOf({ isConnecting: true }), { type: DatabaseServerConnectActionTypes.Error, payload: 'nope' })

    expect(next).toMatchObject({ error: 'nope', isConnecting: false, captchaRequired: false })
  })

  it('captchaRequired in the action sets it', () => {
    const next = reduce(initialDatabaseConnectState, {
      type: DatabaseServerConnectActionTypes.Error,
      payload: 'captcha',
      captchaRequired: true,
    })

    expect(next.captchaRequired).toBe(true)
  })

  it('keeps captchaRequired once set, also after an error that does not ask for it', () => {
    const asked = reduce(initialDatabaseConnectState, {
      type: DatabaseServerConnectActionTypes.Error,
      payload: 'captcha',
      captchaRequired: true,
    })

    const next = reduce(asked, { type: DatabaseServerConnectActionTypes.Error, payload: 'wrong password' })

    expect(next.captchaRequired).toBe(true)
    expect(next.error).toBe('wrong password')
  })
})
