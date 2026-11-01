import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BULAN, HARI_PENDEK, addDays, startOfWeek, ymd } from "./dates";
import { cn } from "@/lib/utils";

export const MonthCalendar = ({ selected, onSelect, marks }: { selected: string; onSelect: (d: string) => void; marks: Record<string, number> }) => {
  const sel = new Date(selected + "T00:00");
  const [cursor, setCursor] = useState(new Date(sel.getFullYear(), sel.getMonth(), 1));
  const first = startOfWeek(cursor);
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const today = ymd(new Date());
  const weeks = days[35].getMonth() !== cursor.getMonth() ? 5 : 6;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[15px] font-extrabold text-ink">{BULAN[cursor.getMonth()]} {cursor.getFullYear()}</p>
        <div className="flex gap-1">
          <button aria-label="Bulan sebelumnya" className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink2 hover:text-brand" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
          <button aria-label="Bulan berikutnya" className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink2 hover:text-brand" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => <span key={d} className="pb-1 text-[11px] font-semibold text-mute">{HARI_PENDEK[d]}</span>)}
        {days.slice(0, weeks * 7).map((d) => {
          const k = ymd(d), out = d.getMonth() !== cursor.getMonth(), isSel = k === selected, isToday = k === today;
          return (
            <button key={k} onClick={() => onSelect(k)} aria-label={k} aria-pressed={isSel}
              className={cn("relative mx-auto grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold transition",
                out ? "text-mute/50 opacity-40" : "text-ink2", isSel ? "bg-brand text-[var(--accent-ink)]" : isToday ? "bg-sky-bg text-sky" : "hover:bg-surface2")}>
              {d.getDate()}
              {marks[k] > 0 && !isSel && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-peach" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
