import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "./types";

const CONFIG_STORAGE_KEY = "hidup-terarah:supabase-config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = "";

export const SQL_SETUP_SCRIPT = `-- ==========================================
-- SKRIP TABEL DATABASE CLOUD: HIDUP TERARAH
-- Jalankan di SQL Editor Supabase (supabase.com)
-- ==========================================

-- 1. Buat tabel penyimpanan data aplikasi per user
create table if not exists public.user_app_data (
  id uuid primary key default gen_random_uuid(),
  user_email text unique not null,
  app_data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Aktifkan Row Level Security (RLS)
alter table public.user_app_data enable row level security;

-- 3. Berikan akses baca & tulis untuk Anon Key
drop policy if exists "Akses user app data anon" on public.user_app_data;
create policy "Akses user app data anon"
on public.user_app_data
for all
to anon, authenticated
using (true)
with check (true);

-- 4. Buat indeks agar query email instan
create index if not exists idx_user_app_data_email on public.user_app_data(user_email);
`;

export const getSupabaseConfig = (): SupabaseConfig | null => {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch {
    /* ignore */
  }

  // Fallback ke environment variables jika ada
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  return null;
};

export const isCloudConfigured = (): boolean => {
  return getSupabaseConfig() !== null;
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config || !config.url || !config.anonKey) {
    cachedClient = null;
    return null;
  }

  const currentKey = `${config.url}::${config.anonKey}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error("Gagal inisialisasi Supabase:", err);
    return null;
  }
};

export const testCloudConnection = async (url: string, anonKey: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanUrl = url.trim().replace(/\/+$/, "");
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith("https://")) {
      return { success: false, error: "URL Supabase harus dimulai dengan https://" };
    }

    const testClient = createClient(cleanUrl, cleanKey);
    // Coba baca dari tabel user_app_data
    const { error } = await testClient.from("user_app_data").select("count", { count: "exact", head: true });

    if (error) {
      // Jika tabel belum dibuat (error code 42P01: relation does not exist)
      if (error.code === "42P01" || error.message.includes("relation") || error.message.includes("does not exist")) {
        return {
          success: true,
          error: "Terkoneksi ke Supabase, tapi tabel 'user_app_data' belum dibuat. Silakan jalankan Skrip SQL di SQL Editor Supabase.",
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const saveSupabaseConfig = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; warning?: string; error?: string }> => {
  const cleanUrl = url.trim().replace(/\/+$/, "");
  const cleanKey = anonKey.trim();

  const test = await testCloudConnection(cleanUrl, cleanKey);
  if (!test.success) {
    return { success: false, error: test.error };
  }

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
    cachedClient = null;
    cachedConfigKey = "";
    return { success: true, warning: test.error };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  cachedClient = null;
  cachedConfigKey = "";
};

export const syncDataToCloud = async (
  email: string,
  data: AppData
): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Database Cloud belum dikonfigurasi." };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Email pengguna belum ada." };
  }

  try {
    const { error } = await client.from("user_app_data").upsert(
      {
        user_email: cleanEmail,
        app_data: data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_email" }
    );

    if (error) {
      console.error("Gagal sync ke cloud:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error exception sync ke cloud:", msg);
    return { success: false, error: msg };
  }
};

export const fetchDataFromCloud = async (
  email: string
): Promise<{ success: boolean; data?: AppData; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Database Cloud belum dikonfigurasi." };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Email pengguna belum ada." };
  }

  try {
    const { data, error } = await client
      .from("user_app_data")
      .select("app_data, updated_at")
      .eq("user_email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.error("Gagal ambil data dari cloud:", error);
      return { success: false, error: error.message };
    }

    if (!data || !data.app_data) {
      return { success: false, error: "Belum ada data di cloud untuk email ini." };
    }

    return { success: true, data: data.app_data as AppData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error exception ambil data dari cloud:", msg);
    return { success: false, error: msg };
  }
};
