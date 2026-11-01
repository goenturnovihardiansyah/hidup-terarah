import { useState } from "react";
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Database,
  AlertCircle,
  Zap,
  Server,
  Sparkles,
  Layers,
} from "lucide-react";
import { useStore } from "./store";
import { SQL_SETUP_SCRIPT, getSupabaseConfig } from "./supabase";
import { getTursoConfig } from "./turso";
import type { CloudProvider } from "./cloud-db";

export const CloudDatabaseSection = () => {
  const {
    cloudStatus,
    cloudError,
    lastSyncedAt,
    cloudSettings,
    syncNow,
    pullFromCloud,
    updateTursoConfig,
    updateUpstashConfig,
    updatePantryConfig,
    updateSupabaseConfig,
    disconnectCloud,
    toast,
  } = useStore();

  const [provider, setProvider] = useState<CloudProvider>(cloudSettings.provider || "turso");

  // Turso state
  const tursoCfg = getTursoConfig();
  const [tursoUrl, setTursoUrl] = useState(tursoCfg?.url || "");
  const [tursoToken, setTursoToken] = useState(tursoCfg?.authToken || "");

  // Upstash state
  const [upstashUrl, setUpstashUrl] = useState(cloudSettings.upstash?.url || "");
  const [upstashToken, setUpstashToken] = useState(cloudSettings.upstash?.token || "");

  // Pantry state
  const [pantryId, setPantryId] = useState(cloudSettings.pantry?.pantryId || "");

  // Supabase state
  const supaCfg = getSupabaseConfig();
  const [supaUrl, setSupaUrl] = useState(supaCfg?.url || "");
  const [supaKey, setSupaKey] = useState(supaCfg?.anonKey || "");

  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isConnected = cloudStatus !== "unconfigured";

  const handleSaveTurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tursoUrl.trim() || !tursoToken.trim()) {
      toast("URL dan Auth Token Turso wajib diisi.");
      return;
    }
    setLoading(true);
    await updateTursoConfig(tursoUrl, tursoToken);
    setLoading(false);
  };

  const handleSaveUpstash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upstashUrl.trim() || !upstashToken.trim()) {
      toast("URL dan Token Upstash wajib diisi.");
      return;
    }
    setLoading(true);
    await updateUpstashConfig(upstashUrl, upstashToken);
    setLoading(false);
  };

  const handleSavePantry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pantryId.trim()) {
      toast("Pantry ID wajib diisi.");
      return;
    }
    setLoading(true);
    await updatePantryConfig(pantryId);
    setLoading(false);
  };

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supaUrl.trim() || !supaKey.trim()) {
      toast("URL dan Anon Key Supabase harus diisi.");
      return;
    }
    setLoading(true);
    await updateSupabaseConfig(supaUrl.trim(), supaKey.trim());
    setLoading(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncNow();
    setIsSyncing(false);
  };

  const handleManualPull = async () => {
    setIsSyncing(true);
    await pullFromCloud();
    setIsSyncing(false);
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
      setIsCopied(true);
      toast("Skrip SQL berhasil disalin ke clipboard!");
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast("Gagal menyalin otomatis.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div
        className={`flex items-start justify-between gap-3 rounded-[18px] border p-4 transition-all ${
          isConnected
            ? "border-mint/30 bg-mint-bg/30 text-ink"
            : "border-line bg-surface2 text-mute"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
              isConnected ? "bg-mint text-white" : "bg-line text-ink2"
            }`}
          >
            {isConnected ? <CloudCheck size={18} /> : <CloudOff size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">
                {isConnected
                  ? `Cloud Aktif (${cloudSettings.provider.replace("_", " ").toUpperCase()})`
                  : "Belum Terhubung ke Database Cloud"}
              </span>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  isConnected ? "bg-mint/15 text-mint" : "bg-line text-mute"
                }`}
              >
                {isConnected ? "Aktif & Anti-Pause" : "Offline Saja"}
              </span>
            </div>
            <p className="mt-1 text-xs text-mute">
              {isConnected
                ? "Data Anda otomatis tersinkronisasi. Semua tujuan, kebiasaan, dan jadwal dapat dibuka dari HP maupun Laptop kapan saja."
                : "Gunakan Turso (seperti di Mushola Arrisalah) yang 100% gratis selamanya dan anti-pause agar data bisa dibuka di HP & Laptop."}
            </p>
            {lastSyncedAt && isConnected && (
              <p className="mt-1.5 text-[11px] font-medium text-ink2">
                Terakhir disinkronkan: <span className="font-bold">{lastSyncedAt} WIB</span>
              </p>
            )}
            {cloudError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-coral">
                <AlertCircle size={14} className="shrink-0" /> {cloudError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tombol Aksi Cepat jika Terhubung */}
      {isConnected && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="btn btn-primary py-2 text-xs font-bold"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
          </button>
          <button
            type="button"
            onClick={handleManualPull}
            disabled={isSyncing}
            className="btn btn-ghost py-2 text-xs font-bold"
          >
            <Cloud size={14} /> Ambil Data Terbaru dari Cloud
          </button>
          <button
            type="button"
            onClick={disconnectCloud}
            className="btn btn-ghost py-2 text-xs font-bold text-coral hover:bg-coral-bg/20"
          >
            Putuskan Koneksi
          </button>
        </div>
      )}

      {/* Pilihan Provider Database Gratis */}
      <div className="pt-2">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">
          Pilih Penyedia Database Gratis:
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setProvider("turso")}
            className={`flex flex-col items-center rounded-[14px] border p-2.5 text-center transition ${
              provider === "turso"
                ? "border-brand bg-brandsoft text-brand font-bold shadow-sm"
                : "border-line bg-surface text-ink2 hover:bg-surface2"
            }`}
          >
            <Layers size={16} className="mb-1 text-mint" />
            <span className="text-xs font-bold">Turso (SQLite)</span>
            <span className="text-[10px] text-mute">⭐ Rekomendasi</span>
          </button>

          <button
            type="button"
            onClick={() => setProvider("pantry")}
            className={`flex flex-col items-center rounded-[14px] border p-2.5 text-center transition ${
              provider === "pantry"
                ? "border-brand bg-brandsoft text-brand font-bold shadow-sm"
                : "border-line bg-surface text-ink2 hover:bg-surface2"
            }`}
          >
            <Sparkles size={16} className="mb-1 text-mint" />
            <span className="text-xs font-bold">Pantry Cloud</span>
            <span className="text-[10px] text-mute">10 Detik Siap</span>
          </button>

          <button
            type="button"
            onClick={() => setProvider("upstash")}
            className={`flex flex-col items-center rounded-[14px] border p-2.5 text-center transition ${
              provider === "upstash"
                ? "border-brand bg-brandsoft text-brand font-bold shadow-sm"
                : "border-line bg-surface text-ink2 hover:bg-surface2"
            }`}
          >
            <Zap size={16} className="mb-1 text-amber-500" />
            <span className="text-xs font-bold">Upstash Redis</span>
            <span className="text-[10px] text-mute">Anti-Pause</span>
          </button>

          <button
            type="button"
            onClick={() => setProvider("supabase")}
            className={`flex flex-col items-center rounded-[14px] border p-2.5 text-center transition ${
              provider === "supabase"
                ? "border-brand bg-brandsoft text-brand font-bold shadow-sm"
                : "border-line bg-surface text-ink2 hover:bg-surface2"
            }`}
          >
            <Server size={16} className="mb-1 text-sky" />
            <span className="text-xs font-bold">Supabase</span>
            <span className="text-[10px] text-mute">PostgreSQL</span>
          </button>
        </div>
      </div>

      {/* ================= FORM TURSO (Paling Direkomendasikan) ================= */}
      {provider === "turso" && (
        <div className="space-y-3 rounded-[16px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Layers size={14} className="text-mint" /> Turso Database (100% Gratis Selamanya & Anti-Pause)
            </p>
            <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
              ⭐ Pilihan Terbaik
            </span>
          </div>

          <p className="text-xs text-mute">
            Turso adalah database cloud berbasis SQLite yang digunakan di <strong>Mushola Arrisalah</strong>. Kuota gratisnya sangat besar (<strong>9 GB storage, 500 database gratis, 1 Miliar query</strong>) dan <strong>TIDAK PERNAH DI-PAUSE</strong>!
          </p>

          <form onSubmit={handleSaveTurso} className="space-y-3 pt-1">
            <div>
              <label className="label text-xs" htmlFor="turso-url">
                Database URL (libsql:// atau https://)
              </label>
              <input
                id="turso-url"
                className="field text-xs font-mono"
                value={tursoUrl}
                onChange={(e) => setTursoUrl(e.target.value)}
                placeholder="libsql://mushola-arrisalah-goenturnovihardiansyah.aws-ap-northeast-1.turso.io"
                required
              />
            </div>

            <div>
              <label className="label text-xs" htmlFor="turso-token">
                Auth Token (Database Auth Token)
              </label>
              <input
                id="turso-token"
                type="password"
                className="field text-xs font-mono"
                value={tursoToken}
                onChange={(e) => setTursoToken(e.target.value)}
                placeholder="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 text-xs font-bold"
            >
              {loading ? "Menghubungkan & Membuat Tabel..." : "Hubungkan Database Turso"}
            </button>
          </form>

          {/* Tips Turso */}
          <div className="rounded-[12px] bg-surface2 p-3 text-xs space-y-2 text-mute">
            <p className="font-bold text-ink flex items-center justify-between">
              <span>💡 Tips Praktis Turso untuk Anda:</span>
              <a
                href="https://turso.tech/app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-bold text-brand hover:underline"
              >
                Dashboard Turso <ExternalLink size={11} />
              </a>
            </p>
            <ul className="list-disc space-y-1 pl-4 text-[11px]">
              <li>
                <strong>Opsi Cepat:</strong> Anda bisa langsung memakai <strong>Database URL</strong> dan <strong>Auth Token Turso</strong> yang sama dengan proyek Mushola Arrisalah! Tabel khusus <code>hidup_terarah_app_data</code> akan dibuat otomatis dan terisolasi secara aman tanpa mengganggu data Mushola.
              </li>
              <li>
                <strong>Opsi Buat Database Baru:</strong> Di dashboard Turso (turso.tech), klik <em>Create Database</em> (misal: <code>hidup-terarah</code>) lalu buat Token baru untuk database tersebut.
              </li>
              <li>
                <strong>Tanpa Perlu Jalankan SQL Manual:</strong> Sistem kami otomatis mendeteksi dan membuat tabel database saat Anda mengklik tombol <em>Hubungkan Database Turso</em> di atas!
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ================= FORM PANTRY (Paling Instan) ================= */}
      {provider === "pantry" && (
        <div className="space-y-3 rounded-[16px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Sparkles size={14} className="text-mint" /> Pantry Cloud (Zero Setup)
            </p>
            <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
              Super Cepat
            </span>
          </div>

          <p className="text-xs text-mute">
            Layanan cloud JSON storage gratis selamanya. Cukup masukkan email di situs Pantry untuk mendapatkan 1 Pantry ID unik!
          </p>

          <form onSubmit={handleSavePantry} className="space-y-3 pt-1">
            <div>
              <label className="label text-xs" htmlFor="pantry-id">
                Pantry ID
              </label>
              <input
                id="pantry-id"
                className="field text-xs font-mono"
                value={pantryId}
                onChange={(e) => setPantryId(e.target.value)}
                placeholder="misal: a1b2c3d4-e5f6-7890-abcd-1234567890ef"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 text-xs font-bold"
            >
              {loading ? "Menghubungkan..." : "Hubungkan Pantry Cloud"}
            </button>
          </form>

          <div className="rounded-[12px] bg-surface2 p-3 text-xs space-y-2 text-mute">
            <p className="font-bold text-ink flex items-center justify-between">
              <span>Cara Mendapatkan Pantry ID (10 Detik):</span>
              <a
                href="https://getpantry.cloud/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-bold text-brand hover:underline"
              >
                Buka getpantry.cloud <ExternalLink size={11} />
              </a>
            </p>
            <p className="text-[11px]">
              Buka getpantry.cloud &gt; ketik email &gt; salin Pantry ID &gt; tempel di atas dan klik Hubungkan!
            </p>
          </div>
        </div>
      )}

      {/* ================= FORM UPSTASH (Manual) ================= */}
      {provider === "upstash" && (
        <div className="space-y-3 rounded-[16px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Zap size={14} className="text-amber-500" /> Upstash Redis (Manual REST URL & Token)
            </p>
            <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
              Anti-Pause · 24/7 Aktif
            </span>
          </div>

          <p className="text-xs text-mute">
            Gunakan jika Anda membuat database langsung di website Upstash. Kuota <strong>10.000 request/hari gratis</strong> dan tidak pernah di-pause.
          </p>

          <form onSubmit={handleSaveUpstash} className="space-y-3 pt-1">
            <div>
              <label className="label text-xs" htmlFor="upstash-url">
                REST URL
              </label>
              <input
                id="upstash-url"
                className="field text-xs font-mono"
                value={upstashUrl}
                onChange={(e) => setUpstashUrl(e.target.value)}
                placeholder="https://glorious-whale-12345.upstash.io"
                required
              />
            </div>

            <div>
              <label className="label text-xs" htmlFor="upstash-token">
                REST Token
              </label>
              <input
                id="upstash-token"
                type="password"
                className="field text-xs font-mono"
                value={upstashToken}
                onChange={(e) => setUpstashToken(e.target.value)}
                placeholder="AXs... (UPSTASH_REDIS_REST_TOKEN)"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 text-xs font-bold"
            >
              {loading ? "Menghubungkan..." : "Hubungkan Upstash Redis"}
            </button>
          </form>
        </div>
      )}

      {/* ================= FORM SUPABASE ================= */}
      {provider === "supabase" && (
        <div className="space-y-3 rounded-[16px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Database size={14} className="text-sky" /> Supabase (PostgreSQL)
            </p>
          </div>

          <div className="rounded-[12px] bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-bold">⚠️ Kenapa project Supabase Anda disuruh upgrade?</p>
            <p className="text-[11px]">
              Supabase Free Plan membatasi maksimal 2 project. Anda cukup <strong>Hapus (Delete) salah satu project lama yang tidak terpakai</strong> di dashboard Supabase agar bisa membuat project baru untuk Hidup Terarah secara gratis tanpa bayar!
            </p>
          </div>

          <form onSubmit={handleSaveSupabase} className="space-y-3 pt-1">
            <div>
              <label className="label text-xs" htmlFor="supa-url">
                Project URL
              </label>
              <input
                id="supa-url"
                className="field text-xs font-mono"
                value={supaUrl}
                onChange={(e) => setSupaUrl(e.target.value)}
                placeholder="https://xyzabcdefghijklm.supabase.co"
                required
              />
            </div>

            <div>
              <label className="label text-xs" htmlFor="supa-key">
                Anon Public Key
              </label>
              <input
                id="supa-key"
                type="password"
                className="field text-xs font-mono"
                value={supaKey}
                onChange={(e) => setSupaKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 text-xs font-bold"
            >
              {loading ? "Menghubungkan..." : "Hubungkan Supabase"}
            </button>
          </form>

          <div className="rounded-[12px] bg-surface2 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink">Skrip SQL Supabase:</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1 font-bold text-brand hover:underline"
              >
                {isCopied ? <Check size={12} className="text-mint" /> : <Copy size={12} />}
                {isCopied ? "Tersalin!" : "Salin SQL"}
              </button>
            </div>
            <pre className="max-h-28 overflow-x-auto rounded-[8px] bg-ink p-2 text-[10px] font-mono text-zinc-300">
              {SQL_SETUP_SCRIPT}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
