"use client";
import { useMemo, useState } from "react";
import { Check, Clock3, Star, X } from "lucide-react";
import { selectedRanges } from "@/lib/availability";
import { dayLabel, timeRange } from "@/lib/time";
import type { MeetingEvent, TimeSlot } from "@/lib/types";
import { InlineSeparator } from "./inline-separator";
const emptyPreferred = new Set<string>();
export function AvailabilitySelection({
  event,
  slots,
  own,
  preferred = emptyPreferred,
  onChange,
  disabled,
}: {
  event: MeetingEvent;
  slots: TimeSlot[];
  own: Set<string>;
  preferred?: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const ranges = useMemo(
    () => selectedRanges(slots, own, preferred),
    [slots, own, preferred],
  );
  const complete = useMemo(
    () =>
      selectedRanges(slots, own).some(
        (range) => range.instants.length * 30 >= event.meeting_duration_minutes,
      ),
    [slots, own, event.meeting_duration_minutes],
  );
  return (
    <section
      className="border-t [border-top-style:solid] border-t-[#303346] bg-[#151928] p-4.5"
      aria-label="Twoje wybrane godziny"
    >
      <div className="flex items-center justify-between gap-3 [&>span]:text-sm [&>span]:text-[#9c8eb3] max-[720px]:[&>span]:text-sm [&>strong]:flex [&>strong]:items-center [&>strong]:gap-1.75 [&>strong]:text-sm [&>strong]:font-medium [&>strong]:text-[#c2b2dc] max-[720px]:[&>strong]:text-sm">
        <strong>
          <Clock3 className="shrink-0" size={14} aria-hidden="true" /> Twoje
          wybrane godziny
        </strong>
        <span>
          {own.size
            ? `${(own.size * 30) / 60} godz. dostępności`
            : "Jeszcze bez zaznaczeń"}
        </span>
      </div>
      {ranges.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.75">
          {(expanded ? ranges : ranges.slice(0, 6)).map((range) => (
            <div
              className={`flex items-center gap-1.5 rounded-md border border-solid border-[#5f497b] bg-[#a983d511] px-2 py-1.75 max-[720px]:min-h-9 [&_strong]:ml-0.75 [&_strong]:font-medium [&_strong]:text-[#d2bcec] [&.is-preferred]:border-[#8c714a] [&.is-preferred]:bg-[#b8956014] [&.is-preferred]:text-[#e7c894] [&.is-preferred_small]:text-sm [&.is-preferred_small]:text-[#bda079] [&.is-preferred_strong]:text-[#e3c18c] [&.is-preferred>span]:text-[#e3c18c] [&.is-preferred>svg]:text-[#e3c18c] [&>button]:ml-0.75 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:border-0 [&>button]:border-solid [&>button]:border-current [&>button]:bg-transparent [&>button]:p-0.5 [&>button]:text-[#ad92cd] max-[720px]:[&>button]:min-h-5.5 max-[720px]:[&>button]:min-w-5.5 [&>span]:text-sm [&>span]:text-[#ad9bc5] max-[720px]:[&>span]:text-sm [&>svg]:shrink-0 [&>svg]:text-[#b19bcf] ${range.isPreferred ? "is-preferred" : ""}`}
              key={range.start}
            >
              {range.isPreferred ? (
                <Star className="shrink-0" size={14} aria-hidden="true" />
              ) : (
                <Check className="shrink-0" size={14} aria-hidden="true" />
              )}
              <span>
                {dayLabel(range.day, "EEE, d MMM")}{" "}
                <strong>
                  {timeRange(range.start, range.end, event.timezone)}
                </strong>
                {range.isPreferred && (
                  <small className="text-sm">
                    <InlineSeparator /> Wolę
                  </small>
                )}
              </span>
              <button
                className="cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                type="button"
                aria-label={`Usuń dostępność ${dayLabel(range.day, "d MMM")} ${timeRange(range.start, range.end, event.timezone)}`}
                disabled={disabled}
                onClick={() => {
                  const next = new Set(own);
                  range.instants.forEach((instant) => next.delete(instant));
                  onChange(next);
                }}
              >
                <X className="shrink-0" size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
          {ranges.length > 6 && (
            <button
              type="button"
              className="text-button flex cursor-pointer items-center gap-1.25 border-0 border-solid border-current bg-transparent p-1 text-sm text-[#9ca8bf] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#cfbdf7] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none max-[720px]:max-w-33.75 max-[720px]:justify-end max-[720px]:p-0 max-[720px]:text-right max-[720px]:text-sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded
                ? "Zwiń zakresy"
                : `Pokaż pozostałe (${ranges.length - 6})`}
            </button>
          )}
        </div>
      )}
      <p
        className={
          complete
            ? "mx-0 mt-3 mb-0 text-sm leading-relaxed text-[#98af99]"
            : "mx-0 mt-3 mb-0 text-sm leading-relaxed text-[#9c8dad]"
        }
      >
        {complete
          ? "Masz już zakres wystarczający na całe spotkanie. Dodaj więcej godzin, aby łatwiej znaleźć termin dla grupy."
          : `Spotkanie trwa ${event.meeting_duration_minutes} min. Zaznacz przynajmniej ${event.meeting_duration_minutes / 30} sąsiadujące pola w jednym dniu lub dodaj taki zakres formularzem.`}
      </p>
    </section>
  );
}
