import type { AppData } from "./types";
import {
  getSupabaseConfig,
  syncDataToCloud as syncSupabase,
  fetchDataFromCloud as fetchSupabase,
} from "./supabase";
import {
  isTursoConfigured,
  syncTursoData,
  fetchTursoData,
} from "./turso";

export type CloudProvider = "turso" | "vercel_kv" | "upstash" | "pantry" | "supabase";

export interface UpstashConfig {
  url: string;
  token: string;
}

export interface PantryConfig {
  pantryId: string;
}

export interface CloudSettings {
  provider: CloudProvider;
  upstash?: UpstashConfig;
  pantry?: PantryConfig;
}

const SETTINGS_KEY = "hidup-terarah:cloud-settings";

export const getCloudSettings = (): CloudSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.provider) return parsed;
    }
  } catch {
    /* abaikan */
  }

  // Jika Turso sudah terkonfigurasi (lokal atau env)
  if (isTursoConfigured()) {
    return { provider: "turso" };
  }

  // Jika sebelumnya sudah ada config Supabase
  if (getSupabaseConfig()) {
    return { provider: "supabase" };
  }

  // Default provider rekomendasi: Turso (100% Gratis Selamanya & Anti-Pause)
  return { provider: "turso" };
};

export const isAnyCloudConfigured = (): boolean => {
  const cfg = getCloudSettings();
  if (cfg.provider === "turso") {
    return isTursoConfigured();
  }
  if (cfg.provider === "vercel_kv") {
    return true; // Dicoba via /api/sync
  }
  if (cfg.provider === "upstash") {
    return Boolean(cfg.upstash?.url && cfg.upstash?.token);
  }
  if (cfg.provider === "pantry") {
    return Boolean(cfg.pantry?.pantryId);
  }
  if (cfg.provider === "supabase") {
    return getSupabaseConfig() !== null;
  }
  return false;
};

