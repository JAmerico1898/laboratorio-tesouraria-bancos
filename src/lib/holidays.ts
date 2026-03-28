const EASTER_DATES: [number, number, number][] = [
  [2015, 3, 5], [2016, 2, 27], [2017, 3, 16], [2018, 3, 1],
  [2019, 3, 21], [2020, 3, 12], [2021, 3, 4], [2022, 3, 17],
  [2023, 3, 9], [2024, 2, 31], [2025, 3, 20], [2026, 3, 5],
  [2027, 2, 28], [2028, 3, 16], [2029, 3, 1], [2030, 3, 21],
];

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildHolidaySet(): Set<string> {
  const holidays = new Set<string>();
  for (let year = 2015; year <= 2030; year++) {
    for (const md of ["01-01","04-21","05-01","09-07","10-12","11-02","11-15","12-25"]) {
      holidays.add(`${year}-${md}`);
    }
  }
  for (const [y, m, d] of EASTER_DATES) {
    const easter = new Date(y, m, d);
    holidays.add(isoDate(addDays(easter, -48)));
    holidays.add(isoDate(addDays(easter, -47)));
    holidays.add(isoDate(addDays(easter, -2)));
    holidays.add(isoDate(addDays(easter, 60)));
  }
  return holidays;
}

export const ANBIMA_HOLIDAYS = buildHolidaySet();

export function diasUteis(d1: Date, d2: Date): number {
  let count = 0;
  const current = new Date(d1);
  current.setDate(current.getDate() + 1);
  while (current <= d2) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6 && !ANBIMA_HOLIDAYS.has(isoDate(current))) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function diasCorridos(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
}
