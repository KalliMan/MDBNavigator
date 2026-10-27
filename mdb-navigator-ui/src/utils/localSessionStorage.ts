import { v4 as uuidv4 } from 'uuid';

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
}
