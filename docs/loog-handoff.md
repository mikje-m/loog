# Loog: build handoff for Claude Code

Loog (pronounced "log") is a free, offline, fully customizable workout tracker. You build your own exercises and workouts, log sets fast between sets, and see whether you are getting stronger. No account, no server, no paywall. All data lives on the device.

This document is the **single source of truth** for building v1. It merges the original product handoff, every design decision made while designing the hi-fi screens, and the final design system. Where this document and anything else disagree, this document wins. Where this document and the reference screens disagree on a pixel value, the reference screens win (they are the approved design).

---

## 0. How to use this handoff

### 0.1 What is in this package

```
loog-handoff/
  loog-handoff.md            <- this file
  design-tokens/
    tokens.json              <- the design system tokens (colours per theme, type, spacing, radius, shadows, sizes)
    tokens.css               <- the same tokens as CSS custom properties, light + dark + theme override, plus type classes
  reference/
    screens/*.html           <- 62 approved hi-fi screens as static HTML (31 screens x dark and light), exact inline styles
    png/*.png                <- the same 62 screens rendered at 2x, full length
```

- `reference/screens/<Name>.html` is dark, `<Name>Light.html` is light (exception: the dark Home full state is `Main.html`, its light version `HomeLight.html`). The full list is in section 10.
- `tokens.json` has correct **values**, but some of its `usage` notes are older than this document. When a usage note conflicts with this document, this document wins. `tokens.css` is up to date.
- **The reference screens contain sample data** (Push day, Bench press, 82,5 kg, "48 sessions", "logged 3 exercises"...). The sample numbers are not consistent with each other. Never hard-code or copy them; everything is calculated from the user's data.
- The reference HTML is **a visual spec, not production code**. Rebuild it as proper components with the tokens. Copy measurements, colours and copy from it exactly.
- Fonts in the reference HTML load from Google Fonts. In the app, self-host Lexend Deca (see 2.3).

### 0.2 Rules for Claude Code (read before writing any code)

1. **Do not invent features, screens, copy or content.** Everything the app does is described here. If something is not described, it does not exist in v1.
2. **If you hit something that is not specified, stop and ask Mike.** Section 13 lists the known open questions and undesigned states. For those, build the closest existing pattern from this document as a placeholder, mark it with `// TODO(Mike): ...` and list it in your summary. Never silently decide product behaviour.
3. **Design and functionality are equally important.** A screen is not done when it works. It is done when it works and matches the reference screen in both themes.
4. **Use the tokens, never raw values in components.** Every colour, radius, shadow and spacing comes from `tokens.css`.
5. **Weight 400 only.** There is no bold or medium anywhere in this app, including buttons and headings. Never add `font-weight: 500/600/700`.
6. **No strokes, no gradients, no outer glows, no drop shadows on cards.** Depth comes only from the inner-edge system in section 2.5.
7. **Both themes, always.** Every screen and state must work in dark and light. Test both.
8. **Mobile first, one column.** Design width is 390px. See 2.8 for wider screens.
9. **Items marked *(assumed)*** are sensible defaults that Mike has not explicitly decided. Build them as written, but list them in your summary so Mike can confirm or change them.
10. **Work screen by screen** in this order: tokens + components (section 3) → Home → Settings → Workouts → Live session → History → Progress → export/import. Check each against its reference PNG in both themes before moving on.

---

## 1. Product

### 1.1 Design principles

These judge every feature. If a feature breaks one, it does not ship.

1. **The content is yours, the app is mine.** Users customize their exercises, workouts and goals. They do not customize the interface (the only appearance choice is Auto/Light/Dark).
2. **Simple beats complete.** No feature exists unless it earns its place. One primary action per screen.
3. **Free and offline.** All data lives on the device. No account, no server, no paywall.
4. **Built for chalky hands.** Big tap targets, as little typing as possible, one-handed. Steppers over keyboards.
5. **Good looking.** The reason the app exists: every free tracker is ugly.
6. **Fun and rewarding.** PRs and progress are celebrated (in green). Missed plans are never punished: no red for skipped sets, no "missed" days, no streaks, no completion percentages.

### 1.2 Non-goals (v1)

- No account, login, sync or cloud
- No social features
- No rest timer
- No distance/pace/route tracking for cardio
- No "you missed a set" reporting or completion percentages
- No custom themes or configurable layouts. (Changed from the original handoff: there IS a Theme setting with exactly three options, Auto, Light and Dark. Auto follows the system and is the default.)
- No onboarding. The app opens straight on Home.

### 1.3 Backlog (post-v1, do NOT build)

Rest timer · frequency per workout · bodyweight tracking and bodyweight goals · frequency goals · most-reps goals · archive instead of delete · exercise library screen · syncing between devices.

---

## 2. Design system

The design system is called **Loog**. Tokens are in `design-tokens/tokens.json` and `tokens.css`. This section explains the rules behind them. Follow the rules, not just the numbers.

### 2.1 Colour: 60 / 30 / 10

