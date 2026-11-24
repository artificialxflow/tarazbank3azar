import { NextRequest, NextResponse } from 'next/server';
import { verifyKycStep } from '@/lib/server-store';

const VALID_STEPS = new Set(['SHAHKAR', 'LIVENESS', 'POSTAL']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const step = typeof body?.step === 'string' ? body.step : '';
    if (!VALID_STEPS.has(step)) {
      return NextResponse.json({ ok: false, error: 'مرحله احراز هویت نامعتبر است.' }, { status: 400 });
    }

    const result = verifyKycStep({
      step: step as 'SHAHKAR' | 'LIVENESS' | 'POSTAL',
      nationalCode: typeof body.nationalCode === 'string' ? body.nationalCode : undefined,
      mobile: typeof body.mobile === 'string' ? body.mobile : undefined,
      postalCode: typeof body.postalCode === 'string' ? body.postalCode : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
