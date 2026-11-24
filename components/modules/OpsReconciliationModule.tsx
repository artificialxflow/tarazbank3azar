'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  formatMoney,
  getRailLabel,
  getReconciliationLabel,
  toPersianDigits,
} from '@/lib/format';
import type { CurrencyUnit, TarazStateSnapshot } from '@/lib/types';
import { TransactionStatusBadge } from '../StatusBadge';

interface OpsReconciliationModuleProps {
  data: TarazStateSnapshot;
  currencyUnit: CurrencyUnit;
  onStateUpdate: (next: TarazStateSnapshot) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

export function OpsReconciliationModule({
  data,
  currencyUnit,
  onStateUpdate,
  onNotify,
}: OpsReconciliationModuleProps) {
  const [filter, setFilter] = useState<'NEEDS_INQUIRY' | 'ALL' | 'RESOLVED'>('NEEDS_INQUIRY');
  const [busyTxId, setBusyTxId] = useState<string | null>(null);
  const [busyDealId, setBusyDealId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const pendingTxs = data.transactions.filter((t) => t.status === 'PENDING_INQUIRY');
    const pendingVolumeIrr = pendingTxs.reduce((sum, t) => sum + t.amountIrr + t.feeIrr, 0);
    const resolvedCount = data.transactions.filter(
      (t) =>
        t.reconciliationStatus === 'RESOLVED_SETTLED' ||
        t.reconciliationStatus === 'RESOLVED_REVERSED'
    ).length;
    const disputedDeals = data.safeDeals.filter((d) => d.status === 'DISPUTED');
    return {
      pendingCount: pendingTxs.length,
      pendingVolumeIrr,
      resolvedCount,
      disputedDeals,
    };
  }, [data]);

  const filteredTxs = useMemo(() => {
    return data.transactions.filter((tx) => {
      if (filter === 'NEEDS_INQUIRY') return tx.status === 'PENDING_INQUIRY';
      if (filter === 'RESOLVED') {
        return (
          tx.reconciliationStatus === 'RESOLVED_SETTLED' ||
          tx.reconciliationStatus === 'RESOLVED_REVERSED'
        );
      }
      return true;
    });
  }, [data.transactions, filter]);

