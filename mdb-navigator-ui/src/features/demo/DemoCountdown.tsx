import { useEffect, useState } from "react";
import authApi from "../../services/authApi";
import { formatTimeLeft } from "./timeLeft";

// How often the session is checked with the server.
const SESSION_CHECK_MS = 30_000;

interface Props {
  // From /api/auth/me, by the server's clock.
  secondsLeft: number;
  // Called once, when the time is up.
  onEnd: () => void;
}

// "Demo · 7 min left" in the top bar. Counts down from the server's secondsLeft rather than to endsAtUtc, so a browser
// whose clock is off doesn't end the session early (ending it signs out, and the server ends it too).
export default function DemoCountdown({ secondsLeft, onEnd }: Props) {
  const [deadline] = useState(() => Date.now() + secondsLeft * 1000);
  const [msLeft, setMsLeft] = useState(secondsLeft * 1000);

  useEffect(() => {
    const timer = window.setInterval(() => setMsLeft(deadline - Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  // The server can end a session early (too many refused actions). A guest who is only reading results makes no
  // request that would notice, so the session is checked now and then; a failed check (network) is simply tried again.
  const [endedByServer, setEndedByServer] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => {
      authApi.getMe()
        .then(user => {
          if (!user?.guest) {
            setEndedByServer(true);
          }
        })
        .catch(() => undefined);
    }, SESSION_CHECK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const ended = msLeft <= 0 || endedByServer;
  useEffect(() => {
    if (ended) {
      onEnd();
    }
  }, [ended, onEnd]);

  const lastMinute = msLeft < 60_000;
  return (
    <span
      className={`rounded-[3px] border px-1.5 py-0.5 text-xs tabular-nums ${lastMinute ? 'border-danger/30 bg-danger-soft text-danger' : 'border-line bg-surface text-fg-muted'}`}
      title="Your demo session ends when the time is up"
      role="timer"
    >
      Demo · {formatTimeLeft(msLeft)}
    </span>
  );
}
