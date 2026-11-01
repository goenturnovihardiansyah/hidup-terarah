import { useMemo, useState } from "react";
import { Plus, ArrowDownRight, ArrowUpRight, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../store";
import { PageHead, Panel, Bar, ConfirmButton, tintBg, tintVar } from "../ui";
import { balance, spendingOn } from "../logic";
import { BULAN, fmtDateShort, rupiah, rupiahShort, ymd, HARI_PENDEK } from "../dates";
import { cn } from "@/lib/utils";

export const Finance = () => {
  const s = useStore();
  const { data, now, setQuick } = s;
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [cat, setCat] = useState<string>("semua");
  const a = ymd(month), b = ymd(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const inMonth = data.transactions.filter((t) => { const k = ymd(new Date(t.occurred_at)); return k >= a && k <= b; });
  const income = inMonth.filter((t) => t.type === "pemasukan").reduce((x, t) => x + t.amount, 0);
  const expense = inMonth.filter((t) => t.type === "pengeluaran").reduce((x, t) => x + t.amount, 0);
  const budgetPct = data.prefs.monthly_budget ? Math.round((expense / data.prefs.monthly_budget) * 100) : 0;
  const today = spendingOn(data, ymd(now));
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    inMonth.filter((t) => t.type === "pengeluaran").forEach((t) => m.set(t.category_id, (m.get(t.category_id) || 0) + t.amount));
    return [...m.entries()].map(([id, v]) => ({ c: data.categories.find((c) => c.id === id)!, v })).filter((x) => x.c).sort((x, y) => y.v - x.v);
  }, [inMonth, data.categories]);
  const list = inMonth.filter((t) => cat === "semua" || t.category_id === cat).sort((x, y) => y.occurred_at.localeCompare(x.occurred_at));
  const groups = list.reduce<Record<string, typeof list>>((g, t) => { const k = ymd(new Date(t.occurred_at)); (g[k] ||= []).push(t); return g; }, {});
  const isCur = month.getMonth() === now.getMonth() && month.getFullYear() === now.getFullYear();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const elapsed = isCur ? now.getDate() : daysInMonth;
  const pace = expense / Math.max(1, elapsed) * daysInMonth;

  return (
    <div>
      <PageHead eyebrow="Catat keuangan" title="Uangmu" text="Catat sekilas, lihat jelas. Supaya tidak kaget di akhir bulan." action={<button className="btn btn-primary" onClick={() => setQuick("transaksi")}><Plus size={16} /> Catat uang</button>} />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] bg-ink p-5 text-[var(--surface)] md:col-span-1" style={{ boxShadow: "var(--shadow)" }}>
          <p className="text-xs font-semibold opacity-70">Saldo total</p>
          <p className="mt-1 font-display text-[34px] font-semibold leading-tight">{rupiah(balance(data))}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><p className="flex items-center gap-1 text-xs opacity-70"><ArrowDownRight size={13} /> Masuk</p><p className="font-bold">{rupiahShort(income)}</p></div>
            <div><p className="flex items-center gap-1 text-xs opacity-70"><ArrowUpRight size={13} /> Keluar</p><p className="font-bold">{rupiahShort(expense)}</p></div>
          </div>
        </div>
        <Panel title="Batas belanja bulan ini" sub={`${rupiah(expense)} dari ${rupiah(data.prefs.monthly_budget)}`}>
          <Bar value={budgetPct} tint={budgetPct > 100 ? "rose" : budgetPct > 80 ? "peach" : "mint"} h={12} />
          <p className="mt-3 text-sm text-ink2">{budgetPct > 100 ? "Sudah melewati batas. Tahan dulu yang tidak penting." : isCur ? `Dengan laju sekarang, akhir bulan diperkirakan ${rupiahShort(pace)}.` : `${budgetPct}% dari batas terpakai.`}</p>
        </Panel>
        <Panel title="Hari ini" sub={`Batas harian ${rupiah(data.prefs.daily_budget)}`}>
          <p className={cn("font-display text-[30px] font-semibold", today > data.prefs.daily_budget ? "text-coral" : "text-ink")}>{rupiah(today)}</p>
          <p className="text-sm text-ink2">{today > data.prefs.daily_budget ? `Lewat ${rupiahShort(today - data.prefs.daily_budget)} dari batas.` : `Masih aman, sisa ${rupiahShort(data.prefs.daily_budget - today)}.`}</p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card min-w-0 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button aria-label="Bulan sebelumnya" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-8 w-8 place-items-center rounded-full border border-line"><ChevronLeft size={16} /></button>
              <p className="min-w-[130px] text-center font-extrabold text-ink">{BULAN[month.getMonth()]} {month.getFullYear()}</p>
              <button aria-label="Bulan berikutnya" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-8 w-8 place-items-center rounded-full border border-line"><ChevronRight size={16} /></button>
            </div>
            <p className="text-sm font-extrabold text-ink">Riwayat transaksi</p>
          </div>
          <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
            <button className="chip shrink-0" data-on={cat === "semua"} onClick={() => setCat("semua")}>Semua</button>
            {data.categories.map((c) => <button key={c.id} className="chip shrink-0" data-on={cat === c.id} onClick={() => setCat(c.id)}>{c.icon} {c.name}</button>)}
          </div>
          {list.length === 0 ? <p className="py-10 text-center text-sm text-mute">Belum ada catatan di sini.</p> : (
            <div className="space-y-4">
              {Object.entries(groups).map(([k, items]) => { const d = new Date(k + "T00:00"); return (
                <div key={k}>
                  <p className="mb-1 flex justify-between text-[11px] font-bold uppercase tracking-wide text-mute"><span>{HARI_PENDEK[d.getDay()]}, {fmtDateShort(d)}</span><span>-{rupiahShort(items.filter((t) => t.type === "pengeluaran").reduce((x, t) => x + t.amount, 0))}</span></p>
                  <ul className="divide-y divide-line">
                    {items.map((t) => { const c = data.categories.find((x) => x.id === t.category_id); return (
                      <li key={t.id} className="group flex items-center gap-3 py-2">
                        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-[12px]", tintBg[c?.color ?? "sky"])}>{c?.icon}</span>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink">{t.note}</p><p className="text-xs text-mute">{c?.name}</p></div>
                        <span className={cn("text-sm font-extrabold", t.type === "pemasukan" ? "text-mint" : "text-ink")}>{t.type === "pemasukan" ? "+" : "-"}{rupiah(t.amount)}</span>
                        <ConfirmButton label="Hapus transaksi" className="text-mute opacity-0 transition hover:text-coral group-hover:opacity-100 focus:opacity-100 rounded-full" onConfirm={() => s.deleteTransaction(t.id)} confirmText="Hapus"><Trash2 size={15} /></ConfirmButton>
                      </li>); })}
                  </ul>
                </div>); })}
            </div>
          )}
        </section>
        <Panel title="Ke mana uangmu pergi" sub="Pengeluaran per kategori">
          {byCat.length === 0 ? <p className="text-sm text-mute">Belum ada pengeluaran.</p> : (<>
            <div className="mb-4 flex h-3 overflow-hidden rounded-full">{byCat.map(({ c, v }) => <div key={c.id} style={{ width: `${(v / expense) * 100}%`, background: tintVar(c.color) }} title={c.name} />)}</div>
            <ul className="space-y-3">
              {byCat.map(({ c, v }) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="text-lg">{c.icon}</span>
                  <div className="min-w-0 flex-1"><div className="flex justify-between text-sm"><span className="font-bold text-ink">{c.name}</span><span className="font-semibold text-ink2">{rupiahShort(v)}</span></div><Bar value={(v / byCat[0].v) * 100} tint={c.color} h={6} /></div>
                  <span className="w-10 text-right text-xs font-bold text-mute">{Math.round((v / expense) * 100)}%</span>
                </li>
              ))}
            </ul>
          </>)}
        </Panel>
      </div>
    </div>
  );
};
