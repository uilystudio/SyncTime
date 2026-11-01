import { SLOT_MS } from "./time";
import type { TimeSlot } from "./types";
export interface SelectedRange { day: string; start: string; end: string; instants: string[]; isPreferred: boolean }
export function selectedRanges(slots: TimeSlot[], selected: Set<string>, preferred: Set<string> = new Set()): SelectedRange[] {
  const ranges: SelectedRange[] = [];
  for (const slot of slots) {
    if (!selected.has(slot.start)) continue;
    const previous = ranges[ranges.length - 1];
    const end = new Date(Date.parse(slot.start) + SLOT_MS).toISOString();
    if (previous && previous.day === slot.day && previous.end === slot.start && previous.isPreferred === preferred.has(slot.start)) { previous.end = end; previous.instants.push(slot.start); }
    else ranges.push({ day: slot.day, start: slot.start, end, instants: [slot.start], isPreferred: preferred.has(slot.start) });
  }
  return ranges;
}
export function rangeInstants(slots: TimeSlot[], day: string, start: string, end: string): string[] {
  const first = Date.parse(start), last = Date.parse(end);
  if (!Number.isFinite(first) || !Number.isFinite(last) || last <= first || (last - first) % SLOT_MS !== 0) return [];
  const valid = new Set(slots.filter(slot => slot.day === day).map(slot => slot.start));
  const result: string[] = [];
  for (let current = first; current < last; current += SLOT_MS) {
    const key = new Date(current).toISOString();
    if (!valid.has(key)) return [];
    result.push(key);
  }
  return result;
}
