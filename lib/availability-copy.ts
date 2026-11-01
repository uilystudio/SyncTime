import type { TimeSlot } from "./types";

export interface WeeklySlot { weekday: number; label: string; occurrence: number; preferred: boolean }
export function weekday(day: string) { return new Date(`${day}T12:00:00Z`).getUTCDay(); }
function indexedSlots(slots: TimeSlot[]) {
  const counts = new Map<string, number>();
  return slots.map(slot => {
    const key = `${slot.day}:${slot.label}`;
    const occurrence = counts.get(key) ?? 0;
    counts.set(key, occurrence + 1);
    return { ...slot, occurrence };
  });
}

export function copyDayAvailability(slots: TimeSlot[], own: Set<string>, preferred: Set<string>, source: string, targets: string[], replace = false) {
  const indexed = indexedSlots(slots);
  const sourceSlots = new Map(indexed.filter(slot => slot.day === source && own.has(slot.start)).map(slot => [`${slot.label}:${slot.occurrence}`, preferred.has(slot.start)]));
  const days = new Set(targets.filter(day => day !== source));
  const next = new Set(own), nextPreferred = new Set(preferred);
  let matched = 0;
  for (const slot of indexed) {
    if (!days.has(slot.day)) continue;
    if (replace) { next.delete(slot.start); nextPreferred.delete(slot.start); }
    const value = sourceSlots.get(`${slot.label}:${slot.occurrence}`);
    if (value === undefined) continue;
    matched++;
    next.add(slot.start);
    if (value) nextPreferred.add(slot.start); else if (replace) nextPreferred.delete(slot.start);
  }
  return { own: next, preferred: new Set([...nextPreferred].filter(instant => next.has(instant))), matched };
}
export function makeWeeklyPattern(slots: TimeSlot[], own: Set<string>, preferred: Set<string>, firstDay: string, lastDay: string): WeeklySlot[] {
  return indexedSlots(slots).filter(slot => slot.day >= firstDay && slot.day <= lastDay && own.has(slot.start)).map(slot => ({ weekday: weekday(slot.day), label: slot.label, occurrence: slot.occurrence, preferred: preferred.has(slot.start) }));
}
export function parseWeeklyPattern(value: unknown): WeeklySlot[] {
  if (!Array.isArray(value) || value.length > 350) return [];
  return value.filter((slot): slot is WeeklySlot => !!slot && Number.isInteger(slot.weekday) && slot.weekday >= 0 && slot.weekday <= 6 && /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(slot.label) && (slot.occurrence === 0 || slot.occurrence === 1) && typeof slot.preferred === "boolean");
}
export function applyWeeklyPattern(slots: TimeSlot[], own: Set<string>, preferred: Set<string>, pattern: WeeklySlot[], replace = false) {
  const keys = new Map(pattern.map(slot => [`${slot.weekday}:${slot.label}:${slot.occurrence}`, slot.preferred]));
  const next = replace ? new Set<string>() : new Set(own), nextPreferred = replace ? new Set<string>() : new Set(preferred);
  let matched = 0;
  for (const slot of indexedSlots(slots)) {
    const value = keys.get(`${weekday(slot.day)}:${slot.label}:${slot.occurrence}`);
    if (value === undefined) continue;
    matched++; next.add(slot.start); if (value) nextPreferred.add(slot.start);
  }
  return { own: next, preferred: new Set([...nextPreferred].filter(instant => next.has(instant))), matched };
}
