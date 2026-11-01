import type { MeetingPlaceInput } from "./types";

export function meetingUrl(value: string): string | null {
  if (!/^https?:\/\//i.test(value) || /[\s\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.hostname && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function validateMeetingPlace(input: MeetingPlaceInput): Record<string, string> {
  const mode = input.meeting_mode ?? "undecided";
  const location = (input.meeting_location ?? "").trim();
  if (!["undecided", "online", "in_person"].includes(mode)) return { meeting_mode: "Wybierz sposób spotkania." };
  if (mode === "undecided") return location ? { meeting_location: "Wybierz online lub stacjonarnie, aby dodać miejsce." } : {};
  if (location.length > 500) return { meeting_location: "Miejsce lub link może mieć do 500 znaków." };
  if (mode === "online" && !meetingUrl(location)) return { meeting_location: "Wpisz pełny link zaczynający się od https:// lub http://, bez danych logowania." };
  if (mode === "in_person" && location.length < 3) return { meeting_location: "Podaj miejsce lub adres (od 3 do 500 znaków)." };
  return {};
}
