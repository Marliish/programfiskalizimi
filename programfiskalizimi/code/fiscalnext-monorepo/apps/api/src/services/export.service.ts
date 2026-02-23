// Accounting Export Service
// Supports QuickBooks IIF, Xero CSV, Generic Accounting CSV
// Created: 2026-02-23 - Day 7 Integration

import { prisma } from '@fiscalnext/database';
import { stringify } from 'csv-stringify/sync';

interface ExportOptions {
  startDate?: string;
  endDate?: string;
  format: 'quickbooks' | 'xero' | 'generic';
}

interface ExportData {
  customers?: any[];
  products?: any[];
  invoices?: any[];
  transactions?: any[];
}

export class ExportService {
  /**
   * Export data to QuickBooks IIF format
   */
  async exportToQuickBooks(options: ExportOptions): Promise<string> {
    const data = await this.fetchExportData(options);
    
    let iifContent = '!ACCNT\tNAME\tACCNTTYPE\n';
    iifContent += 'ACCNT\tSales\tINCOME\n';
    iifContent += 'ACCNT\tAccounts Receivable\tAR\n';
    iifContent += 'ACCNT\tCash\tBANK\n';
    iifContent += '!CUST\tNAME\tBADDR1\tBADDR2\tBADDR3\n';
    
    // Export customers
    for (const customer of data.customers || []) {
      iifContent += `CUST\t${customer.name}\t${customer.address || ''}\t${customer.city || ''}\t${customer.phone || ''}\n`;
    }
    
    iifContent += '!INVITEM\tNAME\tDESC\tPRICE\tACCNT\n';
    
    // Export products/items
    for (const product of data.products || []) {
      iifContent += `INVITEM\t${product.name}\t${product.description || ''}\t${product.price}\tSales\n`;
    }
    
    iifContent += '!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\n';
    iifContent += '!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\n';
    iifContent += '!ENDTRNS\n';
    
    // Export transactions
    for (const transaction of data.transactions || []) {
      const trnsId = transaction.id;
      const date = new Date(transaction.createdAt).toLocaleDateString('en-US');
      const customer = data.customers?.find(c => c.id === transaction.customerId);
      
      iifContent += `TRNS\t${trnsId}\tINVOICE\t${date}\tAccounts Receivable\t${customer?.name || 'Cash Sale'}\t${transaction.total}\n`;
      iifContent += `SPL\t${trnsId}\tINVOICE\t${date}\tSales\t-${transaction.total}\n`;
      iifContent += 'ENDTRNS\n';
    }
    
    return iifContent;
  }

  /**
   * Export data to Xero CSV format
   */
  async exportToXero(options: ExportOptions): Promise<string> {
    const data = await this.fetchExportData(options);
    
    const records = [];
    
    // Xero invoice format
    for (const transaction of data.transactions || []) {
      const customer = data.customers?.find(c => c.id === transaction.customerId);
      
      records.push({
        '*ContactName': customer?.name || 'Cash Sale',
        'EmailAddress': customer?.email || '',
        'POAddressLine1': customer?.address || '',
        'POCity': customer?.city || '',
        '*InvoiceNumber': `INV-${transaction.id}`,
        'Reference': transaction.receiptNumber || '',
        '*InvoiceDate': new Date(transaction.createdAt).toLocaleDateString('en-GB'),
        '*DueDate': new Date(transaction.createdAt).toLocaleDateString('en-GB'),
        'InventoryItemCode': '',
        '*Description': 'POS Sale',
        '*Quantity': '1',
        '*UnitAmount': transaction.subtotal || transaction.total,
        'Discount': transaction.discount || '0',
        '*AccountCode': '200', // Sales account
        '*TaxType': 'Tax on Sales',
        'TaxAmount': transaction.tax || '0',
        'TrackingName1': '',
        'TrackingOption1': '',
        'Currency': 'ALL', // Albanian Lek
      });
    }
    
    return stringify(records, { header: true });
  }

  /**
   * Export data to Generic Accounting CSV
   */
  async exportToGeneric(options: ExportOptions): Promise<string> {
    const data = await this.fetchExportData(options);
    
    const records = [];
    
    for (const transaction of data.transactions || []) {
      const customer = data.customers?.find(c => c.id === transaction.customerId);
      
      records.push({
        Date: new Date(transaction.createdAt).toISOString().split('T')[0],
        TransactionType: 'Sale',
        InvoiceNumber: transaction.receiptNumber || `TXN-${transaction.id}`,
        CustomerName: customer?.name || 'Cash Sale',
        CustomerCode: customer?.id || '',
        Subtotal: transaction.subtotal || transaction.total,
        Tax: transaction.tax || 0,
        Discount: transaction.discount || 0,
        Total: transaction.total,
        PaymentMethod: transaction.paymentMethod || 'cash',
        Status: transaction.status || 'completed',
        Notes: transaction.notes || '',
      });
    }
    
    return stringify(records, { header: true });
  }

  /**
   * Export customers to CSV
   */
  async exportCustomers(): Promise<string> {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    const records = customers.map(c => ({
      ID: c.id,
      Name: c.name,
      Email: c.email || '',
      Phone: c.phone || '',
      Address: c.address || '',
      City: c.city || '',
      TaxNumber: c.taxNumber || '',
      TotalSpent: 0, // Would need to calculate from transactions
      CreatedAt: c.createdAt.toISOString(),
    }));
    
    return stringify(records, { header: true });
  }

  /**
   * Export products to CSV
   */
  async exportProducts(): Promise<string> {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
    
    const records = products.map(p => ({
      ID: p.id,
      SKU: p.sku,
      Barcode: p.barcode || '',
      Name: p.name,
      Description: p.description || '',
      Category: p.category?.name || '',
      Price: p.price,
      Cost: p.cost || 0,
      Stock: p.stock || 0,
      Unit: p.unit || 'piece',
      TaxRate: p.taxRate || 20,
      Active: p.isActive,
      CreatedAt: p.createdAt.toISOString(),
    }));
    
    return stringify(records, { header: true });
  }

  /**
   * Export invoices to CSV
   */
  async exportInvoices(options: ExportOptions): Promise<string> {
    const where: any = {};
    
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate);
    }
    
    const receipts = await prisma.fiscalReceipt.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const records = [];
    
    for (const receipt of receipts) {
      for (const item of receipt.items) {
        records.push({
          ReceiptNumber: receipt.receiptNumber,
          Date: receipt.createdAt.toISOString().split('T')[0],
          CustomerName: receipt.customer?.name || 'Walk-in',
          ProductName: item.product?.name || item.name,
          Quantity: item.quantity,
          UnitPrice: item.price,
          Subtotal: item.subtotal,
          Tax: item.tax,
          Total: item.total,
          PaymentMethod: receipt.paymentMethod,
          Status: receipt.status,
        });
      }
    }
    
    return stringify(records, { header: true });
  }

  /**
   * Fetch data for export based on date range
   */
  private async fetchExportData(options: ExportOptions): Promise<ExportData> {
    const where: any = {};
    
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate);
    }
    
    const [customers, products, transactions] = await Promise.all([
      prisma.customer.findMany(),
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.fiscalReceipt.findMany({
        where,
        include: {
          items: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    
    return {
      customers,
      products,
      transactions,
    };
  }
}
