import type { Habit, StreakMilestone } from "./types";

export interface MotivationalQuote {
  quote: string;
  author: string;
  role: string;
  tagline: string;
  advice: string;
}

export const DAILY_MOTIVATIONS: MotivationalQuote[] = [
  {
    quote: "Perubahan kecil tidak terlihat perbedaannya dalam sehari, tetapi dampaknya berlipat ganda dalam hitungan bulan.",
    author: "James Clear",
    role: "Penulis Buku Atomic Habits",
    tagline: "1% lebih baik setiap hari.",
    advice: "Fokus pada sistem dan kebiasaan kecil hari ini, hasil besar akan mengikuti dengan sendirinya.",
  },
  {
    quote: "Fokus pada apa yang ada di depanmu hari ini. Setiap tindakan kecil membantumu membangun hidup yang utuh.",
    author: "Marcus Aurelius",
    role: "Kaisar Romawi & Filsuf Stoik",
    tagline: "Kuasai hari ini.",
    advice: "Jangan cemaskan masa depan yang belum tiba. Selesaikan apa yang bisa kamu selesaikan saat ini.",
  },
  {
    quote: "Perjalanan seribu mil selalu dimulai dari satu langkah kecil.",
    author: "Lao Tzu",
    role: "Filsuf Kuno Tao Te Ching",
    tagline: "Mulai dari langkah pertama.",
    advice: "Sekecil apa pun langkahmu hari ini, itu jauh lebih berharga daripada diam tanpa pergerakan.",
  },
  {
    quote: "Hal-hal besar tidak pernah diraih secara instan, melainkan oleh rangkaian langkah konsisten setiap hari.",
    author: "Steve Jobs",
    role: "Pendiri Apple Inc.",
    tagline: "Karya terbaik butuh ketekunan.",
    advice: "Cintai proses harianmu. Detail kecil yang kamu jaga hari ini yang membuat hasil akhir berbeda.",
  },
  {
    quote: "Keberhasilan bukan milik orang pintar, tapi milik mereka yang senantiasa berjuang dan pantang menyerah.",
    author: "B.J. Habibie",
    role: "Presiden RI ke-3 & Teknokrat",
    tagline: "Disiplin dan tekad baja.",
    advice: "Kecerdasan tanpa konsistensi mudah terkikis. Tetaplah melangkah meskipun jalan terasa menanjak.",
  },
  {
    quote: "Saya tidak takut pada orang yang melatih 10.000 tendangan sekali, tapi pada orang yang melatih 1 tendangan 10.000 kali.",
    author: "Bruce Lee",
    role: "Legenda Seni Bela Diri",
    tagline: "Kekuatan pengulangan harian.",
    advice: "Jangan bosan mengulang kebiasaan baik. Pengulangan yang sama adalah induk dari keahlian.",
  },
  {
    quote: "Bukan karena segala hal sulit kita tidak berani, tetapi karena kita tidak berani maka segala hal menjadi sulit.",
    author: "Seneca",
    role: "Filsuf Stoik Romawi",
    tagline: "Keberanian mengambil langkah.",
    advice: "Rasa ragu hilang saat kamu mulai bertindak. Sentuh agendamu sekarang walau hanya 2 menit.",
  },
  {
    quote: "Tidak masalah seberapa lambat engkau berjalan, selama engkau tidak pernah berhenti.",
    author: "Confucius",
    role: "Filsuf & Pendidik",
    tagline: "Tetap melangkah ke depan.",
    advice: "Kecepatan bukan segalanya. Yang menentukan kemenangan sejati adalah arah yang benar dan ketahanan.",
  },
  {
    quote: "Kemenangan harian yang kecil, bila diulang secara konsisten setiap hari, menghasilkan mahakarya seiring waktu.",
    author: "Robin Sharma",
    role: "Penulis The 5 AM Club",
    tagline: "Kemenangan harian.",
    advice: "Jadikan hari ini sebagai satu hari kemenangan kecil. Coret satu agenda, tuntaskan satu kebiasaan.",
  },
  {
    quote: "Disiplin adalah jembatan penghubung antara impian dan pencapaian nyata.",
    author: "Jim Rohn",
    role: "Mentor Pengembangan Diri Dunia",
    tagline: "Jembatan pencapaian.",
    advice: "Disiplin hari ini terasa berat sesaat, tetapi penyesalan di masa depan terasa jauh lebih berat.",
  },
  {
    quote: "Kunci hidup bukanlah memprioritaskan jadwalmu, melainkan menjadwalkan hal yang benar-benar menjadi prioritarmu.",
    author: "Stephen Covey",
    role: "Penulis 7 Habits of Highly Effective People",
    tagline: "Prioritas di atas kesibukan.",
    advice: "Jangan biarkan hari ini terhabiskan oleh hal mendesak yang ternyata tidak penting bagi masa depanmu.",
  },
  {
    quote: "Bukan apa yang kita lakukan sesekali yang membentuk hidup kita, tapi apa yang kita lakukan secara konsisten.",
    author: "Tony Robbins",
    role: "Motivator & Penulis Kelas Dunia",
    tagline: "Konsistensi membentuk takdir.",
    advice: "Keputusan kecil yang kamu ambil hari ini adalah cetak biru masa depan yang sedang kamu bangun.",
  },
  {
    quote: "Seseorang bisa duduk di bawah naungan pohon hari ini karena ada yang menanam pohon itu bertahun-tahun yang lalu.",
    author: "Warren Buffett",
    role: "Investor Legendaris Dunia",
    tagline: "Investasi kebiasaan harian.",
    advice: "Apa yang kamu tanam hari ini melalui jadwal dan kebiasaan akan menjadi tempat bernaungmu kelak.",
  },
  {
    quote: "Rahasia untuk maju adalah memulai. Rahasia memulai adalah memecah tugas besar menjadi bagian-bagian kecil.",
    author: "Mark Twain",
    role: "Sastrawan & Penulis Legendaris",
    tagline: "Pecah jadi langkah mudah.",
    advice: "Saat target terasa luar biasa berat, potong target itu menjadi 1 langkah kecil yang mustahil untuk gagal.",
  },
  {
    quote: "Kita adalah apa yang kita lakukan berulang-ulang. Keunggulan bukanlah tindakan tunggal, melainkan kebiasaan.",
    author: "Aristoteles",
    role: "Filsuf Yunani Kuno",
    tagline: "Karakter adalah kebiasaan.",
    advice: "Bentuk dirimu melalui tindakan-tindakan kecil yang kamu ulang dengan bangga setiap hari.",
  },
  {
    quote: "Sukses adalah kumpulan dari usaha-usaha kecil yang diulang terus-menerus hari demi hari.",
    author: "Robert Collier",
    role: "Penulis The Secret of the Ages",
    tagline: "Usaha kecil yang menumpuk.",
    advice: "Jangan remehkan ceklis kecilmu hari ini. Tetesan air yang konsisten mampu melubangi batu karang.",
  },
  {
    quote: "Motivasi membawamu mulai, tetapi kebiasaan dan komitmen yang membuatmu tetap berjalan.",
    author: "Jim Ryun",
    role: "Atlet Olimpiade Dunia",
    tagline: "Komitmen menjaga arah.",
    advice: "Saat semangat sedang redup, biarkan jadwal dan komitmenmu yang memandu langkahmu.",
  },
  {
    quote: "Waktu terbaik untuk menanam pohon adalah 20 tahun yang lalu. Waktu terbaik kedua adalah hari ini.",
    author: "Pepatah Kuno",
    role: "Kebijaksanaan Sepanjang Masa",
    tagline: "Mulai hari ini, sekarang.",
    advice: "Lupakan hari-hari yang kemarin terlewat. Hari ini lembaran baru yang siap kamu ukir dengan baik.",
  },
  {
    quote: "Jangan menghitung hari-harimu, tetapi buatlah setiap harimu berarti.",
    author: "Muhammad Ali",
    role: "Juara Tinju Dunia Sejati",
    tagline: "Beri makna pada harimu.",
    advice: "Jadikan setiap jam hari ini memiliki tujuan yang jelas dan bernilai.",
  },
  {
    quote: "Bakat tanpa kerja keras yang konsisten tidak akan menghasilkan apa pun.",
    author: "Cristiano Ronaldo",
    role: "Ikon Sepak Bola Dunia",
    tagline: "Dedikasi tanpa kompromi.",
    advice: "Disiplin adalah fondasi utama yang mengubah potensi mentah menjadi prestasi luar biasa.",
  },
  {
    quote: "Bukan apa yang kamu dapatkan saat mencapai target, melainkan menjadi siapa dirimu selama proses perjuangan.",
    author: "Zig Ziglar",
    role: "Penulis & Motivator Legendaris",
    tagline: "Transformasi diri.",
    advice: "Tiap kali kamu disiplin menuntaskan agenda, kamu sedang membentuk versi terbaik dari dirimu.",
  },
  {
    quote: "Kualitas hidupmu pada akhirnya ditentukan oleh kualitas kebiasaan yang kamu rawat setiap hari.",
    author: "Brian Tracy",
    role: "Pakar Produktivitas & Kepemimpinan",
    tagline: "Rawat kebiasaan terbaikmu.",
    advice: "Kebiasaan baik itu sulit dibangun tapi mudah dijalani; kebiasaan buruk mudah dimulai tapi merusak masa depan.",
  },
  {
    quote: "Kemajuan yang lambat dan terarah tetap jauh lebih cepat daripada diam di tempat dengan seribu alasan.",
    author: "Simon Sinek",
    role: "Penulis Start with Why",
    tagline: "Bergerak dengan alasan kuat.",
    advice: "Ingat kembali alasan mengapa kamu memulai semua ini. Alasan itu yang akan menerangi jalanmu.",
  },
  {
    quote: "Jangan biarkan apa yang tidak bisa kamu lakukan mengganggu apa yang bisa kamu lakukan hari ini.",
    author: "John Wooden",
    role: "Pelatih Legendaris & Tokoh Karakter",
    tagline: "Fokus pada apa yang kamu kendalikan.",
    advice: "Kendalikan energimu hanya untuk hal-hal yang berada di bawah kendali tindakanmu.",
  },
  {
    quote: "Satu jam yang kamu luangkan untuk merencanakan dan mengevaluasi harimu bernilai berjam-jam kerja yang terbuang sia-sia.",
    author: "Dwight D. Eisenhower",
    role: "Jenderal & Presiden AS",
    tagline: "Arah lebih utama dari kecepatan.",
    advice: "Berhentilah sejenak untuk melihat peta harimu. Melangkah ke arah yang benar adalah setengah kemenangan.",
  },
  {
    quote: "Konsistensi adalah fondasi dari rasa percaya diri sejati pada dirimu sendiri.",
    author: "Mel Robbins",
    role: "Penulis The 5 Second Rule",
    tagline: "Tepati janji pada diri sendiri.",
    advice: "Setiap kali kamu menepati janji kecil pada dirimu sendiri, rasa percaya dirimu tumbuh berlipat.",
  },
  {
    quote: "Hiduplah seolah-olah kamu akan mati besok. Belajarlah seolah-olah kamu akan hidup selamanya.",
    author: "Mahatma Gandhi",
    role: "Tokoh Perdamaian Dunia",
    tagline: "Beri makna & terus bertumbuh.",
    advice: "Gunakan waktumu untuk bertumbuh dan memberi kebaikan kepada orang-orang di sekitarmu.",
  },
  {
    quote: "Kesabaran dan ketekunan memiliki efek magis di hadapan rintangan yang paling mustahil sekalipun.",
    author: "John Quincy Adams",
    role: "Negarawan & Pemimpin",
    tagline: "Ketekunan menembus batas.",
    advice: "Jangan menyerah saat menghadapi fase jenuh. Di sanalah letak pembeda antara yang bertahan dan yang gugur.",
  },
  {
    quote: "Jika kamu tidak merancang rencana hidupmu sendiri, besar kemungkinan kamu akan terjebak dalam rencana orang lain.",
    author: "Jim Rohn",
    role: "Filsuf Bisnis",
    tagline: "Pegang kendali hidupmu.",
    advice: "Susun jadwalmu dengan penuh kesadaran. Hidupmu adalah tanggung jawabmu sepenuhnya.",
  },
  {
    quote: "Hari esok adalah hasil dari apa yang kamu lakukan dengan sungguh-sungguh hari ini.",
    author: "Eleanor Roosevelt",
    role: "Aktivis Kemanusiaan & Penulis",
    tagline: "Hari esok dimulai hari ini.",
    advice: "Masa depan yang indah tidak datang tiba-tiba. Ia dibangun dari kepingan hari ini yang kamu jalani dengan baik.",
  },
  {
    quote: "Pelan tapi terarah, itu tetap maju. Arah yang jelas selalu mengalahkan kecepatan tanpa tujuan.",
    author: "Hidup Terarah",
    role: "Prinsip Utama Aplikasi",
    tagline: "Langkah kecil, arah yang jelas.",
    advice: "Bernapaslah sejenak. Kamu sudah melangkah sejauh ini, dan setiap langkah kecil tetaplah kemajuan.",
  },
];

