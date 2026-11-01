"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { InlineSeparator } from "./inline-separator";
import { Check, Star, Users, X } from "lucide-react";
import { dayLabel, SLOT_MS, timeRange } from "@/lib/time";
import type { Participant, TimeSlot } from "@/lib/types";

export interface SlotInspection {
  key: string;
  left: number;
  top: number;
  maxHeight: number;
  side: "top" | "bottom";
}

export function SlotAvailabilityPreview({
  id,
  inspection,
  slot,
  timezone,
  participants,
  available,
  preferred,
  onClose,
}: {
  id: string;
  inspection: SlotInspection;
  slot: TimeSlot;
  timezone: string;
  participants: Participant[];
  available: ReadonlySet<string>;
  preferred: ReadonlySet<string>;
  onClose: (restoreFocus?: boolean) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const people = participants
    .map((person, tone) => ({ person, tone: tone % 4 }))
    .filter(({ person }) => available.has(person.id));
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      const target = e.target;
      if (
        !(target instanceof Element) ||
        panel.current?.contains(target) ||
        target.closest("[data-slot]")
      )
        return;
      onClose();
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose(Boolean(panel.current?.contains(document.activeElement)));
    };
    const scroll = (e: Event) => {
      if (e.target instanceof Node && panel.current?.contains(e.target)) return;
      onClose();
    };
    const resize = () => onClose();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", resize);
    };
  }, [onClose]);
  const end = new Date(Date.parse(slot.start) + SLOT_MS).toISOString();
  return createPortal(
    <div
      ref={panel}
      id={id}
      role="region"
      aria-labelledby={`${id}-heading`}
      data-availability-preview
      data-side={inspection.side}
      className="fixed top-(--preview-top) left-(--preview-left) z-80 max-h-(--preview-height) w-88 max-w-[calc(100vw-24px)] overflow-auto overscroll-contain rounded-xl border border-primary/40 bg-surface p-4 font-sans text-sm leading-relaxed text-foreground shadow-xl shadow-black/40 data-[side=top]:-translate-y-full"
      style={
        {
          "--preview-left": `${inspection.left}px`,
          "--preview-top": `${inspection.top}px`,
          "--preview-height": `${inspection.maxHeight}px`,
        } as CSSProperties
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            id={`${id}-heading`}
            className="text-base font-semibold tracking-tight"
          >
            Kto może w tym czasie?
          </h3>
          <p className="mt-1 text-sm text-muted capitalize">
            {dayLabel(slot.day, "EEEE, d MMMM")}
          </p>
          <p className="mt-1 text-base font-medium tabular-nums">
            {timeRange(slot.start, end, timezone)}
          </p>
          <p className="mt-1 text-sm wrap-anywhere text-muted">
            {timezone} <InlineSeparator /> UTC{slot.offset}
          </p>
        </div>
        <button
          type="button"
          aria-label="Zamknij podgląd dostępności"
          onClick={() => onClose(true)}
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm font-medium">
        <Users aria-hidden="true" className="size-4 text-primary" />
        {people.length} z {participants.length} osób zaznaczyło ten przedział
      </p>
      {people.length ? (
        <ul className="mt-3 grid list-none gap-3 p-0">
          {people.map(({ person, tone }) => (
            <li key={person.id} className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                data-tone={tone}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-medium text-primary data-[tone=1]:bg-amber-300/15 data-[tone=1]:text-amber-200 data-[tone=2]:bg-emerald-300/15 data-[tone=2]:text-emerald-200 data-[tone=3]:bg-sky-300/15 data-[tone=3]:text-sky-200"
              >
                {person.display_name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium wrap-anywhere">
                  {person.display_name}
                </p>
                {preferred.has(person.id) ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-amber-200">
                    <Star aria-hidden="true" className="size-3.5 shrink-0" />{" "}
                    Preferuje tę godzinę
                  </p>
                ) : (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-success">
                    <Check aria-hidden="true" className="size-3.5 shrink-0" />{" "}
                    Może uczestniczyć
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg bg-background/50 p-3 text-sm text-muted">
          Nikt jeszcze nie zaznaczył dostępności w tym przedziale.
        </p>
      )}
      <p className="mt-4 border-t border-border pt-3 text-sm leading-relaxed text-muted">
        Podgląd obejmuje 30 minut. W porównaniu propozycji sprawdzisz dostępność
        na całe spotkanie.
      </p>
    </div>,
    document.body,
  );
}
