// Formatting per handoff 2.11 and section 6: decimal comma, thousands dot,
// English names with lowercase months, middle dots between facts.
import type { Units } from './types';

const nf1 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
const nfSpeed = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const KG_PER_LB = 0.45359237;
const KMH_PER_MPH = 1.609344;
const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

// ---- Units -------------------------------------------------------------------

export const weightUnit = (u: Units) => (u === 'kg_kmh' ? 'kg' : 'lbs');
export const speedUnit = (u: Units) => (u === 'kg_kmh' ? 'km/h' : 'mph');
/** Column header style: "Km/h" / "Mph". */
export const speedHeader = (u: Units) => (u === 'kg_kmh' ? 'Km/h' : 'Mph');
/** TODO(Mike): open question 13 — the lbs step is assumed to be 5. */
export const weightStep = (u: Units) => (u === 'kg_kmh' ? 2.5 : 5);
/** TODO(Mike): open question 13 — the mph step is assumed to be 0,5. */
export const speedStep = 0.5;

export const toDisplayWeight = (kg: number, u: Units) => (u === 'kg_kmh' ? kg : kg / KG_PER_LB);
export const fromDisplayWeight = (v: number, u: Units) => round4(u === 'kg_kmh' ? v : v * KG_PER_LB);
export const toDisplaySpeed = (kmh: number, u: Units) => (u === 'kg_kmh' ? kmh : kmh / KMH_PER_MPH);
export const fromDisplaySpeed = (v: number, u: Units) => round4(u === 'kg_kmh' ? v : v * KMH_PER_MPH);

// ---- Numbers -------------------------------------------------------------------

/** "82,5", "100". Max one decimal. */
export const num = (n: number) => nf1.format(Math.round(n * 10) / 10);
/** "8.420" */
export const int = (n: number) => nf0.format(n);
/** Weight in display units, no unit: "82,5". */
export const w = (kg: number, u: Units) => num(toDisplayWeight(kg, u));
/** "82,5 kg" */
export const wu = (kg: number, u: Units) => `${w(kg, u)} ${weightUnit(u)}`;
/** Speed always keeps one decimal: "6,0" */
export const sp = (kmh: number, u: Units) => nfSpeed.format(toDisplaySpeed(kmh, u));
/** A display-unit number with exactly one decimal: "6,0". */
export const fixed1 = (n: number) => nfSpeed.format(n);
/** "6,0 km/h" */
export const spu = (kmh: number, u: Units) => `${sp(kmh, u)} ${speedUnit(u)}`;
/** "8.420 kg" */
export const volume = (kg: number, u: Units) => `${int(toDisplayWeight(kg, u))} ${weightUnit(u)}`;

/** Accepts "82,5" and "82.5". */
export function parseNum(s: string): number | undefined {
  const t = s.trim().replace(',', '.');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** Value for an editable field: "82,5" with a comma, no grouping. */
export const editNum = (n: number | undefined) => (n == null ? '' : String(Math.round(n * 100) / 100).replace('.', ','));

// ---- Dates ---------------------------------------------------------------------

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** "Saturday, 12 september" */
export const dateLong = (ts: number) => {
  const d = new Date(ts);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
/** "Sat 12 sep" */
export const dateRow = (ts: number) => {
  const d = new Date(ts);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};
/** "12 september" */
export const dayMonth = (ts: number) => {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
/** "26 sep" */
export const dayMonthShort = (ts: number) => {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};
/** "31 december 2026" */
export const dayMonthYear = (ts: number) => `${dayMonth(ts)} ${new Date(ts).getFullYear()}`;
/** Month section label: "September" (or "September 2025" in another year). */
export const monthLabel = (ts: number, now = Date.now()) => {
  const d = new Date(ts);
  const name = cap(MONTHS[d.getMonth()]);
  // TODO(Mike): open question 15 — the year is added when it is not the current year.
  return d.getFullYear() === new Date(now).getFullYear() ? name : `${name} ${d.getFullYear()}`;
};
export const monthShortCap = (m: number) => cap(MONTHS_SHORT[m]);
export const monthCap = (m: number) => cap(MONTHS[m]);

/** "18:04" */
export const time = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
/** "18:04 – 18:56" */
export const timeRange = (a: number, b: number) => `${time(a)} – ${time(b)}`;

/** "52 min". TODO(Mike): open question 18 — durations over an hour stay in minutes ("72 min"). */
export const duration = (ms: number) => `${Math.max(0, Math.round(ms / 60_000))} min`;

export const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
export const daysBetween = (ts: number, now = Date.now()) => Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);

/** Row style: "9d ago". *(assumed)* "today" for the same day. */
export const agoShort = (ts: number, now = Date.now()) => {
  const n = daysBetween(ts, now);
  return n <= 0 ? 'today' : `${n}d ago`;
};
/** Card style: "Last done 9 days ago". *(assumed)* "today" / "1 day ago". */
export const lastDone = (ts: number, now = Date.now()) => {
  const n = daysBetween(ts, now);
  if (n <= 0) return 'Last done today';
  return `Last done ${n} ${n === 1 ? 'day' : 'days'} ago`;
};
/** "32 min ago". *(assumed)* hours above 60 minutes. */
export const minutesAgo = (ts: number, now = Date.now()) => {
  const min = Math.max(0, Math.round((now - ts) / 60_000));
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  return `${h} h ago`;
};

/** "YYYY-MM-DD" in local time. */
export const isoDay = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const fromIsoDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};
/** Goal subtitle dates: "31 dec". */
export const goalDate = (ts: number) => dayMonthShort(ts);

export const toTimeInput = (ts: number) => time(ts);
/** Apply "HH:MM" to the calendar day of `base`. */
export const withTime = (base: number, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Between facts: whitespace only, no middle dots. Reads like "Sat 12 sep  52 min". */
export const SEP = ' ';
export const facts = (...parts: (string | undefined | false | null)[]) => parts.filter(Boolean).join(SEP);
/** Rep lists read like in the gym: "12-10-8". */
export const repList = (reps: number[]) => reps.join('-');

export const plural =(n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
