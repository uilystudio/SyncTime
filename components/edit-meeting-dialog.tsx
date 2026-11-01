"use client";
import { useMemo, useState } from "react";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";
import { updateMeeting } from "@/lib/api";
import { errorMessage } from "@/lib/supabase";
import { editImpact, scheduleChanged } from "@/lib/meeting-edit";
import { collectionClosed } from "@/lib/responses";
import { validateEvent } from "@/lib/validation";
import type { EventSnapshot, MeetingEditInput } from "@/lib/types";
import { Dialog } from "./ui";
import { MeetingPlaceFields } from "./meeting-place-fields";

export function EditMeetingDialog({
  snapshot,
  onClose,
  onSaved,
}: {
  snapshot: EventSnapshot;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [original] = useState(snapshot);
  const e = original.event;
  const closed = collectionClosed(e);
  const [input, setInput] = useState<MeetingEditInput>({
    title: e.title,
    description: e.description,
    meeting_mode: e.meeting_mode ?? "undecided",
    meeting_location: e.meeting_location ?? "",
    start_date: e.start_date,
    end_date: e.end_date,
    day_start_time: e.day_start_time.slice(0, 5),
    day_end_time: e.day_end_time.slice(0, 5),
    timezone: e.timezone,
    meeting_duration_minutes: e.meeting_duration_minutes,
  });
  const [allowTrim, setAllowTrim] = useState(false);
  const [allowReset, setAllowReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validation = validateEvent({ ...input, display_name: "Organizer" });
  const impact = useMemo(() => {
    try {
      if (
        Object.keys(validateEvent({ ...input, display_name: "Organizer" }))
          .length
      )
        return null;
      return editImpact(original, input);
    } catch {
      return null;
    }
  }, [original, input]);
  function update(key: keyof MeetingEditInput, value: string | number) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setAllowTrim(false);
    setAllowReset(false);
    setErrors({});
    setError("");
  }
  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setErrors(validation);
    if (
      Object.keys(validation).length ||
      !impact ||
      (impact.removedSlots > 0 && !allowTrim) ||
      (impact.confirmationReset && !allowReset)
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await updateMeeting(
        e.id,
        input,
        e.revision ?? 1,
        allowTrim,
      );
      await onSaved(
        `Zapisano zmiany spotkania.${result.removed_slots ? ` Usunięto ${result.removed_slots} zaznaczeń spoza nowego zakresu.` : ""}`,
      );
      onClose();
    } catch (err) {
      setError(
        errorMessage(err).replace(/^(?:EVENT_CHANGED|TRIM_REQUIRED):\s*/, ""),
      );
      setBusy(false);
    }
  }
  const field = (key: keyof MeetingEditInput, label: string, type = "text") => (
    <label
      className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]"
      key={key}
    >
      <span id={`edit-${key}-label`}>{label}</span>
      <input
        className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
        aria-labelledby={`edit-${key}-label`}
        type={type}
        value={input[key]}
        maxLength={key === "title" ? 100 : undefined}
        step={type === "time" ? 1800 : undefined}
        onChange={(ev) => update(key, ev.target.value)}
        disabled={busy || (closed && !["title", "description"].includes(key))}
        aria-invalid={Boolean(errors[key] ?? validation[key])}
        aria-describedby={
          (errors[key] ?? validation[key]) ? `edit-${key}-error` : undefined
        }
      />
      {(errors[key] ?? validation[key]) && (
        <span
          id={`edit-${key}-error`}
          className="text-sm leading-normal text-[#f1a3a3] [.join-strip_form>&]:absolute [.join-strip_form>&]:top-full [.join-strip_form>&]:text-sm"
        >
          {errors[key] ?? validation[key]}
        </span>
      )}
    </label>
  );
  return (
    <Dialog
      title="Edytuj spotkanie"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={submit}
        noValidate
        className="edit-meeting-form [&_.field]:mb-4.5 [&_.field-row]:gap-3 max-[720px]:[&_.field-row]:gap-2.5 max-[720px]:[&_.field-row_input]:px-1.75 max-[720px]:[&_.field-row_input]:py-2.5 max-[720px]:[&_.field-row_input]:text-base [&_input]:min-w-0 [&_input]:text-base [&_select]:min-w-0 [&_select]:text-base"
      >
        {field("title", "Nazwa spotkania")}
        <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
          <span>Opis</span>
          <textarea
            className="min-h-21.25 w-full resize-y rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            value={input.description}
            maxLength={1000}
            disabled={busy}
            onChange={(ev) => update("description", ev.target.value)}
          />
        </label>
        <MeetingPlaceFields
          value={input}
          errors={errors}
          disabled={busy}
          onChange={(place) => {
            setInput((previous) => ({ ...previous, ...place }));
            setErrors({});
            setError("");
          }}
        />
        {closed && (
          <p className="m-0 leading-relaxed text-muted in-[.edit-meeting-form]:mb-4.5 in-[.edit-meeting-form]:rounded-[7px] in-[.edit-meeting-form]:border in-[.edit-meeting-form]:border-solid in-[.edit-meeting-form]:border-[#8f7e4d49] in-[.edit-meeting-form]:bg-[#b69c5a10] in-[.edit-meeting-form]:p-3 in-[.edit-meeting-form]:text-sm in-[.edit-meeting-form]:leading-relaxed in-[.edit-meeting-form]:text-[#c3b391]">
            Zbieranie dostępności jest zamknięte. Możesz zmienić nazwę, opis i
            miejsce spotkania. Wznów zbieranie, aby edytować kalendarz.
          </p>
        )}
        <div className="field-row grid grid-cols-2 gap-4.25 max-[720px]:gap-3 max-[480px]:grid-cols-1 max-[720px]:[&_input]:min-w-0 max-[720px]:[&_input]:px-2 max-[720px]:[&_input]:py-2.5 max-[720px]:[&_input]:text-base">
          {field("start_date", "Pierwszy dzień", "date")}
          {field("end_date", "Ostatni dzień", "date")}
        </div>
        <div className="field-row grid grid-cols-2 gap-4.25 max-[720px]:gap-3 max-[480px]:grid-cols-1 max-[720px]:[&_input]:min-w-0 max-[720px]:[&_input]:px-2 max-[720px]:[&_input]:py-2.5 max-[720px]:[&_input]:text-base">
          {field("day_start_time", "Godziny od", "time")}
          {field("day_end_time", "Godziny do", "time")}
        </div>
        <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
          <span>Długość spotkania</span>
          <select
            className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            disabled={busy || closed}
            value={input.meeting_duration_minutes}
            onChange={(ev) =>
              update("meeting_duration_minutes", Number(ev.target.value))
            }
          >
            {[30, 60, 90, 120].map((n) => (
              <option value={n} key={n}>
                {n} min
              </option>
            ))}
          </select>
        </label>
        <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
          <span>Strefa czasowa</span>
          <select
            className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            disabled={busy || closed}
            value={input.timezone}
            onChange={(ev) => update("timezone", ev.target.value)}
          >
            {Array.from(
              new Set([
                e.timezone,
                "Europe/Warsaw",
                "Europe/London",
                "Europe/Berlin",
                "America/New_York",
                "America/Los_Angeles",
                "Asia/Tokyo",
                "Australia/Sydney",
                "UTC",
              ]),
            ).map((zone) => (
              <option key={zone}>{zone}</option>
            ))}
          </select>
        </label>
        {input.timezone !== e.timezone && (
          <p className="m-0 leading-relaxed text-muted in-[.edit-meeting-form]:mb-4.5 in-[.edit-meeting-form]:rounded-[7px] in-[.edit-meeting-form]:border in-[.edit-meeting-form]:border-solid in-[.edit-meeting-form]:border-[#8f7e4d49] in-[.edit-meeting-form]:bg-[#b69c5a10] in-[.edit-meeting-form]:p-3 in-[.edit-meeting-form]:text-sm in-[.edit-meeting-form]:leading-relaxed in-[.edit-meeting-form]:text-[#c3b391]">
            Zaznaczenia zachowają swój rzeczywisty czas, więc lokalne godziny
            mogą się zmienić.
          </p>
        )}
        {impact && (
          <div className="mx-0 my-5.5 rounded-lg border border-solid border-[#444052] bg-[#111724] p-4 [&_h3]:mb-3.25 [&_h3]:text-sm [&_h3]:text-[#c4b6d6] [&>p]:flex [&>p]:items-start [&>p]:gap-2 [&>p]:text-sm [&>p]:leading-relaxed [&>p]:text-[#baa77f] [&>p>svg]:mt-0.5 [&>p>svg]:shrink-0">
            <h3 className="m-0 font-semibold tracking-tight">
              Wpływ zmian na dostępność
            </h3>
            {impact.removedSlots > 0 ? (
              <>
                <p className="m-0 leading-relaxed text-muted">
                  <TriangleAlert
                    className="shrink-0"
                    size={16}
                    aria-hidden="true"
                  />{" "}
                  Poza nowym zakresem znajdzie się {impact.removedSlots}{" "}
                  zaznaczeń od {impact.affectedParticipants} uczestników.
                </p>
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-[#c7b9ad] max-[720px]:text-sm [&_input]:mt-0.75 [&_input]:size-3.75 [&_input]:min-h-3.75 [&_input]:shrink-0 [&_input]:p-0 [&_input]:accent-[#b19cfc]">
                  <input
                    className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                    type="checkbox"
                    checked={allowTrim}
                    disabled={busy}
                    onChange={(ev) => setAllowTrim(ev.target.checked)}
                  />
                  <span>
                    Zgadzam się na usunięcie wszystkich zaznaczeń spoza nowego
                    zakresu.
                  </span>
                </label>
              </>
            ) : (
              <p className="m-0 leading-relaxed text-muted">
                <Check className="shrink-0" size={15} aria-hidden="true" />{" "}
                Dotychczasowa dostępność mieści się w nowym zakresie.
              </p>
            )}
            {impact.confirmationReset && (
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-[#c7b9ad] max-[720px]:text-sm [&_input]:mt-0.75 [&_input]:size-3.75 [&_input]:min-h-3.75 [&_input]:shrink-0 [&_input]:p-0 [&_input]:accent-[#b19cfc]">
                <input
                  className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                  type="checkbox"
                  checked={allowReset}
                  disabled={busy}
                  onChange={(ev) => setAllowReset(ev.target.checked)}
                />
                <span>
                  Rozumiem, że zmiana kalendarza cofnie zatwierdzony termin.
                  Wybiorę go ponownie po zapisaniu.
                </span>
              </label>
            )}
          </div>
        )}
        {error && (
          <div
            className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
            role="alert"
          >
            {error}
            <p className="m-0 leading-relaxed text-muted">
              Zamknij formularz i odśwież spotkanie, jeśli inne okno zmieniło
              jego ustawienia.
            </p>
          </div>
        )}
        <div className="mt-6.25 flex flex-wrap justify-end gap-2.5 max-[720px]:[&_.button]:px-3.25 max-[720px]:[&_.button]:py-2.5 max-[720px]:[&_.button]:text-sm [&>.button]:text-sm">
          <button
            type="button"
            className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
            disabled={busy}
            onClick={onClose}
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="button primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
            disabled={
              busy ||
              !impact ||
              (impact.removedSlots > 0 && !allowTrim) ||
              (impact.confirmationReset && !allowReset) ||
              (closed && scheduleChanged(e, input))
            }
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
            Zapisz zmiany
          </button>
        </div>
      </form>
    </Dialog>
  );
}
