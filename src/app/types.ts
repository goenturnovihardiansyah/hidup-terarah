export type ID = string;
export type Tone = "lembut" | "tegas";
export type Theme = "sistem" | "terang" | "gelap";

export interface User { id: ID; email: string; name: string; created_at: string }
export interface Preferences {
  timezone: string; reminder_tone: Tone; reminder_enabled: boolean;
  daily_budget: number; monthly_budget: number; theme: Theme; miss_threshold: number;
}
export type GoalStatus = "aktif" | "selesai" | "arsip";
export interface Goal {
  id: ID; title: string; reason: string; target_date: string; progress: number;
  status: GoalStatus; created_at: string; completed_at?: string; color: Tint;
}
export interface GoalStep { id: ID; goal_id: ID; title: string; is_done: boolean; order_index: number; done_at?: string }
export type FreqType = "harian" | "mingguan" | "bulanan";
export interface Habit {
  id: ID; name: string; frequency_type: FreqType; frequency_target: number;
  preferred_time: string; is_active: boolean; created_at: string; icon: string; color: Tint;
}
export interface HabitLog { id: ID; habit_id: ID; log_date: string; is_done: boolean; note?: string }
export type ScheduleStatus = "terjadwal" | "selesai" | "terlewat";
export interface Schedule {
  id: ID; title: string; notes: string; start_at: string; end_at?: string;
  status: ScheduleStatus; completed_at?: string; icon: string; color: Tint;
}
export type TxType = "pemasukan" | "pengeluaran";
export interface Category { id: ID; name: string; type: TxType; color: Tint; icon: string }
export interface Transaction { id: ID; category_id: ID; type: TxType; amount: number; note: string; occurred_at: string }
export interface ReminderLog {
  id: ID; source_type: "agenda" | "kebiasaan" | "tujuan"; source_id: ID; level: "pengingat" | "teguran";
  message: string; is_read: boolean; sent_at: string; key: string;
}
export interface Reflection { id: ID; week_start: string; learned: string; to_improve: string; created_at: string }

export type Tint =
  | "lilac"
  | "rose"
  | "butter"
  | "mint"
  | "sky"
  | "peach"
  | "emerald"
  | "amber"
  | "violet"
  | "teal"
  | "indigo"
  | "coral";

export interface AppData {
  version: 1;
  user: User | null;
  lastUser?: User | null;
  prefs: Preferences;
  goals: Goal[];
  steps: GoalStep[];
  habits: Habit[];
  habitLogs: HabitLog[];
  schedules: Schedule[];
  categories: Category[];
  transactions: Transaction[];
  reminders: ReminderLog[];
  reflections: Reflection[];
}
