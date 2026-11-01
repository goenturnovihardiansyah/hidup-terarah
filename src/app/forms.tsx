import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useStore } from "./store";
import { Modal, TINTS, tintBg, Segmented } from "./ui";
import type { FreqType, Goal, Habit, Schedule, Tint, TxType } from "./types";
import { addDays, pad, startOfDay, toLocalInput, ymd } from "./dates";
import { cn } from "@/lib/utils";

const TintPicker = ({ value, onChange }: { value: Tint; onChange: (t: Tint) => void }) => (
  <div className="flex gap-2">
    {TINTS.map((t) => (
      <button key={t} type="button" aria-label={`Warna ${t}`} onClick={() => onChange(t)} className={cn("h-8 w-8 rounded-full border-2 transition", tintBg[t], value === t ? "border-ink scale-110" : "border-transparent")} />
    ))}
  </div>
);
const EmojiPicker = ({ value, onChange, list }: { value: string; onChange: (e: string) => void; list: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {list.map((e) => (
      <button key={e} type="button" onClick={() => onChange(e)} className={cn("grid h-9 w-9 place-items-center rounded-[11px] border text-lg transition", value === e ? "border-ink bg-surface2" : "border-line hover:border-ink2")}>{e}</button>
    ))}
  </div>
);

export const ScheduleForm = ({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Schedule | null }) => {
  const { saveSchedule, focusDate, toast } = useStore();
  const defStart = () => { const d = new Date(); const f = focusDate === ymd(d) ? d : new Date(focusDate + "T09:00"); f.setMinutes(0, 0, 0); if (focusDate === ymd(d)) f.setHours(f.getHours() + 1); return f; };
  const [title, setTitle] = useState(""); const [notes, setNotes] = useState("");
  const [start, setStart] = useState(""); const [dur, setDur] = useState(60);
  const [icon, setIcon] = useState("📌"); const [color, setColor] = useState<Tint>("sky");
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title); setNotes(initial.notes); setStart(toLocalInput(initial.start_at));
      setDur(initial.end_at ? Math.round((new Date(initial.end_at).getTime() - new Date(initial.start_at).getTime()) / 60000) : 60);
      setIcon(initial.icon); setColor(initial.color);
    } else { setTitle(""); setNotes(""); setStart(toLocalInput(defStart().toISOString())); setDur(60); setIcon("📌"); setColor("sky"); }
  }, [open, initial]); // eslint-disable-line
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim() || !start) return;
    const s = new Date(start);
    saveSchedule({ id: initial?.id, title: title.trim(), notes, start_at: s.toISOString(), end_at: new Date(s.getTime() + dur * 60000).toISOString(), icon, color });
    toast(initial ? "Agenda diperbarui." : "Agenda ditambahkan."); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={initial ? "Ubah agenda" : "Tambah agenda"} desc="Tanggal, jam, dan catatan singkat.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="sf-t">Nama agenda</label><input id="sf-t" autoFocus className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Misal: Rapat tim, kajian, belajar" required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="sf-s">Mulai</label><input id="sf-s" type="datetime-local" className="field" value={start} onChange={(e) => setStart(e.target.value)} required /></div>
          <div><label className="label" htmlFor="sf-d">Durasi</label>
            <select id="sf-d" className="field" value={dur} onChange={(e) => setDur(Number(e.target.value))}>
              {[15, 30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m < 60 ? `${m} menit` : `${m / 60} jam`}</option>)}
            </select></div>
        </div>
        <div><label className="label" htmlFor="sf-n">Catatan</label><textarea id="sf-n" rows={2} className="field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional" /></div>
        <div><span className="label">Ikon & warna</span><EmojiPicker value={icon} onChange={setIcon} list={["📌", "💻", "📞", "🕌", "📚", "🏃", "🛒", "🎨", "🧾", "🍽️", "✈️", "🧠"]} /><div className="mt-3"><TintPicker value={color} onChange={setColor} /></div></div>
        <div className="flex justify-end gap-2 pt-1"><button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button><button className="btn btn-primary">Simpan agenda</button></div>
      </form>
    </Modal>
  );
};

