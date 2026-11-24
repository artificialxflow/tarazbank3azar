import { NextRequest, NextResponse } from 'next/server';
import { createSafeDeal, transitionSafeDeal } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createSafeDeal({
      title: typeof body.title === 'string' ? body.title : '',
      category: typeof body.category === 'string' ? body.category : 'بازرگانی و کالا',
      sellerName: typeof body.sellerName === 'string' ? body.sellerName : '',
      sellerNationalCode:
        typeof body.sellerNationalCode === 'string' ? body.sellerNationalCode : '',
      sellerIban: typeof body.sellerIban === 'string' ? body.sellerIban : '',
      sourceAccountId: typeof body.sourceAccountId === 'string' ? body.sourceAccountId : '',
      totalAmountIrr: Number(body.totalAmountIrr),
      milestoneCount: Number(body.milestoneCount) === 2 ? 2 : 1,
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
  'FUND',
  'SUBMIT_OBLIGATION',
  'RELEASE_NEXT',
  'DISPUTE',
  'RESOLVE_DISPUTE_REFUND',
]);

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const action = typeof body?.action === 'string' ? body.action : '';
    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ ok: false, error: 'عملیات قرارداد نامعتبر است.' }, { status: 400 });
    }

    const result = transitionSafeDeal({
      contractId: typeof body.contractId === 'string' ? body.contractId : '',
      action: action as
        | 'FUND'
        | 'SUBMIT_OBLIGATION'
        | 'RELEASE_NEXT'
        | 'DISPUTE'
        | 'RESOLVE_DISPUTE_REFUND',
      disputeReason: typeof body.disputeReason === 'string' ? body.disputeReason : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
