import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ترازبانک | پلتفرم جامع فینتک و معامله امن',
  description:
    'پلتفرم جامع فینتک، بانکداری باز (BaaS)، انتقال وجه چندبستری، کیف پول چندارزی، اتاق معامله امن و پنل عملیات مغایرت‌گیری ترازبانک',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'ترازبانک | پلتفرم جامع فینتک و معامله امن',
    description:
      'پلتفرم جامع فینتک، بانکداری باز (BaaS)، انتقال وجه چندبستری و اتاق معامله امن با پنل مغایرت‌گیری',
    type: 'website',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ترازبانک | پلتفرم جامع فینتک و معامله امن',
    description:
      'پلتفرم جامع فینتک، بانکداری باز (BaaS)، انتقال وجه چندبستری و اتاق معامله امن با پنل مغایرت‌گیری',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body suppressHydrationWarning className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-sans">
        {children}
      </body>
    </html>
  );
}
