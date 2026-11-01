"use client";
import Link from "next/link";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { findMeetingConflicts } from "@/lib/meeting-conflicts";
import { localTime, timeRange } from "@/lib/time";
import { useMeetings } from "./meetings-provider";
import { useProfile } from "./profile-context";
import { ActionButton } from "./collaboration-ui";

export function MeetingConflicts({
  start,
  end,
  eventId,
  compact = false,
}: {
  start: string;
  end: string;
  eventId: string;
  compact?: boolean;
}) {
  const { events, error, refresh } = useMeetings();
  const profile = useProfile();
  if (!events || error) {
    if (compact) return null;
    return (
      <div className="my-3 rounded-lg border border-[#454052] bg-[#1d1a2a] p-3 text-sm leading-relaxed text-muted">
        {error ? (
          <>
            <p>Nie udało się sprawdzić kolizji z Twoim kalendarzem.</p>
            <ActionButton className="mt-2" onClick={() => void refresh()}>
              Sprawdź ponownie
            </ActionButton>
          </>
        ) : (
          <p role="status" className="flex items-center gap-2">
            <LoaderCircle
              aria-hidden="true"
              className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
            />
            Sprawdzanie kolizji z Twoim kalendarzem...
          </p>
        )}
      </div>
    );
  }
  const conflicts = findMeetingConflicts(
    start,
    end,
    events,
    eventId,
    profile?.user_id ?? "",
  );
  if (!conflicts.length) return null;
  if (compact)
    return (
      <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#e6c08c]">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        Kolizje w Twoim kalendarzu: {conflicts.length}
      </span>
    );
  return (
    <section
      role="note"
      aria-label="Kolizja terminów"
      className="my-4 rounded-xl border border-[#92713c66] bg-[#a8844110] p-4"
    >
      <h3 className="flex items-start gap-2 text-base font-semibold tracking-tight text-[#e6c08c]">
        <TriangleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" />
        Ten termin nachodzi na inne Twoje spotkania
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#c5b49b]">
        Możesz wybrać go mimo kolizji. Te informacje widzisz tylko Ty. Pomijamy
        spotkania z Twoją deklaracją „Nie będę”.
      </p>
      <ul className="mt-3 space-y-3">
        {conflicts.map((meeting) => {
          const end = new Date(
            Date.parse(meeting.selected_start!) +
              meeting.meeting_duration_minutes * 60000,
          ).toISOString();
          return (
            <li key={meeting.id} className="text-sm">
              <Link
                href={`/meeting/${meeting.id}`}
                className="font-medium wrap-anywhere text-[#f0d2a8] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {meeting.title}
              </Link>
              <p className="mt-1 text-sm leading-relaxed text-[#b8a78f]">
                {localTime(
                  meeting.selected_start!,
                  meeting.timezone,
                  "d MMM yyyy",
                )}
                , {timeRange(meeting.selected_start!, end, meeting.timezone)} (
                {meeting.timezone})
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
