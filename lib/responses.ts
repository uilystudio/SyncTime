import type { AvailabilitySlot, MeetingEvent, Participant } from "./types";

export function collectionClosed(event: MeetingEvent, now = new Date()) {
  return Boolean(event.closed_at || (event.response_deadline && Date.parse(event.response_deadline) <= now.getTime()));
}
export function responseStatus(person: Pick<Participant, "id" | "response_status">, slots: AvailabilitySlot[] = []) {
  return person.response_status ?? (slots.some(s => s.participant_id === person.id) ? "available" : "pending");
}
export const responseLabels = { pending: "Nie odpowiedział", available: "Podał dostępność", unavailable: "Nie pasuje żaden termin" };
