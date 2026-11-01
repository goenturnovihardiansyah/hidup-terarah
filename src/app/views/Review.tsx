import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useStore } from "../store";
import { PageHead, Panel } from "../ui";
import { weeklyReport, dailyHabitRate } from "../logic";
import { addDays, fmtDateShort, startOfDay, startOfWeek, ymd, rupiah, HARI_PENDEK } from "../dates";
import { getDailyReflectionQuote } from "../quotes";
import { cn } from "@/lib/utils";

export const Review = () => {
  const s = useStore();
  const { data, now } = s;
  const [week, setWeek] = useState(startOfWeek(now));
  const wsKey = ymd(week);
  const rep = weeklyReport(data, week, now);
  const prev = weeklyReport(data, addDays(week, -7), now);
  const isCur = wsKey === ymd(startOfWeek(now));
  const refQuote = useMemo(() => getDailyReflectionQuote(now), [now]);

  const chart = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const w = addDays(startOfWeek(now), (i - 7) * 7);
    const r = weeklyReport(data, w, now);
    const h = r.habitDone + r.habitMissed ? Math.round((r.habitDone / (r.habitDone + r.habitMissed)) * 100) : 0;
    const a = r.scheduleTotal ? Math.round((r.scheduleDone / r.scheduleTotal) * 100) : 0;
    return { w, h, a };
  }), [data, now]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));

  const existing = data.reflections.find((r) => r.week_start === wsKey);
  const [learned, setLearned] = useState(""); const [improve, setImprove] = useState("");
  useEffect(() => { setLearned(existing?.learned ?? ""); setImprove(existing?.to_improve ?? ""); }, [wsKey, existing?.id]); // eslint-disable-line

  const hRate = rep.habitDone + rep.habitMissed ? Math.round((rep.habitDone / (rep.habitDone + rep.habitMissed)) * 100) : 0;
  const pHRate = prev.habitDone + prev.habitMissed ? Math.round((prev.habitDone / (prev.habitDone + prev.habitMissed)) * 100) : 0;
  const summary = hRate >= 80 ? "Minggu yang solid. Kamu konsisten menjaga kebiasaan." : hRate >= 55 ? "Lumayan! Ada beberapa bolong, tapi arahmu tetap benar." : "Minggu yang berat ya. Tidak apa-apa, pilih satu kebiasaan untuk fokus minggu depan.";

  const W = 560, H = 180, P = 28;
  const x = (i: number) => P + (i / 7) * (W - P * 2);
  const y = (v: number) => H - 24 - (v / 100) * (H - 48);
  const path = (k: "h" | "a") => chart.map((c, i) => `${i ? "L" : "M"}${x(i)},${y(c[k])}`).join(" ");

  return (
    <div>
      <PageHead eyebrow="Progres & evaluasi" title="Evaluasi mingguan" text="Lihat hasil usahamu, lalu putuskan satu hal untuk diperbaiki." />
      <div className="mb-4 flex items-center gap-2">
        <button aria-label="Minggu sebelumnya" onClick={() => setWeek(addDays(week, -7))} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface"><ChevronLeft size={17} /></button>
        <p className="min-w-[170px] text-center font-extrabold text-ink">{fmtDateShort(week)} – {fmtDateShort(addDays(week, 6))}{isCur && <span className="ml-1 text-xs font-semibold text-mute">(minggu ini)</span>}</p>
        <button aria-label="Minggu berikutnya" disabled={isCur} onClick={() => setWeek(addDays(week, 7))} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface disabled:opacity-30"><ChevronRight size={17} /></button>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="rounded-[24px] border border-line bg-gradient-to-br from-sky-bg to-lilac-bg p-5 xl:col-span-5" style={{ boxShadow: "var(--shadow)" }}>
          <p className="eyebrow">Laporan mingguan</p>
          <p className="mt-2 font-display text-[22px] font-semibold leading-snug text-ink">{summary}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Kebiasaan selesai", rep.habitDone, `${hRate}% konsisten`, hRate - pHRate],
              ["Kebiasaan terlewat", rep.habitMissed, "", null],
              ["Agenda selesai", rep.scheduleDone, `dari ${rep.scheduleTotal}`, rep.scheduleDone - prev.scheduleDone],
              ["Agenda terlewat", rep.scheduleMissed, "", null],
            ].map(([l, v, sub, diff]) => (
              <div key={l as string} className="rounded-[16px] bg-surface p-3">
                <p className="text-[11px] font-semibold text-mute">{l}</p>
                <p className="font-display text-[26px] font-semibold leading-tight text-ink">{v as number}</p>
                <p className="text-[11px] font-semibold text-ink2">{sub}{diff !== null && <span className={cn("ml-1", (diff as number) >= 0 ? "text-mint" : "text-coral")}>{(diff as number) >= 0 ? "▲" : "▼"} {Math.abs(diff as number)}</span>}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-[16px] bg-surface p-3"><span className="text-sm font-semibold text-ink2">Total pengeluaran</span><span className="font-extrabold text-ink">{rupiah(rep.spending)}</span></div>
        </section>

        <Panel className="xl:col-span-7" title="Grafik konsistensi" sub="8 minggu terakhir, persentase selesai">
          <div className="mb-2 flex gap-4 text-xs font-semibold text-ink2"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-lilac" />Kebiasaan</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-peach" />Agenda</span></div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafik konsistensi 8 minggu">
            {[0, 50, 100].map((v) => <g key={v}><line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray="3 4" /><text x={P - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--muted)">{v}</text></g>)}
            <path d={path("a")} fill="none" stroke="var(--peach)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <path d={`${path("h")} L${x(7)},${H - 24} L${x(0)},${H - 24} Z`} fill="var(--lilac)" opacity=".12" />
            <path d={path("h")} fill="none" stroke="var(--lilac)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {chart.map((c, i) => <g key={i}>
              <circle cx={x(i)} cy={y(c.h)} r={ymd(c.w) === wsKey ? 5.5 : 3.5} fill="var(--surface)" stroke="var(--lilac)" strokeWidth="2.5"><title>{`Kebiasaan ${c.h}% · Agenda ${c.a}%`}</title></circle>
              <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fontWeight={ymd(c.w) === wsKey ? 800 : 500} fill={ymd(c.w) === wsKey ? "var(--ink)" : "var(--muted)"}>{fmtDateShort(c.w)}</text>
            </g>)}
          </svg>
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-2 text-xs font-semibold text-mute">Per hari, minggu terpilih</p>
            <div className="grid grid-cols-7 gap-2">
              {days.map((d) => { const v = d > startOfDay(now) ? null : dailyHabitRate(data, d); return (
                <div key={ymd(d)} className="text-center">
                  <div className="mx-auto flex h-16 w-full max-w-[38px] items-end overflow-hidden rounded-[10px] bg-surface2"><div className="w-full rounded-[10px] bg-lilac transition-all" style={{ height: `${v ?? 0}%`, opacity: v === null ? 0 : 0.35 + (v / 100) * 0.65 }} /></div>
                  <p className="mt-1 text-[10px] font-bold text-mute">{HARI_PENDEK[d.getDay()]}</p>
                </div>); })}
            </div>
          </div>
        </Panel>

        <Panel className="xl:col-span-7" title="Catatan refleksi" sub={existing ? "Tersimpan. Kamu bisa ubah kapan saja." : "Dua kalimat sudah cukup."}>
          <div className="mb-4 rounded-[16px] border border-line bg-gradient-to-r from-butter-bg to-peach-bg p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-peach">💡 Inspirasi Refleksi ({refQuote.author} - {refQuote.role})</p>
            <p className="mt-1 text-sm font-semibold italic text-ink">“{refQuote.quote}”</p>
            <p className="mt-1 text-xs text-ink2">{refQuote.advice}</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); s.saveReflection({ week_start: wsKey, learned, to_improve: improve }); s.toast("Refleksi tersimpan. Terima kasih sudah jujur pada diri sendiri."); }} className="space-y-3">
            <div><label className="label" htmlFor="rf-l">Apa yang berhasil / pelajaran minggu ini?</label><textarea id="rf-l" rows={3} className="field resize-none" value={learned} onChange={(e) => setLearned(e.target.value)} placeholder="Misal: bangun lebih pagi bikin fokus seharian" /></div>
            <div><label className="label" htmlFor="rf-i">Satu hal yang ingin diperbaiki</label><textarea id="rf-i" rows={2} className="field resize-none" value={improve} onChange={(e) => setImprove(e.target.value)} placeholder="Misal: HP di luar kamar setelah jam 10 malam" /></div>
            <button className="btn btn-primary" disabled={!learned.trim() && !improve.trim()}><Save size={15} /> Simpan refleksi</button>
          </form>
        </Panel>
        <Panel className="xl:col-span-5" title="Refleksi sebelumnya">
          {data.reflections.filter((r) => r.week_start !== wsKey).length === 0 ? <p className="text-sm text-mute">Belum ada refleksi lain.</p> : (
            <ul className="space-y-3">
              {data.reflections.filter((r) => r.week_start !== wsKey).slice(0, 4).map((r) => (
                <li key={r.id} className="rounded-[16px] bg-surface2 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-mute">Minggu {fmtDateShort(new Date(r.week_start + "T00:00"))}</p>
                  {r.learned && <p className="mt-1 text-sm text-ink">✨ {r.learned}</p>}
                  {r.to_improve && <p className="mt-1 text-sm text-ink2">🔧 {r.to_improve}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};
