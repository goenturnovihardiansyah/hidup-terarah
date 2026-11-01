/** Ilustrasi custom (SVG), tidak memakai gambar stok */
export const HeroArt = () => (
  <svg viewBox="0 0 420 260" className="h-full w-full" aria-hidden preserveAspectRatio="xMidYMax meet">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD9C2" /><stop offset=".6" stopColor="#FFE9D6" /><stop offset="1" stopColor="#FCE3EE" /></linearGradient>
      <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFC66B" /><stop offset="1" stopColor="#FF9A6B" /></linearGradient>
      <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#EEF0FF" /></linearGradient>
      <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7BC58F" /><stop offset="1" stopColor="#3F9A62" /></linearGradient>
    </defs>
    {/* jendela */}
    <rect x="200" y="14" width="190" height="150" rx="18" fill="url(#sky)" />
    <circle cx="300" cy="120" r="34" fill="url(#sun)" />
    <path d="M200 132 C240 108 270 128 300 116 C330 104 360 124 390 112 V164 H200 Z" fill="#F4B9A0" opacity=".8" />
    <path d="M200 146 C230 132 270 150 310 138 C340 130 370 142 390 136 V164 H200 Z" fill="#E99A8A" opacity=".75" />
    <rect x="292" y="14" width="6" height="150" fill="#FFF7F0" />
    <rect x="200" y="84" width="190" height="5" fill="#FFF7F0" />
    {/* catatan tempel */}
    <g transform="rotate(5 362 50)">
      <rect x="334" y="22" width="60" height="62" rx="4" fill="#FFE59A" />
      <text x="364" y="40" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#5E4A12" fontFamily="Plus Jakarta Sans">Rencana</text>
      <text x="364" y="52" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#5E4A12" fontFamily="Plus Jakarta Sans">Fokus</text>
      <text x="364" y="64" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#5E4A12" fontFamily="Plus Jakarta Sans">Jalan</text>
      <path d="M359 72 c-3-4 2-6 5-2 c3-4 8-2 5 2 l-5 5 z" fill="#F06A55" />
    </g>
    {/* meja */}
    <rect x="40" y="214" width="380" height="14" rx="7" fill="#E9C9AE" />
    <rect x="40" y="226" width="380" height="40" fill="#F2DCC8" opacity=".6" />
    {/* buku */}
    <rect x="330" y="186" width="74" height="14" rx="3" fill="#F49A7E" />
    <rect x="336" y="200" width="70" height="14" rx="3" fill="#9C8CF0" />
    <rect x="326" y="172" width="70" height="14" rx="3" fill="#FFD27A" />
    {/* laptop */}
    <path d="M170 214 h150 l-10 -8 h-130 z" fill="#C9CCE2" />
    <rect x="180" y="106" width="130" height="100" rx="10" fill="#3B3F6B" />
    <rect x="186" y="112" width="118" height="88" rx="6" fill="url(#screen)" />
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(196 ${126 + i * 24})`}>
        <rect width="14" height="14" rx="4" fill={["#7A63E8", "#2F9E62", "#E3743A"][i]} />
        <path d="M3.5 7.2 l2.6 2.6 l4.6 -5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="22" y="2" width={[66, 52, 72][i]} height="4.5" rx="2.2" fill="#C9C6EE" />
        <rect x="22" y="9" width={[44, 60, 38][i]} height="3.5" rx="1.7" fill="#E2E0F7" />
      </g>
    ))}
    {/* tanaman */}
    <g>
      <path d="M118 150 C 96 120 92 92 108 70 C 118 96 124 118 122 150 Z" fill="url(#leaf)" />
      <path d="M124 150 C 128 110 146 84 172 74 C 162 104 148 130 128 152 Z" fill="#5DB37A" />
      <path d="M116 152 C 90 140 72 120 66 96 C 92 104 108 124 118 150 Z" fill="#4FA56E" />
      <path d="M122 150 C 140 132 162 126 184 128 C 170 144 150 154 124 156 Z" fill="url(#leaf)" />
      <path d="M120 152 C 112 120 120 92 140 60" stroke="#3F8A58" strokeWidth="2" fill="none" />
      <path d="M92 150 h60 l-8 64 h-44 z" fill="#FBEFE6" />
      <path d="M92 150 h60 l-2 12 h-56 z" fill="#F1DCCD" />
    </g>
    {/* mug */}
    <rect x="58" y="182" width="30" height="32" rx="7" fill="#F28C8C" />
    <path d="M88 190 q12 2 10 12 q-2 8 -10 8" stroke="#F28C8C" strokeWidth="4" fill="none" />
    <path d="M66 172 q4 -6 0 -12 M76 172 q4 -6 0 -12" stroke="#E9C9AE" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const ArchArt = () => (
  <svg viewBox="0 0 160 130" className="w-full" aria-hidden>
    <defs><linearGradient id="arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFC9B5" /><stop offset="1" stopColor="#FCE3EE" /></linearGradient></defs>
    <path d="M30 130 V60 a50 50 0 0 1 100 0 V130 Z" fill="url(#arch)" />
    <circle cx="80" cy="76" r="18" fill="#FFB27A" opacity=".85" />
    <path d="M30 100 C 60 88 90 104 130 92 V130 H30 Z" fill="#F2A693" opacity=".6" />
    <path d="M78 112 C 66 92 66 72 76 56 C 84 74 86 92 82 112 Z" fill="#4FA56E" />
    <path d="M82 112 C 86 88 98 74 116 68 C 110 88 98 102 84 114 Z" fill="#6EC08A" />
    <path d="M78 114 C 60 106 50 94 46 78 C 64 84 74 96 80 112 Z" fill="#3F9A62" />
    <path d="M62 110 h38 l-5 20 h-28 z" fill="#FBEFE6" />
    <rect x="112" y="108" width="12" height="22" rx="3" fill="#B7A9F5" />
    <rect x="126" y="100" width="10" height="30" rx="3" fill="#9C8CF0" />
  </svg>
);

const Frame = ({ bg, children }: { bg: [string, string]; children: React.ReactNode }) => (
  <svg viewBox="0 0 200 120" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
    <defs><linearGradient id={`f${bg[0].slice(1)}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={bg[0]} /><stop offset="1" stopColor={bg[1]} /></linearGradient></defs>
    <rect width="200" height="120" fill={`url(#f${bg[0].slice(1)})`} />
    {children}
  </svg>
);

