# 🌿 Hidup Terarah — Teman Menata Hidup

> **"Langkah kecil, arah yang jelas."**  
> Aplikasi produktivitas personal yang holistik: menyatukan tujuan hidup (*goals*), kebiasaan (*habits*), jadwal harian (*schedule*), dan keuangan pribadi (*finance*) dalam satu layar yang tenang, jujur, dan tidak menghakimi.

---

## ✨ Fitur Utama

1. **🎯 Tujuan Hidup (SMART Life Goals)**
   - Pecah target besar menjadi langkah-langkah kecil (*micro-steps*) yang mudah dicentang.
   - Indikator cincin progres visual dinamis dan countdown tenggat waktu.
   - Kolom refleksi alasan (*why*) untuk menjaga komitmen.

2. **🌱 Pelacak Kebiasaan (Habits Tracker)**
   - Berbasis prinsip *Atomic Habits* dan aturan 2 menit.
   - Mendukung frekuensi harian, mingguan, dan bulanan.
   - Visualisasi **Grid 28 Hari** interaktif dan *Streak counter* (api).

3. **📅 Jadwal & Agenda (Schedule & Calendar)**
   - Tampilan linimasa harian dan mingguan.
   - Deteksi otomatis agenda terlewat (*terlewat*) dengan opsi geser/jadwalkan ulang ke besok dalam 1 klik.

4. **💰 Keuangan Sederhana (Finance & Budgeting)**
   - Catat pemasukan dan pengeluaran harian dengan kategori berikon.
   - Pembatas belanja harian & bulanan (Rupiah IDR) dengan deteksi deviasi anggaran.

5. **⚡ Mesin Pengingat & Teguran Ringan (Smart Drift Detection)**
   - Berjalan di background setiap 30 detik untuk mendeteksi tanda-tanda melenceng.
   - Pilihan nada suara: **"🌿 Lembut"** (penuh empati) atau **"⚡ Tegas"** (langsung tanpa basa-basi).
   - Terintegrasi dengan *Browser Notification API*.

6. **📊 Evaluasi & Refleksi Mingguan (Weekly Review)**
   - Grafik konsistensi 8 pekan terakhir (SVG chart).
   - Jurnal refleksi mingguan: apa yang berhasil dan apa yang ingin diperbaiki.

7. **🔒 Local-First & Privasi Terjaga**
   - Data tersimpan lokal di browser (`localStorage`), tanpa mengirim data pribadi ke server mana pun.
   - Dilengkapi fitur **Ekspor Data JSON** di menu Pengaturan.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Menjalankan Secara Lokal

```bash
# 1. Install dependencies
pnpm install

# 2. Jalankan development server
pnpm dev

# 3. Build untuk produksi
pnpm build
```

---

## ☁️ Deployment ke Vercel

Proyek ini telah dilengkapi dengan `vercel.json` dan `.npmrc` untuk deployment instan di [Vercel](https://vercel.com/):

1. Hubungkan repositori GitHub ini ke dashboard Vercel.
2. Vercel akan otomatis mengenali preset framework **Vite**.
3. Klik **Deploy** dan aplikasi langsung online.
