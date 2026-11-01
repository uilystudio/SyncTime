"use client";
import { useState } from "react";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { setResponseDeadline } from "@/lib/api";
import { deadlineInstant } from "@/lib/deadlines";
import { errorMessage } from "@/lib/supabase";
import type { MeetingEvent } from "@/lib/types";
import { Dialog } from "./ui";

export function DeadlineDialog({
  event,
  onClose,
  onSaved,
}: {
  event: MeetingEvent;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [original] = useState(event);
  const [value, setValue] = useState(() =>
    event.response_deadline
      ? formatInTimeZone(
          event.response_deadline,
          event.timezone,
          "yyyy-MM-dd'T'HH:mm",
        )
      : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(remove = false) {
    setError("");
    let deadline: string | null = null;
    if (!remove) {
      try {
        deadline = deadlineInstant(value, original.timezone);
      } catch (e) {
        setError(errorMessage(e));
        return;
      }
    }
    setBusy(true);
    try {
      await setResponseDeadline(original.id, deadline, original.revision ?? 1);
      await onSaved(
        remove
          ? "Usunięto termin odpowiedzi."
          : "Zapisano termin zakończenia odpowiedzi.",
      );
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title="Termin zakończenia odpowiedzi"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="m-0 leading-relaxed text-muted">
        Po tej godzinie dostępność i odpowiedzi zostaną zablokowane, a nowe
        osoby nie dołączą. Nadal możesz wybrać ostateczny termin.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
          <span>Odpowiedzi do ({original.timezone})</span>
          <input
            className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
            type="datetime-local"
            value={value}
            disabled={busy}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby="deadline-help"
          />
        </label>
        <p
          id="deadline-help"
          className="fine-print m-0 text-sm leading-relaxed text-[#8a97ad]"
        >
          Godzina w strefie spotkania. Zmiana daty lub usunięcie terminu
          ponownie umożliwi odpowiedzi, jeśli nie zamknięto ich ręcznie.
        </p>
        {value &&
          Number.isFinite(
            fromZonedTime(value, original.timezone).getTime(),
          ) && (
            <p className="fine-print m-0 text-sm leading-relaxed text-[#8a97ad]">
              Wybrany czas:{" "}
              {formatInTimeZone(
                fromZonedTime(value, original.timezone),
                original.timezone,
                "dd.MM.yyyy HH:mm (XXX)",
              )}
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
          {original.response_deadline && (
            <button
              type="button"
              className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              disabled={busy}
              onClick={() => void save(true)}
            >
              Usuń termin
            </button>
          )}
          <button
            className="button primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
            disabled={busy || !value}
          >
            {busy ? "Zapisywanie…" : "Zapisz termin odpowiedzi"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
