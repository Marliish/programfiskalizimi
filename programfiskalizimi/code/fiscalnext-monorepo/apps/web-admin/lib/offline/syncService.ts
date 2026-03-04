// Sync Service - Handles syncing offline data when back online
import { offlineDb } from './offlineDb';
import { transactionsApi, productsApi, customersApi, categoriesApi } from '../api';

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // Initialize and start auto-sync
  async init(): Promise<void> {
    await offlineDb.init();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.onOnline());
      window.addEventListener('offline', () => this.onOffline());
      
      // Initial cache if online
      if (navigator.onLine) {
        this.cacheEssentialData();
      }
      
      // Start periodic sync check
      this.startPeriodicSync();
    }
  }

  private onOnline(): void {
    console.log('[Sync] Back online - starting sync');
    this.syncPendingTransactions();
    this.cacheEssentialData();
  }

  private onOffline(): void {
    console.log('[Sync] Gone offline - transactions will be queued');
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncPendingTransactions();
      }
    }, 30000);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sync all pending transactions to server
  async syncPendingTransactions(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing || !navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let success = 0;
    let failed = 0;

    try {
      const pending = await offlineDb.getPendingTransactions();
      console.log(`[Sync] Found ${pending.length} pending transactions`);

      for (const tx of pending) {
        try {
          // Submit transaction to API
          const response = await transactionsApi.create(tx.data);
          
          if (response.data.success) {
            // Remove from queue after successful sync
            await offlineDb.deleteTransaction(tx.id);
            success++;
            console.log(`[Sync] Transaction ${tx.id} synced successfully`);
          } else {
            failed++;
            console.error(`[Sync] Transaction ${tx.id} failed:`, response.data.error);
          }
        } catch (error) {
          failed++;
          console.error(`[Sync] Transaction ${tx.id} error:`, error);
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { success, failed };
  }

  // Cache essential data for offline use
  async cacheEssentialData(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      // Cache products
      const productsRes = await productsApi.getAll({ limit: 1000 });
      if (productsRes.data.success) {
        await offlineDb.cacheProducts(productsRes.data.data || []);
        console.log('[Sync] Products cached');
      }

      // Cache categories
      const categoriesRes = await categoriesApi.getAll();
      if (categoriesRes.data.success) {
        await offlineDb.cacheCategories(categoriesRes.data.data || []);
        console.log('[Sync] Categories cached');
      }

      // Cache recent customers
      const customersRes = await customersApi.getAll({ limit: 100 });
      if (customersRes.data.success) {
        await offlineDb.cacheCustomers(customersRes.data.data || []);
        console.log('[Sync] Customers cached');
      }
    } catch (error) {
      console.error('[Sync] Failed to cache data:', error);
    }
  }

  // Get data with offline fallback
  async getProducts(): Promise<any[]> {
    if (navigator.onLine) {
      try {
        const res = await productsApi.getAll({ limit: 1000 });
        if (res.data.success) {
          await offlineDb.cacheProducts(res.data.data || []);
          return res.data.data || [];
        }
      } catch (error) {
        console.log('[Sync] Online fetch failed, using cache');
      }
    }
    return offlineDb.getCachedProducts();
  }

  async getCategories(): Promise<any[]> {
    if (navigator.onLine) {
      try {
        const res = await categoriesApi.getAll();
        if (res.data.success) {
          await offlineDb.cacheCategories(res.data.data || []);
          return res.data.data || [];
        }
      } catch (error) {
        console.log('[Sync] Online fetch failed, using cache');
      }
    }
    return offlineDb.getCachedCategories();
  }

  async getCustomers(): Promise<any[]> {
    if (navigator.onLine) {
      try {
        const res = await customersApi.getAll({ limit: 100 });
        if (res.data.success) {
          await offlineDb.cacheCustomers(res.data.data || []);
          return res.data.data || [];
        }
      } catch (error) {
        console.log('[Sync] Online fetch failed, using cache');
      }
    }
    return offlineDb.getCachedCustomers();
  }

  // Queue a transaction for later sync
  async queueTransaction(transaction: any): Promise<string> {
    const id = await offlineDb.queueTransaction(transaction);
    console.log(`[Sync] Transaction queued: ${id}`);
    return id;
  }

  // Get pending transaction count
  async getPendingCount(): Promise<number> {
    return offlineDb.getPendingCount();
  }

  // Check if online
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
}

export const syncService = new SyncService();
export default syncService;
