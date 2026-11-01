import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useStore } from "../store";
import { Logo } from "../ui";
import { HeroArt } from "../art";

const ZONES = [["Asia/Jakarta", "WIB · Jakarta"], ["Asia/Makassar", "WITA · Makassar"], ["Asia/Jayapura", "WIT · Jayapura"]];

export const Auth = () => {
  const { register, login } = useStore();
  const [mode, setMode] = useState<"daftar" | "masuk">("daftar");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [tz, setTz] = useState("Asia/Jakarta"); const [demo, setDemo] = useState(true);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "masuk") return login(email.trim());
    register(name.trim() || email.split("@")[0] || "Kamu", email.trim(), tz, demo);
  };
  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-8">
      <div className="order-2 lg:order-1">
        <div className="relative overflow-hidden rounded-[32px] border border-line bg-gradient-to-br from-rose-bg via-peach-bg to-butter-bg p-6 sm:p-10" style={{ boxShadow: "var(--shadow)" }}>
          <p className="eyebrow">Teman menata hidup</p>
          <h1 className="mt-2 max-w-md font-display text-[40px] font-semibold leading-[1.02] text-ink sm:text-[54px]">Langkah kecil, arah yang jelas.</h1>
          <p className="mt-4 max-w-sm text-[15px] text-ink2">Tujuan, kebiasaan, jadwal, dan uangmu dalam satu layar. Kalau mulai melenceng, kami ingatkan dengan sopan.</p>
          <div className="mt-6 h-[220px] sm:h-[280px]"><HeroArt /></div>
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <div className="mb-8 flex items-center gap-3"><Logo size={44} /><div><p className="font-display text-xl font-semibold">Hidup Terarah</p><p className="text-xs text-mute">Jujur tapi tidak menghakimi.</p></div></div>
        <div className="card p-6 sm:p-8">
          <div className="mb-6 inline-flex rounded-[14px] border border-line bg-surface2 p-1">
            {(["daftar", "masuk"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-[10px] px-4 py-2 text-sm font-bold capitalize ${mode === m ? "bg-surface text-ink shadow-sm" : "text-mute"}`}>{m}</button>)}
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "daftar" && <div><label className="label" htmlFor="a-n">Nama panggilan</label><input id="a-n" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Misal: Guntur" required /></div>}
            <div><label className="label" htmlFor="a-e">Email</label><input id="a-e" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@email.com" required /></div>
            <div><label className="label" htmlFor="a-p">Kata sandi</label><input id="a-p" type="password" minLength={8} className="field" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Minimal 8 karakter" required /></div>
            {mode === "daftar" && (<>
              <div><label className="label" htmlFor="a-z">Zona waktu</label><select id="a-z" className="field" value={tz} onChange={(e) => setTz(e.target.value)}>{ZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-line bg-surface2 p-3.5">
                <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
                <span className="text-sm"><span className="font-bold text-ink">Isi dengan contoh data</span><span className="block text-xs text-mute">Biar bisa langsung lihat semua fitur. Bisa dihapus kapan saja di Pengaturan.</span></span>
              </label>
            </>)}
            <button className="btn btn-primary w-full py-3">{mode === "daftar" ? "Buat akun" : "Masuk"} <ArrowRight size={16} /></button>
          </form>
          <p className="mt-5 flex items-start gap-2 text-xs text-mute"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-mint" /> Data tersimpan aman secara offline-first dan otomatis tersinkronisasi antar perangkat saat database cloud dihubungkan.</p>
        </div>
      </div>
    </div>
  );
};
