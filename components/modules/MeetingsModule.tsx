'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Send,
  ShieldCheck,
  Video,
  VideoOff,
} from 'lucide-react';
import { toPersianDigits } from '@/lib/format';
import type { MeetingSession, TarazStateSnapshot } from '@/lib/types';

interface MeetingsModuleProps {
  data: TarazStateSnapshot;
  onStateUpdate: (next: TarazStateSnapshot) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

const ADVISORS = [
  {
    name: 'دکتر مریم شریعتی',
    title: 'مشاور ارشد حقوقی معاملات امن',
    specialty: 'قراردادهای بازرگانی و ضمانت امانی',
  },
  {
    name: 'مهندس آرش بهرامی',
    title: 'کارشناس خزانه‌داری و بانکداری باز',
    specialty: 'سقف‌های ساتنا/پایا و حساب‌های تجاری',
  },
  {
    name: 'سعید کریمی',
    title: 'کارشناس ارشد تبدیل ارز و رمزارز',
    specialty: 'پوشش ریسک و تسویه چندارزی',
  },
];

export function MeetingsModule({
  data,
  onStateUpdate,
  onNotify,
}: MeetingsModuleProps) {
  const [selectedAdvisorIdx, setSelectedAdvisorIdx] = useState(0);
  const [topic, setTopic] = useState('');
  const [persianDate, setPersianDate] = useState('۱۴۰۵/۰۹/۰۴');
  const [timeSlot, setTimeSlot] = useState('۱۵:۰۰ تا ۱۵:۳۰');
  const [relatedContract, setRelatedContract] = useState(data.safeDeals[0]?.contractCode || '');
  const [booking, setBooking] = useState(false);

  // Interactive Live Meeting Room state
  const [activeMeeting, setActiveMeeting] = useState<MeetingSession | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<
    { sender: string; time: string; text: string }[]
  >([
    {
      sender: 'سیستم امنیتی ترازبانک',
      time: 'شروع جلسه',
      text: 'اتاق گفت‌وگو با رمزنگاری سرتاسری (E2EE) برقرار شد. اسناد قرارداد برای هر دو طرف قابل مشاهده است.',
    },
  ]);
  const [checklist, setChecklist] = useState([
    { id: 'c1', label: 'تطبیق شبای ذی‌نفع با شناسه ملی فروشنده', done: true },
    { id: 'c2', label: 'بررسی شروط آزادسازی مرحله دوم (تست سلامت دستگاه)', done: false },
    { id: 'c3', label: 'تایید صورت‌جلسه نهایی برای ثبت در پرونده قرارداد', done: false },
  ]);

  useEffect(() => {
    if (!activeMeeting) return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeMeeting]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    const advisor = ADVISORS[selectedAdvisorIdx];
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorName: advisor.name,
          advisorTitle: advisor.title,
          specialty: advisor.specialty,
          topic,
          persianDate,
          timeSlot,
          relatedContractCode: relatedContract || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onNotify(json.error || 'خطا در رزرو جلسه مشاوره.', 'error');
        return;
      }
      onStateUpdate(json.state);
      setTopic('');
      onNotify(`نوبت جلسه با ${advisor.name} با کد اتاق ${json.session.roomCode} ثبت شد.`, 'success');
    } catch {
      onNotify('عدم برقراری ارتباط با سامانه نوبت‌دهی.', 'error');
    } finally {
      setBooking(false);
    }
  };

  const enterRoom = async (meeting: MeetingSession) => {
    setElapsedSec(0);
    setActiveMeeting(meeting);
    setChatLog([
      {
        sender: 'سیستم امنیتی ترازبانک',
        time: 'شروع جلسه',
        text: `اتصال امن به اتاق ${meeting.roomCode} برقرار شد.`,
      },
      {
        sender: meeting.advisorName,
        time: 'هم‌اکنون',
        text: `سلام مهندس فرهادی، پرونده موضوع «${meeting.topic}» را باز کرده‌ام. بفرمایید در خدمتم.`,
      },
    ]);
    try {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id, status: 'LIVE' }),
      });
      const json = await res.json();
      if (json.ok) onStateUpdate(json.state);
    } catch {
      // non-fatal
    }
  };

  const leaveRoom = async () => {
    if (!activeMeeting) return;
    const ended = activeMeeting;
    setActiveMeeting(null);
    setScreenSharing(false);
    try {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: ended.id, status: 'COMPLETED' }),
      });
      const json = await res.json();
      if (json.ok) onStateUpdate(json.state);
    } catch {
      // non-fatal
    }
    onNotify('جلسه مشاوره با ثبت خلاصه چک‌لیست پایان یافت.', 'success');
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatLog((prev) => [
      ...prev,
      { sender: data.user.fullName, time: 'الان', text },
    ]);
    setChatInput('');
  };

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  if (activeMeeting) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A2540] text-white rounded-xl px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>اتاق مشاوره رمزنگاری‌شده</span>
              <span aria-hidden="true">·</span>
              <span className="dir-ltr tabular-nums">{activeMeeting.roomCode}</span>
              <span aria-hidden="true">·</span>
              <span className="dir-ltr tabular-nums font-bold text-emerald-300">
                {toPersianDigits(mm)}:{toPersianDigits(ss)}
              </span>
            </div>
            <h1 className="text-base font-bold mt-1">{activeMeeting.topic}</h1>
          </div>

          <button
            type="button"
            onClick={leaveRoom}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-medium cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>پایان جلسه</span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* Simulated Secure A/V Stage (8 cols) */}
          <div className="xl:col-span-8 bg-[#0F172A] rounded-xl p-5 flex flex-col justify-between min-h-[420px] text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {/* Advisor tile */}
              <div className="rounded-xl bg-[#1E293B] border border-white/10 p-5 flex flex-col items-center justify-center relative">
                <div className="w-20 h-20 rounded-full bg-[#0A2540] border-2 border-emerald-400 flex items-center justify-center text-2xl font-bold text-white">
                  {activeMeeting.advisorName.slice(0, 1)}
                </div>
                <div className="mt-3 text-sm font-bold">{activeMeeting.advisorName}</div>
                <div className="text-xs text-slate-300 mt-0.5">{activeMeeting.advisorTitle}</div>
                <span className="mt-3 text-[11px] text-emerald-300">صدای مشاور فعال است</span>
              </div>

              {/* Customer / Screen share tile */}
              <div className="rounded-xl bg-[#1E293B] border border-white/10 p-5 flex flex-col items-center justify-center relative">
                {screenSharing ? (
                  <div className="text-center space-y-2">
                    <MonitorUp className="w-10 h-10 text-emerald-400 mx-auto" />
                    <div className="text-sm font-bold">اشتراک‌گذاری سند قرارداد فعال است</div>
                    <div className="text-xs text-slate-300">
                      {activeMeeting.relatedContractCode || 'پیش‌نویس تعهدات معامله امن'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-white">
                      {camOn ? data.user.fullName.slice(0, 1) : <VideoOff className="w-7 h-7 text-slate-400" />}
                    </div>
                    <div className="mt-3 text-sm font-bold">{data.user.fullName} (شما)</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {camOn ? 'دوربین روشن' : 'دوربین خاموش'} · {micOn ? 'میکروفن روشن' : 'میکروفن بی‌صدا'}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Media Control Bar */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setMicOn((v) => !v)}
                className={`px-4 py-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-2 cursor-pointer ${
                  micOn ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-[#DC2626] text-white'
                }`}
              >
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{micOn ? 'قطع صدا' : 'وصل صدا'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCamOn((v) => !v)}
                className={`px-4 py-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-2 cursor-pointer ${
                  camOn ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-[#DC2626] text-white'
                }`}
              >
                {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span>{camOn ? 'خاموش کردن دوربین' : 'روشن کردن دوربین'}</span>
              </button>

              <button
                type="button"
                onClick={() => setScreenSharing((v) => !v)}
                className={`px-4 py-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-2 cursor-pointer ${
                  screenSharing ? 'bg-[#059669] text-white' : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                <MonitorUp className="w-4 h-4" />
                <span>{screenSharing ? 'توقف اشتراک سند' : 'اشتراک سند قرارداد'}</span>
              </button>
            </div>
          </div>

          {/* Checklist + Encrypted Chat (4 cols) */}
          <div className="xl:col-span-4 bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                <CheckSquare className="w-4 h-4 text-[#059669]" />
                <span>چک‌لیست مشترک جلسه</span>
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2 text-xs text-[#0F172A] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        setChecklist((prev) =>
                          prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                        )
                      }
                      className="mt-0.5 accent-[#059669]"
                    />
                    <span className={item.done ? 'line-through text-[#475569]' : ''}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex-1 border-t border-[#E2E8F0] pt-3 flex flex-col justify-between min-h-[210px]">
              <div className="space-y-2.5 max-h-52 overflow-y-auto pe-1">
                {chatLog.map((msg, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#F1F5F9] text-xs">
                    <div className="flex justify-between text-[11px] text-[#475569] mb-1">
                      <span className="font-bold text-[#0A2540]">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="text-[#0F172A] leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={sendMessage} className="flex items-center gap-2 mt-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="پیام رمزنگاری‌شده بنویسید..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0A2540]"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white cursor-pointer"
                  aria-label="ارسال پیام"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">اتاق جلسات آنلاین و مشاوره قراردادها</h1>
        <p className="text-sm text-[#475569] mt-1">
          رزرو نوبت مشاوره حقوقی و بانکی و ورود به اتاق گفت‌وگوی صوتی/تصویری رمزنگاری‌شده
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Scheduled Meetings (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          {data.meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569]">
                  <span className="font-bold text-[#0A2540]">{meeting.advisorName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{meeting.advisorTitle}</span>
                </div>
                <div className="text-sm font-bold text-[#0F172A]">{meeting.topic}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] tabular-nums">
                  <span>{meeting.persianDate}</span>
                  <span aria-hidden="true">·</span>
                  <span>ساعت {meeting.timeSlot}</span>
                  {meeting.relatedContractCode && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="dir-ltr font-medium text-[#0A2540]">
                        {meeting.relatedContractCode}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-medium ${
                    meeting.status === 'COMPLETED'
                      ? 'text-[#059669]'
                      : meeting.status === 'LIVE'
                        ? 'text-[#D97706]'
                        : 'text-[#475569]'
                  }`}
                >
                  {meeting.status === 'COMPLETED'
                    ? 'برگزار شده'
                    : meeting.status === 'LIVE'
                      ? 'در حال برگزاری'
                      : 'رزرو شده'}
                </span>
                <button
                  type="button"
                  onClick={() => enterRoom(meeting)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>ورود به اتاق جلسه</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Book New Consultation (5 cols) */}
        <form
          onSubmit={handleBook}
          className="xl:col-span-5 bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0A2540]" />
            <h2 className="text-base font-bold text-[#0F172A]">رزرو نوبت مشاوره جدید</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-2">انتخاب مشاور</label>
            <div className="space-y-2">
              {ADVISORS.map((adv, idx) => (
                <button
                  key={adv.name}
                  type="button"
                  onClick={() => setSelectedAdvisorIdx(idx)}
                  className={`w-full text-right p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAdvisorIdx === idx
                      ? 'border-[#0A2540] bg-slate-50'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="text-sm font-bold text-[#0F172A]">{adv.name}</div>
                  <div className="text-xs text-[#475569] mt-0.5">
                    {adv.title} · {adv.specialty}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">موضوع جلسه</label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثلاً: تنظیم شروط قرارداد خرید عمده"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0A2540]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">تاریخ</label>
              <select
                value={persianDate}
                onChange={(e) => setPersianDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white"
              >
                <option value="۱۴۰۵/۰۹/۰۳">امروز · ۱۴۰۵/۰۹/۰۳</option>
                <option value="۱۴۰۵/۰۹/۰۴">فردا · ۱۴۰۵/۰۹/۰۴</option>
                <option value="۱۴۰۵/۰۹/۰۶">پنج‌شنبه · ۱۴۰۵/۰۹/۰۶</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">بازه زمانی</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white"
              >
                <option value="۱۰:۳۰ تا ۱۱:۰۰">۱۰:۳۰ تا ۱۱:۰۰</option>
                <option value="۱۵:۰۰ تا ۱۵:۳۰">۱۵:۰۰ تا ۱۵:۳۰</option>
                <option value="۱۷:۰۰ تا ۱۷:۳۰">۱۷:۰۰ تا ۱۷:۳۰</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              پیوند به قرارداد معامله امن (اختیاری)
            </label>
            <select
              value={relatedContract}
              onChange={(e) => setRelatedContract(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white"
            >
              <option value="">بدون قرارداد مرتبط</option>
              {data.safeDeals.map((d) => (
                <option key={d.id} value={d.contractCode}>
                  {d.contractCode} — {d.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={booking}
            className="w-full py-2.5 px-4 rounded-lg bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            <span>ثبت نوبت جلسه آنلاین</span>
          </button>
        </form>
      </div>
    </div>
  );
}
