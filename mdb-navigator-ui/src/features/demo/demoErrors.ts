import { AxiosError } from 'axios';
import { toAuthErrors } from '../auth/authErrors';

// The demo forms' messages: per field, plus one for the whole form.
export type DemoErrors = Partial<Record<'name' | 'email' | 'terms' | 'form', string>>;

// Error codes of /api/demo/join and /api/demo/sign-in-link (src/MDBNavigator.API/Demo/DemoEndpoints.cs).
const fieldOfCode: Record<string, keyof DemoErrors> = {
  InvalidName: 'name',
  InvalidEmail: 'email',
  TermsNotAccepted: 'terms',
  TermsChanged: 'form',
};

// The demo's refusals (wrong invite code, a used link, "the demo is full", the daily limit...) come with a message
// written for the visitor, so it is shown as it is, including for 429 (toAuthErrors would replace it with a generic one).
export function toDemoErrors(error: unknown): DemoErrors {
  if (error instanceof AxiosError && error.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data as { message?: string; errors?: Record<string, string[]> };
    if (data.errors) {
      const result: DemoErrors = {};
      for (const [code, messages] of Object.entries(data.errors)) {
        result[fieldOfCode[code] ?? 'form'] ??= messages.join(' ');
      }
      return result;
    }
    if (data.message) {
      return { form: data.message };
    }
  }
  return { form: toAuthErrors(error).form };
}
