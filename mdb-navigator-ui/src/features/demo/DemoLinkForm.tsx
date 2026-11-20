import { useState } from "react";
import { useNavigate } from "react-router";
import useAuth from "../../contexts/auth/useAuth";
import Notice from "../../ui/common/Notice";
import { AuthField, SubmitButton } from "../auth/AuthControls";
import Captcha from "../captcha/Captcha";
import useCaptchaEnabled from "../captcha/useCaptchaEnabled";
import { DemoErrors, toDemoErrors } from "./demoErrors";
import DemoTerms from "./DemoTerms";
import { DEMO_TERMS_VERSION } from "./demoTermsVersion";

interface Props {
  // The invite form asks for a name; a returning visitor's form doesn't (their visitor record has it).
  askName: boolean;
  submitText: string;
  send: (fields: { name: string; email: string; termsVersion: string; captchaToken: string | null }) => Promise<void>;
}

// Both demo forms: the fields, the terms and the CAPTCHA. On success the visitor goes to /demo/check-inbox.
export default function DemoLinkForm({ askName, submitText, send }: Props) {
  const { settings } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<DemoErrors>({});
  const [busy, setBusy] = useState(false);
  const captchaEnabled = useCaptchaEnabled();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // A token works once: a new key remounts the widget for a fresh one after every attempt.
  const [captchaKey, setCaptchaKey] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Checked before sending, so obvious mistakes don't cost a request (or a CAPTCHA). The server checks again.
    const found: DemoErrors = {};
    if (askName && !name.trim()) {
      found.name = 'Please enter your name.';
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      found.email = 'Please enter a valid email address.';
    }
    if (!agreed) {
      found.terms = 'Please agree to the demo terms.';
    }
    if (captchaEnabled && !captchaToken) {
      found.form ??= 'Please complete the CAPTCHA.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setBusy(true);
    try {
      await send({ name: name.trim(), email: email.trim(), termsVersion: DEMO_TERMS_VERSION, captchaToken });
      void navigate(`/demo/check-inbox?email=${encodeURIComponent(email.trim())}`, { replace: true });
    } catch (error) {
      setErrors(toDemoErrors(error));
      setBusy(false);
      setCaptchaToken(null);
      setCaptchaKey(k => k + 1);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={e => void submit(e)} noValidate>
      {errors.form && <Notice tone="error">{errors.form}</Notice>}
      {askName && (
        <AuthField label="Name" type="text" autoComplete="name" autoFocus value={name} error={errors.name} onChange={setName} />
      )}
      <AuthField label="Email" type="email" autoComplete="email" autoFocus={!askName} value={email} error={errors.email}
        hint="We send the link here." onChange={setEmail} />
      <DemoTerms contactEmail={settings?.demo?.contactEmail ?? ''} agreed={agreed} error={errors.terms} onChange={setAgreed} />
      <Captcha key={captchaKey} onToken={setCaptchaToken} />
      <SubmitButton busy={busy}>{submitText}</SubmitButton>
    </form>
  );
}
