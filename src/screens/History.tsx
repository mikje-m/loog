import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { applyPatch, deleteSession, saveSessionEdit, useData } from '../store';
import { exerciseById, finishedDesc, prsForSession, sessionById, sessionDuration, sessionName, sessionVolume } from '../calc';
import {
  dateLong, dateRow, dayMonth, duration, fixed1, fromDisplaySpeed, fromDisplayWeight, monthLabel, num, plural, speedHeader, time, timeRange,
  toDisplaySpeed, toDisplayWeight, uid, volume, weightUnit, withTime, wu,
} from '../format';
import type { Session } from '../types';
import { Icon } from '../ui/Icon';
import {
  AddRow, Button, Dialog, EmptyState, Header, IconButton, Label, ListCard, Main, NotesField, NumberField, Pinned, PickerField, PRPill, Row,
  Section,
} from '../ui/components';

// ---- History list (4.5.1) -----------------------------------------------------------------------

export function HistoryList() {
  const d = useData();
  const sessions = finishedDesc(d);
  if (sessions.length === 0) {
    return (
      <div className="empty-screen empty-screen--notpinned">
        <Header title="History" />
        <EmptyState title="No history yet" text="When you finish your first workout, it'll show up here." />
      </div>
    );
  }
  const groups: { label: string; items: Session[] }[] = [];
  for (const s of sessions) {
    const label = monthLabel(s.startTime);
    const g = groups[groups.length - 1];
    if (g?.label === label) g.items.push(s);
    else groups.push({ label, items: [s] });
  }
  return (
    <>
      <Header title="History" />
      <Main>
        {groups.map((g, gi) => (
          <div key={g.label}>
            <Section first={gi === 0}>{g.label}</Section>
            <ListCard>
              {g.items.map((s) => {
                const prs = prsForSession(d, s.id).length;
                return (
                  <Row
                    key={s.id} to={`/history/${s.id}`} chevron title={sessionName(d, s)} badge={prs > 0 ? <PRPill count={prs} /> : undefined}
                    sub={`${dateRow(s.startTime)} · ${duration(sessionDuration(s))}`}
                  />
                );
              })}
            </ListCard>
          </div>
        ))}
      </Main>
    </>
  );
}

// ---- Session detail (4.5.2) ------------------------------------------------------------------------

