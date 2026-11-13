import { useCallback, useEffect, useState } from 'react';
import agent from '../../services/apiAgent';
import { SavedConnection } from '../../models/connect/savedConnection';

// The user's saved connections for the open dialog: loaded on mount, changed in place after a delete.
// Saving after a connect doesn't go through here: by then the dialog is closed (see ConnectToServer).
// enabled: false in the reconnect dialog, which then loads nothing (saved: [], isLoading: false).
export default function useSavedConnections(enabled: boolean): {
  saved: SavedConnection[];
  isLoading: boolean;
  loadFailed: boolean;
  // True when deleted; on failure the toast already explains it.
  remove: (id: string) => Promise<boolean>;
  // True when forgotten (the entry then shows hasPassword false); on failure the toast already explains it.
  forgetPassword: (id: string) => Promise<boolean>;
} {
  const [saved, setSaved] = useState<SavedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // The dialog may close before the answer comes: then the result is dropped.
    let cancelled = false;
    agent.savedConnectionsApi.list()
      .then(list => {
        if (!cancelled) {
          // Kept in the order the server returns it (by name).
          setSaved(list);
        }
      })
      .catch(() => {
        // apiAgent already showed a toast; the pane says it too, and the form still works.
        if (!cancelled) {
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await agent.savedConnectionsApi.remove(id);
      setSaved(list => list.filter(s => s.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const forgetPassword = useCallback(async (id: string): Promise<boolean> => {
    try {
      await agent.savedConnectionsApi.forgetPassword(id);
      setSaved(list => list.map(s => s.id === id ? { ...s, hasPassword: false } : s));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { saved, isLoading, loadFailed, remove, forgetPassword };
}
