import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData, Goal, GoalStep, Habit, Schedule, Transaction, Reflection, Preferences, Category } from "./types";
import { emptyData, demoData } from "./seed";
import { uid, ymd, fmtTime, startOfDay, addDays } from "./dates";
import { detectDrift, effectiveStatus, habitsForToday, isDone, reminderText } from "./logic";
import {
  isAnyCloudConfigured,
  getCloudSettings,
  saveCloudSettings,
  syncAppDataToCloud,
  fetchAppDataFromCloud,
  testUpstashConnection,
  testPantryConnection,
  type CloudSettings,
} from "./cloud-db";
import {
  saveSupabaseConfig,
  clearSupabaseConfig,
} from "./supabase";
import {
  testTursoConnection,
  saveTursoConfig,
  clearTursoConfig,
} from "./turso";

const KEY = "hidup-terarah:v1";
const load = (): AppData => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyData(), ...JSON.parse(raw) };
  } catch {
    /* abaikan */
  }
  return emptyData();
};
const save = (d: AppData) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* abaikan */
  }
};

export type View = "beranda" | "tujuan" | "kebiasaan" | "jadwal" | "keuangan" | "pengingat" | "evaluasi" | "pengaturan";
export type QuickKind = "agenda" | "kebiasaan" | "transaksi" | "tujuan" | null;
export type CloudSyncStatus = "unconfigured" | "idle" | "syncing" | "synced" | "error";

interface Toast {
  id: string;
  text: string;
  undo?: () => void;
}

