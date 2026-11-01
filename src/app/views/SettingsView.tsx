import { useEffect, useState } from "react";
import { Download, Trash2, LogOut, BellRing, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useStore } from "../store";
import { PageHead, Panel, Segmented, ConfirmButton } from "../ui";
import { parseRupiah } from "../forms";
import type { Theme, Tone } from "../types";

export const SettingsView = () => {
  const s = useStore();
  const { data } = s;
  const [name, setName] = useState(data.user?.name ?? ""); const [email, setEmail] = useState(data.user?.email ?? "");
  const [daily, setDaily] = useState(data.prefs.daily_budget.toLocaleString("id-ID"));
  const [monthly, setMonthly] = useState(data.prefs.monthly_budget.toLocaleString("id-ID"));
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  useEffect(() => { setName(data.user?.name ?? ""); setEmail(data.user?.email ?? ""); }, [data.user?.id]); // eslint-disable-line

  const exportData = async () => {
    const json = JSON.stringify(data, null, 2);
    const filename = `hidup-terarah-${new Date().toISOString().slice(0, 10)}.json`;
    const w = window as unknown as { claude?: { use: (n: string) => Promise<{ save: (o: { filename: string; data: string }) => Promise<unknown> } | null> } };
    try {
      const dl = w.claude ? await w.claude.use("downloads") : null;
      if (dl) {
        try { await dl.save({ filename, data: json }); s.toast("Data diekspor ke file JSON."); }
        catch (e) { if ((e as { code?: string })?.code !== "declined") s.toast("Ekspor tidak tersedia di tampilan ini."); }
        return;
      }
    } catch { /* lanjut ke cara biasa */ }
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    s.toast("Data diekspor ke file JSON.");
  };
  const askPerm = async () => { try { const p = await Notification.requestPermission(); setPerm(p); } catch { setPerm("denied"); } };
  const money = (v: string, set: (x: string) => void) => { const n = parseRupiah(v); set(n ? n.toLocaleString("id-ID") : ""); };

  return (
    <div>
      <PageHead eyebrow="Akun & pengaturan" title="Pengaturan" text="Sesuaikan aplikasi dengan caramu menjalani hari." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profil & preferensi">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); s.setProfile(name.trim() || "Kamu", email.trim()); s.toast("Profil disimpan."); }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="st-n">Nama</label><input id="st-n" className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className="label" htmlFor="st-e">Email</label><input id="st-e" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>
            <div><label className="label" htmlFor="st-z">Zona waktu</label>
              <select id="st-z" className="field" value={data.prefs.timezone} onChange={(e) => s.setPrefs({ timezone: e.target.value })}>
                <option value="Asia/Jakarta">WIB · Jakarta</option><option value="Asia/Makassar">WITA · Makassar</option><option value="Asia/Jayapura">WIT · Jayapura</option>
              </select></div>
            <div><span className="label">Tampilan</span><Segmented<Theme> value={data.prefs.theme} onChange={(v) => s.setPrefs({ theme: v })} options={[{ v: "sistem", l: "Ikuti sistem" }, { v: "terang", l: "Terang" }, { v: "gelap", l: "Gelap" }]} /></div>
            <button className="btn btn-primary"><Save size={15} /> Simpan profil</button>
          </form>
        </Panel>

        <Panel title="Atur waktu & nada pengingat">
          <div className="space-y-5">
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-bold text-ink">Pengingat otomatis</span><span className="text-xs text-mute">Saat jam agenda/kebiasaan tiba</span></span><Switch checked={data.prefs.reminder_enabled} onCheckedChange={(v) => s.setPrefs({ reminder_enabled: v })} /></label>
            <div>
              <span className="label">Nada teguran</span>
              <div className="grid grid-cols-2 gap-2">
                {([["lembut", "🌿 Lembut", "Seperti teman yang mengingatkan"], ["tegas", "⚡ Tegas", "Langsung, tanpa basa-basi"]] as [Tone, string, string][]).map(([v, l, d]) => (
                  <button key={v} type="button" onClick={() => s.setPrefs({ reminder_tone: v })} className={`rounded-[16px] border p-3 text-left transition ${data.prefs.reminder_tone === v ? "border-brand bg-brandsoft" : "border-line hover:border-ink2"}`}>
                    <span className="block text-sm font-bold text-ink">{l}</span><span className="text-xs text-mute">{d}</span>
                  </button>
                ))}
              </div>
            </div>
            <div><label className="label" htmlFor="st-th">Tegur setelah terlewat</label>
              <select id="st-th" className="field w-auto" value={data.prefs.miss_threshold} onChange={(e) => s.setPrefs({ miss_threshold: Number(e.target.value) })}>
                {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} kali dalam 7 hari</option>)}
              </select></div>
            <div className="rounded-[16px] bg-surface2 p-3.5">
              <p className="flex items-center gap-2 text-sm font-bold text-ink"><BellRing size={15} /> Notifikasi perangkat</p>
              <p className="mt-1 text-xs text-mute">{perm === "granted" ? "Aktif. Notifikasi muncul selama aplikasi terbuka." : perm === "denied" ? "Diblokir oleh browser. Izinkan lewat pengaturan situs." : perm === "unsupported" ? "Browser ini tidak mendukung notifikasi." : "Izinkan supaya pengingat muncul sebagai notifikasi."}</p>
              {perm === "default" && <button onClick={askPerm} className="btn btn-ghost mt-2 py-2 text-xs">Izinkan notifikasi</button>}
            </div>
          </div>
        </Panel>

        <Panel title="Batas belanja">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); s.setPrefs({ daily_budget: parseRupiah(daily), monthly_budget: parseRupiah(monthly) }); s.toast("Batas belanja disimpan."); }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="st-d">Harian (Rp)</label><input id="st-d" inputMode="numeric" className="field" value={daily} onChange={(e) => money(e.target.value, setDaily)} /></div>
              <div><label className="label" htmlFor="st-m">Bulanan (Rp)</label><input id="st-m" inputMode="numeric" className="field" value={monthly} onChange={(e) => money(e.target.value, setMonthly)} /></div>
            </div>
            <button className="btn btn-primary"><Save size={15} /> Simpan batas</button>
          </form>
        </Panel>

        <Panel title="Kelola data pribadi" sub="Datamu milikmu. Ekspor atau hapus kapan saja.">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={exportData}><Download size={15} /> Ekspor data (JSON)</button>
            <button className="btn btn-ghost" onClick={s.logout}><LogOut size={15} /> Keluar</button>
            <ConfirmButton className="btn btn-ghost text-coral" confirmText="Klik lagi untuk hapus permanen" onConfirm={s.wipe}><Trash2 size={15} /> Hapus semua data</ConfirmButton>
          </div>
          <p className="mt-3 text-xs text-mute">Prototipe ini menyimpan data di browser perangkat ini (localStorage). Versi produksi memakai database dan login sesuai PRD.</p>
        </Panel>
      </div>
    </div>
  );
};
