import { localStorageHistory, HistoryItem } from './localStorageHistory';

/**
 * History service using localStorage for reliable storage
 * Provides a consistent API for saving and retrieving keyword plans, mixer results, etc.
 */
export const historyService = {
  /**
   * Save a history item
   * Uses localStorage directly for reliability
   */
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<string> {
    // Use localStorage directly for reliability
    await localStorageHistory.save(type, name, data, status);
    const items = localStorageHistory.getAll();
    const savedItem = items[items.length - 1];
    console.log('✅ Saved to localStorage:', savedItem?.id);
    return savedItem?.id || crypto.randomUUID();
  },

  /**
   * Update an existing item (for drafts)
   * If item doesn't exist, creates a new one (upsert behavior)
   */
  async update(id: string, data: any, name?: string): Promise<void> {
    await localStorageHistory.update(id, data, name);
  },

  /**
   * Mark a draft as completed
   */
  async markAsCompleted(id: string): Promise<void> {
    await localStorageHistory.markAsCompleted(id);
  },

  /**
   * Get all history items
   * Uses localStorage directly for reliability
   */
  async getAll(): Promise<HistoryItem[]> {
    // Always use localStorage for reliability - it's the most stable storage
    try {
      const localItems = localStorageHistory.getAll();
      // Validate and sanitize localStorage items
      return localItems.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        type: item.type || 'unknown',
        name: item.name || 'Unnamed',
        data: item.data || {},
        timestamp: item.timestamp || new Date().toISOString(),
        status: item.status || 'completed',
        lastModified: item.lastModified,
      }));
    } catch (localError) {
      console.error('Failed to load from localStorage:', localError);
      return [];
    }
  },

  /**
   * Get history (alias for getAll that returns the expected format)
   */
  async getHistory(): Promise<{ history: HistoryItem[] }> {
    const items = await this.getAll();
    return { history: items };
  },

  /**
   * Delete a history item
   */
  async delete(id: string): Promise<void> {
    await localStorageHistory.delete(id);
  },

  /**
   * Delete history (alias for delete)
   */
  async deleteHistory(id: string): Promise<void> {
    return this.delete(id);
  },

  /**
   * Get items by type
   */
  async getByType(type: string): Promise<HistoryItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.type === type);
  }
};