export const HabitForm = ({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Habit | null }) => {
  const { saveHabit, toast } = useStore();
  const [name, setName] = useState(""); const [type, setType] = useState<FreqType>("harian");
  const [target, setTarget] = useState(1); const [time, setTime] = useState("07:00");
  const [icon, setIcon] = useState("✨"); const [color, setColor] = useState<Tint>("lilac");
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? ""); setType(initial?.frequency_type ?? "harian"); setTarget(initial?.frequency_target ?? 1);
    setTime(initial?.preferred_time ?? "07:00"); setIcon(initial?.icon ?? "✨"); setColor(initial?.color ?? "lilac");
  }, [open, initial]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return;
    saveHabit({ id: initial?.id, name: name.trim(), frequency_type: type, frequency_target: type === "harian" ? 1 : target, preferred_time: time, icon, color });
    toast(initial ? "Kebiasaan diperbarui." : "Kebiasaan baru ditambahkan. Mulai kecil saja!"); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={initial ? "Ubah kebiasaan" : "Kebiasaan baru"} desc="Kecil tapi rutin lebih baik daripada besar tapi jarang.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="hf-n">Nama kebiasaan</label><input id="hf-n" autoFocus className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Misal: Baca 10 halaman" required /></div>
        <div><span className="label">Seberapa sering?</span>
          <Segmented value={type} onChange={setType} options={[{ v: "harian", l: "Tiap hari" }, { v: "mingguan", l: "Per minggu" }, { v: "bulanan", l: "Per bulan" }]} />
          {type !== "harian" && (
            <div className="mt-3 flex items-center gap-3 text-sm text-ink2">
              <input type="number" min={1} max={type === "mingguan" ? 7 : 31} className="field w-20" value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))} aria-label="Target" />
              kali {type === "mingguan" ? "seminggu" : "sebulan"}
            </div>
          )}
        </div>
        <div><label className="label" htmlFor="hf-t">Jam biasa dilakukan (untuk pengingat)</label><input id="hf-t" type="time" className="field w-40" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        <div><span className="label">Ikon & warna</span><EmojiPicker value={icon} onChange={setIcon} list={["✨", "🌙", "📖", "💧", "📿", "🏃", "💻", "🧘", "🥗", "😴", "✍️", "🤲"]} /><div className="mt-3"><TintPicker value={color} onChange={setColor} /></div></div>
        <div className="flex justify-end gap-2 pt-1"><button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button><button className="btn btn-primary">Simpan</button></div>
      </form>
    </Modal>
  );
};

export const parseRupiah = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;
export const TxForm = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { data, addTransaction } = useStore();
  const [type, setType] = useState<TxType>("pengeluaran");
  const [amount, setAmount] = useState(""); const [cat, setCat] = useState(""); const [note, setNote] = useState("");
  const [date, setDate] = useState(ymd(new Date()));
  const cats = data.categories.filter((c) => c.type === type);
  useEffect(() => { if (open) { setAmount(""); setNote(""); setDate(ymd(new Date())); } }, [open]);
  useEffect(() => { setCat(cats[0]?.id ?? ""); }, [type, open]); // eslint-disable-line
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); const n = parseRupiah(amount); if (!n || !cat) return;
    const d = new Date(); const occ = date === ymd(d) ? d : new Date(date + "T12:00");
    addTransaction({ type, amount: n, category_id: cat, note: note.trim() || data.categories.find((c) => c.id === cat)!.name, occurred_at: occ.toISOString() });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Catat uang" desc="Selesai dalam beberapa detik.">
      <form onSubmit={submit} className="space-y-4">
        <Segmented value={type} onChange={setType} options={[{ v: "pengeluaran", l: "Pengeluaran" }, { v: "pemasukan", l: "Pemasukan" }]} />
        <div>
          <label className="label" htmlFor="tx-a">Jumlah</label>
          <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl text-mute">Rp</span>
            <input id="tx-a" autoFocus inputMode="numeric" className="field pl-12 font-display text-2xl" value={amount} placeholder="0" onChange={(e) => { const n = parseRupiah(e.target.value); setAmount(n ? n.toLocaleString("id-ID") : ""); }} required /></div>
          <div className="mt-2 flex flex-wrap gap-1.5">{[10000, 25000, 50000, 100000].map((v) => <button type="button" key={v} className="chip" onClick={() => setAmount((parseRupiah(amount) + v).toLocaleString("id-ID"))}>+{v / 1000}rb</button>)}</div>
        </div>
        <div><span className="label">Kategori</span>
          <div className="flex flex-wrap gap-1.5">{cats.map((c) => <button type="button" key={c.id} className="chip" data-on={cat === c.id} onClick={() => setCat(c.id)}><span>{c.icon}</span>{c.name}</button>)}</div></div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div><label className="label" htmlFor="tx-n">Keterangan</label><input id="tx-n" className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></div>
          <div><label className="label" htmlFor="tx-d">Tanggal</label><input id="tx-d" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-1"><button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button><button className="btn btn-primary">Simpan</button></div>
      </form>
    </Modal>
  );
};

