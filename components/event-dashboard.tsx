"use client";
import Link from "next/link";
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  Circle,
  Copy,
  Globe2,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEvent } from "@/hooks/use-event";
import { collectionClosed } from "@/lib/responses";
import { ParticipantResponses } from "./participant-responses";
import { ResponseControls } from "./response-controls";
import { SuggestionDetails } from "./suggestion-details";
import { recommendTimes } from "@/lib/recommendations";
import { confirmMeeting } from "@/lib/api";
import { dayLabel, localTime, timeRange } from "@/lib/time";
import { errorMessage } from "@/lib/supabase";
import type { TimeSuggestion } from "@/lib/types";
import { AvailabilityGrid } from "./availability-grid";
import { Dialog, Panel, Toast } from "./ui";
import { MeetingStartGuide } from "./meeting-start-guide";
import { OrganizerActions } from "./organizer-actions";
import { useMeetings } from "./meetings-provider";
import { MeetingPlace } from "./meeting-place";
import { MeetingComments } from "./meeting-comments";
import { Attendance } from "./attendance";
import { MeetingAgenda } from "./meeting-agenda";
import { MeetingInvitationControls } from "./meeting-invitation-controls";
import { InlineSeparator } from "./inline-separator";
import { MeetingConflicts } from "./meeting-conflicts";

