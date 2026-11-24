import { NextRequest, NextResponse } from 'next/server';
import { openDigitalAccount } from '@/lib/server-store';
import type { AccountType } from '@/lib/types';

const VALID_TYPES = new Set<AccountType>([
  'CURRENT_GHARZOLHASANEH',
  'SHORT_TERM_DEPOSIT',
  'TARAZ_SPECIAL_DEPOSIT',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accountType = typeof body?.accountType === 'string' ? body.accountType : '';
    if (!VALID_TYPES.has(accountType as AccountType)) {
      return NextResponse.json({ ok: false, error: 'نوع سپرده انتخاب‌شده معتبر نیست.' }, { status: 400 });
    }

    const result = openDigitalAccount({
      title: typeof body.title === 'string' ? body.title : '',
      accountType: accountType as AccountType,
      initialDepositIrr: Number(body.initialDepositIrr) || 0,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
