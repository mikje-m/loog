// Everything derived (handoff 5.3 rule 2 and section 6). Nothing here is stored.
import type { AppData, Exercise, Goal, LoggedExercise, PlannedSet, PR, SetEntry, Session, Units, Workout } from './types';
import { isoDay, num, sp, speedUnit, uid, w, weightUnit } from './format';

export const exerciseById = (d: AppData, id: string) => d.exercises.find((e) => e.id === id);
export const workoutById = (d: AppData, id: string) => d.workouts.find((x) => x.id === id);
export const sessionById = (d: AppData, id: string) => d.sessions.find((s) => s.id === id);
export const goalById = (d: AppData, id: string) => d.goals.find((g) => g.id === id);
export const openSession = (d: AppData) => d.sessions.find((s) => s.status === 'in_progress');
export const sortedWorkouts = (d: AppData) => [...d.workouts].sort((a, b) => a.order - b.order);

/** Finished sessions, oldest first. */
export const finishedAsc = (d: AppData) =>
  d.sessions.filter((s) => s.status === 'finished').sort((a, b) => a.startTime - b.startTime);
/** Finished sessions, newest first. */
export const finishedDesc = (d: AppData) => finishedAsc(d).reverse();

export const sessionName = (d: AppData, s: Session) =>
  (s.workoutId ? workoutById(d, s.workoutId)?.name : undefined) ?? s.workoutName;

export const loggedExercises = (s: Session) => s.exercises.filter((e) => e.state === 'logged');

export const sessionDuration = (s: Session) => (s.endTime ?? s.updatedAt) - s.startTime;

/** Σ weight × reps over all strength sets of the session. */
export function sessionVolume(s: Session): number {
  let v = 0;
  for (const e of loggedExercises(s)) for (const set of e.sets) if (set.reps != null && set.weight != null) v += set.reps * set.weight;
  return v;
}

// ---- Workouts --------------------------------------------------------------------

export function lastPerformed(d: AppData, workoutId: string): number | undefined {
  let best: number | undefined;
  for (const s of d.sessions) {
    if (s.status === 'finished' && s.workoutId === workoutId && (best == null || s.startTime > best)) best = s.startTime;
  }
  return best;
}

/** Oldest LastPerformed wins; never performed counts as oldest; ties keep My workouts order *(assumed)*. Hidden workouts are skipped. */
export function suggestedWorkout(d: AppData): Workout | undefined {
  let best: Workout | undefined;
  let bestTime = Infinity;
  for (const wk of sortedWorkouts(d)) {
    if (wk.hideFromHome) continue;
    const t = lastPerformed(d, wk.id) ?? -Infinity;
    if (best == null || t < bestTime) {
      best = wk;
      bestTime = t;
    }
  }
  return best;
}

// ---- PRs ---------------------------------------------------------------------------

function bestOf(sets: SetEntry[]) {
  let maxW = 0;
  let maxReps = 0;
  for (const s of sets) {
    if (s.reps == null) continue;
    if (s.weight != null && s.weight > maxW) maxW = s.weight;
    if (s.reps > maxReps) maxReps = s.reps;
  }
  return { maxW, maxReps };
}

const isStrength = (d: AppData, exerciseId: string) => {
  const ex = exerciseById(d, exerciseId);
  return !!ex && !ex.isCardio;
};

/**
 * Every PR, oldest first. A session has a PR when one of its sets beat the best
 * result from earlier sessions. Cardio never produces PRs.
 * TODO(Mike): the first time an exercise is logged is not counted as a PR (nothing to beat yet). Confirm.
 */
export function allPRs(d: AppData): PR[] {
  const prs: PR[] = [];
  const best = new Map<string, { maxW: number; maxReps: number }>();
  for (const s of finishedAsc(d)) {
    for (const e of loggedExercises(s)) {
      if (!isStrength(d, e.exerciseId)) continue;
      const b = bestOf(e.sets);
      const prior = best.get(e.exerciseId);
      if (prior) {
        if (b.maxW > 0 && b.maxW > prior.maxW) prs.push({ sessionId: s.id, exerciseId: e.exerciseId, type: 'heaviest', value: b.maxW, date: s.startTime });
        if (b.maxReps > prior.maxReps) prs.push({ sessionId: s.id, exerciseId: e.exerciseId, type: 'most_reps', value: b.maxReps, date: s.startTime });
      }
      best.set(e.exerciseId, { maxW: Math.max(prior?.maxW ?? 0, b.maxW), maxReps: Math.max(prior?.maxReps ?? 0, b.maxReps) });
    }
  }
  return prs;
}

export const prsForSession = (d: AppData, sessionId: string) => allPRs(d).filter((p) => p.sessionId === sessionId);

export interface Heaviest {
  weight: number;
  reps: number;
  date: number;
  sessionId: string;
}

