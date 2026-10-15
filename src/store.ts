// App state: an in-memory snapshot backed by IndexedDB (Dexie). Every change is
// written straight away, so a dead battery never costs an exercise (handoff 8.4).
import Dexie, { type Table } from 'dexie';
import { produce } from 'immer';
import { useSyncExternalStore } from 'react';
import type {
  AppData, Exercise, Goal, LoggedExercise, PlannedSet, SetEntry, SetField, Session, Settings, Theme, Units, Workout,
} from './types';
import { exerciseById, isComplete, openSession, seedSets, sortedWorkouts, syncGoals, workoutById } from './calc';
import { uid } from './format';

// ---- Database ------------------------------------------------------------------------

class LoogDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  sessions!: Table<Session, string>;
  goals!: Table<Goal, string>;
  meta!: Table<{ key: string; value: unknown }, string>;
  constructor() {
    super('loog');
    this.version(1).stores({ exercises: 'id', workouts: 'id', sessions: 'id', goals: 'id', meta: 'key' });
  }
}

const db = new LoogDB();
const TABLES = ['exercises', 'workouts', 'sessions', 'goals'] as const;
type TableName = (typeof TABLES)[number];

export const DEFAULT_SETTINGS: Settings = { units: 'kg_kmh', theme: 'auto' };
const STALE_MS = 12 * 60 * 60 * 1000;

const empty = (): AppData => ({ exercises: [], workouts: [], sessions: [], goals: [], settings: { ...DEFAULT_SETTINGS } });

let data: AppData = empty();
let ready = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// ---- Theme ---------------------------------------------------------------------------

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('loog:theme', theme);
  } catch {
    /* ignore */
  }
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#0f0a0c');
}

// ---- Persistence ----------------------------------------------------------------------

let queue: Promise<unknown> = Promise.resolve();

/** Write only what changed. Immer keeps unchanged records identical, so a reference check is enough. */
function persist(prev: AppData, next: AppData) {
  const work = async () => {
    await db.transaction('rw', [db.exercises, db.workouts, db.sessions, db.goals, db.meta], async () => {
      for (const name of TABLES) {
        if (prev[name] === next[name]) continue;
        const before = new Map((prev[name] as { id: string }[]).map((r) => [r.id, r]));
        const after = next[name] as { id: string }[];
        const changed = after.filter((r) => before.get(r.id) !== r);
        const keep = new Set(after.map((r) => r.id));
        const removed = [...before.keys()].filter((id) => !keep.has(id));
        const table = db.table(name);
        if (changed.length) await table.bulkPut(changed);
        if (removed.length) await table.bulkDelete(removed);
      }
      if (prev.settings !== next.settings) await db.meta.put({ key: 'settings', value: next.settings });
    });
  };
  queue = queue.then(work).catch((err) => console.error('Loog: could not save', err));
}

/** Apply a change, save it, and tell the UI. */
export function mutate(fn: (d: AppData) => void) {
  const prev = data;
  const next = produce(prev, fn);
  if (next === prev) return;
  data = next;
  persist(prev, next);
  emit();
}

/** Finish a live session: unresolved and skipped exercises are dropped, logged ones kept. */
function closeSession(s: Session, endTime: number) {
  s.exercises = s.exercises.filter((e) => e.state === 'logged');
  for (const e of s.exercises) for (const set of e.sets) set.completed = true;
  s.status = 'finished';
  s.endTime = endTime;
  s.currentId = undefined;
}

/** A session left open for more than ~12 hours is finished at the time of its last change (8.7). */
function finalizeStale(d: AppData, now = Date.now()) {
  const s = openSession(d);
  if (!s || now - s.updatedAt <= STALE_MS) return;
  if (s.exercises.some((e) => e.state === 'logged')) {
    closeSession(s, s.updatedAt);
    syncGoals(d, s.updatedAt);
  } else {
    d.sessions = d.sessions.filter((x) => x.id !== s.id);
  }
}

