
import { useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/storage';

/**
 * Hook to synchronize state across multiple tabs/components
 * when localStorage changes.
 */
export function useStorageSync<T>(
  key: string,
  stateValue: T,
  setState: (value: T) => void,
  fallbackValue: T
) {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // e.key is null if clear() was called
      if (e.key === key || e.key === null) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            // Only update if it's different to avoid loops (though storage event doesn't fire in the same tab)
            setState(parsed);
          } catch (err) {
            console.error(`Sync error for ${key}:`, err);
          }
        } else {
          // If newValue is null, the key was removed
          setState(fallbackValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, setState, fallbackValue]);
}
