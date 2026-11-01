import type { AppData, Category, Preferences } from "./types";
import { addDays, startOfDay, ymd, uid, startOfWeek } from "./dates";

export const defaultPrefs: Preferences = {
  timezone: "Asia/Jakarta", reminder_tone: "lembut", reminder_enabled: true,
  daily_budget: 100000, monthly_budget: 3000000, theme: "sistem", miss_threshold: 3,
};

export const defaultCategories = (): Category[] => [
  { id: "c-makan", name: "Makan", type: "pengeluaran", color: "peach", icon: "🍜" },
  { id: "c-transport", name: "Transport", type: "pengeluaran", color: "sky", icon: "🛵" },
  { id: "c-belanja", name: "Belanja", type: "pengeluaran", color: "rose", icon: "🛍️" },
  { id: "c-tagihan", name: "Tagihan", type: "pengeluaran", color: "lilac", icon: "🧾" },
  { id: "c-hiburan", name: "Hiburan", type: "pengeluaran", color: "butter", icon: "🎬" },
  { id: "c-sedekah", name: "Sedekah", type: "pengeluaran", color: "mint", icon: "🤲" },
  { id: "c-gaji", name: "Gaji", type: "pemasukan", color: "mint", icon: "💼" },
  { id: "c-freelance", name: "Freelance", type: "pemasukan", color: "sky", icon: "💻" },
  { id: "c-lain", name: "Lainnya", type: "pemasukan", color: "butter", icon: "✨" },
];

export const emptyData = (): AppData => ({
  version: 1, user: null, prefs: { ...defaultPrefs }, goals: [], steps: [], habits: [], habitLogs: [],
  schedules: [], categories: defaultCategories(), transactions: [], reminders: [], reflections: [],
});

/** pseudo-random deterministik */
const rng = (seed: number) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