export const ThumbReflect = () => (
  <Frame bg={["#FDE3EC", "#FFF1E4"]}>
    <rect x="52" y="30" width="96" height="70" rx="6" fill="#fff" transform="rotate(-6 100 65)" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x="66" y={46 + i * 11} width={64 - i * 8} height="4" rx="2" fill="#F3C4D3" transform="rotate(-6 100 65)" />)}
    <path d="M128 22 l26 52 l-6 3 l-26 -52 z" fill="#7A63E8" /><path d="M148 77 l6 -3 l-1 10 z" fill="#3B3F6B" />
    <circle cx="40" cy="92" r="14" fill="#F28C8C" /><rect x="34" y="70" width="12" height="14" rx="3" fill="#FFD27A" />
  </Frame>
);
export const ThumbSteps = () => (
  <Frame bg={["#E4F0FC", "#EFEAFE"]}>
    {[0, 1, 2, 3].map((i) => <rect key={i} x={30 + i * 36} y={92 - i * 18} width="34" height={18 + i * 18} rx="4" fill={["#B9D6F7", "#A7C7F2", "#9C8CF0", "#7A63E8"][i]} />)}
    <path d="M160 26 v20" stroke="#3B3F6B" strokeWidth="2.5" /><path d="M160 26 l18 6 l-18 6 z" fill="#F06A55" />
    <circle cx="48" cy="64" r="6" fill="#3B3F6B" /><path d="M48 70 v12 M42 76 h12" stroke="#3B3F6B" strokeWidth="3" strokeLinecap="round" />
  </Frame>
);
export const ThumbHabit = () => (
  <Frame bg={["#FFE9D2", "#FCE3EE"]}>
    <circle cx="140" cy="62" r="26" fill="#FFB86B" />
    <path d="M0 86 C40 66 80 92 120 78 C150 68 180 80 200 74 V120 H0 Z" fill="#7BC58F" />
    <path d="M0 98 C50 84 100 104 150 92 C175 86 190 92 200 90 V120 H0 Z" fill="#4FA56E" />
    <path d="M30 96 q20 -40 50 -30" stroke="#fff" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" fill="none" />
  </Frame>
);
export const ThumbMoney = () => (
  <Frame bg={["#E3F5EA", "#FFF4D9"]}>
    <rect x="44" y="40" width="92" height="56" rx="10" fill="#2F9E62" />
    <rect x="44" y="52" width="92" height="10" fill="#237A4B" />
    <rect x="104" y="70" width="40" height="18" rx="9" fill="#FFE59A" />
    <circle cx="150" cy="38" r="14" fill="#FFC94D" /><text x="150" y="43" textAnchor="middle" fontSize="13" fontWeight="800" fill="#8A5A00" fontFamily="Plus Jakarta Sans">Rp</text>
    <circle cx="168" cy="62" r="9" fill="#FFD976" />
  </Frame>
);