- **60, the ground:** `--bg`. Plum black in dark, grey-white in light.
- **30, the structure:** `--surface` cards and rows, `--surface-raised` for controls, chips and neutral buttons. Text in `--ink` and `--ink-muted`.
- **10, the energy:** `--pink` (#E901C4). Primary buttons, play buttons, active tab, progress fills, chart bars, trained days, selected segment. Nothing else gets a `--pink` fill. Supporting accents use `--pink-text` (icons/labels: active tab, flame, trophy, Settings tile icons) and `--pink-soft` (active tab block, ring track, unselected chart bars, icon tiles, text-selection highlight).
- **Tertiary, inside the 10:** `--green` (#3BF07F). Only for good news: PR badge, New PR card, today in the year grid, the gain in a goal bar, completed checks (`--green-text`). If a screen has no good news, it has no green. One exception: the green "today" cell in the year grid and the empty-state mini grid.
- **Text on pink and green fills is always black** (`--on-pink`, `--on-green`). White on this pink is only 4:1 and fails AA.
- Pink or green **as text or icon** uses `--pink-text` / `--green-text` (tuned per theme to pass 4.5:1).
- `--danger` only for destructive actions, always next to a verb (Remove from workout, Discard workout, Delete, Remove from session).
- `--ink` for primary and edited values, `--ink-muted` for subtitles, labels and suggested values. Both pass WCAG AA on every surface in both themes.

| Token | Dark | Light | Use |
|---|---|---|---|
| `bg` | `#0f0a0c` | `#ebebef` | Page background (plum black / soft grey) |
| `surface` | `#141414` | `#f8f8fa` | Cards, list cards, dialogs, sheets |
| `surface-raised` | `#1c1c1c` | `#efeff2` | Fields, steppers, chips, neutral buttons, segmented track, empty grid cells |
| `ink` | `#ffffff` | `#0a0a0b` | Primary text, edited values |
| `ink-muted` | `#a6a1a3` | `#5f5a5c` | Labels, subtitles, suggested values, inactive tab |
| `ink-disabled` | `#524a58` | `#a8a8b0` | Disabled labels only, never readable text |
| `line-strong` | `#7a7180` | `#8e8e96` | Only the dashed outline of "Add set" / "Add exercise" rows and the drag placeholder |
| `edge` | `rgba(255,255,255,0.07)` | `rgba(10,10,11,0.06)` | Reserved. Not used in v1 screens (no divider lines) |
| `pink` | `#e901c4` | `#e901c4` | The accent fill |
| `on-pink` | `#000000` | `#000000` | Text/icons on pink |
| `pink-text` | `#ff4fdb` | `#b8009a` | Pink as text/icon (active tab label, flame, trophy icon) |
| `pink-soft` | `#3e192b` | `#fde3f7` | Active tab block, ring track, unselected chart bars, selected-text highlight |
| `pink-tint` | `#f7a8e6` | `#f7a8e6` | Reserved, not used in v1 screens |
| `green` | `#3bf07f` | `#3bf07f` | PR pill, New PR card, today cell, goal gain |
| `on-green` | `#000000` | `#000000` | Text/icons on green |
| `green-text` | `#3bf07f` | `#127a3a` | Completed checkmarks, green as text |
| `green-soft` | `#0e2616` | `#ddfbe8` | Reserved |
| `danger` | `#ff5a5f` | `#d0142c` | Destructive text and icons |
| `focus` | `#ffffff` | `#0a0a0b` | Keyboard focus ring (2px solid, 2px offset) |
| `scrim` | `rgba(0,0,0,0.72)` | `rgba(10,10,11,0.45)` | Behind dialogs and the sheet |

Year-grid cell colours (not tokens, use exactly): empty day dark `#262626`, light `#dcdce1`. **Every empty day, past and future, is the same grey.** Trained = `--pink`, today = `--green`.

### 2.2 Theme

- One setting: **Theme = Auto | Light | Dark**. Default **Auto** (follows `prefers-color-scheme`).
- Implementation: `tokens.css` uses light as base, dark under `@media (prefers-color-scheme: dark)` when `<html>` has no `data-theme="light"`, and forces dark with `data-theme="dark"`. Auto = no attribute.
- Also set `<meta name="theme-color">` to the current `--bg` so the browser chrome matches.

### 2.3 Typography

- One family: **Lexend Deca**, **weight 400 only**. Self-host it (for example the `@fontsource/lexend-deca` package, latin 400) so the app works offline. Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`.
- Hierarchy comes from size, tight letter-spacing and colour (`ink` vs `ink-muted`). Never from weight.
- Use tabular figures everywhere (`font-variant-numeric: tabular-nums`).
- English, **sentence case** everywhere. No all caps.

Type scale as used in the approved screens (also in `tokens.css` as `.t-*` classes):

| Name | Size / line | Letter-spacing | Used for |
|---|---|---|---|
| screen-title | 34 / 40 | -5% | Screen titles ("My workouts", "History", "Settings", workout name in headers), Home greeting |
| screen-title-long | 28 / 34 | -5% | Sub-screen titles longer than 13 characters ("Create new workout", "Duplicate Push day", "Bench press sets", "Reorder exercises") |
| display | 36 / 40 | -6% | Workout name inside the Suggested and Workout in progress cards |
| stat | 32 / 36 | -6% | Time and Volume values. The year-overview count uses 32 / 32 |
| heading | 24 / 30 | -3% | Current-exercise name, empty-state title, dialog title, sheet title, Heaviest value |
| number | 20 / 26 | -2% | Values in steppers and number fields |
| title | 18 / 24 | -2% | Card and row titles |
| button | 17 / 24 | -1% | Every button label |
| body | 16 / 22 | 0 | Body text, input text, Notes, sheet actions, dashed-row labels |
| segment | 15 / 20 | 0 | Segmented-control options |
| subtitle-lg | 14 / 20 | 0 | Card subtitle ("Last done 9 days ago", "Started 18:04 · 32 min ago"), date under a screen title |
| label | 13 / 18 | 0 | Section labels, column headers, captions, set numbers |
| row-sub | 13 / 16 | 0 | Row subtitles ("7 exercises · 7d ago") |
| small | 12 / 16 | 0 | Chips, badges, tab labels, chart value and month labels |
| micro | 11 / 14 | 0 | Year-grid month labels |

The token file also lists `hero` (48/52) and `number` (22/28) styles; those are not used on the v1 screens. Follow the table above.

### 2.4 Shape

- **One radius: 16px (`--radius-md`)** on every button, card, list card, row, input, stepper, tab item, icon button, play button, dialog and tile. Rounded rectangles, never pills or circles. No cut corners.
- `--radius-chip` **8px** for chips and badges ("6 exercises", "1 PR"), filter chips and the checkbox.
- **12px** (`--radius-control`) for the selected option inside a segmented control (16 outer radius minus 4 padding) and the stepper's inner +/- buttons.
- `--radius-full` only for: toggle track and knob, progress bars.
- `--radius-lg` 24px only for the top corners of the pull-up sheet.
- Year-overview cells: 1px radius. Empty-state mini-grid cells: 2px radius (`--radius-xs`).
- Chart bars: 8px top corners, 2px bottom corners.

### 2.5 Depth: inner edges, no strokes

The whole depth language is one rule: **light from above, shade below, drawn as hard inner edges (inset box-shadows with zero blur).** No outlines, no hairline borders, no outer drop shadows, no glows around anything, no gradients.

| Token | Dark | Light | Applies to |
|---|---|---|---|
| `--shadow-bevel` | `inset 0 2px 0 rgba(255,255,255,0.08)` | `inset 0 2px 0 #fff, inset 0 -2px 0 rgba(10,10,11,0.04)` | Cards, list cards, stat tiles, dialogs, sheet (dark cards get ONLY the top line) |
| `--shadow-button` | `inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.35)` | `inset 0 2px 0 #fff, inset 0 -2px 0 rgba(10,10,11,0.08)` | Neutral (grey) buttons: icon buttons (back, X, gear, pencil, trash, copy), Discard workout, Cancel, Delete, sheet actions, the 56px X on the resume card, the destructive "Remove from workout" row. Buttons get a bottom edge in BOTH themes |
| `--shadow-bevel-accent` | `inset 0 2px 0 rgba(255,255,255,0.75), inset 0 -2px 0 rgba(0,0,0,0.32)` | same | Pink and green fills: primary buttons, play buttons, New PR card, toggle (on). **No 1px rim around the sides.** |
| `--shadow-pill` | `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)` | `inset 0 1px 0 #fff, inset 0 -1px 0 rgba(10,10,11,0.08)` | Small neutral things: chips, filter chips, options (...) button in the exercise card, unselected chart bars |
| `--shadow-pill-accent` | `inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.32)` | same | Small pink/green things: PR pill, selected segment, progress-bar fills, selected chart bar |
| `--shadow-nav` | `inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.35)` | `inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -2px 0 rgba(10,10,11,0.08)` | The active tab-bar item |
| `--shadow-inset` | `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)` | `inset 0 1px 0 #fff, inset 0 -1px 0 rgba(10,10,11,0.08)` | Fields, steppers, number fields, Notes field, segmented track, progress track, toggle track (off), checkbox. 1px top/bottom, no blur |
| `--shadow-lift` | `0 16px 40px rgba(0,0,0,0.6)` | `0 16px 40px rgba(10,10,11,0.16)` | ONLY floating layers: dialog, sheet, a dragged row. Combine with `--shadow-bevel` |

Size rule: big surfaces and buttons get 2px edges; small elements (chips, pills, selected segment, fields, tracks) get 1px. The active tab gets 2px top and bottom.

Selection is shown by **fill colour**, never by an outline.

### 2.6 Spacing and layout

- **8px grid.** 4px only for small steps (title to subtitle, gaps inside chips and segmented controls).
- **Screen gutter: 24px** left and right on every screen (`--gutter`).
- **Inside cards: 16px** padding (`--space-3`).
- **32px between sections**, **12px from a section label to its card**, **16px between items in a card**, **24px from a card's content to its primary button** (Suggested and In progress cards), **12px between controls inside the live exercise card** (set rows block, Add set, Log).
- Header area: content starts **64px from the top** (status-bar safe area). Use `padding-top: max(64px, env(safe-area-inset-top) + 20px)` so it stays right on notched phones. The first section starts 32px below the header.
- **Group related items in one card.** A list of workouts is ONE card (`ft-list`) with rows inside, separated by space, never by lines. Never a stack of separate mini-cards.
- Bottom padding of scroll content: 120px when there is only a tab bar, 200px when there is a pinned button above the tab bar, 120px when there is a pinned button and no tab bar (Reorder, Finish summary), 48px in the live session (no tab bar, no pinned button), so nothing hides behind them.

### 2.7 Touch and accessibility

- Controls are **56px** high (`--control-h`): buttons, fields, steppers, list rows (min), dashed rows, tab items.
- Nothing tappable is smaller than **44 x 44px** (`--tap-min`): icon buttons, play buttons, stepper +/-, the x on set rows.
- All text and controls pass **WCAG AA** in both themes, including the grey suggested values.
- Keyboard focus: `outline: 2px solid var(--focus); outline-offset: 2px` on `:focus-visible`.
- Icon-only buttons have `aria-label` (e.g. "Start Pull day", "Discard workout", "Exercise options", "Remove set", "Edit goal").
- Segmented controls are `role="radiogroup"` with `role="radio"` + `aria-checked`. The toggle is `role="switch"`. The progress ring is `role="img"` with `aria-label="2 of 6 exercises done"`. The active tab has `aria-current="page"`. Chart bars are buttons with `aria-pressed`.
- Respect `prefers-reduced-motion` (see 2.10).

### 2.8 Screen size

- Designed at 390 x 844. Content is one column.
- On wider screens (tablet/desktop) keep the app as a centered column, max width 430px, with `--bg` filling the rest. Do not design new wide layouts.

### 2.9 Iconography

- Outline icons, 24px default, **2px stroke** (2.25 on active tab and inside buttons), round caps and joins, `currentColor`.
- Use **Lucide** (`lucide-react`). Mapping:

| Use | Lucide icon |
|---|---|
| Home tab | `house` |
| Workouts tab | `dumbbell` |
| History tab | `history` |
| Progress tab | `chart-column` |
| Settings | `settings` |
| Back | `chevron-left` |
| Close / discard / remove set | `x` |
| Row chevron | `chevron-right` |
| Expand / collapse | `chevron-down` / `chevron-up` |
| Dropdown | `chevron-down` |
| Start / play | `play` (filled black) |
| Add / create | `plus` |
| Stepper | `minus`, `plus` |
| Drag handle | `grip-vertical` |
| Log, Save, Done, completed | `check` |
| Delete / remove | `trash-2` |
| Rename / edit | `pencil` |
| Duplicate | `copy` |
| Options | `ellipsis` |
| PR | `trophy` |
| Year count | `flame` |
| Last workout link | `arrow-up-right` |
| Next | `arrow-right` |
| Export / Import | `upload` / `download` |
| Search | `search` |
| Date field | `calendar` |

Sizes: 22px in 44px icon buttons, 20px inside primary buttons and fields, 18px in play buttons (filled), 14px inside the PR pill, 20px chevrons in rows, 24px in the tab bar. Empty states use the mini grid, not an icon.

### 2.10 Motion

Motion comes from the design system notes; it is not drawn in the screens. Treat exact timings as *(assumed)*.

- Pull-up sheet slides up 250ms ease-out; scrim fades in.
- Dragged rows lift: `scale(1.02)` + `--shadow-lift`, with a dashed placeholder (1.5px dashed `--line-strong`, radius 16, 56px tall) where the row will land.
- Log: the exercise slides into Completed, the next To do exercise slides up into the card.
- New PR on the finish summary: the green card pops in with a short scale bounce. This is the **only** celebration.
- `prefers-reduced-motion: reduce`: slides become fades, no bounce, no scale.

### 2.11 Copy and formatting

- English, plain, short. Talk to the user as "you". Sentence case.
- Buttons are verbs. **Primary buttons and destructive buttons always have a leading icon** (exceptions without icon: the neutral "Cancel" in a dialog, the four sheet actions, segmented options): "Start workout", "Resume workout", "Log", "Workout completed", "Done", "New workout", "Create", "Next", "Save", "Save changes", "Add exercise", "New exercise", "New goal", "Keep training", "Create your first workout".
- **Numbers first.** Middle dot ` · ` between facts. **Decimal comma** (`82,5`, `6,0 km/h`), **thousands dot** (`8.420 kg`).
- Time ranges with an en dash and spaces: `18:04 – 18:56`.
- Dates, lowercase month names:
  - Screen header: `Saturday, 12 september`
  - Rows: `Sat 12 sep · 52 min`, `Mon 28 sep`
  - Heaviest: `12 september`; table dates: `26 sep`
  - Goals: `100 kg · by 31 dec`, `120 kg · done 2 sep`; Edit goal field: `31 december 2026`
- Relative time: rows `9d ago`, card `Last done 9 days ago`.
- Targets: `12 · 10 · 8 reps`, `12 · 8 reps · 22,5 kg`, cardio `10 min · 6,0 km/h`. Logged: `12 · 10 · 8 · 100 kg`.
- Empty states: "No [things] yet" + "When you [do X], [it] will show up here." Friendly, never guilt-tripping.
- No emoji. No exclamation marks.
- Units follow the setting: kg pairs with km/h, lbs with mph. Every "kg" in this document becomes "lbs" (and km/h becomes mph) when the user picks lbs · mph.

---

## 3. Components

Build each once, with variants. Names in brackets are the CSS classes used in the design-system bundle (prefix `ft-`); you may name React components differently.

### 3.1 Screen shell
- Background `--bg`, full height, one column, gutter 24.
- Optional bottom **tab bar** (3.17) and optional **pinned button** (3.3).

### 3.2 Headers
- **Tab root header** (My workouts, History): title `screen-title`, padding `64px 24px 0`.
- **Home header**: greeting (`screen-title`) left, **gear** icon button (44px, `--surface`, `--shadow-button`) right, opens Settings.
- **Sub-screen header**: 44px icon button (back `chevron-left`, or `x` where noted) + 12px gap + title (`screen-title`, or `screen-title-long` when the title is longer than 13 characters) + optional date under it (`subtitle-lg`, muted, 2px gap) + up to two 44px icon buttons on the right. All items in the header row have a 12px gap. Title truncates with an ellipsis if it still does not fit.
- **Live-session header**: `x` button + workout name (`screen-title`) with date under it + **progress ring** (3.14) on the right. Finish summary: same but no `x`.
- **Progress tab header**: the Progress | Goals segmented control (3.13) at `padding: 64px 24px 0`, content starts 24px below.

### 3.3 Buttons
- **Primary** (`ft-btn--primary`): full width, 56px, radius 16, `--pink`, black label (`button` style), leading icon 20px, 8px gap, `--shadow-bevel-accent`. One per screen.
- **Neutral**: same size, `--surface-raised`, `--shadow-button`, label `--ink`. **Destructive neutral**: same but label and icon `--danger` (Discard workout, Delete).
- **Icon button** (headers: back, X, gear, pencil, trash, copy): 44 x 44, radius 16, `--surface`, `--shadow-button`, icon 22px stroke 2.25, `--ink`.
- **Ghost icon button** (actions inside a card or row: the Goals pencil, the per-exercise trash in Edit session, the set-row x in Set targets and Edit session): 44 x 44 tap area, transparent, no shadow, icon 20px, `--ink-muted`.
- **Options button** (the `...` in the live exercise card): 44 x 44, radius 16, `--surface-raised`, `--shadow-pill`, `ellipsis` 22px.
- **Play button** (`ft-play`): 44 x 44, radius 16, `--pink`, `--shadow-bevel-accent`, filled black play icon 18px. Starts that workout immediately.
- **Pinned button**: primary button fixed above the tab bar: `position: fixed; left: 0; right: 0; bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom))` (the tab bar is 88px: 8 + 56 + 24), `padding: 16px 24px`, background `--bg`. On screens without tab bar: `bottom: 0; padding: 16px 24px 32px` (plus `env(safe-area-inset-bottom)`).
- Disabled primary: `--surface-raised` fill, `--ink-disabled` label, no shadow *(assumed)* (not drawn).

### 3.4 Card (`ft-card`)
- `--surface`, radius 16, padding 16, `--shadow-bevel`, flex column, gap 16.
- **Hero** variant (Suggested workout / Workout in progress): gap 24 between the text block and the actions; text block = name (`display`) with a chip top-right (chip margin-top 4) and a `subtitle-lg` muted line 4px under it.
- **PR card**: `--green` fill, black text, `--shadow-bevel-accent`, trophy icon 24px + "New PR" (`title`) and the detail ("Bench press · 82,5 kg", 14/20) stacked with 2px gap, 12px gap after the icon.
- **Stat tile**: card with gap 8 between the label (`label`, muted) and a group of value (`stat`) + optional sub (`label`, muted, e.g. "18:04 – 18:56") with 4px between value and sub. Two side by side in a 2-column grid with 8px gap.

### 3.5 List card and rows (`ft-list`, `ft-row`)
- **List card**: one `--surface` card, radius 16, `--shadow-bevel`, padding `8px 0`. Rows inside have no background and no lines.
- **Row**: min-height 56, padding `12px 16px`, 12px gap. Parts: optional lead (drag handle `grip-vertical` 22px muted), body (title `title` + optional badge with 8px gap, subtitle `row-sub` muted, 4px gap), optional trail (chevron 20px muted, play button, check 22px `--green-text`, or a pencil icon button).
- **Done row**: title in `--ink-muted`, check in `--green-text`. Quieter, never darker.
- **Lifted row** (while dragging): `--surface-raised`, `--shadow-lift` + `--shadow-bevel`, `scale(1.02)`, 4px 8px margin.
- **Placeholder**: 56px, 1.5px dashed `--line-strong`, radius 16, margin `4px 16px`.

### 3.6 Section label (`ft-section`)
- `label` style, `--ink-muted`, padding `32px 4px 12px` (first one on a screen: `0 4px 12px`). Sentence case, no colon. Examples: "Suggested workout", "To do", "Completed", "September".

### 3.7 Chips and badges
- **Count chip** in rows/cards: height 24, padding `0 8px`, radius 8, `--surface-raised`, `--shadow-pill`, `small` muted ("6 exercises").
- **Hero chip** (in the Suggested / In progress card): height 28, padding `0 12px`, radius 8, 13/28 muted ("6 exercises", "3/6 exercises").
- **PR pill**: height 24, padding `0 8px`, radius 8, `--green`, black, `--shadow-pill-accent`, trophy 14px + 4px gap + "1 PR" / "2 PRs" *(assumed)* (on History rows and Last workout) or "PR" (on Session detail exercise rows and PRs list).
- **Filter chip** (chart filters): height 36, padding `0 16px`, radius 8, 13/18. Unselected `--surface-raised` + `--shadow-pill` + muted text. Selected: `--ink` fill with `--bg` text, no shadow.

### 3.8 Fields
- Label above: 13/18 muted, padding `0 4px 8px`.
- Field: min-height 56, padding `0 16px`, radius 16, `--surface-raised`, `--shadow-inset`, text `body` `--ink`, placeholder `--ink-muted`. Trailing: chevron-down (dropdown), "kg" suffix (muted), calendar icon (date), search icon.
- **Notes field**: 80px tall, text top-aligned (padding-top 16), placeholder "You can add notes about your workout here".
- **Number field** (Edit session): 56px, radius 16, `--surface-raised`, `--shadow-inset`, value centered, 20/26 with no letter-spacing, `--ink`. Tap opens the numeric keypad.
- Use native pickers: time (Edit session start/end), date (goal deadline), numeric keypad (`inputmode="decimal"` for weight/speed, `numeric` for reps/minutes).

### 3.9 Stepper (`ft-stepper`)
- 56px tall, radius 16, `--surface-raised`, `--shadow-inset`, padding `6px 2px`.
- Minus and plus buttons 44 x 44, transparent, radius 12, icon 20px stroke 2.25 `--ink`.
- Value centered, `number` style. **Suggested value = `--ink-muted`. Edited value = `--ink`.** (Colour only; never weight.)
- Tap the number to type it with the numeric keypad (for big jumps).
- Steps: **weight 2,5 kg**, **reps 1**, **minutes 1**, **speed 0,5**. (lbs step: see open question 13.)

### 3.10 Set row (`ft-setrow`)
One component, properties **state** (active | history | edit | target) and **type** (weight | cardio).
- Grid `24px 1fr 1fr`, 8px gap, align center. Column 1 = set number (`label`, muted, centered).
- Column headers row above the sets: empty, "Reps", "Weight (kg)" (cardio: "Minutes", "Km/h") in `label` muted, centered.
- **active** (live session): two steppers.
- **history** (Session detail, read-only): plain numbers, `body` style, centered, no boxes, 8px row gap, so nothing looks tappable.
- **edit** (Edit session): grid `24px 1fr 1fr 44px`: number, number field, number field, x button (44px, muted, removes the set).
- **target** (Set targets): "Set 1" (16/22, 56px wide) + one stepper (flex 1) + x button.
- Appears in: live session, session detail, edit session, set targets, last-5-times table.

### 3.11 Dashed add row (`ft-addrow`)
- Full width, min-height 56, radius 16, `1.5px dashed --line-strong`, transparent, `plus` icon 20 + label (`body`, `--ink`), centered, 8px gap.
- Only for adding **in place** ("Add set", "Add exercise" in the live session). Never for navigation.

### 3.12 Destructive row (`ft-dangerrow`)
- Full width, 56px, radius 16, `--surface`, `--shadow-button`, `trash-2` 20px + label in `--danger`, left aligned, padding `0 16px`, 12px gap. Used: "Remove from workout" on Set targets (32px above it).

### 3.13 Segmented control (`ft-seg`)
- Track: `--surface-raised`, `--shadow-inset`, radius 16, padding 4, 4px gap, full width, options `flex: 1`.
- Option: min-height 44, radius 12, `segment` style. Unselected transparent + muted. Selected `--pink` + black text + `--shadow-pill-accent`.
- Used for: Progress | Goals top tabs, Units, Theme.

### 3.14 Progress ring
- 56 x 56, circle radius 23, stroke 5, track `--pink-soft`, fill `--pink` with round caps, starts at 12 o'clock, label "2/6" (13/16, `--ink`) centered. Shows **exercises done / total**.

### 3.15 Progress bar (`ft-bar`)
- 8px tall, radius full, track `--surface-raised` + `--shadow-inset`, fill `--pink` + `--shadow-pill-accent`.
- **Gain variant** (finish summary goal): pink segment up to where the goal was before this session, then a **green** segment for what this session added, then empty.

### 3.16 Toggle and checkbox
- **Toggle** (`role="switch"`): 52 x 32, radius full. Off: `--surface-raised` + `--shadow-inset`, 24px knob `--ink-muted` at left 4. On (from the design system, not drawn on a screen): `--pink` + `--shadow-bevel-accent`, black knob at left 24. Used in a card row: label (`body`) + toggle ("Hide from home").
- **Checkbox**: 24 x 24, radius 8. Unchecked `--surface-raised` + `--shadow-inset`. Checked (from the design system, not drawn): `--pink` with a black check. Used in a 56px `--surface` card row with the label ("Cardio exercise").

### 3.17 Tab bar (`ft-tabbar`)
- Floats on the page: its background is `--bg`, there is no separate bar colour, border or shadow. Fixed bottom, padding `8px 24px 24px` (+ `env(safe-area-inset-bottom)`), 4 equal columns, 8px gap. Total height 88px + safe area (`--tabbar-h: 88px`).
- Item: height 56, radius 16, icon 24 + label (`small`) stacked with 4px gap.
- Inactive: transparent, `--ink-muted`, stroke 2. **Active**: `--pink-soft` block, `--pink-text` icon and label, stroke 2.25, `--shadow-nav`.
- Tabs: **Home**, **Workouts**, **History**, **Progress**. Labels under icons. No centre "+" button.
- Hidden during the live session (live session, reorder, finish summary).

### 3.18 Dialog
- Scrim `--scrim` over the whole screen, dialog centered with 24px side margin.
- Card: `--surface`, radius 16, padding `24px 16px 16px`, `--shadow-lift` + `--shadow-bevel`, gap 8.
- Title `heading` (margin-left 8), one line of text `body` muted (margins `0 8px 16px`), then buttons stacked full width with 8px gap.
- Title, one line saying what else is affected, then the actions.

### 3.19 Pull-up sheet
- Only used for **exercise options** in the live session.
- Scrim, sheet anchored to the bottom: `--surface`, radius `24px 24px 0 0`, padding `8px 24px 40px`, `--shadow-lift` + `--shadow-bevel`, gap 8.
- Grab handle 40 x 4, radius 2, `--ink-muted`, centered, 16px below it. Title (`heading`, exercise name), then action rows: 56px neutral buttons (`--surface-raised`, `--shadow-button`, radius 16, label `body` left aligned, padding `0 16px`). Destructive action label in `--danger`.

### 3.20 Empty state (`ft-empty`)
- Centered between header and pinned button, side padding 40, text centered, 8px gap.
- **Art: the mini year grid** (same on every tab): a `--surface` card (padding 16, radius 16, `--shadow-bevel`, 24px margin below) with a 7 x 7 grid of 12px cells, 4px gap, 2px radius, all `--surface-raised`, the middle cell (column 4, row 4) `--green` = "today". **Flat: no shadow on the cells.** It says "this is where it starts", in the same language as the Year overview.
- Title `heading`, then one or two lines `body` muted. The screen's normal primary button stays pinned.

### 3.21 Year grid (Year overview)
- In a card. Top row: count (32/32, -6%) + "sessions in 2026" (14/18 muted, 2px padding-top, 8px gap) top-left; **flame** 22px `--pink-text` top-right. The flame shows from **1 session up**; at 0 the number is `--ink-muted` and there is no flame.
- Grid: **52 columns x 7 rows** (364 days), column-major (each column is a week), **cells 4 x 4px, gap 2px, radius 1px**, fixed width **310px** (52 x 4 + 51 x 2), centered. Never stretch with space-between: whole pixels keep every gap exactly 2px. With a 24px gutter and 16px card padding the grid fits the card exactly.
- Colours: trained day `--pink`, today `--green` (solid fill, no ring/stroke), every other day (past and future) the same grey (dark `#262626`, light `#dcdce1`). No opacity changes.
- Month labels under it (Jan, Apr, Jul, Oct, Dec) in `micro` muted, spread over the same 310px.
- **0 sessions**: same grid, all grey (today still green), and the caption "Fills up after your first session" (13/18 muted, centered) instead of month labels.
- Decoration only: nothing happens on tap. It counts, it never judges (no streaks, no missed days).

### 3.22 Chart (Progress)
See 4.6.1.

### 3.23 Badge rules
- "PR" pill only where a PR happened. Green = good news only.

---

## 4. Navigation and screens

### 4.0 Navigation map

Four tabs, bottom tab bar, labels under icons.

| Tab | Icon | Screens it owns |
|---|---|---|
| Home | house | Home (4 states), Settings |
| Workouts | dumbbell | My workouts, Create new workout, Duplicate workout, Workout editor, Add exercise, Create/edit exercise, Set targets |
| History | history | History list, Session detail, Edit session, Delete confirm |
| Progress | chart-column | Progress, Goals, Create goal, Edit goal |

**Live session has no tab bar.** It takes over the screen (live session, exercise options sheet, reorder, discard dialog, finish summary). The only ways out are **Workout completed → Finish summary → Done**, or the **X → Discard**.

Rules:
- No centre "+" button in the nav. Creating is rare; starting a workout is frequent, and Home (and the play buttons in My workouts) do that in one tap.
- Everything is a full screen with a back arrow, except the exercise options menu in the live session, which is a pull-up sheet.
- Sub-screens keep the tab bar of the tab they belong to (Settings shows Home as active; Edit session shows History; Create/Edit goal show Progress).
- Destructive actions: a trash icon button top right on detail/edit screens (Workout editor, Session detail, Edit goal, per exercise in Edit session), or a red destructive row above the save button (Set targets "Remove from workout"). Always confirm destructive actions that delete history (see 4.5.4).

Suggested routes (implementation choice, not a design requirement):

```
/                          Home
/settings                  Settings
/workouts                  My workouts
/workouts/new              Create new workout
/workouts/:id              Workout editor
/workouts/:id/duplicate    Duplicate workout
/workouts/:id/add          Add exercise (picker)
/exercises/new             Create exercise   (?then=targets&workout=:id)
/exercises/:id/edit        Edit exercise
/workouts/:id/items/:item  Set targets
/session                   Live session (current open session)
/session/reorder           Reorder exercises
/session/finish            Finish summary
/history                   History list
/history/:sessionId        Session detail
/history/:sessionId/edit   Edit session
/progress                  Progress
/progress/goals            Goals
/goals/new                 Create goal
/goals/:id                 Edit goal
```

---

### 4.1 Home

Reference: `Main`, `HomeLight`, `HomeNoSessions(Light)`, `HomeEmpty(Light)`, `HomeResume(Light)`.

**Header**
- Greeting, no name, no date (there is no account). On **every app launch** Home picks one of three at random: **"Welcome back"**, **"Ready to train?"**, **"Let's get moving"**.
- Gear icon button top right → Settings.

#### 4.1.1 Full state (has workouts and sessions)
Sections in this order, 32px apart, each with a section label:

1. **Suggested workout**: one hero card:
   - Workout name (`display`), count chip top right **"6 exercises"**.
   - Under the name: **"Last done 9 days ago"** (`subtitle-lg`, muted).
   - Primary button **"Start workout"** (play icon), full width, 24px below the text.
   - Nothing else in this card.
2. **Or pick another**: one list card with the remaining workouts (excluding the suggested one and any with Hide from home). Each row: name, **"7 exercises · 7d ago"**, pink **play button** on the right that starts that workout immediately. Rows here have no chevron and no drag handle, and use padding `12px 12px 12px 16px` with a 16px gap (slightly different from the standard row in 3.5).
3. **Year overview**: the year grid (3.21): "48 sessions in 2026", flame, grid, month labels.
4. **Last workout**: a compact card linking to that session in History:
   - Row 1: name (`title`), count chip "6 exercises", PR pill "1 PR" (only if that session had PRs), 8px gaps, 40px right padding for the arrow.
   - Row 2 (13/16 muted, 16px gap): date "Mon 28 sep" and time "18:04 – 18:52".
   - **↗ arrow-up-right** 24px muted, absolutely positioned top 16 / right 16. The whole card is the link → Session detail.
   - No duration, volume or PR detail in this card.

**Suggestion logic:** suggest the workout with the oldest `LastPerformed` (never performed counts as oldest), skipping any with `HideFromHome = true`. Nothing is configurable. Ties: use the order in My workouts *(assumed)*.

#### 4.1.2 State: workouts but no sessions yet
- Suggested card works the same but the subtitle reads **"Not done yet"** (the chip still shows the exercise count).
- Or pick another rows show only **"7 exercises"** (no days-ago).
- Year overview: count **0** in `--ink-muted`, **no flame**, grid all grey with today green, caption **"Fills up after your first session"** instead of month labels. Not faded: same colours as the full grid.
- **Last workout section is hidden entirely.**

#### 4.1.3 State: no workouts
- Empty state (3.20): mini year grid, **"No workouts yet"**, **"When you create a workout, it'll show up here."**
- Pinned primary **"Create your first workout"** (plus icon) → Create new workout.

#### 4.1.4 State: workout in progress
Shown when there is an unfinished session (the app was closed or crashed during a live session; see 8.3 crash recovery). It **replaces the Suggested workout section**:
- Section label **"Workout in progress"**.
- Hero card: workout name (`display`), chip **"3/6 exercises"** (done / total), subtitle **"Started 18:04 · 32 min ago"**, a progress bar (exercises done / total), then a row with the primary **"Resume workout"** (play icon, flex 1) and a **56 x 56 neutral X button** (`--surface-raised`, `--shadow-button`, `x` 22px) 8px to its right.
- Resume → back into the live session exactly where it was.
- X → the **Discard dialog** (4.4.6). Discarding deletes the unfinished session.
- **"Or pick another" is hidden** while a session is in progress (you cannot start a second session).
- Year overview and Last workout show as normal.

### 4.2 Settings

Reference: `Settings`, `SettingsLight`. Opened from the gear on Home. Back button → Home. Tab bar shows Home active.

- Title **"Settings"** with a back icon button.
- Both Settings cards use padding `4px 0` (not the list-card `8px 0`).
- Section **"Preferences"**, one card with two stacked rows (padding 16, title `title` + optional sub 13/18 muted with 2px gap, then 12px, then a full-width segmented control):
  - **Units**, sub "Weight and speed": **"kg · km/h"** | **"lbs · mph"**. Default kg · km/h.
  - **Theme**: **"Auto"** | **"Light"** | **"Dark"**. Default Auto.
- Section **"Your data"**, one card with two action rows (min-height 76, padding 16, 12 gap): a 44px icon tile (radius 16, `--pink-soft`, `--pink-text` icon 22px, 1px top/bottom edges in the `--shadow-nav` colours: dark `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.35)`, light `inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(10,10,11,0.08)`), title (`body`) + sub (13/18 muted), chevron right.
  - **Export data**, "Save a backup file" (upload icon).
  - **Import data**, "Restore from a backup file" (download icon).
- Footer, 24px below, centered 13/18 muted: **"Loog 1.0 · Your data stays on this device"**.
- No onboarding exists: kg and Auto are just defaults, changed here.

### 4.3 Workouts

#### 4.3.1 My workouts (list)
Reference: `Workouts(Light)`, `WorkoutsEmpty(Light)`.
- Title **"My workouts"**.
- One list card. Each row: **drag handle** left, name, **"6 exercises · 9d ago"** (or "6 exercises" if never done), **pink play button** right.
  - **Tap the row** → Workout editor. **Tap play** → start that workout (live session). **Drag the handle** → reorder.
- Order is user-controlled by dragging. The index number is never shown.
- Pinned **"New workout"** (plus) → Create new workout.
- Empty: mini grid, **"No workouts yet"**, **"When you create a workout, it'll show up here."**, pinned "New workout" stays.

#### 4.3.2 Create new workout
Reference: `CreateWorkout(Light)`.
- Back button, title **"Create new workout"** (28px long-title size).
- Label **"Name"**, empty field.
- Pinned **"Create"** (plus) → creates the workout and goes to its **Workout editor** (empty exercise list).
- Create is disabled while the name is empty *(assumed)*.

#### 4.3.3 Duplicate workout
Reference: `DuplicateWorkout(Light)`. Opened from the copy icon in the Workout editor.
- Back button, title **"Duplicate [Workout]"** (e.g. "Duplicate Push day").
- Label "Name", field prefilled **"[Workout] copy"** with the text **selected** (keyboard ready to overwrite; the design shows the selection as a `--pink-soft` highlight).
- Section **"Preview"**: a read-only list card of the copied exercises (name + targets, no handle, no chevron).
- Pinned **"Create"** (plus) → creates the copy (all items and planned sets) and lands in its editor where everything is editable.

#### 4.3.4 Workout editor
Reference: `WorkoutEditor(Light)`.
- Header: back button, **workout name** (`screen-title`) with a small **pencil** icon (20px, muted) right after it; tapping the name or pencil renames it (interaction not designed: open question 25). Right side: **Duplicate** (copy icon) and **Delete** (trash icon) icon buttons.
- One list card of exercise rows: drag handle, exercise name, targets (**"12 · 10 · 8 reps"** or cardio **"10 min · 6,0 km/h"**), chevron → **Set targets** for that item. Drag to reorder.
- 16px below: a card row **"Hide from home"** with a toggle (default off). On = excluded from the Home suggestion and from "Or pick another".
- Pinned **"Add exercise"** (plus) → Add exercise picker. (It navigates, so it is a button, not a dashed row.)
- **There is no Start button in the editor.** Workouts are started from Home or with the play button in My workouts.
- Delete workout: see open question 9 for the confirm.

#### 4.3.5 Add exercise (picker)
Reference: `AddExercise(Light)`, `AddExerciseEmpty(Light)`.
- Back button, title **"Add exercise"**.
- Search field, placeholder **"Search"**, search icon at the right. Filters the list by name as you type.
- Section label **"Choose existing exercise"**, then one list card: name + **"Chest · Barbell"** (muscle group · equipment) or **"Cardio"**, chevron.
- Pinned **"New exercise"** (plus) → Create exercise.
- Tapping an existing exercise **skips Create exercise** and goes straight to **Set targets** for it (it is added to the workout).
- Empty (no exercises exist): no search field and **no "Choose existing exercise" label**; mini grid, **"No exercises yet"**, **"When you create exercises, you'll find a list of them here."**; pinned "New exercise" stays.
- The same picker is reused in the live session for "+ Add exercise" and "Swap for another exercise" (4.4).

#### 4.3.6 Create / edit exercise
Reference: `CreateExercise(Light)`.
- Back button, title **"Create exercise"** (edit mode: see open question 5 for the title; trash icon top right in edit mode only).
- Label **"Name"** + field.
- 16px below: checkbox card row **"Cardio exercise"**. When ticked, **Muscle group and Equipment disappear** and a hint reads **"Logged in minutes and km/h"** (mph when lbs · mph).
- Label **"Muscle group"** + dropdown field (single select, fixed list + "Other"). Label **"Equipment"** + dropdown field. (24px above each label, 8px below.) The lists are open question 4.
- Pinned button: **"Next"** (arrow-right) when creating → continues to Set targets. **"Save"** (check) when editing → back.
- **Delete exercise** only when editing: if it has history, confirm with the count of affected sessions and PRs (section 5.3, rule 3).
- Renaming an exercise updates it everywhere (only a pointer is stored).

#### 4.3.7 Set targets
Reference: `SetTargets(Light)`.
- Back button, title **"[Exercise] sets"** (e.g. "Bench press sets").
- Section label **"Set a target for each set"**.
- One card with a row per planned set: **"Set 1"**, a stepper with the target reps (edited style, `--ink`), and an **x** button (44px, muted) that removes that set.
- Cardio variant: **Time (minutes)** and **Speed** instead of reps (design not drawn; see open question 6).
- 12px below: dashed **"Add set"** row (adds in place; the new set copies the previous set's target *(assumed)*).
- 32px below: destructive row **"Remove from workout"** (trash). **Only shown when arriving from an existing row in the editor, not straight after adding the exercise.**
- Pinned **"Save"** (check) → back to the editor.

### 4.4 Live session

The most-used screen in the app. **No tab bar.** Reference: `LiveSession(Light)`, `LastLogged(Light)`, `ExerciseOptions(Light)`, `Reorder(Light)`, `DiscardDialog(Light)`, `FinishSummary(Light)`.

#### 4.4.1 Header
- **X** icon button top left → Discard dialog.
- Workout name (`screen-title`), date under it: **"Saturday, 12 september"** (the session's date).
- **Progress ring** top right (56px, about double icon size), showing **exercises done / total**, e.g. "2/6". Logged and skipped exercises count as done.

#### 4.4.2 Current exercise card
- Section label above the card: **"Exercises 3/6"** (position of the current exercise / total).
- Card (gap 12):
  - Top: exercise name (`heading`) and under it **"Last time: 12/10/8 · 70 kg · PR 75"** (13/18 muted): reps per set separated by slashes, the weight, and the exercise's heaviest PR. When the sets had different weights: open question 26. Right: **options** button (44px, `--surface-raised`, `--shadow-pill`, `ellipsis` icon) → Exercise options sheet. First time ever for this exercise: see open question 12.
  - Column headers: **Reps | Weight (kg)**, or **Minutes | Km/h** for cardio.
  - One set row per set (3.10 active): set number + two steppers.
    - **Grey value = suggestion** from the last session of this exercise, or from the targets the first time. **Ink value = the user changed it.**
    - Steps: weight 2,5 kg, reps 1, minutes 1, speed 0,5. Tapping the number opens the numeric keypad for big jumps.
    - A suggested value counts as a real value when logging, so the user does not need to touch it *(assumed)*.
  - Dashed **"Add set"** (adds a row in place, copying the last row's values as grey suggestions *(assumed)*).
  - Primary **"Log"** (check icon), 12px below Add set:
    - Logs the **whole exercise at once**, not per set.
    - **Disabled** while a required value is still empty (for example a brand-new exercise with no weight yet).
    - After logging, the exercise moves to **Completed** and the next **To do** exercise becomes the card (motion 2.10).
- Spacing inside the card: 12px between the set-rows block, Add set and Log (consistent with Home).

#### 4.4.3 Below the card
- **To do**: one list card of upcoming exercises: name + target reps + the weight from the last session (**"12 · 8 reps · 22,5 kg"**; weight left out when there is no history) *(assumed)*, chevron.
  - Tapping a row makes it the current card (jumping is allowed and does not change the workout).
  - The chevron gets its own 44 x 44 tap area *(assumed)* (separate from the row) and opens **"Last 5 times"** as a small table (date | set 1 | set 2 | ... | kg). Not drawn in hi-fi; see open question 11.
- 12px below: dashed **"Add exercise"**: opens the same picker (4.3.5); picking an exercise goes straight back to the session with that exercise and **one empty set row**. It counts for **this session only** and is not added to the workout.
- **Notes**: Notes field (80px), placeholder **"You can add notes about your workout here"**. Free text for the session.
- **Completed**: one list card of logged exercises: name in `--ink-muted`, numbers (**"12 · 10 · 8 · 100 kg"** / **"10 min · 6,0 km/h"**), green check. **Tap to edit** (see open question 10).
- Bottom padding 48px (no tab bar).

#### 4.4.4 Exercise options (pull-up sheet)
- Grab handle, exercise name as title, then four actions:
  - **"Swap for another exercise"** → opens the picker; the chosen exercise replaces this one in this session.
  - **"Reorder exercises"** → Reorder screen.
  - **"Skip this exercise"** → resolves it without logging (counts as done for the ring and for Workout completed).
  - **"Remove from session"** (red) → removes it from this session only.
- Tap the scrim or drag down to close *(assumed)*.

#### 4.4.5 Reorder exercises
- **X** top left (closes without saving *(assumed)*), title **"Reorder exercises"**.
- Section **"Completed"**: done rows (muted, green check), **no drag handle, cannot be moved**.
- Section **"To do"**: rows with drag handles. While dragging, the row lifts (`scale(1.02)` + `--shadow-lift`, `--surface-raised`), a dashed placeholder shows where it lands.
- Pinned **"Save"** (check), no tab bar.
- **Reordering here also updates the workout's order for next time.**

#### 4.4.6 Discard dialog (X)
- Title **"Discard this workout?"**, text **"You've already logged 3 exercises, discarding means they won't be saved."** (the number is the logged count).
- Buttons: **"Keep training"** (primary, play icon) / **"Discard workout"** (neutral, `--danger` text, trash icon).
- There is no "leave and come back" button in the session. It either continues or is discarded. (The Home "Workout in progress" card only exists for crash recovery / app close, 4.1.4.)

#### 4.4.7 All exercises logged
- When To do is empty, the **Log** button in the card becomes **"Workout completed"** (check icon), in the same position.
- Skipped exercises count as resolved, so a skipped exercise does not block the button.
- Reference `LastLogged`: section "Exercises 6/6", ring 5/6, the last exercise in the card, all others in Completed. (The reference leaves out the dashed Add exercise row and Notes for brevity; both stay on the screen *(assumed)*.)
- Tapping it **logs the current exercise** (same as Log) and then saves the session (EndTime = now) and goes to the Finish summary *(assumed)*.

#### 4.4.8 Finish summary
Reference: `FinishSummary(Light)`. No tab bar, no X.
- Header: **"[Workout] done"** (e.g. "Push day done") + date; progress ring at **100%** ("6/6", pink).
- **Time** and **Volume** stat tiles side by side: Time **"52 min"** with **"18:04 – 18:56"** underneath; Volume **"8.420 kg"**.
- 8px below: **New PR** green card: trophy, "New PR", **"Bench press · 82,5 kg"** (which exercise and what number). Only if this session set a PR; pops in with the bounce (2.10). Multiple PRs: open question 14.
- **Notes**: Notes field (same placeholder), editable here.
- **Exercises**: list card of the completed exercises (done style with green checks).
- **Goal** (last section, only if this session moved a goal): card with the exercise name (`title`) and **"82,5 / 100 kg"** (13/18 muted) on one line, then the **gain bar**: pink up to where the goal was after the previous session, **green** for what this session added, rest empty. No extra text (to see full goal progress the user goes to Goals).
- Pinned **"Done"** (check), no tab bar → Home.

### 4.5 History

#### 4.5.1 History list
Reference: `History(Light)`, `HistoryEmpty(Light)`.
- Title **"History"**.
- Grouped by month, newest first *(assumed)*: section labels **"September"**, **"August"** (add the year when it is not the current year, see open question 15).
- Each month is one list card. Row: workout name + **PR pill** ("1 PR", only if the session had PRs), **"Sat 12 sep · 52 min"**, chevron → Session detail.
- Empty: mini grid, **"No history yet"**, **"When you finish your first workout, it'll show up here."** (no pinned button).

#### 4.5.2 Session detail
Reference: `SessionDetail(Light)`.
- Header: back button, workout name, date under it ("Saturday, 12 september"). Right: **pencil** (Edit session) and **trash** (Delete confirm) icon buttons.
- **Time** (duration + "18:04 – 18:56") and **Volume** stat tiles side by side.
- **PRs**: list card, one row per PR from this session: exercise name, **"82,5 kg · heaviest"** (type is heaviest or most reps), "PR" pill on the right.
- **Notes**: card with the note text (hide the section if there is no note, see open question 16).
- **Exercises**: one list card, rows **collapsed** by default: exercise name + "PR" pill if that exercise had a PR, **"3 sets"** ("1 set" for one) underneath, **chevron-down** on the right. Tap → expands into a read-only table under the row (chevron becomes **chevron-up**): set number | **Reps** | **Weight (kg)** (cardio: Minutes | Km/h), plain numbers, no boxes, so nothing looks tappable. No divider line between row and table.
- Tab bar: History active.

#### 4.5.3 Edit session
Reference: `EditSession(Light)`.
- Header: **X** (cancel, throws all changes away), title **"Edit [Workout]"** (e.g. "Edit Push day"), date under it.
- **Start** and **End** time fields side by side (labels above, native time picker, chevron).
- **Notes** field (filled with the current note).
- Section **"Exercises"**: per exercise a card: name (`title`) + **trash** icon (removes that exercise from the session), column headers Reps | Weight (kg), set rows with **number fields** (not steppers: two steppers and an x do not fit on a phone) and an **x per row**, dashed **"Add set"**.
- You **cannot add or reorder exercises** here. Editing history is for corrections only.
- Pinned **"Save changes"** (check). The whole session saves at once, so PRs recalculate once.
- Tab bar: History active.

#### 4.5.4 Delete confirm
Reference: `DeleteConfirm(Light)` (dialog over Session detail).
- Title **"Delete this session?"**, text **"Push day, 12 september. This also removes 1 PR."** (omit the PR sentence when it removes none and write "2 PRs" for more than one *(assumed)*).
- Buttons: **"Cancel"** (neutral) / **"Delete"** (neutral, `--danger`, trash icon). Delete → back to History list *(assumed)*.

### 4.6 Progress

Two top tabs: **Progress | Goals** (segmented control in the header). Tab bar: Progress active on all four screens.

#### 4.6.1 Progress
Reference: `Progress(Light)`, `ProgressEmpty(Light)`.
- **Exercise picker**: dropdown field showing the exercise name (e.g. "Bench press"). Cardio exercises are excluded (open question 2).
- **Chart card** (8px below):
  - Bar chart, one bar per period. **Each bar = the heaviest weight lifted for that exercise in that period.**
  - The **kg value is printed above every bar** (12/16; selected bar `--ink`, others muted). Period label under each bar (e.g. "Apr", "May"; 12/16; selected `--ink`, others muted).
  - **Empty period**: no bar, just a **4px stub** (`--surface-raised`, radius 2) at the baseline so it is visibly empty, no value label.
  - **Selected bar**: `--pink` + `--shadow-pill-accent`. Other bars: `--pink-soft` + `--shadow-pill`. Bar radius 8 top / 2 bottom, 8px between bars, chart area 184px tall. The design scales bars between 40 and 85 kg so differences are visible; implement a baseline below the lowest visible value (for example 60% of the minimum) rather than zero (implementation choice).
  - **Tap a bar to select a period.** The latest period is selected by default *(assumed)*.
  - **Filter row** under the bars: chips **"Week"**, **"Month"**, **"Year"**, **"All time"**. The filter decides **how the bars are grouped**: Week = one bar per week (highest in those 7 days), Month = one bar per month, Year = one bar per year. "All time": open question 3. Default filter: Month *(assumed)*.
  - The chart **scrolls horizontally** so you can look back at older periods (newest on the right).
- **"Heaviest in [period]"** (e.g. "Heaviest in September"): card with **"82,5 kg × 12"** (`heading`) and the date **"12 september"** (13/18 muted, 8px after), trophy icon (`--pink-text`) right. Shows the heaviest set within the selected period.
- **"History of [Exercise] · [period]"**: card with a table, **rows per date** (newest first *(assumed)*), **columns per set number**: **Date | 1 | 2 | 3 | kg** (reps per set, then the weight). Dates muted, left; values `--ink`, centered; 12px row gap. Only sessions in the selected period. More sets than fit: open question 17.
- **Cardio exercises are excluded from PRs and from goal selection.**
- Empty: mini grid, **"No progress yet"**, **"When you complete your first workout, data of different exercises will show up here."**

#### 4.6.2 Goals
Reference: `Goals(Light)`, `GoalsEmpty(Light)`.
- Section **"Active"**: one list card. Each goal: exercise name (`title`), **"100 kg · by 31 dec"** (row-sub muted), **pencil** icon button (edit) top right, progress bar, **"82,5 / 100 kg"** (13/18 muted). 12px gaps, padding 16.
- Section **"Completed"**: completed goals, **visually quieter** than active ones (secondary treatment, not darker): name in `--ink-muted`, **"120 kg · done 2 sep"**, green check, no bar, no pencil.
- Pinned **"New goal"** (plus) → Create goal.
- Empty: mini grid, **"No goals yet"**, **"When you create goals, you'll be able to track your progress here."**, pinned "New goal" stays.

#### 4.6.3 Create / edit goal
Reference: `CreateGoal(Light)`, `EditGoal(Light)`.
- Full screen, back button, **no Progress | Goals tabs visible** (tab bar stays, Progress active).
- Title **"Create goal"** / **"Edit goal"**.
- **Exercise** (dropdown, cardio excluded), placeholder **"Choose an exercise"**.
- **Target** (field with a muted **"kg"** suffix, decimal keypad).
- **Deadline** (native date picker, calendar icon), placeholder **"Pick a date"**.
- Labels above fields: 24px above, 8px below.
- Edit version: fields filled ("Bench press", "100", "31 december 2026"), plus a **Progress** card 32px below (title "Progress", "82,5 / 100 kg", bar) and a **trash** icon button top right (delete goal; see open question 9).
- Pinned **"Save"** (check).
- A goal is **completed automatically** when a logged set beats the target (status → completed, moves to Completed with the date).

---

## 5. Data model

Ten domain objects (plus local Settings at the end). `-` = attribute, `+` = operation. Attributes marked *(calculated)* are **never stored, always derived**.

### Exercise
The definition. Exists once, shared everywhere.
```
- Name : String
- IsCardio : Bool
- MuscleGroup : String   (dropdown, only when IsCardio = false)
- Equipment : String     (dropdown, only when IsCardio = false)
+ Create()  + Edit()  + Delete()
```

### Workout
The plan you build and reuse.
```
- Name : String
- Order : Int                    (position in My workouts, never shown as a number)
- HideFromHome : Bool            (excluded from the Home suggestion and "Or pick another")
- LastPerformed : Date (calculated)
+ Create()  + Edit()  + AddExercise()  + RemoveExercise()  + Reorder()  + Duplicate()  + Start()  + Delete()
```

### Workout item
One exercise inside one workout. Holds the plan, not the result.
```
- ExerciseId : Pointer
- Order : Int
+ EditTargets()
```

### Planned set
One planned set inside a workout item. Exists so every set can have its own rep target.
```
- Order : Int
- TargetReps : Int
```
Cardio items plan Time (minutes) and Speed instead (see open question 6 for how they are stored).

### Session
One gym visit that happened.
```
- StartTime : Date
- EndTime : Date
- Notes : String (optional)
- Duration : Time (calculated: EndTime - StartTime)
- Volume : Int   (calculated: sum of weight x reps across all sets)
+ Start()  + Finish()  + Edit()  + Delete()
```
Implementation: also store the source WorkoutId (nullable, the session survives when the workout is deleted), a status (`in_progress` | `finished`), and for the live session the current exercise and each logged exercise's state (`todo` | `logged` | `skipped`).

### Logged exercise
One exercise inside one session. A container for sets.
```
- ExerciseId : Pointer
- Order : Int
+ AddSet()  + Reorder()  + Remove()
```

### Set
The only place real numbers live.
```
- Reps : Int          (strength)
- Weight : Float      (strength)
- Duration : Time     (cardio, minutes)
- Speed : Float       (cardio, km/h or mph)
- Order : Int
- Completed : Bool
+ Log()  + Edit()  + Delete()
```

### PR
Never typed, always derived from sets.
```
- Type : String        (heaviest | most reps)
- Value : Float
- DateAchieved : Date
+ View()
```

### Goal
Only one kind of goal in v1: heaviest lift.
```
- ExerciseId : Pointer
- TargetValue : Float
- Deadline : Date
- Status : String
- Progress : Float (calculated: heaviest PR / TargetValue)
+ Create()  + Edit()
+ Complete()   (automatic when a set beats the target)
+ Delete()
```

### Home
No attributes. A view onto other objects.
```
+ StartWorkout()  + ViewHistory()  + ViewProgress()  + ViewGoals()  + Settings()
```

### Settings (local preferences)
```
- Units : "kg_kmh" | "lbs_mph"      (default kg_kmh)
- Theme : "auto" | "light" | "dark"  (default auto)
```

### Relationships
- Home **has-a** Workout, Session, Goal
- Workout **has-a** Workout item; Workout item **has-a** Planned set; Workout item **points to** Exercise
- Workout → Session: **association**, unlabelled. A session comes from a workout but survives without it.
- Session **has-a** Logged exercise; Logged exercise **points to** Exercise; Set is **part-of** Logged exercise
- Exercise **has-a** PR; Goal **targets** Exercise
- Constraint: `{data stays on device}`

### 5.3 Data rules
1. Renaming an exercise updates it everywhere, because nothing stores its name, only a pointer.
2. **PRs, volume, duration, progress and "last performed" are always calculated, never stored.** This prevents numbers disagreeing with each other.
3. Deleting an exercise that has history shows a confirm with the **count of affected sessions and PRs**.
4. A target is not a contract. Logging fewer sets than planned is normal and is **never flagged**.
5. "+ Add exercise" during a session is **session-only**; it is not added to the workout.
6. Reordering in the live session (Reorder screen) **also updates the workout's order** for next time.
7. Editing a session saves all at once; PRs recalculate once.
8. Deleting a session removes its PRs (the confirm says how many).
9. Cardio exercises never produce PRs and cannot be goal targets.
10. Bodyweight exercises (pull-ups) are logged with weight 0 in v1 (open question 7).
11. Goal completes automatically when a logged set's weight beats the target.
12. Suggested values in the live session come from the **last session of that exercise**, or from the **targets** the first time.

---

## 6. Calculations and formatting helpers

- **Volume** = Σ (weight × reps) over all strength sets of the session. Shown as "8.420 kg" (thousands dot).
- **Duration** = EndTime − StartTime, shown as "52 min" (hours: open question 18).
- **LastPerformed** (workout) = StartTime of the latest finished session from that workout. Shown as "9d ago" in rows, "Last done 9 days ago" in the Suggested card.
- **PR heaviest** = max weight for that exercise (strength only). **PR most reps** = max reps in one set. A session "has a PR" when one of its sets set a new PR at that time.
- **Goal progress** = current heaviest for the exercise / TargetValue, shown as "82,5 / 100 kg".
- **Year overview**: count = finished sessions in the current calendar year ("48 sessions in 2026"). The grid shows the **current calendar year** (month labels Jan to Dec), one cell per day in week columns, days after today in the same grey. A day is "trained" when at least one session finished that day. The design uses 52 x 7 = 364 cells; how to fit day 365/366 without breaking the 310px width is open question 23.
- **Exercise counts** ("6 exercises") on Home and My workouts = number of workout items in that workout. "3/6 exercises" in a session = resolved (logged or skipped) / total.
- Number format: `Intl.NumberFormat('nl-NL')` gives decimal comma and thousands dot; max 1 decimal for weight and speed ("82,5", "6,0 km/h" keeps one decimal for speed).
- Dates: English month and weekday names, lowercase months: "Saturday, 12 september", "Sat 12 sep", "12 september". Build these with a small helper (do not rely on locale defaults, which capitalize months).
- Units: store canonical kg and km/h, convert for display and input when lbs · mph is selected (implementation choice, see open question 13 for rounding/steps).

---

## 7. Tech stack

Recommended for this app (a local-only, installable PWA with ~30 screens and a lot of state):

| Concern | Choice | Why |
|---|---|---|
| UI | **React + TypeScript** | Screens and the design system map 1:1 to components; TypeScript keeps the 10-object data model honest |
| Build | **Vite** | Fast, simple static build |
| Offline / install | **vite-plugin-pwa** (Workbox) | Service worker, precache, manifest, "Add to home screen" |
| Storage | **Dexie.js** on IndexedDB | Survives crashes and app restarts; easy queries; export/import as a JSON file |
| Styling | **Plain CSS with the tokens as CSS variables** (`tokens.css`), CSS modules or one stylesheet per component | The design system already exists; no Tailwind needed |
| Routing | React Router | Routes in 4.0 |
| Drag to reorder | **dnd-kit** | Accessible, touch friendly (lift + placeholder) |
| Icons | **lucide-react** | Mapping in 2.9 |
| Font | **@fontsource/lexend-deca** (400) | Self-hosted for offline |
| Chart | **Hand-built SVG/CSS bars** | The chart is simple; a chart library adds weight and fights the design |
| Tests | **Vitest** (logic: PRs, volume, suggestion, formatting) + **Playwright** (flows, both themes, mobile viewport 390 x 844) | Mike is a tester; the app is tested with the target group after the build |
| Hosting | Free static host: Netlify, Cloudflare Pages or GitHub Pages | No backend |

No backend, no auth, no Supabase, no analytics in v1.

---

## 8. Build notes

1. **Storage:** local only (IndexedDB). No backend. **Export** writes one JSON file with everything; **Import** reads it back (replace all data after a confirm: open question 8).
2. **Delivery:** a PWA, installable on the home screen from a link. Hosted free on a static host. Web app manifest name "Loog", theme/background colour from `--bg`, standalone display, portrait *(assumed)*.
3. **Crash recovery:** an interrupted session must still be there when the app reopens. Home then shows the **Workout in progress** card (4.1.4). This is not the same as "leaving" a session, which the session UI does not offer.
4. **Autosave:** the live session persists quietly as values change (every stepper tap), so a dead battery does not cost an exercise.
5. **Native inputs:** use the system time picker, date picker and numeric keypad rather than custom ones.
6. **Units:** one setting drives everything. kg pairs with km/h, lbs with mph.
7. **Stale sessions:** a session left open for more than ~12 hours is **auto-finished** rather than staying "in progress" forever (EndTime = time of the last change *(assumed)*).
8. **Greeting:** pick one of the three greetings at random on every app launch, not on every render.
9. **Theme:** apply the saved theme before first paint (inline script in `index.html`) to avoid a flash of the wrong theme.
10. **Safe areas:** respect `env(safe-area-inset-*)` for the header, the tab bar and pinned buttons.

---

## 9. Testing plan

- Unit tests (Vitest): volume, duration, PR detection (heaviest, most reps, cardio excluded), goal progress and auto-complete, Home suggestion logic (oldest LastPerformed, HideFromHome), number/date formatting (decimal comma, thousands dot, lowercase months), unit conversion, stale-session auto-finish.
- E2E (Playwright, 390 x 844, dark and light): create exercise → create workout → set targets → start from Home → log all → Workout completed → Finish summary → History → Session detail → Edit session → Delete; crash recovery (reload mid-session → Workout in progress → Resume); discard; Progress filter and bar select; goals create/edit/auto-complete; export/import round trip.
- Visual check against `reference/png/` for every screen in both themes.
- After the build: test with the target group (Mike and friends who train), collect feedback, implement it in the next version.

---

## 10. Screen inventory (reference files)

Every screen exists as `reference/screens/<Name>.html` (dark) and `<Name>Light.html` (light), plus PNGs with the same names.

| Area | Reference name | Screen |
|---|---|---|
| Home | `Main` / `HomeLight` | Home, full |
| Home | `HomeNoSessions` | Home, workouts but no sessions |
| Home | `HomeEmpty` | Home, no workouts |
| Home | `HomeResume` | Home, workout in progress |
| Home | `Settings` | Settings |
| Workouts | `Workouts` | My workouts |
| Workouts | `WorkoutsEmpty` | My workouts, empty |
| Workouts | `WorkoutEditor` | Workout editor |
| Workouts | `CreateWorkout` | Create new workout |
| Workouts | `DuplicateWorkout` | Duplicate workout |
| Workouts | `AddExercise` | Add exercise (picker) |
| Workouts | `AddExerciseEmpty` | Add exercise, empty |
| Workouts | `CreateExercise` | Create exercise |
| Workouts | `SetTargets` | Set targets |
| Live session | `LiveSession` | Current exercise (full scroll: card, To do, Add exercise, Notes, Completed) |
| Live session | `ExerciseOptions` | Exercise options sheet |
| Live session | `Reorder` | Reorder exercises (one row lifted, placeholder shown) |
| Live session | `DiscardDialog` | Discard dialog |
| Live session | `LastLogged` | Last exercise, "Workout completed" |
| Live session | `FinishSummary` | Finish summary |
| History | `History` | History list |
| History | `HistoryEmpty` | History, empty |
| History | `SessionDetail` | Session detail, one exercise expanded |
| History | `EditSession` | Edit session |
| History | `DeleteConfirm` | Delete confirm |
| Progress | `Progress` | Progress with chart (September selected) |
| Progress | `ProgressEmpty` | Progress, empty |
| Progress | `Goals` | Goals |
| Progress | `GoalsEmpty` | Goals, empty |
| Progress | `CreateGoal` | Create goal |
| Progress | `EditGoal` | Edit goal |

Content in the reference screens is sample data (Push day, Bench press, 82,5 kg...) and is not internally consistent. The user fills the app with their own content; all numbers are calculated.

---

## 11. Decisions made during design (changes from the original lo-fi handoff)

These override the original handoff. Do not "restore" the old version.

| Topic | Original handoff | Decided |
|---|---|---|
| Greeting | "Hi Mike" | No name, no date. Random of "Welcome back" / "Ready to train?" / "Let's get moving" on every launch |
| Theme | No theme setting, follow system | Settings has Theme: Auto (default) / Light / Dark |
| Settings rows | Units, Export, Import | Units, Theme, Export, Import + footer "Loog 1.0 · Your data stays on this device" |
| Onboarding | n/a | None. kg and Auto are defaults |
| Suggested card | Bordered card, name, days ago, Start | No border (inner edges), name + "6 exercises" chip, "Last done 9 days ago", "Start workout" |
| Or pick another | Plain rows with days-ago | One list card, rows with "7 exercises · 7d ago" and a pink play button |
| Year overview | "Date overview", faded when empty | Called "Year overview", count + flame (from 1 session), today green, every empty day the same grey, not faded |
| Last workout | Name, date, duration, volume, PRs | Name, exercise-count chip, PR pill, date and time, ↗ arrow. No duration/volume |
| Home with open session | No "leave and come back" | Crash recovery shows a "Workout in progress" card instead of Suggested: Resume + X (discard) |
| Empty states | Icon | Mini year grid (7x7, today green) on every tab |
| Workout list rows | Name, days ago, drag handle, chevron | Drag handle, name, "6 exercises · 9d ago", pink play button (starts). Tap row = edit |
| Workout editor | Pinned Start; Duplicate and Delete at the bottom | No Start button; Duplicate and Delete as icon buttons top right; pinned "Add exercise" |
| Hide from home | Toggle row | Toggle row (confirmed) |
| Font weights | "Roughly four sizes, two weights" | One weight only (400). Hierarchy by size, tracking and colour |
| Secondary / outline button | Duplicate, Cancel as outline buttons | No outlines anywhere. Duplicate is an icon button in the editor header; Cancel is a neutral filled button |
| Primary button position | Pinned above the tab bar on every screen | Pinned on list/form screens; inside the card for Start workout / Resume workout (Home) and Log / Workout completed (live session) |
| Create / edit goal | "No tabs visible" | The Progress / Goals top tabs are hidden; the bottom tab bar stays (Progress active) |
| Session detail order | Time, Volume, Notes, PRs, Exercises | Time + Volume, PRs, Notes, Exercises |
| Finish summary | No exercise list | Adds an Exercises list (completed rows) before the Goal block |
| Home, no sessions | Suggested shows exercise count instead of days-ago | Count is always in the chip; the subtitle reads "Not done yet" |
| Motion | To decide | Defined in 2.10 (from the design system) |
| Edited vs suggested value | Black vs grey | `--ink` vs `--ink-muted`, colour only, weight 400 |
| Edit session set rows | Steppers + x | Number fields + x (two steppers and an x do not fit) |
| Progress chart | Open question: weight, reps or volume | Heaviest weight per period, kg on each bar, empty periods as 4px stubs, tap a bar to filter Heaviest and History to that period |
| Finish summary | Goal bar if moved | Goal block last, pink up to previous, green for this session's gain, no extra text; ring at 100% top right |
| Notes | Free text | Placeholder "You can add notes about your workout here", 80px field |
| Session detail exercises | Collapsed, tap to expand | Name + PR pill, "3 sets", chevron down/up, no divider line |

---

## 12. Acceptance checklist (per screen)

- [ ] Matches its reference PNG in **dark and light** (spacing, sizes, colours, copy).
- [ ] Only token values; no raw hex in components (exception: the two year-grid greys).
- [ ] No font weight other than 400.
- [ ] No borders, outlines, gradients or outer shadows (except `--shadow-lift` on dialog, sheet, dragged row, and the dashed add rows/placeholder).
- [ ] Every tap target at least 44 x 44; controls 56 high.
- [ ] 24px screen gutter, 16px card padding, 32px between sections, 12px label → card.
- [ ] Text passes WCAG AA; focus ring visible on keyboard focus.
- [ ] Works offline after first load; data survives a reload and a killed tab mid-session.
- [ ] Copy exactly as in this document (sentence case, decimal comma, middle dots, lowercase months).
- [ ] Respects the unit setting everywhere (labels, suffixes, steps).
- [ ] Reduced motion respected.

---

## 13. Open questions and undesigned states (ask Mike)

Build a placeholder from existing patterns, mark `// TODO(Mike)`, and list these in your summary. Do not decide them silently.

1. **"+ Add exercise" in a session:** does it ever get promoted into the workout itself, or always stay session-only? (Current rule: session-only.)
2. **Cardio in Progress:** should cardio exercises appear anywhere in Progress (picker, chart), or stay out entirely? (Current: excluded from PRs and goals; picker shows strength only.)
3. **"All time" chart filter:** how are bars grouped (per year? per month for the whole history?).
4. **Muscle group and Equipment lists:** the fixed options (+ "Other") are not defined yet.
5. **Edit exercise screen:** title ("Edit exercise"?) and layout are not drawn; same fields as Create + trash top right + Save. (Entry point: question 27.)
6. **Cardio variants are not drawn in hi-fi:** Set targets (Time + Speed rows), live card (Minutes | Km/h steppers), Create exercise with Cardio ticked (hint "Logged in minutes and km/h"). How planned cardio values are stored (Planned set only has TargetReps).
7. **Bodyweight exercises** are logged as weight 0 in v1. Acceptable, or a third tracking type later?
8. **Export/Import flow:** file name, confirm before import replaces data, success/error feedback. Not designed.
9. **Delete confirms** for workout, goal and exercise are not drawn. Use the Dialog pattern (Cancel / Delete in `--danger`). Exact copy needed (exercise delete must show affected sessions and PRs count).
10. **Editing a Completed exercise in the live session** ("tap to edit"): back into the card, or a separate edit state?
11. **"Last 5 times" table** (chevron on a To do row): only in lo-fi (date | set columns | kg). Sheet or inline expand? Not drawn in hi-fi.
12. **"Last time" line for a first-time exercise** (no history): hide the line, or show something?
13. **lbs · mph:** weight step in lbs (5?), speed step in mph, rounding when converting.
14. **Multiple PRs in one session** on the finish summary: one green card per PR, or one card listing them?
15. **History month labels across years:** "September" vs "September 2025".
16. **Empty notes** on Session detail: hide the Notes section?
17. **More sets than columns** in the Progress history table (e.g. 5 sets): scroll or wrap?
18. **Durations over an hour:** "72 min" or "1 h 12 min"?
19. **Skipped exercises:** how they look in Completed (same as logged with a different icon? muted "Skipped" subtitle?).
20. **Log disabled state:** any hint text about which value is missing?
21. **Goal past its deadline** without being reached: what happens/how it looks.
22. **Wide screens:** confirm the centered 430px column.
23. **Year grid length:** the design has 52 x 7 = 364 cells. Where does day 365 (and 366 in a leap year) go?
24. **Weight in To do rows:** targets only store reps, so "12 · 8 reps · 22,5 kg" uses the weight from the last session *(assumed)*. Should targets also hold a weight?
25. **Renaming a workout:** inline edit of the title, or a small rename dialog?
26. **"Last time" line when sets had different weights:** show the top weight, or per set?
27. **How to reach Edit exercise:** picker rows and editor rows both go to Set targets. Where is the entry point to edit an exercise itself?
28. **Edge cases on Home:** only one workout (empty "Or pick another": hide the section?), or every workout hidden from home (what does Suggested show?).
29. **Everything marked *(assumed)*** in this document: a sensible default that Mike did not explicitly decide. Build it, but list it for confirmation.

---

## 14. Glossary

- **Workout**: the plan. **Session**: one gym visit that happened. **Workout item**: an exercise inside a workout. **Logged exercise**: an exercise inside a session.
- **Suggested value**: a grey number prefilled from last time or the targets. **Edited value**: a number the user changed (ink colour).
- **Inner edge / bevel**: the hard 1-2px inset light/shade lines that replace borders.
- **Mini grid**: the 7 x 7 empty-state art. **Year grid**: the 52 x 7 overview on Home.
