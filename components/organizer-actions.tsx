"use client";
import { useState } from "react";
import {
  Check,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  UnlockKeyhole,
} from "lucide-react";
import { setMeetingClosed } from "@/lib/api";
import { errorMessage } from "@/lib/supabase";
import type { EventSnapshot } from "@/lib/types";
import { Dialog } from "./ui";
import { collectionClosed } from "@/lib/responses";
import { DeadlineDialog } from "./deadline-dialog";
import { EditMeetingDialog } from "./edit-meeting-dialog";
export function OrganizerActions({
  snapshot,
  disabled,
  onChanged,
}: {
  snapshot: EventSnapshot;
  disabled: boolean;
  onChanged: (message: string) => Promise<void>;
}) {
  const [deadline, setDeadline] = useState(false);
  const closed = collectionClosed(snapshot.event);
  const [editing, setEditing] = useState(false);
  const [transition, setTransition] = useState<{
    closed: boolean;
    revision: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function changeCollection() {
    if (!transition) return;
    setBusy(true);
    setError("");
    try {
      await setMeetingClosed(
        snapshot.event.id,
        transition.closed,
        transition.revision,
      );
      await onChanged(
        transition.closed
          ? "Zbieranie dostępności zamknięte."
          : "Zbieranie dostępności wznowione.",
      );
      setTransition(null);
    } catch (e) {
      setError(errorMessage(e).replace(/^EVENT_CHANGED:\s*/, ""));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div
        className="mx-0 -mt-2.25 mb-6 flex flex-wrap items-center gap-2.25 rounded-[9px] border border-solid border-[#303449] bg-[#141925] p-3.75 max-[720px]:-mt-1 max-[720px]:p-3 [&>.button]:text-sm max-[720px]:[&>.button]:min-h-9.5 max-[720px]:[&>.button]:text-sm [&>span]:text-sm [&>span]:text-[#998aa9]"
        aria-label="Zarządzanie spotkaniem"
      >
        <button
          className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          disabled={disabled}
          onClick={() => setEditing(true)}
        >
          <Pencil className="shrink-0" size={14} aria-hidden="true" /> Edytuj
          spotkanie
        </button>
        <button
          className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          disabled={disabled}
          onClick={() => {
            setTransition({
              closed: !closed,
              revision: snapshot.event.revision ?? 1,
            });
            setError("");
          }}
        >
          {closed ? (
            <UnlockKeyhole className="shrink-0" size={14} aria-hidden="true" />
          ) : (
            <LockKeyhole className="shrink-0" size={14} aria-hidden="true" />
          )}{" "}
          {closed ? "Wznów zbieranie" : "Zamknij zbieranie"}
        </button>
        <button
          className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          disabled={disabled}
          onClick={() => setDeadline(true)}
        >
          <Clock3 className="shrink-0" size={14} aria-hidden="true" /> Termin
          odpowiedzi
        </button>
        {disabled && (
          <span>Najpierw zapisz lub odrzuć zmiany dostępności.</span>
        )}
      </div>
      {deadline && (
        <DeadlineDialog
          event={snapshot.event}
          onClose={() => setDeadline(false)}
          onSaved={onChanged}
        />
      )}
      {editing && (
        <EditMeetingDialog
          snapshot={snapshot}
          onClose={() => setEditing(false)}
          onSaved={onChanged}
        />
      )}
      {transition && (
        <Dialog
          title={
            transition.closed
              ? "Zamknąć zbieranie dostępności?"
              : "Wznowić zbieranie dostępności?"
          }
          onClose={() => {
            if (!busy) setTransition(null);
          }}
        >
          <p className="m-0 leading-relaxed text-muted">
            {transition.closed
              ? "Uczestnicy zachowają podgląd wyników, ale nie będą mogli zmieniać godzin. Nowe osoby nie dołączą przez zaproszenie. Możesz później wznowić zbieranie."
              : "Uczestnicy znów będą mogli edytować godziny, a nowe osoby dołączą przez dotychczasowy link. Zatwierdzony termin pozostanie bez zmian. Jeśli termin odpowiedzi już minął, zostanie usunięty."}
          </p>
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
              onClick={() => setTransition(null)}
            >
              Anuluj
            </button>
            <button
              className="button primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              disabled={busy}
              onClick={() => void changeCollection()}
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
              {transition.closed ? "Zamknij zbieranie" : "Wznów zbieranie"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