// ==================== VERCEL KV (NATIVE SERVERLESS) ====================
export const checkVercelKvStatus = async (): Promise<{
  available: boolean;
  configured: boolean;
  turso_configured?: boolean;
  error?: string;
}> => {
  try {
    const res = await fetch("/api/sync?health=1");
    if (!res.ok) {
      return { available: false, configured: false, error: `HTTP ${res.status}` };
    }
    const json = await res.json();
    return {
      available: true,
      configured: Boolean(json.kv_configured || json.turso_configured),
      turso_configured: Boolean(json.turso_configured),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { available: false, configured: false, error: msg };
  }
};

export const syncVercelKv = async (
  email: string,
  data: AppData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), data }),
    });

    const json = await res.json();
    return json;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const fetchVercelKv = async (
  email: string
): Promise<{ success: boolean; data?: AppData; error?: string }> => {
  try {
    const res = await fetch(`/api/sync?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, error: "Belum ada data di cloud untuk email ini." };
      }
      const json = await res.json().catch(() => ({}));
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }

    const json = await res.json();
    return json;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

// ==================== UPSTASH (REDIS REST API) ====================
export const testUpstashConnection = async (
  url: string,
  token: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanUrl = url.trim().replace(/\/+$/, "");
    const cleanToken = token.trim();
    if (!cleanUrl.startsWith("https://")) {
      return { success: false, error: "URL Upstash harus dimulai dengan https://" };
    }

    const res = await fetch(`${cleanUrl}/ping`, {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });

    if (!res.ok) {
      const txt = await res.text();
      return { success: false, error: `Upstash gagal: ${res.status} ${txt}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const syncUpstash = async (
  email: string,
  data: AppData,
  cfg: UpstashConfig
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanUrl = cfg.url.trim().replace(/\/+$/, "");
    const cleanToken = cfg.token.trim();
    const key = `hidup_terarah:${encodeURIComponent(email.trim().toLowerCase())}`;

    const res = await fetch(`${cleanUrl}/set/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const txt = await res.text();
      return { success: false, error: `Gagal simpan ke Upstash: ${txt}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const fetchUpstash = async (
  email: string,
  cfg: UpstashConfig
): Promise<{ success: boolean; data?: AppData; error?: string }> => {
  try {
    const cleanUrl = cfg.url.trim().replace(/\/+$/, "");
    const cleanToken = cfg.token.trim();
    const key = `hidup_terarah:${encodeURIComponent(email.trim().toLowerCase())}`;

    const res = await fetch(`${cleanUrl}/get/${key}`, {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });

    if (!res.ok) {
      const txt = await res.text();
      return { success: false, error: `Gagal ambil data: ${txt}` };
    }

    const json = await res.json();
    if (!json || json.result === null || json.result === undefined) {
      return { success: false, error: "Belum ada data untuk email ini." };
    }

    const payload = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
    return { success: true, data: payload as AppData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

// ==================== PANTRY CLOUD (ZERO CONFIG JSON) ====================
export const testPantryConnection = async (
  pantryId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanId = pantryId.trim();
    if (!cleanId) return { success: false, error: "Pantry ID tidak boleh kosong." };

    const res = await fetch(`https://getpantry.cloud/apiv1/pantry/${cleanId}`);
    if (!res.ok) {
      return { success: false, error: "Pantry ID tidak valid atau tidak ditemukan." };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const syncPantry = async (
  email: string,
  data: AppData,
  cfg: PantryConfig
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanId = cfg.pantryId.trim();
    const basket = `user_${email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "_")}`;

    const res = await fetch(`https://getpantry.cloud/apiv1/pantry/${cleanId}/basket/${basket}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      return { success: false, error: "Gagal menyimpan ke Pantry Cloud." };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const fetchPantry = async (
  email: string,
  cfg: PantryConfig
): Promise<{ success: boolean; data?: AppData; error?: string }> => {
  try {
    const cleanId = cfg.pantryId.trim();
    const basket = `user_${email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "_")}`;

    const res = await fetch(`https://getpantry.cloud/apiv1/pantry/${cleanId}/basket/${basket}`);
    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, error: "Belum ada data di Pantry untuk email ini." };
      }
      return { success: false, error: "Gagal mengambil data dari Pantry." };
    }

    const json = await res.json();
    return { success: true, data: json as AppData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

// ==================== UNIFIED CLOUD DISPATCHER ====================
export const saveCloudSettings = (settings: CloudSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const syncAppDataToCloud = async (
  email: string,
  data: AppData
): Promise<{ success: boolean; error?: string }> => {
  const cfg = getCloudSettings();

  if (cfg.provider === "turso") {
    return syncTursoData(email, data);
  }

  if (cfg.provider === "vercel_kv") {
    return syncVercelKv(email, data);
  }

  if (cfg.provider === "upstash") {
    if (!cfg.upstash?.url || !cfg.upstash?.token) {
      return { success: false, error: "Kredensial Upstash belum lengkap." };
    }
    return syncUpstash(email, data, cfg.upstash);
  }

  if (cfg.provider === "pantry") {
    if (!cfg.pantry?.pantryId) {
      return { success: false, error: "Pantry ID belum diisi." };
    }
    return syncPantry(email, data, cfg.pantry);
  }

  if (cfg.provider === "supabase") {
    return syncSupabase(email, data);
  }

  return { success: false, error: "Penyedia cloud belum dipilih." };
};

export const fetchAppDataFromCloud = async (
  email: string
): Promise<{ success: boolean; data?: AppData; error?: string }> => {
  const cfg = getCloudSettings();

  if (cfg.provider === "turso") {
    return fetchTursoData(email);
  }

  if (cfg.provider === "vercel_kv") {
    return fetchVercelKv(email);
  }

  if (cfg.provider === "upstash") {
    if (!cfg.upstash?.url || !cfg.upstash?.token) {
      return { success: false, error: "Kredensial Upstash belum lengkap." };
    }
    return fetchUpstash(email, cfg.upstash);
  }

  if (cfg.provider === "pantry") {
    if (!cfg.pantry?.pantryId) {
      return { success: false, error: "Pantry ID belum diisi." };
    }
    return fetchPantry(email, cfg.pantry);
  }

  if (cfg.provider === "supabase") {
    return fetchSupabase(email);
  }

  return { success: false, error: "Penyedia cloud belum dipilih." };
};
