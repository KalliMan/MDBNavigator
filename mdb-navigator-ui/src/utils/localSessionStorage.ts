import { v4 as uuidv4 } from 'uuid';
import { ConnectionSettings } from '../models/connect/connectionSettings';

export default abstract class LocalSessionStorage {

  public static getApplicationId(): string | null {
    if (!sessionStorage.getItem('id')) {
      sessionStorage.setItem('id', uuidv4());
    }

    return sessionStorage.getItem('id');
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
