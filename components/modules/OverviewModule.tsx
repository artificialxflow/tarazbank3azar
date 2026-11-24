'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Search,
  Send,
  ShieldCheck,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import {
  formatMoney,
  getRailLabel,
  toPersianDigits,
} from '@/lib/format';
import type {
  CurrencyUnit,
  ModuleKey,
  TarazStateSnapshot,
  WorkspaceRole,
} from '@/lib/types';
import { TransactionStatusBadge } from '../StatusBadge';

interface OverviewModuleProps {
  data: TarazStateSnapshot;
  currencyUnit: CurrencyUnit;
  onNavigate: (module: ModuleKey) => void;
  onSwitchRole: (role: WorkspaceRole) => void;
}

export function OverviewModule({
  data,
  currencyUnit,
  onNavigate,
  onSwitchRole,
}: OverviewModuleProps) {
  const [chartRange, setChartRange] = useState<'7D' | '30D'>('7D');
  const [txSearch, setTxSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING_INQUIRY' | 'FAILED'>('ALL');

  const totals = useMemo(() => {
    const totalAvailableIrr = data.accounts.reduce((sum, a) => sum + a.availableBalanceIrr, 0);
    const totalBlockedIrr = data.accounts.reduce((sum, a) => sum + a.blockedBalanceIrr, 0);
    const cryptoValueIrr = data.walletAssets.reduce(
      (sum, w) => sum + Math.round(w.balance * w.rateIrr),
      0
    );
    const inflowIrr = data.transactions
      .filter((t) => t.direction === 'CREDIT' && t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amountIrr, 0);
    const outflowIrr = data.transactions
      .filter((t) => t.direction === 'DEBIT' && (t.status === 'SUCCESS' || t.status === 'PENDING_INQUIRY'))
      .reduce((sum, t) => sum + t.amountIrr, 0);
    const pendingInquiryCount = data.transactions.filter(
      (t) => t.status === 'PENDING_INQUIRY'
    ).length;

    return {
      totalAvailableIrr,
      totalBlockedIrr,
      cryptoValueIrr,
      inflowIrr,
      outflowIrr,
      pendingInquiryCount,
    };
  }, [data]);

  const activeSeries = chartRange === '7D' ? data.cashflow7d : data.cashflow30d;
  const maxChartVal = useMemo(() => {
    const vals = activeSeries.flatMap((p) => [p.inflowIrr, p.outflowIrr]);
    return Math.max(...vals, 100_000_000);
  }, [activeSeries]);

  const filteredTransactions = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return data.transactions.filter((tx) => {
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
      if (!q) return true;
      return (
        tx.counterpartyName.toLowerCase().includes(q) ||
        tx.bankReferenceCode.toLowerCase().includes(q) ||
        tx.idempotencyKey.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q)
      );
    });
  }, [data.transactions, statusFilter, txSearch]);

  const activeDeals = data.safeDeals.filter((d) => d.status !== 'RELEASED');

  return (
    <div className="space-y-6">
      {/* Page Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">داشبورد مدیریتی ترازبانک</h1>
          <p className="text-sm text-[#475569] mt-1">
            خلاصه وضعیت حساب‌های بانکی، جریان نقدینگی چندبستری و تعهدات اتاق معامله امن · سه‌شنبه ۳ آذر ۱۴۰۵
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('safedeal')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-sm font-medium text-[#0F172A] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>قرارداد معامله امن جدید</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('transfers')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>انتقال وجه جدید</span>
          </button>
        </div>
      </div>

      {/* Pending Inquiry Action Banner (Real functional shortcut to Ops) */}
      {totals.pendingInquiryCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3 text-sm text-[#0F172A]">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>
              <strong className="font-bold tabular-nums">
                {toPersianDigits(totals.pendingInquiryCount)} تراکنش
              </strong>{' '}
              در وضعیت در انتظار استعلام بانک همکار قرار دارد. برای بررسی و رفع مغایرت به پنل عملیات مراجعه کنید.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSwitchRole('OPS')}
            className="text-xs font-bold text-[#0A2540] hover:text-[#1E3A8A] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
          >
            ورود به پنل عملیات و مغایرت‌گیری
          </button>
        </div>
      )}

      {/* 4 KPI Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#475569]">موجودی قابل برداشت کل</span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[#0A2540]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-[#0F172A] tabular-nums">
              {formatMoney(totals.totalAvailableIrr, currencyUnit)}
            </div>
            <div className="text-xs text-[#475569] mt-1.5 flex items-center gap-1.5">
              <span>{toPersianDigits(data.accounts.length)} حساب فعال</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#059669]">هسته BaaS متصل</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#475569]">جمع واریزی‌ها</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-[#059669]">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-[#0F172A] tabular-nums">
              {formatMoney(totals.inflowIrr, currencyUnit)}
            </div>
            <div className="text-xs text-[#059669] mt-1.5 tabular-nums">
              +۱۴.۲٪ نسبت به دوره قبل
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#475569]">جمع پرداخت و انتقال</span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[#0A2540]">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-[#0F172A] tabular-nums">
              {formatMoney(totals.outflowIrr, currencyUnit)}
            </div>
            <div className="text-xs text-[#475569] mt-1.5">
              بسترهای ساتنا، پایا، پل و امانی
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#475569]">وجه بلوکه ضمانت و استعلام</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-[#D97706]">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-[#0F172A] tabular-nums">
              {formatMoney(totals.totalBlockedIrr, currencyUnit)}
            </div>
            <div className="text-xs text-[#475569] mt-1.5 flex items-center gap-1.5">
              <span>{toPersianDigits(activeDeals.length)} قرارداد فعال</span>
              <span aria-hidden="true">·</span>
              <span>ارزش رمزارز: {formatMoney(totals.cryptoValueIrr, currencyUnit, { compact: true })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Cashflow Analytics Chart + Active SafeDeal Status */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Cashflow Chart (8 cols) */}
        <div className="xl:col-span-8 bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">تحلیل جریان نقدینگی (واریز و برداشت)</h2>
              <p className="text-xs text-[#475569] mt-0.5">
                مقایسه ورودی و خروجی ریالی بر بسترهای بانکی ترازبانک
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 text-xs text-[#475569]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#059669]" />
                  واریز
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0A2540]" />
                  پرداخت
                </span>
              </div>
              <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
                <button
                  type="button"
                  onClick={() => setChartRange('7D')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    chartRange === '7D'
                      ? 'bg-white text-[#0A2540] shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  ۷ روز اخیر
                </button>
                <button
                  type="button"
                  onClick={() => setChartRange('30D')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    chartRange === '30D'
                      ? 'bg-white text-[#0A2540] shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  ۳۰ روز اخیر
                </button>
              </div>
            </div>
          </div>

          {/* Crisp SVG Grouped Bar Chart */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[480px] h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-[#E2E8F0]">
              {activeSeries.map((point) => {
                const inPct = Math.max(8, Math.round((point.inflowIrr / maxChartVal) * 100));
                const outPct = Math.max(8, Math.round((point.outflowIrr / maxChartVal) * 100));
                return (
                  <div
                    key={point.label}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <div className="w-full max-w-[54px] h-full flex items-end justify-center gap-1.5">
                      <div
                        className="w-5 rounded-t-md bg-[#059669] transition-opacity group-hover:opacity-90"
                        style={{ height: `${inPct}%` }}
                        title={`واریز: ${formatMoney(point.inflowIrr, currencyUnit)}`}
                      />
                      <div
                        className="w-5 rounded-t-md bg-[#0A2540] transition-opacity group-hover:opacity-90"
                        style={{ height: `${outPct}%` }}
                        title={`برداشت: ${formatMoney(point.outflowIrr, currencyUnit)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="min-w-[480px] flex items-center justify-between gap-3 pt-2.5">
              {activeSeries.map((point) => (
                <div key={point.label} className="flex-1 text-center text-xs text-[#475569]">
                  {point.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active SafeDeal & Portfolio Progress (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">وضعیت اتاق معامله امن</h2>
              <button
                type="button"
                onClick={() => onNavigate('safedeal')}
                className="text-xs font-medium text-[#0A2540] hover:text-[#1E3A8A] cursor-pointer"
              >
                مشاهده همه
              </button>
            </div>

            {data.safeDeals.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#475569]">
                هنوز قرارداد معامله امنی ثبت نشده است.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {data.safeDeals.slice(0, 3).map((deal) => {
                  const progressPct =
                    deal.totalAmountIrr > 0
                      ? Math.round((deal.releasedAmountIrr / deal.totalAmountIrr) * 100)
                      : 0;
                  return (
                    <div key={deal.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#475569] mb-1">
                        <span className="dir-ltr font-medium tabular-nums">{deal.contractCode}</span>
                        <span className="tabular-nums">{deal.persianDate}</span>
                      </div>
                      <div className="text-sm font-medium text-[#0F172A] truncate">
                        {deal.title}
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-[#475569] tabular-nums">
                          {formatMoney(deal.totalAmountIrr, currencyUnit)}
                        </span>
                        <span className="font-medium text-[#0A2540] tabular-nums">
                          آزادسازی {toPersianDigits(progressPct)}٪
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#059669]"
                          style={{ width: `${Math.max(progressPct, deal.status === 'FUNDED' || deal.status === 'OBLIGATION_SUBMITTED' ? 28 : 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#475569]">
            <span>مجموع دارایی کیف پول رمزارز</span>
            <button
              type="button"
              onClick={() => onNavigate('wallet')}
              className="font-bold text-[#0A2540] hover:text-[#1E3A8A] tabular-nums cursor-pointer"
            >
              {formatMoney(totals.cryptoValueIrr, currencyUnit)}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Multi-Rail Ledger Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">دفترکل تراکنش‌های اخیر</h2>
            <p className="text-xs text-[#475569] mt-0.5">
              گزارش یکپارچه واریزها، انتقال‌های ساتنا/پایا/پل و تبدیل‌های کیف پول
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#475569] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="جستجوی طرف حساب یا کد پیگیری..."
                className="ps-9 pe-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0A2540] w-60"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
              {(
                [
                  { id: 'ALL', label: 'همه' },
                  { id: 'SUCCESS', label: 'موفق' },
                  { id: 'PENDING_INQUIRY', label: 'در انتظار استعلام' },
                  { id: 'FAILED', label: 'ناموفق' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-white text-[#0A2540] shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50/70 text-xs font-medium text-[#475569]">
                <th className="py-3 px-4">طرف حساب و شرح</th>
                <th className="py-3 px-4">بستر انتقال</th>
                <th className="py-3 px-4">کد پیگیری</th>
                <th className="py-3 px-4">زمان ثبت</th>
                <th className="py-3 px-4">مبلغ</th>
                <th className="py-3 px-4">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#475569]">
                    تراکنشی با این فیلتر یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#0F172A]">{tx.counterpartyName}</div>
                      <div className="text-xs text-[#475569] mt-0.5 truncate max-w-xs">
                        {tx.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#475569] whitespace-nowrap">
                      {getRailLabel(tx.railType)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#475569] dir-ltr text-right tabular-nums whitespace-nowrap">
                      {tx.bankReferenceCode}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#475569] tabular-nums whitespace-nowrap">
                      {tx.persianTime}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-bold tabular-nums whitespace-nowrap ${
                        tx.direction === 'CREDIT' ? 'text-[#059669]' : 'text-[#0F172A]'
                      }`}
                    >
                      {tx.direction === 'CREDIT' ? '+ ' : '− '}
                      {formatMoney(tx.amountIrr, currencyUnit)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <TransactionStatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
