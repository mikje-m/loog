import { useEffect, useRef, useState } from 'react';
import { Navigate, useBlocker, useNavigate, useParams } from 'react-router-dom';
import {
  addSet, addToSession, completeWorkout, discardSession, logExercise, removeFromSession, reorderTodo, setCurrent, setNotes, skipExercise,
  swapExercise, updateSet, useData,
} from '../store';
import {
  exerciseById, goalProgress, heaviestFor, isComplete, lastTimeText, loggedText, openSession, prsForSession, recentFor, sessionById,
  sessionDuration, sessionName, sessionVolume, todoText, topWeight,
} from '../calc';
import {
  facts, dateLong, dayMonthShort, duration, fixed1, fromDisplaySpeed, fromDisplayWeight, num, speedHeader, speedStep, timeRange, toDisplaySpeed,
  toDisplayWeight, volume, w, weightStep, weightUnit, wu,
} from '../format';
import type { AppData, LoggedExercise, Session } from '../types';
import { Icon } from '../ui/Icon';
import {
  AddRow, Button, Header, IconButton, ListCard, Main, NotesField, Pinned, ProgressBar, ProgressRing, Row, Section, Sheet, SheetAction, Stepper,
} from '../ui/components';
import { SortableList } from '../ui/Sortable';
import { DiscardDialog } from './Home';
import { ExercisePicker } from './Workouts';

const resolvedCount = (s: Session) => s.exercises.filter((e) => e.state !== 'todo').length;

// ---- Live session (4.4) ------------------------------------------------------------------------

