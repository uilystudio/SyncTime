"use client";
import { useId } from "react";
import { CircleHelp, MapPin, Video } from "lucide-react";
import type { MeetingMode, MeetingPlaceInput } from "@/lib/types";

export function MeetingPlaceFields({
  value,
  onChange,
  errors = {},
  disabled = false,
}: {
  value: MeetingPlaceInput;
  onChange: (place: Required<MeetingPlaceInput>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}) {
  const id = useId();
  const mode = value.meeting_mode ?? "undecided";
  return (
    <fieldset disabled={disabled} className="mb-6 min-w-0 border-0 p-0">
      <legend className="mb-3 text-base font-medium text-foreground">
        Gdzie się spotykamy?
      </legend>
      <div className="mb-4 grid grid-cols-3 gap-2 max-[380px]:grid-cols-1">
        {(
          [
            ["undecided", "Do ustalenia", CircleHelp],
            ["online", "Online", Video],
            ["in_person", "Stacjonarnie", MapPin],
          ] as const
        ).map(([key, label, Icon]) => (
          <label key={key} className="relative cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name={`meeting-mode-${id}`}
              value={key}
              checked={mode === key}
              onChange={() =>
                onChange({
                  meeting_mode: key as MeetingMode,
                  meeting_location: "",
                })
              }
            />
            <span className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background/40 px-2 py-3 text-center text-sm text-muted transition-colors peer-checked:border-primary/70 peer-checked:bg-primary/10 peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50 motion-reduce:transition-none">
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              {label}
            </span>
          </label>
        ))}
      </div>
      {errors.meeting_mode && (
        <p role="alert" className="mb-3 text-sm text-red-300">
          {errors.meeting_mode}
        </p>
      )}
      {mode !== "undecided" && (
        <label className="flex flex-col gap-2 text-sm text-foreground">
          <span id={`${id}-label`}>
            {mode === "online" ? "Link do spotkania" : "Miejsce lub adres"}
          </span>
          <input
            className="min-h-12 w-full rounded-lg border border-border bg-background px-3 py-3 text-base text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-invalid:border-red-300"
            name="meeting_location"
            aria-labelledby={`${id}-label`}
            type={mode === "online" ? "url" : "text"}
            required
            maxLength={500}
            placeholder={
              mode === "online"
                ? "https://meet.google.com/..."
                : "np. sala 203, ul. Akademicka 5, Warszawa"
            }
            value={value.meeting_location ?? ""}
            onChange={(e) =>
              onChange({ meeting_mode: mode, meeting_location: e.target.value })
            }
            aria-invalid={Boolean(errors.meeting_location)}
            aria-describedby={`${id}-help${errors.meeting_location ? ` ${id}-error` : ""}`}
          />
          <span id={`${id}-help`} className="text-sm text-muted">
            {mode === "online"
              ? "Pełny link http:// lub https://. Uczestnicy otworzą go w szczegółach spotkania."
              : "Podaj adres, nazwę budynku lub numer sali. Uczestnicy zobaczą te informacje przy spotkaniu."}
          </span>
          {errors.meeting_location && (
            <span
              role="alert"
              id={`${id}-error`}
              className="text-sm text-red-300"
            >
              {errors.meeting_location}
            </span>
          )}
        </label>
      )}
    </fieldset>
  );
}
