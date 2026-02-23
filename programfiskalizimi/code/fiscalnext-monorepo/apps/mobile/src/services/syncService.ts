import { api } from './apiClient';
import { db_operations } from '../database/init';

export const syncService = {
  syncAll: async () => {
    try {
      // 1. Upload pending changes
      await syncService.uploadPendingChanges();

      // 2. Download server updates
      await syncService.downloadUpdates();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  },

  uploadPendingChanges: async () => {
    // Get unsynced sales
    const unsyncedSales = await db_operations.getUnsyncedSales();

    for (const sale of unsyncedSales) {
      try {
        const items = JSON.parse(sale.items);
        await api.createSale({
          customerId: sale.customer_id,
          items: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          paymentMethod: sale.payment_method,
          total: sale.total,
        });

        // Mark as synced
        await db_operations.markSaleSynced(sale.id);
      } catch (error) {
        console.error(`Failed to sync sale ${sale.id}:`, error);
        // Continue with other sales
      }
    }

    // Process sync queue for other operations
    const queueItems = await db_operations.getSyncQueue();
    for (const item of queueItems) {
      try {
        const data = JSON.parse(item.data);
        // Process based on entity type and action
        // ... implement specific sync logic
      } catch (error) {
        console.error(`Failed to sync queue item ${item.id}:`, error);
      }
    }
  },

  downloadUpdates: async () => {
    try {
      // Download products (paginated)
      const productsResponse = await api.getProducts({ page: 1 });
      const products = productsResponse.data.data || productsResponse.data;

      // Update local database
      for (const product of products) {
        await db_operations.upsertProduct(product);
      }

      console.log(`Downloaded ${products.length} products`);
    } catch (error) {
      console.error('Failed to download updates:', error);
    }
  },

  // Manual sync trigger
  forceSyncNow: async () => {
    return syncService.syncAll();
  },
};
