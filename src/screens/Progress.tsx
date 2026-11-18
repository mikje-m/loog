import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { deleteGoal, saveGoal, useData } from '../store';
import { chartBars, exerciseById, finishedDesc, goalById, goalCurrent, goalProgress, heaviestFor, type Period } from '../calc';
import { dayMonth, dayMonthShort, dayMonthYear, editNum, facts, fromDisplayWeight, fromIsoDay, goalDate, parseNum, toDisplayWeight, w, weightUnit, wu } from '../format';
import { Icon } from '../ui/Icon';
import {
  Button, Dialog, EmptyState, Header, IconButton, Label, ListCard, Main, Pinned, PickerField, ProgressBar, Section, SelectField, TextField, TopTabs,
} from '../ui/components';

// ---- Progress (4.6.1) ---------------------------------------------------------------------------------

const FILTERS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: 'year', label: 'Year' }, { value: 'all', label: 'All time' },
];

export function Progress() {
  const d = useData();
  const u = d.settings.units;
  const [picked, setPicked] = useState<string | null>(null);
  // *(assumed)* Month is the default filter and the latest period is selected.
  const [period, setPeriod] = useState<Period>('month');
  const [selected, setSelected] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // TODO(Mike): open question 2 — cardio stays out of Progress. *(assumed)* the most recently trained exercise is shown first.
  const trained = useMemo(() => {
    const ids: string[] = [];
    for (const s of finishedDesc(d)) {
      for (const e of s.exercises) {
        const ex = exerciseById(d, e.exerciseId);
        if (e.state === 'logged' && ex && !ex.isCardio && !ids.includes(ex.id)) ids.push(ex.id);
      }
    }
    return ids;
  }, [d]);

  const current = picked && trained.includes(picked) ? picked : trained[0];
  const bars = useMemo(() => (current ? chartBars(d, current, period) : []), [d, current, period]);
  const sel = bars.find((b) => b.key === selected) ?? bars[bars.length - 1];

  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [current, period, bars.length]);

  if (!current) {
    return (
      <div className="empty-screen empty-screen--notpinned">
        <TopTabs />
        <EmptyState title="No progress yet" text="When you complete your first workout, data of different exercises will show up here." />
      </div>
    );
  }

  const ex = exerciseById(d, current)!;
  const values = bars.map((b) => b.value).filter((v): v is number => v != null && v > 0);
  const max = Math.max(...values, 0);
  const base = Math.min(...values, max) * 0.6; // baseline below the lowest value so differences show
  const barPx = (v: number) => (max === base ? 140 : 8 + ((v - base) / (max - base)) * 132);

  const heaviest = sel ? heaviestFor(d, current, (s) => s.startTime >= sel.start && s.startTime < sel.end) : undefined;
  const rows = sel ? [...sel.entries].reverse() : [];
  const nSets = Math.max(0, ...rows.map((r) => r.logged.sets.length));

  return (
    <>
      <TopTabs />
      <Main tight>
        <SelectField
          value={current} onChange={(v) => { setPicked(v); setSelected(null); }} placeholder="Choose an exercise"
          options={trained.map((id) => ({ value: id, label: exerciseById(d, id)?.name ?? '' }))}
        />
        <div className="gap-8" />
        <div className="ft-card">
          <div className="chart" ref={scroller}>
            {bars.map((b) => {
              const on = b.key === sel?.key;
              return (
                <button key={b.key} type="button" className="chart__col" aria-pressed={on} aria-label={b.title} onClick={() => setSelected(b.key)}>
                  <span className="chart__stack">
                    {b.value != null && b.value > 0 ? (
                      <>
                        <span className="chart__val">{w(b.value, u)}</span>
                        <span className="chart__bar" style={{ height: barPx(b.value) }} />
                      </>
                    ) : (
                      <span className="chart__stub" />
                    )}
                  </span>
                  <span className="chart__lbl">{b.label}</span>
                </button>
              );
            })}
          </div>
          <div className="ft-filters" role="radiogroup" aria-label="Period">
            {FILTERS.map((f) => (
              <button key={f.value} type="button" role="radio" aria-checked={f.value === period} className="ft-filter" onClick={() => { setPeriod(f.value); setSelected(null); }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {sel && heaviest && (
          <>
            <Section>Heaviest in {sel.title}</Section>
            <div className="ft-card">
              <div className="heaviest">
                <div className="heaviest__text">
                  <span className="heaviest__val">{wu(heaviest.weight, u)} × {heaviest.reps}</span>
                  <span className="heaviest__date">{dayMonth(heaviest.date)}</span>
                </div>
                <span className="heaviest__icon"><Icon name="trophy" size={24} /></span>
              </div>
            </div>
          </>
        )}

        {sel && rows.length > 0 && (
          <>
            <Section>History of {ex.name} - {sel.title}</Section>
            <div className="ft-card">
              {/* TODO(Mike): open question 17 — more sets than fit scroll sideways. */}
              <div className="hist-table">
                <div className="hist-grid" style={{ gridTemplateColumns: `minmax(64px, 1.6fr) repeat(${nSets}, minmax(28px, 1fr)) minmax(44px, 1.1fr)` }}>
                  <span className="h">Date</span>
                  {Array.from({ length: nSets }, (_, i) => <span key={i} className="h">{i + 1}</span>)}
                  <span className="h">{weightUnit(u)}</span>
                  {rows.map((r) => {
                    const top = Math.max(0, ...r.logged.sets.map((s) => s.weight ?? 0));
                    return [
                      <span key={`${r.session.id}d`} className="d">{dayMonthShort(r.session.startTime)}</span>,
                      ...Array.from({ length: nSets }, (_, i) => <span key={`${r.session.id}${i}`} className="v">{r.logged.sets[i]?.reps ?? ''}</span>),
                      <span key={`${r.session.id}w`} className="v">{w(top, u)}</span>,
                    ];
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </Main>
    </>
  );
}

// ---- Goals (4.6.2) --------------------------------------------------------------------------------------------

export function Goals() {
  const d = useData();
  const nav = useNavigate();
  const u = d.settings.units;
  const active = d.goals.filter((g) => g.completedAt == null).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const done = d.goals.filter((g) => g.completedAt != null).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const pinned = <Pinned><Button icon="plus" onClick={() => nav('/goals/new')}>New goal</Button></Pinned>;

  if (d.goals.length === 0) {
    return (
      <div className="empty-screen">
        <TopTabs />
        <EmptyState title="No goals yet" text="When you create goals, you'll be able to track your progress here." />
        {pinned}
      </div>
    );
  }

  return (
    <>
      <TopTabs />
      <Main variant="pinned-tab" tight>
        {active.length > 0 && (
          <>
            <Section first>Active</Section>
            <ListCard>
              {active.map((g) => {
                const name = exerciseById(d, g.exerciseId)?.name ?? '';
                const cur = goalCurrent(d, g);
                // TODO(Mike): open question 21 — a goal past its deadline looks the same as any active goal.
                return (
                  <div className="goal" key={g.id}>
                    <div className="goal__top">
                      <div className="ft-row__body">
                        <span className="ft-row__title"><span>{name}</span></span>
                        <span className="ft-row__sub">{facts(wu(g.targetValue, u), `by ${goalDate(fromIsoDay(g.deadline))}`)}</span>
                      </div>
                      <IconButton icon="pencil" variant="ghost" label="Edit goal" to={`/goals/${g.id}`} />
                    </div>
                    <ProgressBar label={`${name} goal`} value={goalProgress(cur, g)} />
                    <span className="goal__frac">{w(cur, u)} / {wu(g.targetValue, u)}</span>
                  </div>
                );
              })}
            </ListCard>
          </>
        )}
        {done.length > 0 && (
          <>
            <Section first={active.length === 0}>Completed</Section>
            <ListCard>
              {done.map((g) => (
                <div className="goal" key={g.id}>
                  <div className="goal__top">
                    <div className="ft-row__body">
                      <span className="ft-row__title" style={{ color: 'var(--ink-muted)' }}><span>{exerciseById(d, g.exerciseId)?.name}</span></span>
                      <span className="ft-row__sub">{facts(wu(g.targetValue, u), `done ${goalDate(g.completedAt!)}`)}</span>
                    </div>
                    <span className="goal__done-check"><Icon name="check" size={22} stroke={2.25} /></span>
                  </div>
                </div>
              ))}
            </ListCard>
          </>
        )}
      </Main>
      {pinned}
    </>
  );
}

// ---- Create / edit goal (4.6.3) --------------------------------------------------------------------------------

export function GoalForm() {
  const { id } = useParams();
  const d = useData();
  const nav = useNavigate();
  const u = d.settings.units;
  const existing = id && id !== 'new' ? goalById(d, id) : undefined;
  const [exerciseId, setExerciseId] = useState(existing?.exerciseId ?? '');
  const [target, setTarget] = useState(existing ? editNum(Math.round(toDisplayWeight(existing.targetValue, u) * 10) / 10) : '');
  const [deadline, setDeadline] = useState(existing?.deadline ?? '');
  const [confirm, setConfirm] = useState(false);
  if (id && id !== 'new' && !existing) return <Navigate to="/progress/goals" replace />;

  // Cardio exercises cannot be goal targets (5.3 rule 9).
  const strength = d.exercises.filter((e) => !e.isCardio).sort((a, b) => a.name.localeCompare(b.name));
  const value = parseNum(target);
  const valid = !!exerciseId && value != null && value > 0 && !!deadline;
  const save = () => {
    if (!valid) return;
    saveGoal(existing?.id, { exerciseId, targetValue: fromDisplayWeight(value!, u), deadline });
    nav('/progress/goals', { replace: true });
  };
  const cur = existing ? goalCurrent(d, existing) : 0;

  return (
    <>
      <Header
        title={existing ? 'Edit goal' : 'Create goal'} back="/progress/goals"
        right={existing && <IconButton icon="trash-2" label="Delete goal" onClick={() => setConfirm(true)} />}
      />
      <Main variant="pinned-tab">
        <Label htmlFor="goal-ex">Exercise</Label>
        <SelectField id="goal-ex" value={exerciseId} onChange={setExerciseId} placeholder="Choose an exercise" options={strength.map((e) => ({ value: e.id, label: e.name }))} />
        <Label htmlFor="goal-target" spaced>Target</Label>
        <TextField id="goal-target" value={target} onChange={setTarget} inputMode="decimal" trail={<span>{weightUnit(u)}</span>} />
        <Label htmlFor="goal-deadline" spaced>Deadline</Label>
        <PickerField
          id="goal-deadline" type="date" value={deadline} display={deadline ? dayMonthYear(fromIsoDay(deadline)) : ''} placeholder="Pick a date"
          icon="calendar" onChange={setDeadline}
        />
        {existing && (
          <>
            <div className="gap-32" />
            <div className="ft-card">
              <div className="goal__line">
                <span className="set-pref__title">Progress</span>
                <span className="goal__frac">{w(cur, u)} / {wu(existing.targetValue, u)}</span>
              </div>
              <ProgressBar label="Goal progress" value={goalProgress(cur, existing)} />
            </div>
          </>
        )}
      </Main>
      <Pinned><Button icon="check" disabled={!valid} onClick={save}>Save</Button></Pinned>

      {confirm && existing && (
        // TODO(Mike): open question 9 — delete-goal confirm copy is not designed.
        <Dialog
          title="Delete this goal?"
          text={`${exerciseById(d, existing.exerciseId)?.name}, ${wu(existing.targetValue, u)} by ${goalDate(fromIsoDay(existing.deadline))}.`}
          onClose={() => setConfirm(false)}
        >
          <Button variant="neutral" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button icon="trash-2" variant="danger" onClick={() => { deleteGoal(existing.id); nav('/progress/goals', { replace: true }); }}>Delete</Button>
        </Dialog>
      )}
    </>
  );
}