  const handleReconcile = async (
    txId: string,
    action: 'INQUIRE' | 'FORCE_SETTLE' | 'REVERSE'
  ) => {
    setBusyTxId(txId);
    try {
      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در عملیات مغایرت‌گیری.', 'error');
        return;
      }
      onStateUpdate(json.state);
      onNotify(json.message || 'وضعیت تراکنش با موفقیت بروزرسانی شد.', 'success');
    } catch {
      onNotify('عدم برقراری ارتباط با سرویس استعلام بانک همکار.', 'error');
    } finally {
      setBusyTxId(null);
    }
  };

  const handleResolveDispute = async (contractId: string) => {
    setBusyDealId(contractId);
    try {
      const res = await fetch('/api/safedeal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, action: 'RESOLVE_DISPUTE_REFUND' }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در بستن پرونده اختلاف.', 'error');
        return;
      }
      onStateUpdate(json.state);
      onNotify('پرونده اختلاف بسته شد و وجه امانی به موجودی قابل برداشت خریدار بازگشت داده شد.', 'success');
    } catch {
      onNotify('خطا در اتصال به سرور داوری.', 'error');
    } finally {
      setBusyDealId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">پنل عملیات و مغایرت‌گیری مالی (Ops)</h1>
          <p className="text-sm text-[#475569] mt-1">
            پایش تراکنش‌های Timeout شده، استعلام وضعیت مستقیم از BaaS بانک همکار، تسویه دستی یا برگشت وجه
          </p>
        </div>
        <div className="text-xs text-[#475569] bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#0A2540]" />
          <span>{data.baasHealth.partnerBank}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#059669] font-medium">دسترس‌پذیری {data.baasHealth.uptimePercent}</span>
        </div>
      </div>

      {/* Ops Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="text-xs text-[#475569]">تراکنش‌های در انتظار استعلام</div>
          <div className="text-2xl font-bold text-[#D97706] mt-2 tabular-nums">
            {toPersianDigits(metrics.pendingCount)} مورد
          </div>
          <div className="text-xs text-[#475569] mt-1">نیازمند استعلام از سوئیچ بانک</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="text-xs text-[#475569]">جمع مبلغ معلق در مغایرت</div>
          <div className="text-xl font-bold text-[#0F172A] mt-2 tabular-nums">
            {formatMoney(metrics.pendingVolumeIrr, currencyUnit)}
          </div>
          <div className="text-xs text-[#475569] mt-1">در حساب بلوکه موقت نگهداری می‌شود</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="text-xs text-[#475569]">مغایرت‌های رفع‌شده</div>
          <div className="text-2xl font-bold text-[#059669] mt-2 tabular-nums">
            {toPersianDigits(metrics.resolvedCount)} مورد
          </div>
          <div className="text-xs text-[#475569] mt-1">تسویه یا برگشت وجه تاییدشده</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="text-xs text-[#475569]">اختلافات باز معامله امن</div>
          <div className="text-2xl font-bold text-[#DC2626] mt-2 tabular-nums">
            {toPersianDigits(metrics.disputedDeals.length)} پرونده
          </div>
          <div className="text-xs text-[#475569] mt-1">نیازمند داوری مالی و آزادسازی/عودت</div>
        </div>
      </div>

      {/* Reconciliation Queue Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">صف بررسی تراکنش‌ها و استعلام بانک</h2>
            <p className="text-xs text-[#475569] mt-0.5">
              نتیجه هر عملیات استعلام یا برگشت وجه بلافاصله در دفترکل و موجودی مشتری اعمال می‌شود.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
            {(
              [
                { id: 'NEEDS_INQUIRY', label: `نیازمند استعلام (${toPersianDigits(metrics.pendingCount)})` },
                { id: 'RESOLVED', label: 'مغایرت‌های رفع‌شده' },
                { id: 'ALL', label: 'کل دفترکل' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-[#0A2540] shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-[#E2E8F0] text-xs text-[#475569]">
                <th className="py-3 px-4">شناسه / کلید یکتا</th>
                <th className="py-3 px-4">بستر و طرف حساب</th>
                <th className="py-3 px-4">مبلغ</th>
                <th className="py-3 px-4">وضعیت و یادداشت بانک</th>
                <th className="py-3 px-4">عملیات مغایرت‌گیری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-[#475569]">
                    <CheckCircle2 className="w-7 h-7 text-[#059669] mx-auto mb-2" />
                    <div>هیچ تراکنش مغایرت‌دار یا در انتظار استعلامی در این نما وجود ندارد.</div>
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => {
                  const isBusy = busyTxId === tx.id;
                  return (
                    <tr key={tx.id} className="align-top hover:bg-slate-50/60">
                      <td className="py-4 px-4 text-xs space-y-1">
                        <div className="dir-ltr text-right font-bold text-[#0A2540] tabular-nums">
                          {tx.bankReferenceCode}
                        </div>
                        <div className="dir-ltr text-right text-[11px] text-[#475569] tabular-nums">
                          {tx.idempotencyKey}
                        </div>
                        <div className="text-[11px] text-[#475569] tabular-nums">
                          تعداد استعلام: {toPersianDigits(tx.inquiryAttempts)} · {tx.persianTime}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-[#0F172A]">{tx.counterpartyName}</div>
                        <div className="text-xs text-[#475569] mt-0.5">
                          {getRailLabel(tx.railType)} ·{' '}
                          <span className="dir-ltr inline-block tabular-nums">{tx.destinationRef}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-[#0F172A] tabular-nums whitespace-nowrap">
                        {formatMoney(tx.amountIrr, currencyUnit)}
                      </td>

                      <td className="py-4 px-4 max-w-xs space-y-1">
                        <TransactionStatusBadge status={tx.status} />
                        <div className="text-[11px] text-[#475569] leading-relaxed">
                          {getReconciliationLabel(tx.reconciliationStatus)} — {tx.lastInquiryNote}
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {tx.status === 'PENDING_INQUIRY' ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleReconcile(tx.id, 'INQUIRE')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-xs font-medium cursor-pointer disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              <span>استعلام از بانک</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleReconcile(tx.id, 'FORCE_SETTLE')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#059669] text-xs font-medium cursor-pointer disabled:opacity-60"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تایید تسویه</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleReconcile(tx.id, 'REVERSE')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-[#D97706] text-xs font-medium cursor-pointer disabled:opacity-60"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>برگشت وجه</span>
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#475569]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>تعیین تکلیف شده</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disputed SafeDeal Contracts Panel */}
      {metrics.disputedDeals.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-[#DC2626]">
            <AlertTriangle className="w-5 h-5" />
            <span>پرونده‌های اختلاف اتاق معامله امن</span>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {metrics.disputedDeals.map((deal) => (
              <div
                key={deal.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm text-[#0F172A]">
                    {deal.title} (<span className="dir-ltr">{deal.contractCode}</span>)
                  </div>
                  <div className="text-[#475569]">
                    خریدار: {deal.buyerName} · فروشنده: {deal.sellerName} · مبلغ ضمانت:{' '}
                    <strong className="tabular-nums">
                      {formatMoney(deal.totalAmountIrr, currencyUnit)}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyDealId === deal.id}
                  onClick={() => handleResolveDispute(deal.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-xs font-medium cursor-pointer disabled:opacity-60"
                >
                  {busyDealId === deal.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>رای به عودت وجه ضمانت به خریدار</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
