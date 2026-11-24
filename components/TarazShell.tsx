'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeftRight,
  Building2,
  CreditCard,
  Fingerprint,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Video,
  Wallet,
  X,
} from 'lucide-react';
import { formatMoney, getKycTierLabel, toPersianDigits } from '@/lib/format';
import type {
  CurrencyUnit,
  ModuleKey,
  TarazStateSnapshot,
  WorkspaceRole,
} from '@/lib/types';
import { BrandLogo } from './BrandLogo';
import { AccountsModule } from './modules/AccountsModule';
import { CardsModule } from './modules/CardsModule';
import { KycModule } from './modules/KycModule';
import { MeetingsModule } from './modules/MeetingsModule';
import { OpsReconciliationModule } from './modules/OpsReconciliationModule';
import { OverviewModule } from './modules/OverviewModule';
import { SafeDealModule } from './modules/SafeDealModule';
import { TransfersModule } from './modules/TransfersModule';
import { WalletModule } from './modules/WalletModule';

interface TarazShellProps {
  initialData: TarazStateSnapshot;
}

const CUSTOMER_NAV: {
  key: ModuleKey;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: 'overview', label: 'داشبورد مدیریتی', icon: LayoutDashboard },
  { key: 'accounts', label: 'افتتاح حساب و سپرده‌ها', icon: Building2 },
  { key: 'cards', label: 'صدور و مدیریت کارت', icon: CreditCard },
  { key: 'transfers', label: 'انتقال وجه چندبستری', icon: ArrowLeftRight },
  { key: 'safedeal', label: 'اتاق معامله امن', icon: ShieldCheck },
  { key: 'wallet', label: 'کیف پول و تبدیل ارز', icon: Wallet },
  { key: 'meetings', label: 'اتاق جلسات آنلاین', icon: Video },
  { key: 'kyc', label: 'احراز هویت هوشمند', icon: Fingerprint },
];

