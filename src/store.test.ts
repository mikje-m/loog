import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  addToSession, createExercise, createWorkout, getData, logExercise, removeFromSession, reorderTodo, saveItem, startWorkout, updateSet,
} from './store';
import { openSession, workoutById } from './calc';

let workoutId = '';
const ids: Record<string, string> = {};

beforeAll(() => {
  for (const name of ['Bench press', 'Incline press', 'Curl', 'Cable row']) ids[name] = createExercise({ name, isCardio: false });
  workoutId = createWorkout('Push day');
  saveItem(workoutId, undefined, ids['Bench press'], [{ reps: 12 }, { reps: 10 }]);
  saveItem(workoutId, undefined, ids['Incline press'], [{ reps: 12 }]);
  saveItem(workoutId, undefined, ids.Curl, [{ reps: 15 }]);
});

const items = () => workoutById(getData(), workoutId)!.items.map((i) => i.exerciseId);
const names = () => items().map((id) => getData().exercises.find((e) => e.id === id)!.name);

describe('the workout follows the session', () => {
  it('an exercise added mid-workout joins the workout, and takes what you did as its targets', () => {
    expect(startWorkout(workoutId)).toBeTruthy();
    addToSession(ids['Cable row']);
    expect(names()).toEqual(['Bench press', 'Incline press', 'Curl', 'Cable row']);

    const added = openSession(getData())!.exercises.find((e) => e.exerciseId === ids['Cable row'])!;
    expect(added.itemId).toBeTruthy();
    // one row to start, then the user adds a second set and logs both
    updateSet(added.id, added.sets[0].id, { weight: 40 });
    const sets = openSession(getData())!.exercises.find((e) => e.id === added.id)!.sets;
    expect(sets[0].reps).toBe(10);
    logExercise(added.id);
    const item = workoutById(getData(), workoutId)!.items.find((i) => i.id === added.itemId)!;
    expect(item.sets).toEqual([{ reps: 10 }]);
  });

  it('reordering what is left to do changes the workout order', () => {
    const s = openSession(getData())!;
    const todo = s.exercises.filter((e) => e.state === 'todo').map((e) => e.id);
    reorderTodo([...todo].reverse());
    expect(names()).toEqual(['Curl', 'Incline press', 'Bench press', 'Cable row']);
  });

  it('removing an exercise removes it from the workout', () => {
    const s = openSession(getData())!;
    const incline = s.exercises.find((e) => e.exerciseId === ids['Incline press'])!;
    removeFromSession(incline.id);
    expect(names()).toEqual(['Curl', 'Bench press', 'Cable row']);
  });
});
