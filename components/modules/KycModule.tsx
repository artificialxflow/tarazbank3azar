'use client';

import { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Fingerprint,
  Loader2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { formatMoney, getKycTierLabel, toLatinDigits, toPersianDigits } from '@/lib/format';
import type { CurrencyUnit, TarazStateSnapshot } from '@/lib/types';

interface KycModuleProps {
  data: TarazStateSnapshot;
  currencyUnit: CurrencyUnit;
  onStateUpdate: (next: TarazStateSnapshot) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

export function KycModule({
  data,
  currencyUnit,
  onStateUpdate,
  onNotify,
}: KycModuleProps) {
  const [nationalCode, setNationalCode] = useState(data.user.nationalCode);
  const [postalCode, setPostalCode] = useState(data.kyc.postalCode || '1968643115');
  const [loadingStep, setLoadingStep] = useState<'SHAHKAR' | 'LIVENESS' | 'POSTAL' | null>(null);

  const handleVerify = async (step: 'SHAHKAR' | 'LIVENESS' | 'POSTAL') => {
    setLoadingStep(step);
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          nationalCode: toLatinDigits(nationalCode),
          postalCode: toLatinDigits(postalCode),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در استعلام هویتی.', 'error');
        return;
      }
      onStateUpdate(json.state);
      onNotify(
        step === 'POSTAL'
          ? 'کد پستی تایید شد و حساب شما به سطح ۳ (سازمانی ویژه) ارتقا یافت.'
          : 'مرحله احراز هویت با موفقیت تایید شد.',
        'success'
      );
    } catch {
      onNotify('عدم برقراری ارتباط با سرویس استعلام هویتی.', 'error');
    } finally {
      setLoadingStep(null);
    }
  };

  const completedSteps = [
    data.kyc.shahkarVerified,
    data.kyc.livenessVerified,
    data.kyc.postalVerified,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">احراز هویت هوشمند (KYC)</h1>
          <p className="text-sm text-[#475569] mt-1">
            استعلام آنی از سامانه شاهکار، تطبیق بیومتریک و ارتقای سقف‌های انتقال وجه و معامله امن
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5">
          <ShieldCheck className="w-5 h-5 text-[#059669] shrink-0" />
          <span className="text-[#475569]">سطح فعلی:</span>
          <span className="font-bold text-[#0A2540]">{getKycTierLabel(data.kyc.tier)}</span>
        </div>
      </div>

      {/* Progress & Limits Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="text-xs text-[#475569]">پیشرفت تکمیل پروفایل هویتی</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#0F172A] tabular-nums">
              {toPersianDigits(completedSteps)} از ۳ مرحله
            </span>
            <span className="text-xs font-medium text-[#059669] tabular-nums">
              {toPersianDigits(Math.round((completedSteps / 3) * 100))}٪
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-[#059669] rounded-full transition-all"
              style={{ width: `${Math.round((completedSteps / 3) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="text-xs text-[#475569]">سقف انتقال روزانه فعلی</div>
          <div className="text-xl font-bold text-[#0F172A] mt-2 tabular-nums">
            {formatMoney(data.kyc.dailyTransferLimitIrr, currencyUnit)}
          </div>
          <div className="text-xs text-[#475569] mt-1.5">
            قابل ارتقا تا ۱ میلیارد تومان در سطح ۳
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="text-xs text-[#475569]">سقف قرارداد معامله امن</div>
          <div className="text-xl font-bold text-[#0F172A] mt-2 tabular-nums">
            {formatMoney(data.kyc.escrowLimitIrr, currencyUnit)}
          </div>
          <div className="text-xs text-[#475569] mt-1.5">
            معتبر برای قراردادهای چندمرحله‌ای تراز
          </div>
        </div>
      </div>

      {/* 3 Verification Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Step 1: Shahkar */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0A2540] flex items-center justify-center">
                <Fingerprint className="w-5 h-5" />
              </div>
              {data.kyc.shahkarVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#059669]">
                  <CheckCircle2 className="w-4 h-4" />
                  تاییدشده
                </span>
              ) : (
                <span className="text-xs text-[#D97706] font-medium">در انتظار تکمیل</span>
              )}
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">۱. استعلام شاهکار و ثبت احوال</h2>
            <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
              تطبیق مالکیت شماره تلفن همراه با کد ملی متقاضی از طریق درگاه استعلام بانکی.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">کد ملی</label>
                <input
                  type="text"
                  value={nationalCode}
                  onChange={(e) => setNationalCode(e.target.value)}
                  maxLength={10}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#CBD5E1] dir-ltr text-right tabular-nums focus:outline-none focus:border-[#0A2540]"
                />
              </div>
              <div className="text-xs text-[#475569] flex items-center justify-between">
                <span>شماره همراه تاییدشده:</span>
                <span className="dir-ltr font-medium text-[#0F172A] tabular-nums">
                  {data.user.mobile}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleVerify('SHAHKAR')}
            disabled={loadingStep === 'SHAHKAR'}
            className="mt-5 w-full py-2.5 px-4 rounded-lg border border-[#CBD5E1] bg-slate-50 hover:bg-slate-100 text-sm font-medium text-[#0A2540] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loadingStep === 'SHAHKAR' && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{data.kyc.shahkarVerified ? 'استعلام مجدد شاهکار' : 'اجرای استعلام شاهکار'}</span>
          </button>
        </div>

        {/* Step 2: Liveness */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0A2540] flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              {data.kyc.livenessVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#059669]">
                  <CheckCircle2 className="w-4 h-4" />
                  تاییدشده
                </span>
              ) : (
                <span className="text-xs text-[#D97706] font-medium">در انتظار تکمیل</span>
              )}
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">۲. احراز هویت تصویری و کارت ملی</h2>
            <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
              بررسی زنده‌بودن چهره (Liveness Detection) و تطبیق تصویر کارت هوشمند ملی برای فعال‌سازی سطح ۲.
            </p>
            <div className="mt-4 py-4 px-3 rounded-lg bg-[#F1F5F9] text-xs text-[#475569] space-y-1.5">
              <div className="flex justify-between">
                <span>تصویر کارت ملی هوشمند:</span>
                <span className="font-medium text-[#059669]">تطبیق ۹۸٪</span>
              </div>
              <div className="flex justify-between">
                <span>ویدئوی کوتاه احراز چهره:</span>
                <span className="font-medium text-[#059669]">تایید سیستمی</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleVerify('LIVENESS')}
            disabled={loadingStep === 'LIVENESS'}
            className="mt-5 w-full py-2.5 px-4 rounded-lg border border-[#CBD5E1] bg-slate-50 hover:bg-slate-100 text-sm font-medium text-[#0A2540] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loadingStep === 'LIVENESS' && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {data.kyc.livenessVerified ? 'بروزرسانی تاییدیه تصویری' : 'شروع احراز هویت تصویری'}
            </span>
          </button>
        </div>

        {/* Step 3: Postal Code & Tier 3 Upgrade */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              {data.kyc.postalVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#059669]">
                  <CheckCircle2 className="w-4 h-4" />
                  تاییدشده (سطح ۳)
                </span>
              ) : (
                <span className="text-xs text-[#D97706] font-medium">ارتقا به سطح ۳</span>
              )}
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">۳. استعلام کد پستی و سکونت</h2>
            <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
              تایید نشانی رسمی جهت ارسال کارت فیزیکی ترازبانک و ارتقا به سقف‌های سازمانی سطح ۳.
            </p>
            <div className="mt-4">
              <label className="block text-xs font-medium text-[#475569] mb-1">
                کد پستی ۱۰ رقمی
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                maxLength={10}
                placeholder="1968643115"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#CBD5E1] dir-ltr text-right tabular-nums focus:outline-none focus:border-[#0A2540]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleVerify('POSTAL')}
            disabled={loadingStep === 'POSTAL'}
            className="mt-5 w-full py-2.5 px-4 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loadingStep === 'POSTAL' && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {data.kyc.postalVerified ? 'تایید مجدد کد پستی' : 'تایید کد پستی و ارتقا به سطح ۳'}
            </span>
          </button>
        </div>
      </div>

      {/* Tier Comparison Matrix */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#0F172A]">جدول سطوح کاربری و سقف خدمات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-[#E2E8F0] text-xs text-[#475569]">
                <th className="py-3 px-4">سطح کاربری</th>
                <th className="py-3 px-4">الزامات احراز هویت</th>
                <th className="py-3 px-4">سقف انتقال روزانه</th>
                <th className="py-3 px-4">سقف قرارداد معامله امن</th>
                <th className="py-3 px-4">صدور کارت فیزیکی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              <tr className={data.kyc.tier === 'TIER_1' ? 'bg-blue-50/40' : ''}>
                <td className="py-3.5 px-4 font-bold text-[#0F172A]">سطح ۱ (پایه)</td>
                <td className="py-3.5 px-4 text-xs text-[#475569]">تایید شاهکار و شماره همراه</td>
                <td className="py-3.5 px-4 tabular-nums">{formatMoney(500_000_000, currencyUnit)}</td>
                <td className="py-3.5 px-4 tabular-nums">{formatMoney(1_000_000_000, currencyUnit)}</td>
                <td className="py-3.5 px-4 text-xs text-[#475569]">فقط کارت مجازی</td>
              </tr>
              <tr className={data.kyc.tier === 'TIER_2' ? 'bg-blue-50/40' : ''}>
                <td className="py-3.5 px-4 font-bold text-[#0F172A]">سطح ۲ (احراز کامل)</td>
                <td className="py-3.5 px-4 text-xs text-[#475569]">شاهکار + احراز هویت تصویری</td>
                <td className="py-3.5 px-4 tabular-nums">{formatMoney(2_000_000_000, currencyUnit)}</td>
                <td className="py-3.5 px-4 tabular-nums">{formatMoney(5_000_000_000, currencyUnit)}</td>
                <td className="py-3.5 px-4 text-xs text-[#059669]">فعال (ارسال به نشانی)</td>
              </tr>
              <tr className={data.kyc.tier === 'TIER_3' ? 'bg-emerald-50/40' : ''}>
                <td className="py-3.5 px-4 font-bold text-[#0A2540]">سطح ۳ (سازمانی ویژه)</td>
                <td className="py-3.5 px-4 text-xs text-[#475569]">تکمیل کد پستی + تایید آدرس رسمی</td>
                <td className="py-3.5 px-4 font-bold tabular-nums">{formatMoney(10_000_000_000, currencyUnit)}</td>
                <td className="py-3.5 px-4 font-bold tabular-nums">{formatMoney(25_000_000_000, currencyUnit)}</td>
                <td className="py-3.5 px-4 text-xs text-[#059669]">اولویت صدور و کارگزار اختصاصی</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
