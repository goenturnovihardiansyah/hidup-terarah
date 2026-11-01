export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  const url = new URL(req.url);

  // Health check endpoint
  if (url.searchParams.get("health") === "1") {
    return new Response(
      JSON.stringify({
        status: "ok",
        provider: "vercel_kv",
        configured: Boolean(kvUrl && kvToken),
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  if (!kvUrl || !kvToken) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Vercel KV belum terhubung ke proyek ini. Hubungkan database KV di tab Storage pada Vercel Dashboard.",
      }),
      { status: 503, headers: corsHeaders }
    );
  }

  const cleanKvUrl = kvUrl.replace(/\/+$/, "");

  // GET: Ambil data user
  if (req.method === "GET") {
    const email = url.searchParams.get("email");
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Parameter email wajib diisi." }),
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const key = `hidup_terarah:${encodeURIComponent(email.trim().toLowerCase())}`;
      const res = await fetch(`${cleanKvUrl}/get/${key}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });

      if (!res.ok) {
        const txt = await res.text();
        return new Response(
          JSON.stringify({ success: false, error: `Gagal membaca dari Vercel KV: ${txt}` }),
          { status: 500, headers: corsHeaders }
        );
      }

      const json = await res.json();
      if (!json || json.result === null || json.result === undefined) {
        return new Response(
          JSON.stringify({ success: false, error: "Belum ada data untuk email ini." }),
          { status: 404, headers: corsHeaders }
        );
      }

      const payload = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
      return new Response(JSON.stringify({ success: true, data: payload }), {
        status: 200,
        headers: corsHeaders,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // POST: Simpan data user
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const email = body.email;
      const data = body.data;

      if (!email || !data) {
        return new Response(
          JSON.stringify({ success: false, error: "Field email dan data wajib ada." }),
          { status: 400, headers: corsHeaders }
        );
      }

      const key = `hidup_terarah:${encodeURIComponent(email.trim().toLowerCase())}`;
      const res = await fetch(`${cleanKvUrl}/set/${key}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${kvToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const txt = await res.text();
        return new Response(
          JSON.stringify({ success: false, error: `Gagal menyimpan ke Vercel KV: ${txt}` }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: corsHeaders,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}
