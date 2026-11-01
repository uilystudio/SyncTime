import { addDays, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { pl } from "date-fns/locale";
import type { MeetingEvent, TimeSlot } from "./types";

export const SLOT_MS = 30 * 60 * 1000;
export function eventDays(start: string, end: string): string[] {
  const days: string[] = [];
  for (let day = start; day <= end && days.length < 31; day = format(addDays(parseISO(day), 1), "yyyy-MM-dd")) days.push(day);
  return days;
}



export function buildSlots(event: Pick<MeetingEvent, "start_date" | "end_date" | "day_start_time" | "day_end_time" | "timezone">): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (const day of eventDays(event.start_date, event.end_date)) {
    const midnight = fromZonedTime(`${day}T00:00:00`, event.timezone).getTime();
    for (let time = midnight - 3 * 3600000; time < midnight + 28 * 3600000; time += SLOT_MS) {
      const date = new Date(time);
      if (formatInTimeZone(date, event.timezone, "yyyy-MM-dd") !== day) continue;
      const label = formatInTimeZone(date, event.timezone, "HH:mm");
      if (label < event.day_start_time.slice(0, 5) || label >= event.day_end_time.slice(0, 5)) continue;
      const end = new Date(time + SLOT_MS);
      const endLabel = formatInTimeZone(end, event.timezone, "HH:mm");
      if (formatInTimeZone(end, event.timezone, "yyyy-MM-dd") !== day || endLabel < event.day_start_time.slice(0, 5) || endLabel > event.day_end_time.slice(0, 5)) continue;
      slots.push({ start: date.toISOString(), day, label, offset: formatInTimeZone(date, event.timezone, "XXX") });
    }
  }
  return slots;
}

export function localTime(instant: string, timezone: string, pattern = "HH:mm") {
  return formatInTimeZone(instant, timezone, pattern, { locale: pl });
}
export function dayLabel(day: string, pattern = "EEE") { return format(parseISO(day), pattern, { locale: pl }); }
export function timeRange(start: string, end: string, timezone: string) {
  const a = localTime(start, timezone, "XXX");
  const b = localTime(end, timezone, "XXX");
  const showOffset = a !== b;
  return `${localTime(start, timezone)}${showOffset ? ` (${a})` : ""}-${localTime(end, timezone)}${showOffset ? ` (${b})` : ""}`;
}
