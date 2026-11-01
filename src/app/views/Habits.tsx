import { useState } from "react";
import { Plus, Pencil, Trash2, Flame, Pause, Play } from "lucide-react";
import { useStore } from "../store";
import { PageHead, Empty, IconTile, tintVar, ConfirmButton } from "../ui";
import { HabitForm } from "../forms";
import { isDone, streak, missedDays, periodCount } from "../logic";
import { addDays, startOfDay, ymd, HARI_PENDEK, fmtDateShort } from "../dates";
import type { Habit } from "../types";
import { cn } from "@/lib/utils";

export const Habits = () => {
  const { data, setQuick } = useStore();
  const [edit, setEdit] = useState<Habit | null>(null);
  const active = data.habits.filter((h) => h.is_active), paused = data.habits.filter((h) => !h.is_active);
  return (
    <div>
      <PageHead eyebrow="Tracker kebiasaan" title="Kebiasaanmu" text="Konsisten lebih penting dari sempurna. Bolong sehari bukan berarti gagal." action={<button className="btn btn-primary" onClick={() => setQuick("kebiasaan")}><Plus size={16} /> Kebiasaan baru</button>} />
      {data.habits.length === 0 ? (
        <Empty icon="🌱" title="Belum ada kebiasaan" text="Pilih satu kebiasaan kecil yang mendukung tujuanmu, misal baca 10 menit tiap hari." action={<button className="btn btn-primary" onClick={() => setQuick("kebiasaan")}>Tambah kebiasaan</button>} />
      ) : (
        <div className="space-y-3">
          {active.map((h) => <HabitRow key={h.id} h={h} onEdit={() => setEdit(h)} />)}
          {paused.length > 0 && <><p className="eyebrow pt-4">Dijeda</p>{paused.map((h) => <HabitRow key={h.id} h={h} onEdit={() => setEdit(h)} />)}</>}
        </div>
      )}
      <HabitForm open={!!edit} initial={edit} onClose={() => setEdit(null)} />
    </div>
  );
};

const HabitRow = ({ h, onEdit }: { h: Habit; onEdit: () => void }) => {
  const s = useStore();
  const { data, now } = s;
  const t0 = startOfDay(now);
  const days = Array.from({ length: 28 }, (_, i) => addDays(t0, i - 27));
  const st = streak(data, h, now);
  const missed = missedDays(data, h, now).length;
  const today = ymd(now);
  const onToday = isDone(data, h.id, today);
  const doneCount = days.filter((d) => isDone(data, h.id, ymd(d))).length;
  const freqLabel = h.frequency_type === "harian" ? "Tiap hari" : `${h.frequency_target}× ${h.frequency_type === "mingguan" ? "seminggu" : "sebulan"}`;
  return (
    <article className={cn("card p-4 sm:p-5", !h.is_active && "opacity-60")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:max-w-[300px]">
          <IconTile tint={h.color} size={46}>{h.icon}</IconTile>
          <div className="min-w-0">
            <p className="truncate font-extrabold text-ink">{h.name}</p>
            <p className="text-xs text-mute">{freqLabel} · jam {h.preferred_time.replace(":", ".")}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-butter-bg px-2 py-0.5 text-[11px] font-bold text-butter"><Flame size={12} />{st.n} {st.unit}</span>
              {h.frequency_type !== "harian" && <span className="rounded-full bg-surface2 px-2 py-0.5 text-[11px] font-bold text-ink2">{periodCount(data, h, now)}/{h.frequency_target} {h.frequency_type === "mingguan" ? "pekan ini" : "bulan ini"}</span>}
              {missed >= data.prefs.miss_threshold && <span className="rounded-full bg-[color-mix(in_srgb,var(--coral)_12%,transparent)] px-2 py-0.5 text-[11px] font-bold text-coral">{missed}× bolong minggu ini</span>}
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-mute"><span>4 minggu terakhir · klik kotak untuk koreksi</span><span>{doneCount}/28</span></div>
          <div className="mt-1.5 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(28,minmax(0,1fr))]">
            {days.map((d) => { const k = ymd(d); const on = isDone(data, h.id, k); return (
              <button key={k} title={`${HARI_PENDEK[d.getDay()]} ${fmtDateShort(d)}${on ? " · selesai" : ""}`} aria-label={`${fmtDateShort(d)} ${on ? "selesai" : "belum"}`} onClick={() => s.toggleHabit(h, k)}
                className={cn("aspect-square rounded-[5px] transition hover:scale-110", k === today && "ring-2 ring-ink ring-offset-1 ring-offset-[var(--surface)]")}
                style={{ background: on ? tintVar(h.color) : "var(--surface-2)", border: on ? "none" : "1px solid var(--line)" }} />); })}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => s.toggleHabit(h)} className={cn("btn min-w-[118px]", onToday ? "btn-ghost" : "btn-primary")}>{onToday ? "✓ Selesai" : "Centang hari ini"}</button>
          <button aria-label="Ubah" onClick={onEdit} className="grid h-10 w-10 place-items-center rounded-[12px] border border-line text-ink2 hover:text-brand"><Pencil size={15} /></button>
          <button aria-label={h.is_active ? "Jeda" : "Aktifkan"} onClick={() => s.saveHabit({ ...h, is_active: !h.is_active })} className="grid h-10 w-10 place-items-center rounded-[12px] border border-line text-ink2 hover:text-brand">{h.is_active ? <Pause size={15} /> : <Play size={15} />}</button>
          <ConfirmButton label="Hapus" confirmText="Hapus?" onConfirm={() => s.deleteHabit(h.id)} className="grid h-10 w-10 place-items-center rounded-[12px] border border-line text-ink2 hover:text-coral"><Trash2 size={15} /></ConfirmButton>
        </div>
      </div>
    </article>
  );
};
