'use client';

import { useState } from 'react';
import {
  Ban,
  CreditCard,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  Unlock,
} from 'lucide-react';
import { formatMoney, toPersianDigits } from '@/lib/format';
import type { CurrencyUnit, TarazStateSnapshot } from '@/lib/types';
import { SafeImage } from '../SafeImage';
import { TransactionStatusBadge } from '../StatusBadge';

interface CardsModuleProps {
  data: TarazStateSnapshot;
  currencyUnit: CurrencyUnit;
  onStateUpdate: (next: TarazStateSnapshot) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

export function CardsModule({
  data,
  currencyUnit,
  onStateUpdate,
  onNotify,
}: CardsModuleProps) {
  const [selectedCardId, setSelectedCardId] = useState(data.cards[0]?.id || '');
  const [issueAccountId, setIssueAccountId] = useState(data.accounts[0]?.id || '');
  const [issueType, setIssueType] = useState<'PHYSICAL' | 'VIRTUAL'>('VIRTUAL');
  const [issuing, setIssuing] = useState(false);
  const [mutating, setMutating] = useState<string | null>(null);
  const [dynamicPin, setDynamicPin] = useState<{ cardId: string; code: string } | null>(null);

  const selectedCard =
    data.cards.find((c) => c.id === selectedCardId) || data.cards[0] || null;

  const linkedAccount = selectedCard
    ? data.accounts.find((a) => a.id === selectedCard.bankAccountId)
    : null;

  const handleCardAction = async (
    cardId: string,
    action: 'TOGGLE_FREEZE' | 'BLOCK' | 'TOGGLE_ONLINE' | 'UPDATE_LIMIT' | 'DYNAMIC_PIN',
    dailyLimitIrr?: number
  ) => {
    setMutating(action);
    try {
      const res = await fetch('/api/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, action, dailyLimitIrr }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در بروزرسانی وضعیت کارت.', 'error');
        return;
      }

      onStateUpdate(json.state);

      if (action === 'DYNAMIC_PIN' && json.dynamicPin) {
        setDynamicPin({ cardId, code: json.dynamicPin });
        onNotify('رمز دوم پویا (یک‌بارمصرف) با اعتبار ۱۲۰ ثانیه صادر شد.', 'success');
      } else if (action === 'TOGGLE_FREEZE') {
        onNotify('وضعیت مسدودی موقت کارت بروزرسانی شد.', 'success');
      } else if (action === 'BLOCK') {
        onNotify('کارت بانکی به‌صورت دائم مسدود شد.', 'warning');
      } else if (action === 'TOGGLE_ONLINE') {
        onNotify('تنظیمات پرداخت اینترنتی کارت ذخیره شد.', 'success');
      } else if (action === 'UPDATE_LIMIT') {
        onNotify('سقف خرید روزانه کارت بروزرسانی شد.', 'success');
      }
    } catch {
      onNotify('عدم برقراری ارتباط با سرویس مدیریت کارت.', 'error');
    } finally {
      setMutating(null);
    }
  };

  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccountId: issueAccountId || data.accounts[0]?.id,
          cardType: issueType,
          dailyLimitIrr: issueType === 'VIRTUAL' ? 200_000_000 : 500_000_000,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در صدور کارت جدید.', 'error');
        return;
      }
      onStateUpdate(json.state);
      setSelectedCardId(json.card.id);
      onNotify(
        issueType === 'VIRTUAL'
          ? 'کارت مجازی ترازبانک به‌صورت آنی صادر و فعال شد.'
          : 'درخواست صدور کارت فیزیکی ثبت و شماره کارت تخصیص یافت.',
        'success'
      );
    } catch {
      onNotify('خطا در اتصال به درگاه صدور کارت.', 'error');
    } finally {
      setIssuing(false);
    }
  };

  const cardTransactions = data.transactions.filter(
    (t) =>
      t.railType === 'CARD_TO_CARD' ||
      (selectedCard && t.bankAccountId === selectedCard.bankAccountId)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">صدور و مدیریت کارت بانکی</h1>
        <p className="text-sm text-[#475569] mt-1">
          مدیریت کارت‌های فیزیکی و مجازی شتابی، صدور رمز پویا، کنترل سقف خرید و مسدودسازی آنی
        </p>
      </div>

      {/* Card Selector Strip */}
      <div className="flex flex-wrap items-center gap-2.5">
        {data.cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setSelectedCardId(card.id)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-2.5 cursor-pointer ${
              selectedCard?.id === card.id
                ? 'bg-[#0A2540] text-white border-[#0A2540]'
                : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>{card.cardType === 'VIRTUAL' ? 'کارت مجازی' : 'کارت فیزیکی'}</span>
            <span className="dir-ltr tabular-nums opacity-85">•••• {card.lastFour}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Visual Card + Controls (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-6">
          {selectedCard ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* TarazCard Visual */}
                <div className="md:col-span-7 relative rounded-2xl overflow-hidden aspect-[1.6/1] bg-[#0A2540] text-white p-5 flex flex-col justify-between select-none">
                  <SafeImage
                    src="/images/card-bg.svg"
                    alt="پس‌زمینه کارت بانکی ترازبانک"
                    fallbackTitle="TarazBank Card"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">ترازبانک</span>
                      <span className="text-[11px] text-emerald-300">
                        {selectedCard.cardType === 'VIRTUAL' ? 'مجازی' : 'شتابی فیزیکی'}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-white/90">
                      {selectedCard.status === 'ACTIVE'
                        ? 'فعال'
                        : selectedCard.status === 'FROZEN'
                          ? 'مسدود موقت'
                          : 'مسدود دائم'}
                    </span>
                  </div>

                  <div className="relative z-10 my-3">
                    <div className="dir-ltr text-center text-lg sm:text-xl font-bold tracking-widest tabular-nums">
                      {selectedCard.maskedPan}
                    </div>
                  </div>

                  <div className="relative z-10 flex items-end justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-300">دارنده کارت</div>
                      <div className="font-medium mt-0.5">{selectedCard.holderName}</div>
                    </div>
                    <div className="flex items-center gap-4 dir-ltr tabular-nums">
                      <div>
                        <div className="text-[10px] text-slate-300">EXP</div>
                        <div className="font-medium">
                          {selectedCard.expiryYear}/{selectedCard.expiryMonth}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-300">CVV2</div>
                        <div className="font-medium">{selectedCard.cvv2}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Quick Metadata & Dynamic PIN */}
                <div className="md:col-span-5 space-y-4">
                  <div>
                    <div className="text-xs text-[#475569]">حساب متصل</div>
                    <div className="text-sm font-bold text-[#0F172A] mt-0.5">
                      {linkedAccount?.title || 'حساب تراز'}
                    </div>
                    <div className="text-xs text-[#059669] font-medium tabular-nums mt-0.5">
                      موجودی: {formatMoney(linkedAccount?.availableBalanceIrr || 0, currencyUnit)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <div className="text-xs text-[#475569]">سقف خرید روزانه</div>
                    <div className="text-sm font-bold text-[#0F172A] mt-0.5 tabular-nums">
                      {formatMoney(selectedCard.dailyLimitIrr, currencyUnit)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {[100_000_000, 300_000_000, 500_000_000].map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          disabled={selectedCard.status === 'BLOCKED' || mutating !== null}
                          onClick={() => handleCardAction(selectedCard.id, 'UPDATE_LIMIT', cap)}
                          className={`px-2 py-1 text-[11px] rounded-md border tabular-nums cursor-pointer ${
                            selectedCard.dailyLimitIrr === cap
                              ? 'border-[#0A2540] bg-[#0A2540] text-white'
                              : 'border-[#CBD5E1] text-[#475569] hover:border-[#0A2540]'
                          }`}
                        >
                          {toPersianDigits(cap / 10_000_000)} م
                        </button>
                      ))}
                    </div>
                  </div>

                  {dynamicPin && dynamicPin.cardId === selectedCard.id && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <span className="text-xs text-[#059669] font-medium">رمز دوم پویا:</span>
                      <span className="dir-ltr text-base font-bold text-[#0A2540] tracking-widest tabular-nums">
                        {dynamicPin.code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  disabled={mutating !== null}
                  onClick={() => handleCardAction(selectedCard.id, 'DYNAMIC_PIN')}
                  className="py-2.5 px-3 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-medium text-[#0A2540] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#059669]" />
                  <span>دریافت رمز پویا</span>
                </button>

                <button
                  type="button"
                  disabled={selectedCard.status === 'BLOCKED' || mutating !== null}
                  onClick={() => handleCardAction(selectedCard.id, 'TOGGLE_ONLINE')}
                  className="py-2.5 px-3 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-medium text-[#0F172A] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Globe className="w-3.5 h-3.5 text-[#0A2540]" />
                  <span>{selectedCard.onlineEnabled ? 'غیرفعال‌سازی اینترنتی' : 'فعال‌سازی اینترنتی'}</span>
                </button>

                <button
                  type="button"
                  disabled={selectedCard.status === 'BLOCKED' || mutating !== null}
                  onClick={() => handleCardAction(selectedCard.id, 'TOGGLE_FREEZE')}
                  className="py-2.5 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-medium text-[#D97706] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {selectedCard.status === 'FROZEN' ? (
                    <Unlock className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>{selectedCard.status === 'FROZEN' ? 'رفع مسدودی موقت' : 'مسدودی موقت'}</span>
                </button>

                <button
                  type="button"
                  disabled={selectedCard.status === 'BLOCKED' || mutating !== null}
                  onClick={() => handleCardAction(selectedCard.id, 'BLOCK')}
                  className="py-2.5 px-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-medium text-[#DC2626] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>مسدودسازی دائم</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-[#475569]">
              کارتی برای نمایش وجود ندارد.
            </div>
          )}
        </div>

        {/* Issue New Card Form (5 cols) */}
        <form
          onSubmit={handleIssueCard}
          className="xl:col-span-5 bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5"
        >
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">درخواست صدور کارت جدید</h2>
            <p className="text-xs text-[#475569] mt-1">
              صدور آنی کارت مجازی برای خریدهای اینترنتی یا سفارش کارت فیزیکی هوشمند ترازبانک
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              حساب بانکی متصل به کارت
            </label>
            <select
              value={issueAccountId}
              onChange={(e) => setIssueAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#0A2540]"
            >
              {data.accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.title} ({acc.accountNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-2">نوع کارت</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIssueType('VIRTUAL')}
                className={`p-3.5 rounded-lg border text-right cursor-pointer transition-colors ${
                  issueType === 'VIRTUAL'
                    ? 'border-[#0A2540] bg-slate-50'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="text-sm font-bold text-[#0F172A]">کارت مجازی آنی</div>
                <div className="text-[11px] text-[#475569] mt-1">صدور در لحظه · بدون کارمزد</div>
              </button>
              <button
                type="button"
                onClick={() => setIssueType('PHYSICAL')}
                className={`p-3.5 rounded-lg border text-right cursor-pointer transition-colors ${
                  issueType === 'PHYSICAL'
                    ? 'border-[#0A2540] bg-slate-50'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="text-sm font-bold text-[#0F172A]">کارت فیزیکی شتابی</div>
                <div className="text-[11px] text-[#475569] mt-1">ارسال پستی به کد پستی تاییدشده</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={issuing}
            className="w-full py-3 px-4 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>صدور کارت جدید</span>
          </button>
        </form>
      </div>

      {/* Card Ledger History */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#0F172A]">تراکنش‌های مرتبط با کارت و حساب</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-[#E2E8F0] text-xs text-[#475569]">
                <th className="py-3 px-4">شرح تراکنش</th>
                <th className="py-3 px-4">کد پیگیری</th>
                <th className="py-3 px-4">زمان</th>
                <th className="py-3 px-4">مبلغ</th>
                <th className="py-3 px-4">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {cardTransactions.slice(0, 5).map((tx) => (
                <tr key={tx.id}>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#0F172A]">{tx.counterpartyName}</div>
                    <div className="text-xs text-[#475569]">{tx.description}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#475569] dir-ltr text-right tabular-nums">
                    {tx.bankReferenceCode}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#475569] tabular-nums">{tx.persianTime}</td>
                  <td className="py-3 px-4 font-bold tabular-nums">
                    {formatMoney(tx.amountIrr, currencyUnit)}
                  </td>
                  <td className="py-3 px-4">
                    <TransactionStatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
