import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  addToSession, swapExercise, createExercise, createWorkout, deleteExercise, deleteWorkout, duplicateWorkout, removeItem, renameWorkout, reorderItems, reorderWorkouts,
  saveItem, setHideFromHome, startWorkout, updateExercise, useData,
} from '../store';
import { exerciseById, exerciseImpact, lastPerformed, openSession, sortedWorkouts, targetsText, workoutById } from '../calc';
import {
  agoShort, facts, fixed1, fromDisplaySpeed, num, plural, speedStep, speedUnit, toDisplaySpeed,
} from '../format';
import type { PlannedSet } from '../types';
import { Icon } from '../ui/Icon';
import {
  AddRow, Button, CheckRow, DangerRow, Dialog, EmptyState, Header, IconButton, Label, ListCard, Main, Pinned, PlayButton, Row, Section,
  SelectField, Stepper, TextField, ToggleRow,
} from '../ui/components';
import { SortableList } from '../ui/Sortable';

const exercisesCount = (n: number) => plural(n, 'exercise', 'exercises');

// ---- My workouts (4.3.1) ---------------------------------------------------------------------

export function WorkoutList() {
  const d = useData();
  const nav = useNavigate();
  const workouts = sortedWorkouts(d);
  const pinned = <Pinned><Button icon="plus" onClick={() => nav('/workouts/new')}>New workout</Button></Pinned>;

  const start = (id: string) => {
    // TODO(Mike): only one session can be open; while one is, play resumes it instead of starting another.
    if (openSession(d)) return nav('/session');
    if (startWorkout(id)) nav('/session');
    else nav(`/workouts/${id}`);
  };

  if (workouts.length === 0) {
    return (
      <div className="empty-screen">
        <Header title="My workouts" />
        <EmptyState title="No workouts yet" text="When you create a workout, it'll show up here." />
        {pinned}
      </div>
    );
  }

  return (
    <>
      <Header title="My workouts" />
      <Main variant="pinned-tab">
        <ListCard>
          <SortableList
            items={workouts}
            onReorder={reorderWorkouts}
            render={(x, { handle, lifted }) => {
              const t = lastPerformed(d, x.id);
              return (
                <Row
                  pick lead={handle} title={x.name} to={`/workouts/${x.id}`} className={lifted ? 'ft-row--lifted' : ''}
                  sub={t != null ? facts(exercisesCount(x.items.length), agoShort(t)) : exercisesCount(x.items.length)}
                  trail={<PlayButton label={`Start ${x.name}`} onClick={() => start(x.id)} />}
                />
              );
            }}
          />
        </ListCard>
      </Main>
      {pinned}
    </>
  );
}

// ---- Create new workout (4.3.2) ------------------------------------------------------------------

export function CreateWorkout() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const create = () => {
    if (!name.trim()) return;
    nav(`/workouts/${createWorkout(name.trim())}`, { replace: true });
  };
  return (
    <>
      <Header title="Create new workout" back="/workouts" />
      <Main variant="pinned-tab">
        <Label htmlFor="name">Name</Label>
        <TextField id="name" value={name} onChange={setName} autoFocus onEnter={create} />
      </Main>
      <Pinned><Button icon="plus" disabled={!name.trim()} onClick={create}>Create</Button></Pinned>
    </>
  );
}

// ---- Duplicate workout (4.3.3) --------------------------------------------------------------------

export function DuplicateWorkout() {
  const { id = '' } = useParams();
  const d = useData();
  const nav = useNavigate();
  const src = workoutById(d, id);
  const [name, setName] = useState(src ? `${src.name} copy` : '');
  if (!src) return <Navigate to="/workouts" replace />;
  const create = () => {
    if (!name.trim()) return;
    const newId = duplicateWorkout(src.id, name.trim());
    if (newId) nav(`/workouts/${newId}`, { replace: true });
  };
  return (
    <>
      <Header title={`Duplicate ${src.name}`} back={`/workouts/${src.id}`} />
      <Main variant="pinned-tab">
        <Label htmlFor="name">Name</Label>
        <TextField id="name" value={name} onChange={setName} autoFocus selectOnFocus onEnter={create} />
        {src.items.length > 0 && (
          <>
            <Section>Preview</Section>
            <ListCard>
              {src.items.map((i) => {
                const ex = exerciseById(d, i.exerciseId);
                return <Row key={i.id} title={ex?.name ?? ''} sub={targetsText(ex, i.sets, d.settings.units)} />;
              })}
            </ListCard>
          </>
        )}
      </Main>
      <Pinned><Button icon="plus" disabled={!name.trim()} onClick={create}>Create</Button></Pinned>
    </>
  );
}