/** Heaviest set ever (weight > 0) for an exercise, with the reps done at that weight. */
export function heaviestFor(d: AppData, exerciseId: string, filter?: (s: Session) => boolean): Heaviest | undefined {
  let best: Heaviest | undefined;
  for (const s of finishedAsc(d)) {
    if (filter && !filter(s)) continue;
    for (const e of loggedExercises(s)) {
      if (e.exerciseId !== exerciseId) continue;
      for (const set of e.sets) {
        if (set.weight == null || set.reps == null || set.weight <= 0) continue;
        if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps && s.id === best.sessionId)) {
          best = { weight: set.weight, reps: set.reps, date: s.startTime, sessionId: s.id };
        }
      }
    }
  }
  return best;
}

// ---- Goals ---------------------------------------------------------------------------

export const goalProgress = (current: number | undefined, g: Goal) =>
  g.targetValue > 0 ? Math.min(1, (current ?? 0) / g.targetValue) : 0;

export const goalCurrent = (d: AppData, g: Goal) => heaviestFor(d, g.exerciseId)?.weight ?? 0;

/** Mark goals completed when a logged set reached the target. Mutates `d`. */
export function syncGoals(d: AppData, when = Date.now()) {
  for (const g of d.goals) {
    if (g.completedAt != null) continue;
    if (goalCurrent(d, g) >= g.targetValue) g.completedAt = when;
  }
}

// ---- History lookups --------------------------------------------------------------------

export interface PastEntry {
  session: Session;
  logged: LoggedExercise;
}

/** Latest finished entries for an exercise, newest first. */
export function recentFor(d: AppData, exerciseId: string, n: number): PastEntry[] {
  const out: PastEntry[] = [];
  for (const s of finishedDesc(d)) {
    const logged = s.exercises.find((e) => e.exerciseId === exerciseId && e.state === 'logged');
    if (logged) out.push({ session: s, logged });
    if (out.length >= n) break;
  }
  return out;
}

export const lastFor = (d: AppData, exerciseId: string) => recentFor(d, exerciseId, 1)[0];

/** Sessions and PRs that deleting an exercise would remove. */
export function exerciseImpact(d: AppData, exerciseId: string) {
  return {
    sessions: d.sessions.filter((s) => s.status === 'finished' && s.exercises.some((e) => e.exerciseId === exerciseId)).length,
    prs: allPRs(d).filter((p) => p.exerciseId === exerciseId).length,
  };
}

// ---- Live session seeding -----------------------------------------------------------------

/** Suggested values: from the last session of this exercise, or from the targets the first time. */
export function seedSets(d: AppData, ex: Exercise, planned: PlannedSet[] | undefined, count?: number): SetEntry[] {
  const last = lastFor(d, ex.id)?.logged;
  const n = count ?? (planned?.length ? planned.length : last?.sets.length || 1);
  return Array.from({ length: n }, (_, i) => {
    const p = planned?.length ? planned[Math.min(i, planned.length - 1)] : undefined;
    const l = last?.sets.length ? last.sets[Math.min(i, last.sets.length - 1)] : undefined;
    if (ex.isCardio) return { id: uid(), duration: l?.duration ?? p?.duration, speed: l?.speed ?? p?.speed, completed: false };
    return { id: uid(), reps: l?.reps ?? p?.reps, weight: l?.weight, completed: false };
  });
}

export const isComplete = (set: SetEntry, cardio: boolean) =>
  cardio ? set.duration != null && set.speed != null : set.reps != null && set.weight != null;

// ---- Text helpers ----------------------------------------------------------------------------

/** Highest weight among sets, or undefined. */
export const topWeight = (sets: SetEntry[]) => {
  const ws = sets.map((s) => s.weight).filter((x): x is number => x != null);
  return ws.length ? Math.max(...ws) : undefined;
};

/** Targets: "12 · 10 · 8 reps" or "10 min · 6,0 km/h". */
export function targetsText(ex: Exercise | undefined, sets: PlannedSet[], u: Units): string {
  if (!ex) return '';
  if (ex.isCardio) {
    const p = sets[0];
    return p ? `${num(p.duration ?? 0)} min · ${sp(p.speed ?? 0, u)} ${speedUnit(u)}` : '';
  }
  return `${sets.map((s) => s.reps ?? 0).join(' · ')} reps`;
}

/** Logged: "12 · 10 · 8 · 100 kg" or "10 min · 6,0 km/h". The weight is the top weight. */
export function loggedText(sets: SetEntry[], cardio: boolean, u: Units): string {
  if (cardio) {
    const s = sets[0];
    if (!s) return '';
    return `${num(s.duration ?? 0)} min · ${sp(s.speed ?? 0, u)} ${speedUnit(u)}`;
  }
  const reps = sets.map((s) => s.reps ?? 0).join(' · ');
  const top = topWeight(sets);
  return top != null ? `${reps} · ${w(top, u)} ${weightUnit(u)}` : reps;
}

/**
 * "Last time: 12/10/8 · 70 kg · PR 75".
 * TODO(Mike): open question 26 — when the sets had different weights the top weight is shown.
 * TODO(Mike): open question 12 — returns undefined (line hidden) the first time.
 */