export function LiveSession() {
  const d = useData();
  const nav = useNavigate();
  const [sheet, setSheet] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // Set while we leave on purpose, so the "no open session" redirect does not race our own navigation.
  const leaving = useRef(false);

  // The only ways out are Workout completed or the X (handoff 4.0). The system Back button (Android back,
  // Samsung back gesture) therefore opens the Discard dialog instead of leaving.
  // TODO(Mike): Back is not specified in the handoff; this treats it like the X.
  const modalOpen = sheet || discard;
  const blocker = useBlocker(
    ({ historyAction, nextLocation }) =>
      historyAction === 'POP' && !leaving.current && !modalOpen && !nextLocation.pathname.startsWith('/session'),
  );
  useEffect(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
      setDiscard(true);
    }
  }, [blocker]);

  const s = openSession(d);
  if (!s) return leaving.current ? null : <Navigate to="/" replace />;

  const u = d.settings.units;
  const logged = s.exercises.filter((e) => e.state === 'logged').length;
  const cur = s.exercises.find((e) => e.id === s.currentId) ?? s.exercises.find((e) => e.state === 'todo') ?? s.exercises[0];
  const todo = s.exercises.filter((e) => e.state === 'todo' && e.id !== cur?.id);
  const completed = s.exercises.filter((e) => e.state !== 'todo' && e.id !== cur?.id);

  const header = (
    <Header
      title={sessionName(d, s)} titleText="" date={dateLong(s.startTime)}
      onClose={() => setDiscard(true)} closeLabel="Discard workout"
      right={<ProgressRing done={resolvedCount(s)} total={s.exercises.length} />}
    />
  );

  const discardDialog = discard && (
    <DiscardDialog
      logged={logged} onKeep={() => setDiscard(false)}
      onDiscard={() => { leaving.current = true; discardSession(); nav('/', { replace: true }); }}
    />
  );

  const finish = () => {
    leaving.current = true;
    const id = completeWorkout();
    nav(id ? `/session/finish/${id}` : '/', { replace: true });
  };

  if (!cur) {
    // Every exercise was removed from the session.
    return (
      <>
        {header}
        <Main variant="live"><AddRow onClick={() => nav('/session/add')}>Add exercise</AddRow></Main>
        {discardDialog}
      </>
    );
  }

  const ex = exerciseById(d, cur.exerciseId);
  const cardio = !!ex?.isCardio;
  const last = lastTimeText(d, cur.exerciseId, cardio, u);
  const ready = cur.state !== 'todo' || cur.sets.every((set) => isComplete(set, cardio));
  const lastOne = todo.length === 0;

  return (
    <>
      {header}
      <Main variant="live">
        <Section first>Exercises {s.exercises.indexOf(cur) + 1}/{s.exercises.length}</Section>
        <div className="ft-card ft-card--gap12 slide-in" key={cur.id}>
          <div className="live-card__top">
            <div className="live-card__names">
              <span className="live-card__name">{ex?.name}</span>
              {/* TODO(Mike): open question 12 — the line is hidden the first time an exercise is logged. */}
              {last && <span className="live-card__last">{last}</span>}
            </div>
            <IconButton icon="ellipsis" variant="opt" label="Exercise options" onClick={() => setSheet(true)} />
          </div>
          <div className="ft-sets">
            <div className="ft-setrow">
              <span />
              <span className="ft-setrow__h">{cardio ? 'Minutes' : 'Reps'}</span>
              <span className="ft-setrow__h">{cardio ? speedHeader(u) : `Weight (${weightUnit(u)})`}</span>
            </div>
            {cur.sets.map((set, i) => (
              <div className="ft-setrow" key={set.id}>
                <span className="ft-setrow__n">{i + 1}</span>
                {cardio ? (
                  <>
                    <Stepper label={`Set ${i + 1} minutes`} value={set.duration} suggested={!set.edited?.duration} step={1} format={num} onChange={(v) => updateSet(cur.id, set.id, { duration: v })} />
                    <Stepper
                      label={`Set ${i + 1} speed`} decimal value={set.speed == null ? undefined : toDisplaySpeed(set.speed, u)} suggested={!set.edited?.speed}
                      step={speedStep} format={fixed1} onChange={(v) => updateSet(cur.id, set.id, { speed: v == null ? undefined : fromDisplaySpeed(v, u) })}
                    />
                  </>
                ) : (
                  <>
                    <Stepper label={`Set ${i + 1} reps`} value={set.reps} suggested={!set.edited?.reps} step={1} format={num} onChange={(v) => updateSet(cur.id, set.id, { reps: v })} />
                    <Stepper
                      label={`Set ${i + 1} weight`} decimal value={set.weight == null ? undefined : toDisplayWeight(set.weight, u)} suggested={!set.edited?.weight}
                      step={weightStep(u)} format={num} onChange={(v) => updateSet(cur.id, set.id, { weight: v == null ? undefined : fromDisplayWeight(v, u) })}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <AddRow onClick={() => addSet(cur.id)}>Add set</AddRow>
          {/* TODO(Mike): open question 20 — no hint says which value is missing while Log is disabled. */}
          {lastOne
            ? <Button icon="check" disabled={!ready} onClick={finish}>Workout completed</Button>
            : <Button icon="check" disabled={!ready} onClick={() => logExercise(cur.id)}>Log</Button>}
        </div>

        {todo.length > 0 && (
          <>
            <Section>To do</Section>
            <ListCard>
              {todo.map((e) => {
                const open = expanded === e.id;
                return (
                  <div key={e.id}>
                    <Row
                      title={exerciseById(d, e.exerciseId)?.name ?? ''} sub={todoText(d, s, e, u)} onClick={() => setCurrent(e.id)}
                      trail={
                        // TODO(Mike): open question 11 — "Last 5 times" opens inline under the row; not drawn in hi-fi.
                        <button type="button" className="ft-iconbtn ft-iconbtn--ghost" aria-expanded={open} aria-label={`Last 5 times for ${exerciseById(d, e.exerciseId)?.name}`} onClick={() => setExpanded(open ? null : e.id)}>
                          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={20} />
                        </button>
                      }
                    />
                    {open && <LastFive d={d} exerciseId={e.exerciseId} />}
                  </div>
                );
              })}
            </ListCard>
          </>
        )}
        <div className="gap-12" />
        <AddRow onClick={() => nav('/session/add')}>Add exercise</AddRow>

        <Section>Notes</Section>
        <NotesField value={s.notes} onChange={(v) => setNotes(s.id, v)} />

        {completed.length > 0 && (
          <>
            <Section>Completed</Section>
            <ListCard>
              {completed.map((e) => {
                const x = exerciseById(d, e.exerciseId);
                return (
                  <Row
                    key={e.id} done onClick={() => setCurrent(e.id)} title={x?.name ?? ''}
                    // TODO(Mike): open question 19 — a skipped exercise shows a muted "Skipped" subtitle and no check.
                    sub={e.state === 'skipped' ? 'Skipped' : loggedText(e.sets, !!x?.isCardio, u)}
                    check={e.state === 'logged'}
                  />
                );
              })}
            </ListCard>
          </>
        )}
      </Main>

      {sheet && (
        <Sheet title={ex?.name ?? ''} onClose={() => setSheet(false)}>
          <SheetAction onClick={() => nav(`/session/swap/${cur.id}`)}>Swap for another exercise</SheetAction>
          <SheetAction onClick={() => nav('/session/reorder')}>Reorder exercises</SheetAction>
          <SheetAction onClick={() => { skipExercise(cur.id); setSheet(false); }}>Skip this exercise</SheetAction>
          <SheetAction danger onClick={() => { removeFromSession(cur.id); setSheet(false); }}>Remove from workout</SheetAction>
        </Sheet>
      )}
      {discardDialog}
    </>
  );
}

/** "Last 5 times": date | set 1 | set 2 | ... | kg. */
function LastFive({ d, exerciseId }: { d: AppData; exerciseId: string }) {
  const rows = recentFor(d, exerciseId, 5);
  const u = d.settings.units;
  const cardio = !!exerciseById(d, exerciseId)?.isCardio;
  if (rows.length === 0) return <p className="ft-expand muted" style={{ fontSize: 13, lineHeight: '18px' }}>No history yet</p>;
  if (cardio) {
    return (
      <div className="ft-expand hist-grid" style={{ gridTemplateColumns: '1.6fr 1fr 1fr' }}>
        <span className="h">Date</span><span className="h">Minutes</span><span className="h">{speedHeader(u)}</span>
        {rows.map((r) => [
          <span key={`${r.session.id}d`} className="d">{dayMonthShort(r.session.startTime)}</span>,
          <span key={`${r.session.id}m`} className="v">{num(r.logged.sets[0]?.duration ?? 0)}</span>,
          <span key={`${r.session.id}s`} className="v">{fixed1(toDisplaySpeed(r.logged.sets[0]?.speed ?? 0, u))}</span>,
        ])}
      </div>
    );
  }
  const n = Math.max(...rows.map((r) => r.logged.sets.length));
  return (
    <div className="ft-expand hist-table">
      <div className="hist-grid" style={{ gridTemplateColumns: `minmax(64px, 1.6fr) repeat(${n}, minmax(28px, 1fr)) minmax(44px, 1.1fr)` }}>
        <span className="h">Date</span>
        {Array.from({ length: n }, (_, i) => <span key={i} className="h">{i + 1}</span>)}
        <span className="h">{weightUnit(u)}</span>
        {rows.map((r) => [
          <span key={`${r.session.id}d`} className="d">{dayMonthShort(r.session.startTime)}</span>,
          ...Array.from({ length: n }, (_, i) => <span key={`${r.session.id}${i}`} className="v">{r.logged.sets[i]?.reps ?? ''}</span>),
          <span key={`${r.session.id}w`} className="v">{(() => { const t = topWeight(r.logged.sets); return t != null ? w(t, u) : ''; })()}</span>,
        ])}
      </div>
    </div>
  );
}

// ---- Picker reuse: add / swap ---------------------------------------------------------------------

export function SessionAdd() {
  const nav = useNavigate();
  return (
    <ExercisePicker back="/session" newTo="/exercises/new?then=session" onPick={(id) => { addToSession(id); nav('/session', { replace: true }); }} />
  );
}

export function SessionSwap() {
  const { logged = '' } = useParams();
  const nav = useNavigate();
  return (
    <ExercisePicker
      back="/session" newTo={`/exercises/new?then=swap&logged=${logged}`}
      onPick={(id) => { swapExercise(logged, id); nav('/session', { replace: true }); }}
    />
  );
}

// ---- Reorder exercises (4.4.5) ---------------------------------------------------------------------------

export function ReorderExercises() {
  const d = useData();
  const nav = useNavigate();
  const s = openSession(d);
  const [order, setOrder] = useState<string[] | null>(null);
  if (!s) return <Navigate to="/" replace />;
  const u = d.settings.units;
  const todo = s.exercises.filter((e) => e.state === 'todo');
  const ids = order ?? todo.map((e) => e.id);
  const items = ids.map((id) => todo.find((e) => e.id === id)).filter((e): e is LoggedExercise => !!e);
  const done = s.exercises.filter((e) => e.state !== 'todo');

  return (
    <>
      {/* *(assumed)* the X closes without saving. */}
      <Header title="Reorder exercises" onClose={() => nav('/session', { replace: true })} />
      <Main variant="pinned">
        {done.length > 0 && (
          <>
            <Section first>Completed</Section>
            <ListCard>
              {done.map((e) => {
                const x = exerciseById(d, e.exerciseId);
                return <Row key={e.id} done title={x?.name ?? ''} sub={e.state === 'skipped' ? 'Skipped' : loggedText(e.sets, !!x?.isCardio, u)} check={e.state === 'logged'} />;
              })}
            </ListCard>
          </>
        )}
        <Section first={done.length === 0}>To do</Section>
        {items.length > 0 && (
          <ListCard>
            <SortableList
              items={items} onReorder={setOrder}
              render={(e, { handle, lifted }) => (
                <Row lead={handle} title={exerciseById(d, e.exerciseId)?.name ?? ''} sub={todoText(d, s, e, u)} className={lifted ? 'ft-row--lifted' : ''} />
              )}
            />
          </ListCard>
        )}
      </Main>
      <Pinned noTab><Button icon="check" onClick={() => { reorderTodo(ids); nav('/session', { replace: true }); }}>Save</Button></Pinned>
    </>
  );
}

// ---- Finish summary (4.4.8) ---------------------------------------------------------------------------------

export function FinishSummary() {
  const { id = '' } = useParams();
  const d = useData();
  const nav = useNavigate();
  const s = sessionById(d, id);
  if (!s || s.status !== 'finished' || s.endTime == null) return <Navigate to="/" replace />;
  const u = d.settings.units;
  const prs = prsForSession(d, s.id);
  const exercises = s.exercises.filter((e) => e.state === 'logged');

  // Goals this session moved: pink up to where it was before, green for what this session added.
  const before = (x: Session) => x.startTime < s.startTime;
  const upTo = (x: Session) => x.startTime <= s.startTime;
  const moved = d.goals
    .filter((g) => exercises.some((e) => e.exerciseId === g.exerciseId))
    .map((g) => {
      const prev = heaviestFor(d, g.exerciseId, before)?.weight;
      const now = heaviestFor(d, g.exerciseId, upTo)?.weight;
      return { g, prev, now };
    })
    .filter((x) => (x.now ?? 0) > (x.prev ?? 0));

  return (
    <>
      <Header title={`${sessionName(d, s)} done`} date={dateLong(s.startTime)} right={<ProgressRing done={s.exercises.length} total={s.exercises.length} />} />
      <Main variant="pinned">
        <div className="ft-stats">
          <div className="ft-stat">
            <span className="ft-stat__label">Time</span>
            <span className="ft-stat__group">
              <span className="ft-stat__value">{duration(sessionDuration(s))}</span>
              <span className="ft-stat__label">{timeRange(s.startTime, s.endTime)}</span>
            </span>
          </div>
          <div className="ft-stat">
            <span className="ft-stat__label">Volume</span>
            <span className="ft-stat__value">{volume(sessionVolume(s), u)}</span>
          </div>
        </div>

        {prs.length > 0 && (
          <>
            <div className="gap-8" />
            {/* TODO(Mike): open question 14 — several PRs are listed in one green card. */}
            <div className="ft-card ft-card--pr pop-in">
              <Icon name="trophy" size={24} />
              <div className="pr__text">
                <span className="pr__title">New PR</span>
                {prs.map((p) => (
                  <span key={`${p.exerciseId}${p.type}`} className="pr__detail">
                    {facts(exerciseById(d, p.exerciseId)?.name, p.type === 'heaviest' ? wu(p.value, u) : `${p.value} reps`)}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <Section>Notes</Section>
        <NotesField value={s.notes} onChange={(v) => setNotes(s.id, v)} />

        <Section>Exercises</Section>
        <ListCard>
          {exercises.map((e) => {
            const x = exerciseById(d, e.exerciseId);
            return <Row key={e.id} done title={x?.name ?? ''} sub={loggedText(e.sets, !!x?.isCardio, u)} check />;
          })}
        </ListCard>

        {moved.length > 0 && (
          <>
            <Section>Goal</Section>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {moved.map(({ g, prev, now }) => (
                <div className="ft-card" key={g.id}>
                  <div className="goal__line">
                    <span className="set-pref__title">{exerciseById(d, g.exerciseId)?.name}</span>
                    <span className="goal__frac">{w(now ?? 0, u)} / {wu(g.targetValue, u)}</span>
                  </div>
                  <ProgressBar
                    label={`${exerciseById(d, g.exerciseId)?.name} goal`}
                    value={goalProgress(prev, g)} gain={goalProgress(now, g) - goalProgress(prev, g)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </Main>
      <Pinned noTab><Button icon="check" onClick={() => nav('/', { replace: true })}>Done</Button></Pinned>
    </>
  );
}
