'use client';

interface BrandLogoProps {
  variant?: 'dark' | 'light';
  compact?: boolean;
}

export function BrandLogo({ variant = 'dark', compact = false }: BrandLogoProps) {
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-3 shrink-0 select-none">
      <div
        className={`flex items-center justify-center rounded-xl shrink-0 ${
          compact ? 'w-9 h-9' : 'w-10 h-10'
        } ${isDark ? 'bg-white/10 border border-white/15' : 'bg-[#0A2540]'}`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className={compact ? 'w-6 h-6' : 'w-7 h-7'}
          aria-hidden="true"
        >
          <path
            d="M24 5.5L39 14V29.5C39 34.8 32.7 39.6 24 42.5C15.3 39.6 9 34.8 9 29.5V14L24 5.5Z"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M24 5.5L39 14V18"
            stroke="#10B981"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 21.5H31.2L26.8 17.1"
            stroke="#10B981"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M32 27.2H16.8L21.2 31.6"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col leading-tight">
          <span
            className={`text-base font-bold whitespace-nowrap ${
              isDark ? 'text-white' : 'text-[#0A2540]'
            }`}
          >
            ترازبانک
          </span>
          <span
            className={`text-[11px] font-medium whitespace-nowrap ${
              isDark ? 'text-slate-300' : 'text-[#475569]'
            }`}
          >
            TarazBank Core
          </span>
        </div>
      )}
    </div>
  );
}
