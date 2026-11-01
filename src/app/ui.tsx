import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Tint } from "./types";
import { cn } from "@/lib/utils";

export const tintBg: Record<Tint, string> = { lilac: "bg-lilac-bg", rose: "bg-rose-bg", butter: "bg-butter-bg", mint: "bg-mint-bg", sky: "bg-sky-bg", peach: "bg-peach-bg" };
export const tintFg: Record<Tint, string> = { lilac: "text-lilac", rose: "text-rose", butter: "text-butter", mint: "text-mint", sky: "text-sky", peach: "text-peach" };
export const tintVar = (t: Tint) => `var(--${t})`;
export const TINTS: Tint[] = ["lilac", "rose", "butter", "mint", "sky", "peach"];

export const Panel = ({ title, action, children, className, sub }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={cn("card p-4 sm:p-5", className)}>
    {(title || action) && (
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-extrabold tracking-tight text-ink">{title}</h2>
          {sub && <p className="text-xs text-mute">{sub}</p>}
        </div>
        {action}
      </header>
    )}
    {children}
  </section>
);

export const IconTile = ({ tint, children, size = 40, className }: { tint: Tint; children: ReactNode; size?: number; className?: string }) => (
  <span className={cn("grid shrink-0 place-items-center rounded-[13px] text-lg", tintBg[tint], tintFg[tint], className)} style={{ width: size, height: size }}>{children}</span>
);

export const Tick = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button type="button" aria-pressed={on} aria-label={label} className="tick" data-on={on} onClick={onClick}>
    {on && <Check size={13} strokeWidth={3.5} className="animate-pop" />}
  </button>
);

export const Bar = ({ value, tint = "lilac", h = 8 }: { value: number; tint?: Tint; h?: number }) => (
  <div className="w-full overflow-hidden rounded-full bg-surface2" style={{ height: h }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: tintVar(tint) }} />
  </div>
);

export const Sparkline = ({ data, tint, w = 120, h = 36 }: { data: number[]; tint: Tint; w?: number; h?: number }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 4 - ((v - min) / (max - min || 1)) * (h - 8)]);
  const line = pts.map((p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const [px, py] = pts[i - 1]; const cx = (px + p[0]) / 2;
    return `C${cx},${py} ${cx},${p[1]} ${p[0]},${p[1]}`;
  }).join(" ");
  const id = `sp-${tint}-${data.join("").slice(0, 8)}`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden className="overflow-visible">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={tintVar(tint)} stopOpacity=".28" /><stop offset="1" stopColor={tintVar(tint)} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={tintVar(tint)} strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={tintVar(tint)} />
    </svg>
  );
};

export const Modal = ({ open, onClose, title, desc, children, wide }: { open: boolean; onClose: () => void; title: string; desc?: string; children: ReactNode; wide?: boolean }) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className={cn("max-h-[92vh] overflow-y-auto rounded-[26px] border-line bg-surface p-5 sm:p-6", wide ? "sm:max-w-2xl" : "sm:max-w-md")}>
      <DialogTitle className="font-display text-2xl font-semibold text-ink">{title}</DialogTitle>
      {desc ? <DialogDescription className="-mt-1 text-sm text-mute">{desc}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
      {children}
    </DialogContent>
  </Dialog>
);

export const Empty = ({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-line px-4 py-8 text-center">
    <div className="text-3xl">{icon}</div>
    <p className="font-bold text-ink">{title}</p>
    <p className="max-w-xs text-sm text-mute">{text}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const PageHead = ({ eyebrow, title, text, action }: { eyebrow: string; title: string; text?: string; action?: ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display text-[30px] font-semibold leading-tight text-ink sm:text-[36px]">{title}</h1>
      {text && <p className="mt-1 max-w-xl text-sm text-ink2">{text}</p>}
    </div>
    {action}
  </div>
);

export const Segmented = <T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) => (
  <div className="inline-flex rounded-[14px] border border-line bg-surface2 p-1">
    {options.map((o) => (
      <button key={o.v} type="button" onClick={() => onChange(o.v)} className={cn("rounded-[10px] px-3 py-1.5 text-xs font-bold transition", value === o.v ? "bg-surface text-ink shadow-sm" : "text-mute hover:text-ink")}>{o.l}</button>
    ))}
  </div>
);

export const Logo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <rect x="2" y="2" width="44" height="44" rx="15" fill="var(--ink)" />
    <circle cx="24" cy="24" r="13" fill="none" stroke="var(--surface)" strokeOpacity=".25" strokeWidth="2" />
    <path d="M24 9 L29 24 L24 39 L19 24 Z" fill="var(--butter)" />
    <path d="M24 9 L29 24 L19 24 Z" fill="var(--coral)" />
    <circle cx="24" cy="24" r="2.6" fill="var(--ink)" />
  </svg>
);

import { useEffect as _ue, useState as _us } from "react";
export const ConfirmButton = ({ onConfirm, children, className, label, confirmText = "Yakin?" }: { onConfirm: () => void; children: ReactNode; className?: string; label?: string; confirmText?: string }) => {
  const [arm, setArm] = _us(false);
  _ue(() => { if (!arm) return; const t = setTimeout(() => setArm(false), 3000); return () => clearTimeout(t); }, [arm]);
  return (
    <button type="button" aria-label={label} onClick={() => (arm ? (setArm(false), onConfirm()) : setArm(true))}
      className={cn(className, arm && "!w-auto !border-coral !bg-coral !px-3 !text-white")}>
      {arm ? <span className="text-xs font-bold">{confirmText}</span> : children}
    </button>
  );
};