export async function loadData() {
  try {
    const [exercises, workouts, sessions, goals, settingsRow] = await Promise.all([
      db.exercises.toArray(), db.workouts.toArray(), db.sessions.toArray(), db.goals.toArray(), db.meta.get('settings'),
    ]);
    const settings = { ...DEFAULT_SETTINGS, ...((settingsRow?.value as Partial<Settings>) ?? {}) };
    data = { exercises, workouts, sessions, goals, settings };
    try {
      void navigator.storage?.persist?.();
    } catch {
      /* ignore */
    }
  } catch (err) {
    console.error('Loog: could not open the database', err);
  }
  ready = true;
  applyTheme(data.settings.theme);
  mutate(finalizeStale);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useData = () => useSyncExternalStore(subscribe, () => data);
export const useReady = () => useSyncExternalStore(subscribe, () => ready);
export const getData = () => data;

// ---- Settings ---------------------------------------------------------------------------

export const setUnits = (units: Units) => mutate((d) => { d.settings.units = units; });
export function setTheme(theme: Theme) {
  mutate((d) => { d.settings.theme = theme; });
  applyTheme(theme);
}

// ---- Export / import ----------------------------------------------------------------------

export function exportJSON(): string {
  const { exercises, workouts, sessions, goals, settings } = data;
  return JSON.stringify({ app: 'loog', version: 1, exportedAt: new Date().toISOString(), exercises, workouts, sessions, goals, settings }, null, 2);
}

/** Replace all data with a backup. Returns an error message, or undefined on success. */
export async function importJSON(text: string): Promise<string | undefined> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    return 'That file could not be read.';
  }
  if (parsed?.app !== 'loog' || !TABLES.every((t) => Array.isArray(parsed[t]))) return 'That file is not a Loog backup.';
  const next: AppData = {
    exercises: parsed.exercises as Exercise[],
    workouts: parsed.workouts as Workout[],
    sessions: parsed.sessions as Session[],
    goals: parsed.goals as Goal[],
    settings: { ...DEFAULT_SETTINGS, ...((parsed.settings as Partial<Settings>) ?? {}) },
  };
  await queue;
  await db.transaction('rw', [db.exercises, db.workouts, db.sessions, db.goals, db.meta], async () => {
    for (const name of TABLES) {
      await db.table(name as TableName).clear();
      await db.table(name as TableName).bulkPut(next[name as TableName]);
    }
    await db.meta.put({ key: 'settings', value: next.settings });
  });
  data = next;
  applyTheme(next.settings.theme);
  emit();
  return undefined;
}

// ---- Exercises ------------------------------------------------------------------------------

export function createExercise(e: Omit<Exercise, 'id'>): string {
  const id = uid();
  mutate((d) => { d.exercises.push({ id, ...e }); });
  return id;
}

export const updateExercise = (id: string, e: Omit<Exercise, 'id'>) =>
  mutate((d) => {
    const ex = exerciseById(d, id);
    if (!ex) return;
    ex.name = e.name;
    ex.isCardio = e.isCardio;
    ex.muscleGroup = e.isCardio ? undefined : e.muscleGroup;
    ex.equipment = e.isCardio ? undefined : e.equipment;
  });

/** Delete an exercise and everything that points to it. */
export const deleteExercise = (id: string) =>
  mutate((d) => {
    d.exercises = d.exercises.filter((e) => e.id !== id);
    for (const wk of d.workouts) if (wk.items.some((i) => i.exerciseId === id)) wk.items = wk.items.filter((i) => i.exerciseId !== id);
    d.goals = d.goals.filter((g) => g.exerciseId !== id);
    for (const s of d.sessions) if (s.exercises.some((e) => e.exerciseId === id)) s.exercises = s.exercises.filter((e) => e.exerciseId !== id);
    d.sessions = d.sessions.filter((s) => s.status === 'in_progress' || s.exercises.length > 0);
  });

// ---- Workouts --------------------------------------------------------------------------------

export function createWorkout(name: string): string {
  const id = uid();
  mutate((d) => {
    const order = d.workouts.reduce((m, x) => Math.max(m, x.order), -1) + 1;
    d.workouts.push({ id, name, order, hideFromHome: false, items: [] });
  });
  return id;
}

export const renameWorkout = (id: string, name: string) => mutate((d) => { const x = workoutById(d, id); if (x) x.name = name; });
export const setHideFromHome = (id: string, hide: boolean) => mutate((d) => { const x = workoutById(d, id); if (x) x.hideFromHome = hide; });
export const deleteWorkout = (id: string) => mutate((d) => { d.workouts = d.workouts.filter((x) => x.id !== id); });

/** Copy a workout with all items and planned sets, placed right after the original. */
export function duplicateWorkout(id: string, name: string): string | undefined {
  const newId = uid();
  let ok = false;
  mutate((d) => {
    const ordered = sortedWorkouts(d);
    const idx = ordered.findIndex((x) => x.id === id);
    if (idx < 0) return;
    ok = true;
    const src = ordered[idx];
    const copy: Workout = {
      id: newId, name, order: 0, hideFromHome: src.hideFromHome,
      items: src.items.map((i) => ({ id: uid(), exerciseId: i.exerciseId, sets: i.sets.map((p) => ({ ...p })) })),
    };
    ordered.splice(idx + 1, 0, copy);
    d.workouts.push(copy);
    ordered.forEach((x, i) => {
      const target = workoutById(d, x.id);
      if (target && target.order !== i) target.order = i;
    });
  });
  return ok ? newId : undefined;
}

export const reorderWorkouts = (ids: string[]) =>
  mutate((d) => {
    ids.forEach((id, i) => {
      const x = workoutById(d, id);
      if (x && x.order !== i) x.order = i;
    });
  });

