import { NextRequest, NextResponse } from 'next/server';
import { bookMeetingSession, updateMeetingStatus } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = bookMeetingSession({
      advisorName: typeof body.advisorName === 'string' ? body.advisorName : 'دکتر مریم شریعتی',
      advisorTitle: typeof body.advisorTitle === 'string' ? body.advisorTitle : 'مشاور ارشد حقوقی',
      specialty: typeof body.specialty === 'string' ? body.specialty : 'معاملات امن',
      topic: typeof body.topic === 'string' ? body.topic : '',
      persianDate: typeof body.persianDate === 'string' ? body.persianDate : '۱۴۰۵/۰۹/۰۴',
      timeSlot: typeof body.timeSlot === 'string' ? body.timeSlot : '۱۵:۰۰ تا ۱۵:۳۰',
      relatedContractCode:
        typeof body.relatedContractCode === 'string' ? body.relatedContractCode : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const status =
      body?.status === 'LIVE' || body?.status === 'COMPLETED' ? body.status : 'SCHEDULED';
    const result = updateMeetingStatus({
      meetingId: typeof body.meetingId === 'string' ? body.meetingId : '',
      status,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
