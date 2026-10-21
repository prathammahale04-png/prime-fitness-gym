import React from 'react';
import { PaymentRecord, Member, MembershipPackage } from '../../types/database.types';
import { PRIME_GYM_DATA } from '../../data/primeGymData';
import { Printer, X, Download, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';

interface InvoiceModalProps {
  payment: PaymentRecord;
  member?: Member | null;
  packageDetails?: MembershipPackage | null;
  onClose: () => void;
}

// Helper to convert number to words in Indian numbering format
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  const integerPart = Math.floor(num);
  const words = inWords(integerPart).trim();
  return words ? `${words} Rupees Only` : 'Zero Rupees Only';
}

function formatPaymentMethod(method: string): string {
  switch (method) {
    case 'upi':
      return 'UPI / QR Code Transfer';
    case 'cash':
      return 'Cash (Front Desk Counter)';
    case 'card':
      return 'Debit / Credit Card (POS)';
    case 'bank_transfer':
      return 'Bank Transfer / NEFT / IMPS';
    default:
      return method.toUpperCase();
  }
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  payment,
  member,
  packageDetails,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const amountInWords = numberToIndianWords(payment.amount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs flex flex-col items-center justify-start py-6 px-4">
      {/* Top Controls Bar (Hidden during printing via no-print class) */}
      <div className="no-print w-full max-w-4xl bg-[#14161d] border border-neutral-800 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Billing</span>
          </button>
          <div className="border-l border-neutral-700 h-5" />
          <span className="text-xs text-neutral-400 font-mono">
            Invoice: <strong className="text-white">{payment.receipt_number}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-neutral-400 hidden md:inline">
            💡 Choose <span className="text-neutral-200 font-semibold">“Save as PDF”</span> in the destination menu to export
          </span>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-headline font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-[#f36b22]/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Close Invoice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable A4 Sheet Container */}
      <div
        id="printable-invoice"
        className="w-full max-w-4xl bg-white text-neutral-900 shadow-2xl rounded-sm p-8 sm:p-12 font-sans border border-neutral-300 print:border-none print:shadow-none print:p-0 print:max-w-none"
        style={{ minHeight: '270mm' }}
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-neutral-900 gap-6">
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#f36b22] text-white font-headline text-xs font-black tracking-widest uppercase rounded-xs">
                MH-19
              </span>
              <h1 className="font-headline font-black text-2xl sm:text-3xl tracking-tight text-neutral-950 uppercase">
                {PRIME_GYM_DATA.brandName}
              </h1>
            </div>
            <p className="text-[10px] font-headline font-bold text-neutral-500 uppercase tracking-wider">
              {PRIME_GYM_DATA.fullTitle}
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed pt-1">
              {PRIME_GYM_DATA.fullAddress}
            </p>
            <div className="text-xs text-neutral-600 pt-1 flex flex-wrap gap-x-4 gap-y-1 font-medium">
              <span>📞 {PRIME_GYM_DATA.phone}</span>
              <span>✉️ {PRIME_GYM_DATA.email}</span>
              <span>🕒 {PRIME_GYM_DATA.timings}</span>
            </div>
          </div>

          <div className="sm:text-right space-y-2 sm:self-start">
            <div className="inline-block px-3 py-1 bg-neutral-900 text-white font-headline font-black text-xs uppercase tracking-widest rounded-xs">
              TAX INVOICE & RECEIPT
            </div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-neutral-500 text-[11px] font-mono uppercase">Invoice No:</span>{' '}
                <span className="font-mono font-bold text-neutral-950 text-sm">
                  {payment.receipt_number}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 text-[11px] font-mono uppercase">Payment Date:</span>{' '}
                <span className="font-semibold text-neutral-900">
                  {payment.payment_date}
                </span>
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] uppercase tracking-wider rounded-xs font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>PAID IN FULL</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Member & Billing Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-neutral-200 text-xs">
          {/* Member Details */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-neutral-500 block">
              BILLED TO (MEMBER)
            </span>
            <div className="text-base font-bold text-neutral-950 uppercase tracking-tight">
              {payment.member_name}
            </div>
            {member?.member_code && (
              <div className="font-mono text-neutral-600">
                <span className="text-neutral-400">Member ID:</span>{' '}
                <strong className="text-neutral-900">{member.member_code}</strong>
              </div>
            )}
            {member?.phone && (
              <div className="text-neutral-600">
                <span className="text-neutral-400">Phone:</span> {member.phone}
              </div>
            )}
            {member?.email && (
              <div className="text-neutral-600">
                <span className="text-neutral-400">Email:</span> {member.email}
              </div>
            )}
            {member?.address && (
              <div className="text-neutral-600 leading-relaxed">
                <span className="text-neutral-400">Address:</span> {member.address}
              </div>
            )}
            {!member && (
              <div className="text-neutral-400 italic text-[11px]">
                Direct customer payment record
              </div>
            )}
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-1.5 sm:text-right">
            <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-neutral-500 block">
              PAYMENT SPECIFICATIONS
            </span>
            <div>
              <span className="text-neutral-400 text-[11px]">Payment Mode:</span>{' '}
              <strong className="text-neutral-900">{formatPaymentMethod(payment.payment_method)}</strong>
            </div>
            {payment.reference_id && (
              <div className="font-mono text-neutral-600">
                <span className="text-neutral-400">Txn / Ref No:</span>{' '}
                <span className="text-neutral-900 font-semibold">{payment.reference_id}</span>
              </div>
            )}
            {member?.status && (
              <div>
                <span className="text-neutral-400 text-[11px]">Member Status:</span>{' '}
                <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded-xs ${
                  member.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-700'
                }`}>
                  {member.status}
                </span>
              </div>
            )}
            {payment.created_at && (
              <div className="text-[10px] text-neutral-400 font-mono">
                System Timestamp: {new Date(payment.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-900 text-[10px] font-headline font-black uppercase tracking-wider text-neutral-700 bg-neutral-100/70">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Item / Service Particulars</th>
                <th className="py-2.5 px-3">Package Tier</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Membership Validity</th>
                <th className="py-2.5 px-3 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr>
                <td className="py-4 px-3 text-center font-mono text-neutral-500">1</td>
                <td className="py-4 px-3">
                  <div className="font-bold text-neutral-900">
                    Gym Membership & Athletic Facility Access
                  </div>
                  <div className="text-[11px] text-neutral-500 leading-relaxed mt-0.5">
                    {payment.notes ? payment.notes : 'Full commercial gym access, strength coaching & HYROX turf zone.'}
                  </div>
                </td>
                <td className="py-4 px-3 font-semibold text-neutral-900">
                  {member?.package_name || packageDetails?.name || 'Standard Tier'}
                </td>
                <td className="py-4 px-3 font-mono text-neutral-700">
                  {packageDetails?.duration_days
                    ? `${packageDetails.duration_days} Days`
                    : member?.package_name?.toLowerCase().includes('year')
                    ? '365 Days'
                    : member?.package_name?.toLowerCase().includes('3 month') || member?.package_name?.toLowerCase().includes('quarterly')
                    ? '90 Days'
                    : member?.package_name?.toLowerCase().includes('6 month')
                    ? '180 Days'
                    : '30 Days'}
                </td>
                <td className="py-4 px-3 font-mono text-neutral-700 text-[11px]">
                  {member?.start_date && member?.expiry_date ? (
                    <span>
                      {member.start_date} <br className="hidden sm:inline" />
                      <span className="text-neutral-400">to</span> {member.expiry_date}
                    </span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="py-4 px-3 text-right font-mono font-bold text-neutral-950 text-sm">
                  ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Block */}
        <div className="border-t-2 border-neutral-900 pt-4 flex flex-col sm:flex-row justify-between items-start gap-6 text-xs">
          <div className="space-y-2 max-w-md">
            <div>
              <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-neutral-500 block">
                AMOUNT IN WORDS
              </span>
              <p className="font-semibold text-neutral-900 italic capitalize">
                {amountInWords}
              </p>
            </div>

            {payment.notes && (
              <div className="pt-2 text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded-xs border border-neutral-200">
                <strong className="text-neutral-800">Transaction Notes:</strong> {payment.notes}
              </div>
            )}

            {member && (
              <div className="text-[11px] text-neutral-600">
                <span className="text-neutral-400">Total Membership Paid to Date:</span>{' '}
                <strong className="text-neutral-800 font-mono">₹{Number(member.amount_paid || payment.amount).toLocaleString('en-IN')}</strong>
              </div>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-2 border-t sm:border-t-0 pt-3 sm:pt-0">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal:</span>
              <span className="font-mono text-neutral-900">
                ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Applicable Taxes:</span>
              <span className="font-mono text-neutral-500 text-[11px]">Inclusive</span>
            </div>
            <div className="flex justify-between text-base font-bold text-neutral-950 border-t-2 border-neutral-900 pt-2">
              <span className="font-headline font-black uppercase">Total Paid:</span>
              <span className="font-mono text-[#f36b22] text-lg font-black">
                ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {member && member.balance_due !== undefined && (
              <div className="flex justify-between text-xs pt-1 border-t border-dashed border-neutral-300">
                <span className="text-neutral-500">Remaining Balance:</span>
                <span className={`font-mono font-bold ${member.balance_due > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {member.balance_due > 0
                    ? `₹${Number(member.balance_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : '₹0.00 (Cleared)'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Terms & Signatures */}
        <div className="mt-12 pt-6 border-t border-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-[10px] text-neutral-500 leading-relaxed">
          <div className="space-y-1">
            <p className="font-bold text-neutral-700 uppercase tracking-wider">
              Terms & Gym Policy
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Fees once paid are non-transferable and non-refundable under any circumstance.</li>
              <li>Athletes must observe gym code of conduct, rack weights, and wear clean athletic shoes.</li>
              <li>Present this digital receipt or your member code at entry reception upon renewal.</li>
            </ul>
          </div>

          <div className="flex justify-between sm:justify-end gap-10 items-end pt-8 sm:pt-0">
            <div className="text-center">
              <div className="w-36 border-b border-neutral-400 mb-1" />
              <span className="text-[10px] uppercase tracking-wider text-neutral-600">
                Member's Signature
              </span>
            </div>

            <div className="text-center">
              <div className="w-40 border-b border-neutral-400 mb-1 text-center font-editorial text-neutral-800 text-xs">
                Prime Fitness MH19
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-800 block">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>

        {/* System Watermark */}
        <div className="mt-8 pt-3 border-t border-neutral-200 text-center text-[9px] text-neutral-400 font-mono flex items-center justify-between">
          <span>PRIME FITNESS MH19 · SHIVAJI NAGAR, JALGAON</span>
          <span>COMPUTER-GENERATED OFFICIAL TAX RECEIPT · VALID WITHOUT PHYSICAL SEAL</span>
        </div>
      </div>
    </div>
  );
};
