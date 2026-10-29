import axios, { AxiosError } from 'axios';
import { AuthSettings, CurrentUser } from '../models/auth/auth';

// Its own axios instance: the sign-in pages show errors inline, so the app-wide interceptors in apiAgent (toasts,
// the session-expired handling) must not run for these calls.
const http = axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 30_000 });

const authApi = {
  getSettings: () => http.get<AuthSettings>('/auth/settings').then(r => r.data),

  // null when nobody is signed in.
  getMe: async (): Promise<CurrentUser | null> => {
    try {
      return (await http.get<CurrentUser>('/auth/me')).data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  // useCookies: the session lives in an HttpOnly cookie, so no token is ever visible to JavaScript.
  login: (email: string, password: string) =>
    http.post('/auth/login', { email, password }, { params: { useCookies: true } }).then(() => undefined),
  logout: () => http.post('/auth/logout').then(() => undefined),
  register: (email: string, password: string) => http.post('/auth/register', { email, password }).then(() => undefined),

  resendConfirmation: (email: string) => http.post('/auth/resendConfirmationEmail', { email }).then(() => undefined),
  // The query of the link in the confirmation email (userId, code, and changedEmail when the address changed).
  confirmEmail: (query: URLSearchParams) => http.get('/auth/confirmEmail', { params: query }).then(() => undefined),

  forgotPassword: (email: string) => http.post('/auth/forgotPassword', { email }).then(() => undefined),
  resetPassword: (email: string, resetCode: string, newPassword: string) =>
    http.post('/auth/resetPassword', { email, resetCode, newPassword }).then(() => undefined),
};

// Sign-in with a provider is a full-page navigation (to the provider and back), not an API call.
export function externalSignInUrl(provider: string, returnTo: string) {
  const query = new URLSearchParams({ returnTo });
  return `${import.meta.env.VITE_API_URL}/auth/external/${encodeURIComponent(provider.toLowerCase())}?${query.toString()}`;
}

export default authApi;
