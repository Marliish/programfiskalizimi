// Offline Database Service using IndexedDB
// Stores transactions, products, and customers for offline use

const DB_NAME = 'fiscalnext_offline';
const DB_VERSION = 1;

interface OfflineTransaction {
  id: string;
  data: any;
  createdAt: Date;
  synced: boolean;
}

interface OfflineProduct {
  id: string;
  data: any;
  updatedAt: Date;
}

class OfflineDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Pending transactions queue
        if (!db.objectStoreNames.contains('pendingTransactions')) {
          const txStore = db.createObjectStore('pendingTransactions', { keyPath: 'id' });
          txStore.createIndex('synced', 'synced', { unique: false });
          txStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Cached products
        if (!db.objectStoreNames.contains('products')) {
          const prodStore = db.createObjectStore('products', { keyPath: 'id' });
          prodStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Cached customers
        if (!db.objectStoreNames.contains('customers')) {
          const custStore = db.createObjectStore('customers', { keyPath: 'id' });
          custStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Cached categories
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // App settings/config
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Transaction Queue Methods
  async queueTransaction(transaction: any): Promise<string> {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineTx: OfflineTransaction = {
      id,
      data: transaction,
      createdAt: new Date(),
      synced: false,
    };

    await this.put('pendingTransactions', offlineTx);
    return id;
  }

  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    return this.getAllByIndex('pendingTransactions', 'synced', false);
  }

  async markTransactionSynced(id: string): Promise<void> {
    const tx = await this.get('pendingTransactions', id);
    if (tx) {
      tx.synced = true;
      await this.put('pendingTransactions', tx);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.delete('pendingTransactions', id);
  }

  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingTransactions();
    return pending.length;
  }

  // Product Cache Methods
  async cacheProducts(products: any[]): Promise<void> {
    const tx = this.db!.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    
    for (const product of products) {
      store.put({
        id: product.id,
        data: product,
        updatedAt: new Date(),
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedProducts(): Promise<any[]> {
    const items = await this.getAll('products');
    return items.map((item: OfflineProduct) => item.data);
  }

  // Customer Cache Methods
  async cacheCustomers(customers: any[]): Promise<void> {
    const tx = this.db!.transaction('customers', 'readwrite');
    const store = tx.objectStore('customers');
    
    for (const customer of customers) {
      store.put({
        id: customer.id,
        data: customer,
        updatedAt: new Date(),
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedCustomers(): Promise<any[]> {
    const items = await this.getAll('customers');
    return items.map((item: any) => item.data);
  }

  // Category Cache Methods
  async cacheCategories(categories: any[]): Promise<void> {
    const tx = this.db!.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    
    // Clear existing
    store.clear();
    
    for (const category of categories) {
      store.put({ id: category.id, data: category });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedCategories(): Promise<any[]> {
    const items = await this.getAll('categories');
    return items.map((item: any) => item.data);
  }

  // Settings Methods
  async setSetting(key: string, value: any): Promise<void> {
    await this.put('settings', { key, value });
  }

  async getSetting(key: string): Promise<any> {
    const item = await this.get('settings', key);
    return item?.value;
  }

  // Generic CRUD helpers
  private async get(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async put(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getAll(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const stores = ['pendingTransactions', 'products', 'customers', 'categories'];
    for (const storeName of stores) {
      if (this.db) {
        const tx = this.db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
      }
    }
  }
}

export const offlineDb = new OfflineDatabase();
export default offlineDb;
