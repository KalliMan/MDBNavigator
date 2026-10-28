import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import LocalSessionStorage from "../utils/localSessionStorage";

export type HubStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type StatusListener = (status: HubStatus) => void;

// Single SignalR connection for the whole app; lives as long as the page.
let _connection: HubConnection | null = null;
let _startPromise: Promise<void> | null = null;
let _status: HubStatus = 'disconnected';
const _listeners = new Set<StatusListener>();

function setStatus(status: HubStatus) {
  _status = status;
  _listeners.forEach(listener => listener(status));
}

export function getHubConnection(): HubConnection {
  if (!_connection) {
    const appId = LocalSessionStorage.getApplicationId();

    _connection = new HubConnectionBuilder()
      .withUrl(
        `${import.meta.env.VITE_SIGNALR_URL}/batchCommandResult?applicationId=${appId}`,
        { withCredentials: false }
      )
      .withAutomaticReconnect()
      .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
      .build();

    _connection.onreconnecting(() => setStatus('reconnecting'));
    _connection.onreconnected(() => setStatus('connected'));
    _connection.onclose(() => setStatus('disconnected'));
  }
  return _connection;
}

export function startHub(): Promise<void> {
  const connection = getHubConnection();
  if (connection.state !== HubConnectionState.Disconnected) {
    return _startPromise ?? Promise.resolve();
  }

  setStatus('connecting');
  _startPromise = connection.start()
    .then(() => setStatus('connected'))
    .catch(err => {
      setStatus('disconnected');
      throw err;
    })
    .finally(() => { _startPromise = null; });

  return _startPromise;
}

// Calls the listener immediately with the current status, then on every change.
export function subscribeHubStatus(listener: StatusListener): () => void {
  _listeners.add(listener);
  listener(_status);
  return () => { _listeners.delete(listener); };
}

// Resolves once results can be received, so no batch of a new execution is lost.
export function waitUntilConnected(timeoutMs = 10000): Promise<void> {
  if (_status === 'connected') {
    return Promise.resolve();
  }
  if (_status === 'disconnected') {
    return startHub();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error('Connection to the result stream timed out'));
    }, timeoutMs);

    const unsubscribe = subscribeHubStatus(status => {
      if (status === 'connected') {
        clearTimeout(timer);
        // Deferred: subscribeHubStatus may call back before `unsubscribe` is assigned.
        queueMicrotask(() => unsubscribe());
        resolve();
      } else if (status === 'disconnected') {
        clearTimeout(timer);
        queueMicrotask(() => unsubscribe());
        reject(new Error('Connection to the result stream was lost'));
      }
    });
  });
}
