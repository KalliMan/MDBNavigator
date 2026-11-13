// The saved connection the user connected with last, so the dialog can open with it selected. Kept per browser:
// it is a convenience, so a blocked or cleared storage just means nothing is preselected. An id that isn't in
// the user's list (another account on the same browser) is ignored by the caller.
const KEY = 'mdbnavigator.lastUsedSavedConnection';

export function getLastUsedConnectionId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setLastUsedConnectionId(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // Storage blocked or full: nothing is remembered.
  }
}
