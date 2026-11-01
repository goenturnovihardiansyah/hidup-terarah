import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { 
  AppData, Goal, GoalStep, Habit, Schedule, Transaction, 
  Reflection, Preferences, Category, WorkoutLog, CalorieLog, 
  WeightLog, FitnessProfile, StreakMilestone, Project, ProjectTask,
  ProjectStatus, TaskPriority, DailyJournal, JournalMood
} from "./types";
import { emptyData, demoData } from "./seed";
import { uid, ymd, fmtTime, startOfDay, addDays } from "./dates";
import { detectDrift, effectiveStatus, habitsForToday, isDone, reminderText, streak } from "./logic";
import { getStreakMilestoneContent } from "./quotes";
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
  checkTursoServerlessStatus,
} from "./turso";

const KEY = "hidup-terarah:v1";

/** Memastikan setiap entitas memiliki ID unik, memulihkan relasi langkah tujuan, dan menjaga integritas data */
export const sanitizeData = (d: AppData): AppData => {
  const deletedSet = new Set<string>(Array.isArray(d.deleted_ids) ? d.deleted_ids : []);

  const seenHabits = new Set<string>();
  const habits = (d.habits || [])
    .filter((h) => !h?.id || !deletedSet.has(h.id))
    .map((h) => {
      let id = h?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenHabits.has(id)) {
        id = uid();
      }
      seenHabits.add(id);
      return { ...h, id };
    });

  const seenSchedules = new Set<string>();
  const schedules = (d.schedules || [])
    .filter((s) => !s?.id || !deletedSet.has(s.id))
    .map((s) => {
      let id = s?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenSchedules.has(id)) {
        id = uid();
      }
      seenSchedules.add(id);
      return { ...s, id };
    });

  const seenGoals = new Set<string>();
  const goals = (d.goals || [])
    .filter((g) => !g?.id || !deletedSet.has(g.id))
    .map((g) => {
      let id = g?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenGoals.has(id)) {
        id = uid();
      }
      seenGoals.add(id);
      return {
        ...g,
        id,
        status: g.status || "aktif",
        progress: typeof g.progress === "number" ? g.progress : 0,
      };
    });

  const sholatGoal = goals.find((g) => (g.title || "").toLowerCase().includes("sholat"));

  const seenSteps = new Set<string>();
  const stepsDedup = new Map<string, GoalStep>();
  for (const rawStep of d.steps || []) {
    if (rawStep?.id && deletedSet.has(rawStep.id)) continue;
    let id = rawStep?.id;
    if (!id || typeof id !== "string" || id === "undefined" || seenSteps.has(id)) {
      id = uid();
    }
    seenSteps.add(id);

    let goalId = rawStep.goal_id;
    if (!seenGoals.has(goalId)) {
      if (
        sholatGoal &&
        (goalId === "zzvuqkj464bn" ||
          goalId === "ibcy1gsk9045" ||
          (rawStep.title || "").toLowerCase().includes("sholat") ||
          (rawStep.title || "").toLowerCase().includes("masjid"))
      ) {
        goalId = sholatGoal.id;
      } else if (goals.length === 1) {
        goalId = goals[0].id;
      }
    }

    const stepItem: GoalStep = { ...rawStep, id, goal_id: goalId };
    const stepKey = `${goalId}::${(rawStep.title || "").trim().toLowerCase()}`;
    const existingStep = stepsDedup.get(stepKey);
    if (!existingStep) {
      stepsDedup.set(stepKey, stepItem);
    } else {
      stepsDedup.set(stepKey, {
        ...existingStep,
        ...stepItem,
        is_done: Boolean(existingStep.is_done || stepItem.is_done),
      });
    }
  }
  const steps = Array.from(stepsDedup.values());

  const seenTx = new Set<string>();
  const transactions = (d.transactions || [])
    .filter((t) => !t?.id || !deletedSet.has(t.id))
    .map((t) => {
      let id = t?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenTx.has(id)) {
        id = uid();
      }
      seenTx.add(id);
      return { ...t, id };
    });

  const seenWorkouts = new Set<string>();
  const workouts = (d.workouts || [])
    .filter((w) => !w?.id || !deletedSet.has(w.id))
    .map((w) => {
      let id = w?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenWorkouts.has(id)) {
        id = uid();
      }
      seenWorkouts.add(id);
      return { ...w, id };
    });

  const seenCalories = new Set<string>();
  const calories = (d.calories || [])
    .filter((c) => !c?.id || !deletedSet.has(c.id))
    .map((c) => {
      let id = c?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenCalories.has(id)) {
        id = uid();
      }
      seenCalories.add(id);
      return { ...c, id };
    });

  const seenWeights = new Set<string>();
  const weights = (d.weights || [])
    .filter((w) => !w?.id || !deletedSet.has(w.id))
    .map((w) => {
      let id = w?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenWeights.has(id)) {
        id = uid();
      }
      seenWeights.add(id);
      return { ...w, id };
    });

  const seenWater = new Set<string>();
  const waterLogs = (d.waterLogs || [])
    .filter((w) => !w?.id || !deletedSet.has(w.id))
    .map((w) => {
      let id = w?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenWater.has(id)) {
        id = uid();
      }
      seenWater.add(id);
      return { ...w, id };
    });

  const fitnessProfile: FitnessProfile = d.fitnessProfile || {
    target_calories: 2000,
    target_weight_kg: 65,
    height_cm: 170,
    daily_water_target_ml: 2000,
    weekly_workout_target_minutes: 150,
  };

  const seenProjects = new Set<string>();
  const projects = (d.projects || [])
    .filter((p) => !p?.id || !deletedSet.has(p.id))
    .map((p) => {
      let id = p?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenProjects.has(id)) {
        id = uid();
      }
      seenProjects.add(id);
      return {
        ...p,
        id,
        status: p.status || "aktif",
        category: p.category || "Pribadi",
      };
    });

  const seenProjectTasks = new Set<string>();
  const projectTasks = (d.projectTasks || [])
    .filter((pt) => !pt?.id || !deletedSet.has(pt.id))
    .map((pt) => {
      let id = pt?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenProjectTasks.has(id)) {
        id = uid();
      }
      seenProjectTasks.add(id);
      return {
        ...pt,
        id,
        status: pt.status || (pt.is_done ? "selesai" : "todo"),
        priority: pt.priority || "sedang",
      };
    });

  const seenJournals = new Set<string>();
  const journals = (d.journals || [])
    .filter((j) => !j?.id || !deletedSet.has(j.id))
    .map((j) => {
      let id = j?.id;
      if (!id || typeof id !== "string" || id === "undefined" || seenJournals.has(id)) {
        id = uid();
      }
      seenJournals.add(id);
      return {
        ...j,
        id,
        mood: j.mood || "bersyukur",
        energy_level: typeof j.energy_level === "number" ? j.energy_level : 4,
        tags: Array.isArray(j.tags) ? j.tags : [],
        color: j.color || "lilac",
      };
    });

  return {
    ...d,
    habits,
    schedules,
    goals,
    steps,
    transactions,
    workouts,
    calories,
    weights,
    waterLogs,
    fitnessProfile,
    projects,
    projectTasks,
    journals,
    deleted_ids: Array.from(deletedSet).slice(-500),
  };
};

