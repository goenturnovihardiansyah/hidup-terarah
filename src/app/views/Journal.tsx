import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  NotebookPen,
  Pencil,
  Save,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import { useStore } from "../store";
import { PageHead, Panel, TINTS, tintBg, Empty, ConfirmButton } from "../ui";
import { addDays, fmtDateLong, fmtDateShort, parseYmd, rupiah, startOfDay, ymd } from "../dates";
import { habitsForToday, isDone } from "../logic";
import { getDailyReflectionQuote } from "../quotes";
import type { DailyJournal, JournalMood, Tint } from "../types";
import { cn } from "@/lib/utils";

const MOOD_OPTIONS: {
  value: JournalMood;
  emoji: string;
  label: string;
  desc: string;
  tint: Tint;
}[] = [
  {
    value: "bersyukur",
    emoji: "🌟",
    label: "Bersyukur & Penuh Semangat",
    desc: "Hati lapang, bersyukur, dan berenergi positif",
    tint: "emerald",
  },
  {
    value: "tenang",
    emoji: "😊",
    label: "Tenang & Produktif",
    desc: "Fokus terjaga dan hari berjalan terarah",
    tint: "sky",
  },
  {
    value: "biasa",
    emoji: "🙂",
    label: "Stabil / Biasa Saja",
    desc: "Hari berjalan normal dengan ritme standar",
    tint: "butter",
  },
  {
    value: "lelah",
    emoji: "😮‍💨",
    label: "Lelah / Butuh Istirahat",
    desc: "Energi terkuras, perlu jeda dan pemulihan",
    tint: "peach",
  },
  {
    value: "berat",
    emoji: "🌧️",
    label: "Berat / Overwhelmed",
    desc: "Banyak pikiran atau tantangan, butuh evaluasi tenang",
    tint: "rose",
  },
];

const PRESET_TAGS = [
  "Syukur",
  "Ibadah",
  "Pekerjaan",
  "Kesehatan",
  "Keluarga",
  "Mindset",
  "Keuangan",
  "Belajar",
];

