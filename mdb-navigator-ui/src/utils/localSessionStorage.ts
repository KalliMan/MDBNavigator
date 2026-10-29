import { v4 as uuidv4 } from 'uuid';

let _cachedTabId: string | null = null;

export default abstract class LocalSessionStorage {

  // Identifies this browser tab to the server (the "id" header and the result hub). sessionStorage is per tab, so
  // every tab gets its own id, and a reload keeps it.
  public static getTabId(): string {
    if (!_cachedTabId) {
      _cachedTabId = sessionStorage.getItem('id');
      if (!_cachedTabId) {
        _cachedTabId = uuidv4();
        sessionStorage.setItem('id', _cachedTabId);
      }
    }
    return _cachedTabId;
  }
}