/** Menggabungkan data lokal & cloud secara non-destruktif agar tidak ada data yang ter-reset */
export const mergeAppData = (local: AppData, cloud: AppData): AppData => {
  const deletedIds = Array.from(
    new Set([
      ...(Array.isArray(local.deleted_ids) ? local.deleted_ids : []),
      ...(Array.isArray(cloud.deleted_ids) ? cloud.deleted_ids : []),
    ])
  ).slice(-500);
  const deletedSet = new Set<string>(deletedIds);

  const mergeList = <T extends { id: string }>(cloudArr: T[] = [], localArr: T[] = []): T[] => {
    const map = new Map<string, T>();
    for (const item of cloudArr) {
      if (item && item.id && typeof item.id === "string" && item.id !== "undefined" && !deletedSet.has(item.id)) {
        map.set(item.id, item);
      }
    }
    for (const item of localArr) {
      if (item && item.id && typeof item.id === "string" && item.id !== "undefined" && !deletedSet.has(item.id)) {
        const prev = map.get(item.id);
        map.set(item.id, prev ? { ...prev, ...item } : item);
      }
    }
    return Array.from(map.values());
  };

  // Untuk goals, gabungkan berdasarkan ID maupun kesamaan judul agar tidak duplikat namun progres tertinggi terjaga
  const combinedGoals = mergeList(cloud.goals || [], local.goals || []);
  const goalsByTitle = new Map<string, Goal>();
  for (const g of combinedGoals) {
    const key = (g.title || "").trim().toLowerCase() || g.id;
    const prev = goalsByTitle.get(key);
    if (!prev) {
      goalsByTitle.set(key, g);
    } else {
      goalsByTitle.set(key, {
        ...prev,
        ...g,
        id: prev.id || g.id,
        progress: Math.max(Number(prev.progress || 0), Number(g.progress || 0)),
      });
    }
  }

  return sanitizeData({
    ...emptyData(),
    ...cloud,
    ...local,
    user: local.user || cloud.user,
    lastUser: local.lastUser || cloud.lastUser,
    prefs: { ...local.prefs, ...(cloud.prefs || {}) },
    goals: Array.from(goalsByTitle.values()),
    steps: mergeList(cloud.steps || [], local.steps || []),
    habits: mergeList(cloud.habits || [], local.habits || []),
    habitLogs: mergeList(cloud.habitLogs || [], local.habitLogs || []),
    schedules: mergeList(cloud.schedules || [], local.schedules || []),
    categories: mergeList(cloud.categories || [], local.categories || []),
    transactions: mergeList(cloud.transactions || [], local.transactions || []),
    reminders: mergeList(cloud.reminders || [], local.reminders || []).slice(0, 200),
    reflections: mergeList(cloud.reflections || [], local.reflections || []),
    workouts: mergeList(cloud.workouts || [], local.workouts || []),
    calories: mergeList(cloud.calories || [], local.calories || []),
    weights: mergeList(cloud.weights || [], local.weights || []),
    waterLogs: mergeList(cloud.waterLogs || [], local.waterLogs || []),
    fitnessProfile: {
      ...(cloud.fitnessProfile || {}),
      ...(local.fitnessProfile || {}),
    } as FitnessProfile,
    projects: mergeList(cloud.projects || [], local.projects || []),
    projectTasks: mergeList(cloud.projectTasks || [], local.projectTasks || []),
    journals: mergeList(cloud.journals || [], local.journals || []),
    deleted_ids: deletedIds,
    updated_at: new Date().toISOString(),
  });
};

