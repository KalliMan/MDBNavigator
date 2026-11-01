import { useEffect, useRef, useState } from "react";

interface Props {
  onToken: (token: string | null) => void;
}

interface StateChangeDetail {
  state: string;
  payload?: string;
}

// The altcha web component, created by hand rather than in JSX: its events are DOM events, and its setup must have
// run (altchaSetup) before the element exists.
export default function AltchaWidget({ onToken }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  // The latest callback, without re-creating the widget (and losing a solved challenge) when the parent re-renders.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    let widget: HTMLElement | null = null;
    let cancelled = false;

    import('./altchaSetup')
      .then(() => {
        if (cancelled || !container.current) {
          return;
        }
        widget = document.createElement('altcha-widget');
        widget.setAttribute('challenge', `${import.meta.env.VITE_API_URL}/captcha/challenge`);
        // The token goes in a header, not in a form field.
        widget.setAttribute('name', 'captcha');
        widget.addEventListener('statechange', e => {
          const { state, payload } = (e as CustomEvent<StateChangeDetail>).detail;
          // Anything but "verified" (expired, error, back to unverified) means there is no usable token.
          onTokenRef.current(state === 'verified' && payload ? payload : null);
        });
        container.current.append(widget);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      widget?.remove();
      onTokenRef.current(null);
    };
  }, []);

  return failed
    ? <p className="text-sm text-red-600">The CAPTCHA couldn't be loaded. Please reload the page.</p>
    : <div ref={container} />;
}