export const demoData = (name: string, email: string): AppData => {
  const r = rng(42);
  const now = new Date();
  const today = startOfDay(now);
  const at = (dayOffset: number, h: number, m = 0) => { const d = addDays(today, dayOffset); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const created = addDays(today, -60).toISOString();
  const d = emptyData();
  d.user = { id: uid(), email, name, created_at: created };

  d.goals = [
    { id: "g1", title: "Bisa bikin web app sendiri", reason: "Supaya bisa jual jasa & produk digital tanpa bergantung orang lain.", target_date: ymd(addDays(today, 75)), progress: 0, status: "aktif", created_at: addDays(today, -30).toISOString(), color: "lilac" },
    { id: "g2", title: "Dana darurat Rp10 juta", reason: "Biar tenang kalau ada kejadian tak terduga.", target_date: ymd(addDays(today, 150)), progress: 0, status: "aktif", created_at: addDays(today, -40).toISOString(), color: "mint" },
    { id: "g3", title: "Khatam Al-Qur'an bulan ini", reason: "Menjaga kedekatan dan ketenangan hati.", target_date: ymd(addDays(today, 24)), progress: 0, status: "aktif", created_at: addDays(today, -6).toISOString(), color: "butter" },
    { id: "g0", title: "Rutin lari 5K", reason: "Badan lebih bugar untuk kerja.", target_date: ymd(addDays(today, -10)), progress: 100, status: "selesai", created_at: addDays(today, -90).toISOString(), completed_at: addDays(today, -12).toISOString(), color: "peach" },
  ];
  const steps: [string, string, boolean][] = [
    ["g1", "Selesaikan PRD aplikasi pertama", true], ["g1", "Pelajari dasar Antigravity", true], ["g1", "Bikin UI dashboard", true],
    ["g1", "Sambungkan database & login", false], ["g1", "Integrasi pembayaran", false], ["g1", "Deploy & cari 3 pengguna pertama", false],
    ["g2", "Buka rekening khusus tabungan", true], ["g2", "Autodebet Rp1 juta tiap gajian", true], ["g2", "Kumpulkan Rp5 juta", false], ["g2", "Kumpulkan Rp10 juta", false],
    ["g3", "Juz 1–5", true], ["g3", "Juz 6–10", false], ["g3", "Juz 11–20", false], ["g3", "Juz 21–30", false],
  ];
  d.steps = steps.map(([g, t, done], i) => ({ id: "st" + i, goal_id: g, title: t, is_done: done, order_index: i, done_at: done ? addDays(today, -i).toISOString() : undefined }));

  d.habits = [
    { id: "h1", name: "Sholat Subuh tepat waktu", frequency_type: "harian", frequency_target: 1, preferred_time: "04:40", is_active: true, created_at: created, icon: "🌙", color: "lilac" },
    { id: "h2", name: "Baca buku 15 menit", frequency_type: "harian", frequency_target: 1, preferred_time: "21:00", is_active: true, created_at: created, icon: "📖", color: "sky" },
    { id: "h3", name: "Minum air 8 gelas", frequency_type: "harian", frequency_target: 1, preferred_time: "12:00", is_active: true, created_at: created, icon: "💧", color: "mint" },
    { id: "h4", name: "Tilawah 1 juz", frequency_type: "harian", frequency_target: 1, preferred_time: "19:30", is_active: true, created_at: addDays(today, -6).toISOString(), icon: "📿", color: "butter" },
    { id: "h5", name: "Olahraga 30 menit", frequency_type: "mingguan", frequency_target: 3, preferred_time: "06:00", is_active: true, created_at: created, icon: "🏃", color: "peach" },
    { id: "h6", name: "Belajar ngoding 1 jam", frequency_type: "mingguan", frequency_target: 5, preferred_time: "20:00", is_active: true, created_at: created, icon: "💻", color: "rose" },
  ];
  const rate: Record<string, number> = { h1: 0.88, h2: 0.55, h3: 0.8, h4: 0.85, h5: 0.45, h6: 0.7 };
  for (let i = 1; i <= 60; i++) {
    const day = addDays(today, -i);
    for (const h of d.habits) {
      if (day < startOfDay(new Date(h.created_at))) continue;
      let p = rate[h.id];
      if (h.id === "h2" && i <= 7) p = i === 2 || i === 5 ? 1 : 0; // baca: sering terlewat minggu ini → teguran
      if (h.id === "h1" && i <= 9) p = 1; // runutan subuh panjang
      if (r() < p) d.habitLogs.push({ id: uid(), habit_id: h.id, log_date: ymd(day), is_done: true });
    }
  }
  d.habitLogs.push({ id: uid(), habit_id: "h1", log_date: ymd(today), is_done: true });
  // olahraga minggu ini 1x
  const ws = startOfWeek(today);
  if (ymd(ws) !== ymd(today)) d.habitLogs = d.habitLogs.filter((l) => !(l.habit_id === "h5" && l.log_date >= ymd(ws)));
  if (ymd(ws) !== ymd(today)) d.habitLogs.push({ id: uid(), habit_id: "h5", log_date: ymd(ws), is_done: true });

  const sch = (o: number, h: number, m: number, dur: number, title: string, notes: string, icon: string, color: any, status: any = "terjadwal") => {
    const s = at(o, h, m); const e = new Date(new Date(s).getTime() + dur * 60000).toISOString();
    d.schedules.push({ id: uid(), title, notes, start_at: s, end_at: e, status, icon, color, completed_at: status === "selesai" ? e : undefined });
  };
  sch(0, 5, 0, 30, "Kajian pagi & dzikir", "Di mushola dekat rumah", "🕌", "lilac", "selesai");
  sch(0, 9, 0, 90, "Rapihin UI dashboard", "Fokus bagian kartu statistik", "🎨", "sky");
  sch(0, 13, 0, 60, "Belanja mingguan", "Sayur, buah, galon", "🛒", "mint");
  sch(0, 16, 0, 60, "Review keuangan pekan ini", "Cek batas belanja & tabungan", "📊", "butter");
  sch(0, 20, 0, 45, "Tulis refleksi mingguan", "Apa yang berhasil, apa yang diubah", "📝", "rose");
  sch(-1, 10, 0, 60, "Video call klien", "Bahas revisi landing page", "📞", "peach", "selesai");
  sch(-1, 15, 30, 60, "Setor hafalan", "", "📿", "butter");
  sch(-2, 19, 0, 90, "Belajar Supabase Auth", "Ikuti tutorial resmi", "💻", "sky", "selesai");
  sch(-3, 8, 0, 60, "Lari pagi", "", "🏃", "peach", "selesai");
  sch(1, 8, 30, 60, "Kelas online: Prompt Engineering", "Zoom, link di email", "🧠", "lilac");
  sch(1, 19, 30, 60, "Arisan keluarga", "Bawa kue", "🍰", "rose");
  sch(3, 10, 0, 120, "Deadline mockup klien", "Kirim lewat email", "⏰", "peach");
  sch(5, 7, 0, 60, "Kerja bakti RT", "", "🧹", "mint");
  sch(8, 9, 0, 60, "Bayar tagihan listrik & internet", "", "🧾", "butter");
  const pool: [string, string, any][] = [["Belajar ngoding", "💻", "sky"], ["Rapat klien", "📞", "peach"], ["Kajian rutin", "🕌", "lilac"], ["Lari pagi", "🏃", "mint"], ["Kerjakan proyek freelance", "🎨", "rose"], ["Belanja bulanan", "🛒", "butter"]];
  for (let w = 1; w <= 8; w++) {
    const n = 4 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const wsOff = -((today.getDay() + 6) % 7); const off = wsOff - 7 * w + Math.floor(r() * 7); const [t, ic, c] = pool[Math.floor(r() * pool.length)];
      sch(off, 8 + Math.floor(r() * 11), 0, 60, t, "", ic, c, r() < 0.78 ? "selesai" : "terlewat");
    }
  }

  const tx = (o: number, h: number, cat: string, amount: number, note: string) => {
    const c = d.categories.find((x) => x.id === cat)!;
    d.transactions.push({ id: uid(), category_id: cat, type: c.type, amount, note, occurred_at: at(o, h) });
  };
  const dom = now.getDate();
  tx(-(dom - 1), 9, "c-gaji", 6500000, "Gaji bulan ini");
  tx(-(dom - 1) - 30, 9, "c-gaji", 6500000, "Gaji bulan lalu");
  tx(-12, 14, "c-freelance", 1500000, "Landing page UMKM");
  tx(-dom, 10, "c-tagihan", 1200000, "Kos");
  tx(-dom - 30, 10, "c-tagihan", 1200000, "Kos");
  for (let i = 1; i <= 34; i++) {
    tx(-i, 12, "c-makan", 18000 + Math.round(r() * 30) * 1000, "Makan siang");
    if (r() < 0.6) tx(-i, 8, "c-transport", 10000 + Math.round(r() * 15) * 1000, "Ojol");
    if (r() < 0.2) tx(-i, 19, "c-belanja", 50000 + Math.round(r() * 150) * 1000, "Belanja kebutuhan");
    if (r() < 0.12) tx(-i, 20, "c-hiburan", 40000 + Math.round(r() * 60) * 1000, "Nonton / langganan");
    if (i % 7 === 5) tx(-i, 12, "c-sedekah", 50000, "Infaq Jumat");
  }
  tx(0, 7, "c-makan", 22000, "Sarapan bubur");
  tx(0, 8, "c-transport", 15000, "Ojol ke kajian");

  d.reflections = [{
    id: uid(), week_start: ymd(addDays(ws, -7)),
    learned: "Ternyata pagi hari paling fokus. Subuh tepat waktu bikin seluruh hari lebih teratur.",
    to_improve: "Kurangi scroll HP malam supaya baca buku tetap jalan.", created_at: addDays(ws, -1).toISOString(),
  }];
  return d;
};
