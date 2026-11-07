/**
 * scheduleGaps.ts — Pure schedule gap computation utilities.
 * No React, no Firebase, no network calls.
 */

/**
 * Computes the gap bar label for the gap between two adjacent schedule day numbers.
 * 
 * Rules:
 * - from = prevDay + 1, to = nextDay - 1, count = to - from + 1
 * - if count <= 0: return null (no bar)
 * - if count === 1: "गॅप दिवस {from} (1 दिवस गॅप)" / "Gap day {from} (1-day gap)"
 * - else: "गॅप दिवस {from} ते {to} ({count} दिवस गॅप)" / "Gap days {from} to {to} ({count}-day gap)"
 */
export interface GapBar {
  from: number;
  to: number;
  count: number;
  marathiText: string;
  englishText: string;
}

export function computeGap(prevDay: number, nextDay: number): GapBar | null {
  const from = prevDay + 1;
  const to = nextDay - 1;
  const count = to - from + 1;
  if (count <= 0) return null;
  
  const marathiText = count === 1
    ? `गॅप दिवस ${from} (1 दिवस गॅप)`
    : `गॅप दिवस ${from} ते ${to} (${count} दिवस गॅप)`;
  const englishText = count === 1
    ? `Gap day ${from} (1-day gap)`
    : `Gap days ${from} to ${to} (${count}-day gap)`;
  
  return { from, to, count, marathiText, englishText };
}

export type SheetRowType = 'entry' | 'gap';

export interface EntryRow {
  type: 'entry';
  day: number;
  date: string; // ISO YYYY-MM-DD or raw string
  schedules: any[]; // the grouped schedule items for this day
}

export interface GapRow {
  type: 'gap';
  gap: GapBar;
}

export type SheetRow = EntryRow | GapRow;

/**
 * Builds an ordered array of rows (entries + gap bars) from a list of schedules.
 * Deduplicates days, sorts by day number, inserts gap bars.
 * Input schedules may be in any order, may have duplicates.
 */
export function buildSheetRows(schedules: any[]): SheetRow[] {
  if (!schedules || schedules.length === 0) return [];
  
  // Group by day number
  const dayMap = new Map<number, { day: number; date: string; schedules: any[] }>();
  for (const s of schedules) {
    const dayNum = parseInt(s.day, 10);
    if (isNaN(dayNum)) continue;
    if (!dayMap.has(dayNum)) {
      dayMap.set(dayNum, { day: dayNum, date: s.scheduleDate || '', schedules: [] });
    }
    dayMap.get(dayNum)!.schedules.push(s);
  }
  
  // Sort days ascending
  const sortedDays = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
  
  const rows: SheetRow[] = [];
  for (let i = 0; i < sortedDays.length; i++) {
    const entry = sortedDays[i];
    rows.push({
      type: 'entry',
      day: entry.day,
      date: entry.date,
      schedules: entry.schedules,
    });
    
    if (i < sortedDays.length - 1) {
      const gap = computeGap(entry.day, sortedDays[i + 1].day);
      if (gap) {
        rows.push({ type: 'gap', gap });
      }
    }
  }
  
  return rows;
}