export function saveItem(workoutId: string, itemId: string | undefined, exerciseId: string, sets: PlannedSet[]) {
  mutate((d) => {
    const wk = workoutById(d, workoutId);
    if (!wk) return;
    const item = itemId ? wk.items.find((i) => i.id === itemId) : undefined;
    if (item) item.sets = sets;
    else wk.items.push({ id: uid(), exerciseId, sets });
  });
}

export const removeItem = (workoutId: string, itemId: string) =>
  mutate((d) => { const wk = workoutById(d, workoutId); if (wk) wk.items = wk.items.filter((i) => i.id !== itemId); });

export const reorderItems = (workoutId: string, ids: string[]) =>
  mutate((d) => {
    const wk = workoutById(d, workoutId);
    if (!wk) return;
    const byId = new Map(wk.items.map((i) => [i.id, i]));
    wk.items = ids.map((id) => byId.get(id)!).filter(Boolean);
  });

// ---- Live session ------------------------------------------------------------------------------

/** Start a session from a workout. Returns its id, or undefined if one is already open or nothing can be logged. */
export function startWorkout(workoutId: string): string | undefined {
  const id = uid();
  let ok = false;
  mutate((d) => {
    if (openSession(d)) return;
    const wk = workoutById(d, workoutId);
    if (!wk) return;
    const exercises: LoggedExercise[] = [];
    for (const item of wk.items) {
      const ex = exerciseById(d, item.exerciseId);
      if (ex) exercises.push({ id: uid(), exerciseId: ex.id, itemId: item.id, state: 'todo', sets: seedSets(d, ex, item.sets) });
    }
    if (exercises.length === 0) return;
    ok = true;
    const now = Date.now();
    d.sessions.push({
      id, workoutId: wk.id, workoutName: wk.name, status: 'in_progress', startTime: now, notes: '',
      exercises, currentId: exercises[0].id, updatedAt: now,
    });
  });
  return ok ? id : undefined;
}

/** Change the open session and stamp its activity time. */
function mutateLive(fn: (s: Session, d: AppData) => void) {
  mutate((d) => {
    const s = openSession(d);
    if (!s) return;
    fn(s, d);
    s.updatedAt = Date.now();
  });
}

const firstTodo = (s: Session, except?: string) => s.exercises.find((e) => e.state === 'todo' && e.id !== except);

/** Make an exercise the card. A skipped one goes back to To do; a logged one is edited in the card. */
export const setCurrent = (loggedId: string) =>
  mutateLive((s) => {
    const e = s.exercises.find((x) => x.id === loggedId);
    if (!e) return;
    // TODO(Mike): open questions 10 and 19 — tapping a Completed (logged or skipped) exercise moves it back into the card to edit and log again.
    if (e.state !== 'todo') e.state = 'todo';
    s.currentId = e.id;
  });

export const setNotes = (sessionId: string, notes: string) =>
  mutate((d) => {
    const s = d.sessions.find((x) => x.id === sessionId);
    if (s) {
      s.notes = notes;
      if (s.status === 'in_progress') s.updatedAt = Date.now();
    }
  });

/** Apply a user edit and remember which fields were touched. */
export function applyPatch(set: SetEntry, patch: Partial<Record<SetField, number | undefined>>) {
  for (const k of Object.keys(patch) as SetField[]) {
    set[k] = patch[k];
    set.edited = { ...set.edited, [k]: true };
  }
}

export const updateSet = (loggedId: string, setId: string, patch: Partial<Record<SetField, number | undefined>>) =>
  mutateLive((s) => {
    const set = s.exercises.find((e) => e.id === loggedId)?.sets.find((x) => x.id === setId);
    if (set) applyPatch(set, patch);
  });

/** Add a row copying the last row's values as grey suggestions *(assumed)*. */
export const addSet = (loggedId: string) =>
  mutateLive((s) => {
    const e = s.exercises.find((x) => x.id === loggedId);
    if (!e) return;
    const last = e.sets[e.sets.length - 1];
    e.sets.push({ id: uid(), reps: last?.reps, weight: last?.weight, duration: last?.duration, speed: last?.speed, completed: false });
  });

/** Log the whole exercise at once, then the next To do exercise becomes the card. */
export const logExercise = (loggedId: string) =>
  mutateLive((s, d) => {
    const e = s.exercises.find((x) => x.id === loggedId);
    if (!e) return;
    const cardio = !!exerciseById(d, e.exerciseId)?.isCardio;
    if (!e.sets.every((set) => isComplete(set, cardio))) return;
    e.state = 'logged';
    for (const set of e.sets) set.completed = true;
    s.currentId = (firstTodo(s) ?? e).id;
  });