/** Mengembalikan quote harian yang konsisten sepanjang hari dan berganti setiap tengah malam */
export const getDailyHeroQuote = (date = new Date()): MotivationalQuote => {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const idx = Math.abs(dayOfYear) % DAILY_MOTIVATIONS.length;
  return DAILY_MOTIVATIONS[idx];
};

/** Mengembalikan quote refleksi yang berbeda agar saling melengkapi dengan hero card */
export const getDailyReflectionQuote = (date = new Date()): MotivationalQuote => {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  // Beri offset agar quote di refleksi dan hero berbeda
  const idx = Math.abs(dayOfYear + 7) % DAILY_MOTIVATIONS.length;
  return DAILY_MOTIVATIONS[idx];
};

/**
 * Menyusun konten pop-up apresiasi ketika kebiasaan mencapai streak khusus (1x, 3x, 7x, 14x, 21x, dan kelipatan selanjutnya)
 */
export const getStreakMilestoneContent = (habit: Habit, count: number): StreakMilestone => {
  const habitId = habit.id;
  const habitName = habit.name;
  const habitIcon = habit.icon || "✨";
  const habitColor = habit.color || "lilac";
  const unit = habit.frequency_type === "mingguan" ? "pekan" : habit.frequency_type === "bulanan" ? "bulan" : "hari";

  if (count === 1) {
    return {
      habitId,
      habitName,
      habitIcon,
      habitColor,
      streakCount: count,
      unit,
      badge: "Langkah Pertama",
      title: "Langkah Pertama Telah Dimulai! 🌱",
      subtitle: "1 Hari Berjalan Penuh Kesadaran",
      message: `Selamat telah memulai kebiasaan "${habitName}". Mengawali adalah bagian tersulit dari setiap transformasi, dan hari ini kamu membuktikan keberanianmu untuk bergerak!`,
      quote: "Perjalanan seribu mil selalu dimulai dari satu langkah kecil.",
      author: "Lao Tzu",
    };
  }

  if (count === 3) {
    return {
      habitId,
      habitName,
      habitIcon,
      habitColor,
      streakCount: count,
      unit,
      badge: "Pola Terbentuk",
      title: "3 Hari Berturut-turut! Pola Mulai Terbentuk 🔥",
      subtitle: "3 Hari Konsisten Tanpa Jeda",
      message: `Tiga kali beruntun pada "${habitName}" membuktikan ini bukan lagi sekadar niat sesaat. Pola perilaku positif mulai mengakar kuat dalam rutinitas harianmu.`,
      quote: "Bukan apa yang kita lakukan sesekali yang membentuk hidup kita, tapi apa yang kita lakukan secara konsisten.",
      author: "Tony Robbins",
    };
  }

  if (count === 7) {
    return {
      habitId,
      habitName,
      habitIcon,
      habitColor,
      streakCount: count,
      unit,
      badge: "Pencapaian Pekanan",
      title: "1 Pekan Penuh Konsisten! Pencapaian Emas 🏆",
      subtitle: "7 Hari Disiplin Sempurna",
      message: `Luar biasa tangguh! Kamu sukses menjaga komitmen "${habitName}" selama 7 hari penuh tanpa terputus. Ini adalah bukti nyata kapasitas disiplinmu!`,
      quote: "Kita adalah apa yang kita lakukan berulang kali. Keunggulan bukanlah sebuah tindakan, melainkan kebiasaan.",
      author: "Aristoteles",
    };
  }

  if (count === 14) {
    return {
      habitId,
      habitName,
      habitIcon,
      habitColor,
      streakCount: count,
      unit,
      badge: "Disiplin Baja",
      title: "2 Pekan Tanpa Terputus! Disiplin Baja ⚡",
      subtitle: "14 Hari Mengukir Momentum",
      message: `Dua minggu berturut-turut menjalankan "${habitName}"! Rantai kebiasaanmu semakin solid dan tidak mudah goyah oleh rasa malas. Pertahankan momentum emas ini!`,
      quote: "Disiplin adalah jembatan penghubung antara impian dan pencapaian nyata.",
      author: "Jim Rohn",
    };
  }

  if (count === 21) {
    return {
      habitId,
      habitName,
      habitIcon,
      habitColor,
      streakCount: count,
      unit,
      badge: "Habit Formed",
      title: "21 Hari: Kebiasaan Resmi Terbentuk! 🌟",
      subtitle: "Milestone Emas 21 Hari",
      message: `Pencapaian legendaris! Menurut riset psikologi perilaku, 21 hari konsistensi pada "${habitName}" telah mengubah aksi sadar menjadi kebiasaan alami otakmu. Kamu telah naik level!`,
      quote: "Perubahan kecil tidak terlihat perbedaannya dalam sehari, tetapi dampaknya berlipat ganda dalam hitungan bulan.",
      author: "James Clear (Atomic Habits)",
    };
  }

  if (count === 30) {
    return {
      habitId,
      habitName,
      habitIcon,
      habitColor,
      streakCount: count,
      unit,
      badge: "Master Kebiasaan",
      title: "1 Bulan Penuh Konsistensi! Dedikasi Juara 👑",
      subtitle: "30 Hari Melampaui Batas",
      message: `Satu bulan penuh tanpa pernah menyerah pada "${habitName}". Integritasmu terhadap dirimu sendiri sangat menginspirasi. Kamu telah menjadi pribadi yang baru!`,
      quote: "Disiplin hari ini terasa ringan dibanding beban penyesalan seumur hidup.",
      author: "Jim Rohn",
    };
  }

  // Kelipatan 7 berikutnya (28, 35, 42, 49, 56, dll)
  if (count % 7 === 0) {
    const pekan = Math.floor(count / 7);
    return {
      habitId,
      habitName,
      habitIcon,
      habitColor,
      streakCount: count,
      unit,
      badge: `${pekan} Pekan Konsisten`,
      title: `${count} Hari Beruntun! Momentum Tak Terhentikan 🚀`,
      subtitle: `${pekan} Pekan Penuh Keteguhan`,
      message: `Hebat sekali! Rantai kebiasaan "${habitName}" kini telah menyala terang selama ${count} hari. Dedikasimu adalah bukti nyata komitmen hidup terarah.`,
      quote: "Kemenangan kecil harian bila diulang secara konsisten akan menghasilkan mahakarya seiring waktu.",
      author: "Robin Sharma (The 5 AM Club)",
    };
  }

  // Milestone angka bulat lainnya (50, 100, dll)
  return {
    habitId,
    habitName,
    habitIcon,
    habitColor,
    streakCount: count,
    unit,
    badge: `${count} Hari Dedikasi`,
    title: `${count} Hari Konsisten! Pencapaian Bintang 🏅`,
    subtitle: `${count} Hari Tanpa Kompromi`,
    message: `Menjaga "${habitName}" hingga ${count} hari adalah pencapaian istimewa yang hanya bisa diraih oleh mereka yang memiliki tekad baja dan fokus mendalam. Selamat!`,
    quote: "Keberhasilan bukan milik orang pintar, tapi milik mereka yang senantiasa berjuang dan pantang menyerah.",
    author: "B.J. Habibie",
  };
};

