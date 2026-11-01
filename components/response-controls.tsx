"use client";
import { useState } from "react";
import { CircleCheck, CircleMinus, LoaderCircle } from "lucide-react";
import { setResponse } from "@/lib/api";
import { errorMessage } from "@/lib/supabase";
import { responseLabels, responseStatus } from "@/lib/responses";
import type { EventSnapshot, Participant } from "@/lib/types";
import { Dialog } from "./ui";

export function ResponseControls({
  snapshot,
  participant,
  disabled,
  closed,
  onChanged,
  onBusyChange,
}: {
  snapshot: EventSnapshot;
  participant?: Participant;
  disabled: boolean;
  closed: boolean;
  onChanged: (message: string) => Promise<void>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [confirmation, setConfirmation] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!participant) return null;
  const state = responseStatus(participant, snapshot.slots);
  async function save(response: "pending" | "unavailable", revision: number) {
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      await setResponse(snapshot.event.id, response, revision);
      await onChanged(
        response === "unavailable"
          ? "Zapisano: żaden termin Ci nie pasuje."
          : "Możesz ponownie wybrać godziny.",
      );
      setConfirmation(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3.5 rounded-[10px] border border-solid border-[#37374c] bg-[#171c2a] p-4.25 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:[&_.button]:min-h-10.5 [&_.eyebrow]:mb-1.75 [&_.eyebrow]:text-sm [&_p]:mt-1.5 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#9da5b9] [&_strong]:flex [&_strong]:items-center [&_strong]:gap-1.5 [&_strong]:text-sm [&_strong]:font-medium [&_strong]:text-[#d1c0e7] [&>button]:shrink-0 [&>button]:text-sm">
        <div>
          <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
            TWOJA ODPOWIEDŹ
          </span>
          <strong>
            <CircleCheck className="shrink-0" size={16} aria-hidden="true" />
            {responseLabels[state]}
          </strong>
          <p className="m-0 leading-relaxed text-muted">
            {state === "unavailable"
              ? "Możesz zmienić zdanie i zaznaczyć pasujące godziny w kalendarzu."
              : "Zaznaczenie godzin automatycznie zapisuje odpowiedź."}
          </p>
        </div>
        {state === "unavailable" ? (
          <button
            className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            disabled={disabled || busy || closed}
            onClick={() => void save("pending", snapshot.event.revision ?? 1)}
          >
            Zmień odpowiedź
          </button>
        ) : (
          <button
            className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            disabled={disabled || busy || closed}
            onClick={() => {
              setConfirmation(snapshot.event.revision ?? 1);
              setError("");
            }}
          >
            <CircleMinus className="shrink-0" size={15} aria-hidden="true" />{" "}
            Żaden termin mi nie pasuje
          </button>
        )}
      </div>
      {error && confirmation === null && (
        <div
          className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
          role="alert"
        >
          {error}
        </div>
      )}
      {confirmation !== null && (
        <Dialog
          title="Żaden termin Ci nie pasuje?"
          onClose={() => {
            if (!busy) setConfirmation(null);
          }}
        >
          <p className="m-0 leading-relaxed text-muted">
            Zapiszemy Twoją odpowiedź i usuniemy wszystkie Twoje dotychczasowe
            zaznaczenia. Organizator będzie wiedział, że już odpowiedziałeś.
          </p>
          {participant.is_required && snapshot.event.selected_start && (
            <p className="m-0 leading-relaxed text-muted in-[.edit-meeting-form]:mb-4.5 in-[.edit-meeting-form]:rounded-[7px] in-[.edit-meeting-form]:border in-[.edit-meeting-form]:border-solid in-[.edit-meeting-form]:border-[#8f7e4d49] in-[.edit-meeting-form]:bg-[#b69c5a10] in-[.edit-meeting-form]:p-3 in-[.edit-meeting-form]:text-sm in-[.edit-meeting-form]:leading-relaxed in-[.edit-meeting-form]:text-[#c3b391]">
              Twoja obecność jest wymagana. Ta odpowiedź cofnie zatwierdzony
              termin.
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
              onClick={() => setConfirmation(null)}
            >
              Anuluj
            </button>
            <button
              className="button primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              disabled={busy}
              onClick={() => void save("unavailable", confirmation)}
            >
              {busy && (
                <LoaderCircle
                  size={15}
                  className="shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}{" "}
              Potwierdź odpowiedź
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
