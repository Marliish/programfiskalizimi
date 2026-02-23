import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export const initializeDatabase = async () => {
  db = await SQLite.openDatabaseAsync('fiscalnext.db');

  // Create tables for offline storage
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT,
      price REAL NOT NULL,
      category TEXT,
      stock INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total REAL NOT NULL,
      payment_method TEXT,
      items TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      synced INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      synced INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      retry_count INTEGER DEFAULT 0
    );
    
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_sales_synced ON sales(synced);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
  `);

  console.log('Database initialized');
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

// Database operations
export const db_operations = {
  // Products
  getProducts: async (search?: string) => {
    const db = getDatabase();
    if (search) {
      return await db.getAllAsync(
        'SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ?',
        [`%${search}%`, `%${search}%`]
      );
    }
    return await db.getAllAsync('SELECT * FROM products LIMIT 100');
  },

  getProductByBarcode: async (barcode: string) => {
    const db = getDatabase();
    return await db.getFirstAsync(
      'SELECT * FROM products WHERE barcode = ?',
      [barcode]
    );
  },

  upsertProduct: async (product: any) => {
    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO products 
       (id, name, barcode, price, category, stock, synced, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.barcode,
        product.price,
        product.category,
        product.stock,
        1,
        Math.floor(Date.now() / 1000),
      ]
    );
  },

  // Sales
  createSale: async (sale: any) => {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO sales (customer_id, total, payment_method, items, synced) 
       VALUES (?, ?, ?, ?, 0)`,
      [sale.customerId, sale.total, sale.paymentMethod, JSON.stringify(sale.items)]
    );
    return result.lastInsertRowId;
  },

  getUnsyncedSales: async () => {
    const db = getDatabase();
    return await db.getAllAsync('SELECT * FROM sales WHERE synced = 0');
  },

  markSaleSynced: async (id: number) => {
    const db = getDatabase();
    await db.runAsync('UPDATE sales SET synced = 1 WHERE id = ?', [id]);
  },

  // Sync queue
  addToSyncQueue: async (entityType: string, entityId: number, action: string, data: any) => {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO sync_queue (entity_type, entity_id, action, data) 
       VALUES (?, ?, ?, ?)`,
      [entityType, entityId, action, JSON.stringify(data)]
    );
  },

  getSyncQueue: async () => {
    const db = getDatabase();
    return await db.getAllAsync('SELECT * FROM sync_queue ORDER BY created_at ASC');
  },

  clearSyncQueue: async () => {
    const db = getDatabase();
    await db.runAsync('DELETE FROM sync_queue');
  },
};
