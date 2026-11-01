import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Clock, CalendarClock } from "lucide-react";
import { useStore } from "../store";
import { PageHead, Panel, Tick, IconTile, Segmented, ConfirmButton, tintBg } from "../ui";
import { MonthCalendar } from "../calendar";
import { ScheduleForm } from "../forms";
import { schedulesOn, effectiveStatus } from "../logic";
import { addDays, fmtDateLong, fmtTime, startOfWeek, ymd, HARI_PENDEK, parseYmd, BULAN_PENDEK } from "../dates";
import type { Schedule as S } from "../types";
import { cn } from "@/lib/utils";

const statusChip = (st: string) => st === "selesai" ? ["Selesai", "bg-mint-bg text-mint"] : st === "terlewat" ? ["Terlewat", "bg-[color-mix(in_srgb,var(--coral)_12%,transparent)] text-coral"] : ["Terjadwal", "bg-sky-bg text-sky"];

export const Schedule = () => {
  const { data, focusDate, setFocusDate, setQuick, now } = useStore();
  const [mode, setMode] = useState<"hari" | "minggu">("hari");
  const [edit, setEdit] = useState<S | null>(null);
  const d = parseYmd(focusDate);
  const marks = useMemo(() => { const m: Record<string, number> = {}; data.schedules.forEach((x) => { const k = ymd(new Date(x.start_at)); m[k] = (m[k] || 0) + 1; }); return m; }, [data.schedules]);
  const step = (n: number) => setFocusDate(ymd(addDays(d, mode === "hari" ? n : n * 7)));
  const ws = startOfWeek(d);
  const list = schedulesOn(data, focusDate);
  return (
    <div>
      <PageHead eyebrow="Jadwal harian" title="Jadwalmu" text="Susun waktu supaya hari tidak habis tanpa arah. Rencana berubah? Geser saja." action={<button className="btn btn-primary" onClick={() => setQuick("agenda")}><Plus size={16} /> Tambah agenda</button>} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button aria-label="Sebelumnya" onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:text-brand"><ChevronLeft size={17} /></button>
              <button aria-label="Berikutnya" onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:text-brand"><ChevronRight size={17} /></button>
              <p className="ml-1 font-display text-xl font-semibold text-ink">{mode === "hari" ? fmtDateLong(d) : `${ws.getDate()} ${BULAN_PENDEK[ws.getMonth()]} – ${addDays(ws, 6).getDate()} ${BULAN_PENDEK[addDays(ws, 6).getMonth()]}`}</p>
            </div>
            <div className="flex items-center gap-2">
              {focusDate !== ymd(now) && <button className="link-pill" onClick={() => setFocusDate(ymd(now))}>Hari ini</button>}
              <Segmented value={mode} onChange={setMode} options={[{ v: "hari", l: "Hari" }, { v: "minggu", l: "Minggu" }]} />
            </div>
          </div>
          {mode === "hari" ? (
            list.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-line py-12 text-center"><p className="text-3xl">🗓️</p><p className="mt-2 font-bold">Belum ada agenda</p><p className="text-sm text-mute">Hari yang lapang. Mau isi sesuatu?</p><button className="btn btn-primary mt-4" onClick={() => setQuick("agenda")}>Tambah agenda</button></div>
            ) : (
              <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[54px] before:top-2 before:w-px before:bg-line">
                {list.map((a) => <Item key={a.id} a={a} onEdit={() => setEdit(a)} />)}
              </ol>
            )
          ) : (
            <div className="grid gap-2 md:grid-cols-7">
              {Array.from({ length: 7 }, (_, i) => addDays(ws, i)).map((day) => {
                const k = ymd(day); const items = schedulesOn(data, k); const isT = k === ymd(now);
                return (
                  <div key={k} className={cn("min-h-[120px] rounded-[16px] border p-2", isT ? "border-brand bg-brandsoft" : "border-line bg-surface2")}>
                    <button onClick={() => { setFocusDate(k); setMode("hari"); }} className="mb-2 flex w-full items-baseline gap-1.5 text-left"><span className="text-[11px] font-bold uppercase text-mute">{HARI_PENDEK[day.getDay()]}</span><span className="font-display text-lg font-semibold text-ink">{day.getDate()}</span></button>
                    <div className="space-y-1.5">
                      {items.map((a) => { const st = effectiveStatus(a, now); return (
                        <button key={a.id} onClick={() => setEdit(a)} className={cn("block w-full rounded-[10px] px-2 py-1.5 text-left", tintBg[a.color], st === "selesai" && "opacity-60")}>
                          <span className="block text-[10px] font-bold text-ink2">{fmtTime(a.start_at)}</span>
                          <span className={cn("block truncate text-[12px] font-bold text-ink", st === "selesai" && "line-through")}>{a.icon} {a.title}</span>
                          {st === "terlewat" && <span className="text-[10px] font-bold text-coral">terlewat</span>}
                        </button>); })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <Panel><MonthCalendar key={focusDate.slice(0, 7)} selected={focusDate} marks={marks} onSelect={setFocusDate} /></Panel>
          <Panel title="Ringkasan hari ini">
            {(() => { const l = schedulesOn(data, ymd(now)); const c = (st: string) => l.filter((x) => effectiveStatus(x, now) === st).length; return (
              <div className="grid grid-cols-3 gap-2 text-center">
                {[["Selesai", c("selesai"), "text-mint"], ["Menunggu", c("terjadwal"), "text-sky"], ["Terlewat", c("terlewat"), "text-coral"]].map(([l, n, cl]) => (
                  <div key={l as string} className="rounded-[14px] bg-surface2 py-3"><p className={cn("font-display text-2xl font-semibold", cl as string)}>{n}</p><p className="text-[11px] font-semibold text-mute">{l}</p></div>
                ))}
              </div>); })()}
          </Panel>
        </div>
      </div>
      <ScheduleForm open={!!edit} initial={edit} onClose={() => setEdit(null)} />
    </div>
  );
};

const Item = ({ a, onEdit }: { a: S; onEdit: () => void }) => {
  const s = useStore();
  const st = effectiveStatus(a, s.now);
  const [label, cls] = statusChip(st);
  return (
    <li className="relative flex gap-3">
      <div className="w-[44px] shrink-0 pt-3 text-right text-xs font-bold text-ink2">{fmtTime(a.start_at)}</div>
      <span className={cn("relative z-10 mt-4 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-[var(--surface)]", st === "selesai" ? "bg-mint" : st === "terlewat" ? "bg-coral" : "bg-sky")} />
      <div className={cn("min-w-0 flex-1 rounded-[18px] border border-line p-3 transition", st === "selesai" && "opacity-70")}>
        <div className="flex items-start gap-3">
          <Tick on={st === "selesai"} onClick={() => s.toggleSchedule(a)} label={`Tandai ${a.title} selesai`} />
          <IconTile tint={a.color} size={36}>{a.icon}</IconTile>
          <div className="min-w-0 flex-1">
            <p className={cn("font-bold text-ink", st === "selesai" && "line-through")}>{a.title}</p>
            <p className="text-xs text-mute">{fmtTime(a.start_at)}{a.end_at && `–${fmtTime(a.end_at)}`}{a.notes && ` · ${a.notes}`}</p>
          </div>
          <span className={cn("hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline", cls)}>{label}</span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[34px]">
          {st !== "selesai" && <>
            <button className="chip" onClick={() => s.shiftSchedule(a, 60)}><Clock size={12} /> +1 jam</button>
            <button className="chip" onClick={() => s.shiftSchedule(a, 24 * 60)}><CalendarClock size={12} /> Geser ke besok</button>
          </>}
          <button className="chip" onClick={onEdit}><Pencil size={12} /> Ubah</button>
          <ConfirmButton className="chip" onConfirm={() => s.deleteSchedule(a.id)} confirmText="Hapus?"><Trash2 size={12} /> Hapus</ConfirmButton>
        </div>
      </div>
    </li>
  );
};
