import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { ConnectionSettings } from '../../models/connect/connectionSettings';
import { ServerType, serverTypeOptions } from '../../types/serverTypeOptions';
import Select from '../../ui/common/Select';
import Input from '../../ui/common/Input';
import Button from '../../ui/common/Button';
import { ButtonType } from '../../ui/common/ButtonType.enum';
import { ConnectedResult } from '../../models/connect/connectedResult';
import { SavedConnectionInput } from '../../models/connect/savedConnection';
import { SAVED_CONNECTION_NAME_MAX_LENGTH } from '../../models/connect/savedConnectionLimits';
import { ConnectionDisplay } from '../../contexts/databaseServerConnect/DatabaseServerConnectActionTypes';
import agent from '../../services/apiAgent';
import { autoConnectionColor } from '../../utils/connectionColor';
import Captcha from '../captcha/Captcha';
import ConnectionColorPicker from './ConnectionColorPicker';
import SavedConnectionList from './SavedConnectionList';
import useSavedConnections from './useSavedConnections';
import { getLastUsedConnectionId, setLastUsedConnectionId } from './lastUsedConnection';
import {
  ConnectForm,
  formFromConnected,
  defaultName,
  formErrors,
  FormErrors,
  formFromSaved,
  newConnectForm,
  toConnectionSettings,
  toDisplay,
  toSavedInput,
  withDefaultName,
} from './savedConnectionForm';

interface Props {
  // Reconnect: the open connection; the dialog then shows no saved list, name, color or checkbox.
  initialConnection?: ConnectedResult | null;
  // The connect dialog: the saved list, name, color and the save checkbox.
  allowSaved?: boolean;
  // Error of the last connect attempt, shown in the dialog.
  error?: string | null;
  isConnecting?: boolean;
  // The server asked for a CAPTCHA (after repeated failed connects): the dialog shows one, and Connect needs it solved.
  captchaRequired?: boolean;
  // Shows a Cancel button when set.
  onCancel?: () => void;
  // Resolves true when connected. captchaToken: null unless captchaRequired.
  onOk?: (settings: ConnectionSettings, captchaToken: string | null, display: ConnectionDisplay) => Promise<boolean>;
}

// Module-level on purpose: connecting closes the dialog, so by the time this runs the component is gone and
// it must not touch component state. Failures (409 name taken, 400...) already toast through apiAgent; the
// connection that just opened stays open either way.
async function saveAfterConnect(id: string | null, input: SavedConnectionInput) {
  try {
    const result = id
      ? await agent.savedConnectionsApi.update(id, input)
      : await agent.savedConnectionsApi.create(input);
    // A newly saved connection is the one just used (an existing one was remembered when the connect succeeded).
    setLastUsedConnectionId(result.id);
    toast.success(`Saved "${input.name}".`);
  } catch {
    // Already explained by apiAgent's toast.
  }
}

