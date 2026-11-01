import type { AppData, Habit, Schedule, Goal, Tone } from "./types";
import { addDays, parseYmd, startOfDay, startOfWeek, ymd, daysBetween, fmtTime } from "./dates";

export const isDone = (d: AppData, habitId: string, day: string) =>
  d.habitLogs.some((l) => l.habit_id === habitId && l.log_date === day && l.is_done);

export const periodCount = (d: AppData, h: Habit, ref: Date) => {
  let from: Date, to: Date;
  if (h.frequency_type === "mingguan") { from = startOfWeek(ref); to = addDays(from, 6); }
  else if (h.frequency_type === "bulanan") { from = new Date(ref.getFullYear(), ref.getMonth(), 1); to = new Date(ref.getFullYear(), ref.getMonth() + 1, 0); }
  else { from = startOfDay(ref); to = from; }
  const a = ymd(from), b = ymd(to);
  return d.habitLogs.filter((l) => l.habit_id === h.id && l.is_done && l.log_date >= a && l.log_date <= b).length;
};

/** Kebiasaan yang relevan hari ini: harian selalu; berjangka bila target periode belum tercapai atau sudah dicentang hari ini */
export const habitsForToday = (d: AppData, now = new Date()) => {
  const t = ymd(now);
  return d.habits.filter((h) => h.is_active).filter((h) => {
    if (h.frequency_type === "harian") return true;
    return periodCount(d, h, now) < h.frequency_target || isDone(d, h.id, t);
  });
};

export const streak = (d: AppData, h: Habit, now = new Date()) => {
  if (h.frequency_type === "harian") {
    let day = startOfDay(now);
    if (!isDone(d, h.id, ymd(day))) day = addDays(day, -1);
    let n = 0;
    while (isDone(d, h.id, ymd(day))) { n++; day = addDays(day, -1); }
    return { n, unit: "hari" };
  }
  if (h.frequency_type === "mingguan") {
    let w = startOfWeek(now);
    if (periodCount(d, h, w) < h.frequency_target) w = addDays(w, -7);
    let n = 0;
    while (n < 60 && periodCount(d, h, w) >= h.frequency_target) { n++; w = addDays(w, -7); }
    return { n, unit: "minggu" };
  }
  let m = new Date(now.getFullYear(), now.getMonth(), 1);
  if (periodCount(d, h, m) < h.frequency_target) m = new Date(m.getFullYear(), m.getMonth() - 1, 1);
  let n = 0;
  while (n < 24 && periodCount(d, h, m) >= h.frequency_target) { n++; m = new Date(m.getFullYear(), m.getMonth() - 1, 1); }
  return { n, unit: "bulan" };
};

/** Hari terlewat dalam 7 hari terakhir (tidak termasuk hari ini) untuk kebiasaan harian */
export const missedDays = (d: AppData, h: Habit, now = new Date()) => {
  if (h.frequency_type !== "harian") return [] as string[];
  const created = startOfDay(new Date(h.created_at));
  const out: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const day = addDays(startOfDay(now), -i);
    if (day < created) break;
    if (!isDone(d, h.id, ymd(day))) out.push(ymd(day));
  }
  return out;
};

export const scheduleEnd = (s: Schedule) => s.end_at ? new Date(s.end_at) : new Date(new Date(s.start_at).getTime() + 60 * 60 * 1000);
export const effectiveStatus = (s: Schedule, now = new Date()) =>
  s.status === "terjadwal" && scheduleEnd(s) < now ? "terlewat" : s.status;

export const schedulesOn = (d: AppData, day: string) =>
  d.schedules.filter((s) => ymd(new Date(s.start_at)) === day).sort((a, b) => a.start_at.localeCompare(b.start_at));

export const goalProgress = (d: AppData, g: Goal) => {
  const st = d.steps.filter((s) => s.goal_id === g.id);
  return st.length ? Math.round((st.filter((s) => s.is_done).length / st.length) * 100) : g.progress;
};

export interface Drift { id: string; kind: "kebiasaan" | "agenda" | "tujuan" | "uang"; title: string; detail: string; action?: string; target: string }

export const toneMsg = (tone: Tone, kind: "habit" | "agenda" | "goal" | "money", name: string, n = 0) => {
  const L: Record<string, string> = {
    habit: `"${name}" terlewat ${n} kali minggu ini. Nggak apa-apa, coba versi kecilnya dulu hari ini, cukup 2 menit.`,
    agenda: `"${name}" belum sempat dikerjakan. Mau digeser ke waktu lain supaya tetap jalan?`,
    goal: `Tenggat "${name}" makin dekat. Satu langkah kecil hari ini sudah cukup berarti.`,
    money: `Pengeluaran hari ini sudah melewati batas. Pelan-pelan dulu ya untuk sisa hari ini.`,
  };
  const T: Record<string, string> = {
    habit: `"${name}" sudah ${n} kali terlewat dalam 7 hari. Saatnya kembali ke jalur: kerjakan hari ini, jangan ditunda.`,
    agenda: `"${name}" terlewat. Tentukan waktu barunya sekarang, atau hapus kalau memang tidak penting.`,
    goal: `"${name}" tertinggal dari tenggat. Kalau serius, sisihkan waktu untuk langkah berikutnya hari ini.`,
    money: `Batas belanja hari ini sudah jebol. Stop pengeluaran tidak penting sampai besok.`,
  };
  return (tone === "tegas" ? T : L)[kind];
};