export const Journal = () => {
  const s = useStore();
  const { data, now } = s;
  const todayStr = ymd(now);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState<JournalMood | "semua">("semua");
  const [filterTag, setFilterTag] = useState<string>("semua");
  const [autoCheckHabit, setAutoCheckHabit] = useState(true);

  const journals = useMemo(
    () => [...(data.journals || [])].sort((a, b) => b.date.localeCompare(a.date)),
    [data.journals]
  );

  const currentEntry = useMemo(
    () => journals.find((j) => j.date === selectedDate) || null,
    [journals, selectedDate]
  );

  // State form evaluasi & jurnal harian
  const [mood, setMood] = useState<JournalMood>("bersyukur");
  const [energy, setEnergy] = useState<number>(4);
  const [title, setTitle] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [tomorrowFocus, setTomorrowFocus] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>(["Syukur"]);
  const [color, setColor] = useState<Tint>("lilac");

  // Sinkronkan form saat tanggal berubah atau data jurnal ditemukan
  useEffect(() => {
    if (currentEntry) {
      setMood(currentEntry.mood || "bersyukur");
      setEnergy(currentEntry.energy_level || 4);
      setTitle(currentEntry.title || "");
      setGratitude(currentEntry.gratitude || "");
      setWins(currentEntry.wins || "");
      setChallenges(currentEntry.challenges || "");
      setTomorrowFocus(currentEntry.tomorrow_focus || "");
      setContent(currentEntry.content || "");
      setTags(Array.isArray(currentEntry.tags) && currentEntry.tags.length > 0 ? currentEntry.tags : ["Syukur"]);
      setColor(currentEntry.color || "lilac");
    } else {
      setMood("bersyukur");
      setEnergy(4);
      setTitle("");
      setGratitude("");
      setWins("");
      setChallenges("");
      setTomorrowFocus("");
      setContent("");
      setTags(["Syukur"]);
      setColor("lilac");
    }
  }, [selectedDate, currentEntry?.id, currentEntry?.updated_at]);

  const refQuote = useMemo(() => getDailyReflectionQuote(parseYmd(selectedDate)), [selectedDate]);

  // Kebiasaan yang berhubungan dengan Journaling / Syukur
  const journalingHabit = useMemo(
    () =>
      data.habits.find(
        (h) =>
          h.is_active &&
          (h.name.toLowerCase().includes("journal") ||
            h.name.toLowerCase().includes("jurnal") ||
            h.name.toLowerCase().includes("syukur"))
      ) || null,
    [data.habits]
  );

  const isJournalingHabitDoneOnDate = useMemo(() => {
    if (!journalingHabit) return false;
    return isDone(data, journalingHabit.id, selectedDate);
  }, [data, journalingHabit, selectedDate]);

  // Potret aktivitas otomatis pada tanggal terpilih
  const daySnapshot = useMemo(() => {
    const activeHabits = habitsForToday(data);
    const doneHabits = activeHabits.filter((h) => isDone(data, h.id, selectedDate));
    const daySchedules = data.schedules.filter((sch) => sch.start_at.slice(0, 10) === selectedDate);
    const doneSchedules = daySchedules.filter((sch) => sch.status === "selesai");
    const dayWorkouts = (data.workouts || []).filter((w) => w.date === selectedDate);
    const totalWorkoutMin = dayWorkouts.reduce((acc, w) => acc + (w.duration_minutes || 0), 0);
    const totalBurned = dayWorkouts.reduce((acc, w) => acc + (w.calories_burned || 0), 0);
    const dayTx = data.transactions.filter((t) => t.occurred_at.slice(0, 10) === selectedDate);
    const spent = dayTx.filter((t) => t.type === "pengeluaran").reduce((acc, t) => acc + t.amount, 0);

    return {
      activeHabitsCount: activeHabits.length,
      doneHabits,
      daySchedules,
      doneSchedulesCount: doneSchedules.length,
      dayWorkouts,
      totalWorkoutMin,
      totalBurned,
      spent,
    };
  }, [data, selectedDate]);

  // Hitung statistik journaling (streak, rata-rata energi, total)
  const stats = useMemo(() => {
    const dateSet = new Set(journals.map((j) => j.date));
    let streakCount = 0;
    let cursor = startOfDay(now);
    if (!dateSet.has(ymd(cursor))) {
      cursor = addDays(cursor, -1);
    }
    while (dateSet.has(ymd(cursor))) {
      streakCount++;
      cursor = addDays(cursor, -1);
    }

    const avgEnergy =
      journals.length > 0
        ? (journals.reduce((acc, j) => acc + (j.energy_level || 4), 0) / journals.length).toFixed(1)
        : "0.0";

    const todayDone = dateSet.has(todayStr);

    return {
      total: journals.length,
      streakCount,
      avgEnergy,
      todayDone,
    };
  }, [journals, now, todayStr]);

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle =
      title.trim() ||
      (gratitude.trim()
        ? gratitude.trim().split("\n")[0].slice(0, 60)
        : `Evaluasi Harian · ${fmtDateShort(parseYmd(selectedDate))}`);

    s.saveJournal({
      ...(currentEntry?.id ? { id: currentEntry.id } : {}),
      date: selectedDate,
      mood,
      energy_level: energy,
      title: cleanTitle,
      gratitude: gratitude.trim(),
      wins: wins.trim(),
      challenges: challenges.trim(),
      tomorrow_focus: tomorrowFocus.trim(),
      content: content.trim(),
      tags: tags.length > 0 ? tags : ["Refleksi Harian"],
      color,
    });

    // Jika kebiasaan Bersyukur & Journaling belum dicentang pada tanggal tersebut dan opsi aktif, centang otomatis
    if (autoCheckHabit && journalingHabit && !isJournalingHabitDoneOnDate) {
      s.toggleHabit(journalingHabit, selectedDate);
    }
  };

  const filteredJournals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return journals.filter((j) => {
      if (filterMood !== "semua" && j.mood !== filterMood) return false;
      if (filterTag !== "semua" && !(j.tags || []).includes(filterTag)) return false;
      if (!q) return true;
      const haystack = [
        j.title,
        j.gratitude,
        j.wins,
        j.challenges,
        j.tomorrow_focus,
        j.content,
        ...(j.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [journals, searchQuery, filterMood, filterTag]);

  const isSelectedToday = selectedDate === todayStr;

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Jurnal & Evaluasi Harian"
        title="Journaling Harian"
        text="Luangkan 3 menit setiap hari untuk bersyukur, mengevaluasi langkah hari ini, dan menata niat untuk esok hari."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {!isSelectedToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="btn btn-ghost text-xs font-bold"
              >
                Kembali ke Hari Ini
              </button>
            )}
            <button
              type="button"
              onClick={() => s.setView("evaluasi")}
              className="btn btn-ghost text-xs font-bold"
            >
              Lihat Evaluasi Mingguan →
            </button>
          </div>
        }
      />

      {/* Ringkasan Statistik Journaling */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card flex items-center gap-3.5 p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-lilac-bg text-lilac">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-mute">Total Jurnal</p>
            <p className="font-display text-2xl font-bold text-ink">{stats.total} Hari</p>
          </div>
        </div>

        <div className="card flex items-center gap-3.5 p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-peach-bg text-coral">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-mute">Streak Jurnal</p>
            <p className="font-display text-2xl font-bold text-ink">{stats.streakCount} Hari</p>
          </div>
        </div>

        <div className="card flex items-center gap-3.5 p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-butter-bg text-amber">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-mute">Rata-rata Energi</p>
            <p className="font-display text-2xl font-bold text-ink">{stats.avgEnergy} / 5</p>
          </div>
        </div>

        <div className="card flex items-center gap-3.5 p-4">
          <div
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-[14px]",
              stats.todayDone ? "bg-mint-bg text-mint" : "bg-rose-bg text-coral"
            )}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-mute">Evaluasi Hari Ini</p>
            <p className="font-display text-base font-bold text-ink">
              {stats.todayDone ? "Sudah Tertulis ✨" : "Belum Ditulis"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigasi Tanggal Harian */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Hari sebelumnya"
            onClick={() => setSelectedDate(ymd(addDays(parseYmd(selectedDate), -1)))}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface transition hover:bg-surface2"
          >
            <ChevronLeft size={17} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-ink">
                {fmtDateLong(parseYmd(selectedDate))}
              </span>
              {isSelectedToday && (
                <span className="rounded-full bg-brandsoft px-2.5 py-0.5 text-[11px] font-bold text-brand">
                  Hari Ini
                </span>
              )}
              {currentEntry && (
                <span className="rounded-full bg-mint-bg px-2.5 py-0.5 text-[11px] font-bold text-mint">
                  ✓ Tersimpan
                </span>
              )}
            </div>
            <p className="text-xs text-mute">
              Pilih tanggal untuk menulis atau melihat kembali evaluasi harianmu.
            </p>
          </div>
          <button
            type="button"
            aria-label="Hari berikutnya"
            disabled={selectedDate >= todayStr}
            onClick={() => setSelectedDate(ymd(addDays(parseYmd(selectedDate), 1)))}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface transition hover:bg-surface2 disabled:opacity-30"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-mute" />
          <input
            type="date"
            max={todayStr}
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="field h-9 w-auto py-1 text-xs font-semibold"
            aria-label="Pilih tanggal jurnal"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        {/* Kolom Kiri: Form Journaling & Evaluasi Harian */}
        <div className="space-y-5 xl:col-span-7">
          <Panel
            title={currentEntry ? "Edit Jurnal & Evaluasi Harian" : "Tulis Jurnal & Evaluasi Harian"}
            sub={`Catatan refleksi jujur untuk tanggal ${fmtDateShort(parseYmd(selectedDate))}`}
          >
            {/* Kutipan Inspirasi Harian */}
            <div className="mb-5 rounded-[18px] border border-line bg-gradient-to-r from-butter-bg via-peach-bg to-rose-bg p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-coral">
                ✨ Renungan Harian · {refQuote.author} ({refQuote.role})
              </p>
              <p className="mt-1 font-display text-sm font-semibold italic text-ink">
                “{refQuote.quote}”
              </p>
              <p className="mt-1 text-xs text-ink2">{refQuote.advice}</p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Pemilih Mood Harian */}
              <div>
                <label className="label">1. Bagaimana perasaan & suasana hatimu hari ini?</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                  {MOOD_OPTIONS.map((m) => {
                    const active = mood === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMood(m.value)}
                        className={cn(
                          "flex flex-row items-center gap-2.5 rounded-[16px] border p-3 text-left transition sm:flex-col sm:items-center sm:text-center",
                          active
                            ? cn("border-ink ring-2 ring-brand/25 shadow-sm", tintBg[m.tint])
                            : "border-line bg-surface hover:bg-surface2"
                        )}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-ink leading-tight">{m.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tingkat Energi & Highlight */}
              <div className="grid gap-4 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="label">2. Skor Energi & Fokus ({energy}/5)</label>
                  <div className="flex h-11 items-center justify-between rounded-[14px] border border-line bg-surface2 px-3">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setEnergy(lvl)}
                        aria-label={`Energi ${lvl}`}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition",
                          lvl <= energy
                            ? "bg-amber text-white shadow-sm scale-105"
                            : "text-mute hover:bg-surface"
                        )}
                      >
                        <Star size={15} fill={lvl <= energy ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-7">
                  <label className="label" htmlFor="jr-title">
                    Judul / Highlight Hari Ini
                  </label>
                  <input
                    id="jr-title"
                    className="field"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: Alhamdulillah produktif & olahraga pagi"
                  />
                </div>
              </div>

              {/* 4 Pilar Evaluasi Harian */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border border-line bg-mint-bg/40 p-3.5">
                  <label className="label flex items-center gap-1.5 text-ink" htmlFor="jr-gratitude">
                    <Heart size={14} className="text-mint" /> Hal yang Disyukuri Hari Ini
                  </label>
                  <textarea
                    id="jr-gratitude"
                    rows={3}
                    className="field mt-1 bg-surface resize-none text-sm"
                    value={gratitude}
                    onChange={(e) => setGratitude(e.target.value)}
                    placeholder="Tulis 1-3 nikmat atau hal kecil yang kamu syukuri hari ini..."
                  />
                </div>

                <div className="rounded-[18px] border border-line bg-sky-bg/40 p-3.5">
                  <label className="label flex items-center gap-1.5 text-ink" htmlFor="jr-wins">
                    <Sparkles size={14} className="text-sky" /> Evaluasi: Apa yang Berhasil Hari Ini?
                  </label>
                  <textarea
                    id="jr-wins"
                    rows={3}
                    className="field mt-1 bg-surface resize-none text-sm"
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                    placeholder="Kebiasaan yang terjaga, pekerjaan yang selesai, atau kemenangan kecil..."
                  />
                </div>

                <div className="rounded-[18px] border border-line bg-peach-bg/40 p-3.5">
                  <label className="label flex items-center gap-1.5 text-ink" htmlFor="jr-challenges">
                    <NotebookPen size={14} className="text-coral" /> Evaluasi: Apa yang Perlu Diperbaiki?
                  </label>
                  <textarea
                    id="jr-challenges"
                    rows={3}
                    className="field mt-1 bg-surface resize-none text-sm"
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="Kendala, distraksi, atau hal yang kurang maksimal hari ini..."
                  />
                </div>

                <div className="rounded-[18px] border border-line bg-lilac-bg/40 p-3.5">
                  <label className="label flex items-center gap-1.5 text-ink" htmlFor="jr-tomorrow">
                    <Target size={14} className="text-lilac" /> Fokus & Prioritas Utama Besok
                  </label>
                  <textarea
                    id="jr-tomorrow"
                    rows={3}
                    className="field mt-1 bg-surface resize-none text-sm"
                    value={tomorrowFocus}
                    onChange={(e) => setTomorrowFocus(e.target.value)}
                    placeholder="Satu atau dua langkah terpenting yang ingin dituntaskan besok..."
                  />
                </div>
              </div>

              {/* Catatan Bebas / Curahan Hati */}
              <div>
                <label className="label" htmlFor="jr-content">
                  Catatan Bebas / Cerita Hari Ini (Opsional)
                </label>
                <textarea
                  id="jr-content"
                  rows={4}
                  className="field resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan cerita, ide baru, pelajaran hidup, atau doa yang ingin kamu abadikan hari ini..."
                />
              </div>

              {/* Tag & Warna */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="label">Tag Topik Jurnal</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((t) => {
                      const active = tags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          className="chip text-xs"
                          data-on={active}
                        >
                          #{t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="label">Warna Kartu Jurnal</span>
                  <div className="flex flex-wrap gap-2">
                    {TINTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-label={`Warna ${t}`}
                        onClick={() => setColor(t)}
                        className={cn(
                          "h-7 w-7 rounded-full border-2 transition hover:scale-110",
                          tintBg[t],
                          color === t
                            ? "border-ink scale-110 shadow-sm ring-2 ring-brand/30"
                            : "border-transparent"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Integrasi Otomatis dengan Kebiasaan "Bersyukur dan Journaling" */}
              {journalingHabit && (
                <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-line bg-surface2 px-3.5 py-2.5 text-xs font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={autoCheckHabit || isJournalingHabitDoneOnDate}
                    disabled={isJournalingHabitDoneOnDate}
                    onChange={(e) => setAutoCheckHabit(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>
                    {isJournalingHabitDoneOnDate
                      ? `Kebiasaan "${journalingHabit.name}" sudah tercatat selesai pada tanggal ini ✅`
                      : `Otomatis tandai selesai kebiasaan "${journalingHabit.name}" saat jurnal disimpan`}
                  </span>
                </label>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                {currentEntry ? (
                  <ConfirmButton
                    className="btn btn-ghost text-xs text-coral"
                    confirmText="Yakin hapus jurnal tanggal ini?"
                    onConfirm={() => s.deleteJournal(currentEntry.id)}
                  >
                    <Trash2 size={14} /> Hapus Jurnal Ini
                  </ConfirmButton>
                ) : (
                  <span className="text-xs text-mute">
                    Tersimpan otomatis ke lokal & Cloud Turso.
                  </span>
                )}

                <button
                  type="submit"
                  disabled={
                    !title.trim() &&
                    !gratitude.trim() &&
                    !wins.trim() &&
                    !challenges.trim() &&
                    !tomorrowFocus.trim() &&
                    !content.trim()
                  }
                  className="btn btn-primary"
                >
                  <Save size={16} />{" "}
                  {currentEntry ? "Perbarui Jurnal Harian" : "Simpan Jurnal Harian"}
                </button>
              </div>
            </form>
          </Panel>
        </div>

        {/* Kolom Kanan: Potret Otomatis Hari Ini & Riwayat Jurnal */}
        <div className="space-y-5 xl:col-span-5">
          {/* Potret Aktivitas Otomatis Tanggal Terpilih */}
          <Panel
            title={`Potret Aktivitas · ${fmtDateShort(parseYmd(selectedDate))}`}
            sub="Rekap otomatis dari kebiasaan, agenda, olahraga, dan keuanganmu pada tanggal ini"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-[14px] bg-surface2 p-3">
                <p className="text-[11px] font-bold uppercase text-mute">Kebiasaan Selesai</p>
                <p className="mt-0.5 font-display text-xl font-bold text-ink">
                  {daySnapshot.doneHabits.length} / {daySnapshot.activeHabitsCount}
                </p>
              </div>
              <div className="rounded-[14px] bg-surface2 p-3">
                <p className="text-[11px] font-bold uppercase text-mute">Agenda Selesai</p>
                <p className="mt-0.5 font-display text-xl font-bold text-ink">
                  {daySnapshot.doneSchedulesCount} / {daySnapshot.daySchedules.length}
                </p>
              </div>
              <div className="rounded-[14px] bg-surface2 p-3">
                <p className="text-[11px] font-bold uppercase text-mute">Olahraga Hari Itu</p>
                <p className="mt-0.5 font-display text-xl font-bold text-ink">
                  {daySnapshot.totalWorkoutMin} mnt{" "}
                  <span className="text-xs font-semibold text-mute">
                    ({daySnapshot.totalBurned} kcal)
                  </span>
                </p>
              </div>
              <div className="rounded-[14px] bg-surface2 p-3">
                <p className="text-[11px] font-bold uppercase text-mute">Pengeluaran</p>
                <p className="mt-0.5 font-display text-xl font-bold text-ink">
                  {rupiah(daySnapshot.spent)}
                </p>
              </div>
            </div>

            {daySnapshot.doneHabits.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-bold text-ink2">
                  ✅ Kebiasaan yang sudah dituntaskan:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {daySnapshot.doneHabits.map((h) => (
                    <span
                      key={h.id}
                      className="inline-flex items-center gap-1 rounded-full bg-mint-bg px-2.5 py-1 text-xs font-semibold text-ink"
                    >
                      <span>{h.icon}</span> {h.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {/* Riwayat Jurnal Harian */}
          <Panel
            title={`Riwayat Jurnal (${journals.length})`}
            sub="Telusuri kembali perjalanan harian dan evaluasi dirimu"
          >
            <div className="mb-3 space-y-2">
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute"
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari isi jurnal, rasa syukur, atau evaluasi..."
                  className="field h-9 pl-9 text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMood("semua");
                    setFilterTag("semua");
                  }}
                  className="chip text-[11px]"
                  data-on={filterMood === "semua" && filterTag === "semua"}
                >
                  Semua
                </button>
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() =>
                      setFilterMood((prev) => (prev === m.value ? "semua" : m.value))
                    }
                    className="chip text-[11px]"
                    data-on={filterMood === m.value}
                  >
                    <span>{m.emoji}</span> {m.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {filteredJournals.length === 0 ? (
              <Empty
                icon="📔"
                title={journals.length === 0 ? "Belum ada catatan jurnal" : "Tidak ditemukan"}
                text={
                  journals.length === 0
                    ? "Mulai tulis jurnal dan evaluasi harian pertamamu di sebelah kiri."
                    : "Coba ubah kata kunci pencarian atau filter mood."
                }
              />
            ) : (
              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {filteredJournals.map((j) => (
                  <JournalHistoryCard
                    key={j.id}
                    entry={j}
                    isSelected={j.date === selectedDate}
                    onSelect={() => {
                      setSelectedDate(j.date);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onDelete={() => s.deleteJournal(j.id)}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

const JournalHistoryCard = ({
  entry,
  isSelected,
  onSelect,
  onDelete,
}: {
  entry: DailyJournal;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  const moodMeta = MOOD_OPTIONS.find((m) => m.value === entry.mood) || MOOD_OPTIONS[0];
  return (
    <article
      className={cn(
        "rounded-[20px] border p-4 transition",
        tintBg[entry.color || "lilac"],
        isSelected ? "border-ink ring-2 ring-brand/30" : "border-line"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-surface/85 px-2.5 py-0.5 text-[11px] font-extrabold text-ink">
              {fmtDateShort(parseYmd(entry.date))}
            </span>
            <span className="rounded-full bg-surface/85 px-2.5 py-0.5 text-[11px] font-bold text-ink2">
              {moodMeta.emoji} {moodMeta.label.split(" ")[0]}
            </span>
            <span className="rounded-full bg-surface/85 px-2 py-0.5 text-[11px] font-bold text-amber">
              ⚡ {entry.energy_level}/5
            </span>
          </div>
          <h4 className="mt-2 font-display text-base font-bold text-ink">{entry.title}</h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSelect}
            className="grid h-8 w-8 place-items-center rounded-full bg-surface/80 text-ink2 transition hover:bg-surface hover:text-ink"
            title="Buka & Edit Jurnal"
          >
            <Pencil size={14} />
          </button>
          <ConfirmButton
            className="grid h-8 w-8 place-items-center rounded-full bg-surface/80 text-ink2 transition hover:bg-surface hover:text-coral"
            confirmText="Hapus?"
            onConfirm={onDelete}
          >
            <Trash2 size={14} />
          </ConfirmButton>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 rounded-[14px] bg-surface/85 p-3 text-xs text-ink2">
        {entry.gratitude && (
          <p className="line-clamp-2">
            <strong className="text-ink">🤲 Syukur:</strong> {entry.gratitude}
          </p>
        )}
        {entry.wins && (
          <p className="line-clamp-2">
            <strong className="text-ink">✨ Berhasil:</strong> {entry.wins}
          </p>
        )}
        {entry.challenges && (
          <p className="line-clamp-2">
            <strong className="text-ink">🔍 Evaluasi:</strong> {entry.challenges}
          </p>
        )}
        {entry.tomorrow_focus && (
          <p className="line-clamp-2">
            <strong className="text-ink">🎯 Fokus Besok:</strong> {entry.tomorrow_focus}
          </p>
        )}
        {entry.content && (
          <p className="line-clamp-3 italic text-ink2">“{entry.content}”</p>
        )}
      </div>

      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface/75 px-2 py-0.5 text-[10px] font-bold text-ink2"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};

