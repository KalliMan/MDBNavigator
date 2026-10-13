import { v4 as uuidv4 } from 'uuid';
import { ConnectionSettings } from '../models/connect/connectionSettings';

let _cachedApplicationId: string | null = null;

export default abstract class LocalSessionStorage {

  public static getApplicationId(): string {
    if (!_cachedApplicationId) {
      _cachedApplicationId = sessionStorage.getItem('id');
      if (!_cachedApplicationId) {
        _cachedApplicationId = uuidv4();
        sessionStorage.setItem('id', _cachedApplicationId);
      }
    }
    return _cachedApplicationId;
  }

  public static storeConnectionSettings(connectionSettings: ConnectionSettings | undefined): void {
    if (!connectionSettings) {
      sessionStorage.removeItem('connectionSettings');
    }
    else {
      sessionStorage.setItem('connectionSettings', JSON.stringify(connectionSettings));
    }
  }

  public static getConnectionSettings(): ConnectionSettings | null {
    const val = sessionStorage.getItem('connectionSettings');
    if (!val) {
      return null;
    }

    return JSON.parse(val) as ConnectionSettings;
  }
}
