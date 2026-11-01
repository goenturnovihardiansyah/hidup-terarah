import { useEffect, useRef } from "react";
import { X, Sparkles, Trophy, Flame, Award, CheckCircle2 } from "lucide-react";
import { useStore } from "./store";
import { tintBg } from "./ui";
import { cn } from "@/lib/utils";

// Pure Canvas Confetti Burst Effect
const ConfettiCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const colors = ["#F06A55", "#5B4FCF", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6"];
    const pieces: {
      x: number;
      y: number;
      r: number;
      d: number;
      color: string;
      tilt: number;
      tiltAngleInc: number;
      tiltAngle: number;
    }[] = [];

    for (let i = 0; i < 70; i++) {
      pieces.push({
        x: Math.random() * width,
        y: Math.random() * height - height * 0.3,
        r: Math.random() * 6 + 4,
        d: Math.random() * 50 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleInc: Math.random() * 0.07 + 0.05,
        tiltAngle: 0,
      });
    }

    let animationId: number;
    let step = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      step += 1;

      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        p.tiltAngle += p.tiltAngleInc;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2.2;
        p.x += Math.sin(0.01 * step) * 1.5;
        p.tilt = Math.sin(p.tiltAngle) * 12;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();

        if (p.y > height) {
          p.x = Math.random() * width;
          p.y = -20;
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full" />;
};

export const StreakMilestoneModal = () => {
  const { milestoneCelebration, dismissMilestone } = useStore();

  if (!milestoneCelebration) return null;

  const m = milestoneCelebration;

  const iconBadge =
    m.streakCount >= 30 ? (
      <Award size={36} className="text-amber-500 animate-bounce" />
    ) : m.streakCount >= 21 ? (
      <Trophy size={36} className="text-amber-500 animate-bounce" />
    ) : m.streakCount >= 7 ? (
      <Flame size={36} className="text-coral animate-bounce" />
    ) : m.streakCount >= 3 ? (
      <Sparkles size={36} className="text-brand animate-bounce" />
    ) : (
      <CheckCircle2 size={36} className="text-emerald-500 animate-bounce" />
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={dismissMilestone}
      />

      {/* Modal Dialog Card */}
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-surface p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ boxShadow: "0 25px 60px -15px rgba(0,0,0,0.3)" }}
      >
        <ConfettiCanvas />

        {/* Close Button */}
        <button
          onClick={dismissMilestone}
          aria-label="Tutup apresiasi"
          className="absolute right-4 top-4 z-20 grid h-8 w-8 place-items-center rounded-full bg-surface2 text-mute hover:text-ink transition hover:scale-105"
        >
          <X size={16} />
        </button>

        {/* Modal Content */}
        <div className="relative z-10 text-center">
          {/* Top Badge Floating */}
          <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand shadow-xs border border-line">
            <Sparkles size={13} className="text-amber-500" />
            <span>{m.badge}</span>
          </div>

          {/* Animated Icon Glow */}
          <div className="relative mx-auto my-2 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-tr from-butter-bg via-rose-bg to-lilac-bg p-3 shadow-inner ring-4 ring-surface">
            {iconBadge}
          </div>

          {/* Habit Details Pill */}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface2 px-3 py-1 text-xs font-semibold text-ink2">
            <span className={cn("grid h-5 w-5 place-items-center rounded-full text-xs", tintBg[m.habitColor])}>
              {m.habitIcon}
            </span>
            <span className="font-bold text-ink">{m.habitName}</span>
            <span className="text-mute">·</span>
            <span className="font-extrabold text-coral">{m.streakCount} {m.unit}</span>
          </div>

          {/* Title & Subtitle */}
          <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-ink sm:text-[26px]">
            {m.title}
          </h2>
          <p className="mt-1 text-xs font-semibold text-mute">
            {m.subtitle}
          </p>

          {/* Psychological Affirmation */}
          <div className="mt-4 rounded-2xl bg-surface2/80 p-3.5 text-left border border-line/60">
            <p className="text-xs leading-relaxed text-ink2">
              {m.message}
            </p>
          </div>

          {/* Inspirational Quote */}
          <div className="mt-3 border-t border-line/70 pt-3">
            <p className="italic text-xs text-ink font-medium">
              “{m.quote}”
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-mute">
              — {m.author}
            </p>
          </div>

          {/* Action CTA */}
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={dismissMilestone}
              className="btn btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-brand/20 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Alhamdulillah, Lanjutkan Melangkah! 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
