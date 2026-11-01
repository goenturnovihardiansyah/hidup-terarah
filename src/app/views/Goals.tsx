import { useState } from "react";
import { Plus, Pencil, Archive, Trophy, Trash2, X, Undo2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useStore } from "../store";
import { PageHead, Bar, Tick, Segmented, Empty, tintBg, ConfirmButton } from "../ui";
import { GoalForm } from "../forms";
import { goalProgress } from "../logic";
import { daysBetween, fmtDateShort, parseYmd, startOfDay } from "../dates";
import type { Goal } from "../types";
import { cn } from "@/lib/utils";

export const Goals = () => {
  const { data, setQuick } = useStore();
  const [tab, setTab] = useState<"aktif" | "selesai" | "arsip">("aktif");
  const [edit, setEdit] = useState<Goal | null>(null);
  const list = data.goals.filter((g) => g.status === tab);
  const first = data.goals.length === 0;
  return (
    <div>
      <PageHead eyebrow="Atur tujuan" title="Tujuanmu" text="Tujuan besar terasa ringan kalau dipecah jadi langkah kecil yang bisa dicentang." action={<button className="btn btn-primary" onClick={() => setQuick("tujuan")}><Plus size={16} /> Tujuan baru</button>} />
      <div className="mb-4"><Segmented value={tab} onChange={setTab} options={[{ v: "aktif", l: `Aktif (${data.goals.filter((g) => g.status === "aktif").length})` }, { v: "selesai", l: "Tercapai" }, { v: "arsip", l: "Arsip" }]} /></div>
      {list.length === 0 ? (
        <Empty icon={tab === "aktif" ? "🎯" : tab === "selesai" ? "🏆" : "🗂️"} title={first ? "Belum ada tujuan" : tab === "aktif" ? "Tidak ada tujuan aktif" : "Masih kosong"}
          text={first ? "Mulai dengan satu tujuan saja. Tulis alasannya supaya kuat saat semangat turun." : tab === "selesai" ? "Tujuan yang kamu tandai selesai akan tersimpan di sini." : "Tujuan yang diarsipkan akan muncul di sini."}
          action={tab === "aktif" && <button className="btn btn-primary" onClick={() => setQuick("tujuan")}>Buat tujuan pertama</button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{list.map((g) => <GoalCard key={g.id} g={g} onEdit={() => setEdit(g)} />)}</div>
      )}
      <GoalForm open={!!edit} initial={edit} onClose={() => setEdit(null)} />
    </div>
  );
};

const GoalCard = ({ g, onEdit }: { g: Goal; onEdit: () => void }) => {
  const s = useStore();
  const { data } = s;
  const steps = data.steps.filter((x) => x.goal_id === g.id).sort((a, b) => a.order_index - b.order_index);
  const p = goalProgress(data, g);
  const left = daysBetween(startOfDay(new Date()), parseYmd(g.target_date));
  const [newStep, setNewStep] = useState("");
  const add = (e: React.FormEvent) => { e.preventDefault(); if (newStep.trim()) { s.addStep(g.id, newStep.trim()); setNewStep(""); } };
  return (
    <article className="card overflow-hidden">
      <div className={cn("p-5", tintBg[g.color])}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink2">{g.status === "selesai" ? `Tercapai ${g.completed_at ? fmtDateShort(new Date(g.completed_at)) : ""}` : left >= 0 ? `${left} hari lagi · ${fmtDateShort(parseYmd(g.target_date))}` : `Lewat tenggat ${-left} hari`}</p>
            <h3 className="mt-1 font-display text-[22px] font-semibold leading-tight text-ink">{g.title}</h3>
          </div>
          <div className="relative grid h-16 w-16 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface)" strokeWidth="4" /><circle cx="18" cy="18" r="15.5" fill="none" stroke={`var(--${g.color})`} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(p / 100) * 97.4} 97.4`} /></svg>
            <span className="text-sm font-extrabold text-ink">{p}%</span>
          </div>
        </div>
        {g.reason && <p className="mt-2 text-sm italic text-ink2">“{g.reason}”</p>}
      </div>
      <div className="p-5">
        {steps.length > 0 ? (
          <>
            <p className="eyebrow mb-2">Langkah kecil · {steps.filter((x) => x.is_done).length}/{steps.length}</p>
            <ul className="space-y-1">
              {steps.map((st) => (
                <li key={st.id} className="group flex items-center gap-3 rounded-[12px] px-1 py-1.5 hover:bg-surface2">
                  <Tick on={st.is_done} onClick={() => s.toggleStep(st.id)} label={`Centang ${st.title}`} />
                  <span className={cn("flex-1 text-sm", st.is_done ? "text-mute line-through" : "font-semibold text-ink")}>{st.title}</span>
                  <button aria-label="Hapus langkah" onClick={() => s.deleteStep(st.id)} className="text-mute opacity-0 transition hover:text-coral group-hover:opacity-100"><X size={15} /></button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="mb-2">
            <p className="eyebrow mb-2">Update progres manual</p>
            <div className="flex items-center gap-3"><Slider value={[g.progress]} max={100} step={5} onValueChange={([v]) => s.saveGoal({ id: g.id, title: g.title, progress: v })} className="flex-1" aria-label="Progres" /><span className="w-10 text-right text-sm font-bold">{g.progress}%</span></div>
            <div className="mt-2"><Bar value={g.progress} tint={g.color} h={6} /></div>
          </div>
        )}
        {g.status === "aktif" && (
          <form onSubmit={add} className="mt-3 flex gap-2"><input className="field py-2 text-sm" placeholder="Tambah langkah kecil…" value={newStep} onChange={(e) => setNewStep(e.target.value)} aria-label="Langkah baru" /><button className="btn btn-ghost px-3" aria-label="Tambah"><Plus size={16} /></button></form>
        )}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          {g.status === "aktif" ? (<>
            <button className="btn btn-ghost py-2 text-xs" onClick={() => { s.setGoalStatus(g.id, "selesai"); s.toast(`Selamat! "${g.title}" tercapai 🎉`); }}><Trophy size={14} /> Tandai tercapai</button>
            <button className="btn btn-ghost py-2 text-xs" onClick={onEdit}><Pencil size={14} /> Ubah</button>
            <button className="btn btn-ghost py-2 text-xs" onClick={() => s.setGoalStatus(g.id, "arsip")}><Archive size={14} /> Arsipkan</button>
          </>) : (<>
            <button className="btn btn-ghost py-2 text-xs" onClick={() => s.setGoalStatus(g.id, "aktif")}><Undo2 size={14} /> Aktifkan lagi</button>
            <ConfirmButton className="btn btn-ghost py-2 text-xs text-coral" confirmText="Yakin hapus?" onConfirm={() => s.deleteGoal(g.id)}><Trash2 size={14} /> Hapus</ConfirmButton>
          </>)}
        </div>
      </div>
    </article>
  );
};
