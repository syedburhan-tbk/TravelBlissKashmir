
import { 
  ref, 
  set, 
  get, 
  child,
  remove,
  serverTimestamp
} from 'firebase/database';
import { rtdb, auth } from '../lib/firebase';
import { Trip } from '../types';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Database Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

const QUOTATIONS_PATH = 'quotations';

/**
 * Recursively removes undefined values from an object to ensure it's safe for Firebase RTDB.
 */
function deepClean(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => deepClean(v));
  }

  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== undefined) {
      newObj[key] = deepClean(val);
    }
  });
  return newObj;
}

export const tripService = {
  async saveTrip(trip: Trip) {
    try {
      const tripRef = ref(rtdb, `${QUOTATIONS_PATH}/${trip.id}`);
      const cleanedTrip = deepClean(trip);
      await set(tripRef, {
        ...cleanedTrip,
        lastUpdated: serverTimestamp(),
        sharedAt: serverTimestamp(),
      });
      return true;
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        handleDatabaseError(error, OperationType.WRITE, `${QUOTATIONS_PATH}/${trip.id}`);
      }
      console.error("Error saving trip to RTDB:", error);
      return false;
    }
  },

  async getTrip(id: string): Promise<Trip | null> {
    try {
      // 1. Try local storage first (for the editor)
      const cached = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
      if (cached) {
        try {
          const trips = JSON.parse(cached);
          if (Array.isArray(trips)) {
            const found = trips.find((t: Trip) => t.id === id);
            if (found) return found;
          }
        } catch (e) {
          console.error('Failed to parse cached trips:', e);
        }
      }

      // 2. Try RTDB (for the client or secondary device)
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, `${QUOTATIONS_PATH}/${id}`));
      
      if (snapshot.exists()) {
        return snapshot.val() as Trip;
      }

      return null;
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        handleDatabaseError(error, OperationType.GET, `${QUOTATIONS_PATH}/${id}`);
      }
      console.error("Error fetching trip from RTDB:", error);
      return null;
    }
  },

  async getLeadsTrips(leadId: string): Promise<Trip[]> {
    try {
      // For RTDB, we'd typically use a query or fetch all and filter client-side for simplicity in this demo
      const dbRef = ref(rtdb, QUOTATIONS_PATH);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const allQuots = snapshot.val();
        return Object.values(allQuots).filter((t: any) => t.leadId === leadId) as Trip[];
      }
      return [];
    } catch (error) {
      console.error("Error fetching lead trips from RTDB:", error);
      return [];
    }
  },

  async deleteTrip(id: string) {
    try {
      const tripRef = ref(rtdb, `${QUOTATIONS_PATH}/${id}`);
      await remove(tripRef);
      return true;
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        handleDatabaseError(error, OperationType.DELETE, `${QUOTATIONS_PATH}/${id}`);
      }
      console.error("Error deleting trip from RTDB:", error);
      return false;
    }
  }
};
