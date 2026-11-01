import { SLOT_MS } from "./time";
import { responseStatus } from "./responses";
import type { EventSnapshot } from "./types";
export function compareTerm(snapshot: EventSnapshot, start: string) {
  const window = Array.from({ length: snapshot.event.meeting_duration_minutes / 30 }, (_, i) => Date.parse(start) + i * SLOT_MS);
  const slots = new Map<string, Map<number, boolean>>();
  for (const slot of snapshot.slots) {
    if (!slots.has(slot.participant_id)) slots.set(slot.participant_id, new Map());
    slots.get(slot.participant_id)!.set(Date.parse(slot.slot_start), Boolean(slot.is_preferred));
  }
  return snapshot.participants.map(person => {
    const own = slots.get(person.id);
    const available = window.every(t => own?.has(t));
    const preferred = available && window.every(t => own?.get(t));
    return { person, state: preferred ? "preferred" as const : available ? "available" as const : responseStatus(person, snapshot.slots) === "pending" ? "pending" as const : "unavailable" as const };
  });
}
