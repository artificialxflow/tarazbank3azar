'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  calculateRailFeeIrr,
  formatMoney,
  getRailLabel,
  toLatinDigits,
} from '@/lib/format';
import type {
  CurrencyUnit,
  LedgerTransaction,
  RailType,
  TarazStateSnapshot,
  WorkspaceRole,
} from '@/lib/types';
import { TransactionStatusBadge } from '../StatusBadge';

interface TransfersModuleProps {
  data: TarazStateSnapshot;
  currencyUnit: CurrencyUnit;
  onStateUpdate: (next: TarazStateSnapshot) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
  onSwitchRole: (role: WorkspaceRole) => void;
}

function generateClientIdempotencyKey(): string {
  const rand = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `TRZ-IDEM-${rand}`;
}

const RAIL_OPTIONS: {
  id: RailType;
  title: string;
  timing: string;
  ceilingText: string;
}[] = [
  { id: 'POL', title: 'پل (آنی)', timing: 'واریز لحظه‌ای ۲۴/۷', ceilingText: 'تا ۱۵ م تومان' },
  { id: 'PAYA', title: 'پایا', timing: 'سیکل‌های پایا (۴ چرخه)', ceilingText: 'تا ۲۰۰ م تومان' },
  { id: 'SATNA', title: 'ساتنا', timing: 'ساعات اداری (بالای ۱۵ م)', ceilingText: 'تا سقف سطح کاربری' },
  { id: 'CARD_TO_CARD', title: 'کارت‌به‌کارت', timing: 'آنی شتابی', ceilingText: 'تا ۱۰ م تومان' },
  { id: 'INTERNAL', title: 'درون‌بانکی', timing: 'آنی بدون کارمزد', ceilingText: 'بدون کارمزد' },
];

