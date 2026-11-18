# Changes after the handoff

Mike's testing feedback. Where an item differs from `loog-handoff.md`, this file wins.

## Round 1 (18 november 2026)

| # | Feedback | What changed | Handoff section it overrides |
|---|---|---|---|
| 1 | First time logging, the weight had to be entered for every set | A weight typed into a set fills every later set that is still empty, as a grey suggestion. Sets that already have a value (history) are left alone. | 4.4.2 |
| 2 | Reps empty for an exercise added mid-workout | With no history and no target, reps start at 10 (cardio: 10 min at 6,0 km/h) as grey suggestions. Weight stays empty on purpose. | 4.4.2, 5.3 rule 12 |
| 3 | Grey values from last time: Log should just work | Typed values now count the moment they are typed, not when the field is left, so Log is enabled right away and a tap on it is never lost to the keyboard closing. With untouched grey values Log is enabled and logs them. | 4.4.2 |
| 4 | Log should be highlighted when everything is filled in | Log is the pink primary button whenever it can be used (see 3). | 4.4.2 |
| 5 | Progress ring blends into the background | Ring track is now the muted text colour at 40% (`--ring-track`) instead of `--pink-soft`, in both themes. | 3.14 |
| 6 | No dots between elements | Every middle dot is gone. Facts are separated by whitespace (an em space). Rep lists use a hyphen ("12-10-8 reps"). Where a hyphen reads better it is used ("Started 18:04 - 32 min ago", "kg - km/h"). | 2.11 |
| 7 | Does the Android / Samsung back button work? | Back closes an open dialog or sheet first. In the live session Back opens the Discard dialog, like the X. Everywhere else it goes back one screen. | 4.0 (not specified) |
| 8 | Text selection colour | Selected text is the primary pink with black text. In number fields the highlight fills the whole field height. | 2.1 |

## Round 2 (18 november 2026)

| # | Feedback | What changed | Handoff section it overrides |
|---|---|---|---|
| 9 | An exercise added mid-workout should update the workout | It joins the workout (end of the list). When you log it, the sets and reps you did become its targets. | 4.4.3, 5.3 rule 5 |
| 10 | Deleting or reordering mid-workout should change the structure | Reordering already did. "Remove from session" is now **"Remove from workout"** and removes the exercise from the workout as well. Skip does not change the workout. | 4.4.4, 5.3 rule 5 |
| 11 | Easy install, more robust than a web app | Android app (APK), package `com.mikje.loog`. Same code and the same database engine as the web version, stored in the app's own private storage. | 8.2 |

Not changed: Swap for another exercise stays session-only. Discarding a workout does not undo an exercise you added to it.

## Still open (TODO(Mike) in code)

All questions from section 13 of the handoff that were not answered, plus: the first-time weight carry-down only fills empty sets, so after a progression (last time 70, now 72,5) each set is changed on its own.
