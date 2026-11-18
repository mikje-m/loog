import { describe, expect, it } from 'vitest';
import type { AppData, Session } from './types';
import {
  allPRs, chartBars, goalCurrent, heaviestFor, lastTimeText, loggedText, seedSets, sessionVolume, suggestedWorkout, syncGoals, targetsText,
} from './calc';
import { SEP, dateLong, dateRow, dayMonth, int, lastDone, monthLabel, num, sp, volume, w } from './format';

const DAY = 86_400_000;
const t0 = new Date(2026, 8, 1, 18, 4).getTime();

function session(id: string, day: number, workoutId: string, sets: [number, number][], exerciseId = 'bench'): Session {
  const start = t0 + day * DAY;
  return {
    id, workoutId, workoutName: workoutId, status: 'finished', startTime: start, endTime: start + 52 * 60_000, notes: '', updatedAt: start,
    exercises: [{ id: `${id}e`, exerciseId, state: 'logged', sets: sets.map(([reps, weight], i) => ({ id: `${id}${i}`, reps, weight, completed: true })) }],
  };
}

const base = (): AppData => ({
  exercises: [{ id: 'bench', name: 'Bench press', isCardio: false }, { id: 'run', name: 'Treadmill walk', isCardio: true }],
  workouts: [
    { id: 'push', name: 'Push day', order: 0, hideFromHome: false, items: [] },
    { id: 'pull', name: 'Pull day', order: 1, hideFromHome: false, items: [] },
    { id: 'legs', name: 'Leg day', order: 2, hideFromHome: true, items: [] },
  ],
  sessions: [],
  goals: [],
  settings: { units: 'kg_kmh', theme: 'auto' },
});

describe('formatting', () => {
  it('uses a decimal comma and a thousands dot', () => {
    expect(num(82.5)).toBe('82,5');
    expect(int(8420)).toBe('8.420');
    expect(sp(6, 'kg_kmh')).toBe('6,0');
    expect(volume(8420, 'kg_kmh')).toBe('8.420 kg');
  });

  it('writes dates with lowercase months', () => {
    const sat = new Date(2026, 8, 12, 18, 4).getTime();
    expect(dateLong(sat)).toBe('Saturday, 12 september');
    expect(dateRow(sat)).toBe('Sat 12 sep');
    expect(dayMonth(sat)).toBe('12 september');
    expect(monthLabel(sat, sat)).toBe('September');
    expect(monthLabel(sat, new Date(2027, 0, 1).getTime())).toBe('September 2026');
  });

  it('says how long ago a workout was done', () => {
    const now = new Date(2026, 8, 21, 9).getTime();
    expect(lastDone(new Date(2026, 8, 12, 18).getTime(), now)).toBe('Last done 9 days ago');
  });

  it('converts units for display', () => {
    expect(w(100, 'lbs_mph')).toBe('220,5');
  });
});