// ---- Workout editor (4.3.4) --------------------------------------------------------------------------

export function WorkoutEditor() {
  const { id = '' } = useParams();
  const d = useData();
  const nav = useNavigate();
  const [renaming, setRenaming] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const wk = workoutById(d, id);
  if (!wk) return <Navigate to="/workouts" replace />;

  // TODO(Mike): open question 25 — renaming is an inline edit of the title.
  const title = renaming ? (
    <input
      className="hdr__input" autoFocus defaultValue={wk.name} maxLength={60} aria-label="Workout name"
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => { const v = e.target.value.trim(); if (v) renameWorkout(wk.id, v); setRenaming(false); }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming(false); }}
    />
  ) : (
    <button type="button" className="hdr__rename" onClick={() => setRenaming(true)} aria-label={`Rename ${wk.name}`}>
      <h1 className="hdr__title">{wk.name}</h1>
      <Icon name="pencil" size={20} />
    </button>
  );

  return (
    <>
      <Header
        title={title} back="/workouts"
        right={
          <>
            <IconButton icon="copy" label="Duplicate workout" to={`/workouts/${wk.id}/duplicate`} />
            <IconButton icon="trash-2" label="Delete workout" onClick={() => setConfirm(true)} />
          </>
        }
      />
      <Main variant="pinned-tab">
        {wk.items.length > 0 && (
          <>
            <ListCard>
              <SortableList
                items={wk.items}
                onReorder={(ids) => reorderItems(wk.id, ids)}
                render={(item, { handle, lifted }) => {
                  const ex = exerciseById(d, item.exerciseId);
                  return (
                    <Row
                      lead={handle} title={ex?.name ?? ''} sub={targetsText(ex, item.sets, d.settings.units)} chevron
                      to={`/workouts/${wk.id}/items/${item.id}`} className={lifted ? 'ft-row--lifted' : ''}
                    />
                  );
                }}
              />
            </ListCard>
            <div className="gap-16" />
          </>
        )}
        <ToggleRow label="Hide from home" checked={wk.hideFromHome} onChange={(v) => setHideFromHome(wk.id, v)} />
      </Main>
      <Pinned><Button icon="plus" onClick={() => nav(`/workouts/${wk.id}/add`)}>Add exercise</Button></Pinned>

      {confirm && (
        // TODO(Mike): open question 9 — delete-workout confirm copy is not designed.
        <Dialog title="Delete this workout?" text={`${wk.name} will be removed. Your history stays.`} onClose={() => setConfirm(false)}>
          <Button variant="neutral" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button icon="trash-2" variant="danger" onClick={() => { deleteWorkout(wk.id); nav('/workouts', { replace: true }); }}>Delete</Button>
        </Dialog>
      )}
    </>
  );
}

// ---- Add exercise picker (4.3.5) ------------------------------------------------------------------------

/** Shared by the Workout editor and the live session (add / swap). */
export function ExercisePicker({ back, newTo, onPick }: { back: string; newTo: string; onPick: (exerciseId: string) => void }) {
  const d = useData();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const all = [...d.exercises].sort((a, b) => a.name.localeCompare(b.name));
  const list = all.filter((e) => e.name.toLowerCase().includes(q.trim().toLowerCase()));
  const pinned = <Pinned><Button icon="plus" onClick={() => nav(newTo)}>New exercise</Button></Pinned>;

  if (all.length === 0) {
    return (
      <div className="empty-screen">
        <Header title="Add exercise" back={back} />
        <EmptyState title="No exercises yet" text="When you create exercises, you'll find a list of them here." />
        {pinned}
      </div>
    );
  }
  return (
    <>
      <Header title="Add exercise" back={back} />
      <Main variant="pinned-tab">
        <TextField value={q} onChange={setQ} placeholder="Search" inputMode="search" label="Search" trail={<Icon name="search" size={20} />} />
        <Section>Choose existing exercise</Section>
        {list.length > 0 && (
          <ListCard>
            {list.map((e) => (
              <Row
                key={e.id} title={e.name} chevron onClick={() => onPick(e.id)}
                sub={e.isCardio ? 'Cardio' : facts(e.muscleGroup, e.equipment)}
              />
            ))}
          </ListCard>
        )}
      </Main>
      {pinned}
    </>
  );
}

export function AddToWorkout() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  return (
    <ExercisePicker
      back={`/workouts/${id}`} newTo={`/exercises/new?then=targets&workout=${id}`}
      onPick={(e) => nav(`/workouts/${id}/items/new?exercise=${e}`, { replace: true })}
    />
  );
}

