import { FormEvent, useState } from 'react';
import { ConnectionSettings } from '../../models/connect/connectionSettings';
import { ServerType, serverTypeOptions } from '../../types/serverTypeOptions';
import Select from '../../ui/common/Select';
import Input from '../../ui/common/Input';
import Button from '../../ui/common/Button';
import { ButtonType } from '../../ui/common/ButtonType.enum';
import { ConnectedResult } from '../../models/connect/connectedResult';

interface Props {
  initialConnectionSettings?: ConnectionSettings | ConnectedResult | null;
  // Error of the last connect attempt, shown in the dialog.
  error?: string | null;
  isConnecting?: boolean;
  // Shows a Cancel button when set.
  onCancel?: () => void;
  onOk?: (connectionSettings: ConnectionSettings) => void;
}

// The dialog's visibility is controlled by the parent: it stays open while connecting and after a failed attempt.
export default function ConnectToServer({ initialConnectionSettings = null, error = null, isConnecting = false, onCancel, onOk }: Props) {
  const defaultConnectionSettings: ConnectionSettings = {
    serverType: ServerType.PostgreSQL,
    // Dev-only defaults from .env.development.local; production builds always start empty.
    serverName: import.meta.env.DEV ? import.meta.env.VITE_DEV_DB_SERVER ?? '' : '',
    port: import.meta.env.DEV && import.meta.env.VITE_DEV_DB_PORT ? Number(import.meta.env.VITE_DEV_DB_PORT) : 5432,
    userName: import.meta.env.DEV ? import.meta.env.VITE_DEV_DB_USER ?? '' : '',
    password: import.meta.env.DEV ? import.meta.env.VITE_DEV_DB_PASSWORD ?? '' : '',
  };

  function isConnectedResult(source: ConnectionSettings | ConnectedResult): source is ConnectedResult {
    return (source as ConnectedResult).connectionId !== undefined;
  }

  function toConnectionSettings(source: ConnectionSettings | ConnectedResult | null): ConnectionSettings {
    if (!source) {
      return defaultConnectionSettings;
    }

    if (isConnectedResult(source)) {
      return {
        ...defaultConnectionSettings,
        serverName: source.serverName,
        userName: source.userName,
        serverType: source.serverType,
        port: source.port,
      };
    }

    return source;
  }

  const [connectionSettings, setConnectionSettings] = useState<ConnectionSettings>(
    toConnectionSettings(initialConnectionSettings)
  );

  const dataOk = connectionSettings?.serverName && connectionSettings?.userName && connectionSettings.password;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!dataOk || isConnecting) {
      return;
    }

    onOk?.(connectionSettings);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="pl-4 pr-4 pb-2">
        <div className="mb-8">
          <Select
            label="Server Type:"
            values={serverTypeOptions}
            initialValue={connectionSettings.serverType}
            onChange={(val: string) =>
              setConnectionSettings({ ...connectionSettings, serverType: val as ServerType })}
          />
        </div>

        <div className="mb-8">
          <Input
            label="Server Name:"
            type="text"
            placeholder="Type Server Name here..."
            initialValue={connectionSettings.serverName}
            onChange={val =>
              setConnectionSettings({ ...connectionSettings, serverName: val })}
          />
        </div>

        <div className="mb-8">
          <Input
            label="Port:"
            type="number"
            placeholder="Type Port here..."
            initialValue={connectionSettings.port?.toString()}
            onChange={val =>
              setConnectionSettings({ ...connectionSettings, port: +val })}
          />
        </div>

        <div className="mb-8">
          <Input
            label="User Name:"
            type="text"
            placeholder="Type User Name here..."
            initialValue={connectionSettings.userName}
            onChange={val =>
              setConnectionSettings({ ...connectionSettings, userName: val })}
          />
        </div>

        <div className="mb-8">
          <Input
            label="Password:"
            type="password"
            placeholder="Type Password here..."
            initialValue={connectionSettings.password}
            onChange={val =>
              setConnectionSettings({ ...connectionSettings, password: val })}
          />
        </div>

        {error && (
          <div className="mb-4 max-w-sm text-sm text-red-600 break-words" role="alert">
            {error}
          </div>
        )}

        <div className="space-x-1">
          <Button disabled={!dataOk || isConnecting} type={ButtonType.primary}>
            {isConnecting ? 'Connecting…' : 'Connect'}
          </Button>
          {onCancel && (
            <Button type={ButtonType.secondary} disabled={isConnecting} onClick={e => { e.preventDefault(); onCancel(); }}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
