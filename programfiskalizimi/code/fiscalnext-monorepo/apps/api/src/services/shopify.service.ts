// Shopify Integration Service
import axios, { AxiosInstance } from 'axios';
import { integrationService } from './integration.service';

export interface ShopifyConfig {
  shopUrl: string; // mystore.myshopify.com
  apiKey: string;
  apiPassword: string;
  apiVersion?: string; // Default: 2024-01
}

export interface ShopifyProduct {
  id?: string;
  title: string;
  description?: string;
  vendor?: string;
  productType?: string;
  variants: ShopifyVariant[];
  images?: string[];
  tags?: string[];
}

export interface ShopifyVariant {
  id?: string;
  title: string;
  price: number;
  sku?: string;
  inventoryQuantity?: number;
  weight?: number;
  weightUnit?: string;
}

export interface ShopifyOrder {
  id?: string;
  email?: string;
  totalPrice: number;
  lineItems: ShopifyLineItem[];
  customer?: any;
  shippingAddress?: any;
  billingAddress?: any;
}

export interface ShopifyLineItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  title: string;
}

export class ShopifyService {
  private client: AxiosInstance | null = null;
  private integrationId: string | null = null;

  /**
   * Initialize Shopify client
   */
  async initialize(integrationId: string): Promise<void> {
    const integration = await integrationService.getIntegration(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const config = integration.config as ShopifyConfig;
    this.integrationId = integrationId;

    this.client = axios.create({
      baseURL: `https://${config.shopUrl}/admin/api/${config.apiVersion || '2024-01'}`,
      auth: {
        username: config.apiKey,
        password: config.apiPassword,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Sync products from Shopify
   */
  async syncProducts(integrationId: string): Promise<{ imported: number; updated: number; errors: string[] }> {
    await this.initialize(integrationId);
    
    const stats = { imported: 0, updated: 0, errors: [] };

    try {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.client!.get('/products.json', {
          params: { limit: 250, page },
        });

        const products = response.data.products || [];
        
        for (const product of products) {
          try {
            await this.importProduct(product);
            stats.imported++;
          } catch (error) {
            stats.errors.push(`Product ${product.id}: ${error.message}`);
          }
        }

        hasMore = products.length === 250;
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
  private async importProduct(shopifyProduct: any): Promise<void> {
    // Would integrate with product service to create/update product
    console.log('Importing product:', shopifyProduct.title);
    
    // Example mapping:
    const product = {
      name: shopifyProduct.title,
      description: shopifyProduct.body_html,
      sku: shopifyProduct.variants[0]?.sku,
      price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
      inventory: shopifyProduct.variants[0]?.inventory_quantity || 0,
      externalId: shopifyProduct.id.toString(),
      source: 'shopify',
    };

    // Create or update in local database
    // await productService.createOrUpdate(product);
  }

  /**
   * Sync orders from Shopify
   */
  async syncOrders(integrationId: string, since?: Date): Promise<{ imported: number; errors: string[] }> {
    await this.initialize(integrationId);
    
    const stats = { imported: 0, errors: [] };

    try {
      const params: any = { limit: 250, status: 'any' };
      if (since) {
        params.created_at_min = since.toISOString();
      }

      const response = await this.client!.get('/orders.json', { params });
      const orders = response.data.orders || [];

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
  private async importOrder(shopifyOrder: any): Promise<void> {
    console.log('Importing order:', shopifyOrder.id);
    
    // Would integrate with transaction/POS service
    const order = {
      externalId: shopifyOrder.id.toString(),
      source: 'shopify',
      total: parseFloat(shopifyOrder.total_price),
      status: shopifyOrder.financial_status,
      items: shopifyOrder.line_items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
      customer: shopifyOrder.customer,
    };

    // Create transaction in local database
    // await transactionService.createFromExternal(order);
  }

  /**
   * Update inventory in Shopify
   */
  async updateInventory(
    integrationId: string,
    updates: Array<{ sku: string; quantity: number }>
  ): Promise<{ updated: number; errors: string[] }> {
    await this.initialize(integrationId);
    
    const stats = { updated: 0, errors: [] };

    try {
      for (const update of updates) {
        try {
          // First, find the variant by SKU
          const searchResponse = await this.client!.get('/variants.json', {
            params: { sku: update.sku },
          });

          const variant = searchResponse.data.variants?.[0];
          if (!variant) {
            stats.errors.push(`SKU not found: ${update.sku}`);
            continue;
          }

          // Get inventory item ID
          const inventoryItemId = variant.inventory_item_id;

          // Get inventory levels
          const levelsResponse = await this.client!.get('/inventory_levels.json', {
            params: { inventory_item_ids: inventoryItemId },
          });

          const level = levelsResponse.data.inventory_levels?.[0];
          if (!level) {
            stats.errors.push(`Inventory level not found for SKU: ${update.sku}`);
            continue;
          }

          // Update inventory
          await this.client!.post('/inventory_levels/set.json', {
            location_id: level.location_id,
            inventory_item_id: inventoryItemId,
            available: update.quantity,
          });

          stats.updated++;
        } catch (error) {
          stats.errors.push(`${update.sku}: ${error.message}`);
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
   * Create product in Shopify
   */
  async createProduct(integrationId: string, product: ShopifyProduct): Promise<any> {
    await this.initialize(integrationId);

    try {
      const response = await this.client!.post('/products.json', {
        product: {
          title: product.title,
          body_html: product.description,
          vendor: product.vendor,
          product_type: product.productType,
          variants: product.variants.map(v => ({
            title: v.title,
            price: v.price,
            sku: v.sku,
            inventory_quantity: v.inventoryQuantity || 0,
          })),
          tags: product.tags?.join(','),
        },
      });

      await integrationService.logAction(
        integrationId,
        'create_product',
        'success',
        `Product created: ${product.title}`
      );

      return response.data.product;
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
   * Sync customers from Shopify
   */
  async syncCustomers(integrationId: string): Promise<{ imported: number; errors: string[] }> {
    await this.initialize(integrationId);
    
    const stats = { imported: 0, errors: [] };

    try {
      const response = await this.client!.get('/customers.json', {
        params: { limit: 250 },
      });

      const customers = response.data.customers || [];

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
  private async importCustomer(shopifyCustomer: any): Promise<void> {
    console.log('Importing customer:', shopifyCustomer.email);
    
    // Would integrate with customer service
    const customer = {
      externalId: shopifyCustomer.id.toString(),
      source: 'shopify',
      email: shopifyCustomer.email,
      firstName: shopifyCustomer.first_name,
      lastName: shopifyCustomer.last_name,
      phone: shopifyCustomer.phone,
      totalSpent: parseFloat(shopifyCustomer.total_spent || '0'),
    };

    // Create or update in local database
    // await customerService.createOrUpdate(customer);
  }

  /**
   * Get webhook topics
   */
  getWebhookTopics(): string[] {
    return [
      'orders/create',
      'orders/updated',
      'orders/paid',
      'orders/cancelled',
      'products/create',
      'products/update',
      'products/delete',
      'inventory_levels/update',
      'customers/create',
      'customers/update',
    ];
  }

  /**
   * Register webhook
   */
  async registerWebhook(integrationId: string, topic: string, address: string): Promise<any> {
    await this.initialize(integrationId);

    try {
      const response = await this.client!.post('/webhooks.json', {
        webhook: {
          topic,
          address,
          format: 'json',
        },
      });

      await integrationService.logAction(
        integrationId,
        'register_webhook',
        'success',
        `Webhook registered: ${topic}`
      );

      return response.data.webhook;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'register_webhook',
        'error',
        `Failed to register webhook: ${error.message}`
      );
      throw error;
    }
  }
}

export const shopifyService = new ShopifyService();