describe('calculations', () => {
  it('volume is the sum of weight × reps', () => {
    expect(sessionVolume(session('a', 0, 'push', [[10, 50], [8, 60]]))).toBe(980);
  });

  it('finds heaviest and most-reps PRs, never on the first log', () => {
    const d = base();
    d.sessions = [session('a', 0, 'push', [[10, 50]]), session('b', 7, 'push', [[8, 52.5]]), session('c', 14, 'push', [[12, 40]])];
    const prs = allPRs(d);
    expect(prs).toEqual([
      expect.objectContaining({ sessionId: 'b', type: 'heaviest', value: 52.5 }),
      expect.objectContaining({ sessionId: 'c', type: 'most_reps', value: 12 }),
    ]);
  });

  it('never gives cardio a PR', () => {
    const d = base();
    d.sessions = [session('a', 0, 'push', [[10, 50]], 'run'), session('b', 7, 'push', [[12, 60]], 'run')];
    expect(allPRs(d)).toEqual([]);
  });

  it('suggests the workout done longest ago, skipping hidden ones', () => {
    const d = base();
    d.sessions = [session('a', 0, 'push', [[10, 50]]), session('b', 3, 'pull', [[10, 50]])];
    expect(suggestedWorkout(d)?.id).toBe('push');
    d.workouts[0].hideFromHome = true;
    expect(suggestedWorkout(d)?.id).toBe('pull');
  });

  it('suggests a never-done workout first', () => {
    const d = base();
    d.sessions = [session('a', 0, 'push', [[10, 50]])];
    expect(suggestedWorkout(d)?.id).toBe('pull');
  });

  it('completes a goal once a logged set reaches the target', () => {
    const d = base();
    d.sessions = [session('a', 0, 'push', [[5, 80]])];
    d.goals = [{ id: 'g', exerciseId: 'bench', targetValue: 100, deadline: '2026-12-31', createdAt: t0 }];
    expect(goalCurrent(d, d.goals[0])).toBe(80);
    syncGoals(d);
    expect(d.goals[0].completedAt).toBeUndefined();
    d.sessions.push(session('b', 7, 'push', [[1, 100]]));
    syncGoals(d, 123);
    expect(d.goals[0].completedAt).toBe(123);
  });

  it('seeds suggestions from the last session, else from targets', () => {
    const d = base();
    const ex = d.exercises[0];
    expect(seedSets(d, ex, [{ reps: 12 }, { reps: 10 }]).map((s) => [s.reps, s.weight])).toEqual([[12, undefined], [10, undefined]]);
    d.sessions = [session('a', 0, 'push', [[8, 70], [6, 72.5]])];
    expect(seedSets(d, ex, [{ reps: 12 }, { reps: 10 }, { reps: 8 }]).map((s) => [s.reps, s.weight])).toEqual([[8, 70], [6, 72.5], [6, 72.5]]);
  });

  it('writes the copy lines', () => {
    const d = base();
    d.sessions = [session('a', 0, 'push', [[12, 70], [10, 70], [8, 70]]), session('b', 7, 'push', [[12, 75]])];
    expect(lastTimeText(d, 'bench', false, 'kg_kmh')).toBe(`Last time: 12${SEP}75 kg${SEP}PR 75`);
    d.sessions.push(session('c', 9, 'push', [[12, 70], [10, 70], [8, 70]]));
    expect(lastTimeText(d, 'bench', false, 'kg_kmh')).toBe(`Last time: 12/10/8${SEP}70 kg${SEP}PR 75`);
    expect(loggedText([{ id: 'x', reps: 12, weight: 100, completed: true }, { id: 'y', reps: 10, weight: 100, completed: true }], false, 'kg_kmh')).toBe(`12-10${SEP}100 kg`);
    expect(targetsText(d.exercises[1], [{ duration: 10, speed: 6 }], 'kg_kmh')).toBe(`10 min${SEP}6,0 km/h`);
    expect(heaviestFor(d, 'bench')).toMatchObject({ weight: 75, reps: 12 });
  });

  it('starts with default reps (never empty) for an exercise with no history and no target', () => {
    const d = base();
    const sets = seedSets(d, d.exercises[0], undefined, 1);
    expect(sets).toHaveLength(1);
    expect(sets[0].reps).toBe(10);
    expect(sets[0].weight).toBeUndefined();
    const cardio = seedSets(d, d.exercises[1], undefined, 1)[0];
    expect([cardio.duration, cardio.speed]).toEqual([10, 6]);
  });

  it('no middle dots appear in any generated text', () => {
    const d = base();
    d.sessions = [session('a', 0, 'push', [[12, 70], [10, 70]])];
    const texts = [
      targetsText(d.exercises[0], [{ reps: 12 }, { reps: 10 }], 'kg_kmh'),
      loggedText(d.sessions[0].exercises[0].sets, false, 'kg_kmh'),
      lastTimeText(d, 'bench', false, 'kg_kmh') ?? '',
    ];
    for (const x of texts) expect(x).not.toContain('·');
  });

  it('builds one bar per month including empty months', () => {
    const d = base();
    d.sessions = [session('a', 0, 'push', [[10, 60]]), session('b', 62, 'push', [[10, 65]])];
    const bars = chartBars(d, 'bench', 'month', t0 + 62 * DAY);
    expect(bars.map((b) => [b.label, b.value])).toEqual([['Sep', 60], ['Oct', undefined], ['Nov', 65]]);
  });
});