export const GoalForm = ({ open, onClose, initial, first }: { open: boolean; onClose: () => void; initial?: Goal | null; first?: boolean }) => {
  const { saveGoal, toast } = useStore();
  const [title, setTitle] = useState(""); const [reason, setReason] = useState("");
  const [date, setDate] = useState(""); const [color, setColor] = useState<Tint>("lilac");
  const [steps, setSteps] = useState<string[]>(["", ""]);
  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? ""); setReason(initial?.reason ?? ""); setColor(initial?.color ?? "lilac");
    setDate(initial?.target_date ?? ymd(addDays(startOfDay(new Date()), 30))); setSteps(["", ""]);
  }, [open, initial]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim()) return;
    saveGoal({ id: initial?.id, title: title.trim(), reason: reason.trim(), target_date: date, color }, initial ? undefined : steps.map((s) => s.trim()));
    toast(initial ? "Tujuan diperbarui." : "Tujuan dibuat. Langkah pertama sudah diambil!"); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} wide={!initial} title={initial ? "Ubah tujuan" : first ? "Buat tujuan pertamamu" : "Tujuan baru"} desc={initial ? undefined : "Tulis tujuannya, alasannya, dan kapan ingin tercapai."}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <div><label className="label" htmlFor="gf-t">Tujuan</label><input id="gf-t" autoFocus className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Misal: Lancar bahasa Inggris" required /></div>
          <div><label className="label" htmlFor="gf-r">Kenapa ini penting?</label><textarea id="gf-r" rows={3} className="field resize-none" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan ini yang akan menguatkanmu saat malas datang" /></div>
          <div className="grid grid-cols-[auto_1fr] items-end gap-3">
            <div><label className="label" htmlFor="gf-d">Tenggat</label><input id="gf-d" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
            <div><span className="label">Warna</span><TintPicker value={color} onChange={setColor} /></div>
          </div>
        </div>
        {!initial && (
          <div className="rounded-[18px] bg-surface2 p-4">
            <span className="label">Pecah jadi langkah kecil</span>
            <p className="mb-3 text-xs text-mute">Langkah yang bisa dicentang membuat progres terasa nyata.</p>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-[11px] font-bold text-mute">{i + 1}</span>
                  <input className="field py-2" value={s} placeholder={`Langkah ${i + 1}`} aria-label={`Langkah ${i + 1}`} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? e.target.value : x)))} />
                  {steps.length > 1 && <button type="button" aria-label="Hapus langkah" className="text-mute hover:text-coral" onClick={() => setSteps(steps.filter((_, j) => j !== i))}><X size={16} /></button>}
                </div>
              ))}
            </div>
            <button type="button" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand" onClick={() => setSteps([...steps, ""])}><Plus size={14} /> Tambah langkah</button>
          </div>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn btn-ghost" onClick={onClose}>{first ? "Nanti saja" : "Batal"}</button><button className="btn btn-primary">Simpan tujuan</button></div>
      </form>
    </Modal>
  );
};

export const QuickForms = () => {
  const { quick, setQuick } = useStore();
  const close = () => setQuick(null);
  return (<>
    <ScheduleForm open={quick === "agenda"} onClose={close} />
    <HabitForm open={quick === "kebiasaan"} onClose={close} />
    <TxForm open={quick === "transaksi"} onClose={close} />
    <GoalForm open={quick === "tujuan"} onClose={close} />
  </>);
};
export { pad };
