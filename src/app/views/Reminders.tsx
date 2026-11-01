import { useState } from "react";
import { BellRing, CheckCheck, TriangleAlert, Settings2 } from "lucide-react";
import { useStore } from "../store";
import { PageHead, Panel, Segmented, IconTile } from "../ui";
import { detectDrift, effectiveStatus, missedDays } from "../logic";
import { addDays, fmtDateShort, fmtTime, startOfDay, startOfWeek, HARI_PENDEK, parseYmd } from "../dates";
import { cn } from "@/lib/utils";

const ago = (iso: string, now: Date) => {
  const m = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "baru saja"; if (m < 60) return `${m} menit lalu`; if (m < 1440) return `${Math.round(m / 60)} jam lalu`; return `${Math.round(m / 1440)} hari lalu`;
};

export const Reminders = () => {
  const s = useStore();
  const { data, now, setView } = s;
  const [f, setF] = useState<"semua" | "pengingat" | "teguran">("semua");
  const list = data.reminders.filter((r) => f === "semua" || r.level === f);
  const ws = startOfWeek(now);
  const missedAgenda = data.schedules.filter((x) => effectiveStatus(x, now) === "terlewat" && new Date(x.start_at) >= ws);
  const missedHabits = data.habits.filter((h) => h.is_active).map((h) => ({ h, days: missedDays(data, h, now).filter((d) => parseYmd(d) >= ws) })).filter((x) => x.days.length);
  const drifts = detectDrift(data, now);
  return (
    <div>
      <PageHead eyebrow="Pengingat & teguran" title="Biar tetap di jalur" text={`Nada saat ini: ${data.prefs.reminder_tone === "tegas" ? "Tegas" : "Lembut"}. Teguran muncul jika rencana terlewat ${data.prefs.miss_threshold}× dalam 7 hari.`}
        action={<button className="btn btn-ghost" onClick={() => setView("pengaturan")}><Settings2 size={16} /> Atur waktu & nada</button>} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Segmented value={f} onChange={setF} options={[{ v: "semua", l: "Semua" }, { v: "pengingat", l: "Pengingat" }, { v: "teguran", l: "Teguran" }]} />
            <button className="link-pill inline-flex items-center gap-1" onClick={s.readAll}><CheckCheck size={13} /> Tandai semua dibaca</button>
          </div>
          {!data.prefs.reminder_enabled && <p className="mb-3 rounded-[14px] bg-butter-bg p-3 text-sm text-ink2">Pengingat otomatis sedang dimatikan. Nyalakan di Pengaturan.</p>}
          {list.length === 0 ? <p className="py-12 text-center text-sm text-mute">Belum ada apa-apa di sini. Semua aman 🌿</p> : (
            <ul className="space-y-2">
              {list.map((r) => (
                <li key={r.id}>
                  <button onClick={() => s.readReminder(r.id)} className={cn("flex w-full gap-3 rounded-[16px] border p-3 text-left transition", r.is_read ? "border-line" : r.level === "teguran" ? "border-transparent bg-[color-mix(in_srgb,var(--coral)_9%,var(--surface))]" : "border-transparent bg-brandsoft")}>
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", r.level === "teguran" ? "bg-coral text-white" : "bg-brand text-[var(--accent-ink)]")}>{r.level === "teguran" ? <TriangleAlert size={16} /> : <BellRing size={16} />}</span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-mute">{r.level} · {r.source_type} <span className="font-medium normal-case tracking-normal">· {ago(r.sent_at, now)}</span>{!r.is_read && <span className="h-1.5 w-1.5 rounded-full bg-coral" />}</span><span className="text-sm text-ink">{r.message}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="space-y-4">
          <Panel title="Rekap yang terlewat" sub={`Minggu ini, sejak ${fmtDateShort(ws)}`}>
            {missedAgenda.length + missedHabits.length === 0 ? <p className="text-sm text-mute">Tidak ada yang terlewat minggu ini. Pertahankan!</p> : (
              <div className="space-y-4">
                {missedHabits.length > 0 && <div><p className="eyebrow mb-2">Kebiasaan</p><ul className="space-y-2.5">
                  {missedHabits.map(({ h, days }) => (
                    <li key={h.id} className="flex items-center gap-3"><IconTile tint={h.color} size={34}>{h.icon}</IconTile><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink">{h.name}</p><p className="text-xs text-mute">{days.map((d) => HARI_PENDEK[parseYmd(d).getDay()]).reverse().join(", ")}</p></div><span className="text-sm font-extrabold text-coral">{days.length}×</span></li>
                  ))}</ul></div>}
                {missedAgenda.length > 0 && <div><p className="eyebrow mb-2">Agenda</p><ul className="space-y-2">
                  {missedAgenda.map((a) => (
                    <li key={a.id} className="flex items-center gap-3"><IconTile tint={a.color} size={34}>{a.icon}</IconTile><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink">{a.title}</p><p className="text-xs text-mute">{HARI_PENDEK[new Date(a.start_at).getDay()]} {fmtTime(a.start_at)}</p></div>
                      <button className="chip" onClick={() => { const t = new Date(a.start_at); const target = addDays(startOfDay(now), 1); target.setHours(t.getHours(), t.getMinutes()); s.shiftSchedule(a, Math.round((target.getTime() - t.getTime()) / 60000)); s.toast("Digeser ke besok."); }}>Jadwalkan ulang</button></li>
                  ))}</ul></div>}
              </div>
            )}
          </Panel>
          <Panel title="Sinyal aktif" sub="Yang sedang dipantau sistem">
            {drifts.length === 0 ? <p className="text-sm text-mute">Semua rencana berjalan. 👏</p> : <ul className="space-y-2">{drifts.map((d) => <li key={d.id} className="rounded-[14px] bg-surface2 p-3 text-sm text-ink2"><b className="text-ink">{d.title}</b><br />{d.detail}</li>)}</ul>}
          </Panel>
        </div>
      </div>
    </div>
  );
};
