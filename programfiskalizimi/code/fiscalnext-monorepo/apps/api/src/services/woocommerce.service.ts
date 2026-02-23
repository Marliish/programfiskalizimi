// WooCommerce Integration Service
import axios, { AxiosInstance } from 'axios';
import { integrationService } from './integration.service';

export interface WooCommerceConfig {
  siteUrl: string; // https://mystore.com
  consumerKey: string;
  consumerSecret: string;
  apiVersion?: string; // Default: wc/v3
}

export class WooCommerceService {
  private client: AxiosInstance | null = null;
  private integrationId: string | null = null;

  /**
   * Initialize WooCommerce client
   */
  async initialize(integrationId: string): Promise<void> {
    const integration = await integrationService.getIntegration(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const config = integration.config as WooCommerceConfig;
    this.integrationId = integrationId;

    this.client = axios.create({
      baseURL: `${config.siteUrl}/wp-json/${config.apiVersion || 'wc/v3'}`,
      auth: {
        username: config.consumerKey,
        password: config.consumerSecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Sync products from WooCommerce
   */
  async syncProducts(integrationId: string): Promise<{ imported: number; updated: number; errors: string[] }> {
    await this.initialize(integrationId);
    
    const stats = { imported: 0, updated: 0, errors: [] };

    try {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.client!.get('/products', {
          params: { per_page: 100, page },
        });

        const products = response.data || [];
        
        for (const product of products) {
          try {
            await this.importProduct(product);
            stats.imported++;
          } catch (error) {
            stats.errors.push(`Product ${product.id}: ${error.message}`);
          }
        }

        hasMore = products.length === 100;
        page++;
      }

      await integrationService.logAction(
        integrationId,
        'sync_products',
        'success',
        `Synced ${stats.imported} products`,
        stats
      );
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'sync_products',
        'error',
        `Product sync failed: ${error.message}`
      );
      throw error;
    }

    return stats;
  }

  /**
   * Import single product
   */
  private async importProduct(wcProduct: any): Promise<void> {
    console.log('Importing WooCommerce product:', wcProduct.name);
    
    const product = {
      name: wcProduct.name,
      description: wcProduct.description,
      sku: wcProduct.sku,
      price: parseFloat(wcProduct.price || '0'),
      inventory: wcProduct.stock_quantity || 0,
      externalId: wcProduct.id.toString(),
      source: 'woocommerce',
    };

    // Create or update in local database
    // await productService.createOrUpdate(product);
  }

  /**
   * Sync orders from WooCommerce
   */
  async syncOrders(integrationId: string, since?: Date): Promise<{ imported: number; errors: string[] }> {
    await this.initialize(integrationId);
    
    const stats = { imported: 0, errors: [] };

    try {
      const params: any = { per_page: 100, status: 'any' };
      if (since) {
        params.after = since.toISOString();
      }

      const response = await this.client!.get('/orders', { params });
      const orders = response.data || [];

      for (const order of orders) {
        try {
          await this.importOrder(order);
          stats.imported++;
        } catch (error) {
          stats.errors.push(`Order ${order.id}: ${error.message}`);
        }
      }

      await integrationService.logAction(
        integrationId,
        'sync_orders',
        'success',
        `Synced ${stats.imported} orders`,
        stats
      );
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'sync_orders',
        'error',
        `Order sync failed: ${error.message}`
      );
      throw error;
    }

    return stats;
  }

  /**
   * Import single order
   */
  private async importOrder(wcOrder: any): Promise<void> {
    console.log('Importing WooCommerce order:', wcOrder.id);
    
    const order = {
      externalId: wcOrder.id.toString(),
      source: 'woocommerce',
      total: parseFloat(wcOrder.total),
      status: wcOrder.status,
      items: wcOrder.line_items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
    };

    // Create transaction in local database
    // await transactionService.createFromExternal(order);
  }

  /**
   * Update inventory in WooCommerce
   */
  async updateInventory(
    integrationId: string,
    updates: Array<{ productId: string; quantity: number }>
  ): Promise<{ updated: number; errors: string[] }> {
    await this.initialize(integrationId);
    
    const stats = { updated: 0, errors: [] };

    try {
      for (const update of updates) {
        try {
          await this.client!.put(`/products/${update.productId}`, {
            stock_quantity: update.quantity,
          });
          stats.updated++;
        } catch (error) {
          stats.errors.push(`Product ${update.productId}: ${error.message}`);
        }
      }

      await integrationService.logAction(
        integrationId,
        'update_inventory',
        'success',
        `Updated ${stats.updated} inventory items`,
        stats
      );
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'update_inventory',
        'error',
        `Inventory update failed: ${error.message}`
      );
      throw error;
    }

    return stats;
  }

  /**
   * Create product in WooCommerce
   */
  async createProduct(integrationId: string, product: any): Promise<any> {
    await this.initialize(integrationId);

    try {
      const response = await this.client!.post('/products', {
        name: product.name,
        description: product.description,
        regular_price: product.price.toString(),
        sku: product.sku,
        stock_quantity: product.inventory,
        manage_stock: true,
      });

      await integrationService.logAction(
        integrationId,
        'create_product',
        'success',
        `Product created: ${product.name}`
      );

      return response.data;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'create_product',
        'error',
        `Failed to create product: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Sync customers from WooCommerce
   */
  async syncCustomers(integrationId: string): Promise<{ imported: number; errors: string[] }> {
    await this.initialize(integrationId);
    
    const stats = { imported: 0, errors: [] };

    try {
      const response = await this.client!.get('/customers', {
        params: { per_page: 100 },
      });

      const customers = response.data || [];

      for (const customer of customers) {
        try {
          await this.importCustomer(customer);
          stats.imported++;
        } catch (error) {
          stats.errors.push(`Customer ${customer.id}: ${error.message}`);
        }
      }

      await integrationService.logAction(
        integrationId,
        'sync_customers',
        'success',
        `Synced ${stats.imported} customers`,
        stats
      );
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'sync_customers',
        'error',
        `Customer sync failed: ${error.message}`
      );
      throw error;
    }

    return stats;
  }

  /**
   * Import single customer
   */
  private async importCustomer(wcCustomer: any): Promise<void> {
    console.log('Importing WooCommerce customer:', wcCustomer.email);
    
    const customer = {
      externalId: wcCustomer.id.toString(),
      source: 'woocommerce',
      email: wcCustomer.email,
      firstName: wcCustomer.first_name,
      lastName: wcCustomer.last_name,
    };

    // Create or update in local database
    // await customerService.createOrUpdate(customer);
  }
}

export const woocommerceService = new WooCommerceService();
