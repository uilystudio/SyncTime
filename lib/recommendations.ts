import { buildSlots, SLOT_MS } from "./time";
import type { AvailabilitySlot, MeetingEvent, Participant, TimeSuggestion } from "./types";

export function recommendTimes(event: MeetingEvent, participants: Participant[], availability: AvailabilitySlot[], limit = 5): TimeSuggestion[] {
  if (!participants.length || !availability.length) return [];
  const valid = buildSlots(event);
  const byDay = new Map<string, Set<number>>();
  for (const slot of valid) {
    if (!byDay.has(slot.day)) byDay.set(slot.day, new Set());
    byDay.get(slot.day)!.add(Date.parse(slot.start));
  }
  const byPerson = new Map(participants.map(p => [p.id, new Set<number>()]));
  const preferredByPerson = new Map(participants.map(p => [p.id, new Set<number>()]));
  for (const slot of availability) byPerson.get(slot.participant_id)?.add(Date.parse(slot.slot_start));
  for (const slot of availability) if (slot.is_preferred) preferredByPerson.get(slot.participant_id)?.add(Date.parse(slot.slot_start));
  const length = event.meeting_duration_minutes / 30;
  const suggestions: TimeSuggestion[] = [];
  for (const slot of valid) {
    const start = Date.parse(slot.start);
    const window = Array.from({ length }, (_, i) => start + i * SLOT_MS);
    if (!window.every(time => byDay.get(slot.day)!.has(time))) continue;
    const participantIds = participants.filter(p => window.every(time => byPerson.get(p.id)!.has(time))).map(p => p.id);
    if (!participantIds.length) continue;
    if (participants.some(p => p.is_required && !participantIds.includes(p.id))) continue;
    const preferredCount = participantIds.filter(id => window.every(time => preferredByPerson.get(id)!.has(time))).length;
    suggestions.push({ start: slot.start, end: new Date(start + length * SLOT_MS).toISOString(), participantIds, count: participantIds.length, percentage: Math.round(participantIds.length / participants.length * 100), preferredCount });
  }
  return suggestions.sort((a, b) => b.count - a.count || b.preferredCount - a.preferredCount || Date.parse(a.start) - Date.parse(b.start)).slice(0, limit);
}
