import { NextRequest, NextResponse } from 'next/server';
import { issueNewCard, mutateCard } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cardType = body?.cardType === 'VIRTUAL' ? 'VIRTUAL' : 'PHYSICAL';
    const result = issueNewCard({
      bankAccountId: typeof body.bankAccountId === 'string' ? body.bankAccountId : '',
      cardType,
      dailyLimitIrr: Number(body.dailyLimitIrr) || 100_000_000,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}

const VALID_ACTIONS = new Set([
  'TOGGLE_FREEZE',
  'BLOCK',
  'TOGGLE_ONLINE',
  'UPDATE_LIMIT',
  'DYNAMIC_PIN',
]);

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const action = typeof body?.action === 'string' ? body.action : '';
    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ ok: false, error: 'عملیات کارت نامعتبر است.' }, { status: 400 });
    }

    const result = mutateCard({
      cardId: typeof body.cardId === 'string' ? body.cardId : '',
      action: action as 'TOGGLE_FREEZE' | 'BLOCK' | 'TOGGLE_ONLINE' | 'UPDATE_LIMIT' | 'DYNAMIC_PIN',
      dailyLimitIrr: typeof body.dailyLimitIrr === 'number' ? body.dailyLimitIrr : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
