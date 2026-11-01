import { useState, useMemo } from "react";
import { 
  Plus, Trash2, TrendingDown, TrendingUp, 
  ChevronLeft, ChevronRight, SlidersHorizontal 
} from "lucide-react";
import { useStore } from "../store";
import { PageHead, Panel, Bar, Modal, Segmented } from "../ui";
import { ymd, addDays, startOfWeek, fmtDateShort } from "../dates";
import type { MealType, WorkoutIntensity, FitnessProfile } from "../types";
import { cn } from "@/lib/utils";

// Estimasi kalori terbakar per jenis olahraga (kcal / menit)
const WORKOUT_PRESETS: { activity: string; duration: number; calories: number; intensity: WorkoutIntensity; icon: string }[] = [
  { activity: "Lari Pagi / Jogging", duration: 30, calories: 260, intensity: "sedang", icon: "🏃" },
  { activity: "Gym / Angkat Beban", duration: 45, calories: 280, intensity: "berat", icon: "🏋️" },
  { activity: "Jalan Santai / Langkah", duration: 30, calories: 130, intensity: "ringan", icon: "🚶" },
  { activity: "Gowes Sepeda", duration: 40, calories: 300, intensity: "sedang", icon: "🚴" },
  { activity: "Renang", duration: 30, calories: 270, intensity: "berat", icon: "🏊" },
  { activity: "Yoga / Peregangan", duration: 30, calories: 110, intensity: "ringan", icon: "🧘" },
  { activity: "Futsal / Badminton", duration: 60, calories: 450, intensity: "berat", icon: "🏸" },
  { activity: "Calisthenics / Push-up", duration: 25, calories: 180, intensity: "sedang", icon: "💪" },
];

const MEAL_PRESETS: { name: string; meal_type: MealType; calories: number; icon: string }[] = [
  { name: "Nasi + Lauk Pauk Standar", meal_type: "siang", calories: 480, icon: "🍛" },
  { name: "Telur Rebus / Omelet + Roti", meal_type: "sarapan", calories: 280, icon: "🍳" },
  { name: "Oatmeal + Buah Segar", meal_type: "sarapan", calories: 230, icon: "🥣" },
  { name: "Ayam Panggang / Dada Ayam", meal_type: "malam", calories: 340, icon: "🍗" },
  { name: "Salad / Sayur Rebus", meal_type: "siang", calories: 150, icon: "🥗" },
  { name: "Kopi Hitam / Teh Hijau", meal_type: "snack", calories: 15, icon: "☕" },
  { name: "Buah Pisang / Apel", meal_type: "snack", calories: 95, icon: "🍎" },
  { name: "Susu / Protein Shake", meal_type: "snack", calories: 180, icon: "🥛" },
];

