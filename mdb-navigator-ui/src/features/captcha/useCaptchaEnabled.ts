import useAuth from "../../contexts/auth/useAuth";

// Whether the server asks for a CAPTCHA at all (Captcha:Provider other than None).
export default function useCaptchaEnabled() {
  const { settings } = useAuth();
  return (settings?.captchaProvider ?? 'None') !== 'None';
}