export const skipExercise = (loggedId: string) =>
  mutateLive((s) => {
    const e = s.exercises.find((x) => x.id === loggedId);
    if (!e) return;
    e.state = 'skipped';
    s.currentId = (firstTodo(s) ?? e).id;
  });

export const removeFromSession = (loggedId: string) =>
  mutateLive((s) => {
    const idx = s.exercises.findIndex((x) => x.id === loggedId);
    if (idx < 0) return;
    s.exercises.splice(idx, 1);
    if (s.currentId === loggedId) s.currentId = (firstTodo(s) ?? s.exercises[Math.min(idx, s.exercises.length - 1)])?.id;
  });

/** The chosen exercise replaces this one in this session only. */
export const swapExercise = (loggedId: string, exerciseId: string) =>
  mutateLive((s, d) => {
    const e = s.exercises.find((x) => x.id === loggedId);
    const ex = exerciseById(d, exerciseId);
    if (!e || !ex) return;
    e.exerciseId = ex.id;
    e.state = 'todo';
    e.sets = seedSets(d, ex, undefined, e.sets.length);
  });

/** Session-only: not added to the workout (5.3 rule 5). One set row. */
export const addToSession = (exerciseId: string) =>
  mutateLive((s, d) => {
    const ex = exerciseById(d, exerciseId);
    if (!ex) return;
    const e: LoggedExercise = { id: uid(), exerciseId: ex.id, state: 'todo', sets: seedSets(d, ex, undefined, 1) };
    s.exercises.push(e);
    s.currentId = e.id;
  });

/**
 * Reorder the exercises still to do; resolved ones keep their place.
 * Also updates the workout's order for next time (5.3 rule 6).
 */
export const reorderTodo = (todoIds: string[]) =>
  mutateLive((s, d) => {
    const byId = new Map(s.exercises.map((e) => [e.id, e]));
    const queue = todoIds.map((id) => byId.get(id)).filter((e): e is LoggedExercise => !!e);
    s.exercises = s.exercises.map((e) => (e.state === 'todo' ? queue.shift() ?? e : e));
    const wk = s.workoutId ? workoutById(d, s.workoutId) : undefined;
    if (!wk) return;
    const rank = new Map(s.exercises.flatMap((e, i) => (e.itemId ? [[e.itemId, i] as const] : [])));
    const sorted = [...wk.items].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
    if (sorted.some((it, i) => it !== wk.items[i])) wk.items = sorted;
  });

/**
 * "Workout completed": log the current exercise, then save the session (EndTime = now) *(assumed)*.
 * Returns the session id, or undefined when nothing was logged (the session is then dropped).
 */
export function completeWorkout(): string | undefined {
  let id: string | undefined;
  mutate((d) => {
    const s = openSession(d);
    if (!s) return;
    const cur = s.exercises.find((e) => e.id === s.currentId);
    if (cur && cur.state === 'todo') {
      const cardio = !!exerciseById(d, cur.exerciseId)?.isCardio;
      if (cur.sets.every((set) => isComplete(set, cardio))) {
        cur.state = 'logged';
      }
    }
    if (!s.exercises.some((e) => e.state === 'logged')) {
      d.sessions = d.sessions.filter((x) => x.id !== s.id);
      return;
    }
    const now = Date.now();
    closeSession(s, now);
    s.updatedAt = now;
    syncGoals(d, now);
    id = s.id;
  });
  return id;
}

export const discardSession = () => mutate((d) => { d.sessions = d.sessions.filter((s) => s.status !== 'in_progress'); });

// ---- History ----------------------------------------------------------------------------------------

/** The whole session saves at once, so PRs recalculate once (5.3 rule 7). */
export const saveSessionEdit = (edited: Session) =>
  mutate((d) => {
    const i = d.sessions.findIndex((s) => s.id === edited.id);
    if (i < 0) return;
    d.sessions[i] = edited;
    syncGoals(d, edited.endTime);
  });

export const deleteSession = (id: string) => mutate((d) => { d.sessions = d.sessions.filter((s) => s.id !== id); });

// ---- Goals ----------------------------------------------------------------------------------------------

export function saveGoal(id: string | undefined, g: Pick<Goal, 'exerciseId' | 'targetValue' | 'deadline'>) {
  mutate((d) => {
    const existing = id ? d.goals.find((x) => x.id === id) : undefined;
    if (existing) {
      const changed = existing.targetValue !== g.targetValue || existing.exerciseId !== g.exerciseId;
      Object.assign(existing, g);
      if (changed) existing.completedAt = undefined; // re-checked against the new target
    } else {
      d.goals.push({ id: uid(), createdAt: Date.now(), ...g });
    }
    syncGoals(d);
  });
}

export const deleteGoal = (id: string) => mutate((d) => { d.goals = d.goals.filter((g) => g.id !== id); });
