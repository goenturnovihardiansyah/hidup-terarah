import { useMemo, useState, type ReactNode } from "react";
import { House, Target, Repeat, CalendarDays, Wallet, BellRing, ChartColumn, Settings, Search, Bell, Plus, Ellipsis, X, NotebookPen, Cloud, CloudCheck, RefreshCw, Activity, FolderKanban } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStore, type View } from "./store";
import { Logo } from "./ui";
import { ArchArt } from "./art";
import { cn } from "@/lib/utils";
import { fmtDateShort, rupiah } from "./dates";
import { getDailyReflectionQuote } from "./quotes";

export const NAV: { v: View; l: string; icon: typeof House; tint: string }[] = [
  { v: "beranda", l: "Beranda", icon: House, tint: "var(--lilac)" },
  { v: "tujuan", l: "Tujuan", icon: Target, tint: "var(--rose)" },
  { v: "proyek", l: "Proyek", icon: FolderKanban, tint: "var(--sky)" },
  { v: "kebiasaan", l: "Kebiasaan", icon: Repeat, tint: "var(--mint)" },
  { v: "jadwal", l: "Jadwal", icon: CalendarDays, tint: "var(--peach)" },
  { v: "keuangan", l: "Keuangan", icon: Wallet, tint: "var(--butter)" },
  { v: "kebugaran", l: "Kebugaran", icon: Activity, tint: "var(--emerald)" },
  { v: "jurnal", l: "Jurnal", icon: NotebookPen, tint: "var(--violet)" },
  { v: "pengingat", l: "Pengingat", icon: BellRing, tint: "var(--coral)" },
  { v: "evaluasi", l: "Evaluasi", icon: ChartColumn, tint: "var(--sky)" },
  { v: "pengaturan", l: "Pengaturan", icon: Settings, tint: "var(--muted)" },
];

const Sidebar = () => {
  const { view, setView, data, now } = useStore();
  const unread = data.reminders.filter((r) => !r.is_read).length;
  const refQuote = useMemo(() => getDailyReflectionQuote(now), [now]);
  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[232px] shrink-0 flex-col rounded-[28px] border border-line glass-surface p-4 backdrop-blur lg:flex" style={{ boxShadow: "var(--shadow)" }}>
      <div className="mb-4 flex items-center gap-2.5 px-2 pt-1">
        <Logo size={38} />
        <div className="leading-tight"><p className="font-display text-[17px] font-semibold text-ink">Hidup Terarah</p><p className="text-[11px] text-mute">teman menata hidup</p></div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto pr-1" aria-label="Navigasi utama">
        {NAV.map((n) => {
          const on = view === n.v;
          return (
            <button key={n.v} onClick={() => setView(n.v)} aria-current={on ? "page" : undefined}
              className={cn("group flex items-center gap-3 rounded-[14px] px-3 py-2 text-sm font-semibold transition", on ? "bg-brandsoft text-ink" : "text-ink2 hover:bg-surface2")}>
              <n.icon size={18} strokeWidth={2.2} style={{ color: on ? "var(--accent)" : n.tint }} />
              <span className="flex-1 text-left">{n.l}</span>
              {n.v === "pengingat" && unread > 0 && <span className="rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">{unread}</span>}
            </button>
          );
        })}
      </nav>
      <div className="mt-3 rounded-[22px] border border-line bg-gradient-to-b from-peach-bg to-rose-bg p-3.5 shadow-sm">
        <div className="-mx-1 mb-1"><ArchArt /></div>
        <span className="inline-block rounded-full bg-surface/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-coral">
          Refleksi Hari Ini
        </span>
        <p className="mt-1.5 font-display text-[13px] font-semibold leading-snug text-ink line-clamp-2">
          “{refQuote.quote}”
        </p>
        <p className="mt-1 text-[11px] font-medium text-mute truncate">
          — {refQuote.author}
        </p>
        <button onClick={() => setView("jurnal")} className="btn mt-2.5 w-full bg-coral text-white py-2 text-xs font-semibold">
          <NotebookPen size={14} /> Tulis jurnal harian
        </button>
      </div>
    </aside>
  );
};