export function lastTimeText(d: AppData, exerciseId: string, cardio: boolean, u: Units): string | undefined {
  const last = lastFor(d, exerciseId);
  if (!last) return undefined;
  const sets = last.logged.sets;
  if (cardio) return `Last time: ${loggedText(sets, true, u)}`;
  const parts = [sets.map((s) => s.reps ?? 0).join('/')];
  const top = topWeight(sets);
  if (top != null) parts.push(`${w(top, u)} ${weightUnit(u)}`);
  const pr = heaviestFor(d, exerciseId);
  if (pr) parts.push(`PR ${w(pr.weight, u)}`);
  return `Last time: ${parts.join(' · ')}`;
}

/** To do rows: target reps + the weight from the last session *(assumed, open question 24)*. */
export function todoText(d: AppData, s: Session, e: LoggedExercise, u: Units): string {
  const ex = exerciseById(d, e.exerciseId);
  if (!ex) return '';
  const item = e.itemId && s.workoutId ? workoutById(d, s.workoutId)?.items.find((i) => i.id === e.itemId) : undefined;
  if (ex.isCardio) {
    const p = item?.sets[0] ?? { duration: e.sets[0]?.duration, speed: e.sets[0]?.speed };
    return targetsText(ex, [p], u);
  }
  const reps = item ? item.sets.map((p) => p.reps ?? 0) : e.sets.map((x) => x.reps ?? 0);
  const parts = [`${reps.join(' · ')} reps`];
  const last = lastFor(d, ex.id);
  const top = last ? topWeight(last.logged.sets) : undefined;
  if (top != null) parts.push(`${w(top, u)} ${weightUnit(u)}`);
  return parts.join(' · ');
}

// ---- Year overview -------------------------------------------------------------------------

export function yearStats(d: AppData, now = Date.now()) {
  const year = new Date(now).getFullYear();
  const days = new Set<string>();
  let count = 0;
  for (const s of d.sessions) {
    if (s.status !== 'finished' || s.endTime == null) continue;
    if (new Date(s.endTime).getFullYear() === year) {
      count++;
      days.add(isoDay(s.endTime));
    }
  }
  return { year, count, days };
}

// ---- Progress chart ------------------------------------------------------------------------

export type Period = 'week' | 'month' | 'year' | 'all';

export interface Bucket {
  key: string;
  start: number;
  end: number; // exclusive
  label: string; // under the bar
  title: string; // "September", used in section labels
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function bucketOf(ts: number, period: Period, nowYear: number): Bucket {
  const d = new Date(ts);
  if (period === 'week') {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    const label = `${start.getDate()} ${MON[start.getMonth()].toLowerCase()}`;
    return { key: `w${start.getTime()}`, start: start.getTime(), end: end.getTime(), label, title: `week of ${label}` };
  }
  if (period === 'year') {
    const start = new Date(d.getFullYear(), 0, 1);
    return { key: `y${d.getFullYear()}`, start: start.getTime(), end: new Date(d.getFullYear() + 1, 0, 1).getTime(), label: String(d.getFullYear()), title: String(d.getFullYear()) };
  }
  // Month, and "All time" (TODO(Mike): open question 3 — All time groups per month over the whole history).
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const yr = d.getFullYear() === nowYear ? '' : ` ${d.getFullYear()}`;
  return {
    key: `m${d.getFullYear()}-${d.getMonth()}`,
    start: start.getTime(),
    end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(),
    label: MON[d.getMonth()],
    title: `${MONTH_NAMES[d.getMonth()]}${yr}`,
  };
}

export interface ChartBar extends Bucket {
  /** Heaviest weight lifted in this period (kg), or undefined when empty. */
  value?: number;
  entries: PastEntry[];
}

/** One bar per period from the first logged period up to now, oldest first; empty periods included. */
export function chartBars(d: AppData, exerciseId: string, period: Period, now = Date.now()): ChartBar[] {
  const entries = finishedAsc(d).flatMap((s) => {
    const logged = s.exercises.find((e) => e.exerciseId === exerciseId && e.state === 'logged');
    return logged ? [{ session: s, logged }] : [];
  });
  if (entries.length === 0) return [];
  const nowYear = new Date(now).getFullYear();
  const bars: ChartBar[] = [];
  let cursor = bucketOf(entries[0].session.startTime, period, nowYear);
  const last = bucketOf(Math.max(now, entries[entries.length - 1].session.startTime), period, nowYear);
  for (let guard = 0; guard < 2000; guard++) {
    const inside = entries.filter((x) => x.session.startTime >= cursor.start && x.session.startTime < cursor.end);
    const weights = inside.flatMap((x) => x.logged.sets.map((s) => s.weight ?? 0));
    const max = weights.length ? Math.max(...weights) : undefined;
    bars.push({ ...cursor, value: inside.length ? max : undefined, entries: inside });
    if (cursor.key === last.key) break;
    cursor = bucketOf(cursor.end, period, nowYear);
  }
  return bars;
}
