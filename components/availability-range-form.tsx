"use client";
import { DisclosureSummary } from "./disclosure-summary";
import { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { rangeInstants } from "@/lib/availability";
import { dayLabel, eventDays, localTime, SLOT_MS } from "@/lib/time";
import type { MeetingEvent, TimeSlot } from "@/lib/types";

export function AvailabilityRangeForm({
  event,
  slots,
  onAdd,
  disabled,
  isPreferred = false,
}: {
  event: MeetingEvent;
  slots: TimeSlot[];
  onAdd: (instants: string[]) => void;
  disabled: boolean;
  isPreferred?: boolean;
}) {
  const days = useMemo(
    () => eventDays(event.start_date, event.end_date),
    [event.start_date, event.end_date],
  );
  const [day, setDay] = useState(days[0]);
  const [start, setStart] = useState(slots[0]?.start ?? "");
  const [chosenEnd, setChosenEnd] = useState("");
  const [added, setAdded] = useState("");
  const daySlots = useMemo(
    () => slots.filter((slot) => slot.day === day),
    [slots, day],
  );
  const endings = useMemo(() => {
    const result: string[] = [];
    let expected = start;
    for (const slot of daySlots.filter((slot) => slot.start >= start)) {
      if (slot.start !== expected) break;
      expected = new Date(Date.parse(slot.start) + SLOT_MS).toISOString();
      result.push(expected);
    }
    return result;
  }, [daySlots, start]);
  const preferred = new Date(
    Date.parse(start || "1970-01-01") + event.meeting_duration_minutes * 60000,
  ).toISOString();
  const end = endings.includes(chosenEnd)
    ? chosenEnd
    : endings.includes(preferred)
      ? preferred
      : (endings[0] ?? "");
  const label = (instant: string) =>
    localTime(instant, event.timezone, "HH:mm (XXX)");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const instants = rangeInstants(slots, day, start, end);
    if (!instants.length) return;
    onAdd(instants);
    setAdded(
      `Dodano ${dayLabel(day, "EEE, d MMM")}, ${localTime(start, event.timezone)}-${localTime(end, event.timezone)}. Godziny pojawiły się w Twoich zaznaczeniach.`,
    );
  }
  return (
    <details className="border-b [border-bottom-style:solid] border-b-[#293345] bg-[#111824] [&>form]:p-4.5 max-[720px]:[&>form]:px-3.5 max-[720px]:[&>form]:py-4 max-[720px]:[&>form>.button]:min-h-10.25 max-[720px]:[&>form>.button]:w-full max-[720px]:[&>form>.button]:text-sm [&>summary]:flex [&>summary]:cursor-pointer [&>summary]:items-center [&>summary]:gap-2 [&>summary]:px-4.75 [&>summary]:py-3.75 [&>summary]:text-sm [&>summary]:text-[#c6b0e8] max-[720px]:[&>summary]:p-3.5 max-[720px]:[&>summary]:text-sm [&>summary_small]:ml-auto [&>summary_small]:text-sm [&>summary_small]:text-[#7f8ca3] max-[720px]:[&>summary_small]:hidden [&[open]>summary]:border-b [&[open]>summary]:[border-bottom-style:dashed] [&[open]>summary]:border-b-[#30384a]">
      <DisclosureSummary
        icon={<Plus className="size-4 shrink-0" aria-hidden="true" />}
      >
        <span>Dodaj godziny z formularza</span>
        <small className="text-sm font-normal">
          Wybierz dzień oraz zakres od-do
        </small>
      </DisclosureSummary>
      <form onSubmit={submit}>
        <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2.5 max-[720px]:grid-cols-[1fr_1fr] [&_.field]:mb-3.5 [&_.field]:text-sm [&_select]:min-h-9.75 [&_select]:min-w-0 [&_select]:px-1.75 [&_select]:py-2.5 [&_select]:text-base max-[720px]:[&_select]:min-h-10.5 max-[720px]:[&_select]:text-base max-[720px]:[&>.field:first-child]:col-span-full">
          <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
            <span>Dzień dostępności</span>
            <select
              className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
              value={day}
              disabled={disabled}
              onChange={(e) => {
                setDay(e.target.value);
                setStart(
                  slots.find((s) => s.day === e.target.value)?.start ?? "",
                );
                setChosenEnd("");
                setAdded("");
              }}
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {dayLabel(d, "EEE, d MMM")}
                </option>
              ))}
            </select>
          </label>
          <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
            <span>Dostępny od</span>
            <select
              className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
              value={start}
              disabled={disabled || !daySlots.length}
              onChange={(e) => {
                setStart(e.target.value);
                setChosenEnd("");
                setAdded("");
              }}
            >
              {daySlots.map((slot) => (
                <option key={slot.start} value={slot.start}>
                  {label(slot.start)}
                </option>
              ))}
            </select>
          </label>
          <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
            <span>Dostępny do</span>
            <select
              className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
              value={end}
              disabled={disabled || !endings.length}
              onChange={(e) => {
                setChosenEnd(e.target.value);
                setAdded("");
              }}
            >
              {endings.map((instant) => (
                <option key={instant} value={instant}>
                  {label(instant)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          disabled={disabled || !end}
        >
          <Plus className="shrink-0" size={14} aria-hidden="true" />{" "}
          {isPreferred
            ? "Dodaj jako preferowane"
            : "Dodaj do mojej dostępności"}
        </button>
        {!daySlots.length && (
          <p className="m-0 text-sm leading-normal text-[#f1a3a3] [.join-strip_form>&]:absolute [.join-strip_form>&]:top-full [.join-strip_form>&]:text-sm">
            W tym dniu nie ma przedziałów w wybranej strefie czasowej.
          </p>
        )}
        {added && (
          <p
            className="mx-0 mt-3.5 mb-0 flex items-start gap-1.5 text-sm leading-relaxed text-[#a1c7a5] [&>svg]:mt-0.5 [&>svg]:shrink-0"
            role="status"
          >
            <Check className="shrink-0" size={14} aria-hidden="true" />
            {added}
          </p>
        )}
      </form>
    </details>
  );
}
