'use client';

import { useState } from 'react';
import {
  Building2,
  Check,
  Copy,
  Loader2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  formatIbanSpaced,
  formatMoney,
  getAccountTypeLabel,
  toLatinDigits,
  toPersianDigits,
} from '@/lib/format';
import type { AccountType, CurrencyUnit, TarazStateSnapshot } from '@/lib/types';

interface AccountsModuleProps {
  data: TarazStateSnapshot;
  currencyUnit: CurrencyUnit;
  onStateUpdate: (next: TarazStateSnapshot) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

export function AccountsModule({
  data,
  currencyUnit,
  onStateUpdate,
  onNotify,
}: AccountsModuleProps) {
  const [title, setTitle] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('SHORT_TERM_DEPOSIT');
  const [initialAmountInput, setInitialAmountInput] = useState('10000000');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, value: string, label: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedId(id);
    onNotify(`${label} در حافظه کپی شد.`, 'success');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleOpenAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const numericInput = Number(toLatinDigits(initialAmountInput).replace(/[^\d]/g, '')) || 0;
      const initialDepositIrr = currencyUnit === 'TOMAN' ? numericInput * 10 : numericInput;

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          accountType,
          initialDepositIrr,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در افتتاح حساب.', 'error');
        return;
      }

      onStateUpdate(json.state);
      setTitle('');
      onNotify(
        `حساب جدید با شماره شبا ${json.account.iban} به‌صورت آنی از طریق BaaS افتتاح شد.`,
        'success'
      );
    } catch {
      onNotify('عدم برقراری ارتباط با سرویس افتتاح حساب.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">افتتاح حساب غیرحضوری و مدیریت سپرده‌ها</h1>
        <p className="text-sm text-[#475569] mt-1">
          افتتاح آنی سپرده بانکی با تخصیص شماره حساب و شبای اختصاصی از طریق زیرساخت BaaS بانک همکار
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Active Accounts List (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          {data.accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0A2540] text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A]">{acc.title}</h2>
                    <div className="text-xs text-[#475569] mt-0.5 flex items-center gap-1.5">
                      <span>{getAccountTypeLabel(acc.accountType)}</span>
                      <span aria-hidden="true">·</span>
                      <span>افتتاح: {acc.createdAt}</span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#059669]">
                  <ShieldCheck className="w-4 h-4" />
                  فعال و متصل به شتاب
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E2E8F0]">
                <div>
                  <div className="text-xs text-[#475569]">موجودی قابل برداشت</div>
                  <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
                    {formatMoney(acc.availableBalanceIrr, currencyUnit)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#475569]">موجودی بلوکه‌شده (امانی / استعلام)</div>
                  <div className="text-xl font-bold text-[#D97706] mt-1 tabular-nums">
                    {formatMoney(acc.blockedBalanceIrr, currencyUnit)}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[#E2E8F0] text-xs">
                <div className="flex items-center justify-between gap-2 bg-[#F1F5F9] px-3.5 py-2.5 rounded-lg">
                  <span className="text-[#475569] shrink-0">شماره شبا (IBAN):</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="dir-ltr font-bold text-[#0F172A] tabular-nums truncate">
                      {formatIbanSpaced(acc.iban)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${acc.id}-iban`, acc.iban, 'شماره شبا')}
                      className="p-1 text-[#475569] hover:text-[#0A2540] cursor-pointer shrink-0"
                      aria-label="کپی شبا"
                    >
                      {copiedId === `${acc.id}-iban` ? (
                        <Check className="w-3.5 h-3.5 text-[#059669]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-[#475569]">شماره حساب:</span>
                  <div className="flex items-center gap-2">
                    <span className="dir-ltr font-medium text-[#0F172A] tabular-nums">
                      {acc.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${acc.id}-num`, acc.accountNumber, 'شماره حساب')}
                      className="p-1 text-[#475569] hover:text-[#0A2540] cursor-pointer"
                      aria-label="کپی شماره حساب"
                    >
                      {copiedId === `${acc.id}-num` ? (
                        <Check className="w-3.5 h-3.5 text-[#059669]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instant Digital Account Opening Form (5 cols) */}
        <form
          onSubmit={handleOpenAccount}
          className="xl:col-span-5 bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5"
        >
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">درخواست افتتاح حساب آنی</h2>
            <p className="text-xs text-[#475569] mt-1">
              شماره حساب و شبای اختصاصی بلافاصله پس از ثبت درخواست صادر می‌شود.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              عنوان دلخواه حساب
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: حساب تنخواه پروژه یا سپرده فروش"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0A2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-2">نوع سپرده بانکی</label>
            <div className="space-y-2">
              {(
                [
                  {
                    type: 'CURRENT_GHARZOLHASANEH',
                    title: 'قرض‌الحسنه جاری تراز',
                    desc: 'مناسب برای تراکنش‌های روزمره، تسویه ساتنا/پایا و صدور دسته‌چک صیادی',
                  },
                  {
                    type: 'SHORT_TERM_DEPOSIT',
                    title: 'سپرده کوتاه‌مدت روزشمار',
                    desc: 'واریز سود ماهانه بر مبنای مانده روزانه با دسترسی کامل به کارت شتابی',
                  },
                  {
                    type: 'TARAZ_SPECIAL_DEPOSIT',
                    title: 'سپرده ویژه تجاری تراز',
                    desc: 'ویژه معاملات امن (SafeDeal) با کارمزد ترجیحی و گزارش‌گیری خزانه',
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setAccountType(option.type)}
                  className={`w-full text-right p-3.5 rounded-lg border transition-colors cursor-pointer ${
                    accountType === option.type
                      ? 'border-[#0A2540] bg-slate-50'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="text-sm font-bold text-[#0F172A]">{option.title}</div>
                  <div className="text-xs text-[#475569] mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              مبلغ واریز اولیه از حساب اصلی ({currencyUnit === 'TOMAN' ? 'تومان' : 'ریال'})
            </label>
            <input
              type="text"
              value={initialAmountInput}
              onChange={(e) => setInitialAmountInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] dir-ltr text-right tabular-nums focus:outline-none focus:border-[#0A2540]"
            />
            <div className="text-[11px] text-[#475569] mt-1 tabular-nums">
              معادل:{' '}
              {formatMoney(
                (Number(toLatinDigits(initialAmountInput).replace(/[^\d]/g, '')) || 0) *
                  (currencyUnit === 'TOMAN' ? 10 : 1),
                currencyUnit
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>افتتاح آنی حساب و صدور شبا</span>
          </button>

          <div className="text-[11px] text-[#475569] leading-relaxed">
            تمامی سپرده‌های ترازبانک تحت نظارت بانک همکار ایجاد شده و دارای شناسه یکتای BaaS هستند ({toPersianDigits(data.accounts.length)} حساب فعال).
          </div>
        </form>
      </div>
    </div>
  );
}
