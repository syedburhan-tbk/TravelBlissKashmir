
import * as idb from 'idb-keyval';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';

export const STORAGE_KEYS = {
  LEADS: 'et_leads',
  TRIPS: 'et_trips',
  TEMPLATES: 'et_templates',
  DEST_IMAGES: 'et_dest_images',
  HOTELS: 'et_hotels',
  VEHICLES: 'et_vehicles',
  ACTIVITIES: 'et_activities',
  ADDONS: 'et_addons',
  TEAM_MEMBERS: 'et_team_members',
  MESSAGE_LOGS: 'et_message_logs',
  TRANSACTIONS: 'et_transactions',
  MASTER_INCLUSIONS: 'et_master_inclusions',
  MASTER_EXCLUSIONS: 'et_master_exclusions',
  DASHBOARD_STATS: 'et_dashboard_stats',
  VARIATIONS: 'et_variations',
  BRAND_CONFIG: 'et_brand_config',
  API_KEYS: 'et_api_keys',
  MESSAGE_TEMPLATES: 'et_message_templates',
  DAYBOOK: 'et_daybook'
};

const memoryCache: Record<string, string> = {};
let isInitialized = false;
let currentWorkspaceId: string | null = null;
let unsubscribeSnapshot: (() => void) | null = null;

export const setWorkspaceIdForSync = (workspaceId: string | null) => {
  if (currentWorkspaceId === workspaceId) return;
  currentWorkspaceId = workspaceId;
  
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  
  if (workspaceId) {
    const storageRef = collection(db, `workspaces/${workspaceId}/storage`);
    unsubscribeSnapshot = onSnapshot(storageRef, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        const key = change.doc.id;
        if (change.type === 'added' || change.type === 'modified') {
          const val = change.doc.data().value;
          if (typeof val === 'string' && memoryCache[key] !== val) {
            memoryCache[key] = val;
            idb.set(key, val).catch(e => console.error(e));
            window.dispatchEvent(new StorageEvent('storage', {
              key: key,
              newValue: val
            }));
          }
        } else if (change.type === 'removed') {
          if (memoryCache[key] !== undefined) {
            delete memoryCache[key];
            idb.del(key).catch(e => console.error(e));
            window.dispatchEvent(new StorageEvent('storage', {
              key: key,
              newValue: null
            }));
          }
        }
      });
    }, (error) => {
      console.error("Storage sync snapshot error:", error);
    });
  }
};

export const initStorage = async () => {
  if (isInitialized) return;
  try {
    const keys = await idb.keys();
    // Also grab any legacy localStorage data and migrate it to IDB
    for (const key of Object.values(STORAGE_KEYS)) {
      const legacyValue = localStorage.getItem(key);
      if (legacyValue) {
        await idb.set(key, legacyValue);
        localStorage.removeItem(key);
      }
    }

    const allKeys = await idb.keys();
    for (const key of allKeys) {
      if (typeof key === 'string') {
        const val = await idb.get(key);
        if (typeof val === 'string') {
          memoryCache[key] = val;
        }
      }
    }
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    isInitialized = true; // Proceed anyway to unblock the app
  }
};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    return memoryCache[key] || null;
  },

  setItem: (key: string, value: string): boolean => {
    try {
      memoryCache[key] = value;
      // Fire-and-forget sync to IDB
      idb.set(key, value).then(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: key,
          newValue: value
        }));
      }).catch(e => {
        console.error(`Failed to save ${key} to IDB.`, e);
      });
      
      // Sync to Firebase if workspace is active
      if (currentWorkspaceId && key !== STORAGE_KEYS.DEST_IMAGES) {
        setDoc(doc(db, `workspaces/${currentWorkspaceId}/storage`, key), { value: value })
          .catch(e => console.error(`Failed to sync ${key} to Firebase:`, e));
      }
      return true;
    } catch (e) {
      console.error(`Direct error saving ${key}:`, e);
      return false;
    }
  },

  removeItem: (key: string) => {
    delete memoryCache[key];
    idb.del(key).then(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: key,
        newValue: null
      }));
    }).catch(e => console.error(`Failed to remove ${key} from IDB`, e));
    
    if (currentWorkspaceId && key !== STORAGE_KEYS.DEST_IMAGES) {
      deleteDoc(doc(db, `workspaces/${currentWorkspaceId}/storage`, key))
        .catch(e => console.error(`Failed to delete ${key} from Firebase:`, e));
    }
  }
};