export function TransfersModule({
  data,
  currencyUnit,
  onStateUpdate,
  onNotify,
  onSwitchRole,
}: TransfersModuleProps) {
  const [sourceAccountId, setSourceAccountId] = useState(data.accounts[0]?.id || '');
  const [railType, setRailType] = useState<RailType>('SATNA');
  const [destinationRef, setDestinationRef] = useState('IR820540102680020817909002');
  const [counterpartyName, setCounterpartyName] = useState('شرکت توسعه فناوری آوا');
  const [amountInput, setAmountInput] = useState('25000000');
  const [description, setDescription] = useState('بابت تسویه فاکتور شماره ۴۰۵۲');
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateClientIdempotencyKey());
  const [simulateTimeout, setSimulateTimeout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    tx: LedgerTransaction;
    replayed: boolean;
  } | null>(null);

  const amountIrr = useMemo(() => {
    const raw = Number(toLatinDigits(amountInput).replace(/[^\d]/g, '')) || 0;
    return currencyUnit === 'TOMAN' ? raw * 10 : raw;
  }, [amountInput, currencyUnit]);

  const feeIrr = useMemo(() => calculateRailFeeIrr(railType, amountIrr), [railType, amountIrr]);

  const submitTransfer = async (keyToUse: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': keyToUse,
        },
        body: JSON.stringify({
          bankAccountId: sourceAccountId || data.accounts[0]?.id,
          railType,
          amountIrr,
          counterpartyName,
          destinationRef,
          description,
          idempotencyKey: keyToUse,
          simulateTimeout,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در اجرای انتقال وجه.', 'error');
        return;
      }

      onStateUpdate(json.state);
      setLastReceipt({ tx: json.transaction, replayed: Boolean(json.idempotentReplay) });

      if (json.idempotentReplay) {
        onNotify(
          'مکانیزم Idempotency فعال شد: درخواست تکراری شناسایی گردید و هیچ برداشت مجددی انجام نشد.',
          'warning'
        );
      } else if (json.transaction.status === 'PENDING_INQUIRY') {
        onNotify(
          'ارتباط با بانک همکار قطع شد (Timeout). تراکنش در وضعیت در انتظار استعلام ثبت شد و در پنل عملیات قابل پیگیری است.',
          'warning'
        );
      } else {
        onNotify('انتقال وجه با موفقیت در هسته بانکی ثبت و تسویه شد.', 'success');
      }
    } catch {
      onNotify('عدم برقراری ارتباط با سرویس انتقال وجه.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitTransfer(idempotencyKey);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">واریز و انتقال وجه چندبستری</h1>
          <p className="text-sm text-[#475569] mt-1">
            انتقال هوشمند ساتنا، پایا، پل، کارت‌به‌کارت و درون‌بانکی با کلید یکتای ضدبرداشت تکراری (Idempotency)
          </p>
        </div>
        <div className="text-xs text-[#475569] bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
          <span>سقف مجاز روزانه:</span>
          <strong className="text-[#0F172A] tabular-nums">
            {formatMoney(data.kyc.dailyTransferLimitIrr, currencyUnit)}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Transfer Builder Form (7 cols) */}
        <form
          onSubmit={handleFormSubmit}
          className="xl:col-span-7 bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5"
        >
          {/* Rail Selector */}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-2">
              انتخاب بستر انتقال وجه
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {RAIL_OPTIONS.map((rail) => (
                <button
                  key={rail.id}
                  type="button"
                  onClick={() => setRailType(rail.id)}
                  className={`p-2.5 rounded-lg border text-right transition-colors cursor-pointer ${
                    railType === rail.id
                      ? 'border-[#0A2540] bg-[#0A2540] text-white'
                      : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="text-xs font-bold whitespace-nowrap">{rail.title}</div>
                  <div
                    className={`text-[10px] mt-0.5 truncate ${
                      railType === rail.id ? 'text-slate-200' : 'text-[#475569]'
                    }`}
                  >
                    {rail.ceilingText}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">حساب مبدا</label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#0A2540]"
              >
                {data.accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.title} — {formatMoney(acc.availableBalanceIrr, currencyUnit)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                مبلغ انتقال ({currencyUnit === 'TOMAN' ? 'تومان' : 'ریال'})
              </label>
              <input
                type="text"
                required
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] dir-ltr text-right tabular-nums focus:outline-none focus:border-[#0A2540]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                {railType === 'CARD_TO_CARD' ? 'شماره کارت مقصد (۱۶ رقم)' : 'شماره شبا یا حساب مقصد'}
              </label>
              <input
                type="text"
                required
                value={destinationRef}
                onChange={(e) => setDestinationRef(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] dir-ltr text-right tabular-nums focus:outline-none focus:border-[#0A2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                نام ذی‌نفع / گیرنده
              </label>
              <input
                type="text"
                required
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0A2540]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">شرح انتقال</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0A2540]"
            />
          </div>

          {/* Idempotency Key & BaaS Timeout Simulator Controls */}
          <div className="p-4 rounded-xl bg-[#F1F5F9] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-[#475569]">
                کلید یکتای جلوگیری از برداشت تکراری (<span className="dir-ltr font-medium">Idempotency-Key</span>):
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-bold text-[#0A2540] bg-white px-2.5 py-1 rounded border border-[#CBD5E1] dir-ltr tabular-nums">
                  {idempotencyKey}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    setIdempotencyKey(generateClientIdempotencyKey());
                    setLastReceipt(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#0A2540] hover:text-[#1E3A8A] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  کلید جدید
                </button>
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/80 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-[#0F172A]">
                  شبیه‌سازی قطع ارتباط بانک همکار (BaaS Timeout)
                </div>
                <div className="text-[11px] text-[#475569] mt-0.5">
                  برای تست مدیریت وضعیت «در انتظار استعلام بانک» و بررسی آن در پنل عملیات مغایرت‌گیری
                </div>
              </div>
              <input
                type="checkbox"
                checked={simulateTimeout}
                onChange={(e) => setSimulateTimeout(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer shrink-0"
              />
            </label>
          </div>

          {/* Cost Breakdown & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E2E8F0]">
            <div className="space-y-0.5 text-xs">
              <div className="text-[#475569]">
                کارمزد بستر {getRailLabel(railType)}:{' '}
                <strong className="text-[#0F172A] tabular-nums">
                  {formatMoney(feeIrr, currencyUnit)}
                </strong>
              </div>
              <div className="text-[#475569]">
                جمع کل کسر از حساب:{' '}
                <strong className="text-[#0A2540] tabular-nums">
                  {formatMoney(amountIrr + feeIrr, currencyUnit)}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {lastReceipt && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => submitTransfer(idempotencyKey)}
                  className="py-2.5 px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-medium text-[#0A2540] transition-colors cursor-pointer"
                >
                  ارسال مجدد با همان کلید (تست Idempotency)
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-5 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>تایید و ارسال دستور پرداخت</span>
              </button>
            </div>
          </div>
        </form>

        {/* Live Transfer Receipt / Idempotency Verification Panel (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <h2 className="text-base font-bold text-[#0F172A] mb-3">نتیجه آخرین دستور انتقال</h2>

            {!lastReceipt ? (
              <div className="py-8 text-center space-y-2">
                <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-[#475569] leading-relaxed">
                  پس از ثبت دستور انتقال، رسید بانکی، کد پیگیری و وضعیت تطبیق کلید یکتا در این بخش نمایش داده می‌شود.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {lastReceipt.replayed ? (
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-[#0F172A] flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">جلوگیری از برداشت تکراری (Idempotent Replay)</div>
                      <div className="text-[#475569] mt-0.5">
                        این کلید یکتا قبلاً پردازش شده است؛ بنابراین پاسخ تراکنش اصلی بدون کسر مجدد از موجودی برگردانده شد.
                      </div>
                    </div>
                  </div>
                ) : lastReceipt.tx.status === 'PENDING_INQUIRY' ? (
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-[#0F172A] space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">پاسخ بانک منقضی شد (در انتظار استعلام)</div>
                        <div className="text-[#475569] mt-0.5">
                          وجه به‌صورت امن در حساب بلوکه موقت قرار گرفت و در صف پنل عملیات و مغایرت‌گیری ثبت شد.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSwitchRole('OPS')}
                      className="text-xs font-bold text-[#0A2540] underline underline-offset-4 cursor-pointer"
                    >
                      استعلام و رفع مغایرت در پنل عملیات
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#059669] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="font-bold">تراکنش با موفقیت در شبکه بانکی ثبت شد.</span>
                  </div>
                )}

                <div className="divide-y divide-[#E2E8F0] text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">وضعیت</span>
                    <TransactionStatusBadge status={lastReceipt.tx.status} />
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">مبلغ</span>
                    <span className="font-bold text-[#0F172A] tabular-nums">
                      {formatMoney(lastReceipt.tx.amountIrr, currencyUnit)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">بستر انتقال</span>
                    <span className="font-medium text-[#0F172A]">
                      {getRailLabel(lastReceipt.tx.railType)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">کد پیگیری بانک</span>
                    <span className="dir-ltr font-bold text-[#0A2540] tabular-nums">
                      {lastReceipt.tx.bankReferenceCode}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">کلید یکتا</span>
                    <span className="dir-ltr font-medium text-[#475569] tabular-nums">
                      {lastReceipt.tx.idempotencyKey}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
