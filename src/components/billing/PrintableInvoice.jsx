import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PrintableInvoice = ({ bill, shopSettings = {} }) => {
  if (!bill) return null;

  const shopName = shopSettings.shopName || 'PC Doctor';
  const tagline = shopSettings.tagline || 'Computer, Laptop, CCTV & Networking Solutions';
  const phone = shopSettings.phone || '+91 98765 43210';
  const email = shopSettings.email || 'contact@pcdoctor.com';
  const address = shopSettings.address || '';
  const city = shopSettings.city || '';
  const state = shopSettings.state || '';
  const pincode = shopSettings.pincode || '';
  const fullAddress = [address, city, state, pincode].filter(Boolean).join(', ');
  const gstNumber = shopSettings.gstNumber;
  const currency = shopSettings.currencySymbol || '₹';

  return (
    <div
      id="printable-invoice"
      className="hidden print:block font-sans text-black bg-white p-6 max-w-4xl mx-auto"
      style={{ color: '#000', backgroundColor: '#fff' }}
    >
      {/* Invoice Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt={shopName}
            className="h-16 w-auto object-contain max-w-[120px]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{shopName}</h1>
            <p className="text-xs text-slate-600 font-medium">{tagline}</p>
            {fullAddress && <p className="text-[11px] text-slate-600 mt-0.5">{fullAddress}</p>}
            <p className="text-[11px] text-slate-600">
              <span>Phone: {phone}</span>
              {email && <span className="ml-2">| Email: {email}</span>}
            </p>
            {gstNumber && (
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                GSTIN: {gstNumber}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded">
            Tax Invoice
          </span>
          <p className="text-sm font-bold text-slate-900 mt-2">
            #{bill.invoiceNumber}
          </p>
          <p className="text-[11px] text-slate-600">
            Date: {formatDate(bill.date || bill.createdAt, true)}
          </p>
          <p className="text-[11px] text-slate-600 font-semibold">
            Payment Mode: <span className="uppercase">{bill.paymentMode || 'Cash'}</span>
          </p>
        </div>
      </div>

      {/* Customer / Billed To Section */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded mb-4 text-xs">
        <div>
          <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Billed To (Customer)</p>
          <p className="font-bold text-sm text-slate-900">{bill.customerSnapshot?.name || 'Walk-in Customer'}</p>
          {bill.customerSnapshot?.phone && (
            <p className="text-slate-700">Phone: {bill.customerSnapshot.phone}</p>
          )}
          {bill.customerSnapshot?.address && (
            <p className="text-slate-700">Address: {bill.customerSnapshot.address}</p>
          )}
          {bill.customerSnapshot?.gstNumber && (
            <p className="font-semibold text-slate-800">GSTIN: {bill.customerSnapshot.gstNumber}</p>
          )}
        </div>

        <div className="text-right">
          <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Billing Summary</p>
          <p className="text-slate-700">Invoice Type: Retail / Tax Invoice</p>
          <p className="text-slate-700">Status: <span className="font-bold text-emerald-700">{bill.status || 'Paid'}</span></p>
          {bill.dueAmount > 0 ? (
            <p className="font-bold text-rose-700">Due Balance: {currency} {Number(bill.dueAmount).toFixed(2)}</p>
          ) : (
            <p className="font-bold text-emerald-700">Fully Paid</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse text-xs mb-4">
        <thead>
          <tr className="bg-slate-900 text-white">
            <th className="border border-slate-800 p-2 text-center w-10 font-bold">#</th>
            <th className="border border-slate-800 p-2 text-left font-bold">Item Description</th>
            <th className="border border-slate-800 p-2 text-center w-14 font-bold">Qty</th>
            <th className="border border-slate-800 p-2 text-right w-24 font-bold">Rate ({currency})</th>
            <th className="border border-slate-800 p-2 text-center w-16 font-bold">GST %</th>
            <th className="border border-slate-800 p-2 text-right w-24 font-bold">Amount ({currency})</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="border border-slate-300 p-2 text-center text-slate-600">{index + 1}</td>
              <td className="border border-slate-300 p-2 font-medium text-slate-900">
                {item.name}
                {item.warranty && (
                  <span className="block text-[10px] text-slate-500">Warranty: {item.warranty}</span>
                )}
              </td>
              <td className="border border-slate-300 p-2 text-center font-bold text-slate-900">{item.qty}</td>
              <td className="border border-slate-300 p-2 text-right font-mono text-slate-800">
                {Number(item.unitPrice).toFixed(2)}
              </td>
              <td className="border border-slate-300 p-2 text-center text-slate-700">
                {item.gstRate ? `${item.gstRate}%` : '0%'}
              </td>
              <td className="border border-slate-300 p-2 text-right font-bold font-mono text-slate-900">
                {Number(item.total).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Totals & Signatures */}
      <div className="grid grid-cols-2 gap-6 pt-2 border-t-2 border-slate-800">
        {/* Left: Notes & Terms */}
        <div className="space-y-3 text-[11px] text-slate-600">
          <div>
            <p className="font-bold text-slate-900 uppercase text-[10px]">Terms & Conditions:</p>
            <ul className="list-disc list-inside space-y-0.5 mt-1 text-[10px]">
              <li>Goods once sold will not be returned or exchanged without original invoice.</li>
              <li>Manufacturer warranty terms apply on all branded components & parts.</li>
              <li>Physical damage and liquid damage are not covered under warranty.</li>
            </ul>
          </div>
          {shopSettings.invoiceFooter && (
            <p className="italic text-slate-700 font-medium">
              "{shopSettings.invoiceFooter}"
            </p>
          )}
        </div>

        {/* Right: Calculations */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-700 py-0.5">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{currency} {Number(bill.subTotal || 0).toFixed(2)}</span>
          </div>

          {bill.discountAmount > 0 && (
            <div className="flex justify-between text-rose-700 py-0.5">
              <span>Discount:</span>
              <span className="font-mono font-semibold">- {currency} {Number(bill.discountAmount).toFixed(2)}</span>
            </div>
          )}

          {bill.taxAmount > 0 && (
            <div className="flex justify-between text-slate-700 py-0.5">
              <span>Total GST:</span>
              <span className="font-mono font-semibold">{currency} {Number(bill.taxAmount).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
            <span>Grand Total:</span>
            <span className="font-mono">{currency} {Number(bill.grandTotal || 0).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-xs font-semibold text-slate-700 pt-1">
            <span>Amount Paid:</span>
            <span className="font-mono">{currency} {Number(bill.paidAmount || bill.grandTotal).toFixed(2)}</span>
          </div>

          {bill.dueAmount > 0 && (
            <div className="flex justify-between text-xs font-bold text-rose-700 py-0.5">
              <span>Due Balance:</span>
              <span className="font-mono">{currency} {Number(bill.dueAmount).toFixed(2)}</span>
            </div>
          )}

          {/* Signature Placeholder */}
          <div className="pt-10 text-right">
            <div className="inline-block border-t border-slate-400 pt-1 text-center min-w-[140px]">
              <p className="text-[10px] font-bold text-slate-800 uppercase">Authorized Signatory</p>
              <p className="text-[9px] text-slate-500">For {shopName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;