export function EventDashboard({
  id,
  userId,
  welcome,
}: {
  id: string;
  userId: string;
  welcome?: "created" | "joined";
}) {
  const {
    snapshot,
    own,
    preferred,
    change,
    status,
    error,
    retry,
    refresh,
    participant,
    realtimeStatus,
    conflict,
    discardDraft,
  } = useEvent(id, userId);
  const { refresh: refreshList, now } = useMeetings();
  const [toast, setToast] = useState("");
  const [responseBusy, setResponseBusy] = useState(false);
  const [details, setDetails] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirm, setConfirm] = useState<TimeSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const dismiss = useCallback(() => setToast(""), []);
  const onMeetingChanged = useCallback(
    async (message: string) => {
      await refresh();
      await refreshList();
      setToast(message);
    },
    [refresh, refreshList],
  );
  const suggestions = useMemo(
    () =>
      snapshot
        ? recommendTimes(snapshot.event, snapshot.participants, snapshot.slots)
        : [],
    [snapshot],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/e/${snapshot?.invitation}`,
      );
      setToast("Link skopiowany. Zaproś swoją ekipę!");
    } catch {
      setShare(true);
      setActionError("Skopiuj link ręcznie z pola poniżej.");
    }
  }
  async function choose(start: string | null) {
    setBusy(true);
    setActionError("");
    try {
      await confirmMeeting(id, start);
      await refresh();
      await refreshList();
      setConfirm(null);
      setToast(
        start
          ? "Termin zatwierdzony. Do zobaczenia!"
          : "Ponownie otwarto wybór terminu.",
      );
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (!snapshot)
    return (
      <main className="m-auto max-w-400 px-[3.5%] pt-6.25 pb-12.5 in-[.workspace]:max-w-none in-[.workspace]:px-6.5 in-[.workspace]:pt-7 in-[.workspace]:pb-11.25 max-[1200px]:px-[2%] max-[1200px]:pt-6.25 max-[1200px]:pb-10 max-[720px]:px-[4%] max-[720px]:pt-5.5 max-[720px]:pb-8.75 max-[580px]:in-[.workspace]:px-3.75 max-[580px]:in-[.workspace]:pt-5.5 max-[580px]:in-[.workspace]:pb-8.75">
        <div
          className="mt-8.75 rounded-[13px] border border-solid border-border bg-surface p-7.5"
          role="status"
          aria-label="Wczytywanie kalendarza"
        >
          <div className="mb-5 h-8.75 w-[75%] animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.short]:h-5 [&.short]:w-[45%] [&.tall]:h-67.5 [&.tall]:w-full" />
          <div className="tall mb-5 h-67.5 w-full animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.short]:h-5 [&.short]:w-[45%]" />
          {error && (
            <div
              className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
              role="alert"
            >
              {error}
              <button
                className="cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                onClick={retry}
              >
                Spróbuj ponownie
              </button>
            </div>
          )}
        </div>
      </main>
    );
  const { event, participants } = snapshot;
  const organizer = event.creator_id === userId;
  const closed = collectionClosed(event, now);
  const timeLabel = (s: TimeSuggestion) =>
    timeRange(s.start, s.end, event.timezone);
  return (
    <main className="m-auto max-w-400 px-[3.5%] pt-6.25 pb-12.5 in-[.workspace]:max-w-none in-[.workspace]:px-6.5 in-[.workspace]:pt-7 in-[.workspace]:pb-11.25 max-[1200px]:px-[2%] max-[1200px]:pt-6.25 max-[1200px]:pb-10 max-[720px]:px-[4%] max-[720px]:pt-5.5 max-[720px]:pb-8.75 max-[580px]:in-[.workspace]:px-3.75 max-[580px]:in-[.workspace]:pt-5.5 max-[580px]:in-[.workspace]:pb-8.75">
      <div className="flex items-center gap-3.25 text-sm text-[#a7b0c3] [&_a]:flex [&_a]:items-center [&_a]:gap-1.75 [&>span:last-child]:text-[#d4d9e5]">
        <Link
          className="text-inherit no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
          href="/meetings"
        >
          <ArrowLeft className="shrink-0" size={15} aria-hidden="true" /> Moje
          planowanie
        </Link>
        <span>/</span>
        <span>Spotkanie</span>
      </div>
      <Panel className="mx-0 mt-8 mb-7.25 flex items-center justify-between gap-6.25 max-[720px]:mx-0 max-[720px]:mt-6.75 max-[720px]:mb-5.75 max-[720px]:block [&_h1]:mx-0 [&_h1]:mt-3.25 [&_h1]:mb-2.25 [&_h1]:text-3xl [&_h1]:leading-[1.3] [&_h1]:tracking-tight [&_h1]:wrap-anywhere max-[1000px]:[&_h1]:text-3xl max-[720px]:[&_h1]:mt-3.25 max-[720px]:[&_h1]:text-3xl [&_p]:max-w-162.5 [&_p]:text-sm [&_p]:whitespace-pre-line [&>.button]:shrink-0 [&>.button]:text-sm max-[720px]:[&>.button]:mt-5 max-[720px]:[&>.button]:min-h-9.75 max-[720px]:[&>.button]:px-3.25 max-[720px]:[&>.button]:py-2.25 max-[720px]:[&>.button]:text-sm [.workspace_&_h1]:text-3xl">
        <div>
          <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
            <Circle
              aria-hidden="true"
              className="status-dot inline-block size-1.5 shrink-0 fill-success text-success"
            />
            {event.selected_start
              ? "TERMIN WYBRANY"
              : closed
                ? "ZBIERANIE ZAMKNIĘTE"
                : "SZUKAMY WSPÓLNEGO CZASU"}
          </span>
          <h1 className="m-0 font-semibold tracking-tight">{event.title}</h1>
          <p className="m-0 leading-relaxed text-muted">
            {event.description ||
              "Dobre spotkania zaczynają się od wspólnego terminu."}
          </p>
        </div>
        <button
          className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
          onClick={() => setShare(true)}
        >
          <Share2 className="shrink-0" size={17} aria-hidden="true" />{" "}
          {closed ? "Link do spotkania" : "Zaproś uczestników"}
        </button>
      </Panel>
      {!closed && (
        <MeetingStartGuide
          welcome={welcome}
          organizer={organizer}
          hasSelection={own.size > 0}
          saving={status !== "saved"}
          onShare={() => setShare(true)}
          onCopy={() => void copy()}
        />
      )}
      {organizer && (
        <OrganizerActions
          snapshot={snapshot}
          disabled={status !== "saved" || responseBusy}
          onChanged={onMeetingChanged}
        />
      )}
      {organizer && (
        <MeetingInvitationControls
          snapshot={snapshot}
          disabled={status !== "saved" || responseBusy}
          onChanged={onMeetingChanged}
        />
      )}
      {closed && (
        <div className="mb-5.75 flex items-start gap-3.25 rounded-[10px] border border-solid border-[#545167] bg-[#24202f] px-5.25 py-4.5 max-[720px]:p-4 [&_p]:mt-1.5 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#9d91b0] [&_strong]:text-base [&_strong]:font-medium [&_strong]:text-[#d2c5e4] [&>svg]:mt-0.5 [&>svg]:shrink-0 [&>svg]:text-[#b3a4cd]">
          <LockKeyhole className="shrink-0" size={18} aria-hidden="true" />
          <div>
            <strong>Zbieranie dostępności zamknięte</strong>
            <p className="m-0 leading-relaxed text-muted">
              {organizer
                ? "Zaznaczenia są zabezpieczone przed zmianami. Możesz wybrać termin lub wznowić zbieranie."
                : "Możesz przeglądać godziny grupy i wyniki. Organizator może ponownie otworzyć zbieranie."}
            </p>
          </div>
        </div>
      )}
      {event.selected_start && (
        <div className="mb-5.5 flex items-center gap-3.75 rounded-[10px] border border-solid border-[#4e7854] bg-[#27402d] px-5.5 py-4.5 text-[#c7e8bd] max-[720px]:flex-wrap max-[720px]:gap-2.5 max-[720px]:p-4 [&_div>span]:text-sm [&_div>span]:text-[#abc0a6] max-[720px]:[&_div>span]:text-sm [&_strong]:text-base [&_strong]:font-medium max-[720px]:[&_strong]:text-sm [&>.button]:text-sm [&>div]:flex [&>div]:flex-1 [&>div]:flex-col [&>div]:gap-1.5">
          <CheckCheck className="shrink-0" size={23} aria-hidden="true" />
          <div>
            <strong>
              Widzimy się{" "}
              {localTime(event.selected_start, event.timezone, "EEEE, d MMMM")}{" "}
              o {localTime(event.selected_start, event.timezone)}!
            </strong>
            <span>
              {event.meeting_duration_minutes} minut <InlineSeparator />{" "}
              {event.timezone}
            </span>
          </div>
          {organizer && (
            <button
              className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              disabled={busy}
              onClick={() => void choose(null)}
            >
              Zmień termin
            </button>
          )}
        </div>
      )}
      <div id="attendance" className="scroll-mt-24">
        <Attendance
          key={`${event.id}:${event.confirmation_version ?? 0}`}
          snapshot={snapshot}
          userId={userId}
          onChanged={onMeetingChanged}
        />
      </div>
      {event.response_deadline && (
        <div
          className={`deadline-banner mx-0 mt-0 mb-5.5 flex items-start gap-3 rounded-[10px] border border-solid border-[#7f693746] bg-[#a8844110] px-4.75 py-4 text-[#ddc493] [&_span]:mt-1.25 [&_span]:block [&_span]:text-sm [&_span]:leading-relaxed [&_span]:text-[#b6a17e] [&_strong]:block [&_strong]:text-sm [&_strong]:font-medium ${closed ? "[.deadline-banner&]:border-[#484355] [.deadline-banner&]:bg-[#9990ab0c] [.deadline-banner&]:text-[#c9b8dc]" : ""}`}
          role="status"
        >
          <Clock3 className="shrink-0" size={17} aria-hidden="true" />
          <div>
            <strong>
              {Date.parse(event.response_deadline) <= now.getTime()
                ? "Termin odpowiedzi minął"
                : "Odpowiedzi do"}
              :{" "}
              {localTime(
                event.response_deadline,
                event.timezone,
                "d MMM yyyy, HH:mm",
              )}
            </strong>
            <span>
              {event.timezone} <InlineSeparator />{" "}
              {closed
                ? "Zbieranie odpowiedzi jest zamknięte."
                : "Po tym czasie odpowiedzi zostaną automatycznie zablokowane."}
            </span>
          </div>
        </div>
      )}
      {event.meeting_mode && event.meeting_mode !== "undecided" && (
        <div className="mb-5 rounded-xl border border-border bg-surface px-5 py-2">
          <MeetingPlace place={event} />
        </div>
      )}
      <div className="grid grid-cols-[250px_minmax(0,1fr)_300px] items-start gap-4.75 max-[1200px]:grid-cols-[230px_minmax(0,1fr)_280px] max-[1200px]:gap-3.25 max-[1000px]:grid-cols-[230px_minmax(0,1fr)] max-[720px]:flex max-[720px]:flex-col max-[720px]:gap-5 @max-[1150px]/workspace:in-[.workspace]:grid-cols-[220px_minmax(0,1fr)] @max-[1150px]/workspace:in-[.workspace]:gap-3.75 @max-[680px]/workspace:in-[.workspace]:flex @max-[680px]/workspace:in-[.workspace]:flex-col @max-[680px]/workspace:in-[.workspace]:gap-5">
        <aside className="flex flex-col gap-4.5 max-[720px]:contents @max-[680px]/workspace:in-[.workspace]:contents">
          <div className="rounded-[13px] border border-solid border-border bg-surface p-5.25 max-[1200px]:px-3.5 max-[1200px]:py-4.25 max-[720px]:order-0 max-[720px]:flex max-[720px]:w-full max-[720px]:flex-wrap max-[720px]:items-center max-[720px]:gap-4.25 max-[720px]:p-4.25 @max-[680px]/workspace:in-[.workspace]:order-0 @max-[680px]/workspace:in-[.workspace]:flex @max-[680px]/workspace:in-[.workspace]:w-full @max-[680px]/workspace:in-[.workspace]:flex-wrap @max-[680px]/workspace:in-[.workspace]:items-center @max-[680px]/workspace:in-[.workspace]:gap-4.25 @max-[680px]/workspace:in-[.workspace]:p-4.25 [&_h2]:text-base [&_h2]:tracking-tight max-[720px]:[&_h2]:hidden [&>.button]:mt-6 [&>.button]:p-2.25 [&>.button]:text-sm max-[720px]:[&>.button]:hidden @max-[680px]/workspace:[.workspace_&_h2]:hidden @max-[680px]/workspace:[.workspace_&>.button]:hidden">
            <h2 className="m-0 font-semibold tracking-tight">
              Szczegóły spotkania
            </h2>
            <div className="mt-5.5 flex items-start gap-2.75 max-[720px]:m-0 max-[720px]:min-w-27.5 max-[720px]:flex-1 max-[720px]:gap-1.75 @max-[680px]/workspace:in-[.workspace]:m-0 @max-[680px]/workspace:in-[.workspace]:min-w-27.5 @max-[680px]/workspace:in-[.workspace]:flex-1 [&_span]:text-sm [&_span]:text-[#929eb4] max-[720px]:[&_span]:text-sm [&_strong]:text-sm [&_strong]:font-normal [&_strong]:wrap-anywhere max-[720px]:[&_strong]:text-sm [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:gap-1.25 [&>svg]:mt-0.5 [&>svg]:size-4.25 [&>svg]:shrink-0 [&>svg]:text-[#929eb4] max-[720px]:[&>svg]:size-4">
              <CalendarDays className="shrink-0" aria-hidden="true" />
              <div>
                <span>Zakres dat</span>
                <strong>
                  {dayLabel(event.start_date, "d MMM")} -{" "}
                  {dayLabel(event.end_date, "d MMM yyyy")}
                </strong>
              </div>
            </div>
            <div className="mt-5.5 flex items-start gap-2.75 max-[720px]:m-0 max-[720px]:min-w-27.5 max-[720px]:flex-1 max-[720px]:gap-1.75 @max-[680px]/workspace:in-[.workspace]:m-0 @max-[680px]/workspace:in-[.workspace]:min-w-27.5 @max-[680px]/workspace:in-[.workspace]:flex-1 [&_span]:text-sm [&_span]:text-[#929eb4] max-[720px]:[&_span]:text-sm [&_strong]:text-sm [&_strong]:font-normal [&_strong]:wrap-anywhere max-[720px]:[&_strong]:text-sm [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:gap-1.25 [&>svg]:mt-0.5 [&>svg]:size-4.25 [&>svg]:shrink-0 [&>svg]:text-[#929eb4] max-[720px]:[&>svg]:size-4">
              <Clock3 className="shrink-0" aria-hidden="true" />
              <div>
                <span>Czas trwania</span>
                <strong>{event.meeting_duration_minutes} minut</strong>
              </div>
            </div>
            <div className="mt-5.5 flex items-start gap-2.75 max-[720px]:m-0 max-[720px]:min-w-27.5 max-[720px]:flex-1 max-[720px]:gap-1.75 @max-[680px]/workspace:in-[.workspace]:m-0 @max-[680px]/workspace:in-[.workspace]:min-w-27.5 @max-[680px]/workspace:in-[.workspace]:flex-1 [&_span]:text-sm [&_span]:text-[#929eb4] max-[720px]:[&_span]:text-sm [&_strong]:text-sm [&_strong]:font-normal [&_strong]:wrap-anywhere max-[720px]:[&_strong]:text-sm [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:gap-1.25 [&>svg]:mt-0.5 [&>svg]:size-4.25 [&>svg]:shrink-0 [&>svg]:text-[#929eb4] max-[720px]:[&>svg]:size-4">
              <Globe2 className="shrink-0" aria-hidden="true" />
              <div>
                <span>Strefa spotkania</span>
                <strong>{event.timezone}</strong>
              </div>
            </div>
            <button
              className="button secondary inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              onClick={() => void copy()}
            >
              <Link2 className="shrink-0" size={16} aria-hidden="true" /> Kopiuj
              link
            </button>
          </div>
          <ParticipantResponses
            snapshot={snapshot}
            userId={userId}
            disabled={status !== "saved" || busy || responseBusy}
            onChanged={onMeetingChanged}
          />
        </aside>
        <div className="calendar-area max-[720px]:order-1 max-[720px]:w-full max-[720px]:min-w-0 @max-[680px]/workspace:in-[.workspace]:order-1 @max-[680px]/workspace:in-[.workspace]:w-full @max-[680px]/workspace:in-[.workspace]:min-w-0">
          <ResponseControls
            snapshot={snapshot}
            participant={participant}
            disabled={status !== "saved" || conflict || busy}
            closed={closed}
            onChanged={onMeetingChanged}
            onBusyChange={setResponseBusy}
          />
          <AvailabilityGrid
            key={`${event.id}:${event.revision ?? 1}`}
            event={event}
            participants={participants}
            availability={snapshot.slots}
            own={own}
            preferred={preferred}
            onChange={change}
            disabled={!participant || closed || conflict || responseBusy}
          />
          <div className="mx-0.75 my-3.75 flex items-center justify-between gap-2.5 text-sm text-[#91a18e] in-[.calendar-area]:rounded-[7px] in-[.calendar-area]:border in-[.calendar-area]:border-solid in-[.calendar-area]:border-[#303d3a] in-[.calendar-area]:bg-[#131c1b] in-[.calendar-area]:px-3.5 in-[.calendar-area]:py-3 in-[.calendar-area]:text-sm max-[720px]:items-start max-[720px]:text-sm max-[720px]:in-[.calendar-area]:sticky max-[720px]:in-[.calendar-area]:bottom-2.5 max-[720px]:in-[.calendar-area]:z-3 max-[720px]:in-[.calendar-area]:gap-2.5 max-[720px]:in-[.calendar-area]:p-3 max-[720px]:in-[.calendar-area]:text-sm max-[720px]:in-[.calendar-area]:shadow-[0_4px_20px_#0005] [&>span]:flex [&>span]:items-center [&>span]:gap-1.5">
            <span
              role="status"
              className={status === "error" ? "text-[#f2a2a2]" : ""}
            >
              {status === "saving" ? (
                <LoaderCircle
                  size={14}
                  className="shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : status === "error" ? (
                <X className="shrink-0" size={14} aria-hidden="true" />
              ) : (
                <CheckCheck className="shrink-0" size={15} aria-hidden="true" />
              )}
              {status === "saving"
                ? "Zapisujemy zmiany…"
                : status === "error"
                  ? "Nie zapisano zmian"
                  : "Wszystkie zmiany zapisane"}
            </span>
            <button
              className="text-button flex cursor-pointer items-center gap-1.25 border-0 border-solid border-current bg-transparent p-1 text-sm text-[#9ca8bf] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#cfbdf7] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none max-[720px]:max-w-33.75 max-[720px]:justify-end max-[720px]:p-0 max-[720px]:text-right max-[720px]:text-sm"
              onClick={() => setClearing(true)}
              disabled={
                !own.size ||
                status === "saving" ||
                closed ||
                conflict ||
                responseBusy
              }
            >
              <Trash2 className="shrink-0" size={16} aria-hidden="true" />{" "}
              Wyczyść moje zaznaczenia
            </button>
          </div>
          {error && (
            <div
              className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
              role="alert"
            >
              {error}
              <button
                className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                onClick={conflict ? discardDraft : retry}
              >
                {conflict
                  ? "Odrzuć niezapisane zmiany i wczytaj kalendarz"
                  : "Ponów"}
              </button>
            </div>
          )}
        </div>
        <aside className="max-[1000px]:col-2 max-[1000px]:grid max-[1000px]:grid-cols-[1fr] max-[1000px]:gap-3.75 max-[720px]:order-2 max-[720px]:block max-[720px]:w-full @max-[1150px]/workspace:in-[.workspace]:col-2 @max-[1150px]/workspace:in-[.workspace]:block @max-[680px]/workspace:in-[.workspace]:order-2 @max-[680px]/workspace:in-[.workspace]:block @max-[680px]/workspace:in-[.workspace]:w-full">
          <div className="recommendations-card overflow-hidden rounded-[13px] border border-solid border-border bg-surface px-4.75 py-5.5 max-[1200px]:px-3.25 max-[1200px]:py-5 max-[1000px]:p-5.5 max-[720px]:px-5 max-[720px]:py-5.75 max-[1000px]:[&>div:last-child]:grid max-[1000px]:[&>div:last-child]:grid-cols-[1fr_1fr] max-[1000px]:[&>div:last-child]:gap-5 max-[720px]:[&>div:last-child]:block @max-[1150px]/workspace:[.workspace_&>div:last-child]:grid @max-[1150px]/workspace:[.workspace_&>div:last-child]:grid-cols-[1fr_1fr] @max-[1150px]/workspace:[.workspace_&>div:last-child]:gap-5.5 @max-[680px]/workspace:[.workspace_&>div:last-child]:block">
            <div className="flex items-center justify-between gap-2 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-1.75 [&_h2]:text-base [&_h2]:tracking-tight [&_h2>svg]:text-primary">
              <h2 className="m-0 font-semibold tracking-tight">
                <Sparkles className="shrink-0" size={17} aria-hidden="true" />{" "}
                Najlepsze terminy
              </h2>
            </div>
            <p className="mx-0 mt-2.25 mb-0 text-sm leading-relaxed text-muted">
              Uwzględniamy pełne {event.meeting_duration_minutes} minut i
              obecność wymaganych osób. Przy remisie decydują preferencje.
            </p>
            <AnimatePresence mode="wait">
              {suggestions.length ? (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mt-5 rounded-[9px] border border-solid border-[#55644e] bg-[#19281f] px-3.75 py-4.25 max-[1000px]:mt-4.5 max-[720px]:p-5.25 [&_h3]:mt-4.25 [&_h3]:text-2xl [&_h3]:tracking-tight [&_h3]:capitalize max-[720px]:[&_h3]:text-3xl [&>.button]:mt-5.25 [&>.button]:min-h-9.25 [&>.button]:bg-[#bedca8] [&>.button]:p-2 [&>.button]:text-sm [&>.button]:text-[#1b2c15] max-[720px]:[&>.button]:min-h-10.5 max-[720px]:[&>.button]:text-sm [&>.button:hover]:bg-[#d0e9be]">
                    <div className="flex items-center gap-1.5 text-sm font-semibold tracking-wider text-[#b6dfad] max-[720px]:text-sm [&_.status-dot]:size-1">
                      <Circle
                        aria-hidden="true"
                        className="status-dot inline-block size-1.5 shrink-0 fill-success text-success"
                      />
                      {suggestions[0].percentage === 100
                        ? "WSZYSCY MOGĄ"
                        : "NAJLEPSZE DOPASOWANIE"}
                    </div>
                    <h3 className="m-0 font-semibold tracking-tight">
                      {localTime(suggestions[0].start, event.timezone, "EEEE")}
                    </h3>
                    <span className="mt-1.25 block text-sm text-[#a7c2ab]">
                      {localTime(
                        suggestions[0].start,
                        event.timezone,
                        "d MMMM yyyy",
                      )}
                    </span>
                    <strong className="mt-3 block text-2xl font-normal tracking-tight max-[1200px]:text-2xl max-[720px]:text-3xl">
                      {timeLabel(suggestions[0])}
                    </strong>
                    <div className="mt-5.25 h-1 overflow-hidden rounded-[5px] bg-[#324436]">
                      <i
                        className="w-(--attendance)"
                        style={
                          {
                            "--attendance": `${suggestions[0].percentage}%`,
                          } as CSSProperties
                        }
                      />
                    </div>
                    <div className="mt-2.25 flex items-center justify-between text-sm text-[#b1c6b0] max-[720px]:text-sm [&_strong]:text-sm [&_strong]:text-[#c1e4b8] [&>span]:flex [&>span]:items-center [&>span]:gap-1.25">
                      <span>
                        <Users
                          className="shrink-0"
                          size={14}
                          aria-hidden="true"
                        />{" "}
                        {suggestions[0].count} z {participants.length} osób
                      </span>
                      <strong>{suggestions[0].percentage}%</strong>
                    </div>
                    {suggestions[0].preferredCount > 0 && (
                      <div className="mt-3.25 flex items-center gap-1.5 rounded-[5px] border border-solid border-[#aa8b493b] bg-[#bf9a510d] px-2.25 py-2 text-sm text-[#dfc594]">
                        <Star
                          className="shrink-0"
                          size={16}
                          aria-hidden="true"
                        />{" "}
                        Preferuje cały termin: {suggestions[0].preferredCount}
                      </div>
                    )}
                    <button
                      className="button secondary mx-0 mt-3.5 mb-2.25 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
                      onClick={() => setDetails(suggestions[0].start)}
                    >
                      Kto może? Porównaj
                    </button>
                    <MeetingConflicts
                      compact
                      start={suggestions[0].start}
                      end={suggestions[0].end}
                      eventId={event.id}
                    />
                    {organizer && (
                      <button
                        className="button primary inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
                        disabled={busy || responseBusy || status !== "saved"}
                        onClick={() => setConfirm(suggestions[0])}
                      >
                        <Check
                          className="shrink-0"
                          size={16}
                          aria-hidden="true"
                        />{" "}
                        Zatwierdź termin
                      </button>
                    )}
                  </div>
                  {suggestions.length > 1 && (
                    <div className="mt-6.25 max-[1000px]:mt-5.5 max-[720px]:mt-5.75 [&>h3]:mb-1 [&>h3]:text-sm [&>h3]:tracking-wider [&>h3]:text-[#8e9bb2]">
                      <h3 className="m-0 font-semibold tracking-tight">
                        INNE PROPOZYCJE
                      </h3>
                      {suggestions.slice(1).map((s) => (
                        <div
                          className="flex flex-wrap items-center gap-2 border-b [border-bottom-style:solid] border-b-border px-0 py-3.75 last:border-b-0 last:[border-bottom-style:solid] last:border-b-current last:pb-0 [&_div>span]:text-sm [&_div>span]:text-[#94a2b9] max-[720px]:[&_div>span]:text-sm [&_strong]:text-sm [&_strong]:font-normal max-[720px]:[&_strong]:text-sm [&>div]:flex [&>div]:flex-1 [&>div]:flex-col [&>div]:gap-1.25"
                          key={s.start}
                        >
                          <div>
                            <strong>
                              {localTime(s.start, event.timezone, "EEE, d MMM")}
                            </strong>
                            <span>{timeLabel(s)}</span>
                            <MeetingConflicts
                              compact
                              start={s.start}
                              end={s.end}
                              eventId={event.id}
                            />
                          </div>
                          <span className="rounded-sm border border-solid border-[#5e75443b] bg-[#93b96110] px-1.5 py-1 text-sm text-[#b2c7a9] [&>small]:mt-1 [&>small]:block [&>small]:text-sm [&>small]:text-[#cdb17d]">
                            {s.count}/{participants.length}
                            {s.preferredCount > 0 && (
                              <small className="text-sm">
                                <Star
                                  aria-hidden="true"
                                  className="mr-1 inline size-3.5 shrink-0"
                                />
                                <span className="sr-only">Preferuje: </span>
                                {s.preferredCount}
                              </small>
                            )}
                          </span>
                          <button
                            className="text-button flex cursor-pointer items-center gap-1.25 border-0 border-solid border-current bg-transparent p-1 text-sm text-[#9ca8bf] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#cfbdf7] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none max-[720px]:max-w-33.75 max-[720px]:justify-end max-[720px]:p-0 max-[720px]:text-right max-[720px]:text-sm"
                            aria-label={`Porównaj ${localTime(s.start, event.timezone, "d MMM HH:mm")}`}
                            onClick={() => setDetails(s.start)}
                          >
                            Porównaj
                          </button>
                          {organizer && (
                            <button
                              className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                              aria-label={`Zatwierdź ${localTime(s.start, event.timezone, "d MMM HH:mm")}`}
                              disabled={status !== "saved" || responseBusy}
                              onClick={() => setConfirm(s)}
                            >
                              <Check
                                className="shrink-0"
                                size={16}
                                aria-hidden="true"
                              />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="px-0 pt-7.5 pb-3.75 text-center max-[1000px]:block! @max-[1150px]/workspace:in-[.workspace]:block! [&_.large-icon]:mx-auto [&_.large-icon]:mt-0 [&_.large-icon]:mb-4.25 [&_h3]:text-base [&_p]:mt-2.5 [&_p]:text-sm [&_p]:leading-relaxed max-[720px]:[.recommendations-card>div&]:block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="large-icon mb-6.5 grid size-13.75 place-items-center rounded-[15px] border border-solid border-[#9e86ef30] bg-[#9e86ef12] text-[#b5a1ef]">
                    <CalendarDays
                      className="shrink-0"
                      size={25}
                      aria-hidden="true"
                    />
                  </span>
                  <h3 className="m-0 font-semibold tracking-tight">
                    {participants.some((p) => p.is_required)
                      ? "Brak terminu dla wymaganych osób"
                      : closed
                        ? "Brak wystarczającej dostępności"
                        : "Czas na pierwszy ruch"}
                  </h3>
                  <p className="m-0 leading-relaxed text-muted">
                    {participants.some((p) => p.is_required)
                      ? "Wymagane osoby muszą zaznaczyć dostępność przez cały czas spotkania. Sprawdź ich odpowiedzi po lewej stronie."
                      : closed
                        ? "Zebrane godziny nie obejmują całego spotkania. Organizator może wznowić zbieranie lub zmienić jego długość po wznowieniu."
                        : `Zaznacz co najmniej ${event.meeting_duration_minutes / 30} sąsiadujące pola w jednym dniu. Tutaj pojawią się najlepsze propozycje.`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative mt-4.25 rounded-[10px] border border-dashed border-[#343a4c] bg-[#171924] p-5 max-[1000px]:hidden @max-[1150px]/workspace:in-[.workspace]:hidden [&_p]:mt-2.25 [&_p]:max-w-43.75 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#98a2b7] [&>span]:text-sm [&>span]:tracking-wider [&>span]:text-[#b7a6e7] [&>svg]:absolute [&>svg]:right-4 [&>svg]:bottom-4.25 [&>svg]:text-[#7a699d]">
            <span>MAŁA PODPOWIEDŹ</span>
            <p className="m-0 leading-relaxed text-muted">
              Im więcej dostępnych godzin zaznaczysz, tym łatwiej znajdziecie
              wspólny termin.
            </p>
            <Sparkles className="shrink-0" size={19} aria-hidden="true" />
          </div>
        </aside>
      </div>
      <div id="meeting-agenda" className="scroll-mt-24">
        <MeetingAgenda
          key={`${event.id}:${event.agenda_enabled}`}
          snapshot={snapshot}
          userId={userId}
          disabled={status !== "saved" || responseBusy}
          onChanged={onMeetingChanged}
        />
      </div>
      <div id="meeting-comments" className="scroll-mt-24" />
      <MeetingComments
        key={event.id}
        meetingId={event.id}
        userId={userId}
        organizerId={event.creator_id}
        timezone={event.timezone}
      />
      <div className="mt-7.25 flex items-center justify-center gap-1.75 text-sm text-[#8e9bb0] max-[720px]:mt-6.25 max-[720px]:flex-wrap max-[720px]:text-sm [&>.status-dot]:size-1.25 [&>span:last-child]:text-[#7e8b9e]">
        <Circle
          aria-hidden="true"
          className="status-dot inline-block size-1.5 shrink-0 fill-success text-success"
        />{" "}
        {realtimeStatus === "live"
          ? "Aktualizacje na żywo"
          : realtimeStatus === "connecting"
            ? "Łączenie aktualizacji…"
            : "Odświeżanie co 12 sekund"}{" "}
        <span>
          <InlineSeparator /> Bezpieczny zapis w Supabase
        </span>
      </div>
      {share && (
        <Dialog
          title="Zaproś swoją ekipę"
          onClose={() => {
            setShare(false);
            setActionError("");
          }}
        >
          <p className="m-0 leading-relaxed text-muted">
            Każda osoba z tym linkiem może dołączyć do spotkania i zaznaczyć
            własną dostępność.
          </p>
          <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
            <span>Link zaproszenia</span>
            <input
              className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
              readOnly
              value={
                typeof window !== "undefined"
                  ? `${window.location.origin}/e/${snapshot?.invitation}`
                  : ""
              }
              onFocus={(e) => e.target.select()}
            />
          </label>
          <button
            className="button primary inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
            onClick={() => void copy()}
          >
            <Copy className="shrink-0" size={16} aria-hidden="true" /> Kopiuj
            link
          </button>
          {actionError && (
            <p className="m-0 leading-relaxed text-muted" role="alert">
              {actionError}
            </p>
          )}
        </Dialog>
      )}
      {clearing && (
        <Dialog
          title="Wyczyścić Twoją dostępność?"
          onClose={() => setClearing(false)}
        >
          <p className="m-0 leading-relaxed text-muted">
            Usuniemy wszystkie Twoje zaznaczenia w tym spotkaniu. Możesz od razu
            zaznaczyć nowe godziny. Twój status wróci do „Nie odpowiedział”.
            Jeśli żaden termin Ci nie pasuje, wybierz osobny przycisk
            odpowiedzi.
          </p>
          <div className="mt-6.25 flex flex-wrap justify-end gap-2.5 max-[720px]:[&_.button]:px-3.25 max-[720px]:[&_.button]:py-2.5 max-[720px]:[&_.button]:text-sm [&>.button]:text-sm">
            <button
              className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              onClick={() => setClearing(false)}
            >
              Anuluj
            </button>
            <button
              className="button danger inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#c16b76] bg-[#ab515c] px-4.5 py-3 leading-5 font-medium text-white transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              onClick={() => {
                change(new Set());
                setClearing(false);
              }}
            >
              Wyczyść zaznaczenia
            </button>
          </div>
        </Dialog>
      )}
      {confirm && (
        <Dialog
          title="To Wasz wspólny czas?"
          onClose={() => {
            if (!busy) {
              setConfirm(null);
              setActionError("");
            }
          }}
        >
          <p className="m-0 leading-relaxed text-muted">
            Wybrany termin będzie widoczny dla wszystkich uczestników.
          </p>
          <MeetingConflicts
            start={confirm.start}
            end={confirm.end}
            eventId={event.id}
          />
          <div className="flex items-center gap-3.25 rounded-[9px] border border-solid border-[#aa8ded35] bg-[#aa8ded0d] p-4.75 text-[#cdb8ff] [&_span]:text-sm [&_span]:text-[#a9a1be] [&_strong]:text-base [&_strong]:font-medium [&_strong]:capitalize [&>div]:flex [&>div]:flex-col [&>div]:gap-1.5">
            <CalendarDays className="shrink-0" size={22} aria-hidden="true" />
            <div>
              <strong>
                {localTime(confirm.start, event.timezone, "EEEE, d MMMM yyyy")}
              </strong>
              <span>
                {timeLabel(confirm)} <InlineSeparator /> {confirm.count}/
                {participants.length} osób
              </span>
            </div>
          </div>
          {actionError && (
            <div
              className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
              role="alert"
            >
              {actionError}
            </div>
          )}
          <div className="mt-6.25 flex flex-wrap justify-end gap-2.5 max-[720px]:[&_.button]:px-3.25 max-[720px]:[&_.button]:py-2.5 max-[720px]:[&_.button]:text-sm [&>.button]:text-sm">
            <button
              className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Jeszcze nie
            </button>
            <button
              className="button primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              disabled={busy}
              onClick={() => void choose(confirm.start)}
            >
              {busy ? (
                <LoaderCircle
                  size={16}
                  className="shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <Check className="shrink-0" size={16} aria-hidden="true" />
              )}{" "}
              Zatwierdź
            </button>
          </div>
        </Dialog>
      )}
      {actionError && !confirm && !share && (
        <div
          className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
          role="alert"
        >
          {actionError}
        </div>
      )}
      {details && (
        <SuggestionDetails
          snapshot={snapshot}
          start={details}
          onClose={() => setDetails(null)}
          disabled={busy || responseBusy || status !== "saved"}
          onConfirm={
            organizer
              ? () => {
                  const chosen = recommendTimes(
                    event,
                    participants,
                    snapshot.slots,
                    1500,
                  ).find((s) => s.start === details);
                  if (chosen) {
                    setConfirm(chosen);
                    setDetails(null);
                  }
                }
              : undefined
          }
        />
      )}
      <Toast message={toast} onClose={dismiss} />
    </main>
  );
}
