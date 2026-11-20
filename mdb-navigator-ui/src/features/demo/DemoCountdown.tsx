import { useEffect, useState } from "react";
import { formatTimeLeft } from "./timeLeft";

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

  const ended = msLeft <= 0;
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
