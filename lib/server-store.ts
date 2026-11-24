import crypto from 'node:crypto';
import { calculateRailFeeIrr, toPersianDigits } from './format';
import type {
  AccountType,
  BankAccount,
  BankCard,
  LedgerTransaction,
  MeetingSession,
  RailType,
  SafeDealContract,
  TarazStateSnapshot,
  WalletAsset,
} from './types';

interface ServerStore {
  state: TarazStateSnapshot;
  idempotencyMap: Map<string, LedgerTransaction>;
}

const globalForTaraz = globalThis as unknown as {
  __tarazBankStore?: ServerStore;
};

function currentPersianTime(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `۱۴۰۵/۰۹/۰۳ · ${toPersianDigits(h)}:${toPersianDigits(m)}`;
}

function generateReferenceCode(prefix: string): string {
  const digits = crypto.randomInt(10000000, 99999999);
  return `${prefix}-${digits}`;
}

function createSeedState(): ServerStore {
  const accounts: BankAccount[] = [
    {
      id: 'acc-1',
      title: 'حساب اصلی تجاری تراز',
      accountType: 'CURRENT_GHARZOLHASANEH',
      accountNumber: '211-810-492018-1',
      iban: 'IR060570021181004920180001',
      availableBalanceIrr: 4_339_000_000, // 433,900,000 Toman
      blockedBalanceIrr: 1_250_000_000, // 125,000,000 Toman (Escrow + pending inquiry)
      status: 'ACTIVE',
      baasAccountRef: 'BAAS-DEP-88412',
      createdAt: '۱۴۰۴/۱۱/۱۴',
    },
    {
      id: 'acc-2',
      title: 'سپرده کوتاه‌مدت خزانه',
      accountType: 'SHORT_TERM_DEPOSIT',
      accountNumber: '211-115-908432-4',
      iban: 'IR420570021111509084320004',
      availableBalanceIrr: 2_845_000_000, // 284,500,000 Toman
      blockedBalanceIrr: 0,
      status: 'ACTIVE',
      baasAccountRef: 'BAAS-DEP-90211',
      createdAt: '۱۴۰۵/۰۲/۰۹',
    },
  ];

  const cards: BankCard[] = [
    {
      id: 'card-1',
      bankAccountId: 'acc-1',
      holderName: 'سهراب فرهادی',
      maskedPan: '6037-9975-4108-4821',
      lastFour: '4821',
      cardType: 'PHYSICAL',
      status: 'ACTIVE',
      expiryMonth: '11',
      expiryYear: '08',
      cvv2: '642',
      onlineEnabled: true,
      dailyLimitIrr: 500_000_000,
      issuedAt: '۱۴۰۴/۱۱/۱۸',
    },
    {
      id: 'card-2',
      bankAccountId: 'acc-2',
      holderName: 'سهراب فرهادی',
      maskedPan: '6037-9975-8820-9104',
      lastFour: '9104',
      cardType: 'VIRTUAL',
      status: 'ACTIVE',
      expiryMonth: '04',
      expiryYear: '07',
      cvv2: '319',
      onlineEnabled: true,
      dailyLimitIrr: 200_000_000,
      issuedAt: '۱۴۰۵/۰۵/۱۲',
    },
  ];

  const transactions: LedgerTransaction[] = [
    {
      id: 'tx-1001',
      bankAccountId: 'acc-1',
      idempotencyKey: 'TRZ-IDEM-9941A7B2',
      railType: 'SATNA',
      direction: 'DEBIT',
      amountIrr: 450_000_000,
      feeIrr: 90_000,
      counterpartyName: 'شرکت بازرگانی سپهر آریا',
      destinationRef: 'IR740120020000007348192001',
      description: 'تسویه پیش‌پرداخت محموله تجهیزات شبکه',
      status: 'PENDING_INQUIRY',
      reconciliationStatus: 'NEEDS_INQUIRY',
      bankReferenceCode: 'SAT-84920144',
      inquiryAttempts: 1,
      lastInquiryNote: 'پاسخ سوئیچ بانک همکار پس از ۱۵ ثانیه منقضی شد؛ وجه در حساب بلوکه موقت است.',
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      persianTime: '۱۴۰۵/۰۹/۰۳ · ۱۰:۱۲',
    },
    {
      id: 'tx-1002',
      bankAccountId: 'acc-1',
      idempotencyKey: 'TRZ-IDEM-8820C4D1',
      railType: 'PAYA',
      direction: 'CREDIT',
      amountIrr: 1_280_000_000,
      feeIrr: 0,
      counterpartyName: 'هلدینگ فناوری پارس‌داده',
      destinationRef: 'IR060570021181004920180001',
      description: 'واریز مرحله دوم قرارداد توسعه زیرساخت',
      status: 'SUCCESS',
      reconciliationStatus: 'MATCHED',
      bankReferenceCode: 'PAY-40291832',
      inquiryAttempts: 0,
      lastInquiryNote: 'تطبیق خودکار با فایل تسویه پایا انجام شد.',
      createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      persianTime: '۱۴۰۵/۰۹/۰۳ · ۰۸:۵۵',
    },
    {
      id: 'tx-1003',
      bankAccountId: 'acc-1',
      idempotencyKey: 'TRZ-IDEM-7715F9E0',
      railType: 'POL',
      direction: 'DEBIT',
      amountIrr: 185_000_000,
      feeIrr: 37_000,
      counterpartyName: 'مهندس نیما رادمنش',
      destinationRef: 'IR180560080180002490128001',
      description: 'حق‌الزحمه ممیزی امنیتی سامانه',
      status: 'SUCCESS',
      reconciliationStatus: 'MATCHED',
      bankReferenceCode: 'POL-91827364',
      inquiryAttempts: 0,
      lastInquiryNote: 'تسویه آنی پل تایید شد.',
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      persianTime: '۱۴۰۵/۰۹/۰۲ · ۱۶:۴۰',
    },
    {
      id: 'tx-1004',
      bankAccountId: 'acc-2',
      idempotencyKey: 'TRZ-IDEM-6610K3M9',
      railType: 'PAYA',
      direction: 'DEBIT',
      amountIrr: 320_000_000,
      feeIrr: 25_000,
      counterpartyName: 'تامین تجهیزات مهرگان',
      destinationRef: 'IR900170000000104829100002',
      description: 'خرید سرورهای رک‌مونت دیتاسنتر',
      status: 'PENDING_INQUIRY',
      reconciliationStatus: 'NEEDS_INQUIRY',
      bankReferenceCode: 'PAY-77319042',
      inquiryAttempts: 2,
      lastInquiryNote: 'اختلاف کد وضعیت در چرخه پایا؛ نیازمند استعلام مجدد از BaaS.',
      createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
      persianTime: '۱۴۰۵/۰۹/۰۲ · ۱۳:۲۰',
    },
    {
      id: 'tx-1005',
      bankAccountId: 'acc-1',
      idempotencyKey: 'TRZ-IDEM-5502P8R4',
      railType: 'ESCROW',
      direction: 'DEBIT',
      amountIrr: 800_000_000,
      feeIrr: 0,
      counterpartyName: 'حساب امانی ترازبانک (SD-1405-882)',
      destinationRef: 'ESCROW-SD-1405-882',
      description: 'بلوکه وجه ضمانت قرارداد خرید ۳ دستگاه چاپ صنعتی',
      status: 'SUCCESS',
      reconciliationStatus: 'MATCHED',
      bankReferenceCode: 'ESC-55102938',
      inquiryAttempts: 0,
      lastInquiryNote: 'وجه در سرفصل امانی قفل شد.',
      createdAt: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
      persianTime: '۱۴۰۵/۰۹/۰۱ · ۱۱:۰۵',
    },
    {
      id: 'tx-1006',
      bankAccountId: 'acc-1',
      idempotencyKey: 'TRZ-IDEM-4401Q2W7',
      railType: 'CARD_TO_CARD',
      direction: 'DEBIT',
      amountIrr: 65_000_000,
      feeIrr: 21_600,
      counterpartyName: 'الهام کاظمی',
      destinationRef: '6219-8610-3391-7024',
      description: 'تسویه هزینه طراحی گرافیک و بسته‌بندی',
      status: 'FAILED',
      reconciliationStatus: 'RESOLVED_REVERSED',
      bankReferenceCode: 'SHB-39104821',
      inquiryAttempts: 1,
      lastInquiryNote: 'کارت مقصد غیرفعال بود؛ برگشت وجه خودکار انجام شد.',
      createdAt: new Date(Date.now() - 1000 * 60 * 1400).toISOString(),
      persianTime: '۱۴۰۵/۰۸/۳۰ · ۱۹:۱۵',
    },
  ];

  const safeDeals: SafeDealContract[] = [
    {
      id: 'sd-1',
      contractCode: 'SD-1405-882',
      title: 'خرید و تحویل ۳ دستگاه چاپگر لیزری صنعتی',
      category: 'تجهیزات صنعتی',
      buyerName: 'سهراب فرهادی',
      sellerName: 'شرکت ماشین‌آلات نگین صنعت',
      sellerNationalCode: '14008291042',
      sellerIban: 'IR510190000000218490123001',
      sellerVerified: true,
      sourceAccountId: 'acc-1',
      totalAmountIrr: 800_000_000,
      releasedAmountIrr: 0,
      status: 'OBLIGATION_SUBMITTED',
      milestones: [
        {
          id: 'ms-1',
          title: 'مرحله ۱: ارسال بارنامه و تحویل در انبار تهران',
          amountIrr: 500_000_000,
          status: 'SUBMITTED',
        },
        {
          id: 'ms-2',
          title: 'مرحله ۲: نصب، تست سلامت و تحویل ضمانت‌نامه',
          amountIrr: 300_000_000,
          status: 'PENDING',
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      persianDate: '۱۴۰۵/۰۹/۰۱',
    },
    {
      id: 'sd-2',
      contractCode: 'SD-1405-874',
      title: 'توسعه و تحویل کد منبع اپلیکیشن فروشگاهی',
      category: 'خدمات نرم‌افزاری',
      buyerName: 'سهراب فرهادی',
      sellerName: 'استودیو فناوری رایاکد',
      sellerNationalCode: '14009912345',
      sellerIban: 'IR330560080180009912345001',
      sellerVerified: true,
      sourceAccountId: 'acc-2',
      totalAmountIrr: 420_000_000,
      releasedAmountIrr: 420_000_000,
      status: 'RELEASED',
      milestones: [
        {
          id: 'ms-3',
          title: 'تحویل کامل مخزن گیت و مستندات استقرار',
          amountIrr: 420_000_000,
          status: 'RELEASED',
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(),
      persianDate: '۱۴۰۵/۰۸/۲۴',
    },
  ];

  const walletAssets: WalletAsset[] = [
    {
      symbol: 'USDT',
      nameFa: 'تتر (دلار دیجیتال)',
      balance: 2450.5,
      lockedBalance: 0,
      rateIrr: 685_000, // 68,500 Toman
      change24h: 0.42,
    },
    {
      symbol: 'BTC',
      nameFa: 'بیت‌کوین',
      balance: 0.0342,
      lockedBalance: 0,
      rateIrr: 62_450_000_000, // 6.245B Toman
      change24h: 2.18,
    },
    {
      symbol: 'ETH',
      nameFa: 'اتریوم',
      balance: 0.485,
      lockedBalance: 0,
      rateIrr: 2_310_000_000, // 231M Toman
      change24h: -0.85,
    },
    {
      symbol: 'PAXG',
      nameFa: 'طلای دیجیتال پکس‌گلد',
      balance: 0.62,
      lockedBalance: 0,
      rateIrr: 1_840_000_000, // 184M Toman
      change24h: 1.15,
    },
  ];

  const meetings: MeetingSession[] = [
    {
      id: 'meet-1',
      advisorName: 'دکتر مریم شریعتی',
      advisorTitle: 'مشاور ارشد حقوقی معاملات امن',
      specialty: 'قراردادهای بازرگانی و ضمانت امانی',
      topic: 'بررسی شروط آزادسازی مرحله دوم قرارداد SD-1405-882',
      relatedContractCode: 'SD-1405-882',
      persianDate: '۱۴۰۵/۰۹/۰۳',
      timeSlot: '۱۴:۳۰ تا ۱۵:۰۰',
      durationMinutes: 30,
      status: 'SCHEDULED',
      roomCode: 'TRZ-ROOM-4092',
    },
    {
      id: 'meet-2',
      advisorName: 'مهندس آرش بهرامی',
      advisorTitle: 'کارشناس خزانه‌داری و بانکداری باز',
      specialty: 'سقف‌های ساتنا/پایا و حساب‌های تجاری',
      topic: 'ارتقای سقف انتقال روزانه به سطح سازمانی ۳',
      persianDate: '۱۴۰۵/۰۹/۰۵',
      timeSlot: '۱۱:۰۰ تا ۱۱:۳۰',
      durationMinutes: 30,
      status: 'SCHEDULED',
      roomCode: 'TRZ-ROOM-4118',
    },
  ];

  const state: TarazStateSnapshot = {
    user: {
      id: 'usr-101',
      fullName: 'سهراب فرهادی',
      roleTitle: 'مدیر مالی · کارن تجارت پارس',
      mobile: '09123489210',
      email: 's.farhadi@tarazbank.example',
      nationalCode: '0018492031',
    },
    kyc: {
      tier: 'TIER_2',
      status: 'VERIFIED',
      shahkarVerified: true,
      livenessVerified: true,
      postalCode: '1968643115',
      postalVerified: false,
      dailyTransferLimitIrr: 2_000_000_000, // 200M Toman
      escrowLimitIrr: 5_000_000_000, // 500M Toman
      verifiedAt: '۱۴۰۵/۰۷/۱۹',
    },
    baasHealth: {
      partnerBank: 'بانک همکار (هسته شتاب / BaaS)',
      status: 'OPERATIONAL',
      uptimePercent: '۹۹.۹۴٪',
      lastSyncPersian: 'هم‌اکنون',
    },
    accounts,
    cards,
    transactions,
    safeDeals,
    walletAssets,
    meetings,
    cashflow7d: [
      { label: 'شنبه', inflowIrr: 620_000_000, outflowIrr: 410_000_000 },
      { label: 'یکشنبه', inflowIrr: 890_000_000, outflowIrr: 530_000_000 },
      { label: 'دوشنبه', inflowIrr: 480_000_000, outflowIrr: 640_000_000 },
      { label: 'سه‌شنبه', inflowIrr: 1_150_000_000, outflowIrr: 720_000_000 },
      { label: 'چهارشنبه', inflowIrr: 940_000_000, outflowIrr: 490_000_000 },
      { label: 'پنج‌شنبه', inflowIrr: 710_000_000, outflowIrr: 380_000_000 },
      { label: 'امروز', inflowIrr: 1_280_000_000, outflowIrr: 635_000_000 },
    ],
    cashflow30d: [
      { label: 'هفته ۱', inflowIrr: 3_420_000_000, outflowIrr: 2_190_000_000 },
      { label: 'هفته ۲', inflowIrr: 4_180_000_000, outflowIrr: 2_950_000_000 },
      { label: 'هفته ۳', inflowIrr: 3_890_000_000, outflowIrr: 2_610_000_000 },
      { label: 'هفته ۴', inflowIrr: 5_070_000_000, outflowIrr: 3_805_000_000 },
    ],
  };

  const idempotencyMap = new Map<string, LedgerTransaction>();
  for (const tx of transactions) {
    idempotencyMap.set(tx.idempotencyKey, tx);
  }

  return { state, idempotencyMap };
}

export function getStore(): ServerStore {
  if (!globalForTaraz.__tarazBankStore) {
    globalForTaraz.__tarazBankStore = createSeedState();
  }
  return globalForTaraz.__tarazBankStore;
}

export function getSnapshot(): TarazStateSnapshot {
  return getStore().state;
}

export function verifyKycStep(input: {
  step: 'SHAHKAR' | 'LIVENESS' | 'POSTAL';
  nationalCode?: string;
  mobile?: string;
  postalCode?: string;
}): { ok: true; state: TarazStateSnapshot } | { ok: false; error: string } {
  const store = getStore();
  const kyc = store.state.kyc;

  if (input.step === 'SHAHKAR') {
    const nc = (input.nationalCode || store.state.user.nationalCode).replace(/\D/g, '');
    if (nc.length !== 10) {
      return { ok: false, error: 'کد ملی باید دقیقاً ۱۰ رقم باشد.' };
    }
    store.state.user.nationalCode = nc;
    kyc.shahkarVerified = true;
  } else if (input.step === 'LIVENESS') {
    kyc.livenessVerified = true;
  } else if (input.step === 'POSTAL') {
    const pc = (input.postalCode || '').replace(/\D/g, '');
    if (pc.length !== 10) {
      return { ok: false, error: 'کد پستی باید دقیقاً ۱۰ رقم معتبر باشد.' };
    }
    kyc.postalCode = pc;
    kyc.postalVerified = true;
  }

  if (kyc.shahkarVerified && kyc.livenessVerified && kyc.postalVerified) {
    kyc.tier = 'TIER_3';
    kyc.status = 'VERIFIED';
    kyc.dailyTransferLimitIrr = 10_000_000_000; // 1B Toman
    kyc.escrowLimitIrr = 25_000_000_000; // 2.5B Toman
    kyc.verifiedAt = '۱۴۰۵/۰۹/۰۳';
  } else if (kyc.shahkarVerified && kyc.livenessVerified) {
    kyc.tier = 'TIER_2';
    kyc.status = 'VERIFIED';
    kyc.dailyTransferLimitIrr = 2_000_000_000;
    kyc.escrowLimitIrr = 5_000_000_000;
  }

  return { ok: true, state: store.state };
}

export function openDigitalAccount(input: {
  title: string;
  accountType: AccountType;
  initialDepositIrr: number;
}): { ok: true; account: BankAccount; state: TarazStateSnapshot } | { ok: false; error: string } {
  const store = getStore();
  const title = input.title.trim();
  if (title.length < 3) {
    return { ok: false, error: 'عنوان حساب باید حداقل ۳ کاراکتر باشد.' };
  }
  const initialIrr = Math.max(0, Math.round(Number(input.initialDepositIrr) || 0));
  const primaryAcc = store.state.accounts[0];

  if (initialIrr > 0 && primaryAcc && primaryAcc.availableBalanceIrr < initialIrr) {
    return { ok: false, error: 'موجودی قابل برداشت حساب مبدا برای واریز اولیه کافی نیست.' };
  }

  const mid = crypto.randomInt(100000, 999999);
  const check = crypto.randomInt(10, 99);
  const seq = store.state.accounts.length + 1;
  const accountNumber = `211-820-${mid}-${seq}`;
  const iban = `IR${check}057002118200${mid}000${seq}`;

  if (initialIrr > 0 && primaryAcc) {
    primaryAcc.availableBalanceIrr -= initialIrr;
  }

  const newAccount: BankAccount = {
    id: `acc-${Date.now()}`,
    title,
    accountType: input.accountType,
    accountNumber,
    iban,
    availableBalanceIrr: initialIrr,
    blockedBalanceIrr: 0,
    status: 'ACTIVE',
    baasAccountRef: `BAAS-DEP-${crypto.randomInt(10000, 99999)}`,
    createdAt: '۱۴۰۵/۰۹/۰۳',
  };

  store.state.accounts.unshift(newAccount);
  return { ok: true, account: newAccount, state: store.state };
}

export function issueNewCard(input: {
  bankAccountId: string;
  cardType: 'PHYSICAL' | 'VIRTUAL';
  dailyLimitIrr: number;
}): { ok: true; card: BankCard; state: TarazStateSnapshot } | { ok: false; error: string } {
  const store = getStore();
  const acc = store.state.accounts.find((a) => a.id === input.bankAccountId);
  if (!acc) {
    return { ok: false, error: 'حساب بانکی انتخاب‌شده یافت نشد.' };
  }

  const mid4 = String(crypto.randomInt(1000, 9999));
  const last4 = String(crypto.randomInt(1000, 9999));
  const cvv2 = String(crypto.randomInt(100, 999));

  const card: BankCard = {
    id: `card-${Date.now()}`,
    bankAccountId: acc.id,
    holderName: store.state.user.fullName,
    maskedPan: `6037-9975-${mid4}-${last4}`,
    lastFour: last4,
    cardType: input.cardType,
    status: 'ACTIVE',
    expiryMonth: '09',
    expiryYear: '09',
    cvv2,
    onlineEnabled: true,
    dailyLimitIrr: Math.max(10_000_000, Math.round(input.dailyLimitIrr || 100_000_000)),
    issuedAt: '۱۴۰۵/۰۹/۰۳',
  };

  store.state.cards.unshift(card);
  return { ok: true, card, state: store.state };
}

export function mutateCard(input: {
  cardId: string;
  action: 'TOGGLE_FREEZE' | 'BLOCK' | 'TOGGLE_ONLINE' | 'UPDATE_LIMIT' | 'DYNAMIC_PIN';
  dailyLimitIrr?: number;
}): { ok: true; dynamicPin?: string; state: TarazStateSnapshot } | { ok: false; error: string } {
  const store = getStore();
  const card = store.state.cards.find((c) => c.id === input.cardId);
  if (!card) {
    return { ok: false, error: 'کارت مورد نظر یافت نشد.' };
  }

  if (card.status === 'BLOCKED' && input.action !== 'DYNAMIC_PIN') {
    return { ok: false, error: 'کارت مسدود دائم شده و قابل ویرایش نیست.' };
  }

  if (input.action === 'TOGGLE_FREEZE') {
    card.status = card.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
  } else if (input.action === 'BLOCK') {
    card.status = 'BLOCKED';
    card.onlineEnabled = false;
  } else if (input.action === 'TOGGLE_ONLINE') {
    card.onlineEnabled = !card.onlineEnabled;
  } else if (input.action === 'UPDATE_LIMIT' && typeof input.dailyLimitIrr === 'number') {
    card.dailyLimitIrr = Math.max(10_000_000, Math.min(2_000_000_000, Math.round(input.dailyLimitIrr)));
  } else if (input.action === 'DYNAMIC_PIN') {
    const pin = String(crypto.randomInt(100000, 999999));
    return { ok: true, dynamicPin: pin, state: store.state };
  }

  return { ok: true, state: store.state };
}

export function executeTransfer(input: {
  bankAccountId: string;
  railType: RailType;
  amountIrr: number;
  counterpartyName: string;
  destinationRef: string;
  description: string;
  idempotencyKey: string;
  simulateTimeout?: boolean;
}):
  | {
      ok: true;
      transaction: LedgerTransaction;
      idempotentReplay: boolean;
      state: TarazStateSnapshot;
    }
  | { ok: false; error: string } {
  const store = getStore();
  const idemKey = input.idempotencyKey.trim();

  if (idemKey.length < 6) {
    return { ok: false, error: 'کلید یکتا (Idempotency-Key) نامعتبر است.' };
  }

  // Real server-side idempotency deduplication
  const existing = store.idempotencyMap.get(idemKey);
  if (existing) {
    return {
      ok: true,
      transaction: existing,
      idempotentReplay: true,
      state: store.state,
    };
  }

  const account = store.state.accounts.find((a) => a.id === input.bankAccountId);
  if (!account) {
    return { ok: false, error: 'حساب مبدا انتخاب‌شده معتبر نیست.' };
  }

  const amountIrr = Math.round(Number(input.amountIrr));
  if (!Number.isFinite(amountIrr) || amountIrr < 10_000) {
    return { ok: false, error: 'مبلغ انتقال باید حداقل ۱٬۰۰۰ تومان (۱۰٬۰۰۰ ریال) باشد.' };
  }

  if (amountIrr > store.state.kyc.dailyTransferLimitIrr) {
    return {
      ok: false,
      error: 'مبلغ از سقف انتقال روزانه سطح احراز هویت فعلی شما بیشتر است.',
    };
  }

  const feeIrr = calculateRailFeeIrr(input.railType, amountIrr);
  const totalDebit = amountIrr + feeIrr;

  if (account.availableBalanceIrr < totalDebit) {
    return { ok: false, error: 'موجودی قابل برداشت حساب مبدا کافی نیست.' };
  }

  const dest = input.destinationRef.trim();
  if (dest.length < 8) {
    return { ok: false, error: 'شماره شبا، کارت یا حساب مقصد معتبر نیست.' };
  }

  const isTimeout = Boolean(input.simulateTimeout);
  account.availableBalanceIrr -= totalDebit;

  if (isTimeout) {
    account.blockedBalanceIrr += totalDebit;
  }

  const prefix =
    input.railType === 'SATNA'
      ? 'SAT'
      : input.railType === 'PAYA'
        ? 'PAY'
        : input.railType === 'POL'
          ? 'POL'
          : input.railType === 'CARD_TO_CARD'
            ? 'SHB'
            : 'INT';

  const tx: LedgerTransaction = {
    id: `tx-${Date.now()}`,
    bankAccountId: account.id,
    idempotencyKey: idemKey,
    railType: input.railType,
    direction: 'DEBIT',
    amountIrr,
    feeIrr,
    counterpartyName: input.counterpartyName.trim() || 'گیرنده بانکی',
    destinationRef: dest.toUpperCase(),
    description: input.description.trim() || 'انتقال وجه از طریق ترازبانک',
    status: isTimeout ? 'PENDING_INQUIRY' : 'SUCCESS',
    reconciliationStatus: isTimeout ? 'NEEDS_INQUIRY' : 'MATCHED',
    bankReferenceCode: generateReferenceCode(prefix),
    inquiryAttempts: isTimeout ? 1 : 0,
    lastInquiryNote: isTimeout
      ? 'ارتباط با درگاه بانک همکار پیش از دریافت تاییدیه قطع شد؛ تراکنش در صف مغایرت‌گیری ثبت شد.'
      : 'تاییدیه آنی از هسته بانک همکار دریافت و ثبت شد.',
    createdAt: new Date().toISOString(),
    persianTime: currentPersianTime(),
  };

  store.state.transactions.unshift(tx);
  store.idempotencyMap.set(idemKey, tx);

  // Update today's cashflow chart
  const todayPoint = store.state.cashflow7d[store.state.cashflow7d.length - 1];
  if (todayPoint && !isTimeout) {
    todayPoint.outflowIrr += amountIrr;
  }

  return {
    ok: true,
    transaction: tx,
    idempotentReplay: false,
    state: store.state,
  };
}

export function reconcileTransaction(input: {
  txId: string;
  action: 'INQUIRE' | 'FORCE_SETTLE' | 'REVERSE';
}):
  | {
      ok: true;
      transaction: LedgerTransaction;
      message: string;
      state: TarazStateSnapshot;
    }
  | { ok: false; error: string } {
  const store = getStore();
  const tx = store.state.transactions.find((t) => t.id === input.txId);
  if (!tx) {
    return { ok: false, error: 'تراکنش مورد نظر در دفترکل یافت نشد.' };
  }

  if (tx.status !== 'PENDING_INQUIRY') {
    return { ok: false, error: 'این تراکنش قبلاً تعیین تکلیف شده است.' };
  }

  const account = store.state.accounts.find((a) => a.id === tx.bankAccountId);
  const totalHeld = tx.amountIrr + tx.feeIrr;

  if (input.action === 'INQUIRE') {
    tx.inquiryAttempts += 1;
    // Deterministically simulate bank inquiry outcome: even attempts confirm settle, odd or first-time resolves cleanly
    const shouldSettle = tx.inquiryAttempts % 2 === 0;
    if (shouldSettle) {
      if (account) {
        account.blockedBalanceIrr = Math.max(0, account.blockedBalanceIrr - totalHeld);
      }
      tx.status = 'SUCCESS';
      tx.reconciliationStatus = 'RESOLVED_SETTLED';
      tx.lastInquiryNote = `استعلام شماره ${toPersianDigits(tx.inquiryAttempts)}: بانک همکار تسویه نهایی با کد پیگیری ${tx.bankReferenceCode} را تایید کرد.`;
      return {
        ok: true,
        transaction: tx,
        message: 'استعلام موفق: بانک همکار تسویه نهایی تراکنش را تایید کرد و وجه از حالت بلوکه خارج و تسویه شد.',
        state: store.state,
      };
    } else {
      if (account) {
        account.blockedBalanceIrr = Math.max(0, account.blockedBalanceIrr - totalHeld);
        account.availableBalanceIrr += totalHeld;
      }
      tx.status = 'REVERSED';
      tx.reconciliationStatus = 'RESOLVED_REVERSED';
      tx.lastInquiryNote = `استعلام شماره ${toPersianDigits(tx.inquiryAttempts)}: رکورد در بانک مقصد ثبت نشده بود؛ وجه به‌صورت خودکار به موجودی مشتری برگشت داده شد.`;
      return {
        ok: true,
        transaction: tx,
        message: 'استعلام تکمیل شد: تراکنش در بانک مقصد یافت نشد و مبلغ به موجودی قابل برداشت مشتری بازگردانده شد.',
        state: store.state,
      };
    }
  }

  if (input.action === 'FORCE_SETTLE') {
    tx.inquiryAttempts += 1;
    if (account) {
      account.blockedBalanceIrr = Math.max(0, account.blockedBalanceIrr - totalHeld);
    }
    tx.status = 'SUCCESS';
    tx.reconciliationStatus = 'RESOLVED_SETTLED';
    tx.lastInquiryNote = 'تایید دستی توسط کارشناس عملیات پس از تطبیق صورت‌حساب شبا و فایل پایا/ساتنا.';
    return {
      ok: true,
      transaction: tx,
      message: 'تراکنش با تایید عملیات تسویه شد و مغایرت بسته شد.',
      state: store.state,
    };
  }

  // REVERSE
  tx.inquiryAttempts += 1;
  if (account) {
    account.blockedBalanceIrr = Math.max(0, account.blockedBalanceIrr - totalHeld);
    account.availableBalanceIrr += totalHeld;
  }
  tx.status = 'REVERSED';
  tx.reconciliationStatus = 'RESOLVED_REVERSED';
  tx.lastInquiryNote = 'برگشت وجه به حساب مبدا توسط پنل عملیات مغایرت‌گیری ثبت شد.';
  return {
    ok: true,
    transaction: tx,
    message: 'وجه بلوکه‌شده با موفقیت به حساب مشتری بازگشت داده شد.',
    state: store.state,
  };
}

export function createSafeDeal(input: {
  title: string;
  category: string;
  sellerName: string;
  sellerNationalCode: string;
  sellerIban: string;
  sourceAccountId: string;
  totalAmountIrr: number;
  milestoneCount: number;
}): { ok: true; contract: SafeDealContract; state: TarazStateSnapshot } | { ok: false; error: string } {
  const store = getStore();
  const title = input.title.trim();
  const sellerName = input.sellerName.trim();
  const amountIrr = Math.round(Number(input.totalAmountIrr));

  if (title.length < 4 || sellerName.length < 3) {
    return { ok: false, error: 'عنوان قرارداد و نام فروشنده باید کامل وارد شود.' };
  }
  if (!Number.isFinite(amountIrr) || amountIrr < 1_000_000) {
    return { ok: false, error: 'حداقل مبلغ قرارداد معامله امن ۱۰۰٬۰۰۰ تومان است.' };
  }
  if (amountIrr > store.state.kyc.escrowLimitIrr) {
    return { ok: false, error: 'مبلغ از سقف معامله امن سطح احراز هویت شما بیشتر است.' };
  }

  const count = input.milestoneCount === 2 ? 2 : 1;
  const firstPart = count === 2 ? Math.round(amountIrr * 0.6) : amountIrr;
  const secondPart = amountIrr - firstPart;

  const milestones =
    count === 2
      ? [
          {
            id: `ms-${Date.now()}-1`,
            title: 'مرحله ۱: تحویل کالا یا مستندات اولیه و بارنامه',
            amountIrr: firstPart,
            status: 'PENDING' as const,
          },
          {
            id: `ms-${Date.now()}-2`,
            title: 'مرحله ۲: تایید نهایی سلامت و تکمیل تعهدات',
            amountIrr: secondPart,
            status: 'PENDING' as const,
          },
        ]
      : [
          {
            id: `ms-${Date.now()}-1`,
            title: 'تحویل کامل موضوع معامله و تایید خریدار',
            amountIrr: firstPart,
            status: 'PENDING' as const,
          },
        ];

  const codeNum = crypto.randomInt(890, 999);
  const contract: SafeDealContract = {
    id: `sd-${Date.now()}`,
    contractCode: `SD-1405-${codeNum}`,
    title,
    category: input.category || 'بازرگانی و کالا',
    buyerName: store.state.user.fullName,
    sellerName,
    sellerNationalCode: input.sellerNationalCode.trim() || '14007281920',
    sellerIban: input.sellerIban.trim().toUpperCase() || 'IR620120000000007281920001',
    sellerVerified: true,
    sourceAccountId: input.sourceAccountId || store.state.accounts[0].id,
    totalAmountIrr: amountIrr,
    releasedAmountIrr: 0,
    status: 'DRAFT',
    milestones,
    createdAt: new Date().toISOString(),
    persianDate: '۱۴۰۵/۰۹/۰۳',
  };

  store.state.safeDeals.unshift(contract);
  return { ok: true, contract, state: store.state };
}

export function transitionSafeDeal(input: {
  contractId: string;
  action: 'FUND' | 'SUBMIT_OBLIGATION' | 'RELEASE_NEXT' | 'DISPUTE' | 'RESOLVE_DISPUTE_REFUND';
  disputeReason?: string;
}): { ok: true; contract: SafeDealContract; state: TarazStateSnapshot } | { ok: false; error: string } {
  const store = getStore();
  const contract = store.state.safeDeals.find((c) => c.id === input.contractId);
  if (!contract) {
    return { ok: false, error: 'قرارداد معامله امن یافت نشد.' };
  }

  const acc =
    store.state.accounts.find((a) => a.id === contract.sourceAccountId) || store.state.accounts[0];

  if (input.action === 'FUND') {
    if (contract.status !== 'DRAFT') {
      return { ok: false, error: 'وجه این قرارداد قبلاً بلوکه شده است.' };
    }
    if (acc.availableBalanceIrr < contract.totalAmountIrr) {
      return { ok: false, error: 'موجودی حساب مبدا برای بلوکه وجه ضمانت کافی نیست.' };
    }
    acc.availableBalanceIrr -= contract.totalAmountIrr;
    acc.blockedBalanceIrr += contract.totalAmountIrr;
    contract.status = 'FUNDED';

    const tx: LedgerTransaction = {
      id: `tx-${Date.now()}`,
      bankAccountId: acc.id,
      idempotencyKey: `TRZ-ESC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      railType: 'ESCROW',
      direction: 'DEBIT',
      amountIrr: contract.totalAmountIrr,
      feeIrr: 0,
      counterpartyName: `حساب امانی تراز (${contract.contractCode})`,
      destinationRef: `ESCROW-${contract.contractCode}`,
      description: `بلوکه وجه ضمانت قرارداد: ${contract.title}`,
      status: 'SUCCESS',
      reconciliationStatus: 'MATCHED',
      bankReferenceCode: generateReferenceCode('ESC'),
      inquiryAttempts: 0,
      lastInquiryNote: 'وجه در سرفصل ضمانت قرارداد قفل شد.',
      createdAt: new Date().toISOString(),
      persianTime: currentPersianTime(),
    };
    store.state.transactions.unshift(tx);
    store.idempotencyMap.set(tx.idempotencyKey, tx);
  } else if (input.action === 'SUBMIT_OBLIGATION') {
    if (contract.status !== 'FUNDED' && contract.status !== 'OBLIGATION_SUBMITTED') {
      return { ok: false, error: 'ابتدا باید وجه قرارداد بلوکه شود.' };
    }
    const nextPending = contract.milestones.find((m) => m.status === 'PENDING');
    if (nextPending) {
      nextPending.status = 'SUBMITTED';
    }
    contract.status = 'OBLIGATION_SUBMITTED';
  } else if (input.action === 'RELEASE_NEXT') {
    if (contract.status !== 'FUNDED' && contract.status !== 'OBLIGATION_SUBMITTED') {
      return { ok: false, error: 'این قرارداد در وضعیت قابل آزادسازی نیست.' };
    }
    const targetMilestone =
      contract.milestones.find((m) => m.status === 'SUBMITTED') ||
      contract.milestones.find((m) => m.status === 'PENDING');

    if (!targetMilestone) {
      return { ok: false, error: 'تمام مراحل قرارداد پیش‌تر آزادسازی شده‌اند.' };
    }

    targetMilestone.status = 'RELEASED';
    contract.releasedAmountIrr += targetMilestone.amountIrr;
    acc.blockedBalanceIrr = Math.max(0, acc.blockedBalanceIrr - targetMilestone.amountIrr);

    const allReleased = contract.milestones.every((m) => m.status === 'RELEASED');
    contract.status = allReleased ? 'RELEASED' : 'FUNDED';

    const tx: LedgerTransaction = {
      id: `tx-${Date.now()}`,
      bankAccountId: acc.id,
      idempotencyKey: `TRZ-REL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      railType: 'SATNA',
      direction: 'DEBIT',
      amountIrr: targetMilestone.amountIrr,
      feeIrr: 0,
      counterpartyName: contract.sellerName,
      destinationRef: contract.sellerIban,
      description: `آزادسازی امانی (${contract.contractCode}) - ${targetMilestone.title}`,
      status: 'SUCCESS',
      reconciliationStatus: 'MATCHED',
      bankReferenceCode: generateReferenceCode('REL'),
      inquiryAttempts: 0,
      lastInquiryNote: 'آزادسازی تاییدشده به شبا فروشنده تسویه شد.',
      createdAt: new Date().toISOString(),
      persianTime: currentPersianTime(),
    };
    store.state.transactions.unshift(tx);
    store.idempotencyMap.set(tx.idempotencyKey, tx);
  } else if (input.action === 'DISPUTE') {
    if (contract.status === 'RELEASED' || contract.status === 'DRAFT') {
      return { ok: false, error: 'امکان ثبت اختلاف در وضعیت فعلی وجود ندارد.' };
    }
    contract.status = 'DISPUTED';
    contract.disputeReason =
      input.disputeReason?.trim() || 'درخواست بررسی کارشناس داوری معامله امن و تعلیق آزادسازی وجه';
  } else if (input.action === 'RESOLVE_DISPUTE_REFUND') {
    if (contract.status !== 'DISPUTED') {
      return { ok: false, error: 'این قرارداد در وضعیت اختلاف نیست.' };
    }
    const remaining = Math.max(0, contract.totalAmountIrr - contract.releasedAmountIrr);
    acc.blockedBalanceIrr = Math.max(0, acc.blockedBalanceIrr - remaining);
    acc.availableBalanceIrr += remaining;
    contract.status = 'DRAFT';
    contract.disputeReason = undefined;
  }

  return { ok: true, contract, state: store.state };
}

export function executeWalletSwap(input: {
  bankAccountId: string;
  symbol: WalletAsset['symbol'];
  side: 'BUY_CRYPTO' | 'SELL_CRYPTO';
  amountIrr: number;
}): { ok: true; cryptoDelta: number; state: TarazStateSnapshot } | { ok: false; error: string } {
  const store = getStore();
  const acc = store.state.accounts.find((a) => a.id === input.bankAccountId);
  const asset = store.state.walletAssets.find((w) => w.symbol === input.symbol);

  if (!acc || !asset) {
    return { ok: false, error: 'حساب ریالی یا دارایی انتخاب‌شده نامعتبر است.' };
  }

  const amountIrr = Math.round(Number(input.amountIrr));
  if (!Number.isFinite(amountIrr) || amountIrr < 1_000_000) {
    return { ok: false, error: 'حداقل مبلغ تبدیل ۱۰۰٬۰۰۰ تومان (۱٬۰۰۰٬۰۰۰ ریال) است.' };
  }

  const feeIrr = Math.round(amountIrr * 0.0025); // 0.25% swap fee
  const cryptoQty = amountIrr / asset.rateIrr;

  if (input.side === 'BUY_CRYPTO') {
    if (acc.availableBalanceIrr < amountIrr + feeIrr) {
      return { ok: false, error: 'موجودی ریالی حساب برای انجام تبدیل کافی نیست.' };
    }
    acc.availableBalanceIrr -= amountIrr + feeIrr;
    asset.balance = Number((asset.balance + cryptoQty).toFixed(6));
  } else {
    if (asset.balance < cryptoQty) {
      return { ok: false, error: `موجودی ${asset.nameFa} برای فروش کافی نیست.` };
    }
    asset.balance = Number(Math.max(0, asset.balance - cryptoQty).toFixed(6));
    acc.availableBalanceIrr += Math.max(0, amountIrr - feeIrr);
  }

  const tx: LedgerTransaction = {
    id: `tx-${Date.now()}`,
    bankAccountId: acc.id,
    idempotencyKey: `TRZ-SWP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    railType: 'SWAP',
    direction: input.side === 'BUY_CRYPTO' ? 'DEBIT' : 'CREDIT',
    amountIrr,
    feeIrr,
    counterpartyName: `بازار تبدیل آنی (${asset.symbol})`,
    destinationRef: `WALLET-${asset.symbol}`,
    description:
      input.side === 'BUY_CRYPTO'
        ? `تبدیل ریال به ${asset.nameFa} (${cryptoQty.toFixed(4)} ${asset.symbol})`
        : `فروش ${asset.nameFa} (${cryptoQty.toFixed(4)} ${asset.symbol}) به حساب بانکی`,
    status: 'SUCCESS',
    reconciliationStatus: 'MATCHED',
    bankReferenceCode: generateReferenceCode('SWP'),
    inquiryAttempts: 0,
    lastInquiryNote: 'تبدیل آنی با نرخ لحظه‌ای تسویه شد.',
    createdAt: new Date().toISOString(),
    persianTime: currentPersianTime(),
  };

  store.state.transactions.unshift(tx);
  store.idempotencyMap.set(tx.idempotencyKey, tx);

  return { ok: true, cryptoDelta: cryptoQty, state: store.state };
}

export function bookMeetingSession(input: {
  advisorName: string;
  advisorTitle: string;
  specialty: string;
  topic: string;
  persianDate: string;
  timeSlot: string;
  relatedContractCode?: string;
}): { ok: true; session: MeetingSession; state: TarazStateSnapshot } | { ok: false; error: string } {
  const store = getStore();
  if (!input.topic.trim() || input.topic.trim().length < 4) {
    return { ok: false, error: 'لطفاً موضوع جلسه مشاوره را وارد کنید.' };
  }

  const session: MeetingSession = {
    id: `meet-${Date.now()}`,
    advisorName: input.advisorName,
    advisorTitle: input.advisorTitle,
    specialty: input.specialty,
    topic: input.topic.trim(),
    relatedContractCode: input.relatedContractCode || undefined,
    persianDate: input.persianDate || '۱۴۰۵/۰۹/۰۴',
    timeSlot: input.timeSlot || '۱۵:۰۰ تا ۱۵:۳۰',
    durationMinutes: 30,
    status: 'SCHEDULED',
    roomCode: `TRZ-ROOM-${crypto.randomInt(4200, 9899)}`,
  };

  store.state.meetings.unshift(session);
  return { ok: true, session, state: store.state };
}

export function updateMeetingStatus(input: {
  meetingId: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
}): { ok: true; state: TarazStateSnapshot } | { ok: false; error: string } {
  const store = getStore();
  const m = store.state.meetings.find((item) => item.id === input.meetingId);
  if (!m) {
    return { ok: false, error: 'جلسه مورد نظر یافت نشد.' };
  }
  m.status = input.status;
  return { ok: true, state: store.state };
}
