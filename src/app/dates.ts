export const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** Minggu dimulai Senin */
export const startOfWeek = (d: Date) => { const x = startOfDay(d); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); };
export const sameDay = (a: Date, b: Date) => ymd(a) === ymd(b);
export const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const HARI_PENDEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const fmtTime = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}.${pad(d.getMinutes())}`; };
export const fmtDateLong = (d: Date) => `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
export const fmtDateShort = (d: Date) => `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]}`;
export const toLocalInput = (iso: string) => { const d = new Date(iso); return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
export const greeting = (d = new Date()) => { const h = d.getHours(); if (h < 11) return "Selamat pagi"; if (h < 15) return "Selamat siang"; if (h < 18) return "Selamat sore"; return "Selamat malam"; };
export const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");
export const rupiahShort = (n: number) => {
  const a = Math.abs(n); const s = n < 0 ? "-" : "";
  if (a >= 1_000_000) return `${s}Rp${(a / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (a >= 1000) return `${s}Rp${Math.round(a / 1000).toLocaleString("id-ID")} rb`;
  return `${s}Rp${a}`;
};
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
