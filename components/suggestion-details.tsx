"use client";
import { Check, Clock3, ShieldCheck, Star, X } from "lucide-react";
import { compareTerm } from "@/lib/term-comparison";
import { localTime, timeRange } from "@/lib/time";
import type { EventSnapshot } from "@/lib/types";
import { Dialog } from "./ui";
import { InlineSeparator } from "./inline-separator";
import { MeetingConflicts } from "./meeting-conflicts";

export function SuggestionDetails({
  snapshot,
  start,
  onClose,
  onConfirm,
  disabled,
}: {
  snapshot: EventSnapshot;
  start: string;
  onClose: () => void;
  onConfirm?: () => void;
  disabled: boolean;
}) {
  const people = compareTerm(snapshot, start);
  const end = new Date(
    Date.parse(start) + snapshot.event.meeting_duration_minutes * 60000,
  ).toISOString();
  const labels = {
    preferred: "Preferuje cały termin",
    available: "Może przez cały termin",
    unavailable: "Nie może przez cały termin",
    pending: "Jeszcze nie odpowiedział",
  };
  const requiredMissing = people.some(
    (p) => p.person.is_required && ["unavailable", "pending"].includes(p.state),
  );
  const available = people.filter((p) =>
    ["preferred", "available"].includes(p.state),
  ).length;
  return (
    <Dialog title="Kto może w tym terminie?" onClose={onClose}>
      <MeetingConflicts start={start} end={end} eventId={snapshot.event.id} />
      <div className="grid gap-2.25 rounded-[9px] border border-solid border-[#474059] bg-[#a88cff0c] p-4.25 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#aab0c2] [&_span]:text-sm [&_span]:leading-relaxed [&_span]:text-[#aab0c2] [&_strong]:text-base [&_strong]:text-[#d8c7eb]">
        <strong>
          {localTime(start, snapshot.event.timezone, "EEEE, d MMMM yyyy")}
        </strong>
        <span>
          {timeRange(start, end, snapshot.event.timezone)} <InlineSeparator />{" "}
          {snapshot.event.timezone}
        </span>
        <p className="m-0 leading-relaxed text-muted">
          {available} z {people.length} osób może uczestniczyć przez całe
          spotkanie.
        </p>
      </div>
      <ul className="mx-0 my-4.5 max-h-[40vh] list-none overflow-auto p-0 [&_li]:flex [&_li]:items-start [&_li]:gap-2.75 [&_li]:border-b [&_li]:[border-bottom-style:solid] [&_li]:border-b-[#32394a] [&_li]:px-0 [&_li]:py-3.25 [&_li>div>span]:mt-1.5 [&_li>div>span]:block [&_li>div>span]:text-sm [&_li>div>span]:text-[#a6afc2] [&_strong]:block [&_strong]:text-sm [&_strong]:font-medium [&_strong]:wrap-anywhere [&_strong]:text-[#d6dbe7] [&_strong_small]:mt-1.25 [&_strong_small]:flex [&_strong_small]:items-center [&_strong_small]:gap-1.25 [&_strong_small]:text-sm [&_strong_small]:text-[#bcabd2]">
        {people.map(({ person, state }) => (
          <li key={person.id}>
            <span
              className={`grid size-6.75 shrink-0 place-items-center rounded-md bg-[#303346] text-[#adb4c5] [&.available]:bg-[#51977424] [&.available]:text-[#a4d3bc] [&.preferred]:bg-[#b8995424] [&.preferred]:text-[#edcb8b] ${state}`}
            >
              {state === "preferred" ? (
                <Star className="shrink-0" size={15} aria-hidden="true" />
              ) : state === "available" ? (
                <Check className="shrink-0" size={15} aria-hidden="true" />
              ) : state === "pending" ? (
                <Clock3 aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <X aria-hidden="true" className="size-4 shrink-0" />
              )}
            </span>
            <div>
              <strong>
                {person.display_name}
                {person.is_required && (
                  <small className="text-sm">
                    <ShieldCheck
                      className="shrink-0"
                      size={14}
                      aria-hidden="true"
                    />{" "}
                    Wymagana obecność
                  </small>
                )}
              </strong>
              <span>{labels[state]}</span>
            </div>
          </li>
        ))}
      </ul>
      {requiredMissing && (
        <p className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5">
          Ten termin nie pasuje wszystkim wymaganym osobom.
        </p>
      )}
      <div className="mt-6.25 flex flex-wrap justify-end gap-2.5 max-[720px]:[&_.button]:px-3.25 max-[720px]:[&_.button]:py-2.5 max-[720px]:[&_.button]:text-sm [&>.button]:text-sm">
        <button
          className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
          onClick={onClose}
        >
          Zamknij
        </button>
        {onConfirm && (
          <button
            className="button primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
            disabled={disabled || requiredMissing || available === 0}
            onClick={onConfirm}
          >
            Wybierz ten termin
          </button>
        )}
      </div>
    </Dialog>
  );
}