const SearchBox = () => {
  const { data, setView, setFocusDate } = useStore();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase(); if (s.length < 2) return [];
    const r: { k: string; label: string; meta: string; go: () => void }[] = [];
    data.goals.filter((g) => g.title.toLowerCase().includes(s)).forEach((g) => r.push({ k: g.id, label: g.title, meta: "Tujuan", go: () => setView("tujuan") }));
    (data.projects || []).filter((p) => p.name.toLowerCase().includes(s)).forEach((p) => r.push({ k: p.id, label: p.name, meta: "Proyek", go: () => setView("proyek") }));
    (data.projectTasks || []).filter((t) => t.title.toLowerCase().includes(s)).forEach((t) => r.push({ k: t.id, label: t.title, meta: "Task Proyek", go: () => setView("proyek") }));
    (data.journals || []).filter((j) => (j.title + " " + j.gratitude + " " + j.content).toLowerCase().includes(s)).forEach((j) => r.push({ k: j.id, label: j.title, meta: `Jurnal · ${j.date}`, go: () => setView("jurnal") }));
    data.habits.filter((h) => h.name.toLowerCase().includes(s)).forEach((h) => r.push({ k: h.id, label: h.name, meta: "Kebiasaan", go: () => setView("kebiasaan") }));
    data.schedules.filter((x) => x.title.toLowerCase().includes(s)).forEach((x) => r.push({ k: x.id, label: x.title, meta: `Agenda · ${fmtDateShort(new Date(x.start_at))}`, go: () => { setFocusDate(x.start_at.slice(0, 10)); setView("jadwal"); } }));
    data.transactions.filter((t) => t.note.toLowerCase().includes(s)).slice(-5).forEach((t) => r.push({ k: t.id, label: t.note, meta: `${t.type === "pemasukan" ? "+" : "-"}${rupiah(t.amount)}`, go: () => setView("keuangan") }));
    return r.slice(0, 8);
  }, [q, data, setView, setFocusDate]);
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-md">
      <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tujuan, kebiasaan, agenda…" aria-label="Cari"
        className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-mute focus:border-brand focus:ring-4 focus:ring-[var(--accent-soft)]" />
      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-[18px] border border-line bg-surface p-1.5" style={{ boxShadow: "var(--shadow)" }}>
          {results.map((r) => (
            <button key={r.k} onClick={() => { r.go(); setQ(""); }} className="flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2 text-left text-sm hover:bg-surface2">
              <span className="truncate font-semibold text-ink">{r.label}</span><span className="shrink-0 text-xs text-mute">{r.meta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Bellbox = () => {
  const { data, readReminder, readAll, setView } = useStore();
  const list = data.reminders.slice(0, 6);
  const unread = data.reminders.filter((r) => !r.is_read).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label={`Notifikasi, ${unread} belum dibaca`} className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink2 transition hover:text-brand">
          <Bell size={19} />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white ring-2 ring-[var(--bg)]">{unread > 9 ? "9+" : unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] rounded-[20px] border-line bg-surface p-2">
        <div className="flex items-center justify-between px-2 py-1.5"><p className="text-sm font-extrabold text-ink">Pengingat & teguran</p>{unread > 0 && <button onClick={readAll} className="text-xs font-bold text-brand">Tandai dibaca</button>}</div>
        <div className="max-h-[320px] overflow-y-auto">
          {list.length === 0 && <p className="px-3 py-6 text-center text-sm text-mute">Belum ada pengingat. Tenang dulu.</p>}
          {list.map((r) => (
            <button key={r.id} onClick={() => readReminder(r.id)} className={cn("flex w-full gap-2.5 rounded-[14px] px-2.5 py-2 text-left hover:bg-surface2", !r.is_read && "bg-surface2")}>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", r.is_read ? "bg-line" : r.level === "teguran" ? "bg-coral" : "bg-brand")} />
              <span className="min-w-0"><span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color: r.level === "teguran" ? "var(--coral)" : "var(--accent)" }}>{r.level}</span><span className="line-clamp-2 text-[13px] text-ink2">{r.message}</span></span>
            </button>
          ))}
        </div>
        <button onClick={() => setView("pengingat")} className="mt-1 w-full rounded-[12px] py-2 text-xs font-bold text-ink2 hover:bg-surface2">Lihat semua</button>
      </PopoverContent>
    </Popover>
  );
};

export const QuickAddMenu = ({ children, align = "end" }: { children: ReactNode; align?: "start" | "end" | "center" }) => {
  const { setQuick, setView } = useStore();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56 rounded-[18px] border-line bg-surface p-1.5">
        {([["agenda", "🗓️", "Agenda"], ["kebiasaan", "🌱", "Kebiasaan"], ["transaksi", "💸", "Catat uang"], ["tujuan", "🎯", "Tujuan"]] as const).map(([k, e, l]) => (
          <DropdownMenuItem key={k} onSelect={() => setQuick(k)} className="cursor-pointer gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold text-ink focus:bg-surface2"><span className="text-base">{e}</span>{l}</DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => setView("jurnal")} className="cursor-pointer gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold text-ink focus:bg-surface2"><span className="text-base">📔</span>Jurnal harian</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Topbar = () => {
  const { data, setView, cloudStatus, lastSyncedAt } = useStore();
  const initials = (data.user?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-2.5 glass-bg px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:backdrop-blur-0">
      <div className="lg:hidden"><Logo size={36} /></div>
      <SearchBox />
      <div className="ml-auto flex items-center gap-2">
        <QuickAddMenu><button className="btn btn-primary hidden h-11 rounded-full sm:inline-flex"><Plus size={17} /> Catat</button></QuickAddMenu>
        <button
          onClick={() => setView("pengaturan")}
          aria-label="Status Cloud"
          title={cloudStatus === "synced" ? `Cloud aktif: sinkron ${lastSyncedAt || "baru saja"}` : cloudStatus === "syncing" ? "Sedang menyinkronkan data..." : "Database Cloud: Klik untuk hubungkan"}
          className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink2 transition hover:text-brand"
        >
          {cloudStatus === "syncing" ? (
            <RefreshCw size={17} className="animate-spin text-brand" />
          ) : cloudStatus === "synced" ? (
            <CloudCheck size={18} className="text-mint" />
          ) : (
            <Cloud size={18} className="text-mute opacity-60" />
          )}
        </button>
        <Bellbox />
        <button onClick={() => setView("pengaturan")} aria-label="Profil" className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-lilac-bg to-rose-bg font-bold text-ink ring-2 ring-surface">{initials}</button>
      </div>
    </div>
  );
};

const MobileNav = () => {
  const { view, setView } = useStore();
  const [more, setMore] = useState(false);
  const main: View[] = ["beranda", "kebiasaan", "jadwal", "keuangan"];
  const items = NAV.filter((n) => main.includes(n.v));
  return (
    <>
      {more && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setMore(false)}>
          <div className="absolute bottom-24 left-4 right-4 grid grid-cols-2 gap-2 rounded-[24px] border border-line bg-surface p-3" style={{ boxShadow: "var(--shadow)" }} onClick={(e) => e.stopPropagation()}>
            {NAV.filter((n) => !main.includes(n.v)).map((n) => (
              <button key={n.v} onClick={() => { setView(n.v); setMore(false); }} className="flex items-center gap-2.5 rounded-[14px] bg-surface2 px-3 py-3 text-sm font-semibold text-ink"><n.icon size={18} style={{ color: n.tint }} />{n.l}</button>
            ))}
          </div>
        </div>
      )}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[24px] border border-line glass-surface px-2 py-2 backdrop-blur lg:hidden" style={{ boxShadow: "var(--shadow)" }} aria-label="Navigasi">
        {items.slice(0, 2).map((n) => <MobBtn key={n.v} n={n} on={view === n.v} onClick={() => setView(n.v)} />)}
        <QuickAddMenu align="center"><button aria-label="Catat cepat" className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-brand text-[var(--accent-ink)] ring-4 ring-[var(--bg)]" style={{ boxShadow: "0 10px 24px -10px var(--accent)" }}><Plus size={24} /></button></QuickAddMenu>
        {items.slice(2).map((n) => <MobBtn key={n.v} n={n} on={view === n.v} onClick={() => setView(n.v)} />)}
        <button onClick={() => setMore(!more)} className={cn("flex w-14 flex-col items-center gap-0.5 py-1 text-[10px] font-bold", more ? "text-brand" : "text-mute")}>{more ? <X size={20} /> : <Ellipsis size={20} />}Lainnya</button>
      </nav>
    </>
  );
};
const MobBtn = ({ n, on, onClick }: { n: (typeof NAV)[number]; on: boolean; onClick: () => void }) => (
  <button onClick={onClick} aria-current={on ? "page" : undefined} className={cn("flex w-14 flex-col items-center gap-0.5 py-1 text-[10px] font-bold", on ? "text-brand" : "text-mute")}><n.icon size={20} />{n.l}</button>
);

export const Toasts = () => {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2 lg:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="animate-rise pointer-events-auto flex items-center gap-3 rounded-[16px] bg-ink px-4 py-3 text-sm font-semibold text-[var(--surface)]" style={{ boxShadow: "var(--shadow)" }}>
          <span className="flex-1">{t.text}</span>
          {t.undo && <button className="font-bold text-butter" onClick={() => { t.undo!(); dismissToast(t.id); }}>Urungkan</button>}
        </div>
      ))}
    </div>
  );
};

export const Shell = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto flex max-w-[1440px] gap-5 px-4 pb-28 pt-0 sm:px-6 lg:pb-6 lg:pt-4">
    <Sidebar />
    <main className="min-w-0 flex-1">
      <Topbar />
      {children}
    </main>
    <MobileNav />
    <Toasts />
  </div>
);
