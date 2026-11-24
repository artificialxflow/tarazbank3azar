export type CurrencyUnit = 'TOMAN' | 'RIAL';
export type WorkspaceRole = 'CUSTOMER' | 'OPS';

export type ModuleKey =
  | 'overview'
  | 'kyc'
  | 'cards'
  | 'accounts'
  | 'transfers'
  | 'safedeal'
  | 'wallet'
  | 'meetings'
  | 'ops';

export type KycTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type KycStatus = 'PENDING' | 'IN_REVIEW' | 'VERIFIED';

export interface UserProfile {
  id: string;
  fullName: string;
  roleTitle: string;
  mobile: string;
  email: string;
  nationalCode: string;
}

export interface KycProfile {
  tier: KycTier;
  status: KycStatus;
  shahkarVerified: boolean;
  livenessVerified: boolean;
  postalCode: string;
  postalVerified: boolean;
  dailyTransferLimitIrr: number;
  escrowLimitIrr: number;
  verifiedAt: string | null;
}

export type AccountType =
  | 'CURRENT_GHARZOLHASANEH'
  | 'SHORT_TERM_DEPOSIT'
  | 'TARAZ_SPECIAL_DEPOSIT';

export interface BankAccount {
  id: string;
  title: string;
  accountType: AccountType;
  accountNumber: string;
  iban: string;
  availableBalanceIrr: number;
  blockedBalanceIrr: number;
  status: 'ACTIVE' | 'FROZEN';
  baasAccountRef: string;
  createdAt: string;
}

export interface BankCard {
  id: string;
  bankAccountId: string;
  holderName: string;
  maskedPan: string;
  lastFour: string;
  cardType: 'PHYSICAL' | 'VIRTUAL';
  status: 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'ISSUING';
  expiryMonth: string;
  expiryYear: string;
  cvv2: string;
  onlineEnabled: boolean;
  dailyLimitIrr: number;
  issuedAt: string;
}

export type RailType =
  | 'SATNA'
  | 'PAYA'
  | 'POL'
  | 'CARD_TO_CARD'
  | 'INTERNAL'
  | 'ESCROW'
  | 'SWAP';

export type TransactionStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'PENDING_INQUIRY'
  | 'REVERSED';

export type ReconciliationStatus =
  | 'MATCHED'
  | 'NEEDS_INQUIRY'
  | 'RESOLVED_SETTLED'
  | 'RESOLVED_REVERSED';

export interface LedgerTransaction {
  id: string;
  bankAccountId: string;
  idempotencyKey: string;
  railType: RailType;
  direction: 'DEBIT' | 'CREDIT';
  amountIrr: number;
  feeIrr: number;
  counterpartyName: string;
  destinationRef: string;
  description: string;
  status: TransactionStatus;
  reconciliationStatus: ReconciliationStatus;
  bankReferenceCode: string;
  inquiryAttempts: number;
  lastInquiryNote: string;
  createdAt: string;
  persianTime: string;
}

export interface SafeDealMilestone {
  id: string;
  title: string;
  amountIrr: number;
  status: 'PENDING' | 'SUBMITTED' | 'RELEASED';
}

export type SafeDealStatus =
  | 'DRAFT'
  | 'FUNDED'
  | 'OBLIGATION_SUBMITTED'
  | 'RELEASED'
  | 'DISPUTED';

export interface SafeDealContract {
  id: string;
  contractCode: string;
  title: string;
  category: string;
  buyerName: string;
  sellerName: string;
  sellerNationalCode: string;
  sellerIban: string;
  sellerVerified: boolean;
  sourceAccountId: string;
  totalAmountIrr: number;
  releasedAmountIrr: number;
  status: SafeDealStatus;
  milestones: SafeDealMilestone[];
  disputeReason?: string;
  createdAt: string;
  persianDate: string;
}

export interface WalletAsset {
  symbol: 'USDT' | 'BTC' | 'ETH' | 'PAXG';
  nameFa: string;
  balance: number;
  lockedBalance: number;
  rateIrr: number;
  change24h: number;
}

export interface MeetingSession {
  id: string;
  advisorName: string;
  advisorTitle: string;
  specialty: string;
  topic: string;
  relatedContractCode?: string;
  persianDate: string;
  timeSlot: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  roomCode: string;
}

export interface CashflowPoint {
  label: string;
  inflowIrr: number;
  outflowIrr: number;
}

export interface TarazStateSnapshot {
  user: UserProfile;
  kyc: KycProfile;
  baasHealth: {
    partnerBank: string;
    status: 'OPERATIONAL' | 'DEGRADED';
    uptimePercent: string;
    lastSyncPersian: string;
  };
  accounts: BankAccount[];
  cards: BankCard[];
  transactions: LedgerTransaction[];
  safeDeals: SafeDealContract[];
  walletAssets: WalletAsset[];
  meetings: MeetingSession[];
  cashflow7d: CashflowPoint[];
  cashflow30d: CashflowPoint[];
}
