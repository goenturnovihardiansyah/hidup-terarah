import { createClient } from "@libsql/client/web";

export const config = {
  runtime: "edge",
};

type AnyObj = Record<string, any>;

function mergeById(existingArr: AnyObj[] = [], incomingArr: AnyObj[] = [], deletedSet: Set<string>): AnyObj[] {
  const map = new Map<string, AnyObj>();
  for (const item of existingArr) {
    if (item && item.id && typeof item.id === "string" && item.id !== "undefined" && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  }
  for (const item of incomingArr) {
    if (item && item.id && typeof item.id === "string" && item.id !== "undefined" && !deletedSet.has(item.id)) {
      const prev = map.get(item.id);
      map.set(item.id, prev ? { ...prev, ...item } : item);
    }
  }
  return Array.from(map.values());
}

function healAndMergeData(existing: AnyObj | null, incoming: AnyObj): AnyObj {
  if (!existing || typeof existing !== "object") {
    return incoming;
  }

  const deletedIds = Array.from(
    new Set([
      ...(Array.isArray(existing.deleted_ids) ? existing.deleted_ids : []),
      ...(Array.isArray(incoming.deleted_ids) ? incoming.deleted_ids : []),
    ])
  ).slice(-500);
  const deletedSet = new Set<string>(deletedIds);

  // Merge goals: deduplicate by id or normalized title
  const rawGoals = mergeById(existing.goals, incoming.goals, deletedSet);
  const goalsByTitle = new Map<string, AnyObj>();
  for (const g of rawGoals) {
    const key = (g.title || "").trim().toLowerCase() || g.id;
    const prev = goalsByTitle.get(key);
    if (!prev) {
      goalsByTitle.set(key, g);
    } else {
      // Pilih ID yang sudah ada di incoming atau pertahankan progres tertinggi
      goalsByTitle.set(key, {
        ...prev,
        ...g,
        id: prev.id || g.id,
        progress: Math.max(Number(prev.progress || 0), Number(g.progress || 0)),
      });
    }
  }
  const goals = Array.from(goalsByTitle.values());
  const goalIdSet = new Set(goals.map((g) => g.id));
  const sholatGoal = goals.find((g) => (g.title || "").toLowerCase().includes("sholat"));

  // Merge steps & heal orphaned goal_id
  const rawSteps = mergeById(existing.steps, incoming.steps, deletedSet);
  const stepsDedup = new Map<string, AnyObj>();
  for (const s of rawSteps) {
    let goalId = s.goal_id;
    if (!goalIdSet.has(goalId)) {
      if (
        sholatGoal &&
        (goalId === "zzvuqkj464bn" ||
          goalId === "ibcy1gsk9045" ||
          (s.title || "").toLowerCase().includes("sholat") ||
          (s.title || "").toLowerCase().includes("masjid"))
      ) {
        goalId = sholatGoal.id;
      } else if (goals.length === 1) {
        goalId = goals[0].id;
      }
    }
    const fixedStep = { ...s, goal_id: goalId };
    const stepKey = `${goalId}::${(s.title || "").trim().toLowerCase()}`;
    const prev = stepsDedup.get(stepKey);
    if (!prev) {
      stepsDedup.set(stepKey, fixedStep);
    } else {
      stepsDedup.set(stepKey, {
        ...prev,
        ...fixedStep,
        is_done: Boolean(prev.is_done || fixedStep.is_done),
      });
    }
  }
  const steps = Array.from(stepsDedup.values());

  return {
    ...existing,
    ...incoming,
    user: incoming.user || existing.user,
    prefs: { ...(existing.prefs || {}), ...(incoming.prefs || {}) },
    goals,
    steps,
    habits: mergeById(existing.habits, incoming.habits, deletedSet),
    habitLogs: mergeById(existing.habitLogs, incoming.habitLogs, deletedSet),
    schedules: mergeById(existing.schedules, incoming.schedules, deletedSet),
    categories: mergeById(existing.categories, incoming.categories, deletedSet),
    transactions: mergeById(existing.transactions, incoming.transactions, deletedSet),
    reminders: mergeById(existing.reminders, incoming.reminders, deletedSet).slice(0, 200),
    reflections: mergeById(existing.reflections, incoming.reflections, deletedSet),
    workouts: mergeById(existing.workouts, incoming.workouts, deletedSet),
    calories: mergeById(existing.calories, incoming.calories, deletedSet),
    weights: mergeById(existing.weights, incoming.weights, deletedSet),
    waterLogs: mergeById(existing.waterLogs, incoming.waterLogs, deletedSet),
    fitnessProfile: { ...(existing.fitnessProfile || {}), ...(incoming.fitnessProfile || {}) },
    projects: mergeById(existing.projects, incoming.projects, deletedSet),
    projectTasks: mergeById(existing.projectTasks, incoming.projectTasks, deletedSet),
    deleted_ids: deletedIds,
    updated_at: new Date().toISOString(),
  };
}

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
        if (url.searchParams.get("diag") === "1") {
          const allRows = await client.execute(`SELECT user_email, updated_at, length(app_data) as len, app_data FROM hidup_terarah_app_data`);
          let dbpages: AnyObj[] = [];
          try {
            const pRes = await client.execute(`SELECT pgno, hex(data) as hexdata FROM sqlite_dbpage WHERE pgno <= 100`);
            dbpages = pRes.rows;
          } catch (e) {
            dbpages = [{ error: String(e) }];
          }
          let pageInfo: AnyObj = {};
          try {
            const pc = await client.execute(`PRAGMA page_count`);
            const fc = await client.execute(`PRAGMA freelist_count`);
            pageInfo = { page_count: pc.rows, freelist_count: fc.rows };
          } catch (e) {
            pageInfo = { error: String(e) };
          }
          return new Response(JSON.stringify({ rows: allRows.rows, pageInfo, dbpages }), {
            status: 200,
            headers: corsHeaders,
          });
        }

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
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        const payload = healAndMergeData(parsed, parsed);
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

        const cleanEmail = email.trim().toLowerCase();

        // Ambil data sebelumnya di Turso untuk digabung secara aman (anti-reset)
        let mergedData = data;
        try {
          const existingRes = await client.execute({
            sql: `SELECT app_data FROM hidup_terarah_app_data WHERE user_email = ? LIMIT 1`,
            args: [cleanEmail],
          });
          if (existingRes.rows.length > 0) {
            const rawExisting = existingRes.rows[0].app_data;
            const parsedExisting = typeof rawExisting === "string" ? JSON.parse(rawExisting) : rawExisting;
            mergedData = healAndMergeData(parsedExisting, data);
          } else {
            mergedData = healAndMergeData(data, data);
          }
        } catch {
          mergedData = data;
        }

        const payload = JSON.stringify(mergedData);
        const now = new Date().toISOString();

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

        return new Response(JSON.stringify({ success: true, provider: "turso", data: mergedData }), {
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
