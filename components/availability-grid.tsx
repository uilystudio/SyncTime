"use client";
import { memo, useCallback, useId, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Hand,
  LockKeyhole,
  MousePointer2,
  Plus,
  Star,
  Square,
  Users,
} from "lucide-react";
import { buildSlots, dayLabel, eventDays } from "@/lib/time";
import type {
  AvailabilitySlot,
  MeetingEvent,
  Participant,
  TimeSlot,
} from "@/lib/types";
import { AvailabilityRangeForm } from "./availability-range-form";
import { AvailabilitySelection } from "./availability-selection";
import { AvailabilityCopy } from "./availability-copy";
import {
  SlotAvailabilityPreview,
  type SlotInspection,
} from "./slot-availability-preview";
const emptyPreferred = new Set<string>();
const heatColors = [
  "border-[#273140] bg-[#19212e]",
  "border-[#35544c] bg-[#1d3937]",
  "border-[#4c7d66] bg-[#2b5649]",
  "border-[#66997b] bg-[#427b5d]",
  "border-[#a8e6bc] bg-[#8ccca6] text-[#10291b]",
] as const;
const heatLabels = [
  "text-[#a4b0c5]",
  "text-[#a4b0c5]",
  "text-[#c2e0d1]",
  "text-[#d5eddf]",
  "text-[#173926]",
] as const;
const dayColumns: Record<number, string> = {
  1: "grid-cols-[minmax(128px,1fr)]",
  2: "grid-cols-[repeat(2,minmax(128px,1fr))]",
  3: "grid-cols-[repeat(3,minmax(128px,1fr))]",
  4: "grid-cols-[repeat(4,minmax(128px,1fr))]",
  5: "grid-cols-[repeat(5,minmax(128px,1fr))]",
};
interface CellProps {
  slot: TimeSlot;
  selected: boolean;
  preferred: boolean;
  preferredCount: number;
  count: number;
  total: number;
  names: string;
  group: boolean;
  disabled: boolean;
  repeated: boolean;
  inspected: boolean;
  previewId: string;
}
const AvailabilityCell = memo(function AvailabilityCell({
  slot,
  selected,
  preferred,
  preferredCount,
  count,
  total,
  names,
  group,
  disabled,
  repeated,
  inspected,
  previewId,
}: CellProps) {
  const label = `${dayLabel(slot.day, "EEEE d MMMM")}, ${slot.label}${repeated ? ` UTC${slot.offset}` : ""}. ${count}/${total} osób; ${preferredCount} preferuje.${!group && selected ? (preferred ? " Wolę ten termin." : " Mogę.") : ""}${names ? ` ${names}` : ""}`;
  const level = count
    ? Math.max(1, Math.ceil((count / Math.max(total, 1)) * 4))
    : 0;
  return (
    <button
      type="button"
      className={`relative flex h-8.5 w-full shrink-0 cursor-pointer [touch-action:inherit] items-center justify-between rounded-sm border px-1.75 py-0 transition-colors duration-120 [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none pointer-coarse:h-9.5 ${group ? heatColors[level] : preferred ? "border-[#b9965d] bg-[#705532] text-[#ffe3ad] hover:border-[#e5bb75] hover:bg-[#86653a]" : selected ? "border-[#a18ad5] bg-[#705baf] text-[#f0e8ff] hover:bg-[#856acb]" : "border-[#273140] bg-[#19212e] hover:border-[#7c71a8] hover:bg-[#24273b]"}`}
      data-slot={slot.start}
      data-preferred={preferred || undefined}
      data-state={
        group
          ? "group"
          : preferred
            ? "preferred"
            : selected
              ? "available"
              : "empty"
      }
      data-heat={group ? level : undefined}
      aria-label={label}
      aria-pressed={group ? undefined : selected}
      aria-expanded={group ? inspected : undefined}
      aria-controls={group && inspected ? previewId : undefined}
      disabled={disabled && !group}
    >
      <span
        className={`flex items-center gap-1 text-sm tabular-nums pointer-coarse:text-sm [&_small]:text-sm ${group ? heatLabels[level] : preferred ? "text-[#f3d7ab]" : selected ? "text-[#e3d8fc]" : "text-[#a4b0c5]"}`}
      >
        {slot.label}
        {repeated && <small className="text-sm">{slot.offset}</small>}
      </span>
      <span className="flex items-center gap-0.75 text-sm font-semibold pointer-coarse:text-sm">
        {group ? (
          <>
            {count}/{total}
            {preferredCount > 0 && (
              <Star className="shrink-0" size={14} aria-hidden="true" />
            )}
          </>
        ) : preferred ? (
          <Star
            className="shrink-0"
            size={16}
            fill="currentColor"
            aria-hidden="true"
          />
        ) : selected ? (
          <Check className="shrink-0" size={16} aria-hidden="true" />
        ) : null}
      </span>
    </button>
  );
});
interface Selection {
  slots: Set<string>;
  preferred: Set<string>;
}
export function AvailabilityGrid({
  event,
  participants,
  availability,
  own,
  preferred = emptyPreferred,
  onChange,
  disabled = false,
}: {
  event: MeetingEvent;
  participants: Participant[];
  availability: AvailabilitySlot[];
  own: Set<string>;
  preferred?: Set<string>;
  onChange: (next: Set<string>, preferred?: Set<string>) => void;
  disabled?: boolean;
}) {
  const [group, setGroup] = useState(false);
  const [mode, setMode] = useState<"available" | "preferred" | "erase">(
    "available",
  );
  const [page, setPage] = useState(0);
  const [touchEdit, setTouchEdit] = useState(false);
  const [preview, setPreview] = useState<Selection | null>(null);
  const [inspection, setInspection] = useState<SlotInspection | null>(null);
  const previewId = useId();
  const inspectedAnchor = useRef<HTMLElement | null>(null);
  const restoringFocus = useRef(false);
  const closeInspection = useCallback((restoreFocus = false) => {
    setInspection(null);
    if (restoreFocus && inspectedAnchor.current?.isConnected) {
      restoringFocus.current = true;
      inspectedAnchor.current.focus({ preventScroll: true });
      restoringFocus.current = false;
    }
  }, []);
  function inspect(element: HTMLElement) {
    const key = element.dataset.slot;
    if (!key) return;
    const rect = element.getBoundingClientRect();
    const rem =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    const width = Math.min(22 * rem, window.innerWidth - 24);
    const below = window.innerHeight - rect.bottom - 20;
    const above = rect.top - 20;
    const side = below < 280 && above > below ? "top" : "bottom";
    const top =
      side === "top"
        ? Math.max(12, rect.top - 8)
        : Math.max(12, rect.bottom + 8);
    const next: SlotInspection = {
      key,
      side,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top,
      maxHeight: Math.max(
        0,
        Math.min(
          440,
          side === "top" ? top - 12 : window.innerHeight - top - 12,
        ),
      ),
    };
    inspectedAnchor.current = element;
    setInspection((previous) =>
      previous?.key === key &&
      previous.left === next.left &&
      previous.top === next.top &&
      previous.maxHeight === next.maxHeight &&
      previous.side === next.side
        ? previous
        : next,
    );
  }
  const gesture = useRef<{
    pointer: number;
    next: Selection;
    add: boolean;
    mode: typeof mode;
    seen: Set<string>;
    last: string;
  } | null>(null);
  const touchTap = useRef<{
    pointer: number;
    key: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const days = useMemo(
    () => eventDays(event.start_date, event.end_date),
    [event.start_date, event.end_date],
  );
  const slots = useMemo(() => buildSlots(event), [event]);
  const inspectedSlot = slots.find((slot) => slot.start === inspection?.key);
  const visibleDays = days.slice(page, page + 5);
  const counts = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const s of availability) {
      const key = new Date(s.slot_start).toISOString();
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(s.participant_id);
    }
    return map;
  }, [availability]);
  const preferredCounts = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const s of availability) {
      if (!s.is_preferred) continue;
      const key = new Date(s.slot_start).toISOString();
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(s.participant_id);
    }
    return map;
  }, [availability]);
  function apply(
    next: Selection,
    key: string,
    add: boolean,
    brush: typeof mode,
  ) {
    if (!add || brush === "erase") {
      next.slots.delete(key);
      next.preferred.delete(key);
    } else {
      next.slots.add(key);
      if (brush === "preferred") next.preferred.add(key);
      else next.preferred.delete(key);
    }
  }
  const changeKey = useCallback(
    (key: string) => {
      const next = { slots: new Set(own), preferred: new Set(preferred) };
      const matches =
        own.has(key) && preferred.has(key) === (mode === "preferred");
      if (mode === "erase" || matches) {
        next.slots.delete(key);
        next.preferred.delete(key);
      } else {
        next.slots.add(key);
        if (mode === "preferred") next.preferred.add(key);
        else next.preferred.delete(key);
      }
      onChange(next.slots, next.preferred);
    },
    [own, preferred, mode, onChange],
  );
  const selection = preview?.slots ?? own;
  const preferredSelection = preview?.preferred ?? preferred;
  function paint(key: string) {
    const current = gesture.current;
    if (!current || current.seen.has(key)) return;
    const last = slots.find((s) => s.start === current.last);
    const target = slots.find((s) => s.start === key);
    const crossed =
      last && target && last.day === target.day
        ? slots
            .filter(
              (s) =>
                s.day === target.day &&
                s.start >= (last.start < key ? last.start : key) &&
                s.start <= (last.start > key ? last.start : key),
            )
            .map((s) => s.start)
        : [key];
    for (const instant of crossed) {
      current.seen.add(instant);
      apply(current.next, instant, current.add, current.mode);
    }
    current.last = key;
    setPreview({
      slots: new Set(current.next.slots),
      preferred: new Set(current.next.preferred),
    });
  }
  function finish(cancel = false) {
    const current = gesture.current;
    if (!current) return;
    gesture.current = null;
    setPreview(null);
    if (!cancel && !disabled)
      onChange(current.next.slots, current.next.preferred);
  }
  function addRange(instants: string[]) {
    const next = { slots: new Set(own), preferred: new Set(preferred) };
    instants.forEach((instant) => apply(next, instant, true, mode));
    onChange(next.slots, next.preferred);
  }
  function matching(key: string) {
    return own.has(key) && preferred.has(key) === (mode === "preferred");
  }
  return (
    <section
      className="overflow-hidden rounded-[13px] border border-solid border-border bg-surface"
      aria-labelledby="availability-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3.5 px-6 pt-6 pb-5.25 max-[1200px]:px-4.5 max-[1200px]:py-5.5 max-[720px]:px-4.25 max-[720px]:py-5.25 [&_.eyebrow]:text-sm [&_.eyebrow]:tracking-wider [&_h2]:mt-2 [&_h2]:text-2xl [&_h2]:tracking-tight max-[1200px]:[&_h2]:text-xl">
        <div>
          <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
            WASZ WSPÓLNY KALENDARZ
          </span>
          <h2
            className="m-0 font-semibold tracking-tight"
            id="availability-heading"
            tabIndex={-1}
          >
            {event.closed_at ? "Dostępność uczestników" : "Kiedy masz czas?"}
          </h2>
        </div>
        <span className="rounded-[5px] border border-solid border-[#303b4b] px-2 py-1.25 text-sm whitespace-nowrap text-[#a0acc3]">
          30 min / pole
        </span>
      </div>
      <p className="m-0 px-6 pt-0 pb-5 text-sm leading-relaxed text-[#94a0b7] max-[720px]:px-4.25 max-[720px]:pt-0 max-[720px]:pb-4.5 max-[720px]:text-sm">
        {event.closed_at
          ? "Organizator zamknął zbieranie. Możesz przeglądać zaznaczenia i rekomendacje."
          : group
            ? "Najedź na pole lub dotknij go, aby zobaczyć dostępne osoby. Gwiazdka oznacza preferowaną godzinę."
            : "Wybierz „Mogę” lub „Wolę ten termin” i zaznacz godziny. Ponowne kliknięcie pola tego samego rodzaju usuwa zaznaczenie."}
      </p>
      <div className="flex items-center justify-between gap-2.25 border-t border-b [border-top-style:solid] [border-bottom-style:solid] border-t-[#252e3d] border-b-[#252e3d] bg-[#111722] px-4.5 py-3.5 max-[1200px]:flex-wrap max-[1200px]:justify-center max-[1200px]:p-3 max-[1000px]:justify-between max-[720px]:justify-between max-[720px]:gap-2 max-[720px]:px-3.25 max-[720px]:py-3 @max-[1150px]/workspace:in-[.workspace]:flex-wrap">
        <div
          className="flex gap-0.5 rounded-[7px] border border-solid border-[#262f40] bg-[#0b111b] p-0.75 [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:gap-1.5 [&_button]:rounded-sm [&_button]:border-0 [&_button]:border-solid [&_button]:border-current [&_button]:bg-transparent [&_button]:p-2 [&_button]:text-sm [&_button]:whitespace-nowrap [&_button]:text-[#9aa7c0] max-[720px]:[&_button]:gap-1.25 max-[720px]:[&_button]:px-1.75 max-[720px]:[&_button]:py-2 max-[720px]:[&_button]:text-sm [&_button.active]:bg-[#292637] [&_button.active]:text-[#c6b2ff] max-[720px]:[&_button>svg]:w-3.25"
          role="group"
          aria-label="Tryb dostępności"
        >
          <button
            aria-pressed={!group}
            className={
              !group
                ? "active cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                : "cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            }
            onClick={() => {
              closeInspection();
              setGroup(false);
            }}
          >
            <MousePointer2 className="shrink-0" size={15} aria-hidden="true" />{" "}
            Moja dostępność
          </button>
          <button
            aria-pressed={group}
            className={
              group
                ? "active cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                : "cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            }
            onClick={() => {
              closeInspection();
              setGroup(true);
            }}
          >
            <Users className="shrink-0" size={15} aria-hidden="true" />{" "}
            Dostępność grupy
          </button>
        </div>
        <div className="flex items-center gap-0.75 whitespace-nowrap max-[720px]:[&_.icon-button]:size-9 [&>span]:text-sm [&>span]:text-[#9eabc1] max-[720px]:[&>span]:hidden">
          <button
            className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            aria-label="Poprzednie dni"
            disabled={page === 0}
            onClick={() => {
              closeInspection();
              setPage(Math.max(0, page - 5));
            }}
          >
            <ChevronLeft className="shrink-0" size={17} aria-hidden="true" />
          </button>
          <span>
            {page + 1}-{Math.min(page + 5, days.length)} / {days.length}
          </span>
          <button
            className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            aria-label="Następne dni"
            disabled={page + 5 >= days.length}
            onClick={() => {
              closeInspection();
              setPage(page + 5);
            }}
          >
            <ChevronRight className="shrink-0" size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      {!group && !disabled && (
        <>
          <div
            className="flex flex-wrap items-center gap-2 border-b [border-bottom-style:solid] border-b-[#2c3344] bg-[#121925] px-4.5 py-3.5 max-[720px]:gap-1.5 max-[720px]:p-3.25 [&>button]:inline-flex [&>button]:min-h-8.5 [&>button]:items-center [&>button]:gap-1.5 [&>button]:rounded-md [&>button]:border [&>button]:border-solid [&>button]:border-[#364055] [&>button]:bg-[#181f2c] [&>button]:px-2.75 [&>button]:py-2 [&>button]:text-sm [&>button]:text-[#aab4c8] max-[720px]:[&>button]:min-h-9.5 max-[720px]:[&>button]:px-2.5 max-[720px]:[&>button]:py-2.25 max-[720px]:[&>button]:text-sm [&>button.active]:border-[#7a829b] [&>button.active]:bg-[#292d3c] [&>button.active]:text-[#d4dbe9] [&>button.active.available]:border-[#a28ac9] [&>button.active.available]:bg-[#8a6ac323] [&>button.active.available]:text-[#dbc5ff] [&>button.active.preferred]:border-[#b59665] [&>button.active.preferred]:bg-[#bd94552a] [&>button.active.preferred]:text-[#f0cd92]"
            role="group"
            aria-label="Rodzaj zaznaczenia"
          >
            <button
              className={
                mode === "available"
                  ? "active available cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                  : "cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              }
              aria-pressed={mode === "available"}
              onClick={() => setMode("available")}
            >
              <Check className="shrink-0" size={14} aria-hidden="true" /> Mogę
            </button>
            <button
              className={
                mode === "preferred"
                  ? "active preferred cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                  : "cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              }
              aria-pressed={mode === "preferred"}
              onClick={() => setMode("preferred")}
            >
              <Star className="shrink-0" size={14} aria-hidden="true" /> Wolę
              ten termin
            </button>
            <button
              className={
                mode === "erase"
                  ? "active cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                  : "cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              }
              aria-pressed={mode === "erase"}
              onClick={() => setMode("erase")}
            >
              <Eraser className="shrink-0" size={14} aria-hidden="true" /> Usuń
            </button>
          </div>
          {mode !== "erase" && (
            <AvailabilityRangeForm
              event={event}
              slots={slots}
              disabled={disabled}
              onAdd={addRange}
              isPreferred={mode === "preferred"}
            />
          )}
        </>
      )}
      {event.closed_at && (
        <div className="flex items-center gap-1.75 border-b [border-bottom-style:solid] border-b-[#3c344c] bg-[#a590c010] px-4.5 py-3 text-sm text-[#baadca]">
          <LockKeyhole className="shrink-0" size={14} aria-hidden="true" />{" "}
          Zbieranie dostępności zamknięte
        </div>
      )}
      {!disabled && !group && (
        <div className="hidden pointer-coarse:flex pointer-coarse:items-center pointer-coarse:gap-2.5 pointer-coarse:border-b pointer-coarse:[border-bottom-style:solid] pointer-coarse:border-b-border pointer-coarse:px-4 pointer-coarse:py-3 pointer-coarse:[&>span]:text-sm pointer-coarse:[&>span]:text-[#a3adc1]">
          <button
            className={`button small inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent px-3.25 py-2 text-sm leading-5 font-medium text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.danger]:border-[#c16b76] [&.danger]:bg-[#ab515c] [&.danger]:text-white [&.primary]:bg-[#b19cfc] [&.primary]:text-[#1c1435] [&.primary]:shadow-[0_3px_12px_#a68bea14] [&.primary:hover]:-translate-y-px [&.primary:hover]:bg-[#c3b0ff] [&.secondary]:border-[#303646] [&.secondary]:bg-[#181e2b] [&.secondary]:text-[#d2d7e4] [&.secondary:hover]:border-[#48516a] [&.secondary:hover]:bg-[#242b3b] ${touchEdit ? "primary" : "secondary"}`}
            aria-pressed={touchEdit}
            onClick={() => setTouchEdit(!touchEdit)}
          >
            <Hand className="shrink-0" size={15} aria-hidden="true" />
            {touchEdit ? "Zakończ zaznaczanie" : "Włącz zaznaczanie dotykiem"}
          </button>
          <span>
            {touchEdit
              ? "Przesuwaj palcem po polach."
              : "Dotknij pola, aby zaznaczyć. Przesuń, aby przewinąć."}
          </span>
        </div>
      )}
      <div
        className={`grid-scroll max-h-172.5 [touch-action:pan-x_pan-y] scrollbar-thin [scrollbar-color:#384256_transparent] overflow-auto overscroll-contain px-4.5 pt-0 pb-4 select-none max-[720px]:max-h-142.5 max-[720px]:px-3.25 max-[720px]:pt-0 max-[720px]:pb-3.5 ${touchEdit ? "pointer-coarse:[.grid-scroll&]:touch-none" : ""}`}
        ref={grid}
        onFocus={(e) => {
          if (restoringFocus.current) return;
          const element = (e.target as HTMLElement).closest<HTMLElement>(
            "[data-slot]",
          );
          if (element) inspect(element);
        }}
        onPointerOver={(e) => {
          if (e.pointerType === "touch" || gesture.current) return;
          const element = (e.target as HTMLElement).closest<HTMLElement>(
            "[data-slot]",
          );
          if (element) inspect(element);
        }}
        onClick={(e) => {
          const element = (e.target as HTMLElement).closest<HTMLElement>(
            "[data-slot]",
          );
          if (group) {
            if (element) inspect(element);
            return;
          }
          if (e.detail !== 0 || disabled) return;
          const key = element?.dataset.slot;
          if (key) changeKey(key);
        }}
        onPointerDown={(e) => {
          if (group || disabled || e.button !== 0) return;
          const key = (e.target as HTMLElement).closest<HTMLElement>(
            "[data-slot]",
          )?.dataset.slot;
          if (!key) return;
          closeInspection();
          if (e.pointerType === "touch" && !touchEdit) {
            touchTap.current = {
              pointer: e.pointerId,
              key,
              x: e.clientX,
              y: e.clientY,
              moved: false,
            };
            return;
          }
          e.preventDefault();
          (e.target as HTMLElement)
            .closest<HTMLButtonElement>("[data-slot]")
            ?.focus({ preventScroll: true });
          closeInspection();
          gesture.current = {
            pointer: e.pointerId,
            next: { slots: new Set(own), preferred: new Set(preferred) },
            add: mode !== "erase" && !matching(key),
            mode,
            seen: new Set(),
            last: key,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          paint(key);
        }}
        onPointerMove={(e) => {
          if (
            touchTap.current?.pointer === e.pointerId &&
            Math.hypot(
              e.clientX - touchTap.current.x,
              e.clientY - touchTap.current.y,
            ) > 8
          )
            touchTap.current.moved = true;
          const element = document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest<HTMLElement>("[data-slot]");
          const key = element?.dataset.slot;
          if (key && grid.current?.contains(element)) {
            if (gesture.current?.pointer === e.pointerId) paint(key);
            else if (e.pointerType !== "touch" && element) inspect(element);
          }
        }}
        onPointerUp={(e) => {
          const tap = touchTap.current;
          touchTap.current = null;
          if (
            tap?.pointer === e.pointerId &&
            !tap.moved &&
            !group &&
            !disabled &&
            (e.target as HTMLElement).closest<HTMLElement>("[data-slot]")
              ?.dataset.slot === tap.key
          )
            changeKey(tap.key);
          if (gesture.current?.pointer === e.pointerId) finish();
        }}
        onPointerCancel={() => {
          touchTap.current = null;
          finish(true);
        }}
        onLostPointerCapture={() => finish(true)}
      >
        <div
          className={`grid min-w-min gap-1.25 ${dayColumns[visibleDays.length] ?? dayColumns[1]}`}
        >
          {visibleDays.map((day) => {
            const columnSlots = slots.filter((s) => s.day === day);
            const repeated = new Set(
              columnSlots
                .filter(
                  (s, i) =>
                    columnSlots.findIndex((t) => t.label === s.label) !== i,
                )
                .map((s) => s.label),
            );
            const clear =
              mode === "erase" ||
              columnSlots.every((slot) => matching(slot.start));
            return (
              <div className="flex flex-col gap-1" key={day}>
                <div className="sticky top-0 z-1 flex items-center justify-center gap-1.5 bg-surface px-0.5 pt-5 pb-3.5 [&>small]:text-sm [&>small]:text-[#95a3b8] [&>span]:text-sm [&>span]:tracking-wider [&>span]:text-[#96a4bc] [&>span]:uppercase [&>strong]:text-lg [&>strong]:font-medium">
                  <span>{dayLabel(day)}</span>
                  <strong>{dayLabel(day, "d")}</strong>
                  <small className="text-sm">{dayLabel(day, "MMM")}</small>
                </div>
                {!group && !disabled && (
                  <button
                    type="button"
                    className="mx-0 -mt-0.5 mb-1.25 min-h-8 cursor-pointer rounded-sm border border-dashed border-[#493c5e] bg-[#ac8ad50a] text-sm text-[#a994cb] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#9b77c8] hover:bg-[#ac8ad51c] hover:text-[#dbc2fc] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                    disabled={!columnSlots.length}
                    aria-label={`${clear ? "Wyczyść" : "Zaznacz"} cały dzień ${dayLabel(day, "d MMM")}`}
                    onClick={() => {
                      const next = {
                        slots: new Set(own),
                        preferred: new Set(preferred),
                      };
                      columnSlots.forEach((slot) =>
                        apply(next, slot.start, !clear, mode),
                      );
                      onChange(next.slots, next.preferred);
                    }}
                  >
                    {clear ? (
                      "Wyczyść dzień"
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1">
                        {mode === "preferred" ? (
                          <Star
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                          />
                        ) : (
                          <Plus
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                          />
                        )}
                        {mode === "preferred"
                          ? "Wolę cały dzień"
                          : "Cały dzień"}
                      </span>
                    )}
                  </button>
                )}
                {columnSlots.map((slot) => (
                  <AvailabilityCell
                    key={slot.start}
                    slot={slot}
                    selected={selection.has(slot.start)}
                    preferred={preferredSelection.has(slot.start)}
                    preferredCount={preferredCounts.get(slot.start)?.size ?? 0}
                    count={counts.get(slot.start)?.size ?? 0}
                    total={participants.length}
                    names={participants
                      .filter((p) => counts.get(slot.start)?.has(p.id))
                      .map((p) => p.display_name)
                      .join(", ")}
                    group={group}
                    disabled={disabled}
                    repeated={repeated.has(slot.label)}
                    inspected={inspection?.key === slot.start}
                    previewId={previewId}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      {!group && (
        <AvailabilityCopy
          event={event}
          slots={slots}
          own={own}
          preferred={preferred}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {!group && (
        <AvailabilitySelection
          event={event}
          slots={slots}
          own={own}
          preferred={preferred}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t [border-top-style:solid] border-t-border px-4.25 py-3.5 text-sm text-[#9eabc0] max-[720px]:gap-1.75 max-[720px]:p-3 max-[720px]:text-sm">
        <span>
          {group ? (
            <>
              Dostępność w danym przedziale;
              <Star
                aria-hidden="true"
                className="mx-1 inline size-3.5 shrink-0"
              />
              preferowane godziny
            </>
          ) : (
            "Preferencja również oznacza, że możesz uczestniczyć."
          )}
        </span>
        <div className="flex items-center gap-1 text-sm whitespace-nowrap max-[720px]:text-sm [&>span:first-child]:mr-0.75 [&>span:last-child]:ml-0.75">
          {group ? (
            <>
              <span>0%</span>
              <Square
                aria-hidden="true"
                className="size-3 shrink-0 fill-[#1d3937] text-[#35544c]"
              />
              <Square
                aria-hidden="true"
                className="size-3 shrink-0 fill-[#2b5649] text-[#4c7d66]"
              />
              <Square
                aria-hidden="true"
                className="size-3 shrink-0 fill-[#427b5d] text-[#66997b]"
              />
              <Square
                aria-hidden="true"
                className="size-3 shrink-0 fill-[#8ccca6] text-[#a8e6bc]"
              />
              <span>100%</span>
            </>
          ) : (
            <>
              <Square
                aria-hidden="true"
                className="size-3 shrink-0 fill-[#705baf] text-[#a18ad5]"
              />
              <span>Mogę</span>
              <Star className="shrink-0" size={14} aria-hidden="true" />
              <span>Wolę</span>
            </>
          )}
        </div>
      </div>
      <div
        className="min-h-6.75 px-4.25 pt-0 pb-3.25 text-sm leading-relaxed text-[#8e9bb1]"
        aria-live="off"
      >
        {`Godziny w strefie ${event.timezone}. Klawiatura: Tab i Spacja / Enter. Escape zamyka podgląd osób.`}
      </div>
      {inspection && inspectedSlot && (
        <SlotAvailabilityPreview
          id={previewId}
          inspection={inspection}
          slot={inspectedSlot}
          timezone={event.timezone}
          participants={participants}
          available={counts.get(inspectedSlot.start) ?? emptyPreferred}
          preferred={preferredCounts.get(inspectedSlot.start) ?? emptyPreferred}
          onClose={closeInspection}
        />
      )}
    </section>
  );
}
