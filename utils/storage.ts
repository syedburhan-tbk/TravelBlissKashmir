
/**
 * Safe localStorage wrapper that handles QuotaExceededError
 */

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
  VARIATIONS: 'et_variations'
};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn(`Storage quota exceeded for ${key}. Attempting to prune...`);
        return pruneAndRetry(key, value);
      }
      console.error(`Direct error saving ${key}:`, e);
      return false;
    }
  },

  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing ${key}:`, e);
    }
  }
};

/**
 * If quota is exceeded, try to delete older or less critical data
 */
function pruneAndRetry(key: string, value: string): boolean {
  try {
    // Priority 1: Clear non-essential log/stat data
    const nonEssentialKeys = [
      STORAGE_KEYS.MESSAGE_LOGS,
      STORAGE_KEYS.DASHBOARD_STATS,
      STORAGE_KEYS.TRANSACTIONS
    ];
    let freedNonEssential = false;
    nonEssentialKeys.forEach(k => {
      if (localStorage.getItem(k)) {
        localStorage.removeItem(k);
        freedNonEssential = true;
      }
    });
    
    if (freedNonEssential) {
      try {
        localStorage.setItem(key, value);
        console.warn('Freed non-essential data and retried successfully.');
        return true;
      } catch (e) {
        console.info('Still full after clearing non-essential data');
      }
    }

    // Priority 2: Aggressively prune Destination Assets (typically the bulk)
    const destImagesKey = STORAGE_KEYS.DEST_IMAGES;
    const destImagesRaw = localStorage.getItem(destImagesKey);
    if (destImagesRaw) {
      console.warn('Aggressively pruning destination assets...');
      // If we are trying to save destination images, we keep only the new one? 
      // No, let's keep only 3 most recent globally if we are saving something else.
      // If we ARE saving dest_images, this logic is tricky.
      if (key === destImagesKey) {
        try {
          const newImages = JSON.parse(value);
          if (Array.isArray(newImages)) {
            // Keep only latest 10 if quota fails
            const sliced = JSON.parse(JSON.stringify(newImages.slice(-10)));
            localStorage.setItem(destImagesKey, JSON.stringify(sliced));
            return true;
          }
        } catch (e) {
          console.error('Failed to prune destination images:', e);
        }
      } else {
        localStorage.removeItem(destImagesKey);
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (e) {
          console.info('Still full after removing destination images');
        }
      }
    }

    // Priority 3: Prune ALL versions from ALL trips in storage
    const tripsKey = STORAGE_KEYS.TRIPS;
    const tripsRaw = localStorage.getItem(tripsKey);
    if (tripsRaw) {
      console.warn('Pruning ALL trip versions and itinerary images globally...');
      try {
        let trips = JSON.parse(tripsRaw);
        if (key === tripsKey) trips = JSON.parse(value);
        
        if (Array.isArray(trips)) {
          const stripped = trips.map(t => ({
            ...t,
            versions: [],
            itinerary: (t.itinerary || []).map((day: any) => ({
              ...day,
              images: [] 
            }))
          }));
          localStorage.setItem(tripsKey, JSON.stringify(stripped));
          
          // If we weren't saving trips, try to save the original key now
          if (key !== tripsKey) {
            localStorage.setItem(key, value);
          }
          return true;
        }
      } catch (e) {
        console.error('Failed to prune trips:', e);
      }
    }

    // Priority 4: Clear Custom Templates
    const templatesKey = STORAGE_KEYS.TEMPLATES;
    if (localStorage.getItem(templatesKey)) {
      console.warn('Clearing custom templates...');
      localStorage.removeItem(templatesKey);
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.info('Still full after clearing templates');
      }
    }

    // Final Attempt: No-op or fail
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('Final aggressive pruning failed to free enough space.');
      if (typeof window !== 'undefined') {
        alert('Browser storage is critically full even after cleaning. Please delete images or historical trips to proceed.');
      }
      return false;
    }
  } catch (e) {
    console.error('Fatal error during pruning:', e);
    return false;
  }
}
