import { config } from '../config';

/**
 * Format Amount as Currency (Default INR ₹)
 */
export const formatCurrency = (amount, symbol = config.defaultCurrency) => {
  const num = Number(amount) || 0;
  return `${symbol} ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format Date to readable format (e.g. 08 Sep 2026, 04:30 PM)
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return date.toLocaleDateString('en-IN', options);
};

/**
 * Color and Badge Style mappings for Repair Statuses
 */
export const getRepairStatusBadge = (status) => {
  switch (status) {
    case 'Received':
      return {
        bg: 'bg-blue-100 dark:bg-blue-950/60',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800'
      };
    case 'Diagnosing':
      return {
        bg: 'bg-indigo-100 dark:bg-indigo-950/60',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800'
      };
    case 'Waiting Approval':
      return {
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800'
      };
    case 'Waiting Parts':
      return {
        bg: 'bg-orange-100 dark:bg-orange-950/60',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800'
      };
    case 'Repairing':
      return {
        bg: 'bg-purple-100 dark:bg-purple-950/60',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800'
      };
    case 'Quality Check':
      return {
        bg: 'bg-cyan-100 dark:bg-cyan-950/60',
        text: 'text-cyan-700 dark:text-cyan-400',
        border: 'border-cyan-200 dark:border-cyan-800'
      };
    case 'Ready Pickup':
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800'
      };
    case 'Delivered':
      return {
        bg: 'bg-green-100 dark:bg-green-950/60',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800'
      };
    case 'Cancelled':
      return {
        bg: 'bg-rose-100 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800'
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700'
      };
  }
};

/**
 * Generate Direct WhatsApp Share URL for Invoices & Repair Updates
 */
export const generateWhatsAppBillLink = (phone, bill, shopSettings = {}) => {
  if (!phone) return null;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const countryCode = config.defaultCountryCode || '91';
  const formattedPhone = cleanPhone.length === 10 ? `${countryCode}${cleanPhone}` : cleanPhone;

  const shopName = shopSettings.shopName || config.appName;
  const currency = shopSettings.currencySymbol || config.defaultCurrency;

  const message = `Hello *${bill.customerSnapshot?.name || 'Customer'}*,\n\n` +
    `Thank you for shopping at *${shopName}*!\n` +
    `🧾 *Invoice No:* ${bill.invoiceNumber}\n` +
    `📅 *Date:* ${formatDate(bill.date || bill.createdAt)}\n` +
    `💰 *Grand Total:* ${currency} ${Number(bill.grandTotal).toFixed(2)}\n` +
    `💳 *Payment Mode:* ${bill.paymentMode}\n` +
    (bill.dueAmount > 0 ? `⚠️ *Due Balance:* ${currency} ${Number(bill.dueAmount).toFixed(2)}\n` : `✅ *Status:* Paid in Full\n`) +
    `\nFor any assistance or queries, please contact us at ${shopSettings.phone || ''}.\nHave a wonderful day!`;

  return `${config.whatsAppBaseUrl}/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generate WhatsApp Link for Repair Job Status Update
 */
export const generateWhatsAppRepairLink = (repair, shopSettings = {}) => {
  const phone = repair.customerDetails?.phone;
  if (!phone) return null;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const countryCode = config.defaultCountryCode || '91';
  const formattedPhone = cleanPhone.length === 10 ? `${countryCode}${cleanPhone}` : cleanPhone;

  const shopName = shopSettings.shopName || config.appName;
  const currency = shopSettings.currencySymbol || config.defaultCurrency;

  const message = `Hello *${repair.customerDetails?.name || 'Customer'}*,\n\n` +
    `Update on your repair job at *${shopName}*:\n` +
    `🔧 *Ticket No:* ${repair.ticketNumber}\n` +
    `💻 *Device:* ${repair.deviceDetails?.brand} ${repair.deviceDetails?.model}\n` +
    `📌 *Current Status:* *${repair.status.toUpperCase()}*\n` +
    `💵 *Estimate/Total:* ${currency} ${Number(repair.financials?.grandTotal || repair.financials?.estimatedCost || 0).toFixed(2)}\n` +
    (repair.status === 'Ready Pickup' ? `🎉 *Your device is ready for pickup!* Please collect it during shop hours.\n` : '') +
    `\nHelpline: ${shopSettings.phone || ''}`;

  return `${config.whatsAppBaseUrl}/${formattedPhone}?text=${encodeURIComponent(message)}`;
};
