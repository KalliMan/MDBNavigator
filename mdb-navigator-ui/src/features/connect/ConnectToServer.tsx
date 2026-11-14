import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { ConnectionSettings } from '../../models/connect/connectionSettings';
import { ServerType, serverTypeOptions } from '../../types/serverTypeOptions';
import Select from '../../ui/common/Select';
import TextField from '../../ui/common/TextField';
import TextInput from '../../ui/common/TextInput';
import FormField from '../../ui/common/FormField';
import Checkbox from '../../ui/common/Checkbox';
import Notice from '../../ui/common/Notice';
import Button from '../../ui/common/Button';
import { ButtonType } from '../../ui/common/ButtonType.enum';
import { ConnectedResult } from '../../models/connect/connectedResult';
import useAuth from '../../contexts/auth/useAuth';
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
  rememberedPasswordId,
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
  // Passwords typed in this dialog, per entry (null: "New connection"), so clicking between entries doesn't lose them.
  // Memory only, and gone when the dialog closes (it unmounts); a password is only ever sent with its own entry.
  const typedPasswords = useRef(new Map<string | null, string>());

  // Always called (hooks can't be conditional); the reconnect dialog passes false and makes no request.
  const { saved, isLoading, loadFailed, remove, forgetPassword } = useSavedConnections(allowSaved);

  // Only a hint for showing the option: the server checks the key itself.
  const { settings } = useAuth();
  const canRemember = settings?.rememberPasswords ?? false;

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
  // The saved connection whose remembered password is used when the password field is left empty.
  const rememberedId = rememberedPasswordId(form, selected, initialConnection);

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

  // A different entry is a different server, so the password isn't carried over to it. Each entry gets back the
  // password typed for it earlier in this dialog, if any (formFromSaved leaves it empty; a remembered one is used by id).
  // Other edits are still dropped on a switch: only the password is the thing people retype.
  function select(id: string | null) {
    interacted.current = true;
    const entry = id === null ? null : saved.find(s => s.id === id) ?? null;
    typedPasswords.current.set(selectedId, form.password);
    const next = entry ? formFromSaved(entry) : withName(newConnectForm());
    const typed = typedPasswords.current.get(entry?.id ?? null);
    setSelectedId(entry?.id ?? null);
    setForm(typed === undefined ? next : { ...next, password: typed });
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
      typedPasswords.current.delete(selectedId);
    } else {
      // The toast explains it; the entry stays.
      setConfirmingDelete(false);
    }
  }

  // Right away, without connecting: the entry stays, only its password goes.
  async function handleForgetPassword() {
    if (!selected) {
      return;
    }
    if (await forgetPassword(selected.id)) {
      toast.success(`Forgot the password of "${selected.name}".`);
      setForm(f => ({ ...f, rememberPassword: false }));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit || isConnecting) {
      return;
    }

    const found = formErrors(form, saved, selectedId, saving, rememberedId !== null);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    // Captured before awaiting: the dialog unmounts when the connect succeeds.
    const input = toSavedInput(form, saving && canRemember && form.rememberPassword);
    const id = selectedId;
    const shouldSave = saving;
    const token = captchaRequired ? captchaToken : null;

    // A token works once, so the widget restarts right away (not after the await: the dialog may be gone by then).
    if (captchaRequired) {
      setCaptchaToken(null);
      setCaptchaKey(k => k + 1);
    }

    const ok = await onOk?.(toConnectionSettings(form, rememberedId), token, toDisplay(form));
    // Only a connection that opened is saved: a failed attempt leaves the saved list as it was.
    if (ok && id) {
      setLastUsedConnectionId(id);
    }
    if (ok && shouldSave) {
      void saveAfterConnect(id, input);
    }
  }

  const baseId = useId();
  const typeId = `${baseId}-type`;
  const hostId = `${baseId}-host`;
  const portId = `${baseId}-port`;
  const hostMessageId = `${hostId}-message`;
  // Host and Port share a row, so their messages share the line under it.
  const hostError = [errors.serverName, errors.port].filter(Boolean).join(' ') || undefined;

  const formPane = (
    // A fixed width: a long error message wraps instead of widening the dialog.
    <div className="flex w-[26rem] flex-col gap-4 p-4">
      <div className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-3">
        {allowSaved && (
          <TextField
            layout="side"
            label="Name"
            type="text"
            // The default is shown only while nothing is saved, like the pre-filled name.
            placeholder={(selectedId === null && saved.length === 0 && defaultName(form)) || 'Name'}
            maxLength={SAVED_CONNECTION_NAME_MAX_LENGTH}
            error={errors.name}
            value={form.name}
            onChange={val => update({ name: val })}
          />
        )}

        <FormField layout="side" label="Server type" htmlFor={typeId}>
          <Select
            id={typeId}
            values={serverTypeOptions}
            value={form.serverType}
            onChange={(val: string) => update({ serverType: val as ServerType })}
          />
        </FormField>

        <FormField layout="side" label="Host" htmlFor={hostId} error={hostError} messageId={hostMessageId}>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <TextInput
                id={hostId}
                type="text"
                placeholder="Host name or IP address"
                invalid={!!errors.serverName}
                describedBy={hostError ? hostMessageId : undefined}
                value={form.serverName}
                onChange={val => update({ serverName: val })}
              />
            </div>
            <label htmlFor={portId} className="flex-none">Port</label>
            <div className="w-16 flex-none">
              {/* Text, not a number box: its spinner arrows mean nothing for a port. Digits only; empty is 0,
                  which the form reports as out of range. */}
              <TextInput
                id={portId}
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="5432"
                invalid={!!errors.port}
                describedBy={hostError ? hostMessageId : undefined}
                value={form.port === 0 ? '' : String(form.port)}
                onChange={val => update({ port: Number(val.replace(/\D/g, '')) })}
              />
            </div>
          </div>
        </FormField>

        <TextField
          layout="side"
          label="Database"
          type="text"
          placeholder="Optional: the user's default"
          maxLength={128}
          value={form.databaseName}
          onChange={val => update({ databaseName: val })}
        />
        <TextField
          layout="side"
          label="User"
          type="text"
          placeholder="User name"
          error={errors.userName}
          value={form.userName}
          onChange={val => update({ userName: val })}
        />
        <TextField
          layout="side"
          label="Password"
          type="password"
          // Dots for a remembered password: it never comes back to the browser, so they are only the placeholder (the
          // field stays empty and nothing extra is sent). A fixed length, so they say nothing about the real one.
          placeholder={rememberedId ? '••••••••' : 'Password'}
          error={errors.password}
          value={form.password}
          onChange={val => update({ password: val })}
        />

        {allowSaved && (
          <>
            {/* Name and color are always shown: they set the open connection's name and color even when it isn't saved. */}
            <FormField layout="side" label="Color">
              <div className="flex h-7 items-center">
                <ConnectionColorPicker
                  value={form.color}
                  autoColor={autoConnectionColor(toConnectionSettings(form, null))}
                  onChange={color => update({ color })}
                />
              </div>
            </FormField>

            <div className="col-start-2 grid gap-2">
              <Checkbox checked={saveChecked} disabled={isConnecting} onChange={setSaveChecked}>
                {selected ? 'Save changes to this connection' : 'Save this connection'}
              </Checkbox>
              {canRemember && (
                // Remembered together with the entry, so it needs the save checkbox.
                <Checkbox
                  checked={form.rememberPassword}
                  disabled={!saveChecked || isConnecting}
                  onChange={checked => update({ rememberPassword: checked })}
                >
                  Remember password
                </Checkbox>
              )}
              {errors.save && <p className="text-sm text-danger">{errors.save}</p>}
            </div>
          </>
        )}
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {captchaRequired && <Captcha key={captchaKey} onToken={setCaptchaToken} />}

      {confirmingDelete && selected ? (
        <div className="grid gap-3">
          <p className="break-words">Delete "{selected.name}"? This doesn't close open connections.</p>
          <div className="flex gap-2">
            <span className="flex-1" />
            <Button type={ButtonType.secondary} onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button type={ButtonType.danger} onClick={() => void handleDelete()}>
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {allowSaved && selected && (
            <Button type={ButtonType.secondary} disabled={isConnecting} onClick={() => setConfirmingDelete(true)}>
              Delete
            </Button>
          )}
          {allowSaved && selected?.hasPassword && (
            <Button type={ButtonType.secondary} disabled={isConnecting} onClick={() => void handleForgetPassword()}>
              Forget password
            </Button>
          )}
          <span className="flex-1" />
          {onCancel && (
            <Button type={ButtonType.secondary} disabled={isConnecting} onClick={() => onCancel()}>
              Cancel
            </Button>
          )}
          {/* No onClick: Connect is the form's only submit button, so Enter in a field connects. */}
          <Button disabled={!canSubmit || isConnecting} type={ButtonType.primary}>
            {isConnecting ? 'Connecting…' : 'Connect'}
          </Button>
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
