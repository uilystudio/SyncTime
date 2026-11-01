"use client";
import { useState } from "react";
import { Check, Crown, LoaderCircle, ShieldCheck } from "lucide-react";
import { setRequiredParticipant } from "@/lib/api";
import { responseLabels, responseStatus } from "@/lib/responses";
import { errorMessage } from "@/lib/supabase";
import type { EventSnapshot, Participant } from "@/lib/types";
import { Dialog } from "./ui";

export function ParticipantResponses({
  snapshot,
  userId,
  disabled,
  onChanged,
}: {
  snapshot: EventSnapshot;
  userId: string;
  disabled: boolean;
  onChanged: (message: string) => Promise<void>;
}) {
  const { event, participants, slots } = snapshot;
  const organizer = event.creator_id === userId;
  const answered = participants.filter(
    (p) => responseStatus(p, slots) !== "pending",
  ).length;
  const [change, setChange] = useState<{
    person: Participant;
    revision: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (!change) return;
    setBusy(true);
    setError("");
    try {
      await setRequiredParticipant(
        event.id,
        change.person.id,
        !change.person.is_required,
        change.revision,
      );
      await onChanged("Zmieniono wymaganych uczestników.");
      setChange(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-[13px] border border-solid border-border bg-surface p-5.25 max-[1200px]:px-3.5 max-[1200px]:py-4.25 max-[720px]:order-3 max-[720px]:w-full max-[720px]:p-5 @max-[680px]/workspace:in-[.workspace]:order-3 @max-[680px]/workspace:in-[.workspace]:w-full [&_.fine-print]:flex [&_.fine-print]:items-center [&_.fine-print]:gap-1.25 [&_.fine-print]:border-t [&_.fine-print]:[border-top-style:solid] [&_.fine-print]:border-t-border [&_.fine-print]:pt-3.5 [&_.fine-print]:text-sm [&_li]:flex [&_li]:items-center [&_li]:gap-2.25 [&_li_div>span]:text-sm [&_li_div>span]:text-[#8e99b1] [&_li_strong]:text-sm [&_li_strong]:font-medium [&_li_strong]:wrap-anywhere [&_li_strong>small]:text-sm [&_li_strong>small]:font-normal [&_li_strong>small]:text-[#8e99b1] [&_li>div]:flex [&_li>div]:min-w-0 [&_li>div]:flex-1 [&_li>div]:flex-col [&_li>div]:gap-1 [&_ul]:mx-0 [&_ul]:my-4.5 [&_ul]:flex [&_ul]:list-none [&_ul]:flex-col [&_ul]:gap-4.5 [&_ul]:p-0 max-[720px]:[&_ul]:grid max-[720px]:[&_ul]:grid-cols-[repeat(2,1fr)] max-[720px]:[&_ul]:gap-[18px_14px]">
      <div className="flex items-center justify-between gap-2 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-1.75 [&_h2]:text-base [&_h2]:tracking-tight [&_h2>svg]:text-primary">
        <h2 className="m-0 font-semibold tracking-tight">Uczestnicy</h2>
        <span className="rounded-[5px] bg-[#282e3e] px-1.75 py-0.75 text-sm text-[#b4bfd5]">
          {participants.length}
        </span>
      </div>
      <div className="mx-0 my-4 rounded-lg border border-solid border-[#4b416244] bg-[#a88cff0b] p-3 [&_progress]:mt-2.5 [&_progress]:block [&_progress]:h-1.25 [&_progress]:w-full [&_progress]:accent-[#b29be0] [&_strong]:text-sm [&_strong]:font-medium [&_strong]:text-[#d2c3e7]">
        <strong>
          {answered} z {participants.length} osób odpowiedziało
        </strong>
        <progress
          max={participants.length || 1}
          value={answered}
          aria-label="Odpowiedzi uczestników"
        />
      </div>
      <ul>
        {participants.map((p, i) => {
          const state = responseStatus(p, slots);
          return (
            <li
              key={p.id}
              className="items-start! [&_strong]:wrap-anywhere [&>div]:min-w-0 [&>div]:flex-1"
            >
              <span
                data-tone={i % 4}
                className={`avatar grid size-7.5 shrink-0 place-items-center rounded-full bg-[#a68ce025] text-sm font-medium text-[#c4a7ef] data-[tone=1]:bg-[#e9bb8120] data-[tone=1]:text-[#e6c396] data-[tone=2]:bg-[#8ed9bc20] data-[tone=2]:text-[#8ed9bc] data-[tone=3]:bg-[#91bbeb20] data-[tone=3]:text-[#91bbeb]`}
              >
                {p.display_name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <strong>
                  {p.display_name}
                  {p.user_id === userId && (
                    <small className="text-sm"> (Ty)</small>
                  )}{" "}
                  {p.user_id === event.creator_id && (
                    <Crown
                      className="shrink-0"
                      size={14}
                      aria-label="Organizator"
                    />
                  )}
                </strong>
                <span
                  className={`[&.available]:text-[#9cd6ba]! [&.unavailable]:text-[#e8b59b]! ${state}`}
                >
                  {responseLabels[state]}
                </span>
                {p.is_required && (
                  <small className="mt-1.75 flex items-center gap-1 text-sm text-[#c3b1e3]">
                    <ShieldCheck
                      className="shrink-0"
                      size={14}
                      aria-hidden="true"
                    />{" "}
                    Obecność wymagana
                  </small>
                )}
                {organizer && (
                  <button
                    className="text-button mt-2 flex min-h-7.5 cursor-pointer items-center gap-1.25 border-0 border-solid border-current bg-transparent p-1 text-left text-sm! text-[#9ca8bf] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#cfbdf7] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none max-[720px]:min-h-9.5 max-[720px]:max-w-33.75 max-[720px]:justify-end max-[720px]:p-0 max-[720px]:text-right max-[720px]:text-sm"
                    disabled={disabled}
                    onClick={() => {
                      setChange({
                        person: { ...p },
                        revision: event.revision ?? 1,
                      });
                      setError("");
                    }}
                  >
                    {p.is_required
                      ? "Zmień na opcjonalną"
                      : "Wymagaj obecności"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="fine-print m-0 text-sm leading-relaxed text-[#8a97ad]">
        <ShieldCheck className="shrink-0" size={16} aria-hidden="true" />{" "}
        {organizer
          ? "Rekomendacje muszą pasować wszystkim wymaganym osobom."
          : "Każdy odpowiada za własną dostępność."}
      </p>
      {change && (
        <Dialog
          title="Zmienić wymaganą obecność?"
          onClose={() => {
            if (!busy) setChange(null);
          }}
        >
          <p className="m-0 leading-relaxed text-muted">
            <strong>{change.person.display_name}</strong>:{" "}
            {change.person.is_required
              ? "obecność będzie opcjonalna."
              : "pokażemy tylko terminy, na których ta osoba może być przez całe spotkanie."}
          </p>
          {event.selected_start && !change.person.is_required && (
            <p className="m-0 leading-relaxed text-muted in-[.edit-meeting-form]:mb-4.5 in-[.edit-meeting-form]:rounded-[7px] in-[.edit-meeting-form]:border in-[.edit-meeting-form]:border-solid in-[.edit-meeting-form]:border-[#8f7e4d49] in-[.edit-meeting-form]:bg-[#b69c5a10] in-[.edit-meeting-form]:p-3 in-[.edit-meeting-form]:text-sm in-[.edit-meeting-form]:leading-relaxed in-[.edit-meeting-form]:text-[#c3b391]">
              Jeśli zatwierdzony termin nie pasuje tej osobie, zatwierdzenie
              zostanie cofnięte.
            </p>
          )}
          {error && (
            <div
              className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="mt-6.25 flex flex-wrap justify-end gap-2.5 max-[720px]:[&_.button]:px-3.25 max-[720px]:[&_.button]:py-2.5 max-[720px]:[&_.button]:text-sm [&>.button]:text-sm">
            <button
              className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              disabled={busy}
              onClick={() => setChange(null)}
            >
              Anuluj
            </button>
            <button
              className="button primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              disabled={busy}
              onClick={() => void save()}
            >
              {busy ? (
                <LoaderCircle
                  size={15}
                  className="shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <Check className="shrink-0" size={15} aria-hidden="true" />
              )}{" "}
              Zapisz
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
