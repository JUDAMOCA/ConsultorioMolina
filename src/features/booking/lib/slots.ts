// Pure scheduling helpers shared by the booking server actions (slot
// generation) and the BookingFlow client island (date grid + display). No
// React, no Supabase, no directives — safe to import from either environment.

export function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minToTime(m: number): string {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

export interface BookedSlot {
  s: number;
  e: number;
}

/** Free start times in [start, end) that fit `duration` and don't overlap a booking. */
export function generateSlots(
  start: string,
  end: string,
  duration: number,
  bookedSlots: BookedSlot[],
): string[] {
  const startMin = timeToMin(start);
  const endMin = timeToMin(end);
  const slots: string[] = [];
  for (let t = startMin; t + duration <= endMin; t += duration) {
    const e = t + duration;
    const overlaps = bookedSlots.some((b) => t < b.e && e > b.s);
    if (!overlaps) slots.push(minToTime(t));
  }
  return slots;
}

/** True when [start, end) overlaps any booked slot. */
export function hasConflict(
  start: number,
  end: number,
  bookedSlots: BookedSlot[],
): boolean {
  return bookedSlots.some((b) => start < b.e && end > b.s);
}

/** Upcoming dates (excluding today) that fall on a working day. */
export function getAvailableDates(
  workingDays: number[] = [1, 2, 3, 4, 5],
  weeksAhead = 4,
): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; i <= weeksAhead * 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (workingDays.includes(d.getDay())) dates.push(d);
  }
  return dates;
}

/** yyyy-mm-dd in local time (avoids the UTC shift of toISOString for dates). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