// ---- Create / edit exercise (4.3.6) -------------------------------------------------------------------------

// Open question 4, decided by Mike (feedback round 3): a specific muscle list. Equipment stays as it was.
// Naming rule: the exercise name leaves out the equipment ("Bench Press" + Barbell), except cable exercises,
// which keep "Cable" in the name ("Cable Lateral Raise" next to the dumbbell "Lateral Raise").
export const MUSCLE_GROUPS = [
  'Chest', 'Lats', 'Upper back', 'Lower back', 'Front delts', 'Side delts', 'Rear delts', 'Biceps', 'Triceps', 'Forearms',
  'Quads', 'Hamstrings', 'Glutes', 'Adductors', 'Abductors', 'Calves', 'Core', 'Full body', 'Other',
];
export const EQUIPMENT = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Band', 'Other'];

export function ExerciseForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const d = useData();
  const nav = useNavigate();
  const existing = id ? exerciseById(d, id) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [cardio, setCardio] = useState(existing?.isCardio ?? false);
  const [muscle, setMuscle] = useState(existing?.muscleGroup ?? '');
  const [equipment, setEquipment] = useState(existing?.equipment ?? '');
  const [confirm, setConfirm] = useState(false);
  if (id && !existing) return <Navigate to="/workouts" replace />;

  const then = params.get('then');
  const workoutId = params.get('workout');
  const back = then === 'targets' && workoutId ? `/workouts/${workoutId}/add` : then === 'session' ? '/session/add' : then === 'swap' ? `/session/swap/${params.get('logged')}` : '/workouts';
  const valid = name.trim().length > 0;
  const values = () => ({
    name: name.trim(), isCardio: cardio,
    muscleGroup: cardio ? undefined : muscle || undefined,
    equipment: cardio ? undefined : equipment || undefined,
  });

  const submit = () => {
    if (!valid) return;
    if (existing) {
      updateExercise(existing.id, values());
      nav(-1);
      return;
    }
    const newId = createExercise(values());
    if (then === 'targets' && workoutId) nav(`/workouts/${workoutId}/items/new?exercise=${newId}`, { replace: true });
    else if (then === 'session') { addToSession(newId); nav('/session', { replace: true }); }
    else if (then === 'swap') { swapExercise(params.get('logged') ?? '', newId); nav('/session', { replace: true }); }
    else nav('/workouts', { replace: true });
  };

  const impact = existing ? exerciseImpact(d, existing.id) : { sessions: 0, prs: 0 };
  const unitHint = d.settings.units === 'kg_kmh' ? 'Logged in minutes and km/h' : 'Logged in minutes and mph';
  // An exercise saved with a value from an older list (e.g. "Legs") keeps it as an option, so editing never drops it.
  const options = (xs: string[], current: string) =>
    (current && !xs.includes(current) ? [...xs, current] : xs).map((x) => ({ value: x, label: x }));

  return (
    <>
      <Header
        // TODO(Mike): open question 5 — the Edit exercise screen is not drawn; it reuses Create with this title.
        title={existing ? 'Edit exercise' : 'Create exercise'} back={existing ? () => nav(-1) : back}
        right={existing && <IconButton icon="trash-2" label="Delete exercise" onClick={() => setConfirm(true)} />}
      />
      <Main variant="pinned-tab">
        <Label htmlFor="ex-name">Name</Label>
        <TextField id="ex-name" value={name} onChange={setName} autoFocus={!existing} />
        <div className="gap-16" />
        <CheckRow label="Cardio exercise" checked={cardio} onChange={setCardio} />
        {cardio ? (
          <p className="ft-hint">{unitHint}</p>
        ) : (
          <>
            <Label htmlFor="ex-muscle" spaced>Muscle group</Label>
            <SelectField id="ex-muscle" value={muscle} onChange={setMuscle} placeholder="Choose a muscle group" options={options(MUSCLE_GROUPS, muscle)} />
            <Label htmlFor="ex-equipment" spaced>Equipment</Label>
            <SelectField id="ex-equipment" value={equipment} onChange={setEquipment} placeholder="Choose equipment" options={options(EQUIPMENT, equipment)} />
          </>
        )}
      </Main>
      <Pinned>
        {existing
          ? <Button icon="check" disabled={!valid} onClick={submit}>Save</Button>
          : <Button icon="arrow-right" disabled={!valid} onClick={submit}>Next</Button>}
      </Pinned>

      {confirm && existing && (
        // TODO(Mike): open question 9 — delete-exercise confirm copy is not designed.
        <Dialog
          title="Delete this exercise?"
          text={impact.sessions > 0
            ? `${existing.name} is in ${plural(impact.sessions, 'session', 'sessions')} and has ${plural(impact.prs, 'PR', 'PRs')}. Deleting it removes them from your history.`
            : `${existing.name} will be removed from your workouts.`}
          onClose={() => setConfirm(false)}
        >
          <Button variant="neutral" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button icon="trash-2" variant="danger" onClick={() => { deleteExercise(existing.id); nav('/workouts', { replace: true }); }}>Delete</Button>
        </Dialog>
      )}
    </>
  );
}

