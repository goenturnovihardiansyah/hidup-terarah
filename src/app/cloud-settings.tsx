import { useState } from "react";
import { Cloud, CloudCheck, CloudOff, RefreshCw, Copy, Check, ExternalLink, Database, AlertCircle } from "lucide-react";
import { useStore } from "./store";
import { SQL_SETUP_SCRIPT } from "./supabase";

export const CloudDatabaseSection = () => {
  const {
    cloudStatus,
    cloudError,
    lastSyncedAt,
    cloudConfig,
    syncNow,
    pullFromCloud,
    updateCloudConfig,
    disconnectCloud,
    toast,
  } = useStore();

  const [url, setUrl] = useState(cloudConfig?.url || "");
  const [anonKey, setAnonKey] = useState(cloudConfig?.anonKey || "");
  const [testing, setTesting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isConnected = cloudStatus !== "unconfigured" && cloudConfig !== null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      toast("URL dan Anon Key Supabase harus diisi.");
      return;
    }

    setTesting(true);
    const res = await updateCloudConfig(url.trim(), anonKey.trim());
    setTesting(false);

    if (res.warning) {
      toast(res.warning);
    }
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
      toast("Gagal menyalin otomatis. Silakan salin manual.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div
        className={`flex items-start justify-between gap-3 rounded-[16px] border p-4 transition-all ${
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
                {isConnected ? "Database Cloud Terhubung" : "Belum Terhubung ke Cloud"}
              </span>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  isConnected ? "bg-mint/15 text-mint" : "bg-line text-mute"
                }`}
              >
                {isConnected ? "Aktif" : "Offline"}
              </span>
            </div>
            <p className="mt-1 text-xs text-mute">
              {isConnected
                ? "Data Anda otomatis tersinkronisasi. Semua tujuan, kebiasaan, dan jadwal dapat dibuka dari HP maupun Laptop kapan saja."
                : "Saat ini data hanya tersimpan di browser perangkat ini. Hubungkan database gratis (Supabase) agar dapat dibuka di semua perangkat."}
            </p>
            {lastSyncedAt && isConnected && (
              <p className="mt-1.5 text-[11px] text-ink2 font-medium">
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
        </div>
      )}

      {/* Form Konfigurasi Supabase */}
      <form onSubmit={handleSave} className="space-y-3 pt-2">
        <div className="rounded-[16px] border border-line bg-surface p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-mute flex items-center gap-1.5">
            <Database size={13} /> Kredensial Supabase (Gratis)
          </p>

          <div>
            <label className="label text-xs" htmlFor="supa-url">
              Project URL
            </label>
            <input
              id="supa-url"
              className="field text-xs font-mono"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
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
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              type="submit"
              disabled={testing}
              className="btn btn-primary py-2 text-xs font-bold"
            >
              {testing ? "Memeriksa Koneksi..." : isConnected ? "Simpan Perubahan" : "Hubungkan Database"}
            </button>

            {isConnected && (
              <button
                type="button"
                onClick={disconnectCloud}
                className="btn btn-ghost py-2 text-xs font-bold text-coral hover:bg-coral-bg/20"
              >
                Putuskan Koneksi
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Panduan 3 Langkah Praktis Supabase */}
      <div className="rounded-[16px] border border-line/60 bg-surface2/60 p-4 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-ink">Cara Buat Database Gratis (1 Menit):</span>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-bold text-brand hover:underline"
          >
            Buka Supabase <ExternalLink size={12} />
          </a>
        </div>

        <ol className="list-decimal space-y-1.5 pl-4 text-mute">
          <li>
            Daftar gratis di <strong>supabase.com</strong> dan klik <strong>New Project</strong>.
          </li>
          <li>
            Di dashboard proyek, buka menu <strong>SQL Editor</strong> di sebelah kiri, klik <strong>New Query</strong>, tempel skrip di bawah ini lalu klik <strong>Run</strong>:
          </li>
        </ol>

        <div className="relative">
          <pre className="max-h-36 overflow-x-auto rounded-[12px] bg-ink p-3 text-[11px] font-mono text-zinc-200">
            {SQL_SETUP_SCRIPT}
          </pre>
          <button
            type="button"
            onClick={handleCopySql}
            className="absolute right-2 top-2 flex items-center gap-1.5 rounded-[8px] bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur hover:bg-white/20"
          >
            {isCopied ? <Check size={12} className="text-mint" /> : <Copy size={12} />}
            {isCopied ? "Tersalin!" : "Salin SQL"}
          </button>
        </div>

        <ol start={3} className="list-decimal space-y-1.5 pl-4 text-mute">
          <li>
            Buka menu <strong>Project Settings (ikon gir) &gt; API</strong>, salin <strong>Project URL</strong> dan <strong>anon / public key</strong> ke form di atas, lalu klik <strong>Hubungkan Database</strong>.
          </li>
        </ol>
      </div>
    </div>
  );
};