export const Fitness = () => {
  const { 
    data, 
    now, 
    addWorkout, 
    deleteWorkout, 
    addCalorie, 
    deleteCalorie, 
    addWeight, 
    deleteWeight, 
    addWater, 
    deleteWater,
    updateFitnessProfile 
  } = useStore();

  const [selectedDate, setSelectedDate] = useState<string>(ymd(now));
  const [activeTab, setActiveTab] = useState<"semua" | "olahraga" | "kalori" | "berat">("semua");

  // Modals state
  const [openWorkoutModal, setOpenWorkoutModal] = useState(false);
  const [openCalorieModal, setOpenCalorieModal] = useState(false);
  const [openWeightModal, setOpenWeightModal] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);

  // Form inputs
  const [woActivity, setWoActivity] = useState("");
  const [woDuration, setWoDuration] = useState(30);
  const [woCalories, setWoCalories] = useState(200);
  const [woIntensity, setWoIntensity] = useState<WorkoutIntensity>("sedang");
  const [woNotes, setWoNotes] = useState("");

  const [calMealType, setCalMealType] = useState<MealType>("siang");
  const [calFoodName, setCalFoodName] = useState("");
  const [calAmount, setCalAmount] = useState(400);

  const [weightInput, setWeightInput] = useState<string>("");
  const [weightNote, setWeightNote] = useState("");

  const profile: FitnessProfile = data.fitnessProfile || {
    target_calories: 2000,
    target_weight_kg: 65,
    height_cm: 170,
    daily_water_target_ml: 2000,
    weekly_workout_target_minutes: 150,
  };

  const [profHeight, setProfHeight] = useState(profile.height_cm);
  const [profTargetWeight, setProfTargetWeight] = useState(profile.target_weight_kg);
  const [profTargetCal, setProfTargetCal] = useState(profile.target_calories);
  const [profWeeklyMinutes, setProfWeeklyMinutes] = useState(profile.weekly_workout_target_minutes);

  // Daily filtered data
  const workoutsToday = useMemo(() => {
    return (data.workouts || []).filter((w) => w.date === selectedDate);
  }, [data.workouts, selectedDate]);

  const caloriesToday = useMemo(() => {
    return (data.calories || []).filter((c) => c.date === selectedDate);
  }, [data.calories, selectedDate]);

  const waterToday = useMemo(() => {
    return (data.waterLogs || []).filter((w) => w.date === selectedDate);
  }, [data.waterLogs, selectedDate]);

  const weightsHistory = useMemo(() => {
    return [...(data.weights || [])].sort((a, b) => b.date.localeCompare(a.date));
  }, [data.weights]);

  const latestWeightLog = weightsHistory[0];
  const currentWeight = latestWeightLog ? latestWeightLog.weight_kg : profile.target_weight_kg;

  // Calorie calculations
  const totalCaloriesIn = caloriesToday.reduce((sum, c) => sum + c.calories, 0);
  const totalCaloriesBurnedWo = workoutsToday.reduce((sum, w) => sum + w.calories_burned, 0);
  const totalMinutesWoToday = workoutsToday.reduce((sum, w) => sum + w.duration_minutes, 0);
  const netCalories = totalCaloriesIn - totalCaloriesBurnedWo;
  const remainingCalories = profile.target_calories - netCalories;

  // Water calculations
  const totalWaterMl = waterToday.reduce((sum, w) => sum + w.amount_ml, 0);
  const waterGlasses = Math.floor(totalWaterMl / 250);

  // Weekly workout minutes
  const weekStart = ymd(startOfWeek(new Date(selectedDate + "T12:00:00")));
  const weekEnd = ymd(addDays(startOfWeek(new Date(selectedDate + "T12:00:00")), 6));
  const weeklyWorkouts = (data.workouts || []).filter((w) => w.date >= weekStart && w.date <= weekEnd);
  const weeklyWorkoutMinutes = weeklyWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0);
  const weeklyWorkoutProgress = Math.min(100, Math.round((weeklyWorkoutMinutes / profile.weekly_workout_target_minutes) * 100));

  // BMI Calculation
  const heightM = profile.height_cm / 100;
  const bmi = heightM > 0 ? Number((currentWeight / (heightM * heightM)).toFixed(1)) : 22.0;
  const bmiCategory =
    bmi < 18.5
      ? { label: "Berat Kurang", color: "text-amber-500", bg: "bg-amber-100" }
      : bmi <= 22.9
      ? { label: "Normal / Ideal", color: "text-emerald-500", bg: "bg-emerald-100" }
      : bmi <= 24.9
      ? { label: "Kelebihan Berat", color: "text-amber-500", bg: "bg-amber-100" }
      : { label: "Obesitas", color: "text-coral", bg: "bg-rose-100" };

  const weightDiffFromTarget = Number((currentWeight - profile.target_weight_kg).toFixed(1));

  // Submit handlers
  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!woActivity.trim()) return;
    addWorkout({
      date: selectedDate,
      activity: woActivity.trim(),
      duration_minutes: Number(woDuration),
      calories_burned: Number(woCalories),
      intensity: woIntensity,
      notes: woNotes.trim(),
    });
    setWoActivity("");
    setWoNotes("");
    setOpenWorkoutModal(false);
  };

  const handleSaveCalorie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calFoodName.trim()) return;
    addCalorie({
      date: selectedDate,
      meal_type: calMealType,
      food_name: calFoodName.trim(),
      calories: Number(calAmount),
    });
    setCalFoodName("");
    setOpenCalorieModal(false);
  };

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput.replace(",", "."));
    if (!w || isNaN(w)) return;
    addWeight({
      date: selectedDate,
      weight_kg: w,
      note: weightNote.trim(),
    });
    setWeightInput("");
    setWeightNote("");
    setOpenWeightModal(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateFitnessProfile({
      height_cm: Number(profHeight),
      target_weight_kg: Number(profTargetWeight),
      target_calories: Number(profTargetCal),
      weekly_workout_target_minutes: Number(profWeeklyMinutes),
    });
    setOpenProfileModal(false);
  };

  const isToday = selectedDate === ymd(now);

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <PageHead
        eyebrow="Kesehatan & Kebugaran"
        title="Olahraga, Kalori & Berat Badan"
        text="Satu tempat seimbang untuk melacak aktivitas fisik, asupan kalori harian, dan progres timbangan tubuh."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOpenProfileModal(true)}
              className="btn btn-ghost text-xs font-semibold"
              title="Atur target tinggi, berat & kalori"
            >
              <SlidersHorizontal size={15} /> Atur Target
            </button>
            <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-xs">
              <button
                onClick={() => setSelectedDate(ymd(addDays(new Date(selectedDate + "T12:00:00"), -1)))}
                aria-label="Hari sebelumnya"
                className="grid h-7 w-7 place-items-center rounded-full hover:bg-surface2 text-mute hover:text-ink transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-xs font-bold text-ink">
                {isToday ? "Hari ini" : fmtDateShort(new Date(selectedDate + "T12:00:00"))}
              </span>
              <button
                onClick={() => setSelectedDate(ymd(addDays(new Date(selectedDate + "T12:00:00"), 1)))}
                disabled={isToday}
                aria-label="Hari berikutnya"
                className="grid h-7 w-7 place-items-center rounded-full hover:bg-surface2 text-mute hover:text-ink disabled:opacity-30 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        }
      />

      {/* TOP 4 SUMMARY KPI CARDS */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4">
        {/* KPI 1: Olahraga */}
        <div className="card p-4 bg-gradient-to-br from-emerald-50/40 to-surface border border-line">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-emerald-600">Olahraga Hari Ini</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-600 text-base">
              🏃
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            {totalMinutesWoToday} <span className="text-sm font-semibold text-mute">menit</span>
          </p>
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">
            -{totalCaloriesBurnedWo} kcal terbakar
          </p>
          <div className="mt-2.5">
            <div className="flex justify-between text-[11px] font-semibold text-mute mb-1">
              <span>Pekan ini: {weeklyWorkoutMinutes} mnt</span>
              <span>{weeklyWorkoutProgress}%</span>
            </div>
            <Bar value={weeklyWorkoutProgress} tint="emerald" h={6} />
          </div>
        </div>

        {/* KPI 2: Kalori */}
        <div className="card p-4 bg-gradient-to-br from-amber-50/40 to-surface border border-line">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-amber-600">Kalori Masuk</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-600 text-base">
              🥗
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            {totalCaloriesIn} <span className="text-sm font-semibold text-mute">/ {profile.target_calories}</span>
          </p>
          <p className={cn("text-xs font-semibold mt-0.5", remainingCalories >= 0 ? "text-emerald-600" : "text-coral")}>
            {remainingCalories >= 0 ? `Sisa aman ${remainingCalories} kcal` : `Surplus +${Math.abs(remainingCalories)} kcal`}
          </p>
          <div className="mt-2.5">
            <div className="flex justify-between text-[11px] font-semibold text-mute mb-1">
              <span>Netto: {netCalories} kcal</span>
              <span>{Math.round((totalCaloriesIn / profile.target_calories) * 100)}%</span>
            </div>
            <Bar value={Math.round((totalCaloriesIn / profile.target_calories) * 100)} tint={remainingCalories >= 0 ? "amber" : "coral"} h={6} />
          </div>
        </div>

        {/* KPI 3: Berat Badan */}
        <div className="card p-4 bg-gradient-to-br from-lilac-50/40 to-surface border border-line">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-brand">Berat Terkini</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-lilac-bg text-brand text-base">
              ⚖️
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            {currentWeight} <span className="text-sm font-semibold text-mute">kg</span>
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", bmiCategory.bg, bmiCategory.color)}>
              BMI {bmi} · {bmiCategory.label}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-mute">
            Target: <b className="text-ink">{profile.target_weight_kg} kg</b> (
            {weightDiffFromTarget === 0 ? "Tercapai! 🎯" : `${weightDiffFromTarget > 0 ? "+" : ""}${weightDiffFromTarget} kg`}
            )
          </p>
        </div>

        {/* KPI 4: Hidrasi Air */}
        <div className="card p-4 bg-gradient-to-br from-sky-50/40 to-surface border border-line">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-sky-600">Air Minum</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-100 text-sky-600 text-base">
              💧
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            {totalWaterMl} <span className="text-sm font-semibold text-mute">/ {profile.daily_water_target_ml} ml</span>
          </p>
          <p className="text-xs font-semibold text-sky-600 mt-0.5">
            {waterGlasses} Gelas tercatat
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => addWater(250, selectedDate)}
              className="btn btn-ghost py-1 px-3 text-xs text-sky-600 hover:bg-sky-50 font-bold border border-sky-200 flex-1"
            >
              + 250ml (1 Gelas)
            </button>
            {waterToday.length > 0 && (
              <button
                onClick={() => deleteWater(waterToday[waterToday.length - 1].id)}
                title="Batalkan 1 gelas terakhir"
                className="btn btn-ghost py-1 px-2.5 text-xs text-mute hover:text-coral font-bold border border-line"
              >
                - 1
              </button>
            )}
          </div>
        </div>
      </section>

      {/* TABS SELECTOR IN 1 PAGE */}
      <div className="flex items-center justify-between border-b border-line pb-1">
        <Segmented
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { v: "semua", l: "Semua Ringkasan" },
            { v: "olahraga", l: "🏃 Olahraga" },
            { v: "kalori", l: "🥗 Kalori & Makanan" },
            { v: "berat", l: "⚖️ Berat Badan" },
          ]}
        />
        <div className="hidden sm:flex items-center gap-2">
          {activeTab === "olahraga" && (
            <button onClick={() => setOpenWorkoutModal(true)} className="btn btn-primary text-xs py-2">
              <Plus size={15} /> Catat Olahraga
            </button>
          )}
          {activeTab === "kalori" && (
            <button onClick={() => setOpenCalorieModal(true)} className="btn btn-primary text-xs py-2">
              <Plus size={15} /> Catat Makanan
            </button>
          )}
          {activeTab === "berat" && (
            <button onClick={() => setOpenWeightModal(true)} className="btn btn-primary text-xs py-2">
              <Plus size={15} /> Timbang Berat
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: OLAHRAGA (WORKOUT TRACKER) */}
      {/* ========================================================= */}
      {(activeTab === "semua" || activeTab === "olahraga") && (
        <Panel
          title={
            <div className="flex items-center gap-2">
              <span className="text-lg">🏃</span>
              <span>Aktivitas Olahraga & Latihan</span>
              <span className="text-xs font-normal text-mute">({workoutsToday.length} sesi hari ini)</span>
            </div>
          }
          sub="Konsistensi bergerak menjaga energi dan kesehatan jangka panjang."
          action={
            <button onClick={() => setOpenWorkoutModal(true)} className="btn btn-primary text-xs py-1.5 px-3">
              <Plus size={14} /> Catat Latihan
            </button>
          }
        >
          {/* Quick preset buttons */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-mute mb-2">Preset Latihan Cepat:</p>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_PRESETS.map((p) => (
                <button
                  key={p.activity}
                  onClick={() => {
                    addWorkout({
                      date: selectedDate,
                      activity: p.activity,
                      duration_minutes: p.duration,
                      calories_burned: p.calories,
                      intensity: p.intensity,
                    });
                  }}
                  className="chip text-xs hover:border-brand transition"
                >
                  <span>{p.icon}</span>
                  <span className="font-semibold">{p.activity}</span>
                  <span className="text-mute font-normal">({p.duration}m · {p.calories}kcal)</span>
                </button>
              ))}
            </div>
          </div>

          {/* List of workouts */}
          {workoutsToday.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-mute">
              Belum ada olahraga yang dicatat pada {fmtDateShort(new Date(selectedDate + "T12:00:00"))}. Pilih preset di atas atau klik "Catat Latihan".
            </div>
          ) : (
            <div className="space-y-2">
              {workoutsToday.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-2xl border border-line bg-surface2/60 p-3 text-sm hover:border-ink2 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600 text-lg">
                      🏃
                    </span>
                    <div>
                      <p className="font-bold text-ink">{w.activity}</p>
                      <p className="text-xs text-mute font-medium">
                        {w.duration_minutes} menit · <span className="text-emerald-600 font-bold">-{w.calories_burned} kcal</span>
                        {w.notes && <span className="italic ml-2">“{w.notes}”</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        w.intensity === "berat"
                          ? "bg-rose-100 text-coral"
                          : w.intensity === "sedang"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {w.intensity}
                    </span>
                    <button
                      onClick={() => deleteWorkout(w.id)}
                      aria-label="Hapus olahraga"
                      className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:text-coral hover:bg-surface"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: KALORI & MAKANAN (NUTRITION TRACKER) */}
      {/* ========================================================= */}
      {(activeTab === "semua" || activeTab === "kalori") && (
        <Panel
          title={
            <div className="flex items-center gap-2">
              <span className="text-lg">🥗</span>
              <span>Asupan Makanan & Kalori</span>
              <span className="text-xs font-normal text-mute">({totalCaloriesIn} kcal tercatat)</span>
            </div>
          }
          sub="Pola makan berkesadaran tanpa obsesi berlebih, cukup jaga keseimbangan kalori harianmu."
          action={
            <button onClick={() => setOpenCalorieModal(true)} className="btn btn-primary text-xs py-1.5 px-3">
              <Plus size={14} /> Catat Makanan
            </button>
          }
        >
          {/* Quick preset foods */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-mute mb-2">Preset Makanan Praktis:</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_PRESETS.map((m) => (
                <button
                  key={m.name}
                  onClick={() => {
                    addCalorie({
                      date: selectedDate,
                      meal_type: m.meal_type,
                      food_name: m.name,
                      calories: m.calories,
                    });
                  }}
                  className="chip text-xs hover:border-brand transition"
                >
                  <span>{m.icon}</span>
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-amber-600 font-bold">+{m.calories} kcal</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meals List */}
          {caloriesToday.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-mute">
              Belum ada makanan yang dicatat pada {fmtDateShort(new Date(selectedDate + "T12:00:00"))}. Klik preset di atas atau "Catat Makanan".
            </div>
          ) : (
            <div className="space-y-2">
              {caloriesToday.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-2xl border border-line bg-surface2/60 p-3 text-sm hover:border-ink2 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600 text-lg">
                      {c.meal_type === "sarapan" ? "🍳" : c.meal_type === "siang" ? "🍛" : c.meal_type === "malam" ? "🍗" : "☕"}
                    </span>
                    <div>
                      <p className="font-bold text-ink">{c.food_name}</p>
                      <p className="text-xs text-mute capitalize font-medium">
                        {c.meal_type} · <span className="font-bold text-amber-600">+{c.calories} kcal</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCalorie(c.id)}
                    aria-label="Hapus makanan"
                    className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:text-coral hover:bg-surface"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: BERAT BADAN & PROGRES TUBUH (WEIGHT TRACKER) */}
      {/* ========================================================= */}
      {(activeTab === "semua" || activeTab === "berat") && (
        <Panel
          title={
            <div className="flex items-center gap-2">
              <span className="text-lg">⚖️</span>
              <span>Berat Badan & Komposisi Tubuh</span>
              <span className="text-xs font-normal text-mute">(Target: {profile.target_weight_kg} kg)</span>
            </div>
          }
          sub="Timbang secara berkala (misal tiap pagi setelah bangun). Tren jangka panjang lebih penting daripada angka harian."
          action={
            <button onClick={() => setOpenWeightModal(true)} className="btn btn-primary text-xs py-1.5 px-3">
              <Plus size={14} /> Catat Timbangan
            </button>
          }
        >
          <div className="grid gap-4 md:grid-cols-12">
            {/* Left: BMI & Target Status Card */}
            <div className="md:col-span-5 rounded-2xl bg-gradient-to-br from-surface to-surface2 border border-line p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Status Tubuh</span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold", bmiCategory.bg, bmiCategory.color)}>
                  {bmiCategory.label}
                </span>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-ink">
                  {currentWeight} <span className="text-base font-medium text-mute">kg</span>
                </p>
                <p className="text-xs text-mute mt-1">
                  Tinggi Badan: <b className="text-ink">{profile.height_cm} cm</b> · Indeks Massa Tubuh: <b className="text-ink">{bmi}</b>
                </p>
              </div>

              <div className="rounded-xl bg-surface p-3 border border-line space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-mute">Target Berat:</span>
                  <span className="font-bold text-ink">{profile.target_weight_kg} kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-mute">Selisih Target:</span>
                  <span className={cn("font-bold", weightDiffFromTarget === 0 ? "text-emerald-600" : "text-brand")}>
                    {weightDiffFromTarget > 0 ? `Perlu turun ${weightDiffFromTarget} kg` : weightDiffFromTarget < 0 ? `Perlu naik ${Math.abs(weightDiffFromTarget)} kg` : "Sesuai Target! 🎯"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-mute leading-relaxed">
                💡 <b className="text-ink2">Tips Sehat:</b> Penurunan atau kenaikan berat badan yang aman berkisar antara 0,5 - 1 kg per minggu dengan kombinasi latihan dan gizi seimbang.
              </p>
            </div>

            {/* Right: History Log */}
            <div className="md:col-span-7 space-y-2">
              <p className="text-xs font-bold text-ink2 mb-1">Riwayat Timbangan Terakhir:</p>
              {weightsHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-mute">
                  Belum ada riwayat timbangan. Klik "Catat Timbangan" untuk mencatat berat badan pertamamu.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {weightsHistory.slice(0, 10).map((w, idx) => {
                    const prev = weightsHistory[idx + 1];
                    const diff = prev ? Number((w.weight_kg - prev.weight_kg).toFixed(1)) : null;

                    return (
                      <div
                        key={w.id}
                        className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface2 font-bold text-ink">
                            ⚖️
                          </span>
                          <div>
                            <p className="font-extrabold text-sm text-ink">{w.weight_kg} kg</p>
                            <p className="text-[11px] text-mute">
                              {fmtDateShort(new Date(w.date + "T12:00:00"))}
                              {w.note && <span className="ml-1.5 italic">({w.note})</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {diff !== null && (
                            <span
                              className={cn(
                                "flex items-center gap-0.5 text-xs font-bold",
                                diff < 0 ? "text-emerald-600" : diff > 0 ? "text-coral" : "text-mute"
                              )}
                            >
                              {diff < 0 ? <TrendingDown size={14} /> : diff > 0 ? <TrendingUp size={14} /> : null}
                              {diff > 0 ? `+${diff}` : diff} kg
                            </span>
                          )}
                          <button
                            onClick={() => deleteWeight(w.id)}
                            aria-label="Hapus data berat"
                            className="text-mute hover:text-coral transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* ========================================================= */}
      {/* MODALS: WORKOUT, CALORIE, WEIGHT, PROFILE */}
      {/* ========================================================= */}

      {/* 1. Modal Catat Olahraga */}
      <Modal open={openWorkoutModal} onClose={() => setOpenWorkoutModal(false)} title="Catat Olahraga" desc="Pilih jenis latihan, durasi, dan perkiraan kalori terbakar.">
        <form onSubmit={handleSaveWorkout} className="space-y-4">
          <div>
            <label className="label" htmlFor="wo-act">Nama / Jenis Olahraga</label>
            <input
              id="wo-act"
              className="field"
              placeholder="Misal: Lari Pagi, Gym, Renang, Futsal"
              value={woActivity}
              onChange={(e) => setWoActivity(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="wo-dur">Durasi (Menit)</label>
              <input
                id="wo-dur"
                type="number"
                min={1}
                max={360}
                className="field"
                value={woDuration}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setWoDuration(d);
                  // Estimasi otomatis kalori
                  setWoCalories(Math.round(d * 7));
                }}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="wo-cal">Kalori Terbakar (kcal)</label>
              <input
                id="wo-cal"
                type="number"
                min={1}
                max={5000}
                className="field"
                value={woCalories}
                onChange={(e) => setWoCalories(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <span className="label">Intensitas Latihan</span>
            <Segmented
              value={woIntensity}
              onChange={setWoIntensity}
              options={[
                { v: "ringan", l: "Ringan" },
                { v: "sedang", l: "Sedang" },
                { v: "berat", l: "Berat" },
              ]}
            />
          </div>

          <div>
            <label className="label" htmlFor="wo-notes">Catatan (Opsional)</label>
            <input
              id="wo-notes"
              className="field"
              placeholder="Misal: Jarak 5km, pace 6:00, atau latihan bahu & dada"
              value={woNotes}
              onChange={(e) => setWoNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenWorkoutModal(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan Latihan
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Catat Makanan / Kalori */}
      <Modal open={openCalorieModal} onClose={() => setOpenCalorieModal(false)} title="Catat Makanan & Kalori" desc="Pantau asupan nutrisi harian agar energi tetap seimbang.">
        <form onSubmit={handleSaveCalorie} className="space-y-4">
          <div>
            <span className="label">Waktu Makan</span>
            <Segmented
              value={calMealType}
              onChange={setCalMealType}
              options={[
                { v: "sarapan", l: "Sarapan" },
                { v: "siang", l: "Makan Siang" },
                { v: "malam", l: "Makan Malam" },
                { v: "snack", l: "Cemilan" },
              ]}
            />
          </div>

          <div>
            <label className="label" htmlFor="cal-food">Nama Makanan / Minuman</label>
            <input
              id="cal-food"
              className="field"
              placeholder="Misal: Nasi Padang, Ayam Bakar, Smoothie, Roti Gandum"
              value={calFoodName}
              onChange={(e) => setCalFoodName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="cal-amt">Kalori (kcal)</label>
            <input
              id="cal-amt"
              type="number"
              min={1}
              max={4000}
              className="field font-bold text-lg"
              value={calAmount}
              onChange={(e) => setCalAmount(Number(e.target.value))}
              required
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[100, 200, 350, 500].map((v) => (
                <button
                  type="button"
                  key={v}
                  className="chip text-xs"
                  onClick={() => setCalAmount(v)}
                >
                  {v} kcal
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenCalorieModal(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan Makanan
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal Timbang Berat Badan */}
      <Modal open={openWeightModal} onClose={() => setOpenWeightModal(false)} title="Catat Berat Badan" desc="Timbang di kondisi stabil (misal pagi hari setelah buang air kecil).">
        <form onSubmit={handleSaveWeight} className="space-y-4">
          <div>
            <label className="label" htmlFor="wt-input">Berat Badan (kg)</label>
            <input
              id="wt-input"
              type="number"
              step="0.1"
              min={25}
              max={300}
              className="field font-display text-2xl font-bold"
              placeholder="Misal: 65.5"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="wt-note">Catatan Tambahan (Opsional)</label>
            <input
              id="wt-note"
              className="field"
              placeholder="Misal: Timbang pagi sebelum sarapan"
              value={weightNote}
              onChange={(e) => setWeightNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenWeightModal(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan Timbangan
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal Target & Profil Kebugaran */}
      <Modal open={openProfileModal} onClose={() => setOpenProfileModal(false)} title="Pengaturan Target Kebugaran" desc="Sesuaikan profil fisik untuk kalkulasi BMI dan target harian.">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="prof-h">Tinggi Badan (cm)</label>
              <input
                id="prof-h"
                type="number"
                min={100}
                max={250}
                className="field"
                value={profHeight}
                onChange={(e) => setProfHeight(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="prof-w">Target Berat (kg)</label>
              <input
                id="prof-w"
                type="number"
                step="0.5"
                min={30}
                max={200}
                className="field"
                value={profTargetWeight}
                onChange={(e) => setProfTargetWeight(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="prof-cal">Target Kalori Harian</label>
              <input
                id="prof-cal"
                type="number"
                min={1000}
                max={5000}
                step={50}
                className="field"
                value={profTargetCal}
                onChange={(e) => setProfTargetCal(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="prof-wk">Target Olahraga / Pekan</label>
              <input
                id="prof-wk"
                type="number"
                min={30}
                max={1000}
                step={15}
                className="field"
                value={profWeeklyMinutes}
                onChange={(e) => setProfWeeklyMinutes(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="rounded-xl bg-surface2 p-3 text-xs text-mute">
            Target rekomendasi WHO adalah minimal <b>150 menit</b> aktivitas fisik sedang per minggu.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenProfileModal(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan Target
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