// ---- Set targets (4.3.7) -------------------------------------------------------------------------------------

export function SetTargets() {
  const { id = '', item: itemId = '' } = useParams();
  const [params] = useSearchParams();
  const d = useData();
  const nav = useNavigate();
  const wk = workoutById(d, id);
  const isNew = itemId === 'new';
  const item = wk?.items.find((i) => i.id === itemId);
  const ex = exerciseById(d, isNew ? params.get('exercise') ?? '' : item?.exerciseId ?? '');
  const [draft, setDraft] = useState<PlannedSet[] | null>(null);
  if (!wk || !ex || (!isNew && !item)) return <Navigate to={wk ? `/workouts/${wk.id}` : '/workouts'} replace />;

  const u = d.settings.units;
  // *(assumed)* defaults for a newly added exercise: 3 sets of 10 reps, or 10 min at 6,0 km/h.
  const sets: PlannedSet[] = draft ?? (item?.sets.length ? item.sets : ex.isCardio ? [{ duration: 10, speed: 6 }] : [{ reps: 10 }, { reps: 10 }, { reps: 10 }]);
  const patch = (i: number, p: PlannedSet) => setDraft(sets.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const done = () => nav(`/workouts/${wk.id}`, { replace: true });

  return (
    <>
      <Header
        title={`${ex.name} sets`} back={`/workouts/${wk.id}`}
        // TODO(Mike): open question 27 — no entry point to edit an exercise is designed; this pencil opens Edit exercise.
        right={<IconButton icon="pencil" label={`Edit ${ex.name}`} to={`/exercises/${ex.id}/edit`} />}
      />
      <Main variant="pinned-tab">
        <Section first>Set a target for each set</Section>
        <div className="ft-card">
          {ex.isCardio ? (
            // TODO(Mike): open question 6 — the cardio variant of Set targets is not drawn.
            <>
              <div className="ft-target">
                <span className="ft-target__label">Time</span>
                <Stepper label="Minutes" value={sets[0].duration} step={1} min={1} format={num} onChange={(v) => patch(0, { duration: v ?? 1 })} />
                <span className="ft-target__spacer" />
              </div>
              <div className="ft-target">
                <span className="ft-target__label">Speed</span>
                <Stepper
                  label={`Speed in ${speedUnit(u)}`} decimal value={toDisplaySpeed(sets[0].speed ?? 0, u)} step={speedStep} format={fixed1}
                  onChange={(v) => patch(0, { speed: fromDisplaySpeed(v ?? 0, u) })}
                />
                <span className="ft-target__spacer" />
              </div>
            </>
          ) : (
            sets.map((s, i) => (
              <div className="ft-target" key={i}>
                <span className="ft-target__label">Set {i + 1}</span>
                <Stepper label={`Set ${i + 1} target reps`} value={s.reps} step={1} min={1} format={num} onChange={(v) => patch(i, { reps: v ?? 1 })} />
                {sets.length > 1
                  ? <IconButton icon="x" variant="ghost" label={`Remove set ${i + 1}`} onClick={() => setDraft(sets.filter((_, j) => j !== i))} />
                  : <span className="ft-target__spacer" />}
              </div>
            ))
          )}
        </div>
        {!ex.isCardio && (
          <>
            <div className="gap-12" />
            {/* *(assumed)* the new set copies the previous set's target. */}
            <AddRow onClick={() => setDraft([...sets, { reps: sets[sets.length - 1]?.reps ?? 10 }])}>Add set</AddRow>
          </>
        )}
        {!isNew && item && (
          <>
            <div className="gap-32" />
            <DangerRow onClick={() => { removeItem(wk.id, item.id); done(); }}>Remove from workout</DangerRow>
          </>
        )}
      </Main>
      <Pinned><Button icon="check" onClick={() => { saveItem(wk.id, item?.id, ex.id, sets); done(); }}>Save</Button></Pinned>
    </>
  );
}
