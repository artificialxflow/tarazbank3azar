'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { getSafeDealStatusMeta, getTransactionStatusMeta } from '@/lib/format';
import type { SafeDealStatus, TransactionStatus } from '@/lib/types';

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const meta = getTransactionStatusMeta(status);

  const Icon =
    status === 'SUCCESS'
      ? CheckCircle2
      : status === 'PENDING_INQUIRY'
        ? Clock
        : status === 'REVERSED'
          ? RotateCcw
          : XCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${meta.colorClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
}

export function SafeDealStatusBadge({ status }: { status: SafeDealStatus }) {
  const meta = getSafeDealStatusMeta(status);

  const Icon =
    status === 'RELEASED'
      ? CheckCircle2
      : status === 'FUNDED'
        ? Lock
        : status === 'OBLIGATION_SUBMITTED'
          ? ShieldCheck
          : status === 'DISPUTED'
            ? AlertTriangle
            : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${meta.colorClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
}
