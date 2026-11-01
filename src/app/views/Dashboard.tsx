import { useMemo } from "react";
import { Plus, ArrowRight, TrendingUp, TrendingDown, Flame, TriangleAlert, ChevronRight, Wallet } from "lucide-react";
import { useStore } from "../store";
import { Panel, IconTile, Tick, Bar, Sparkline, tintBg, tintFg } from "../ui";
import { HeroArt, ThumbReflect, ThumbSteps, ThumbHabit, ThumbMoney } from "../art";
import { MonthCalendar } from "../calendar";
import { QuickAddMenu } from "../shell";
import { addDays, startOfDay, startOfWeek, ymd, greeting, fmtTime, fmtDateLong, BULAN_PENDEK, rupiah, rupiahShort, daysBetween, parseYmd } from "../dates";
import { detectDrift, habitsForToday, isDone, streak, schedulesOn, effectiveStatus, goalProgress, spendingOn, balance, dailyHabitRate, weeklyReport, periodCount } from "../logic";
import { getDailyHeroQuote } from "../quotes";
import type { Tint } from "../types";
import { cn } from "@/lib/utils";

export const Dashboard = () => {
  const s = useStore();
  const { data, now, setView, setFocusDate, setQuick } = s;
  const today = ymd(now);
  const t0 = startOfDay(now);

  const habits = habitsForToday(data, now);
  const doneHabits = habits.filter((h) => isDone(data, h.id, today)).length;
  const agenda = schedulesOn(data, today);
  const drifts = detectDrift(data, now);
  const goals = data.goals.filter((g) => g.status === "aktif");
  const spentToday = spendingOn(data, today);
  const budgetLeft = data.prefs.daily_budget - spentToday;

  const stats = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(t0, i - 6));
    const habitSeries = days.map((d) => dailyHabitRate(data, d));
    const spendSeries = days.map((d) => spendingOn(data, ymd(d)));
    const wk = weeklyReport(data, startOfWeek(now), now);
    const prev = weeklyReport(data, addDays(startOfWeek(now), -7), now);
    const agendaSeries = Array.from({ length: 6 }, (_, i) => weeklyReport(data, addDays(startOfWeek(now), (i - 5) * 7), now).scheduleDone);
    const avgGoal = goals.length ? Math.round(goals.reduce((a, g) => a + goalProgress(data, g), 0) / goals.length) : 0;
    const best = habits.map((h) => ({ h, st: streak(data, h, now) })).sort((a, b) => b.st.n - a.st.n)[0];
    const goalSeries = goals.length ? Array.from({ length: 7 }, (_, i) => {
      const cut = addDays(t0, i - 6 + 1).toISOString();
      const vals = goals.map((g) => { const st = data.steps.filter((x) => x.goal_id === g.id); return st.length ? (st.filter((x) => x.is_done && (x.done_at ?? "") < cut).length / st.length) * 100 : g.progress; });
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    }) : [0, 0];
    return { habitSeries, spendSeries, wk, prev, agendaSeries, avgGoal, best, goalSeries };
  }, [data, now]); // eslint-disable-line

  const upcoming = data.schedules
    .filter((x) => new Date(x.start_at) > addDays(t0, 1) && x.status === "terjadwal")
    .sort((a, b) => a.start_at.localeCompare(b.start_at)).slice(0, 4);
  const marks = useMemo(() => { const m: Record<string, number> = {}; data.schedules.forEach((x) => { const k = ymd(new Date(x.start_at)); m[k] = (m[k] || 0) + 1; }); return m; }, [data.schedules]);

  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
  const habitTrend = pct(stats.habitSeries.slice(-3).reduce((a, b) => a + b, 0), stats.habitSeries.slice(0, 3).reduce((a, b) => a + b, 0));
  const isSunday = now.getDay() === 0 || now.getDay() === 6;
  const ws = ymd(startOfWeek(now));
  const hasReflection = data.reflections.some((r) => r.week_start === ws);

  const recs: { title: string; text: string; art: React.ReactElement; go: () => void }[] = [];
  if (!hasReflection) recs.push({ title: isSunday ? "Waktunya refleksi" : "Catatan refleksi", text: "Tulis 2 kalimat: apa yang berhasil, apa yang diubah.", art: <ThumbReflect />, go: () => setView("evaluasi") });
  const goalNoSteps = goals.find((g) => data.steps.filter((x) => x.goal_id === g.id && !x.is_done).length === 0 && goalProgress(data, g) < 100);
  recs.push(goalNoSteps
    ? { title: "Pecah jadi langkah kecil", text: `"${goalNoSteps.title}" belum punya langkah berikutnya.`, art: <ThumbSteps />, go: () => setView("tujuan") }
    : { title: "Langkah berikutnya", text: "Centang satu langkah kecil dari tujuanmu hari ini.", art: <ThumbSteps />, go: () => setView("tujuan") });
  const weak = habits.find((h) => h.frequency_type === "harian" && !isDone(data, h.id, today) && streak(data, h, now).n === 0);
  recs.push({ title: "Aturan 2 menit", text: weak ? `Mulai "${weak.name}" versi mini, cukup 2 menit.` : "Kebiasaan baru? Mulai dari versi paling kecil.", art: <ThumbHabit />, go: () => setView("kebiasaan") });
  recs.push({ title: "Cek batas belanja", text: `Bulan ini terpakai ${rupiahShort(monthSpend(data, now))} dari ${rupiahShort(data.prefs.monthly_budget)}.`, art: <ThumbMoney />, go: () => setView("keuangan") });

  const heroQuote = useMemo(() => getDailyHeroQuote(now), [now]);

  return (
    <div className="space-y-4">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-rose-bg via-peach-bg to-butter-bg" style={{ boxShadow: "var(--shadow)" }}>
        <div className="grid items-end md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative z-10 p-6 sm:p-8 md:pb-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/85 px-3 py-1 text-xs font-bold text-brand shadow-xs backdrop-blur-sm">
                <span>💡</span> Motivasi Hari Ini
              </span>
              <span className="text-xs font-medium text-mute">· {fmtDateLong(now)}</span>
            </div>

            <p className="mt-3 text-sm font-semibold text-ink2">
              {greeting(now)}, {data.user?.name.split(" ")[0]} 👋
            </p>

            <blockquote className="mt-2.5">
              <h1 className="font-display text-[23px] sm:text-[28px] md:text-[31px] font-semibold leading-snug text-ink">
                “{heroQuote.quote}”
              </h1>
              <footer className="mt-2 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-ink2">
                <span className="font-bold text-ink">— {heroQuote.author}</span>
                <span className="text-mute">({heroQuote.role})</span>
              </footer>
            </blockquote>

            <p className="mt-3 max-w-md text-[13px] sm:text-[14px] leading-relaxed text-ink2">
              <span className="font-bold text-ink">Pesan konsistensi:</span> {heroQuote.advice}
            </p>

            <p className="mt-2 text-xs font-medium text-mute">
              {habits.length + agenda.length === 0
                ? "Hari ini belum ada catatan. Mulai dari satu hal kecil."
                : `Hari ini ada ${agenda.filter((a) => a.status !== "selesai").length} agenda & ${habits.length - doneHabits} kebiasaan yang menunggu. Langkah demi langkah.`}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <QuickAddMenu align="start"><button className="btn btn-primary px-5 py-3 text-[15px]"><Plus size={18} /> Catat cepat</button></QuickAddMenu>
              {goals.length === 0 && <button onClick={() => setQuick("tujuan")} className="btn btn-ghost py-3">Buat tujuan pertama</button>}
            </div>
          </div>
          <div className="relative -mt-6 h-[200px] sm:h-[250px] md:mt-0 md:h-[290px]"><HeroArt /></div>
        </div>
      </section>

      {/* TANDA MELENCENG */}
      {drifts.length > 0 && (
        <section className="rounded-[22px] border border-[color-mix(in_srgb,var(--coral)_30%,transparent)] bg-[color-mix(in_srgb,var(--coral)_8%,var(--surface))] p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral text-white"><TriangleAlert size={17} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-ink">Tanda kamu mulai melenceng</p>
              <p className="text-xs text-mute">Bukan untuk menghakimi, cuma biar kamu sadar lebih awal.</p>
              <ul className="mt-2.5 space-y-2">
                {drifts.slice(0, 3).map((d) => (
                  <li key={d.id}><button onClick={() => setView(d.target as never)} className="group flex w-full items-start gap-2 text-left text-sm text-ink2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-coral" /><span className="flex-1"><b className="text-ink">{d.title}.</b> {d.detail}</span><ChevronRight size={16} className="mt-0.5 shrink-0 text-mute transition group-hover:translate-x-0.5" /></button></li>
                ))}
              </ul>
              {drifts.length > 3 && <button onClick={() => setView("pengingat")} className="mt-2 text-xs font-bold text-coral">+{drifts.length - 3} lainnya</button>}
            </div>
          </div>
        </section>
      )}

      {/* STAT */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4">
        <Stat tint="lilac" icon="✅" label="Kebiasaan hari ini" value={`${doneHabits}/${habits.length}`} trend={habitTrend} trendLabel="vs awal pekan" series={stats.habitSeries} onClick={() => setView("kebiasaan")} />
        <Stat tint="rose" icon="🎯" label="Progres tujuan" value={`${stats.avgGoal}%`} sub={`${goals.length} tujuan aktif`} series={stats.goalSeries} onClick={() => setView("tujuan")} />
        <Stat tint="butter" icon="🗓️" label="Agenda selesai" value={`${stats.wk.scheduleDone}`} unit="pekan ini" trend={pct(stats.wk.scheduleDone, stats.prev.scheduleDone)} trendLabel="vs pekan lalu" series={stats.agendaSeries} onClick={() => setView("jadwal")} />
        <Stat tint="mint" icon={<Flame size={20} />} label="Runutan terbaik" value={stats.best ? `${stats.best.st.n}` : "0"} unit={stats.best?.st.unit ?? "hari"} sub={stats.best?.h.name} series={stats.best ? Array.from({ length: 14 }, (_, i) => Array.from({ length: i + 1 }, (_, j) => isDone(data, stats.best!.h.id, ymd(addDays(t0, j - 13))) ? 1 : 0).reduce<number>((a, b) => a + b, 0)) : [0, 0]} onClick={() => setView("kebiasaan")} />
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* AGENDA HARI INI */}
        <Panel className="xl:col-span-7" title="Agenda hari ini" sub={`${agenda.filter((a) => a.status === "selesai").length} dari ${agenda.length} selesai`} action={<button className="link-pill" onClick={() => { setFocusDate(today); setView("jadwal"); }}>Lihat semua</button>}>
          {agenda.length === 0 ? (
            <button onClick={() => setQuick("agenda")} className="w-full rounded-[16px] border border-dashed border-line py-6 text-sm font-semibold text-mute hover:text-brand">+ Tambah agenda pertama hari ini</button>
          ) : (
            <ul className="divide-y divide-line">
              {agenda.slice(0, 5).map((a) => {
                const st = effectiveStatus(a, now);
                return (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <Tick on={st === "selesai"} onClick={() => s.toggleSchedule(a)} label={`Tandai ${a.title} selesai`} />
                    <IconTile tint={a.color} size={38}>{a.icon}</IconTile>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-bold", st === "selesai" ? "text-mute line-through" : "text-ink")}>{a.title}</p>
                      <p className="text-xs text-mute">{fmtTime(a.start_at)}{a.end_at && `–${fmtTime(a.end_at)}`}{a.notes && ` · ${a.notes}`}</p>
                    </div>
                    {st === "terlewat" && <button onClick={() => s.shiftSchedule(a, 24 * 60)} className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--coral)_12%,transparent)] px-2.5 py-1 text-[11px] font-bold text-coral" title="Geser ke besok">Terlewat · geser</button>}
                  </li>
                );
              })}
            </ul>
          )}
          {agenda.length > 5 && <p className="pt-2 text-xs text-mute">+{agenda.length - 5} agenda lainnya</p>}
        </Panel>

        {/* KALENDER */}
        <Panel className="xl:col-span-5"><MonthCalendar selected={today} marks={marks} onSelect={(d) => { setFocusDate(d); setView("jadwal"); }} /></Panel>

        {/* KEBIASAAN */}
        <Panel className="xl:col-span-7" title="Kebiasaan hari ini" sub="Satu klik untuk mencentang" action={<button className="link-pill" onClick={() => setView("kebiasaan")}>Lihat semua</button>}>
          {habits.length === 0 ? (
            <button onClick={() => setQuick("kebiasaan")} className="w-full rounded-[16px] border border-dashed border-line py-6 text-sm font-semibold text-mute hover:text-brand">+ Tambah kebiasaan pertama</button>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {habits.slice(0, 6).map((h) => {
                const on = isDone(data, h.id, today); const st = streak(data, h, now);
                return (
                  <li key={h.id}>
                    <button onClick={() => s.toggleHabit(h)} aria-pressed={on} className={cn("flex w-full items-center gap-3 rounded-[16px] border p-2.5 text-left transition", on ? cn("border-transparent", tintBg[h.color]) : "border-line hover:border-ink2")}>
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-[12px] text-lg", on ? "bg-surface" : tintBg[h.color])}>{h.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-ink">{h.name}</span>
                        <span className="text-[11px] text-mute">{h.frequency_type === "harian" ? `🔥 ${st.n} hari` : `${periodCount(data, h, now)}/${h.frequency_target} ${h.frequency_type === "mingguan" ? "pekan ini" : "bulan ini"}`} · {h.preferred_time.replace(":", ".")}</span>
                      </span>
                      <span className="tick" data-on={on}>{on && <span className="animate-pop text-[12px]">✓</span>}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* MENDATANG */}
        <Panel className="xl:col-span-5" title="Mendatang" action={<button className="link-pill" onClick={() => setView("jadwal")}>Lihat semua</button>}>
          {upcoming.length === 0 ? <p className="py-4 text-sm text-mute">Belum ada agenda mendatang.</p> : (
            <ul className="space-y-2.5">
              {upcoming.map((u) => { const d = new Date(u.start_at); return (
                <li key={u.id} className="flex items-center gap-3">
                  <div className={cn("flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[14px] leading-none", tintBg[u.color])}>
                    <span className={cn("text-[10px] font-extrabold uppercase", tintFg[u.color])}>{BULAN_PENDEK[d.getMonth()]}</span>
                    <span className="font-display text-xl font-semibold text-ink">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink">{u.title}</p><p className="text-xs text-mute">{fmtTime(u.start_at)} · {daysBetween(t0, d) === 1 ? "besok" : `${daysBetween(t0, d)} hari lagi`}</p></div>
                </li>); })}
            </ul>
          )}
        </Panel>

        {/* TUJUAN */}
        <Panel className="xl:col-span-7" title="Tujuan yang sedang jalan" action={<button className="link-pill" onClick={() => setView("tujuan")}>Lihat semua</button>}>
          {goals.length === 0 ? (
            <button onClick={() => setQuick("tujuan")} className="w-full rounded-[16px] border border-dashed border-line py-6 text-sm font-semibold text-mute hover:text-brand">+ Buat tujuan pertamamu</button>
          ) : (
            <ul className="space-y-3.5">
              {goals.slice(0, 4).map((g) => { const p = goalProgress(data, g); const left = daysBetween(t0, parseYmd(g.target_date)); return (
                <li key={g.id} className="flex items-center gap-3">
                  <IconTile tint={g.color} size={38}>🎯</IconTile>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2"><p className="truncate text-sm font-bold text-ink">{g.title}</p><span className="shrink-0 text-sm font-extrabold text-ink">{p}%</span></div>
                    <Bar value={p} tint={g.color} />
                    <p className="mt-1 text-[11px] text-mute">{left >= 0 ? `${left} hari lagi` : `lewat ${-left} hari`}</p>
                  </div>
                </li>); })}
            </ul>
          )}
        </Panel>

        {/* SOROTAN KEUANGAN */}
        <Panel className="xl:col-span-5" title="Sorotan keuangan" action={<button className="link-pill" onClick={() => setQuick("transaksi")}>+ Catat</button>}>
          <div className="rounded-[18px] bg-ink p-4 text-[var(--surface)]">
            <p className="flex items-center gap-1.5 text-xs opacity-70"><Wallet size={13} /> Saldo saat ini</p>
            <p className="mt-1 font-display text-[28px] font-semibold">{rupiah(balance(data))}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-[16px] bg-surface2 p-3"><p className="text-[11px] font-semibold text-mute">Keluar hari ini</p><p className="text-lg font-extrabold text-ink">{rupiahShort(spentToday)}</p></div>
            <div className="rounded-[16px] bg-surface2 p-3"><p className="text-[11px] font-semibold text-mute">Sisa batas harian</p><p className={cn("text-lg font-extrabold", budgetLeft < 0 ? "text-coral" : "text-mint")}>{rupiahShort(budgetLeft)}</p></div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] font-semibold text-mute"><span>7 hari terakhir</span><span>batas {rupiahShort(data.prefs.daily_budget)}/hari</span></div>
            <div className="flex h-14 items-end gap-1.5">
              {stats.spendSeries.map((v, i) => { const max = Math.max(...stats.spendSeries, data.prefs.daily_budget, 1); const over = v > data.prefs.daily_budget; return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-[6px]" style={{ height: `${Math.max(4, (v / max) * 44)}px`, background: over ? "var(--coral)" : "var(--butter)", opacity: i === 6 ? 1 : 0.65 }} title={rupiah(v)} /></div>); })}
            </div>
          </div>
        </Panel>
      </div>

      {/* SARAN */}
      <Panel title="Saran untuk kamu" sub="Disusun dari kondisimu minggu ini">
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
          {recs.slice(0, 4).map((r) => (
            <button key={r.title} onClick={r.go} className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-line bg-surface text-left transition hover:-translate-y-0.5 sm:w-auto">
              <div className="h-[104px] overflow-hidden">{r.art}</div>
              <div className="flex items-end gap-2 p-3.5">
                <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-ink">{r.title}</p><p className="mt-0.5 line-clamp-2 text-xs text-mute">{r.text}</p></div>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface2 text-brand transition group-hover:bg-brand group-hover:text-[var(--accent-ink)]"><ArrowRight size={15} /></span>
              </div>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
};

const monthSpend = (d: ReturnType<typeof useStore>["data"], now: Date) => {
  const a = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
  return d.transactions.filter((t) => t.type === "pengeluaran" && ymd(new Date(t.occurred_at)) >= a).reduce((s, t) => s + t.amount, 0);
};

const Stat = ({ tint, icon, label, value, unit, sub, trend, trendLabel, series, onClick }: { tint: Tint; icon: React.ReactNode; label: string; value: string; unit?: string; sub?: string; trend?: number; trendLabel?: string; series: number[]; onClick: () => void }) => (
  <button onClick={onClick} className={cn("group flex flex-col rounded-[22px] border border-line p-4 text-left transition hover:-translate-y-0.5", tintBg[tint])} style={{ boxShadow: "var(--shadow)" }}>
    <span className={cn("grid h-10 w-10 place-items-center rounded-[13px] bg-surface text-lg", tintFg[tint])}>{icon}</span>
    <span className="mt-3 text-xs font-semibold text-ink2">{label}</span>
    <span className="mt-0.5 flex items-baseline gap-1.5"><span className="font-display text-[30px] font-semibold leading-none text-ink">{value}</span>{unit && <span className="text-sm font-bold text-ink2">{unit}</span>}</span>
    <span className="mt-1.5 min-h-[16px] truncate text-[11px] font-semibold">
      {trend !== undefined ? <span className={cn("inline-flex items-center gap-1", trend >= 0 ? "text-mint" : "text-coral")}>{trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{trend >= 0 ? "+" : ""}{trend}% <span className="font-medium text-mute">{trendLabel}</span></span> : <span className="text-mute">{sub}</span>}
    </span>
    <span className="mt-2 block"><Sparkline data={series} tint={tint} h={34} /></span>
  </button>
);