export function TarazShell({ initialData }: TarazShellProps) {
  const [data, setData] = useState<TarazStateSnapshot>(initialData);
  const [role, setRole] = useState<WorkspaceRole>('CUSTOMER');
  const [activeModule, setActiveModule] = useState<ModuleKey>('overview');
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>('TOMAN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'warning' | 'error';
  } | null>(null);

  const showToast = (
    message: string,
    tone: 'success' | 'warning' | 'error' = 'success'
  ) => {
    setToast({ message, tone });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5200);
  };

  const handleRoleSwitch = (nextRole: WorkspaceRole) => {
    setRole(nextRole);
    if (nextRole === 'OPS') {
      setActiveModule('ops');
    } else if (activeModule === 'ops') {
      setActiveModule('overview');
    }
    setMobileMenuOpen(false);
  };

  const handleNavigate = (module: ModuleKey) => {
    if (module === 'ops') {
      setRole('OPS');
    } else {
      setRole('CUSTOMER');
    }
    setActiveModule(module);
    setMobileMenuOpen(false);
  };

  const summary = useMemo(() => {
    const totalBalanceIrr =
      data.accounts.reduce((sum, a) => sum + a.availableBalanceIrr + a.blockedBalanceIrr, 0) +
      data.walletAssets.reduce((sum, w) => sum + Math.round(w.balance * w.rateIrr), 0);
    const pendingInquiryCount = data.transactions.filter(
      (t) => t.status === 'PENDING_INQUIRY'
    ).length;
    return { totalBalanceIrr, pendingInquiryCount };
  }, [data]);

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#0A2540] text-white select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
        <BrandLogo variant="dark" />
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-slate-300 hover:text-white cursor-pointer"
          aria-label="بستن منو"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {role === 'CUSTOMER' ? (
          <>
            <div className="px-3 pb-2 text-[11px] font-medium text-slate-400">
              ماژول‌های بانکداری و معامله امن
            </div>
            {CUSTOMER_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </>
        ) : (
          <>
            <div className="px-3 pb-2 text-[11px] font-medium text-slate-400">
              کنسول عملیات و مغایرت‌گیری
            </div>
            <button
              type="button"
              onClick={() => handleNavigate('ops')}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium bg-[#1E3A8A] text-white cursor-pointer"
            >
              <span className="flex items-center gap-3 truncate">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">صف مغایرت‌گیری بانکی</span>
              </span>
              {summary.pendingInquiryCount > 0 && (
                <span className="text-xs font-bold text-amber-300 tabular-nums shrink-0">
                  {toPersianDigits(summary.pendingInquiryCount)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('transfers')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/8 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">شبیه‌ساز انتقال و Timeout</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('safedeal')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/8 hover:text-white transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">نظارت اتاق معامله امن</span>
            </button>
          </>
        )}
      </nav>

      {/* Sidebar User Footer */}
      <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1E3A8A] border border-white/15 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {data.user.fullName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{data.user.fullName}</div>
            <div className="text-[11px] text-slate-300 truncate">{data.user.roleTitle}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleRoleSwitch(role === 'CUSTOMER' ? 'OPS' : 'CUSTOMER')}
          className="w-full py-2 px-3 rounded-lg bg-white/8 hover:bg-white/14 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
        >
          {role === 'CUSTOMER'
            ? `تغییر به پنل عملیات (${toPersianDigits(summary.pendingInquiryCount)} مغایرت)`
            : 'بازگشت به پنل مشتری'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      {/* Desktop Fixed Right Sidebar (RTL Start) */}
      <aside className="hidden lg:block w-[260px] shrink-0 fixed inset-y-0 start-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-[270px] max-w-[82vw] h-full shadow-xl">{sidebarContent}</div>
          <button
            type="button"
            aria-label="بستن منو"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1 bg-slate-900/50 cursor-pointer"
          />
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:ps-[260px] flex flex-col min-w-0">
        {/* Clean Single-Row Status-Aware Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E2E8F0] px-4 lg:px-8 flex items-center justify-between gap-4">
          {/* Right Side (RTL Start): Mobile trigger + BaaS & Portfolio Status Metadata */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#E2E8F0] text-[#0A2540] cursor-pointer shrink-0"
              aria-label="باز کردن منو"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-2.5 text-xs text-[#475569] min-w-0 truncate">
              <span className="font-medium text-[#059669] whitespace-nowrap shrink-0">
                BaaS متصل ({data.baasHealth.uptimePercent})
              </span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0">
                دارایی کل:{' '}
                <strong className="text-[#0F172A] tabular-nums">
                  {formatMoney(summary.totalBalanceIrr, currencyUnit)}
                </strong>
              </span>
              <span className="hidden xl:inline" aria-hidden="true">
                ·
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 text-[#0A2540] font-medium whitespace-nowrap shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-[#059669]" />
                {getKycTierLabel(data.kyc.tier)}
              </span>
            </div>
          </div>

          {/* Left Side (RTL End): Currency Toggle + Customer/Ops Workspace Switcher */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Toman / Rial Toggle */}
            <div
              className="flex items-center p-1 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]"
              role="group"
              aria-label="واحد پول نمایشی"
            >
              <button
                type="button"
                onClick={() => setCurrencyUnit('TOMAN')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  currencyUnit === 'TOMAN'
                    ? 'bg-white text-[#0A2540] shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                تومان
              </button>
              <button
                type="button"
                onClick={() => setCurrencyUnit('RIAL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  currencyUnit === 'RIAL'
                    ? 'bg-white text-[#0A2540] shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                ریال
              </button>
            </div>

            {/* Instant Customer / Ops Role Switcher */}
            <div
              className="flex items-center p-1 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]"
              role="group"
              aria-label="تغییر فضای کاری"
            >
              <button
                type="button"
                onClick={() => handleRoleSwitch('CUSTOMER')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  role === 'CUSTOMER'
                    ? 'bg-[#0A2540] text-white'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                پنل مشتری
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('OPS')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  role === 'OPS'
                    ? 'bg-[#0A2540] text-white'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                پنل عملیات
                {summary.pendingInquiryCount > 0
                  ? ` (${toPersianDigits(summary.pendingInquiryCount)})`
                  : ''}
              </button>
            </div>
          </div>
        </header>

        {/* Active Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="px-4 lg:px-8 pt-4"
            >
              <div
                className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                  toast.tone === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-[#059669]'
                    : toast.tone === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                      : 'bg-red-50 border-red-200 text-[#DC2626]'
                }`}
              >
                <span>{toast.message}</span>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="p-1 opacity-75 hover:opacity-100 cursor-pointer shrink-0"
                  aria-label="بستن پیام"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Workspace Viewport */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1440px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              {activeModule === 'overview' && (
                <OverviewModule
                  data={data}
                  currencyUnit={currencyUnit}
                  onNavigate={handleNavigate}
                  onSwitchRole={handleRoleSwitch}
                />
              )}
              {activeModule === 'kyc' && (
                <KycModule
                  data={data}
                  currencyUnit={currencyUnit}
                  onStateUpdate={setData}
                  onNotify={showToast}
                />
              )}
              {activeModule === 'accounts' && (
                <AccountsModule
                  data={data}
                  currencyUnit={currencyUnit}
                  onStateUpdate={setData}
                  onNotify={showToast}
                />
              )}
              {activeModule === 'cards' && (
                <CardsModule
                  data={data}
                  currencyUnit={currencyUnit}
                  onStateUpdate={setData}
                  onNotify={showToast}
                />
              )}
              {activeModule === 'transfers' && (
                <TransfersModule
                  data={data}
                  currencyUnit={currencyUnit}
                  onStateUpdate={setData}
                  onNotify={showToast}
                  onSwitchRole={handleRoleSwitch}
                />
              )}
              {activeModule === 'safedeal' && (
                <SafeDealModule
                  data={data}
                  currencyUnit={currencyUnit}
                  onStateUpdate={setData}
                  onNotify={showToast}
                />
              )}
              {activeModule === 'wallet' && (
                <WalletModule
                  data={data}
                  currencyUnit={currencyUnit}
                  onStateUpdate={setData}
                  onNotify={showToast}
                />
              )}
              {activeModule === 'meetings' && (
                <MeetingsModule
                  data={data}
                  onStateUpdate={setData}
                  onNotify={showToast}
                />
              )}
              {activeModule === 'ops' && (
                <OpsReconciliationModule
                  data={data}
                  currencyUnit={currencyUnit}
                  onStateUpdate={setData}
                  onNotify={showToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
