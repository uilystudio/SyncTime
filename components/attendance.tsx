"use client";
import { DisclosureSummary } from "./disclosure-summary";
import { useState } from "react";
import { Check, UserCheck, X } from "lucide-react";
import { setAttendance } from "@/lib/api";
import { errorMessage } from "@/lib/supabase";
import { localTime, timeRange } from "@/lib/time";
import type { AttendanceStatus, EventSnapshot } from "@/lib/types";
import { ActionButton, ActionError, SectionCard } from "./collaboration-ui";
import { InlineSeparator } from "./inline-separator";
import { MeetingConflicts } from "./meeting-conflicts";

const labels = { pending: "Brak deklaracji", yes: "Będę", no: "Nie będę" };
export function Attendance({
  snapshot,
  userId,
  onChanged,
}: {
  snapshot: EventSnapshot;
  userId: string;
  onChanged: (message: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { event, participants } = snapshot;
  const own = participants.find((p) => p.user_id === userId);
  if (!event.selected_start) return null;
  const start = event.selected_start;
  const end = new Date(
    Date.parse(start) + event.meeting_duration_minutes * 60000,
  ).toISOString();
  async function respond(value: AttendanceStatus) {
    setBusy(true);
    setError("");
    try {
      await setAttendance(event.id, value, event.confirmation_version ?? 0);
      await onChanged("Zapisano deklarację obecności.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <SectionCard
      title="Potwierdź obecność"
      description={`${localTime(start, event.timezone, "EEEE, d MMMM yyyy")}, ${timeRange(start, end, event.timezone)} (${event.timezone}). Zmiana terminu wymaga nowej deklaracji.`}
    >
      <MeetingConflicts start={start} end={end} eventId={event.id} />
      <div className="flex flex-wrap gap-2">
        <ActionButton
          primary={own?.attendance_status === "yes"}
          aria-pressed={own?.attendance_status === "yes"}
          disabled={busy}
          onClick={() => void respond("yes")}
        >
          <Check aria-hidden="true" className="size-4" />
          Będę
        </ActionButton>
        <ActionButton
          primary={own?.attendance_status === "no"}
          aria-pressed={own?.attendance_status === "no"}
          disabled={busy}
          onClick={() => void respond("no")}
        >
          <X aria-hidden="true" className="size-4" />
          Nie będę
        </ActionButton>
        {own?.attendance_status && own.attendance_status !== "pending" && (
          <ActionButton disabled={busy} onClick={() => void respond("pending")}>
            Cofnij deklarację
          </ActionButton>
        )}
      </div>
      <ActionError>{error}</ActionError>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <UserCheck aria-hidden="true" className="size-4 shrink-0" />
        {participants.filter((p) => p.attendance_status === "yes").length}{" "}
        będzie <InlineSeparator />{" "}
        {participants.filter((p) => p.attendance_status === "no").length} nie
        będzie <InlineSeparator />{" "}
        {
          participants.filter(
            (p) => !p.attendance_status || p.attendance_status === "pending",
          ).length
        }{" "}
        bez deklaracji
      </p>
      <details className="mt-3">
        <DisclosureSummary className="cursor-pointer py-2 text-sm font-medium text-[#cfbdff]">
          Deklaracje uczestników
        </DisclosureSummary>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#0e141f] p-3 text-sm"
            >
              <span className="wrap-anywhere">
                {p.display_name}
                {p.user_id === userId && " (Ty)"}
              </span>
              <span
                className={
                  p.attendance_status === "yes"
                    ? "text-[#8ed9bc]"
                    : "text-muted"
                }
              >
                {labels[p.attendance_status ?? "pending"]}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </SectionCard>
  );
}
