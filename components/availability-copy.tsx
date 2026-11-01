"use client";
import { useMemo, useState } from "react";
import { Copy, Save } from "lucide-react";
import {
  applyWeeklyPattern,
  copyDayAvailability,
  makeWeeklyPattern,
  parseWeeklyPattern,
  type WeeklySlot,
} from "@/lib/availability-copy";
import { dayLabel, eventDays } from "@/lib/time";
import { ensureSession, errorMessage, getSupabase } from "@/lib/supabase";
import type { MeetingEvent, TimeSlot } from "@/lib/types";
import { useProfile } from "./profile-context";
import { ActionButton, ActionError, SelectField } from "./collaboration-ui";
import { Dialog } from "./ui";

export function AvailabilityCopy({
  event,
  slots,
  own,
  preferred,
  onChange,
  disabled,
}: {
  event: MeetingEvent;
  slots: TimeSlot[];
  own: Set<string>;
  preferred: Set<string>;
  onChange: (next: Set<string>, preferred?: Set<string>) => void;
  disabled: boolean;
}) {
  const profile = useProfile();
  const days = useMemo(
    () => eventDays(event.start_date, event.end_date),
    [event.start_date, event.end_date],
  );
  const [source, setSource] = useState(days[0]);
  const [targets, setTargets] = useState<Set<string>>(new Set());
  const [replace, setReplace] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [patternToApply, setApply] = useState<WeeklySlot[] | null>(null);
  const apply = patternToApply
    ? applyWeeklyPattern(slots, own, preferred, patternToApply, replace)
    : null;
  const [weekStart, setWeekStart] = useState(days[0]);
  const lastDay = new Date(`${weekStart}T12:00:00Z`);
  lastDay.setUTCDate(lastDay.getUTCDate() + 6);
  const weekEnd = lastDay.toISOString().slice(0, 10);
  const result = copyDayAvailability(
    slots,
    own,
    preferred,
    source,
    [...targets],
    replace,
  );
  const savePattern = makeWeeklyPattern(
    slots,
    own,
    preferred,
    weekStart,
    weekEnd,
  );
  async function saveWeek() {
    if (!profile) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await ensureSession();
      const { error } = await getSupabase()
        .from("availability_templates")
        .upsert({
          user_id: profile.user_id,
          pattern: savePattern,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      setMessage(
        "Zapisano typowy tydzień na Twoim koncie. Możesz go użyć w kolejnych spotkaniach.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function loadWeek() {
    if (!profile) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await ensureSession();
      const { data, error } = await getSupabase()
        .from("availability_templates")
        .select("pattern")
        .eq("user_id", profile.user_id)
        .maybeSingle();
      if (error) throw error;
      const pattern = parseWeeklyPattern(data?.pattern);
      if (!pattern.length) {
        setMessage("Nie masz jeszcze zapisanego typowego tygodnia.");
        return;
      }
      const next = applyWeeklyPattern(slots, own, preferred, pattern, replace);
      if (!next.matched) {
        setMessage(
          "Zapisane godziny nie mieszczą się w zakresie tego spotkania.",
        );
        return;
      }
      setApply(pattern);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border-t border-[#303346] bg-[#151928] p-4">
      <ActionButton
        disabled={disabled}
        onClick={() => {
          setError("");
          setMessage("");
          setOpen(true);
        }}
      >
        <Copy aria-hidden="true" className="size-4" />
        Kopiuj dostępność
      </ActionButton>
      {open && (
        <Dialog
          title="Kopiowanie dostępności"
          onClose={() => {
            if (!busy) {
              setOpen(false);
              setApply(null);
            }
          }}
        >
          <p className="mb-4 text-base leading-relaxed text-muted">
            Kopiujesz własne godziny i preferencje w strefie {event.timezone}.
            Nieistniejące godziny przy zmianie czasu pomijamy; powtórzone
            godziny dopasowujemy według ich kolejności.
          </p>
          <fieldset disabled={disabled || busy} className="space-y-4">
            <legend className="sr-only">Ustawienia kopiowania</legend>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Dzień źródłowy
              <SelectField
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setApply(null);
                }}
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {dayLabel(day, "EEEE, d MMM")}
                  </option>
                ))}
              </SelectField>
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Dni docelowe</legend>
              <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                {days
                  .filter((day) => day !== source)
                  .map((day) => (
                    <label
                      key={day}
                      className="flex min-h-11 items-center gap-2 rounded-lg border border-[#303646] px-3 py-2 text-sm"
                    >
                      <input
                        className="size-4 accent-[#b19cfc]"
                        type="checkbox"
                        checked={targets.has(day)}
                        onChange={(e) => {
                          const next = new Set(targets);
                          if (e.target.checked) next.add(day);
                          else next.delete(day);
                          setTargets(next);
                          setApply(null);
                        }}
                      />
                      {dayLabel(day, "EEE, d MMM")}
                    </label>
                  ))}
              </div>
            </fieldset>
            <ActionButton
              onClick={() => {
                setTargets(new Set(days.filter((day) => day !== source)));
                setApply(null);
              }}
            >
              Zaznacz wszystkie pozostałe dni
            </ActionButton>
            <label className="flex items-start gap-2 text-sm leading-relaxed">
              <input
                className="mt-1 size-4 shrink-0 accent-[#b19cfc]"
                type="checkbox"
                checked={replace}
                onChange={(e) => {
                  setReplace(e.target.checked);
                  setApply(null);
                }}
              />
              Zastąp dotychczasowe zaznaczenia w dniach docelowych. Domyślnie
              nowe godziny są dodawane.
            </label>
            <p className="text-sm leading-relaxed text-muted">
              Dopasowano {result.matched} półgodzinnych pól w wybranych dniach.
            </p>
            <ActionButton
              primary
              disabled={
                !result.matched || ![...targets].some((day) => day !== source)
              }
              onClick={() => {
                onChange(result.own, result.preferred);
                setOpen(false);
              }}
            >
              Zastosuj kopię dnia
            </ActionButton>
            {profile && (
              <div className="space-y-3 border-t border-[#303346] pt-4">
                <h3 className="text-base font-semibold tracking-tight">
                  Typowy tydzień
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Zapisz zaznaczenia z maksymalnie 7 dni. W kolejnych
                  spotkaniach dopasujemy je według dnia tygodnia i lokalnej
                  godziny. Zapis zastępuje poprzedni szablon.
                </p>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Początek zapisywanego tygodnia
                  <SelectField
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {dayLabel(day, "EEE, d MMM")}
                      </option>
                    ))}
                  </SelectField>
                </label>
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    disabled={!savePattern.length}
                    onClick={() => void saveWeek()}
                  >
                    <Save aria-hidden="true" className="size-4" />
                    Zapisz typowy tydzień
                  </ActionButton>
                  <ActionButton onClick={() => void loadWeek()}>
                    Wczytaj typowy tydzień
                  </ActionButton>
                </div>
              </div>
            )}
          </fieldset>
          {apply && (
            <div className="mt-4 rounded-lg border border-[#776398] p-3">
              <p className="text-sm leading-relaxed">
                Dopasowano {apply.matched} półgodzinnych pól.{" "}
                {replace
                  ? "Zastąpisz wszystkie swoje godziny w tym spotkaniu."
                  : "Dodasz je do swoich godzin."}
              </p>
              <ActionButton
                className="mt-3"
                primary
                disabled={disabled || busy}
                onClick={() => {
                  onChange(apply.own, apply.preferred);
                  setApply(null);
                  setOpen(false);
                }}
              >
                Zastosuj typowy tydzień
              </ActionButton>
            </div>
          )}
          <ActionError>{error}</ActionError>
          {message && (
            <p
              role="status"
              className="mt-3 text-sm leading-relaxed text-[#bfb1dc]"
            >
              {message}
            </p>
          )}
        </Dialog>
      )}
    </div>
  );
}