export const detectDrift = (d: AppData, now = new Date()): Drift[] => {
  const out: Drift[] = [];
  const tone = d.prefs.reminder_tone;
  for (const h of d.habits.filter((x) => x.is_active)) {
    const m = missedDays(d, h, now).length;
    if (m >= d.prefs.miss_threshold) out.push({ id: "h-" + h.id, kind: "kebiasaan", title: h.name, detail: toneMsg(tone, "habit", h.name, m), target: "kebiasaan" });
    if (h.frequency_type === "mingguan") {
      const left = 6 - ((now.getDay() + 6) % 7);
      const need = h.frequency_target - periodCount(d, h, now);
      if (need > left + 1) out.push({ id: "hw-" + h.id, kind: "kebiasaan", title: h.name, detail: `Butuh ${need} kali lagi, padahal minggu ini tinggal ${left + 1} hari. Ubah target atau mulai hari ini.`, target: "kebiasaan" });
    }
  }
  const weekAgo = addDays(startOfDay(now), -7);
  const missed = d.schedules.filter((s) => effectiveStatus(s, now) === "terlewat" && new Date(s.start_at) >= weekAgo);
  if (missed.length) {
    const s = missed[missed.length - 1];
    out.push({ id: "s-" + s.id, kind: "agenda", title: missed.length > 1 ? `${missed.length} agenda terlewat` : s.title, detail: toneMsg(tone, "agenda", s.title), target: "pengingat" });
  }
  for (const g of d.goals.filter((x) => x.status === "aktif")) {
    const total = Math.max(1, daysBetween(new Date(g.created_at), parseYmd(g.target_date)));
    const elapsed = daysBetween(new Date(g.created_at), now);
    const expected = Math.min(100, Math.round((elapsed / total) * 100));
    const p = goalProgress(d, g);
    if (expected - p >= 25) out.push({ id: "g-" + g.id, kind: "tujuan", title: g.title, detail: `Progres ${p}%, padahal waktu sudah berjalan ${expected}%. ` + toneMsg(tone, "goal", g.title), target: "tujuan" });
  }
  const spent = spendingOn(d, ymd(now));
  if (d.prefs.daily_budget > 0 && spent > d.prefs.daily_budget) out.push({ id: "m-" + ymd(now), kind: "uang", title: "Batas belanja harian", detail: toneMsg(tone, "money", ""), target: "keuangan" });
  return out;
};

export const spendingOn = (d: AppData, day: string) =>
  d.transactions.filter((t) => t.type === "pengeluaran" && ymd(new Date(t.occurred_at)) === day).reduce((a, t) => a + t.amount, 0);
export const spendingBetween = (d: AppData, a: string, b: string) =>
  d.transactions.filter((t) => t.type === "pengeluaran" && ymd(new Date(t.occurred_at)) >= a && ymd(new Date(t.occurred_at)) <= b).reduce((s, t) => s + t.amount, 0);
export const balance = (d: AppData) => d.transactions.reduce((a, t) => a + (t.type === "pemasukan" ? t.amount : -t.amount), 0);

export const weeklyReport = (d: AppData, weekStart: Date, now = new Date()) => {
  let habitDone = 0, habitMissed = 0;
  const end = addDays(weekStart, 6);
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    if (day > startOfDay(now)) break;
    const isToday = ymd(day) === ymd(now);
    for (const h of d.habits.filter((x) => x.frequency_type === "harian" && startOfDay(new Date(x.created_at)) <= day)) {
      if (isDone(d, h.id, ymd(day))) habitDone++; else if (!isToday) habitMissed++;
    }
  }
  for (const h of d.habits.filter((x) => x.frequency_type === "mingguan")) {
    const c = periodCount(d, h, weekStart); habitDone += Math.min(c, h.frequency_target);
    if (end < startOfDay(now)) habitMissed += Math.max(0, h.frequency_target - c);
  }
  const ws = ymd(weekStart), we = ymd(end);
  const sch = d.schedules.filter((s) => { const k = ymd(new Date(s.start_at)); return k >= ws && k <= we; });
  return {
    habitDone, habitMissed,
    scheduleDone: sch.filter((s) => s.status === "selesai").length,
    scheduleMissed: sch.filter((s) => effectiveStatus(s, now) === "terlewat").length,
    scheduleTotal: sch.length,
    spending: spendingBetween(d, ws, we),
  };
};

export const dailyHabitRate = (d: AppData, day: Date) => {
  const hs = d.habits.filter((h) => h.frequency_type === "harian" && h.is_active && startOfDay(new Date(h.created_at)) <= day);
  if (!hs.length) return 0;
  return Math.round((hs.filter((h) => isDone(d, h.id, ymd(day))).length / hs.length) * 100);
};

export const reminderText = (tone: Tone, _kind: "agenda" | "kebiasaan", name: string, when: string) =>
  tone === "tegas"
    ? `Waktunya ${name} (${when}). Kerjakan sekarang.`
    : `Hai, sudah waktunya ${name} (${when}). Semangat ya!`;

export { fmtTime };
