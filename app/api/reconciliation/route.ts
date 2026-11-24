import { NextRequest, NextResponse } from 'next/server';
import { reconcileTransaction } from '@/lib/server-store';

const VALID_ACTIONS = new Set(['INQUIRE', 'FORCE_SETTLE', 'REVERSE']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = typeof body?.action === 'string' ? body.action : '';
    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ ok: false, error: 'عملیات مغایرت‌گیری نامعتبر است.' }, { status: 400 });
    }

    const result = reconcileTransaction({
      txId: typeof body.txId === 'string' ? body.txId : '',
      action: action as 'INQUIRE' | 'FORCE_SETTLE' | 'REVERSE',
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
