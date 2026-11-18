import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { discardSession, startWorkout, useData } from '../store';
import {
  finishedDesc, lastPerformed, loggedExercises, openSession, prsForSession, sessionName, sortedWorkouts, suggestedWorkout, yearStats,
} from '../calc';
import { agoShort, dateRow, facts, isoDay, lastDone, minutesAgo, plural, time, timeRange } from '../format';
import { Icon } from '../ui/Icon';
import {
  Button, Chip, Dialog, EmptyState, Header, IconButton, ListCard, Main, Pinned, PlayButton, PRPill, ProgressBar, Row, Section,
} from '../ui/components';

// One of three greetings, picked at random once per app launch (4.1, 8.8).
const GREETINGS = ['Welcome back', 'Ready to train?', "Let's get moving"];
const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

const MONTH_LABELS = ['Jan', 'Apr', 'Jul', 'Oct', 'Dec'];

/** Year overview (3.21): 52 week columns x 7 days of the current calendar year. */
function YearOverview() {
  const d = useData();
  const { year, count, days } = yearStats(d);
  const today = isoDay(Date.now());
  // TODO(Mike): open question 23 — the grid has 364 cells, so day 365 (and 366) are not shown.
  // Column-major: each column is a week. Drawn as SVG so it is exactly 310px on a 390px
  // phone and scales down (instead of overflowing) on narrower ones.
  const cells = Array.from({ length: 364 }, (_, i) => {
    const key = isoDay(new Date(year, 0, 1 + i).getTime());
    const cls = key === today ? 'today' : days.has(key) ? 'on' : '';
    return <rect key={key} className={cls} x={Math.floor(i / 7) * 6} y={(i % 7) * 6} width="4" height="4" rx="1" />;
  });
  return (
    <div className="ft-card">
      <div className="ft-year__top">
        <span className="ft-year__count">
          <span className={`ft-year__num ${count === 0 ? 'is-zero' : ''}`}>{count}</span>
          <span className="ft-year__caption">{count === 1 ? 'session' : 'sessions'} in {year}</span>
        </span>
        {count > 0 && <span className="ft-year__flame"><Icon name="flame" size={22} /></span>}
      </div>
      <svg className="ft-year__grid" viewBox="0 0 310 40" role="img" aria-label={`${plural(count, 'session', 'sessions')} in ${year}`}>{cells}</svg>
      {count > 0 ? (
        <div className="ft-year__months">{MONTH_LABELS.map((m) => <span key={m}>{m}</span>)}</div>
      ) : (
        <div className="ft-year__empty">Fills up after your first session</div>
      )}
    </div>
  );
}

