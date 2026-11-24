import { NextRequest, NextResponse } from 'next/server';
import { executeWalletSwap } from '@/lib/server-store';
import type { WalletAsset } from '@/lib/types';

const VALID_SYMBOLS = new Set<WalletAsset['symbol']>(['USDT', 'BTC', 'ETH', 'PAXG']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbol = typeof body?.symbol === 'string' ? body.symbol : '';
    const side = body?.side === 'SELL_CRYPTO' ? 'SELL_CRYPTO' : 'BUY_CRYPTO';

    if (!VALID_SYMBOLS.has(symbol as WalletAsset['symbol'])) {
      return NextResponse.json({ ok: false, error: 'رمزارز انتخاب‌شده پشتیبانی نمی‌شود.' }, { status: 400 });
    }

    const result = executeWalletSwap({
      bankAccountId: typeof body.bankAccountId === 'string' ? body.bankAccountId : '',
      symbol: symbol as WalletAsset['symbol'],
      side,
      amountIrr: Number(body.amountIrr),
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
