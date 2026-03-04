// Receipt Generator - Creates formatted receipts for sharing
// Supports: WhatsApp, Print, Email

export interface ReceiptItem {
  name: string;
  quantity: number | string;
  unitPrice: number | string;
  total: number | string;
}

export interface ReceiptData {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessNUIS?: string; // Albanian tax ID
  transactionNumber: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  amountPaid?: number;
  change?: number;
  currency: string;
  cashierName?: string;
  customerName?: string;
  fiscalCode?: string; // IIC/FIC for fiscal compliance
  qrCode?: string;
}

// Format currency based on type
const formatCurrency = (amount: number | string | undefined, currency: string): string => {
  const symbols: Record<string, string> = {
    'ALL': 'L',
    'EUR': '€',
    'USD': '$',
  };
  const symbol = symbols[currency] || currency;
  const num = Number(amount) || 0;
  return `${symbol}${num.toFixed(2)}`;
};

// Generate text receipt for WhatsApp
export function generateWhatsAppReceipt(data: ReceiptData): string {
  const lines: string[] = [];
  const divider = '─'.repeat(30);
  
  // Header
  lines.push(`🧾 *${data.businessName}*`);
  if (data.businessAddress) {
    lines.push(`📍 ${data.businessAddress}`);
  }
  if (data.businessPhone) {
    lines.push(`📞 ${data.businessPhone}`);
  }
  if (data.businessNUIS) {
    lines.push(`🏢 NUIS: ${data.businessNUIS}`);
  }
  lines.push('');
  lines.push(divider);
  
  // Transaction info
  lines.push(`📋 *Faturë #${data.transactionNumber}*`);
  lines.push(`📅 ${data.date.toLocaleDateString('sq-AL')} ${data.date.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}`);
  if (data.cashierName) {
    lines.push(`👤 Kasijer: ${data.cashierName}`);
  }
  if (data.customerName) {
    lines.push(`🙋 Klient: ${data.customerName}`);
  }
  lines.push('');
  lines.push(divider);
  
  // Items
  lines.push('*ARTIKUJT:*');
  lines.push('');
  data.items.forEach((item) => {
    lines.push(`• ${item.name}`);
    lines.push(`  ${item.quantity} x ${formatCurrency(item.unitPrice, data.currency)} = ${formatCurrency(item.total, data.currency)}`);
  });
  lines.push('');
  lines.push(divider);
  
  // Totals
  lines.push(`Nëntotali: ${formatCurrency(data.subtotal, data.currency)}`);
  lines.push(`TVSH (${data.taxRate}%): ${formatCurrency(data.taxAmount, data.currency)}`);
  if (data.discount && data.discount > 0) {
    lines.push(`Zbritja: -${formatCurrency(data.discount, data.currency)}`);
  }
  lines.push('');
  lines.push(`*TOTALI: ${formatCurrency(data.total, data.currency)}*`);
  lines.push('');
  
  // Payment
  lines.push(divider);
  const paymentEmoji = data.paymentMethod.toLowerCase() === 'cash' ? '💵' : '💳';
  lines.push(`${paymentEmoji} Pagesa: ${data.paymentMethod === 'cash' ? 'Para në dorë' : 'Kartë'}`);
  if (data.amountPaid) {
    lines.push(`Paguar: ${formatCurrency(data.amountPaid, data.currency)}`);
  }
  if (data.change && data.change > 0) {
    lines.push(`Kusuri: ${formatCurrency(data.change, data.currency)}`);
  }
  
  // Fiscal info
  if (data.fiscalCode) {
    lines.push('');
    lines.push(divider);
    lines.push(`🔐 Kodi Fiskal: ${data.fiscalCode}`);
  }
  
  // Footer
  lines.push('');
  lines.push(divider);
  lines.push('✅ *Faleminderit për blerjen!*');
  lines.push('🙏 Ju mirëpresim përsëri!');
  
  return lines.join('\n');
}