export default function Home() {
  const d = useData();
  const nav = useNavigate();
  const [discard, setDiscard] = useState(false);
  const open = openSession(d);
  const workouts = sortedWorkouts(d);
  const suggested = suggestedWorkout(d);
  const others = workouts.filter((x) => !x.hideFromHome && x.id !== suggested?.id);
  const last = finishedDesc(d)[0];

  const settings = <IconButton icon="settings" label="Settings" to="/settings" />;
  const start = (id: string) => {
    if (startWorkout(id)) nav('/session');
    else nav(`/workouts/${id}`); // TODO(Mike): a workout without exercises cannot start; this opens its editor instead.
  };

  if (workouts.length === 0 && !open) {
    return (
      <div className="empty-screen">
        <Header title={greeting} right={settings} />
        <EmptyState title="No workouts yet" text="When you create a workout, it'll show up here." />
        <Pinned><Button icon="plus" onClick={() => nav('/workouts/new')}>Create your first workout</Button></Pinned>
      </div>
    );
  }

  const exercisesCount = (n: number) => plural(n, 'exercise', 'exercises');

  return (
    <>
      <Header title={greeting} right={settings} />
      <Main>
        {open ? (
          <>
            <Section first>Workout in progress</Section>
            <div className="ft-card ft-card--hero">
              <div className="hero__text">
                <div className="hero__top">
                  <span className="hero__name">{sessionName(d, open)}</span>
                  <Chip hero>{open.exercises.filter((e) => e.state !== 'todo').length}/{exercisesCount(open.exercises.length)}</Chip>
                </div>
                <span className="hero__sub">Started {time(open.startTime)} - {minutesAgo(open.startTime)}</span>
              </div>
              <ProgressBar
                label="Exercises done"
                value={open.exercises.length ? open.exercises.filter((e) => e.state !== 'todo').length / open.exercises.length : 0}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button icon="play" onClick={() => nav('/session')}>Resume workout</Button>
                <IconButton icon="x" label="Discard workout" variant="x56" onClick={() => setDiscard(true)} />
              </div>
            </div>
          </>
        ) : suggested ? (
          <>
            <Section first>Suggested workout</Section>
            <div className="ft-card ft-card--hero">
              <div className="hero__text">
                <div className="hero__top">
                  <span className="hero__name">{suggested.name}</span>
                  <Chip hero>{exercisesCount(suggested.items.length)}</Chip>
                </div>
                <span className="hero__sub">
                  {(() => { const t = lastPerformed(d, suggested.id); return t != null ? lastDone(t) : 'Not done yet'; })()}
                </span>
              </div>
              <Button icon="play" onClick={() => start(suggested.id)}>Start workout</Button>
            </div>
          </>
        ) : null /* TODO(Mike): open question 28 — every workout hidden from home: nothing to suggest, the section is hidden. */}

        {!open && others.length > 0 && (
          <>
            <Section first={!suggested}>Or pick another</Section>
            <ListCard>
              {others.map((x) => {
                const t = lastPerformed(d, x.id);
                return (
                  <Row
                    key={x.id} pick title={x.name}
                    sub={t != null ? facts(exercisesCount(x.items.length), agoShort(t)) : exercisesCount(x.items.length)}
                    trail={<PlayButton label={`Start ${x.name}`} onClick={() => start(x.id)} />}
                  />
                );
              })}
            </ListCard>
          </>
        )}

        <Section first={!open && !suggested && others.length === 0}>Year overview</Section>
        <YearOverview />

        {last && (
          <>
            <Section>Last workout</Section>
            <Link to={`/history/${last.id}`} className="ft-last" aria-label={`Open ${sessionName(d, last)} in History`}>
              <span className="ft-last__top">
                <span className="ft-last__name">{sessionName(d, last)}</span>
                <Chip>{exercisesCount(loggedExercises(last).length)}</Chip>
                {prsForSession(d, last.id).length > 0 && <PRPill count={prsForSession(d, last.id).length} />}
              </span>
              <span className="ft-last__meta"><span>{dateRow(last.startTime)}</span><span>{timeRange(last.startTime, last.endTime!)}</span></span>
              <span className="ft-last__arrow"><Icon name="arrow-up-right" size={24} /></span>
            </Link>
          </>
        )}
      </Main>

      {discard && open && (
        <DiscardDialog logged={open.exercises.filter((e) => e.state === 'logged').length} onKeep={() => setDiscard(false)} onDiscard={() => { discardSession(); setDiscard(false); }} />
      )}
    </>
  );
}

/** Discard dialog (4.4.6), shared by the live session and the Home "Workout in progress" card. */
export function DiscardDialog({ logged, onKeep, onDiscard }: { logged: number; onKeep: () => void; onDiscard: () => void }) {
  const text = logged > 0
    ? `You've already logged ${plural(logged, 'exercise', 'exercises')}, discarding means they won't be saved.`
    : "You haven't logged any exercises yet, discarding means nothing will be saved."; // TODO(Mike): copy for 0 logged exercises is not designed.
  return (
    <Dialog title="Discard this workout?" text={text} onClose={onKeep}>
      <Button icon="play" onClick={onKeep}>Keep training</Button>
      <Button icon="trash-2" variant="danger" onClick={onDiscard}>Discard workout</Button>
    </Dialog>
  );
}
