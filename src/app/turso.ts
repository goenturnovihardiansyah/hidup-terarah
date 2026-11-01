import { createClient, type Client } from "@libsql/client/web";
import type { AppData } from "./types";

const TURSO_CONFIG_KEY = "hidup-terarah:turso-config";

export interface TursoConfig {
  url: string;
  authToken: string;
}

let cachedClient: Client | null = null;
let cachedKey = "";

export const getTursoConfig = (): TursoConfig | null => {
  try {
    const raw = localStorage.getItem(TURSO_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.authToken) return parsed;
    }
  } catch {
    /* ignore */
  }

  const envUrl = import.meta.env.VITE_TURSO_DATABASE_URL;
  const envToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;
  if (envUrl && envToken) {
    return { url: envUrl, authToken: envToken };
  }

  return null;
};

export const isTursoConfigured = (): boolean => {
  return getTursoConfig() !== null;
};

export const getTursoClient = (): Client | null => {
  const config = getTursoConfig();
  if (!config || !config.url || !config.authToken) {
    cachedClient = null;
    return null;
  }

  const cleanUrl = config.url.trim().replace(/^libsql:\/\//, "https://");
  const key = `${cleanUrl}::${config.authToken.trim()}`;
  if (cachedClient && cachedKey === key) return cachedClient;

  try {
    cachedClient = createClient({
      url: cleanUrl,
      authToken: config.authToken.trim(),
    });
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.error("Gagal inisialisasi Turso client:", err);
    return null;
  }
};

export const testTursoConnection = async (
  url: string,
  authToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanUrl = url.trim().replace(/^libsql:\/\//, "https://");
    const testClient = createClient({
      url: cleanUrl,
      authToken: authToken.trim(),
    });

    // Otomatis buat tabel jika belum ada!
    await testClient.execute(`
      CREATE TABLE IF NOT EXISTS hidup_terarah_app_data (
        user_email TEXT PRIMARY KEY,
        app_data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const saveTursoConfig = async (
  url: string,
  authToken: string
): Promise<{ success: boolean; error?: string }> => {
  const test = await testTursoConnection(url, authToken);
  if (!test.success) return test;

  try {
    localStorage.setItem(
      TURSO_CONFIG_KEY,
      JSON.stringify({ url: url.trim(), authToken: authToken.trim() })
    );
    cachedClient = null;
    cachedKey = "";
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const clearTursoConfig = () => {
  localStorage.removeItem(TURSO_CONFIG_KEY);
  localStorage.removeItem("hidup-terarah:turso-serverless-active");
  cachedClient = null;
  cachedKey = "";
};

export const checkTursoServerlessStatus = async (): Promise<boolean> => {
  try {
    const res = await fetch("/api/sync?health=1");
    if (!res.ok) return false;
    const json = await res.json();
    const active = Boolean(json.turso_configured);
    if (active) {
      localStorage.setItem("hidup-terarah:turso-serverless-active", "1");
    }
    return active;
  } catch {
    return false;
  }
};

export const syncTursoData = async (
  email: string,
  data: AppData
): Promise<{ success: boolean; error?: string }> => {
  const client = getTursoClient();
  if (!client) {
    // Fallback otomatis ke serverless /api/sync jika terhubung via Vercel Integration
    try {
      const bodyStr = JSON.stringify({ email: email.trim().toLowerCase(), data });
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr,
        keepalive: bodyStr.length < 60000,
      });
      const json = await res.json();
      return json;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  const cleanEmail = email.trim().toLowerCase();
  const payload = JSON.stringify(data);
  const now = new Date().toISOString();

  try {
    await client.execute({
      sql: `
        INSERT INTO hidup_terarah_app_data (user_email, app_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_email) DO UPDATE SET
          app_data = excluded.app_data,
          updated_at = excluded.updated_at
      `,
      args: [cleanEmail, payload, now],
    });
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

export const fetchTursoData = async (
  email: string
): Promise<{ success: boolean; data?: AppData; error?: string }> => {
  const client = getTursoClient();
  if (!client) {
    // Fallback otomatis ke serverless /api/sync jika terhubung via Vercel Integration
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
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const res = await client.execute({
      sql: `SELECT app_data FROM hidup_terarah_app_data WHERE user_email = ? LIMIT 1`,
      args: [cleanEmail],
    });

    if (res.rows.length === 0) {
      return { success: false, error: "Belum ada data di Turso untuk email ini." };
    }

    const raw = res.rows[0].app_data;
    if (typeof raw === "string") {
      return { success: true, data: JSON.parse(raw) as AppData };
    }
    return { success: true, data: raw as unknown as AppData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