// The dialog's visibility is controlled by the parent: it stays open while connecting and after a failed attempt.
export default function ConnectToServer({
  initialConnection = null, allowSaved = false, error = null, isConnecting = false, captchaRequired = false, onCancel, onOk
}: Props) {
  const [form, setForm] = useState<ConnectForm>(() => initialConnection ? formFromConnected(initialConnection) : withDefaultName(newConnectForm()));
  // The Name field is pre-filled with server:port and follows the server and port until the user types a name of
  // their own (a saved entry's name counts as typed, so changing its port doesn't rename it).
  const [nameTouched, setNameTouched] = useState(false);
  // False until the user changes something or picks an entry: only then may the loaded list preselect one.
  const interacted = useRef(false);
  // null: "New connection".
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveChecked, setSaveChecked] = useState(false);
  // Found when Connect is pressed, before any request, so a typo doesn't cost a connect attempt. Each shows next
  // to its field and goes away when that field is edited.
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Always called (hooks can't be conditional); the reconnect dialog passes false and makes no request.
  const { saved, isLoading, loadFailed, remove } = useSavedConnections(allowSaved);

  // The default name only helps while nothing is saved: with saved connections, a new one starts without a name
  // (it still gets server:port when saved without one), so it doesn't repeat an entry that exists already.
  const withName = (f: ConnectForm) => saved.length === 0 ? withDefaultName(f) : f;

  // When the list arrives: preselect the connection used last, unless the user has already started typing.
  // Without a remembered one (a new browser, or entries saved before this was remembered) the first entry is
  // taken, so a user with saved connections never starts on the empty "New connection" form.
  useEffect(() => {
    if (!allowSaved || isLoading || interacted.current) {
      return;
    }
    interacted.current = true;

    const last = getLastUsedConnectionId();
    const entry = saved.find(s => s.id === last) ?? saved[0];
    if (entry) {
      setSelectedId(entry.id);
      // Dev defaults (.env.development.local) carry a password: keep it when the entry is that same server.
      setForm(f => {
        const loaded = formFromSaved(entry);
        const sameServer = f.serverName === loaded.serverName && f.port === loaded.port && f.userName === loaded.userName;
        return sameServer ? { ...loaded, password: f.password } : loaded;
      });
      setNameTouched(true);
      setSaveChecked(true);
    }
  }, [allowSaved, isLoading, saved]);

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // A token works once: a new key remounts the widget for a fresh one after every attempt.
  const [captchaKey, setCaptchaKey] = useState(0);

  const selected = saved.find(s => s.id === selectedId) ?? null;
  const saving = allowSaved && saveChecked;

  // Missing fields don't disable Connect: pressing it says which ones are missing. Only the CAPTCHA does, since
  // there is no field to point at.
  const canSubmit = !captchaRequired || !!captchaToken;

  function update(changes: Partial<ConnectForm>) {
    interacted.current = true;
    let next = { ...form, ...changes };
    if ('name' in changes) {
      // Clearing the field of a new connection hands the name back to the default. A saved entry has no default.
      setNameTouched(selectedId !== null || !!changes.name?.trim());
    } else if (!nameTouched && ('serverName' in changes || 'port' in changes)) {
      next = withName(next);
    }
    setForm(next);
    // The default name follows the server and port, so a duplicate-name message may no longer apply.
    const edited = new Set<string>([...Object.keys(changes), 'save']);
    if ('serverName' in changes || 'port' in changes) {
      edited.add('name');
    }
    setErrors(Object.fromEntries(Object.entries(errors).filter(([key]) => !edited.has(key))));
  }

  // A different entry is a different server, so the password isn't carried over (formFromSaved leaves it empty).
  function select(id: string | null) {
    interacted.current = true;
    const entry = id === null ? null : saved.find(s => s.id === id) ?? null;
    setSelectedId(entry?.id ?? null);
    setForm(entry ? formFromSaved(entry) : withName(newConnectForm()));
    setNameTouched(entry !== null);
    // Edits to a saved entry are kept by default; a new connection is saved only when asked.
    setSaveChecked(entry !== null);
    setErrors({});
    setConfirmingDelete(false);
  }

  async function handleDelete() {
    if (!selectedId) {
      return;
    }
    if (await remove(selectedId)) {
      select(null);
    } else {
      // The toast explains it; the entry stays.
      setConfirmingDelete(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit || isConnecting) {
      return;
    }

    const found = formErrors(form, saved, selectedId, saving);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    // Captured before awaiting: the dialog unmounts when the connect succeeds.
    const input = toSavedInput(form);
    const id = selectedId;
    const shouldSave = saving;
    const token = captchaRequired ? captchaToken : null;

    // A token works once, so the widget restarts right away (not after the await: the dialog may be gone by then).
    if (captchaRequired) {
      setCaptchaToken(null);
      setCaptchaKey(k => k + 1);
    }

    const ok = await onOk?.(toConnectionSettings(form), token, toDisplay(form));
    // Only a connection that opened is saved: a failed attempt leaves the saved list as it was.
    if (ok && id) {
      setLastUsedConnectionId(id);
    }
    if (ok && shouldSave) {
      void saveAfterConnect(id, input);
    }
  }

  const formPane = (
    <div className="pl-4 pr-4 pb-2">
      {allowSaved && (
        <div className="mb-8">
          <Input
            label="Name:"
            type="text"
            // The default is shown only while nothing is saved, like the pre-filled name.
            placeholder={(selectedId === null && saved.length === 0 && defaultName(form)) || 'Name'}
            maxLength={SAVED_CONNECTION_NAME_MAX_LENGTH}
            error={errors.name}
            initialValue={form.name}
            onChange={val => update({ name: val })}
          />
        </div>
      )}

      <div className="mb-8">
        <Select
          label="Server Type:"
          values={serverTypeOptions}
          initialValue={form.serverType}
          onChange={(val: string) => update({ serverType: val as ServerType })}
        />
      </div>

      <div className="mb-8">
        <Input
          label="Server Name:"
          type="text"
          placeholder="Type Server Name here..."
          error={errors.serverName}
          initialValue={form.serverName}
          onChange={val => update({ serverName: val })}
        />
      </div>

      <div className="mb-8">
        <Input
          label="Port:"
          type="number"
          placeholder="Type Port here..."
          error={errors.port}
          initialValue={form.port.toString()}
          onChange={val => update({ port: +val })}
        />
      </div>

      <div className="mb-8">
        <Input
          label="Database:"
          type="text"
          placeholder="Optional: the user's default"
          maxLength={128}
          initialValue={form.databaseName}
          onChange={val => update({ databaseName: val })}
        />
      </div>

      <div className="mb-8">
        <Input
          label="User Name:"
          type="text"
          placeholder="Type User Name here..."
          error={errors.userName}
          initialValue={form.userName}
          onChange={val => update({ userName: val })}
        />
      </div>

      <div className="mb-8">
        <Input
          label="Password:"
          type="password"
          placeholder="Type Password here..."
          error={errors.password}
          initialValue={form.password}
          onChange={val => update({ password: val })}
        />
      </div>

      {allowSaved && (
        <>
          {/* Name and color are always shown: they set the open connection's name and color even when it isn't saved. */}
          <div className="mb-8">
            <ConnectionColorPicker
              value={form.color}
              autoColor={autoConnectionColor(toConnectionSettings(form))}
              onChange={color => update({ color })}
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-accent"
                checked={saveChecked}
                disabled={isConnecting}
                onChange={e => setSaveChecked(e.target.checked)}
              />
              {selected ? 'Save changes' : 'Save this connection'}
            </label>
            {errors.save && (
              <div className="text-sm text-danger">{errors.save}</div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="mb-4 max-w-sm text-sm text-danger break-words" role="alert">
          {error}
        </div>
      )}

      {captchaRequired && (
        <div className="mb-4">
          <Captcha key={captchaKey} onToken={setCaptchaToken} />
        </div>
      )}

      {confirmingDelete && selected ? (
        <div>
          <div className="mb-2 max-w-sm text-sm break-words">
            Delete "{selected.name}"? This doesn't close open connections.
          </div>
          <div className="flex gap-2">
            <Button type={ButtonType.primary} onClick={e => { e.preventDefault(); void handleDelete(); }}>
              Delete
            </Button>
            <Button type={ButtonType.secondary} onClick={e => { e.preventDefault(); setConfirmingDelete(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button disabled={!canSubmit || isConnecting} type={ButtonType.primary}>
            {isConnecting ? 'Connecting…' : 'Connect'}
          </Button>
          {allowSaved && selected && (
            <Button type={ButtonType.secondary} disabled={isConnecting} onClick={e => { e.preventDefault(); setConfirmingDelete(true); }}>
              Delete
            </Button>
          )}
          {onCancel && (
            <Button type={ButtonType.secondary} disabled={isConnecting} onClick={e => { e.preventDefault(); onCancel(); }}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={e => void handleSubmit(e)}>
      {allowSaved ? (
        <div className="flex">
          <SavedConnectionList
            saved={saved}
            isLoading={isLoading}
            loadFailed={loadFailed}
            selectedId={selectedId}
            disabled={isConnecting}
            onSelect={select}
          />
          {formPane}
        </div>
      ) : formPane}
    </form>
  );
}