const load = (): AppData => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitizeData({ ...emptyData(), ...JSON.parse(raw) });
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

export type View = "beranda" | "tujuan" | "proyek" | "kebiasaan" | "jadwal" | "keuangan" | "kebugaran" | "jurnal" | "pengingat" | "evaluasi" | "pengaturan";
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

  // Apresiasi Milestone Streak Pop-up
  const [milestoneCelebration, setMilestoneCelebration] = useState<StreakMilestone | null>(null);
  const dismissMilestone = useCallback(() => setMilestoneCelebration(null), []);

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
  const initialCloudSyncDoneRef = useRef(false);

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

  const update = useCallback(
    (fn: (d: AppData) => AppData) =>
      setData((d) => {
        const next = fn(d);
        return { ...next, updated_at: new Date().toISOString() };
      }),
    []
  );

  const toast = useCallback((text: string, undo?: () => void) => {
    const id = uid();
    setToasts((t) => [...t.slice(-2), { id, text, undo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismissToast = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  // ---- Sinkronisasi Cloud Otomatis (Debounced & Terlindungi dari Race Condition Awal) ----
  useEffect(() => {
    if (!data.user?.email || !isAnyCloudConfigured()) {
      if (!isAnyCloudConfigured()) setCloudStatus("unconfigured");
      return;
    }

    // Jangan menimpa Cloud sebelum penarikan & penggabungan data awal selesai!
    if (!initialCloudSyncDoneRef.current) {
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
    }, 600);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [data]);

  // Flush sinkronisasi segera saat tab ditutup / diminimize di HP
  useEffect(() => {
    const flushSync = () => {
      if (
        document.visibilityState === "hidden" &&
        initialCloudSyncDoneRef.current &&
        dataRef.current.user?.email &&
        isAnyCloudConfigured()
      ) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        syncAppDataToCloud(dataRef.current.user.email, dataRef.current);
      }
    };
    window.addEventListener("visibilitychange", flushSync);
    window.addEventListener("pagehide", flushSync);
    return () => {
      window.removeEventListener("visibilitychange", flushSync);
      window.removeEventListener("pagehide", flushSync);
    };
  }, []);

  // Tarik & gabungkan data cloud awal tanpa pernah mereset data lokal maupun cloud
  useEffect(() => {
    checkTursoServerlessStatus().then((tursoServerlessActive) => {
      if (tursoServerlessActive) {
        setCloudStatus((prev) => (prev === "unconfigured" ? "idle" : prev));
      }

      const email = dataRef.current.user?.email;
      if (email && (isAnyCloudConfigured() || tursoServerlessActive)) {
        setCloudStatus("syncing");
        fetchAppDataFromCloud(email)
          .then((res) => {
            if (res.success && res.data) {
              const merged = mergeAppData(dataRef.current, res.data);
              setData(merged);
              initialCloudSyncDoneRef.current = true;
              setCloudStatus("synced");
              setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
              // Simpan hasil merge yang sudah utuh kembali ke cloud
              syncAppDataToCloud(email, merged);
            } else {
              initialCloudSyncDoneRef.current = true;
              // Jika belum ada di cloud, dorong data lokal saat ini
              syncAppDataToCloud(email, dataRef.current).then((sr) => {
                if (sr.success) {
                  setCloudStatus("synced");
                  setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
                }
              });
            }
          })
          .catch(() => {
            initialCloudSyncDoneRef.current = true;
          });
      } else {
        initialCloudSyncDoneRef.current = true;
      }
    });
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
      setData((c) => mergeAppData(c, res.data!));
      setCloudStatus("synced");
      setLastSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      toast("Data terbaru berhasil disinkronkan dari Cloud!");
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
            setData((curr) => {
              const merged = mergeAppData(curr, cloudRes.data!);
              return {
                ...merged,
                user: merged.user || { id: uid(), name: cleanEmail.split("@")[0], email: cleanEmail, created_at: new Date().toISOString() },
              };
            });
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
        const willBeDone = !done;

        update((d) => {
          const removedIds = done
            ? d.habitLogs.filter((l) => l.habit_id === h.id && l.log_date === day).map((l) => l.id)
            : [];
          return {
            ...d,
            deleted_ids: removedIds.length ? [...(d.deleted_ids || []), ...removedIds] : d.deleted_ids,
            habitLogs: done
              ? d.habitLogs.filter((l) => !(l.habit_id === h.id && l.log_date === day))
              : [...d.habitLogs, { id: uid(), habit_id: h.id, log_date: day, is_done: true }],
          };
        });

        if (willBeDone) {
          // Hitung streak baru secara akurat dengan menyertakan log hari ini
          const simLogs = [
            ...dataRef.current.habitLogs.filter((l) => !(l.habit_id === h.id && l.log_date === day)),
            { id: "temp", habit_id: h.id, log_date: day, is_done: true },
          ];
          const simData: AppData = { ...dataRef.current, habitLogs: simLogs };
          const st = streak(simData, h, new Date());
          const count = st.n;

          // Milestone khusus: 1x, 3x, 7x, atau kelipatan 7 (14, 21, 28...), atau 30, 50, 100
          const isMilestone =
            count === 1 ||
            count === 3 ||
            count === 7 ||
            (count > 7 && count % 7 === 0) ||
            count === 30 ||
            count === 50 ||
            count === 100;

          if (isMilestone) {
            const milestoneContent = getStreakMilestoneContent(h, count);
            setMilestoneCelebration(milestoneContent);
          } else {
            if (day === ymd(new Date())) {
              toast(`"${h.name}" tercatat. Mantap!`);
            }
          }
        }
      },
      saveHabit: (h: Partial<Habit> & { name: string }) =>
        update((d) => {
          const validId = h.id && typeof h.id === "string" && h.id !== "undefined" ? h.id : null;
          if (validId) {
            return {
              ...d,
              habits: d.habits.map((x) => (x.id === validId ? ({ ...x, ...h, id: validId } as Habit) : x)),
            };
          }
          const newId = uid();
          const cleanH = { ...h };
          delete cleanH.id;
          const newHabit: Habit = {
            frequency_type: "harian",
            frequency_target: 1,
            preferred_time: "07:00",
            is_active: true,
            created_at: new Date().toISOString(),
            icon: "✨",
            color: "lilac",
            ...cleanH,
            id: newId,
          };
          return {
            ...d,
            habits: [...d.habits, newHabit],
          };
        }),
      deleteHabit: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => {
          const logIds = d.habitLogs.filter((l) => l.habit_id === id).map((l) => l.id);
          return {
            ...d,
            deleted_ids: [...(d.deleted_ids || []), id, ...logIds],
            habits: d.habits.filter((h) => h.id !== id),
            habitLogs: d.habitLogs.filter((l) => l.habit_id !== id),
          };
        });
      },

      saveSchedule: (s: Partial<Schedule> & { title: string; start_at: string }) =>
        update((d) => {
          const validId = s.id && typeof s.id === "string" && s.id !== "undefined" ? s.id : null;
          if (validId) {
            return {
              ...d,
              schedules: d.schedules
                .map((x) =>
                  x.id === validId
                    ? ({
                      ...x,
                      ...s,
                      id: validId,
                      status: x.status === "terlewat" ? "terjadwal" : (s.status || x.status),
                    } as Schedule)
                    : x
                )
                .map((x) => ({ ...x, status: effectiveStatus(x) })),
            };
          }
          const newId = uid();
          const cleanS = { ...s };
          delete cleanS.id;
          const newSchedule: Schedule = {
            notes: "",
            status: "terjadwal",
            icon: "📌",
            color: "sky",
            ...cleanS,
            id: newId,
          };
          return {
            ...d,
            schedules: [...d.schedules, { ...newSchedule, status: effectiveStatus(newSchedule) }],
          };
        }),
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
      deleteSchedule: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => ({
          ...d,
          deleted_ids: [...(d.deleted_ids || []), id],
          schedules: d.schedules.filter((s) => s.id !== id),
        }));
      },

      saveGoal: (g: Partial<Goal> & { title: string }, stepTitles?: string[]) =>
        update((d) => {
          const validId = g.id && typeof g.id === "string" && g.id !== "undefined" ? g.id : null;
          if (validId) {
            return {
              ...d,
              goals: d.goals.map((x) => (x.id === validId ? ({ ...x, ...g, id: validId } as Goal) : x)),
            };
          }
          const id = uid();
          const cleanG = { ...g };
          delete cleanG.id;
          const goal: Goal = {
            reason: "",
            target_date: ymd(addDays(startOfDay(new Date()), 30)),
            progress: 0,
            status: "aktif",
            created_at: new Date().toISOString(),
            color: "lilac",
            ...cleanG,
            id,
          };
          const steps: GoalStep[] = (stepTitles || []).filter(Boolean).map((t, i) => ({
            id: uid(),
            goal_id: id,
            title: t,
            is_done: false,
            order_index: i,
          }));
          return { ...d, goals: [goal, ...d.goals], steps: [...d.steps, ...steps] };
        }),
      setGoalStatus: (id: string, status: Goal["status"]) =>
        update((d) => ({
          ...d,
          goals: d.goals.map((g) =>
            g.id === id ? { ...g, status, completed_at: status === "selesai" ? new Date().toISOString() : g.completed_at, progress: status === "selesai" ? 100 : g.progress } : g
          ),
        })),
      deleteGoal: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => {
          const stepIds = d.steps.filter((s) => s.goal_id === id).map((s) => s.id);
          return {
            ...d,
            deleted_ids: [...(d.deleted_ids || []), id, ...stepIds],
            goals: d.goals.filter((g) => g.id !== id),
            steps: d.steps.filter((s) => s.goal_id !== id),
          };
        });
      },
      addStep: (goalId: string, title: string) =>
        update((d) => ({ ...d, steps: [...d.steps, { id: uid(), goal_id: goalId, title, is_done: false, order_index: d.steps.length }] })),
      toggleStep: (id: string) =>
        update((d) => ({
          ...d,
          steps: d.steps.map((s) => (s.id === id ? { ...s, is_done: !s.is_done, done_at: !s.is_done ? new Date().toISOString() : undefined } : s)),
        })),
      deleteStep: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => ({
          ...d,
          deleted_ids: [...(d.deleted_ids || []), id],
          steps: d.steps.filter((s) => s.id !== id),
        }));
      },

      // ---- Aksi To-Do Project & Task ----
      saveProject: (p: Partial<Project> & { name: string }, initialTasks?: string[]) =>
        update((d) => {
          const validId = p.id && typeof p.id === "string" && p.id !== "undefined" ? p.id : null;
          if (validId) {
            return {
              ...d,
              projects: (d.projects || []).map((x) => (x.id === validId ? ({ ...x, ...p, id: validId } as Project) : x)),
            };
          }
          const id = uid();
          const cleanP = { ...p };
          delete cleanP.id;
          const nowIso = new Date().toISOString();
          const project: Project = {
            description: "",
            category: "Kerja",
            status: "aktif",
            icon: "🚀",
            color: "sky",
            created_at: nowIso,
            ...cleanP,
            id,
          };
          const newTasks: ProjectTask[] = (initialTasks || [])
            .map((t) => t.trim())
            .filter(Boolean)
            .map((title, idx) => ({
              id: uid(),
              project_id: id,
              title,
              priority: "sedang" as TaskPriority,
              status: "todo",
              is_done: false,
              order_index: idx,
              created_at: nowIso,
            }));
          return {
            ...d,
            projects: [project, ...(d.projects || [])],
            projectTasks: [...(d.projectTasks || []), ...newTasks],
          };
        }),
      setProjectStatus: (id: string, status: ProjectStatus) =>
        update((d) => ({
          ...d,
          projects: (d.projects || []).map((p) =>
            p.id === id
              ? {
                  ...p,
                  status,
                  completed_at: status === "selesai" ? new Date().toISOString() : p.completed_at,
                }
              : p
          ),
        })),
      deleteProject: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => {
          const taskIds = (d.projectTasks || []).filter((t) => t.project_id === id).map((t) => t.id);
          return {
            ...d,
            deleted_ids: [...(d.deleted_ids || []), id, ...taskIds],
            projects: (d.projects || []).filter((p) => p.id !== id),
            projectTasks: (d.projectTasks || []).filter((t) => t.project_id !== id),
          };
        });
      },
      addProjectTask: (
        projectId: string,
        task: { title: string; priority?: TaskPriority; due_date?: string; notes?: string }
      ) => {
        if (!task.title.trim()) return;
        const nowIso = new Date().toISOString();
        update((d) => ({
          ...d,
          projectTasks: [
            ...(d.projectTasks || []),
            {
              id: uid(),
              project_id: projectId,
              title: task.title.trim(),
              notes: task.notes,
              priority: task.priority || "sedang",
              status: "todo",
              is_done: false,
              due_date: task.due_date,
              order_index: (d.projectTasks || []).length,
              created_at: nowIso,
            },
          ],
        }));
      },
      updateProjectTask: (id: string, patch: Partial<ProjectTask>) =>
        update((d) => ({
          ...d,
          projectTasks: (d.projectTasks || []).map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...patch };
            if (patch.status !== undefined) {
              next.is_done = patch.status === "selesai";
              next.completed_at = next.is_done ? new Date().toISOString() : undefined;
            }
            return next;
          }),
        })),
      toggleProjectTask: (id: string) =>
        update((d) => ({
          ...d,
          projectTasks: (d.projectTasks || []).map((t) => {
            if (t.id !== id) return t;
            const nextDone = !t.is_done;
            return {
              ...t,
              is_done: nextDone,
              status: nextDone ? "selesai" : "todo",
              completed_at: nextDone ? new Date().toISOString() : undefined,
            };
          }),
        })),
      deleteProjectTask: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => ({
          ...d,
          deleted_ids: [...(d.deleted_ids || []), id],
          projectTasks: (d.projectTasks || []).filter((t) => t.id !== id),
        }));
      },

      addTransaction: (t: Omit<Transaction, "id">) => {
        const id = uid();
        update((d) => ({ ...d, transactions: [...d.transactions, { ...t, id }] }));
        toast(t.type === "pemasukan" ? "Pemasukan tercatat." : "Pengeluaran tercatat.", () =>
          update((d) => ({
            ...d,
            deleted_ids: [...(d.deleted_ids || []), id],
            transactions: d.transactions.filter((x) => x.id !== id),
          }))
        );
      },
      deleteTransaction: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => ({
          ...d,
          deleted_ids: [...(d.deleted_ids || []), id],
          transactions: d.transactions.filter((t) => t.id !== id),
        }));
      },
      addCategory: (c: Omit<Category, "id">) => update((d) => ({ ...d, categories: [...d.categories, { ...c, id: uid() }] })),

      // ---- Aksi Kebugaran & Olahraga ----
      addWorkout: (w: Omit<WorkoutLog, "id" | "created_at">) => {
        const id = uid();
        const created_at = new Date().toISOString();
        update((d) => ({
          ...d,
          workouts: [...(d.workouts || []), { ...w, id, created_at }],
        }));
        toast(`Olahraga "${w.activity}" (${w.duration_minutes} mnt) tercatat! 🔥`);
      },
      deleteWorkout: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => ({
          ...d,
          deleted_ids: [...(d.deleted_ids || []), id],
          workouts: (d.workouts || []).filter((w) => w.id !== id),
        }));
      },
      addCalorie: (c: Omit<CalorieLog, "id" | "created_at">) => {
        const id = uid();
        const created_at = new Date().toISOString();
        update((d) => ({
          ...d,
          calories: [...(d.calories || []), { ...c, id, created_at }],
        }));
        toast(`${c.food_name} (+${c.calories} kcal) tercatat! 🥗`);
      },
      deleteCalorie: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => ({
          ...d,
          deleted_ids: [...(d.deleted_ids || []), id],
          calories: (d.calories || []).filter((c) => c.id !== id),
        }));
      },
      addWeight: (w: Omit<WeightLog, "id" | "created_at">) => {
        const id = uid();
        const created_at = new Date().toISOString();
        update((d) => ({
          ...d,
          weights: [
            ...(d.weights || []).filter((x) => x.date !== w.date),
            { ...w, id, created_at },
          ].sort((a, b) => b.date.localeCompare(a.date)),
        }));
        toast(`Timbangan ${w.weight_kg} kg berhasil dicatat! ⚖️`);
      },
      deleteWeight: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => ({
          ...d,
          deleted_ids: [...(d.deleted_ids || []), id],
          weights: (d.weights || []).filter((w) => w.id !== id),
        }));
      },
      addWater: (amount_ml = 250, date = ymd(new Date())) => {
        const id = uid();
        const created_at = new Date().toISOString();
        update((d) => ({
          ...d,
          waterLogs: [...(d.waterLogs || []), { id, date, amount_ml, created_at }],
        }));
        toast(`+${amount_ml}ml air minum tercatat! 💧`);
      },
      deleteWater: (id: string) => {
        if (!id || id === "undefined") return;
        update((d) => ({
          ...d,
          deleted_ids: [...(d.deleted_ids || []), id],
          waterLogs: (d.waterLogs || []).filter((w) => w.id !== id),
        }));
      },
      updateFitnessProfile: (p: Partial<FitnessProfile>) => {
        update((d) => ({
          ...d,
          fitnessProfile: {
            target_calories: 2000,
            target_weight_kg: 65,
            height_cm: 170,
            daily_water_target_ml: 2000,
            weekly_workout_target_minutes: 150,
            ...(d.fitnessProfile || {}),
            ...p,
          },
        }));
        toast("Target kebugaran diperbarui.");
      },

      readReminder: (id: string) => update((d) => ({ ...d, reminders: d.reminders.map((r) => (r.id === id ? { ...r, is_read: true } : r)) })),
      readAll: () => update((d) => ({ ...d, reminders: d.reminders.map((r) => ({ ...r, is_read: true })) })),

      saveReflection: (r: Omit<Reflection, "id" | "created_at">) =>
        update((d) => {
          const ex = d.reflections.find((x) => x.week_start === r.week_start);
          return ex
            ? { ...d, reflections: d.reflections.map((x) => (x.week_start === r.week_start ? { ...x, ...r } : x)) }
            : { ...d, reflections: [{ ...r, id: uid(), created_at: new Date().toISOString() }, ...d.reflections] };
        }),

      // ---- Aksi Journaling & Evaluasi Harian ----
      saveJournal: (
        j: Partial<DailyJournal> & { date: string; title?: string; mood?: JournalMood }
      ) => {
        const nowIso = new Date().toISOString();
        update((d) => {
          const list = d.journals || [];
          const existing = j.id
            ? list.find((x) => x.id === j.id)
            : list.find((x) => x.date === j.date);

          if (existing) {
            const updated: DailyJournal = {
              ...existing,
              ...j,
              id: existing.id,
              updated_at: nowIso,
            };
            return {
              ...d,
              journals: list.map((x) => (x.id === existing.id ? updated : x)),
            };
          }

          const created: DailyJournal = {
            id: uid(),
            date: j.date,
            mood: j.mood || "bersyukur",
            energy_level: typeof j.energy_level === "number" ? j.energy_level : 4,
            title: (j.title || "").trim() || `Jurnal Harian · ${j.date}`,
            gratitude: j.gratitude || "",
            wins: j.wins || "",
            challenges: j.challenges || "",
            tomorrow_focus: j.tomorrow_focus || "",
            content: j.content || "",
            tags: Array.isArray(j.tags) ? j.tags : ["Refleksi Harian"],
            color: j.color || "lilac",
            created_at: nowIso,
            updated_at: nowIso,
          };

          return {
            ...d,
            journals: [created, ...list].sort((a, b) => b.date.localeCompare(a.date)),
          };
        });
        toast("Jurnal & evaluasi harian tersimpan! 📔✨");
      },

      deleteJournal: (id: string) => {
        if (!id || id === "undefined") return;
        const target = (dataRef.current.journals || []).find((x) => x.id === id);
        update((d) => ({
          ...d,
          deleted_ids: [...(d.deleted_ids || []), id],
          journals: (d.journals || []).filter((x) => x.id !== id),
        }));
        if (target) {
          toast("Catatan jurnal dihapus.", () =>
            update((d) => ({
              ...d,
              deleted_ids: (d.deleted_ids || []).filter((x) => x !== id),
              journals: [target, ...(d.journals || [])].sort((a, b) => b.date.localeCompare(a.date)),
            }))
          );
        }
      },
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
    milestoneCelebration,
    dismissMilestone,
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
