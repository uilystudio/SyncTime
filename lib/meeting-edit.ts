import { buildSlots } from "./time";
import type { EventSnapshot, MeetingEditInput, MeetingEvent } from "./types";
export function scheduleChanged(previous: MeetingEvent, next: MeetingEditInput) {
  return previous.start_date !== next.start_date || previous.end_date !== next.end_date || previous.day_start_time.slice(0,5) !== next.day_start_time.slice(0,5) || previous.day_end_time.slice(0,5) !== next.day_end_time.slice(0,5) || previous.timezone !== next.timezone || previous.meeting_duration_minutes !== next.meeting_duration_minutes;
}
export function editImpact(snapshot: EventSnapshot, next: MeetingEditInput) {
  const valid = new Set(buildSlots(next).map(slot => slot.start));
  const removed = snapshot.slots.filter(slot => !valid.has(new Date(slot.slot_start).toISOString()));
  return { removedSlots: removed.length, affectedParticipants: new Set(removed.map(slot => slot.participant_id)).size, confirmationReset: Boolean(snapshot.event.selected_start && scheduleChanged(snapshot.event, next)) };
}
