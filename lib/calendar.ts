import { addDays, addMonths, format, startOfMonth, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { eventDays } from "./time";
import type { MeetingSummary } from "./meetings";

export type CalendarMode = "month" | "week";

const parseDay = (day: string) => new Date(`${day}T12:00:00`);
export function calendarDays(anchor: string, mode: CalendarMode) {
  const date = parseDay(anchor);
  const start = startOfWeek(mode === "month" ? startOfMonth(date) : date, { weekStartsOn: 1 });
  return Array.from({ length: mode === "month" ? 42 : 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
}
export function moveCalendar(anchor: string, mode: CalendarMode, direction: number) {
  return format(mode === "month" ? addMonths(parseDay(anchor), direction) : addDays(parseDay(anchor), direction * 7), "yyyy-MM-dd");
}
export interface CalendarEntry { event: MeetingSummary; start: string; end: string; confirmed: boolean }
export function calendarEntries(events: MeetingSummary[], days: string[], timezone: string) {
  const result = new Map(days.map(day => [day, [] as CalendarEntry[]]));
  const intervals = events.flatMap(event => {
    if (event.selected_start) return [{ event, start: event.selected_start, end: new Date(Date.parse(event.selected_start) + event.meeting_duration_minutes * 60000).toISOString(), confirmed: true }];
    return eventDays(event.start_date, event.end_date).map(day => ({ event,
      start: fromZonedTime(`${day}T${event.day_start_time.slice(0, 5)}:00`, event.timezone).toISOString(),
      end: fromZonedTime(`${day}T${event.day_end_time.slice(0, 5)}:00`, event.timezone).toISOString(), confirmed: false }));
  });
  for (const day of days) {
    const start = fromZonedTime(`${day}T00:00:00`, timezone).getTime();
    const end = fromZonedTime(`${format(addDays(parseDay(day), 1), "yyyy-MM-dd")}T00:00:00`, timezone).getTime();
    const matches = intervals.filter(entry => Date.parse(entry.start) < end && Date.parse(entry.end) > start);
    const grouped = new Map<string, CalendarEntry>();
    for (const entry of matches) {
      const old = grouped.get(entry.event.id);
      grouped.set(entry.event.id, old ? { ...old, start: Date.parse(old.start) < Date.parse(entry.start) ? old.start : entry.start, end: Date.parse(old.end) > Date.parse(entry.end) ? old.end : entry.end } : entry);
    }
    result.set(day, [...grouped.values()].sort((a, b) => Number(b.confirmed) - Number(a.confirmed) || Date.parse(a.start) - Date.parse(b.start)));
  }
  return result;
}
export function calendarTime(entry: CalendarEntry, day: string, timezone: string) {
  const firstDay = formatInTimeZone(entry.start, timezone, "yyyy-MM-dd");
  const lastDay = formatInTimeZone(entry.end, timezone, "yyyy-MM-dd");
  const from = firstDay < day ? "00:00" : formatInTimeZone(entry.start, timezone, "HH:mm");
  const to = lastDay > day ? "24:00" : formatInTimeZone(entry.end, timezone, "HH:mm");
  return `${from}-${to}`;
}