// Generate plain text receipt for printing
export function generatePrintReceipt(data: ReceiptData): string {
  const lines: string[] = [];
  const width = 40;
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);
  
  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };
  
  const leftRight = (left: string, right: string) => {
    const space = width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
  };
  
  // Header
  lines.push(center(data.businessName.toUpperCase()));
  if (data.businessAddress) {
    lines.push(center(data.businessAddress));
  }
  if (data.businessPhone) {
    lines.push(center(`Tel: ${data.businessPhone}`));
  }
  if (data.businessNUIS) {
    lines.push(center(`NUIS: ${data.businessNUIS}`));
  }
  lines.push(doubleDivider);
  
  // Transaction info
  lines.push(`Fature #: ${data.transactionNumber}`);
  lines.push(`Data: ${data.date.toLocaleDateString('sq-AL')} ${data.date.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}`);
  if (data.cashierName) {
    lines.push(`Kasijer: ${data.cashierName}`);
  }
  if (data.customerName) {
    lines.push(`Klient: ${data.customerName}`);
  }
  lines.push(divider);
  
  // Items
  data.items.forEach((item) => {
    lines.push(item.name);
    lines.push(leftRight(
      `  ${item.quantity} x ${formatCurrency(item.unitPrice, data.currency)}`,
      formatCurrency(item.total, data.currency)
    ));
  });
  lines.push(divider);
  
  // Totals
  lines.push(leftRight('Nentotali:', formatCurrency(data.subtotal, data.currency)));
  lines.push(leftRight(`TVSH (${data.taxRate}%):`, formatCurrency(data.taxAmount, data.currency)));
  if (data.discount && data.discount > 0) {
    lines.push(leftRight('Zbritja:', `-${formatCurrency(data.discount, data.currency)}`));
  }
  lines.push(doubleDivider);
  lines.push(leftRight('TOTALI:', formatCurrency(data.total, data.currency)));
  lines.push(doubleDivider);
  
  // Payment
  lines.push(leftRight('Pagesa:', data.paymentMethod === 'cash' ? 'Para ne dore' : 'Karte'));
  if (data.amountPaid) {
    lines.push(leftRight('Paguar:', formatCurrency(data.amountPaid, data.currency)));
  }
  if (data.change && data.change > 0) {
    lines.push(leftRight('Kusuri:', formatCurrency(data.change, data.currency)));
  }
  
  // Fiscal
  if (data.fiscalCode) {
    lines.push(divider);
    lines.push(`Kodi Fiskal: ${data.fiscalCode}`);
  }
  
  // Footer
  lines.push('');
  lines.push(center('Faleminderit per blerjen!'));
  lines.push(center('Ju mirepresim perseri!'));
  lines.push('');
  
  return lines.join('\n');
}

// Share via WhatsApp
export function shareViaWhatsApp(receipt: string, phoneNumber?: string): void {
  const encodedReceipt = encodeURIComponent(receipt);
  
  let url: string;
  if (phoneNumber) {
    // Direct message to specific number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    url = `https://wa.me/${cleanNumber}?text=${encodedReceipt}`;
  } else {
    // Open WhatsApp with pre-filled message (user chooses contact)
    url = `https://wa.me/?text=${encodedReceipt}`;
  }
  
  window.open(url, '_blank');
}

// Share via WhatsApp Web (for desktop)
export function shareViaWhatsAppWeb(receipt: string): void {
  const encodedReceipt = encodeURIComponent(receipt);
  window.open(`https://web.whatsapp.com/send?text=${encodedReceipt}`, '_blank');
}

// Copy receipt to clipboard
export async function copyReceiptToClipboard(receipt: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(receipt);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

export default {
  generateWhatsAppReceipt,
  generatePrintReceipt,
  shareViaWhatsApp,
  shareViaWhatsAppWeb,
  copyReceiptToClipboard,
};
