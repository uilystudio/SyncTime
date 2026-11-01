import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarCheck2,
  CircleCheck,
  LockKeyhole,
  Check,
  Clock3,
  Crown,
  Globe2,
  Users,
} from "lucide-react";
import { meetingStatus, type MeetingSummary } from "@/lib/meetings";
import { collectionClosed } from "@/lib/responses";
import { dayLabel, localTime } from "@/lib/time";
import { MeetingPlace } from "./meeting-place";
import { InlineSeparator } from "./inline-separator";

export function MeetingCard({
  meeting,
  userId,
  now,
}: {
  meeting: MeetingSummary;
  userId: string;
  now: Date;
}) {
  const state = meetingStatus(meeting, now);
  const StateIcon = {
    planning: Clock3,
    confirmed: CalendarCheck2,
    past: CircleCheck,
    closed: LockKeyhole,
  }[state];
  const organizer = meeting.creator_id === userId;
  const date = meeting.selected_start
    ? localTime(meeting.selected_start, meeting.timezone, "yyyy-MM-dd")
    : meeting.start_date;
  const stateLabel =
    state === "past"
      ? "Zakończone"
      : state === "confirmed"
        ? "Termin zatwierdzony"
        : state === "closed"
          ? "Zbieranie zamknięte"
          : "Ustalamy termin";
  return (
    <Link
      href={`/meeting/${meeting.id}`}
      data-state={state}
      className={`group/meeting meeting-tile flex min-h-72 min-w-0 flex-col rounded-[11px] border border-solid border-[#2b3342] bg-[#141a25] p-4.75 text-inherit no-underline transition-[border-color,transform,background,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-0.5 hover:border-[#74618e] hover:bg-[#191f2c] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary in-[.as-list]:grid in-[.as-list]:min-h-0 in-[.as-list]:grid-cols-[minmax(0,1fr)_auto] in-[.as-list]:gap-x-5 in-[.as-list]:px-5.25 in-[.as-list]:py-4.5 motion-reduce:transition-none max-[580px]:min-h-72 max-[580px]:p-5.25 max-[580px]:in-[.as-list]:flex max-[580px]:in-[.as-list]:gap-0 max-[580px]:in-[.as-list]:p-4.75 @max-[1150px]/workspace:p-4 [&_h3]:[display:-webkit-box] [&_h3]:overflow-hidden [&_h3]:text-lg [&_h3]:leading-normal [&_h3]:tracking-tight [&_h3]:wrap-anywhere [&_h3]:[-webkit-box-orient:vertical] [&_h3]:[-webkit-line-clamp:2] max-[580px]:[&_h3]:text-lg`}
    >
      <div className="meeting-tile-top mb-5.25 flex items-center justify-between gap-2 in-[.as-list]:col-1 in-[.as-list]:mb-3.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-[5px] border border-solid border-[#b8a27d30] bg-[#b8a27d09] px-1.75 py-1.25 text-sm text-[#cfb991] max-[580px]:text-sm [&.closed]:border-[#a88bc63b] [&.closed]:bg-[#a88bc614] [&.closed]:text-[#c2addd] [&.confirmed]:border-[#8fbb9d30] [&.confirmed]:bg-[#8fbb9d0c] [&.confirmed]:text-[#a8cdb1] [&.past]:border-[#75849a30] [&.past]:bg-[#75849a09] [&.past]:text-[#8e9bb1] ${state}`}
        >
          <StateIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {stateLabel}
        </span>
        <span className="text-[#737f97] [.as-list_.meeting-tile-top_&]:hidden [.meeting-tile:hover_&]:text-[#c4a8fb]">
          <ArrowUpRight className="shrink-0" size={18} aria-hidden="true" />
        </span>
      </div>
      <div className="mb-4.5 flex min-w-0 items-start gap-3 in-[.as-list]:row-[2/span_2] in-[.as-list]:mb-0 in-[.as-list]:items-center [&_p]:mt-1.5 [&_p]:[display:-webkit-box] [&_p]:overflow-hidden [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-ellipsis [&_p]:text-[#8693a9] [&_p]:[-webkit-box-orient:vertical] [&_p]:[-webkit-line-clamp:2] max-[580px]:[&_p]:text-sm [&>div]:min-w-0 [.as-list_&_p]:[-webkit-line-clamp:1]">
        <span className="flex min-h-12.5 w-11 shrink-0 flex-col items-center justify-center gap-0.75 rounded-lg border border-solid border-[#343047] bg-[#9d84d00a] text-[#c5b3e5] group-data-[state=confirmed]/meeting:border-[#35453d] group-data-[state=confirmed]/meeting:bg-[#85b99908] group-data-[state=confirmed]/meeting:text-[#a9c5ae] [&>small]:text-sm [&>small]:tracking-wider [&>small]:uppercase [&>strong]:text-xl [&>strong]:leading-[1.1] [&>strong]:font-medium">
          <strong>{dayLabel(date, "d")}</strong>
          <small className="text-sm">{dayLabel(date, "MMM")}</small>
        </span>
        <div>
          <h3 className="m-0 font-semibold tracking-tight">{meeting.title}</h3>
          <p className="m-0 leading-relaxed text-muted">
            {meeting.description ||
              (organizer
                ? "Zaproś ekipę i znajdźcie wspólny czas."
                : "Wspólny plan z Twoją ekipą.")}
          </p>
        </div>
      </div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2.75 text-sm text-[#a0adc1] in-[.as-list]:col-2 in-[.as-list]:row-2 in-[.as-list]:justify-end max-[580px]:text-sm max-[580px]:in-[.as-list]:mt-3.5 max-[580px]:in-[.as-list]:justify-start [&_svg]:text-[#7e8ca3] [&>span]:flex [&>span]:items-center [&>span]:gap-1.5">
        <span>
          <CalendarDays className="shrink-0" size={14} aria-hidden="true" />
          {meeting.selected_start
            ? localTime(
                meeting.selected_start,
                meeting.timezone,
                "EEE, d MMM, HH:mm",
              )
            : `${dayLabel(meeting.start_date, "d MMM")} - ${dayLabel(meeting.end_date, "d MMM")}`}
        </span>
        <span>
          <Clock3 className="shrink-0" size={14} aria-hidden="true" />
          {meeting.meeting_duration_minutes} min
        </span>
      </div>
      <div className="mb-4.5 flex items-center gap-1.5 text-sm text-[#77859c] in-[.as-list]:col-2 in-[.as-list]:row-3 in-[.as-list]:m-0 in-[.as-list]:justify-end max-[580px]:text-sm max-[580px]:in-[.as-list]:mb-3.75 max-[580px]:in-[.as-list]:justify-start">
        <Globe2 className="shrink-0" size={14} aria-hidden="true" />
        {meeting.timezone}
        {collectionClosed(meeting, now) && (
          <span>
            <InlineSeparator /> Zbieranie zamknięte
          </span>
        )}
      </div>
      <MeetingPlace place={meeting} interactive={false} />
      {meeting.response_deadline && !collectionClosed(meeting, now) && (
        <p className="mx-0 mt-2.75 mb-0 flex items-center gap-1.5 text-sm leading-relaxed text-[#c9b184]">
          <Clock3 className="shrink-0" size={14} aria-hidden="true" />{" "}
          Odpowiedzi do{" "}
          {localTime(
            meeting.response_deadline,
            meeting.timezone,
            "d MMM, HH:mm",
          )}
        </p>
      )}
      <p className="mx-0 my-3 text-sm leading-relaxed text-[#b1a2c4]">
        {
          meeting.participants.filter(
            (p) => p.response_status && p.response_status !== "pending",
          ).length
        }{" "}
        z {meeting.participants.length} osób odpowiedziało
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t [border-top-style:solid] border-t-[#2a3240] pt-3.25 in-[.as-list]:col-2 in-[.as-list]:row-1 in-[.as-list]:gap-3.75 in-[.as-list]:self-start in-[.as-list]:border-0 in-[.as-list]:border-solid in-[.as-list]:border-current in-[.as-list]:p-0 max-[580px]:pt-4 max-[580px]:in-[.as-list]:w-full max-[580px]:in-[.as-list]:border-t max-[580px]:in-[.as-list]:[border-top-style:solid] max-[580px]:in-[.as-list]:border-t-[#2a3240] max-[580px]:in-[.as-list]:pt-3.25">
        <div className="flex items-center gap-2 [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:text-sm [&>span]:text-[#8d9ab1] max-[580px]:[&>span]:text-sm">
          <div className="meeting-avatar-stack flex pl-1.25 [&>.avatar]:-ml-1.25 [&>.avatar]:size-8 [&>.avatar]:border-2 [&>.avatar]:border-solid [&>.avatar]:border-[#141a25] [&>.avatar]:text-sm">
            {meeting.participants.slice(0, 3).map((p, i) => (
              <span
                data-tone={i % 4}
                key={p.id}
                className={`avatar grid size-7.5 shrink-0 place-items-center rounded-full bg-[#a68ce025] text-sm font-medium text-[#c4a7ef] data-[tone=1]:bg-[#e9bb8120] data-[tone=1]:text-[#e6c396] data-[tone=2]:bg-[#8ed9bc20] data-[tone=2]:text-[#8ed9bc] data-[tone=3]:bg-[#91bbeb20] data-[tone=3]:text-[#91bbeb]`}
                title={p.display_name}
              >
                {p.display_name.slice(0, 2).toUpperCase()}
              </span>
            ))}
            {meeting.participants.length > 3 && (
              <span className="avatar grid size-7.5 shrink-0 place-items-center rounded-full bg-[#a68ce025] text-sm font-medium text-[#c4a7ef] in-[.meeting-avatar-stack]:bg-[#242c3e] in-[.meeting-avatar-stack]:text-[#a2b0c8] data-[tone=1]:bg-[#e9bb8120] data-[tone=1]:text-[#e6c396] data-[tone=2]:bg-[#8ed9bc20] data-[tone=2]:text-[#8ed9bc] data-[tone=3]:bg-[#91bbeb20] data-[tone=3]:text-[#91bbeb]">
                +{meeting.participants.length - 3}
              </span>
            )}
          </div>
          <span>
            <Users className="shrink-0" size={14} aria-hidden="true" />{" "}
            {meeting.participants.length}
          </span>
        </div>
        <span
          className={`meeting-role flex items-center gap-1 text-sm whitespace-nowrap text-[#8fa0b5] max-[580px]:text-sm [&.organizer]:text-[#b5a1dc] ${organizer ? "organizer" : ""}`}
        >
          {organizer ? (
            <Crown className="shrink-0" size={14} aria-hidden="true" />
          ) : (
            <Check className="shrink-0" size={14} aria-hidden="true" />
          )}
          {organizer ? "Organizujesz" : "Uczestniczysz"}
        </span>
      </div>
    </Link>
  );
}
