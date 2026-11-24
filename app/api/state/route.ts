import { NextResponse } from 'next/server';
import { getSnapshot } from '@/lib/server-store';

export async function GET() {
  const snapshot = getSnapshot();
  return NextResponse.json({ ok: true, state: snapshot });
}
