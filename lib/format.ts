import type {
  AccountType,
  CurrencyUnit,
  KycTier,
  RailType,
  ReconciliationStatus,
  SafeDealStatus,
  TransactionStatus,
} from './types';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function formatMoney(
  amountIrr: number,
  unit: CurrencyUnit,
  options?: { showUnit?: boolean; compact?: boolean }
): string {
  const showUnit = options?.showUnit ?? true;
  const converted = unit === 'TOMAN' ? Math.round(amountIrr / 10) : Math.round(amountIrr);
  const unitLabel = unit === 'TOMAN' ? 'تومان' : 'ریال';

  if (options?.compact && Math.abs(converted) >= 1_000_000_000) {
    const billions = (converted / 1_000_000_000).toFixed(2).replace(/\.00$/, '');
    return showUnit
      ? `${toPersianDigits(billions)} میلیارد ${unitLabel}`
      : `${toPersianDigits(billions)} میلیارد`;
  }

  const formatted = Math.abs(converted).toLocaleString('en-US');
  const sign = converted < 0 ? '−' : '';
  const persianNum = `${sign}${toPersianDigits(formatted)}`;
  return showUnit ? `${persianNum} ${unitLabel}` : persianNum;
}

export function formatCrypto(amount: number, symbol: string): string {
  const decimals = symbol === 'USDT' ? 2 : symbol === 'BTC' ? 5 : 4;
  return `${toPersianDigits(amount.toFixed(decimals))} ${symbol}`;
}

export function formatIbanSpaced(iban: string): string {
  const clean = iban.replace(/\s+/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

export function getKycTierLabel(tier: KycTier): string {
  switch (tier) {
    case 'TIER_1':
      return 'سطح ۱ (پایه)';
    case 'TIER_2':
      return 'سطح ۲ (احراز کامل)';
    case 'TIER_3':
      return 'سطح ۳ (سازمانی ویژه)';
  }
}

export function getAccountTypeLabel(type: AccountType): string {
  switch (type) {
    case 'CURRENT_GHARZOLHASANEH':
      return 'قرض‌الحسنه جاری تراز';
    case 'SHORT_TERM_DEPOSIT':
      return 'سپرده کوتاه‌مدت روزشمار';
    case 'TARAZ_SPECIAL_DEPOSIT':
      return 'سپرده ویژه تجاری تراز';
  }
}

export function getRailLabel(rail: RailType): string {
  switch (rail) {
    case 'SATNA':
      return 'ساتنا';
    case 'PAYA':
      return 'پایا';
    case 'POL':
      return 'پل (آنی)';
    case 'CARD_TO_CARD':
      return 'کارت‌به‌کارت';
    case 'INTERNAL':
      return 'درون‌بانکی';
    case 'ESCROW':
      return 'اتاق معامله امن';
    case 'SWAP':
      return 'تبدیل ارزی کیف پول';
  }
}

export function getTransactionStatusMeta(status: TransactionStatus): {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'SUCCESS':
      return {
        label: 'موفق و تسویه‌شده',
        colorClass: 'text-[#059669]',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
      };
    case 'PENDING_INQUIRY':
      return {
        label: 'در انتظار استعلام بانک',
        colorClass: 'text-[#D97706]',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
      };
    case 'FAILED':
      return {
        label: 'ناموفق',
        colorClass: 'text-[#DC2626]',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
      };
    case 'REVERSED':
      return {
        label: 'برگشت خورده به حساب',
        colorClass: 'text-[#475569]',
        bgClass: 'bg-slate-100',
        borderClass: 'border-slate-200',
      };
  }
}

export function getReconciliationLabel(status: ReconciliationStatus): string {
  switch (status) {
    case 'MATCHED':
      return 'تطبیق کامل';
    case 'NEEDS_INQUIRY':
      return 'نیازمند استعلام بانک';
    case 'RESOLVED_SETTLED':
      return 'مغایرت رفع شد (تسویه)';
    case 'RESOLVED_REVERSED':
      return 'مغایرت رفع شد (برگشت وجه)';
  }
}

export function getSafeDealStatusMeta(status: SafeDealStatus): {
  label: string;
  colorClass: string;
  bgClass: string;
} {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'در انتظار تامین وجه',
        colorClass: 'text-[#475569]',
        bgClass: 'bg-slate-100',
      };
    case 'FUNDED':
      return {
        label: 'وجه بلوکه‌شده در ضمانت',
        colorClass: 'text-[#0A2540]',
        bgClass: 'bg-blue-50',
      };
    case 'OBLIGATION_SUBMITTED':
      return {
        label: 'تحویل تعهدات (در انتظار تایید)',
        colorClass: 'text-[#D97706]',
        bgClass: 'bg-amber-50',
      };
    case 'RELEASED':
      return {
        label: 'آزادسازی و تسویه کامل',
        colorClass: 'text-[#059669]',
        bgClass: 'bg-emerald-50',
      };
    case 'DISPUTED':
      return {
        label: 'اختلاف ثبت‌شده (بررسی عملیات)',
        colorClass: 'text-[#DC2626]',
        bgClass: 'bg-red-50',
      };
  }
}

export function calculateRailFeeIrr(rail: RailType, amountIrr: number): number {
  switch (rail) {
    case 'INTERNAL':
      return 0;
    case 'PAYA':
      return Math.min(Math.max(Math.round(amountIrr * 0.0001), 2400), 25000);
    case 'SATNA':
      return Math.min(Math.max(Math.round(amountIrr * 0.0002), 50000), 250000);
    case 'POL':
      return Math.min(Math.max(Math.round(amountIrr * 0.0002), 5000), 100000);
    case 'CARD_TO_CARD':
      return amountIrr <= 10_000_000 ? 7200 : 7200 + Math.ceil((amountIrr - 10_000_000) / 10_000_000) * 2880;
    default:
      return 0;
  }
}
