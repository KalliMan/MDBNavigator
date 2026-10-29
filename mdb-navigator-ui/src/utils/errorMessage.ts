import { AxiosError } from 'axios';

// The API answers with { message } (ExceptionMiddleware); ASP.NET itself may answer with ProblemDetails
// ({ title, detail, errors }) or plain text. Returns a readable message for any of these.
export function getResponseErrorMessage(data: unknown, status: number): string {
  if (status === 401) {
    // The app shows the sign-in page meanwhile; this text stays on whatever the request was for (e.g. a query tab).
    return 'Your session had ended, so this didn\'t run. Please try again now that you are signed in.';
  }
  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  if (data && typeof data === 'object') {
    const body = data as { message?: string; detail?: string; title?: string; errors?: Record<string, string[] | string> };
    if (body.errors) {
      const messages = Object.values(body.errors).flat().filter(Boolean);
      if (messages.length > 0) {
        return messages.join('\n');
      }
    }
    if (body.message) return body.message;
    if (body.detail) return body.detail;
    if (body.title) return body.title;
  }
  return `Request failed (${status})`;
}

// For any caught error: prefer the server's explanation over axios' generic
// "Request failed with status code 400".
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response
      ? getResponseErrorMessage(error.response.data, error.response.status)
      : error.message;
  }
  return error instanceof Error ? error.message : 'Unknown error occurred';
}
