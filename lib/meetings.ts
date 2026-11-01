import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { AttendanceStatus, MeetingEvent } from "./types";
import { collectionClosed } from "./responses";

export interface MeetingSummary extends MeetingEvent {
  participants: { id: string; user_id: string; display_name: string; response_status?: "pending" | "available" | "unavailable"; attendance_status?: AttendanceStatus }[];
}
export const meetingViews = {
  all: { title: "Wszystkie spotkania", description: "Twoje plany i Twoja ekipa. Wszystko w jednym miejscu." },
  organized: { title: "Organizowane przeze mnie", description: "Spotkania, w których nadajesz rytm i wybierasz wspólny termin." },
  joined: { title: "Dołączone spotkania", description: "Plany, do których zaprosiła Cię Twoja ekipa." },
  confirmed: { title: "Zatwierdzone terminy", description: "Wszystko ustalone. Teraz wystarczy się spotkać." },
  past: { title: "Zakończone spotkania", description: "Poprzednie plany, do których możesz wrócić w każdej chwili." },
} as const;
export type MeetingView = keyof typeof meetingViews;
export type MeetingStatus = "planning" | "confirmed" | "past" | "closed";
export type MeetingSort = "soonest" | "newest" | "name";
export function isMeetingView(value: string): value is MeetingView { return Object.prototype.hasOwnProperty.call(meetingViews, value); }
export function meetingStatus(event: MeetingEvent, now: Date): MeetingStatus {
  if (event.selected_start) return Date.parse(event.selected_start) + event.meeting_duration_minutes * 60000 <= now.getTime() ? "past" : "confirmed";
  const localNow = formatInTimeZone(now, event.timezone, "yyyy-MM-dd'T'HH:mm:ss");
  return localNow >= `${event.end_date}T${event.day_end_time.slice(0, 5)}:00` ? "past" : collectionClosed(event, now) ? "closed" : "planning";
}
export function meetingStart(event: MeetingEvent) {
  return event.selected_start ? Date.parse(event.selected_start) : fromZonedTime(`${event.start_date}T${event.day_start_time.slice(0,5)}:00`, event.timezone).getTime();
}
export function filterMeetings(events: MeetingSummary[], options: { view: MeetingView; userId: string; query?: string; status?: "all" | MeetingStatus; sort?: MeetingSort; now: Date }) {
  const { view, userId, now, status = "all", sort = "soonest" } = options;
  const query = (options.query ?? "").trim().toLocaleLowerCase("pl");
  return events.filter(event => {
    const state = meetingStatus(event, now);
    if (view === "organized" && event.creator_id !== userId) return false;
    if (view === "joined" && event.creator_id === userId) return false;
    if (view === "confirmed" && state !== "confirmed") return false;
    if (view === "past" && state !== "past") return false;
    if (status !== "all" && state !== status) return false;
    return !query || `${event.title} ${event.description} ${event.participants.map(p => p.display_name).join(" ")}`.toLocaleLowerCase("pl").includes(query);
  }).sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title, "pl");
    if (sort === "newest") return Date.parse(b.created_at) - Date.parse(a.created_at);
    const aPast = meetingStatus(a, now) === "past";
    const bPast = meetingStatus(b, now) === "past";
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast ? meetingStart(b) - meetingStart(a) : meetingStart(a) - meetingStart(b);
  });
}
