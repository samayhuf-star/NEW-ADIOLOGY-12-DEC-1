// Local storage fallback for history when server is unavailable

const STORAGE_KEY = 'adiology-campaign-history';
const MAX_ITEMS = 30; // Limit to prevent quota issues

export interface HistoryItem {
  id: string;
  type: string;
  name: string;
  data: any;
  timestamp: string;
  status?: 'draft' | 'completed'; // Add status field for drafts vs completed items
  lastModified?: string; // Track when draft was last modified
}

// Helper to safely set localStorage with quota handling
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota') || error?.message?.includes('exceeded')) {
      console.warn('localStorage quota exceeded, attempting cleanup...');
      // Try to clear old data
      clearOldStorageData();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.warn('Still cannot save after cleanup, skipping localStorage save');
        return false;
      }
    }
    console.error('localStorage setItem error:', error);
    return false;
  }
}

// Clear old data from various storage keys to free up space
function clearOldStorageData(): void {
  const keysToClean = [
    'adiology-campaign-history',
    'adiology_analyses',
    'adiology_history',
    'campaign_drafts',
    'keyword_history',
  ];
  
  for (const key of keysToClean) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 10) {
          // Keep only most recent 10 items
          const trimmed = parsed.slice(-10);
          localStorage.setItem(key, JSON.stringify(trimmed));
          console.log(`Trimmed ${key} from ${parsed.length} to ${trimmed.length} items`);
        }
      }
    } catch (e) {
      // If we can't parse it, remove it entirely
      localStorage.removeItem(key);
    }
  }
}

export const localStorageHistory = {
  // Save an item to local storage
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<void> {
    try {
      let history = this.getAll();
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        type,
        name,
        data,
        timestamp: new Date().toISOString(),
        status,
        lastModified: new Date().toISOString()
      };
      
      history.push(newItem);
      
      // Trim to max items to prevent quota issues
      if (history.length > MAX_ITEMS) {
        history = history.slice(-MAX_ITEMS);
      }
      
      const saved = safeSetItem(STORAGE_KEY, JSON.stringify(history));
      if (saved) {
        console.log(`✅ Saved to local storage as ${status}:`, newItem.id);
      } else {
        console.warn('⚠️ Could not save to localStorage, continuing without local backup');
      }
    } catch (error) {
      console.warn('Failed to save to localStorage (non-critical):', error);
      // Don't throw - allow the app to continue
    }
  },

  // Update an existing item (for draft updates)
  // If item doesn't exist, creates a new one (upsert behavior)
  async update(id: string, data: any, name?: string): Promise<void> {
    try {
      const history = this.getAll();
      const itemIndex = history.findIndex(item => item.id === id);
      
      if (itemIndex >= 0) {
        // Update existing item
        history[itemIndex].data = data;
        history[itemIndex].lastModified = new Date().toISOString();
        if (name) {
          history[itemIndex].name = name;
        }
        safeSetItem(STORAGE_KEY, JSON.stringify(history));
        console.log('✅ Updated in local storage:', id);
      } else {
        // Item not found - create new item instead (upsert behavior)
        // This handles cases where localStorage was cleared or item was deleted
        const newItem: HistoryItem = {
          id,
          type: 'campaign', // Default type, can be inferred from data if needed
          name: name || 'Draft',
          data,
          timestamp: new Date().toISOString(),
          status: 'draft',
          lastModified: new Date().toISOString()
        };
        
        history.push(newItem);
        safeSetItem(STORAGE_KEY, JSON.stringify(history));
        console.log('✅ Created new item in local storage (item not found for update):', id);
      }
    } catch (error) {
      // Only log unexpected errors, not "item not found" since we handle it above
      if (error instanceof Error && !error.message.includes('Item not found')) {
        console.warn('Failed to update in localStorage:', error);
      }
      // Don't throw - gracefully handle the error
    }
  },

  // Mark a draft as completed
  async markAsCompleted(id: string): Promise<void> {
    try {
      const history = this.getAll();
      const itemIndex = history.findIndex(item => item.id === id);
      
      if (itemIndex >= 0) {
        history[itemIndex].status = 'completed';
        history[itemIndex].lastModified = new Date().toISOString();
        safeSetItem(STORAGE_KEY, JSON.stringify(history));
        console.log('✅ Marked as completed in local storage:', id);
      }
    } catch (error) {
      console.warn('Failed to mark as completed in localStorage:', error);
      // Don't throw - allow app to continue
    }
  },

  // Get all history items
  getAll(): HistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return [];
    }
  },

  // Delete an item by ID
  async delete(id: string): Promise<void> {
    try {
      const history = this.getAll();
      const filtered = history.filter(item => item.id !== id);
      safeSetItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('✅ Deleted from local storage:', id);
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error);
      // Don't throw - allow app to continue
    }
  },

  // Get items by type
  getByType(type: string): HistoryItem[] {
    return this.getAll().filter(item => item.type === type);
  },

  // Clear all history
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
