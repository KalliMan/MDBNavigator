import { useEffect, useRef, useState } from "react";

interface Props {
  siteKey: string;
  onToken: (token: string | null) => void;
}

// The part of Cloudflare's script API used here (https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/).
interface Turnstile {
  render: (container: HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const scriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptLoading: Promise<Turnstile> | null = null;

// Cloudflare's script is loaded straight from Cloudflare, as they require (no npm package), once per page and only
// when a Turnstile widget is shown.
function loadTurnstile(): Promise<Turnstile> {
  scriptLoading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load.')));
    script.onerror = () => {
      // Allow a later widget to try again.
      scriptLoading = null;
      script.remove();
      reject(new Error('Turnstile did not load.'));
    };
    document.head.append(script);
  });
  return scriptLoading;
}

export default function TurnstileWidget({ siteKey, onToken }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  // The latest callback, without re-rendering the widget (and losing its token) when the parent re-renders.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    let widgetId: string | null = null;
    let turnstile: Turnstile | null = null;
    let cancelled = false;

    loadTurnstile()
      .then(loaded => {
        if (cancelled || !container.current) {
          return;
        }
        turnstile = loaded;
        widgetId = loaded.render(container.current, {
          sitekey: siteKey,
          callback: token => onTokenRef.current(token),
          // A token is valid for 5 minutes; Turnstile then fetches a new one by itself.
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (turnstile && widgetId) {
        turnstile.remove(widgetId);
      }
      onTokenRef.current(null);
    };
  }, [siteKey]);

  return failed
    ? <p className="text-sm text-red-600">The CAPTCHA couldn't be loaded. Please check your connection and reload the page.</p>
    : <div ref={container} />;
}
