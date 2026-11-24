'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import { formatIbanSpaced, formatMoney, toLatinDigits } from '@/lib/format';
import type { CurrencyUnit, TarazStateSnapshot } from '@/lib/types';
import { SafeDealStatusBadge } from '../StatusBadge';

interface SafeDealModuleProps {
  data: TarazStateSnapshot;
  currencyUnit: CurrencyUnit;
  onStateUpdate: (next: TarazStateSnapshot) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

export function SafeDealModule({
  data,
  currencyUnit,
  onStateUpdate,
  onNotify,
}: SafeDealModuleProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('تجهیزات صنعتی و بازرگانی');
  const [sellerName, setSellerName] = useState('');
  const [sellerNationalCode, setSellerNationalCode] = useState('14008921340');
  const [sellerIban, setSellerIban] = useState('IR640540102680020817909004');
  const [amountInput, setAmountInput] = useState('45000000');
  const [milestoneCount, setMilestoneCount] = useState<1 | 2>(2);
  const [submitting, setSubmitting] = useState(false);
  const [busyContractId, setBusyContractId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const raw = Number(toLatinDigits(amountInput).replace(/[^\d]/g, '')) || 0;
      const totalAmountIrr = currencyUnit === 'TOMAN' ? raw * 10 : raw;

      const res = await fetch('/api/safedeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          sellerName,
          sellerNationalCode: toLatinDigits(sellerNationalCode),
          sellerIban,
          sourceAccountId: data.accounts[0]?.id,
          totalAmountIrr,
          milestoneCount,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در ایجاد قرارداد معامله امن.', 'error');
        return;
      }

      onStateUpdate(json.state);
      setTitle('');
      setSellerName('');
      setShowCreate(false);
      onNotify(
        `قرارداد معامله امن ${json.contract.contractCode} ایجاد شد. اکنون می‌توانید وجه ضمانت را بلوکه کنید.`,
        'success'
      );
    } catch {
      onNotify('عدم برقراری ارتباط با سرویس اتاق معامله امن.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (
    contractId: string,
    action: 'FUND' | 'SUBMIT_OBLIGATION' | 'RELEASE_NEXT' | 'DISPUTE'
  ) => {
    setBusyContractId(contractId);
    try {
      const res = await fetch('/api/safedeal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در بروزرسانی وضعیت قرارداد.', 'error');
        return;
      }
      onStateUpdate(json.state);

      if (action === 'FUND') {
        onNotify('وجه ضمانت با موفقیت از حساب شما در سرفصل امانی ترازبانک بلوکه شد.', 'success');
      } else if (action === 'SUBMIT_OBLIGATION') {
        onNotify('اعلام تحویل تعهدات توسط فروشنده شبیه‌سازی شد و آماده تایید خریدار است.', 'success');
      } else if (action === 'RELEASE_NEXT') {
        onNotify('آزادسازی مرحله‌ای تایید شد و وجه به شبای فروشنده تسویه گردید.', 'success');
      } else if (action === 'DISPUTE') {
        onNotify('اختلاف ثبت شد؛ آزادسازی وجه معلق گردید و پرونده به پنل عملیات ارسال شد.', 'warning');
      }
    } catch {
      onNotify('عدم برقراری ارتباط با سرور معامله امن.', 'error');
    } finally {
      setBusyContractId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">اتاق معامله امن (SafeDeal / Escrow)</h1>
          <p className="text-sm text-[#475569] mt-1">
            اعتبارسنجی طرفین قرارداد، بلوکه‌سازی وجه ضمانت در حساب امانی و آزادسازی مرحله‌ای پس از تایید تعهدات
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreate ? 'بستن فرم قرارداد' : 'ایجاد قرارداد معامله امن'}</span>
        </button>
      </div>

      {/* Create New Contract Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-[#CBD5E1] p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-base font-bold text-[#0F172A]">تنظیم قرارداد جدید معامله امن</h2>
            <span className="text-xs text-[#059669] font-medium">
              استعلام خودکار شناسه طرف مقابل فعال است
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                عنوان و موضوع قرارداد
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: خرید و نصب سامانه برق خورشیدی ۲۰ کیلووات"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0A2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">دسته‌بندی</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#0A2540]"
              >
                <option value="تجهیزات صنعتی و بازرگانی">تجهیزات صنعتی و بازرگانی</option>
                <option value="خدمات نرم‌افزاری و فنی">خدمات نرم‌افزاری و فنی</option>
                <option value="خرید خودرو و دارایی سرمایه‌ای">خرید خودرو و دارایی سرمایه‌ای</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                نام فروشنده / طرف مقابل
              </label>
              <input
                type="text"
                required
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="نام شخص یا شرکت فروشنده"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0A2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                کد ملی / شناسه ملی فروشنده
              </label>
              <input
                type="text"
                required
                value={sellerNationalCode}
                onChange={(e) => setSellerNationalCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] dir-ltr text-right tabular-nums focus:outline-none focus:border-[#0A2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                شماره شبای فروشنده
              </label>
              <input
                type="text"
                required
                value={sellerIban}
                onChange={(e) => setSellerIban(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] dir-ltr text-right tabular-nums focus:outline-none focus:border-[#0A2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                مبلغ کل قرارداد ({currencyUnit === 'TOMAN' ? 'تومان' : 'ریال'})
              </label>
              <input
                type="text"
                required
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] dir-ltr text-right tabular-nums focus:outline-none focus:border-[#0A2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                ساختار آزادسازی وجه
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMilestoneCount(2)}
                  className={`flex-1 py-2.5 text-xs font-medium rounded-lg border cursor-pointer ${
                    milestoneCount === 2
                      ? 'border-[#0A2540] bg-[#0A2540] text-white'
                      : 'border-[#CBD5E1] text-[#475569]'
                  }`}
                >
                  ۲ مرحله‌ای (۶۰٪ / ۴۰٪)
                </button>
                <button
                  type="button"
                  onClick={() => setMilestoneCount(1)}
                  className={`flex-1 py-2.5 text-xs font-medium rounded-lg border cursor-pointer ${
                    milestoneCount === 1
                      ? 'border-[#0A2540] bg-[#0A2540] text-white'
                      : 'border-[#CBD5E1] text-[#475569]'
                  }`}
                >
                  یک‌مرحله‌ای
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>ثبت پیش‌نویس قرارداد</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Contracts List */}
      <div className="space-y-5">
        {data.safeDeals.map((deal) => {
          const isBusy = busyContractId === deal.id;
          return (
            <div
              key={deal.id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569]">
                    <span className="dir-ltr font-bold text-[#0A2540] tabular-nums">
                      {deal.contractCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{deal.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>ثبت: {deal.persianDate}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#0F172A] mt-1">{deal.title}</h2>
                </div>
                <SafeDealStatusBadge status={deal.status} />
              </div>

              {/* Counterparty & Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-y border-[#E2E8F0] text-xs">
                <div>
                  <div className="text-[#475569]">فروشنده (طرف مقابل تاییدشده)</div>
                  <div className="text-sm font-bold text-[#0F172A] mt-1">{deal.sellerName}</div>
                  <div className="text-[#475569] dir-ltr text-right tabular-nums mt-0.5">
                    {formatIbanSpaced(deal.sellerIban)}
                  </div>
                </div>
                <div>
                  <div className="text-[#475569]">مبلغ کل ضمانت قرارداد</div>
                  <div className="text-base font-bold text-[#0A2540] mt-1 tabular-nums">
                    {formatMoney(deal.totalAmountIrr, currencyUnit)}
                  </div>
                </div>
                <div>
                  <div className="text-[#475569]">مبلغ آزادسازی‌شده تاکنون</div>
                  <div className="text-base font-bold text-[#059669] mt-1 tabular-nums">
                    {formatMoney(deal.releasedAmountIrr, currencyUnit)}
                  </div>
                </div>
              </div>

              {/* Milestones List */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-[#475569]">مراحل تعهد و آزادسازی وجه</div>
                {deal.milestones.map((ms) => (
                  <div
                    key={ms.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[#F1F5F9] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {ms.status === 'RELEASED' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                      ) : ms.status === 'SUBMITTED' ? (
                        <FileCheck2 className="w-4 h-4 text-[#D97706] shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-[#475569] shrink-0" />
                      )}
                      <span className="font-medium text-[#0F172A]">{ms.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#0F172A] tabular-nums">
                        {formatMoney(ms.amountIrr, currencyUnit)}
                      </span>
                      <span
                        className={`font-medium ${
                          ms.status === 'RELEASED'
                            ? 'text-[#059669]'
                            : ms.status === 'SUBMITTED'
                              ? 'text-[#D97706]'
                              : 'text-[#475569]'
                        }`}
                      >
                        {ms.status === 'RELEASED'
                          ? 'آزادسازی شد'
                          : ms.status === 'SUBMITTED'
                            ? 'تحویل‌شده (در انتظار تایید)'
                            : 'در انتظار اجرا'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {deal.status === 'DISPUTED' && deal.disputeReason && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>پرونده اختلاف باز است: {deal.disputeReason}</span>
                </div>
              )}

              {/* Interactive Workflow Controls */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {deal.status === 'DRAFT' && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleTransition(deal.id, 'FUND')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-xs font-medium cursor-pointer disabled:opacity-60"
                  >
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>بلوکه کردن وجه ضمانت در حساب امانی</span>
                  </button>
                )}

                {deal.status === 'FUNDED' && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleTransition(deal.id, 'SUBMIT_OBLIGATION')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#0A2540] text-xs font-medium cursor-pointer disabled:opacity-60"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-[#059669]" />
                    <span>شبیه‌سازی تحویل تعهدات توسط فروشنده</span>
                  </button>
                )}

                {(deal.status === 'FUNDED' || deal.status === 'OBLIGATION_SUBMITTED') && (
                  <>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleTransition(deal.id, 'RELEASE_NEXT')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer disabled:opacity-60"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                      <span>تایید تحویل و آزادسازی مرحله بعدی</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleTransition(deal.id, 'DISPUTE')}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-[#DC2626] text-xs font-medium cursor-pointer disabled:opacity-60"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>ثبت اختلاف و تعلیق وجه</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
