import { downloadFile } from "./fileDownload";

export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
}

/**
 * Validates and converts date input to YYYY-MM-DD format using integer parts.
 * Returns empty string if invalid.
 */
export function toDateKey(v: any): string {
  if (!v || typeof v !== "string") return "";
  const trimmed = v.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/[-/]/);
  if (parts.length < 3) return "";

  let y: number, m: number, d: number;
  if (parts[0].length === 4) {
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else {
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    y = parseInt(parts[2], 10);
  }

  if (isNaN(y) || isNaN(m) || isNaN(d) || y <= 0 || m < 1 || m > 12 || d < 1 || d > 31) {
    return "";
  }

  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  const yyyy = String(y).padStart(4, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates next calendar day key (YYYY-MM-DD) for exclusive all-day event end dates.
 */
export function getNextDayKey(dateKey: string): string {
  const parts = dateKey.split("-");
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const next = new Date(y, m - 1, d + 1);
  const nextY = String(next.getFullYear()).padStart(4, "0");
  const nextM = String(next.getMonth() + 1).padStart(2, "0");
  const nextD = String(next.getDate()).padStart(2, "0");
  return `${nextY}-${nextM}-${nextD}`;
}

/**
 * Converts YYYY-MM-DD to YYYYMMDD
 */
export function toCompactDate(dateKey: string): string {
  return dateKey.replace(/-/g, "");
}

/**
 * Escapes TEXT properties per RFC 5545 section 3.3.11:
 * backslash -> \\
 * semicolon -> \;
 * comma -> \,
 * newline -> \n
 */
export function escapeIcsText(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Folds a line to <= 75 octets (UTF-8 bytes) per RFC 5545 section 3.1.
 * Continuation lines begin with a single space.
 */
export function foldLine(line: string, maxBytes: number = 75): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= maxBytes) {
    return line;
  }

  // Iterate graphemes / code points so multi-byte UTF-8 or combined glyphs are not broken
  let segments: string[];
  if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter("mr", { granularity: "grapheme" });
    segments = Array.from(segmenter.segment(line), (s: any) => s.segment);
  } else {
    segments = Array.from(line);
  }

  let result = "";
  let currentLine = "";
  let currentBytes = 0;

  for (const seg of segments) {
    const segBytes = encoder.encode(seg).length;
    if (currentBytes + segBytes > maxBytes) {
      result += (result ? "\r\n " : "") + currentLine;
      currentLine = seg;
      currentBytes = 1 + segBytes; // 1 byte for the leading space on continuation lines
    } else {
      currentLine += seg;
      currentBytes += segBytes;
    }
  }

  if (currentLine) {
    result += (result ? "\r\n " : "") + currentLine;
  }

  return result;
}

/**
 * Generates an all-day Google Calendar web link.
 * URL format:
 * https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=YYYYMMDD/YYYYMMDD&details=...
 */
export function googleCalendarUrl(event: CalendarEvent): string {
  const startCompact = toCompactDate(event.date);
  const endCompact = toCompactDate(getNextDayKey(event.date));
  const dates = `${startCompact}/${endCompact}`;

  const textEncoded = encodeURIComponent(event.title);
  const datesEncoded = encodeURIComponent(dates);
  const detailsEncoded = encodeURIComponent(event.description || "");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${textEncoded}&dates=${datesEncoded}&details=${detailsEncoded}`;
}

/**
 * Generates an iCalendar (RFC 5545) VCALENDAR string with CRLF line endings.
 */
export function buildIcs(events: CalendarEvent[]): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  const dtstamp = `${y}${m}${d}T${hh}${mm}${ss}Z`;

  const vcalLines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VIONEX//Smart Farming//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    const startCompact = toCompactDate(event.date);
    const endCompact = toCompactDate(getNextDayKey(event.date));
    const uid = event.id
      ? `schedule-${event.id}@vionex.smartfarming`
      : `schedule-${startCompact}-${Math.random().toString(36).substring(2, 9)}@vionex.smartfarming`;

    const eventLines: string[] = [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${startCompact}`,
      `DTEND;VALUE=DATE:${endCompact}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
    ];

    if (event.description) {
      eventLines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }

    eventLines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder",
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT"
    );

    for (const el of eventLines) {
      vcalLines.push(foldLine(el));
    }
  }

  vcalLines.push("END:VCALENDAR", "");

  return vcalLines.join("\r\n");
}

/**
 * Converts a schedule into a CalendarEvent.
 * Returns null if schedule does not have a valid scheduleDate.
 * NEVER includes farmer mobile number.
 */
export function scheduleToCalendarEvent(
  schedule: any,
  cropNameFallback?: string
): CalendarEvent | null {
  if (!schedule) return null;
  const dateKey = toDateKey(schedule.scheduleDate);
  if (!dateKey) return null;

  const crop = (schedule.cropName || cropNameFallback || "Crop").trim();
  const productNames = (schedule.selectedProducts || [])
    .map((p: any) => (p.brandName || p.marathiName || "").trim())
    .filter(Boolean)
    .join(", ");

  const title = `VIONEX: ${crop} - ${productNames || schedule.method || "Schedule"}`;

  const descLines: string[] = [];
  if (schedule.day !== undefined && schedule.day !== null && String(schedule.day).trim() !== "") {
    descLines.push(`Day: ${schedule.day}`);
  }
  if (schedule.method) {
    descLines.push(`Method: ${schedule.method}`);
  }
  if (schedule.selectedProducts && schedule.selectedProducts.length > 0) {
    descLines.push("Products:");
    schedule.selectedProducts.forEach((p: any) => {
      const name = p.brandName || p.marathiName || "Product";
      const rawDose = p.dose || p.doseSpray || p.doseDrip || p.doseBasal || "";
      descLines.push(`- ${name}${rawDose ? ` (${rawDose})` : ""}`);
    });
  }
  if (schedule.notes || schedule.advisory) {
    descLines.push(`Notes: ${schedule.notes || schedule.advisory}`);
  }

  // Double check: strictly NO farmer mobile or personal contact info included!
  const description = descLines.join("\n");

  return {
    id: schedule.id ? String(schedule.id) : undefined,
    title,
    description,
    date: dateKey,
  };
}

/**
 * Converts a list of schedules into CalendarEvents, skipping invalid dates.
 */
export function schedulesToCalendarEvents(
  schedules: any[],
  cropNameFallback?: string
): { events: CalendarEvent[]; skippedCount: number; totalCount: number } {
  const events: CalendarEvent[] = [];
  let skippedCount = 0;

  for (const s of schedules || []) {
    const ev = scheduleToCalendarEvent(s, cropNameFallback);
    if (ev) {
      events.push(ev);
    } else {
      skippedCount++;
    }
  }

  return {
    events,
    skippedCount,
    totalCount: (schedules || []).length,
  };
}

/**
 * Exports events to an .ics file using universal downloadFile (works on Web and Native Android).
 */
export async function downloadIcsFile(
  events: CalendarEvent[],
  fileName?: string,
  language?: "mr" | "en"
): Promise<boolean> {
  const isEn = language === "en";
  const icsData = buildIcs(events);
  const name =
    fileName ||
    `vionex-schedule-${new Date().toISOString().split("T")[0]}.ics`;

  return downloadFile({
    fileName: name,
    data: icsData,
    mimeType: "text/calendar;charset=utf-8",
    dialogTitle: isEn
      ? "Save / Share Calendar (.ics)"
      : "कॅलेंडर फाइल सेव्ह / शेअर करा (.ics)",
    language,
  });
}
