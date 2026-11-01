import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, CheckCircle2, X, Smartphone } from "lucide-react";
import { Modal } from "./ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Cek apakah sudah berjalan di mode standalone (sudah terpasang)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Cek apakah perangkat iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // Tangkap event install prompt di Android/Chrome/Edge
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  return {
    canInstall: !!deferredPrompt || isIOS,
    canPromptDirectly: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
};

export const PwaInstallBanner = () => {
  const { canPromptDirectly, isInstalled, isIOS, install } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("pwa-banner-dismissed") === "true";
    } catch {
      return false;
    }
  });

  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("pwa-banner-dismissed", "true");
    } catch {
      /* abaikan */
    }
  };

  const handleAction = () => {
    if (canPromptDirectly) {
      install();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md animate-rise rounded-[22px] border border-line bg-surface p-3.5 shadow-2xl backdrop-blur-md sm:bottom-6">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="Logo" className="h-11 w-11 rounded-[12px] shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink">Pasang Aplikasi di HP</p>
            <p className="truncate text-[11px] text-mute">Akses cepat dari layar utama seperti app biasa.</p>
          </div>
          <button
            onClick={handleAction}
            className="btn btn-primary px-3 py-1.5 text-xs font-bold shadow-sm"
          >
            <Download size={14} /> Pasang
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Tutup"
            className="grid h-8 w-8 place-items-center rounded-full text-mute transition hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <PwaInstallGuideModal open={showModal} onClose={() => setShowModal(false)} isIOS={isIOS} />
    </>
  );
};

export const PwaSettingsSection = () => {
  const { canPromptDirectly, isInstalled, isIOS, install } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="Logo" className="h-12 w-12 rounded-[14px] shadow-sm" />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-ink">Hidup Terarah Web App</p>
          <p className="text-xs text-mute">
            {isInstalled
              ? "Aplikasi sudah terpasang dan berjalan dalam mode layar penuh (standalone)."
              : "Bisa ditambahkan ke layar depan ponsel seperti aplikasi dari Play Store / App Store."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {isInstalled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-bg px-3 py-1 text-xs font-bold text-mint">
            <CheckCircle2 size={15} /> Sudah Terpasang
          </span>
        ) : (
          <>
            {canPromptDirectly ? (
              <button onClick={install} className="btn btn-primary">
                <Download size={15} /> Pasang Aplikasi Sekarang
              </button>
            ) : (
              <button onClick={() => setShowModal(true)} className="btn btn-primary">
                <Smartphone size={15} /> Cara Pasang di Handphone
              </button>
            )}
            <button onClick={() => setShowModal(true)} className="btn btn-ghost">
              Petunjuk Pemasangan
            </button>
          </>
        )}
      </div>

      <PwaInstallGuideModal open={showModal} onClose={() => setShowModal(false)} isIOS={isIOS} />
    </div>
  );
};

export const PwaInstallGuideModal = ({
  open,
  onClose,
  isIOS,
}: {
  open: boolean;
  onClose: () => void;
  isIOS: boolean;
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pasang ke Layar Utama"
      desc="Jadikan Hidup Terarah seperti aplikasi asli di ponselmu."
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 rounded-[16px] bg-surface2 p-3">
          <img src="/icon-192.png" alt="Logo Hidup Terarah" className="h-12 w-12 rounded-[14px] shadow-sm" />
          <div>
            <p className="font-extrabold text-ink">Hidup Terarah</p>
            <p className="text-xs text-mute">Buka langsung tanpa browser URL bar</p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-sm text-ink2">
            <p className="font-semibold text-ink">Petunjuk untuk iPhone / iPad (Safari):</p>
            <ol className="list-inside space-y-2 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brandsoft text-xs font-bold text-ink">1</span>
                <span>Tekan tombol <b>Bagikan (Share)</b> <Share size={15} className="inline text-brand" /> di bar bawah Safari.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brandsoft text-xs font-bold text-ink">2</span>
                <span>Gulir ke bawah lalu pilih <b>Tambah ke Layar Utama (Add to Home Screen)</b> <PlusSquare size={15} className="inline text-brand" />.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brandsoft text-xs font-bold text-ink">3</span>
                <span>Tekan <b>Tambah (Add)</b> di pojok kanan atas. Selesai!</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-ink2">
            <p className="font-semibold text-ink">Petunjuk untuk Android / Chrome:</p>
            <ol className="list-inside space-y-2 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brandsoft text-xs font-bold text-ink">1</span>
                <span>Tekan menu titik tiga <b>(⋮)</b> di kanan atas browser Chrome.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brandsoft text-xs font-bold text-ink">2</span>
                <span>Pilih <b>Pasang aplikasi (Install app)</b> atau <b>Tambahkan ke Layar Utama</b>.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brandsoft text-xs font-bold text-ink">3</span>
                <span>Logo aplikasi akan langsung tampil di menu aplikasi handphone Anda.</span>
              </li>
            </ol>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button className="btn btn-primary" onClick={onClose}>
            Mengerti
          </button>
        </div>
      </div>
    </Modal>
  );
};
