import useAuth from "../../contexts/auth/useAuth";
import AltchaWidget from "./AltchaWidget";
import TurnstileWidget from "./TurnstileWidget";

interface Props {
  // The solved token, or null while there is none (not solved yet, expired, failed).
  onToken: (token: string | null) => void;
}

// The CAPTCHA the server asks for (Captcha:Provider), or nothing. A token works once: after each request that used
// it, the parent remounts this component (a new key) to get a fresh one.
export default function Captcha({ onToken }: Props) {
  const { settings } = useAuth();

  switch (settings?.captchaProvider) {
    case 'Turnstile':
      return settings.turnstileSiteKey ? <TurnstileWidget siteKey={settings.turnstileSiteKey} onToken={onToken} /> : null;
    case 'Altcha':
      return <AltchaWidget onToken={onToken} />;
    default:
      return null;
  }
}
