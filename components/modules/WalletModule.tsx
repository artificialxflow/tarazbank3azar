'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Coins, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCrypto, formatMoney, toLatinDigits, toPersianDigits } from '@/lib/format';
import type { CurrencyUnit, TarazStateSnapshot, WalletAsset } from '@/lib/types';

interface WalletModuleProps {
  data: TarazStateSnapshot;
  currencyUnit: CurrencyUnit;
  onStateUpdate: (next: TarazStateSnapshot) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

export function WalletModule({
  data,
  currencyUnit,
  onStateUpdate,
  onNotify,
}: WalletModuleProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<WalletAsset['symbol']>('USDT');
  const [side, setSide] = useState<'BUY_CRYPTO' | 'SELL_CRYPTO'>('BUY_CRYPTO');
  const [bankAccountId, setBankAccountId] = useState(data.accounts[0]?.id || '');
  const [amountInput, setAmountInput] = useState('15000000');
  const [swapping, setSwapping] = useState(false);

  const selectedAsset =
    data.walletAssets.find((a) => a.symbol === selectedSymbol) || data.walletAssets[0];

  const amountIrr = useMemo(() => {
    const raw = Number(toLatinDigits(amountInput).replace(/[^\d]/g, '')) || 0;
    return currencyUnit === 'TOMAN' ? raw * 10 : raw;
  }, [amountInput, currencyUnit]);

  const feeIrr = Math.round(amountIrr * 0.0025);
  const estimatedCrypto = selectedAsset ? amountIrr / selectedAsset.rateIrr : 0;

  const totalCryptoPortfolioIrr = useMemo(
    () =>
      data.walletAssets.reduce((sum, w) => sum + Math.round(w.balance * w.rateIrr), 0),
    [data.walletAssets]
  );

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwapping(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccountId: bankAccountId || data.accounts[0]?.id,
          symbol: selectedSymbol,
          side,
          amountIrr,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در اجرای تبدیل ارز.', 'error');
        return;
      }
      onStateUpdate(json.state);
      onNotify(
        side === 'BUY_CRYPTO'
          ? `تبدیل ریالی انجام شد و ${formatCrypto(json.cryptoDelta, selectedSymbol)} به کیف پول شما اضافه گردید.`
          : `فروش ${formatCrypto(json.cryptoDelta, selectedSymbol)} انجام و معادل آن به حساب بانکی واریز شد.`,
        'success'
      );
    } catch {
      onNotify('عدم برقراری ارتباط با موتور تبدیل ارز.', 'error');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">کیف پول چندارزی و تبدیل آنی (FIAT-to-Coin)</h1>
          <p className="text-sm text-[#475569] mt-1">
            نگهداری دارایی‌های ریالی و رمزارزی و تبدیل آنی از حساب بانکی تراز به تتر، بیت‌کوین، اتریوم و طلای دیجیتال
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#059669]" />
          <span className="text-[#475569]">ارزش کل دارایی‌های رمزارزی:</span>
          <strong className="text-[#0A2540] tabular-nums">
            {formatMoney(totalCryptoPortfolioIrr, currencyUnit)}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Assets Portfolio Grid (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0]">
            <h2 className="text-base font-bold text-[#0F172A]">سبد دارایی‌های کیف پول</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-[#E2E8F0] text-xs text-[#475569]">
                  <th className="py-3 px-4">دارایی</th>
                  <th className="py-3 px-4">موجودی</th>
                  <th className="py-3 px-4">نرخ لحظه‌ای</th>
                  <th className="py-3 px-4">تغییر ۲۴h</th>
                  <th className="py-3 px-4">ارزش معادل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {data.walletAssets.map((asset) => {
                  const valueIrr = Math.round(asset.balance * asset.rateIrr);
                  const isSelected = asset.symbol === selectedSymbol;
                  return (
                    <tr
                      key={asset.symbol}
                      onClick={() => setSelectedSymbol(asset.symbol)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{asset.nameFa}</div>
                        <div className="text-xs text-[#475569] dir-ltr text-right">{asset.symbol}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0A2540] dir-ltr text-right tabular-nums">
                        {formatCrypto(asset.balance, asset.symbol)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#475569] tabular-nums whitespace-nowrap">
                        {formatMoney(asset.rateIrr, currencyUnit)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium tabular-nums whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            asset.change24h >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                          }`}
                        >
                          {asset.change24h >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span className="dir-ltr">
                            {asset.change24h >= 0 ? '+' : ''}
                            {toPersianDigits(asset.change24h)}٪
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0F172A] tabular-nums whitespace-nowrap">
                        {formatMoney(valueIrr, currencyUnit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instant FIAT-to-Coin Converter (5 cols) */}
        <form
          onSubmit={handleSwap}
          className="xl:col-span-5 bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F172A]">مبدل آنی فیات به رمزارز</h2>
            <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
              <button
                type="button"
                onClick={() => setSide('BUY_CRYPTO')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  side === 'BUY_CRYPTO'
                    ? 'bg-[#059669] text-white'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                خرید رمزارز
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL_CRYPTO')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  side === 'SELL_CRYPTO'
                    ? 'bg-[#0A2540] text-white'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                فروش به تومان
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">حساب ریالی متصل</label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
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
            <label className="block text-xs font-medium text-[#475569] mb-1.5">انتخاب رمزارز</label>
            <div className="grid grid-cols-4 gap-2">
              {data.walletAssets.map((a) => (
                <button
                  key={a.symbol}
                  type="button"
                  onClick={() => setSelectedSymbol(a.symbol)}
                  className={`py-2 rounded-lg border text-xs font-bold dir-ltr cursor-pointer ${
                    selectedSymbol === a.symbol
                      ? 'border-[#0A2540] bg-[#0A2540] text-white'
                      : 'border-[#E2E8F0] text-[#0F172A] hover:border-[#CBD5E1]'
                  }`}
                >
                  {a.symbol}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              مبلغ معامله ({currencyUnit === 'TOMAN' ? 'تومان' : 'ریال'})
            </label>
            <input
              type="text"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] dir-ltr text-right tabular-nums focus:outline-none focus:border-[#0A2540]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#F1F5F9] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#475569]">مقدار دریافتی / فروشی تقریبی:</span>
              <span className="font-bold text-[#0A2540] dir-ltr tabular-nums">
                {formatCrypto(estimatedCrypto, selectedSymbol)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#475569]">نرخ تبدیل لحظه‌ای:</span>
              <span className="font-medium text-[#0F172A] tabular-nums">
                {formatMoney(selectedAsset?.rateIrr || 0, currencyUnit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#475569]">کارمزد تبدیل (۰.۲۵٪):</span>
              <span className="font-medium text-[#475569] tabular-nums">
                {formatMoney(feeIrr, currencyUnit)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={swapping}
            className="w-full py-3 px-4 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {swapping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUpDown className="w-4 h-4" />
            )}
            <span>
              {side === 'BUY_CRYPTO'
                ? `تبدیل آنی و خرید ${selectedSymbol}`
                : `فروش آنی ${selectedSymbol} به حساب بانکی`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
