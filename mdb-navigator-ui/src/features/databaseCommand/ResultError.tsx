import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../../ui/common/Button';
import { ButtonType } from '../../ui/common/ButtonType.enum';
import { copyText } from '../../utils/clipboard';
import { parseRunError, statementsAroundFailure } from './runStatus';

// A failed run's message in full (the status bar has room for one line of it), which statement of a script
// failed, and what happened to the others.
export default function ResultError({ error }: { error: string }) {
  const { statement, message } = parseRunError(error);
  // "Copied" for two seconds: the app has no other sign that a copy worked.
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  function handleCopy() {
    void copyText(message)
      .then(() => setCopied(true))
      .catch(() => toast.error("Couldn't copy to the clipboard. It needs HTTPS or localhost."));
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto px-5 py-4">
      <div className="flex items-baseline gap-3">
        <span className="font-semibold">{statement ? `Statement ${statement.number} of ${statement.count} failed` : 'The query failed'}</span>
        {statement && <span className="text-fg-muted">line {statement.line}</span>}
      </div>
      <pre className="max-w-4xl flex-none select-text whitespace-pre-wrap break-words rounded-[3px] border border-danger/30 bg-danger-soft px-3 py-2 font-mono text-[13px] leading-5 text-danger">{message}</pre>
      <div className="flex flex-wrap items-center gap-3">
        <Button type={ButtonType.secondary} onClick={handleCopy}>{copied ? 'Copied' : 'Copy message'}</Button>
        {statement && <span className="text-fg-muted">{statementsAroundFailure(statement.number, statement.count)}</span>}
      </div>
    </div>
  );
}
