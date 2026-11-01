import { createClient } from "@libsql/client/web";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Turso credentials (mendukung Vercel Marketplace Turso Integration & standard env)
  const tursoUrl =
    process.env.TURSO_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.TURSO_DB_URL ||
    process.env.LIBSQL_URL;
  const tursoToken =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.DATABASE_AUTH_TOKEN ||
    process.env.TURSO_GROUP_AUTH_TOKEN ||
    process.env.LIBSQL_AUTH_TOKEN;

  // Upstash / Vercel KV fallback
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // Health check endpoint
  if (url.searchParams.get("health") === "1") {
    return new Response(
      JSON.stringify({
        status: "ok",
        turso_configured: Boolean(tursoUrl && tursoToken),
        kv_configured: Boolean(kvUrl && kvToken),
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // JIKA TURSO TERSEDIA (Utamakan Turso - 100% Gratis & Anti-Pause)
  if (tursoUrl && tursoToken) {
    try {
      const client = createClient({
        url: tursoUrl.replace(/^libsql:\/\//, "https://"),
        authToken: tursoToken,
      });

      // Pastikan tabel ada
      await client.execute(`
        CREATE TABLE IF NOT EXISTS hidup_terarah_app_data (
          user_email TEXT PRIMARY KEY,
          app_data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      if (req.method === "GET") {
        const email = url.searchParams.get("email");
        if (!email) {
          return new Response(JSON.stringify({ success: false, error: "Parameter email wajib diisi." }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const res = await client.execute({
          sql: `SELECT app_data FROM hidup_terarah_app_data WHERE user_email = ? LIMIT 1`,
          args: [email.trim().toLowerCase()],
        });

        if (res.rows.length === 0) {
          return new Response(JSON.stringify({ success: false, error: "Belum ada data di Turso untuk email ini." }), {
            status: 404,
            headers: corsHeaders,
          });
        }

        const raw = res.rows[0].app_data;
        const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
        return new Response(JSON.stringify({ success: true, data: payload, provider: "turso" }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      if (req.method === "POST") {
        const body = await req.json();
        const email = body.email;
        const data = body.data;

        if (!email || !data) {
          return new Response(JSON.stringify({ success: false, error: "Field email dan data wajib ada." }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const payload = JSON.stringify(data);
        const now = new Date().toISOString();

        await client.execute({
          sql: `
            INSERT INTO hidup_terarah_app_data (user_email, app_data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_email) DO UPDATE SET
              app_data = excluded.app_data,
              updated_at = excluded.updated_at
          `,
          args: [email.trim().toLowerCase(), payload, now],
        });

        return new Response(JSON.stringify({ success: true, provider: "turso" }), {
          status: 200,
          headers: corsHeaders,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ success: false, error: `Turso Error: ${msg}` }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // JIKA KV TERSEDIA
  if (kvUrl && kvToken) {
    const cleanKvUrl = kvUrl.replace(/\/+$/, "");
    if (req.method === "GET") {
      const email = url.searchParams.get("email");
      if (!email) return new Response(JSON.stringify({ success: false, error: "email required" }), { status: 400, headers: corsHeaders });
      const key = `hidup_terarah:${encodeURIComponent(email.trim().toLowerCase())}`;
      const res = await fetch(`${cleanKvUrl}/get/${key}`, { headers: { Authorization: `Bearer ${kvToken}` } });
      const json = await res.json();
      if (!json || json.result === null) return new Response(JSON.stringify({ success: false, error: "not found" }), { status: 404, headers: corsHeaders });
      const payload = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
      return new Response(JSON.stringify({ success: true, data: payload, provider: "kv" }), { status: 200, headers: corsHeaders });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const key = `hidup_terarah:${encodeURIComponent(body.email.trim().toLowerCase())}`;
      await fetch(`${cleanKvUrl}/set/${key}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${kvToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body.data),
      });
      return new Response(JSON.stringify({ success: true, provider: "kv" }), { status: 200, headers: corsHeaders });
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: "Database cloud belum dihubungkan. Gunakan Turso atau atur di Pengaturan aplikasi.",
    }),
    { status: 503, headers: corsHeaders }
  );
}