export function SessionDetail() {
  const { id = '' } = useParams();
  const d = useData();
  const nav = useNavigate();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const s = sessionById(d, id);
  if (!s || s.status !== 'finished' || s.endTime == null) return <Navigate to="/history" replace />;
  const u = d.settings.units;
  const prs = prsForSession(d, s.id);
  const toggle = (eid: string) => setOpen((o) => { const n = new Set(o); if (n.has(eid)) n.delete(eid); else n.add(eid); return n; });

  return (
    <>
      <Header
        title={sessionName(d, s)} titleText="" date={dateLong(s.startTime)} back="/history"
        right={
          <>
            <IconButton icon="pencil" label="Edit session" to={`/history/${s.id}/edit`} />
            <IconButton icon="trash-2" label="Delete session" onClick={() => setConfirm(true)} />
          </>
        }
      />
      <Main>
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
            <Section>PRs</Section>
            <ListCard>
              {prs.map((p) => (
                <Row
                  key={`${p.exerciseId}${p.type}`} title={exerciseById(d, p.exerciseId)?.name ?? ''}
                  sub={p.type === 'heaviest' ? `${wu(p.value, u)} · heaviest` : `${p.value} reps · most reps`}
                  trail={<PRPill />}
                />
              ))}
            </ListCard>
          </>
        )}

        {/* TODO(Mike): open question 16 — the Notes section is hidden when there is no note. */}
        {s.notes.trim() && (
          <>
            <Section>Notes</Section>
            <div className="ft-card" style={{ whiteSpace: 'pre-wrap' }}>{s.notes}</div>
          </>
        )}

        <Section>Exercises</Section>
        <ListCard>
          {s.exercises.map((e) => {
            const ex = exerciseById(d, e.exerciseId);
            const cardio = !!ex?.isCardio;
            const isOpen = open.has(e.id);
            const hasPR = prs.some((p) => p.exerciseId === e.exerciseId);
            return (
              <div key={e.id}>
                <Row
                  title={ex?.name ?? ''} badge={hasPR ? <PRPill /> : undefined} sub={plural(e.sets.length, 'set', 'sets')}
                  onClick={() => toggle(e.id)} label={`${ex?.name}, ${isOpen ? 'collapse' : 'expand'}`}
                  trail={<span className="ft-row__chev" style={{ paddingRight: 0 }}><Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} /></span>}
                />
                {isOpen && (
                  <div className="ft-expand ft-sets">
                    <div className="ft-setrow">
                      <span />
                      <span className="ft-setrow__h">{cardio ? 'Minutes' : 'Reps'}</span>
                      <span className="ft-setrow__h">{cardio ? speedHeader(u) : `Weight (${weightUnit(u)})`}</span>
                    </div>
                    {e.sets.map((set, i) => (
                      <div className="ft-setrow" key={set.id}>
                        <span className="ft-setrow__n">{i + 1}</span>
                        <span className="ft-setrow__v">{cardio ? num(set.duration ?? 0) : set.reps ?? ''}</span>
                        <span className="ft-setrow__v">{cardio ? fixed1(toDisplaySpeed(set.speed ?? 0, u)) : set.weight != null ? num(toDisplayWeight(set.weight, u)) : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </ListCard>
      </Main>

      {confirm && (
        <Dialog
          title="Delete this session?"
          text={`${sessionName(d, s)}, ${dayMonth(s.startTime)}.${prs.length ? ` This also removes ${plural(prs.length, 'PR', 'PRs')}.` : ''}`}
          onClose={() => setConfirm(false)}
        >
          <Button variant="neutral" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button icon="trash-2" variant="danger" onClick={() => { deleteSession(s.id); nav('/history', { replace: true }); }}>Delete</Button>
        </Dialog>
      )}
    </>
  );
}

// ---- Edit session (4.5.3) ------------------------------------------------------------------------------

export function EditSession() {
  const { id = '' } = useParams();
  const d = useData();
  const nav = useNavigate();
  const original = sessionById(d, id);
  const [draft, setDraft] = useState<Session | null>(() => (original ? structuredClone(original) : null));
  if (!original || original.status !== 'finished' || !draft || draft.endTime == null) return <Navigate to="/history" replace />;
  const u = d.settings.units;
  const back = `/history/${original.id}`;

  const edit = (fn: (s: Session) => void) => setDraft((cur) => { const n = structuredClone(cur!); fn(n); return n; });
  const setStart = (hhmm: string) => edit((s) => {
    if (!hhmm) return;
    const len = s.endTime! - s.startTime;
    s.startTime = withTime(original.startTime, hhmm);
    if (s.endTime! <= s.startTime) s.endTime = s.startTime + Math.max(60_000, len);
  });
  const setEnd = (hhmm: string) => edit((s) => {
    if (!hhmm) return;
    let t = withTime(s.startTime, hhmm);
    if (t <= s.startTime) t += 86_400_000; // finished after midnight
    s.endTime = t;
  });

  return (
    <>
      <Header title={`Edit ${sessionName(d, original)}`} date={dateLong(original.startTime)} onClose={() => nav(back, { replace: true })} closeLabel="Cancel" />
      <Main variant="pinned-tab">
        <div className="ft-stats">
          <div>
            <Label htmlFor="start">Start</Label>
            <PickerField id="start" type="time" value={time(draft.startTime)} display={time(draft.startTime)} icon="chevron-down" onChange={setStart} />
          </div>
          <div>
            <Label htmlFor="end">End</Label>
            <PickerField id="end" type="time" value={time(draft.endTime)} display={time(draft.endTime)} icon="chevron-down" onChange={setEnd} />
          </div>
        </div>
        <Label htmlFor="notes" spaced>Notes</Label>
        <NotesField value={draft.notes} onChange={(v) => edit((s) => { s.notes = v; })} />

        <Section>Exercises</Section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {draft.exercises.map((e) => {
            const ex = exerciseById(d, e.exerciseId);
            const cardio = !!ex?.isCardio;
            const change = (setId: string, patch: Parameters<typeof applyPatch>[1]) =>
              edit((s) => { const t = s.exercises.find((x) => x.id === e.id)?.sets.find((x) => x.id === setId); if (t) applyPatch(t, patch); });
            return (
              <div className="ft-card ft-card--gap12" key={e.id}>
                <div className="goal__top" style={{ alignItems: 'center' }}>
                  <span className="set-pref__title" style={{ flex: 1 }}>{ex?.name}</span>
                  <span style={{ margin: '-10px -10px -10px 0' }}>
                    <IconButton icon="trash-2" variant="ghost" label={`Remove ${ex?.name}`} onClick={() => edit((s) => { s.exercises = s.exercises.filter((x) => x.id !== e.id); })} />
                  </span>
                </div>
                <div className="ft-sets">
                  <div className="ft-setrow ft-setrow--edit">
                    <span />
                    <span className="ft-setrow__h">{cardio ? 'Minutes' : 'Reps'}</span>
                    <span className="ft-setrow__h">{cardio ? speedHeader(u) : `Weight (${weightUnit(u)})`}</span>
                    <span />
                  </div>
                  {e.sets.map((set, i) => (
                    <div className="ft-setrow ft-setrow--edit" key={set.id}>
                      <span className="ft-setrow__n">{i + 1}</span>
                      {cardio ? (
                        <>
                          <NumberField label={`Set ${i + 1} minutes`} value={set.duration} onChange={(v) => change(set.id, { duration: v })} />
                          <NumberField label={`Set ${i + 1} speed`} decimal value={set.speed == null ? undefined : toDisplaySpeed(set.speed, u)} onChange={(v) => change(set.id, { speed: v == null ? undefined : fromDisplaySpeed(v, u) })} />
                        </>
                      ) : (
                        <>
                          <NumberField label={`Set ${i + 1} reps`} value={set.reps} onChange={(v) => change(set.id, { reps: v == null ? undefined : Math.round(v) })} />
                          <NumberField label={`Set ${i + 1} weight`} decimal value={set.weight == null ? undefined : toDisplayWeight(set.weight, u)} onChange={(v) => change(set.id, { weight: v == null ? undefined : fromDisplayWeight(v, u) })} />
                        </>
                      )}
                      <IconButton icon="x" variant="ghost" label={`Remove set ${i + 1}`} onClick={() => edit((s) => { const t = s.exercises.find((x) => x.id === e.id); if (t) t.sets = t.sets.filter((x) => x.id !== set.id); })} />
                    </div>
                  ))}
                </div>
                <AddRow
                  onClick={() => edit((s) => {
                    const t = s.exercises.find((x) => x.id === e.id);
                    if (!t) return;
                    const last = t.sets[t.sets.length - 1];
                    t.sets.push({ id: uid(), reps: last?.reps, weight: last?.weight, duration: last?.duration, speed: last?.speed, completed: true });
                  })}
                >Add set</AddRow>
              </div>
            );
          })}
        </div>
      </Main>
      <Pinned>
        <Button
          icon="check"
          onClick={() => {
            // Exercises left without sets are dropped; the whole session saves at once.
            const cleaned = { ...draft, exercises: draft.exercises.filter((e) => e.sets.length > 0) };
            saveSessionEdit(cleaned);
            nav(back, { replace: true });
          }}
        >Save changes</Button>
      </Pinned>
    </>
  );
}
