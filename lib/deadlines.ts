import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
export function deadlineInstant(value: string, timezone: string, now = new Date()) {
  const instant = fromZonedTime(value, timezone);
  if (!value || !Number.isFinite(instant.getTime()) || formatInTimeZone(instant, timezone, "yyyy-MM-dd'T'HH:mm") !== value) throw new Error("Wybierz poprawną datę i godzinę. Ta godzina może nie istnieć z powodu zmiany czasu.");
  if (instant.getTime() <= now.getTime()) throw new Error("Termin odpowiedzi musi być w przyszłości.");
  return instant.toISOString();
}
