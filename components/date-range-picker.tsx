"use client";
import { useState } from "react";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function DateRangePicker({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  const [month, setMonth] = useState(() =>
    startOfMonth(isValid(parseISO(start)) ? parseISO(start) : new Date()),
  );
  const [anchor, setAnchor] = useState<string | null>(null);
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const lastDay = endOfMonth(month);
  const days = Array.from(
    {
      length:
        Math.ceil((differenceInCalendarDays(lastDay, gridStart) + 1) / 7) * 7,
    },
    (_, i) => addDays(gridStart, i),
  );
  function select(day: string) {
    if (!anchor) {
      setAnchor(day);
      onChange(day, day);
      return;
    }
    const rangeStart = day < anchor ? day : anchor;
    const rangeEnd = day < anchor ? anchor : day;
    if ((Date.parse(rangeEnd) - Date.parse(rangeStart)) / 86400000 > 30) {
      setAnchor(day);
      onChange(day, day);
      return;
    }
    onChange(rangeStart, rangeEnd);
    setAnchor(null);
  }
  function preset(kind: "today" | "next-week" | "week") {
    const first =
      kind === "today"
        ? new Date()
        : kind === "next-week"
          ? addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7)
          : new Date();
    const last = kind === "today" ? first : addDays(first, 4);
    onChange(format(first, "yyyy-MM-dd"), format(last, "yyyy-MM-dd"));
    setMonth(startOfMonth(first));
    setAnchor(null);
  }
  return (
    <div className="date-picker mb-4.75 rounded-[10px] border border-solid border-[#2c3546] bg-[#101621] p-4.25 max-[720px]:p-3">
      <div className="flex flex-wrap gap-1.5 border-b [border-bottom-style:solid] border-b-[#293244] pb-3.75 max-[720px]:gap-1.25 [&>button]:min-h-8 [&>button]:rounded-[5px] [&>button]:border [&>button]:border-solid [&>button]:border-[#30394d] [&>button]:bg-[#1d2333] [&>button]:px-2.25 [&>button]:py-1.75 [&>button]:text-sm [&>button]:text-[#bac4d9] max-[720px]:[&>button]:px-1.5 max-[720px]:[&>button]:py-1.75 max-[720px]:[&>button]:text-sm [&>button:hover]:border-[#7c649f] [&>button:hover]:bg-[#332b49] [&>button:hover]:text-[#d9c6fa]">
        <button
          className="cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          type="button"
          onClick={() => preset("today")}
        >
          Jeden dzień: dziś
        </button>
        <button
          className="cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          type="button"
          onClick={() => preset("week")}
        >
          Najbliższe 5 dni
        </button>
        <button
          className="cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          type="button"
          onClick={() => preset("next-week")}
        >
          Przyszły tydzień
        </button>
      </div>
      <div className="mx-0 my-3.25 flex items-center justify-between [&>div]:flex [&>div]:gap-1.75 [&>strong]:text-base [&>strong]:font-medium [&>strong]:capitalize">
        <strong>{format(month, "LLLL yyyy", { locale: pl })}</strong>
        <div>
          <button
            type="button"
            className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            aria-label="Poprzedni miesiąc"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <ChevronLeft className="shrink-0" size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            aria-label="Następny miesiąc"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight className="shrink-0" size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className="grid grid-cols-7 gap-1 px-0 pt-1.75 pb-2.5 text-center text-sm text-[#7f8ca4]"
        aria-hidden="true"
      >
        {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-1 [&>button]:min-h-9 [&>button]:rounded-md [&>button]:border [&>button]:border-solid [&>button]:border-transparent [&>button]:bg-transparent [&>button]:p-1.25 [&>button]:text-sm [&>button]:text-[#aebbd0] max-[720px]:[&>button]:min-h-9.75 [&>button.in-range]:rounded-sm [&>button.in-range]:bg-[#9c7fd520] [&>button.in-range]:text-[#d0bdf6] [&>button.outside]:text-[#626f85] [&>button.range-endpoint]:border-[#c0adf3] [&>button.range-endpoint]:bg-[#b29af1] [&>button.range-endpoint]:font-semibold [&>button.range-endpoint]:text-[#1d1531] [&>button:hover]:border-[#70628b] [&>button:hover]:bg-[#29273d]"
        role="group"
        aria-label="Wybierz pierwszy i ostatni dzień spotkania"
      >
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const chosen = key >= start && key <= end;
          return (
            <button
              type="button"
              key={key}
              aria-pressed={chosen}
              aria-label={format(day, "EEEE, d MMMM yyyy", { locale: pl })}
              className={`cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none ${day.getMonth() !== month.getMonth() ? "outside" : ""} ${chosen ? "in-range" : ""} ${key === start || key === end ? "range-endpoint" : ""}`}
              onClick={() => select(key)}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
      <p
        className="m-0 leading-relaxed text-muted in-[.date-picker]:mt-3.5 in-[.date-picker]:min-h-8 in-[.date-picker]:text-sm in-[.date-picker]:leading-relaxed in-[.date-picker]:text-[#8f9cb1]"
        role="status"
      >
        {anchor
          ? "Teraz wybierz ostatni dzień. Kliknij ponownie tę samą datę, aby wybrać jeden dzień."
          : "Kliknij pierwszy i ostatni dzień. Wszystkie dni pomiędzy będą dostępne do wyboru."}
      </p>
    </div>
  );
}
