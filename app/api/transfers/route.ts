import { NextRequest, NextResponse } from 'next/server';
import { executeTransfer } from '@/lib/server-store';
import type { RailType } from '@/lib/types';

const VALID_RAILS = new Set<RailType>([
  'SATNA',
  'PAYA',
  'POL',
  'CARD_TO_CARD',
  'INTERNAL',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headerIdem = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
    const idempotencyKey =
      (typeof body?.idempotencyKey === 'string' && body.idempotencyKey.trim()) ||
      (headerIdem ? headerIdem.trim() : '');

    const railType = typeof body?.railType === 'string' ? body.railType : '';
    if (!VALID_RAILS.has(railType as RailType)) {
      return NextResponse.json({ ok: false, error: 'بستر انتقال انتخاب‌شده نامعتبر است.' }, { status: 400 });
    }

    const result = executeTransfer({
      bankAccountId: typeof body.bankAccountId === 'string' ? body.bankAccountId : '',
      railType: railType as RailType,
      amountIrr: Number(body.amountIrr),
      counterpartyName: typeof body.counterpartyName === 'string' ? body.counterpartyName : '',
      destinationRef: typeof body.destinationRef === 'string' ? body.destinationRef : '',
      description: typeof body.description === 'string' ? body.description : '',
      idempotencyKey,
      simulateTimeout: Boolean(body.simulateTimeout),
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, {
      status: result.idempotentReplay ? 200 : 201,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'خطا در پردازش درخواست انتقال وجه.' }, { status: 400 });
  }
}
