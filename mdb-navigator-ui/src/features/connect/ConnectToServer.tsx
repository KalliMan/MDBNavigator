import { FormEvent, useState } from 'react';
import { ConnectionSettings } from '../../models/connect/connectionSettings';
import { ServerType, serverTypeOptions } from '../../types/serverTypeOptions';
import Select from '../../ui/common/Select';
import Input from '../../ui/common/Input';
import Button from '../../ui/common/Button';
import { ButtonType } from '../../ui/common/ButtonType.enum';

interface Props {
  onCloseModal?: () => void;
  onOk?: (connectionSettings: ConnectionSettings) => void;
}

export default function ConnectToServer({ onCloseModal, onOk }: Props) {
  const [connectionSettings, setConnectionSettings] = useState<ConnectionSettings>({
    serverType: ServerType.PostgreSQL,
    serverName: 'localhost',
    port: 5432,
    userName: 'postgres',
    password: 'secret',
  });

  const dataOk = connectionSettings?.serverName && connectionSettings?.userName && connectionSettings.password;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!dataOk) {
      return;
    }

    onOk?.(connectionSettings);
    onCloseModal?.();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="pl-4 pr-4 pb-2">
        <div className="mb-8">
          <Select
            label="Server Type:"
            values={serverTypeOptions}
            initialValue={ServerType.PostgreSQL}
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
            initialValue={connectionSettings.port.toString()}
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

        <div className="space-x-1">
          <Button disabled={!dataOk} type={ButtonType.primary}>
            Connect
          </Button>
          <Button type={ButtonType.secondary} onClick={onCloseModal}>Cancel</Button>
        </div>
      </div>
    </form>
  );
}
