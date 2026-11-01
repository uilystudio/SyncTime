import type { EventInput } from "./types";
import { validateMeetingPlace } from "./meeting-place";
export function validateEvent(input: EventInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.title.trim().length < 3 || input.title.trim().length > 100) errors.title = "Nazwa musi mieć od 3 do 100 znaków.";
  if (input.description.length > 1000) errors.description = "Opis może mieć do 1000 znaków.";
  if (!input.display_name.trim() || input.display_name.trim().length > 40) errors.display_name = "Wpisz nick (do 40 znaków).";
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const validDate = (d: string) => datePattern.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
  if (!validDate(input.start_date)) errors.start_date = "Wybierz poprawną datę.";
  if (!validDate(input.end_date) || input.end_date < input.start_date || (Date.parse(input.end_date) - Date.parse(input.start_date)) / 86400000 > 30) errors.end_date = "Wybierz od 1 do 31 kolejnych dni.";
  const validTime = /^(?:[01]\d|2[0-3]):(?:00|30)$/;
  const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  if (!validTime.test(input.day_start_time) || !validTime.test(input.day_end_time) || minutes(input.day_end_time) - minutes(input.day_start_time) < input.meeting_duration_minutes) errors.day_end_time = "Zakres godzin musi pomieścić całe spotkanie (kroki co 30 min).";
  if (![30, 60, 90, 120].includes(input.meeting_duration_minutes)) errors.meeting_duration_minutes = "Wybierz 30, 60, 90 lub 120 minut.";
  try { new Intl.DateTimeFormat("pl", { timeZone: input.timezone }).format(); } catch { errors.timezone = "Wybierz poprawną strefę IANA."; }
  return { ...errors, ...validateMeetingPlace(input) };
}
