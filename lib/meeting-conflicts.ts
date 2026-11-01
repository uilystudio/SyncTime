import type { MeetingSummary } from "./meetings";


export function findMeetingConflicts(start: string, end: string, events: MeetingSummary[], currentEventId: string, userId: string): MeetingSummary[] {
  const first = Date.parse(start), last = Date.parse(end);
  if (!userId || !Number.isFinite(first) || !Number.isFinite(last) || last <= first) return [];
  return events.filter(event => {
    const own = event.participants.find(person => person.user_id === userId);
    if (event.id === currentEventId || !event.selected_start || !own || own.attendance_status === "no") return false;
    const eventStart = Date.parse(event.selected_start), eventEnd = eventStart + event.meeting_duration_minutes * 60000;
    return Number.isFinite(eventStart) && Number.isFinite(eventEnd) && eventEnd > eventStart && first < eventEnd && eventStart < last;
  }).sort((a,b) => Date.parse(a.selected_start!) - Date.parse(b.selected_start!) || a.id.localeCompare(b.id));
}
