import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useReady } from './store';
import { TabBar } from './ui/components';
import Home from './screens/Home';
import Settings from './screens/Settings';
import { AddToWorkout, CreateWorkout, DuplicateWorkout, ExerciseForm, SetTargets, WorkoutEditor, WorkoutList } from './screens/Workouts';
import { FinishSummary, LiveSession, ReorderExercises, SessionAdd, SessionSwap } from './screens/Live';
import { EditSession, HistoryList, SessionDetail } from './screens/History';
import { GoalForm, Goals, Progress } from './screens/Progress';

/** Routes from handoff 4.0. The live session (and its reorder and finish screens) has no tab bar. */
function Shell() {
  const { pathname } = useLocation();
  const live = pathname === '/session' || pathname.startsWith('/session/reorder') || pathname.startsWith('/session/finish');
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/workouts" element={<WorkoutList />} />
        <Route path="/workouts/new" element={<CreateWorkout />} />
        <Route path="/workouts/:id" element={<WorkoutEditor />} />
        <Route path="/workouts/:id/duplicate" element={<DuplicateWorkout />} />
        <Route path="/workouts/:id/add" element={<AddToWorkout />} />
        <Route path="/workouts/:id/items/:item" element={<SetTargets />} />
        <Route path="/exercises/new" element={<ExerciseForm />} />
        <Route path="/exercises/:id/edit" element={<ExerciseForm />} />

        <Route path="/session" element={<LiveSession />} />
        <Route path="/session/add" element={<SessionAdd />} />
        <Route path="/session/swap/:logged" element={<SessionSwap />} />
        <Route path="/session/reorder" element={<ReorderExercises />} />
        <Route path="/session/finish/:id" element={<FinishSummary />} />

        <Route path="/history" element={<HistoryList />} />
        <Route path="/history/:id" element={<SessionDetail />} />
        <Route path="/history/:id/edit" element={<EditSession />} />

        <Route path="/progress" element={<Progress />} />
        <Route path="/progress/goals" element={<Goals />} />
        <Route path="/goals/new" element={<GoalForm />} />
        <Route path="/goals/:id" element={<GoalForm />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!live && <TabBar />}
    </div>
  );
}

export default function App() {
  const ready = useReady();
  if (!ready) return null;
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
