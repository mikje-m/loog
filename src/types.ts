// Stored data (handoff section 5). Weights are stored in kg and speeds in km/h;
// the Units setting only changes how they are shown and entered.
// PRs, volume, duration, progress and "last performed" are never stored.

export type Units = 'kg_kmh' | 'lbs_mph';
export type Theme = 'auto' | 'light' | 'dark';

export interface Settings {
  units: Units;
  theme: Theme;
}

export interface Exercise {
  id: string;
  name: string;
  isCardio: boolean;
  muscleGroup?: string;
  equipment?: string;
}

/**
 * One planned set. Strength plans `reps`.
 * TODO(Mike): open question 6 — cardio plans Time + Speed; stored here as `duration` (min) and `speed` (km/h).
 */
export interface PlannedSet {
  reps?: number;
  duration?: number;
  speed?: number;
}

export interface WorkoutItem {
  id: string;
  exerciseId: string;
  sets: PlannedSet[];
}

export interface Workout {
  id: string;
  name: string;
  /** Position in My workouts. Never shown. */
  order: number;
  hideFromHome: boolean;
  items: WorkoutItem[];
}

export type SetField = 'reps' | 'weight' | 'duration' | 'speed';

export interface SetEntry {
  id: string;
  reps?: number;
  weight?: number;
  duration?: number;
  speed?: number;
  completed: boolean;
  /** Fields the user changed. The rest are suggestions (shown in --ink-muted). */
  edited?: Partial<Record<SetField, true>>;
}

export type LoggedState = 'todo' | 'logged' | 'skipped';

export interface LoggedExercise {
  id: string;
  exerciseId: string;
  /** The workout item this came from. Absent for exercises added during the session. */
  itemId?: string;
  state: LoggedState;
  sets: SetEntry[];
}

export interface Session {
  id: string;
  /** Source workout. The session survives when the workout is deleted. */
  workoutId?: string;
  workoutName: string;
  status: 'in_progress' | 'finished';
  startTime: number;
  endTime?: number;
  notes: string;
  exercises: LoggedExercise[];
  /** The exercise in the card during a live session. */
  currentId?: string;
  /** Time of the last change; stale sessions are auto-finished at this time. */
  updatedAt: number;
}

export interface Goal {
  id: string;
  exerciseId: string;
  targetValue: number; // kg
  deadline: string; // YYYY-MM-DD
  createdAt: number;
  completedAt?: number;
}

export interface AppData {
  exercises: Exercise[];
  workouts: Workout[];
  sessions: Session[];
  goals: Goal[];
  settings: Settings;
}

export interface PR {
  sessionId: string;
  exerciseId: string;
  type: 'heaviest' | 'most_reps';
  /** kg for heaviest, reps for most reps. */
  value: number;
  date: number;
}