const useStoreValue = () => {
  const [data, setData] = useState<AppData>(load);
  const [view, setView] = useState<View>("beranda");
  const [quick, setQuick] = useState<QuickKind>(null);
  const [focusDate, setFocusDate] = useState<string>(ymd(new Date()));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [now, setNow] = useState(new Date());

  // Cloud Sync State
  const [cloudSettings, setCloudSettingsState] = useState<CloudSettings>(() => getCloudSettings());
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() =>
    isAnyCloudConfigured() ? "idle" : "unconfigured"
  );
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const dataRef = useRef(data);
  dataRef.current = data;
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simpan lokal selalu
  useEffect(() => {
    save(data);
  }, [data]);

  // Tema
  useEffect(() => {
    const t = data.prefs.theme;
    const el = document.documentElement;
    if (t === "terang") el.setAttribute("data-theme", "light");
    else if (t === "gelap") el.setAttribute("data-theme", "dark");
    else el.removeAttribute("data-theme");
  }, [data.prefs.theme]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  const toast = useCallback((text: string, undo?: () => void) => {
    const id = uid();
    setToasts((t) => [...t.slice(-2), { id, text, undo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismissToast = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  // ---- Sinkronisasi Cloud Otomatis (Debounced) ----
  useEffect(() => {
    if (!data.user?.email || !isAnyCloudConfigured()) {
      if (!isAnyCloudConfigured()) setCloudStatus("unconfigured");
      return;
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      setCloudStatus("syncing");
      setCloudError(null);
      const res = await syncAppDataToCloud(data.user!.email, data);
      if (res.success) {
        setCloudStatus("synced");
        setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      } else {
        setCloudStatus("error");
        setCloudError(res.error || "Gagal sinkron");
      }
    }, 1800);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [data]);

  // Tarik data cloud awal jika user sudah ada dan cloud aktif
  useEffect(() => {
    if (data.user?.email && isAnyCloudConfigured()) {
      fetchAppDataFromCloud(data.user.email).then((res) => {
        if (res.success && res.data) {
          setData((curr) => ({ ...curr, ...res.data }));
          setCloudStatus("synced");
          setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
        }
      });
    }
  }, []);

  // ---- Mesin pengingat & teguran (jalan tiap 30 detik selama aplikasi terbuka) ----
  useEffect(() => {
    const run = () => {
      const n = new Date();
      setNow(n);
      const d = dataRef.current;
      if (!d.user) return;
      const today = ymd(n);
      const logs = [...d.reminders];
      const has = (key: string) => logs.some((l) => l.key === key);
      const fresh: AppData["reminders"] = [];
      let schedules = d.schedules;
      let changed = false;
      // tandai agenda terlewat
      if (schedules.some((s) => effectiveStatus(s, n) !== s.status)) {
        schedules = schedules.map((s) => ({ ...s, status: effectiveStatus(s, n) }));
        changed = true;
      }
      if (d.prefs.reminder_enabled) {
        for (const s of schedules) {
          const st = new Date(s.start_at);
          const key = `a:${s.id}:${s.start_at}`;
          if (s.status === "terjadwal" && st <= n && n.getTime() - st.getTime() < 3 * 3600e3 && !has(key))
            fresh.push({
              id: uid(),
              key,
              source_type: "agenda",
              source_id: s.id,
              level: "pengingat",
              message: reminderText(d.prefs.reminder_tone, "agenda", s.title, fmtTime(s.start_at)),
              is_read: false,
              sent_at: n.toISOString(),
            });
        }
        for (const h of habitsForToday(d, n)) {
          const [hh, mm] = h.preferred_time.split(":").map(Number);
          const due = new Date(n);
          due.setHours(hh, mm, 0, 0);
          const key = `k:${h.id}:${today}`;
          if (due <= n && !isDone(d, h.id, today) && !has(key))
            fresh.push({
              id: uid(),
              key,
              source_type: "kebiasaan",
              source_id: h.id,
              level: "pengingat",
              message: reminderText(d.prefs.reminder_tone, "kebiasaan", h.name.toLowerCase(), h.preferred_time.replace(":", ".")),
              is_read: false,
              sent_at: due.toISOString(),
            });
        }
        for (const dr of detectDrift({ ...d, schedules }, n)) {
          const key = `t:${dr.id}:${today}`;
          if (!has(key))
            fresh.push({
              id: uid(),
              key,
              source_type: dr.kind === "kebiasaan" ? "kebiasaan" : dr.kind === "tujuan" ? "tujuan" : "agenda",
              source_id: dr.id,
              level: "teguran",
              message: `${dr.title}: ${dr.detail}`,
              is_read: false,
              sent_at: n.toISOString(),
            });
        }
      }
      if (fresh.length || changed) {
        setData((cur) => ({
          ...cur,
          schedules: changed ? cur.schedules.map((s) => ({ ...s, status: effectiveStatus(s, n) })) : cur.schedules,
          reminders: [...fresh, ...cur.reminders].slice(0, 200),
        }));
        if (fresh.length && d.prefs.reminder_enabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            const f = fresh[0];
            new Notification(f.level === "teguran" ? "Teguran ringan" : "Pengingat", { body: f.message });
          } catch {
            /* abaikan */
          }
        }
      }
    };
    run();
    const t = setInterval(run, 30000);
    return () => clearInterval(t);
  }, []);

  // ---- Aksi Cloud Manual ----
  const syncNow = useCallback(async () => {
    const cur = dataRef.current;
    if (!cur.user?.email) {
      toast("Email pengguna belum diatur untuk sinkronisasi.");
      return false;
    }
    if (!isAnyCloudConfigured()) {
      toast("Database Cloud belum dikonfigurasi.");
      return false;
    }

    setCloudStatus("syncing");
    setCloudError(null);
    const res = await syncAppDataToCloud(cur.user.email, cur);
    if (res.success) {
      setCloudStatus("synced");
      setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      toast("Berhasil disinkronkan ke Database Cloud!");
      return true;
    } else {
      setCloudStatus("error");
      setCloudError(res.error || "Gagal sinkron");
      toast(`Gagal sinkron: ${res.error}`);
      return false;
    }
  }, [toast]);

  const pullFromCloud = useCallback(async () => {
    const cur = dataRef.current;
    if (!cur.user?.email) {
      toast("Email pengguna belum ada.");
      return false;
    }
    if (!isAnyCloudConfigured()) {
      toast("Database Cloud belum dikonfigurasi.");
      return false;
    }

    setCloudStatus("syncing");
    const res = await fetchAppDataFromCloud(cur.user.email);
    if (res.success && res.data) {
      setData((c) => ({ ...c, ...res.data }));
      setCloudStatus("synced");
      setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      toast("Data terbaru berhasil diunduh dari Cloud!");
      return true;
    } else {
      setCloudStatus("error");
      setCloudError(res.error || "Gagal mengambil data");
      toast(`Gagal mengambil data dari Cloud: ${res.error}`);
      return false;
    }
  }, [toast]);

  const updateTursoConfig = useCallback(async (url: string, authToken: string) => {
    setCloudStatus("syncing");
    const test = await testTursoConnection(url, authToken);
    if (!test.success) {
      setCloudStatus("error");
      setCloudError(test.error || "Koneksi Turso gagal");
      toast(`Koneksi Turso gagal: ${test.error}`);
      return test;
    }

    const res = await saveTursoConfig(url, authToken);
    if (res.success) {
      const newCfg: CloudSettings = { provider: "turso" };
      saveCloudSettings(newCfg);
      setCloudSettingsState(newCfg);
      setCloudStatus("idle");
      setCloudError(null);
      toast("Turso SQLite berhasil terhubung! (Anti-pause, 100% Gratis)");

      const cur = dataRef.current;
      if (cur.user?.email) {
        syncAppDataToCloud(cur.user.email, cur).then((sr) => {
          if (sr.success) {
            setCloudStatus("synced");
            setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
          }
        });
      }
    }
    return res;
  }, [toast]);

  const updateUpstashConfig = useCallback(async (url: string, token: string) => {
    setCloudStatus("syncing");
    const test = await testUpstashConnection(url, token);
    if (!test.success) {
      setCloudStatus("error");
      setCloudError(test.error || "Koneksi Upstash gagal");
      toast(`Koneksi Upstash gagal: ${test.error}`);
      return test;
    }

    const newCfg: CloudSettings = {
      provider: "upstash",
      upstash: { url: url.trim().replace(/\/+$/, ""), token: token.trim() },
    };
    saveCloudSettings(newCfg);
    setCloudSettingsState(newCfg);
    setCloudStatus("idle");
    setCloudError(null);
    toast("Upstash Redis berhasil terhubung! (Anti-pause)");

    const cur = dataRef.current;
    if (cur.user?.email) {
      syncAppDataToCloud(cur.user.email, cur).then((sr) => {
        if (sr.success) {
          setCloudStatus("synced");
          setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
        }
      });
    }
    return { success: true };
  }, [toast]);

  const updatePantryConfig = useCallback(async (pantryId: string) => {
    setCloudStatus("syncing");
    const test = await testPantryConnection(pantryId);
    if (!test.success) {
      setCloudStatus("error");
      setCloudError(test.error || "Pantry ID tidak valid");
      toast(`Pantry gagal: ${test.error}`);
      return test;
    }

    const newCfg: CloudSettings = {
      provider: "pantry",
      pantry: { pantryId: pantryId.trim() },
    };
    saveCloudSettings(newCfg);
    setCloudSettingsState(newCfg);
    setCloudStatus("idle");
    setCloudError(null);
    toast("Pantry Cloud berhasil terhubung!");

    const cur = dataRef.current;
    if (cur.user?.email) {
      syncAppDataToCloud(cur.user.email, cur).then((sr) => {
        if (sr.success) {
          setCloudStatus("synced");
          setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
        }
      });
    }
    return { success: true };
  }, [toast]);

  const updateSupabaseConfig = useCallback(async (url: string, anonKey: string) => {
    setCloudStatus("syncing");
    const res = await saveSupabaseConfig(url, anonKey);
    if (res.success) {
      const newCfg: CloudSettings = { provider: "supabase" };
      saveCloudSettings(newCfg);
      setCloudSettingsState(newCfg);
      setCloudStatus("idle");
      setCloudError(null);
      toast("Supabase berhasil terhubung!");

      const cur = dataRef.current;
      if (cur.user?.email) {
        syncAppDataToCloud(cur.user.email, cur).then((sr) => {
          if (sr.success) {
            setCloudStatus("synced");
            setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
          }
        });
      }
    } else {
      setCloudStatus("error");
      setCloudError(res.error || "Gagal menghubungkan database");
      toast(`Koneksi gagal: ${res.error}`);
    }
    return res;
  }, [toast]);

  const disconnectCloud = useCallback(() => {
    localStorage.removeItem("hidup-terarah:cloud-settings");
    clearSupabaseConfig();
    clearTursoConfig();
    setCloudSettingsState({ provider: "turso" });
    setCloudStatus("unconfigured");
    setCloudError(null);
    toast("Koneksi Cloud diputus. Data tetap tersimpan aman di browser.");
  }, [toast]);

  // ---- Aksi Data App ----
  const actions = useMemo(
    () => ({
      register: (name: string, email: string, timezone: string, demo: boolean) =>
        setData(() => {
          const d = demo ? demoData(name, email) : { ...emptyData(), user: { id: uid(), name, email, created_at: new Date().toISOString() } };
          d.prefs.timezone = timezone;
          return d;
        }),
      logout: () => setData((d) => ({ ...d, lastUser: d.user, user: null })),
      login: async (email: string) => {
        const cleanEmail = email.trim().toLowerCase();
        if (isAnyCloudConfigured()) {
          setCloudStatus("syncing");
          const cloudRes = await fetchAppDataFromCloud(cleanEmail);
          if (cloudRes.success && cloudRes.data) {
            setData((curr) => ({ ...curr, ...cloudRes.data, user: cloudRes.data!.user || { id: uid(), name: cleanEmail.split("@")[0], email: cleanEmail, created_at: new Date().toISOString() } }));
            setCloudStatus("synced");
            setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
            toast("Data Anda berhasil dimuat dari Cloud!");
            return;
          }
        }

        setData((d) =>
          d.lastUser && d.lastUser.email.toLowerCase() === cleanEmail
            ? { ...d, user: d.lastUser }
            : { ...emptyData(), user: { id: uid(), name: cleanEmail.split("@")[0], email: cleanEmail, created_at: new Date().toISOString() } }
        );
      },
      wipe: () => {
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* abaikan */
        }
        setData(emptyData());
        setView("beranda");
      },
      setPrefs: (p: Partial<Preferences>) => update((d) => ({ ...d, prefs: { ...d.prefs, ...p } })),
      setProfile: (name: string, email: string) => update((d) => ({ ...d, user: d.user ? { ...d.user, name, email } : d.user })),

      toggleHabit: (h: Habit, day = ymd(new Date())) => {
        const done = isDone(dataRef.current, h.id, day);
        update((d) => ({
          ...d,
          habitLogs: done
            ? d.habitLogs.filter((l) => !(l.habit_id === h.id && l.log_date === day))
            : [...d.habitLogs, { id: uid(), habit_id: h.id, log_date: day, is_done: true }],
        }));
        if (!done && day === ymd(new Date())) toast(`"${h.name}" tercatat. Mantap!`);
      },
      saveHabit: (h: Partial<Habit> & { name: string }) =>
        update((d) =>
          h.id
            ? { ...d, habits: d.habits.map((x) => (x.id === h.id ? ({ ...x, ...h } as Habit) : x)) }
            : {
                ...d,
                habits: [
                  ...d.habits,
                  {
                    id: uid(),
                    frequency_type: "harian",
                    frequency_target: 1,
                    preferred_time: "07:00",
                    is_active: true,
                    created_at: new Date().toISOString(),
                    icon: "✨",
                    color: "lilac",
                    ...h,
                  } as Habit,
                ],
              }
        ),
      deleteHabit: (id: string) =>
        update((d) => ({ ...d, habits: d.habits.filter((h) => h.id !== id), habitLogs: d.habitLogs.filter((l) => l.habit_id !== id) })),

      saveSchedule: (s: Partial<Schedule> & { title: string; start_at: string }) =>
        update((d) =>
          s.id
            ? {
                ...d,
                schedules: d.schedules
                  .map((x) => (x.id === s.id ? ({ ...x, ...s, status: x.status === "terlewat" ? "terjadwal" : x.status } as Schedule) : x))
                  .map((x) => ({ ...x, status: effectiveStatus(x) })),
              }
            : { ...d, schedules: [...d.schedules, { id: uid(), notes: "", status: "terjadwal", icon: "📌", color: "sky", ...s } as Schedule] }
        ),
      toggleSchedule: (s: Schedule) => {
        const done = s.status === "selesai";
        update((d) => ({
          ...d,
          schedules: d.schedules.map((x) =>
            x.id !== s.id
              ? x
              : done
              ? { ...x, status: effectiveStatus({ ...x, status: "terjadwal" }), completed_at: undefined }
              : { ...x, status: "selesai", completed_at: new Date().toISOString() }
          ),
        }));
        if (!done) toast(`Agenda "${s.title}" selesai.`);
      },
      shiftSchedule: (s: Schedule, minutes: number) =>
        update((d) => ({
          ...d,
          schedules: d.schedules.map((x) => {
            if (x.id !== s.id) return x;
            const st = new Date(new Date(x.start_at).getTime() + minutes * 60000);
            const en = x.end_at ? new Date(new Date(x.end_at).getTime() + minutes * 60000).toISOString() : undefined;
            const nx = { ...x, start_at: st.toISOString(), end_at: en, status: "terjadwal" as const };
            return { ...nx, status: effectiveStatus(nx) };
          }),
        })),
      deleteSchedule: (id: string) => update((d) => ({ ...d, schedules: d.schedules.filter((s) => s.id !== id) })),

      saveGoal: (g: Partial<Goal> & { title: string }, stepTitles?: string[]) =>
        update((d) => {
          if (g.id) return { ...d, goals: d.goals.map((x) => (x.id === g.id ? ({ ...x, ...g } as Goal) : x)) };
          const id = uid();
          const goal: Goal = {
            id,
            reason: "",
            target_date: ymd(addDays(startOfDay(new Date()), 30)),
            progress: 0,
            status: "aktif",
            created_at: new Date().toISOString(),
            color: "lilac",
            ...g,
          } as Goal;
          const steps: GoalStep[] = (stepTitles || []).filter(Boolean).map((t, i) => ({ id: uid(), goal_id: id, title: t, is_done: false, order_index: i }));
          return { ...d, goals: [goal, ...d.goals], steps: [...d.steps, ...steps] };
        }),
      setGoalStatus: (id: string, status: Goal["status"]) =>
        update((d) => ({
          ...d,
          goals: d.goals.map((g) =>
            g.id === id ? { ...g, status, completed_at: status === "selesai" ? new Date().toISOString() : g.completed_at, progress: status === "selesai" ? 100 : g.progress } : g
          ),
        })),
      deleteGoal: (id: string) =>
        update((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id), steps: d.steps.filter((s) => s.goal_id !== id) })),
      addStep: (goalId: string, title: string) =>
        update((d) => ({ ...d, steps: [...d.steps, { id: uid(), goal_id: goalId, title, is_done: false, order_index: d.steps.length }] })),
      toggleStep: (id: string) =>
        update((d) => ({
          ...d,
          steps: d.steps.map((s) => (s.id === id ? { ...s, is_done: !s.is_done, done_at: !s.is_done ? new Date().toISOString() : undefined } : s)),
        })),
      deleteStep: (id: string) => update((d) => ({ ...d, steps: d.steps.filter((s) => s.id !== id) })),

      addTransaction: (t: Omit<Transaction, "id">) => {
        const id = uid();
        update((d) => ({ ...d, transactions: [...d.transactions, { ...t, id }] }));
        toast(t.type === "pemasukan" ? "Pemasukan tercatat." : "Pengeluaran tercatat.", () =>
          update((d) => ({ ...d, transactions: d.transactions.filter((x) => x.id !== id) }))
        );
      },
      deleteTransaction: (id: string) => update((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) })),
      addCategory: (c: Omit<Category, "id">) => update((d) => ({ ...d, categories: [...d.categories, { ...c, id: uid() }] })),

      readReminder: (id: string) => update((d) => ({ ...d, reminders: d.reminders.map((r) => (r.id === id ? { ...r, is_read: true } : r)) })),
      readAll: () => update((d) => ({ ...d, reminders: d.reminders.map((r) => ({ ...r, is_read: true })) })),

      saveReflection: (r: Omit<Reflection, "id" | "created_at">) =>
        update((d) => {
          const ex = d.reflections.find((x) => x.week_start === r.week_start);
          return ex
            ? { ...d, reflections: d.reflections.map((x) => (x.week_start === r.week_start ? { ...x, ...r } : x)) }
            : { ...d, reflections: [{ ...r, id: uid(), created_at: new Date().toISOString() }, ...d.reflections] };
        }),
    }),
    [update, toast]
  );

  return {
    data,
    now,
    view,
    setView,
    quick,
    setQuick,
    focusDate,
    setFocusDate,
    toasts,
    toast,
    dismissToast,
    cloudSettings,
    cloudStatus,
    cloudError,
    lastSyncedAt,
    syncNow,
    pullFromCloud,
    updateTursoConfig,
    updateUpstashConfig,
    updatePantryConfig,
    updateSupabaseConfig,
    disconnectCloud,
    ...actions,
  };
};

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export const StoreProvider = ({ children }: { children: ReactNode }) => <Ctx.Provider value={useStoreValue()}>{children}</Ctx.Provider>;
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("no store");
  return c;
};
