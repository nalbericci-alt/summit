# Summit, rebuilt for the phone

Mode: Ship mode, declared 2026-09-02.
Owner: Nick. Builder: Claude Code. Reviewer: a fresh Claude or Codex session, read-only, at two gates only.
This file is the only rulebook. Nothing from the Cardio Workout repo, its CLAUDE.md, AGENTS.md, Navigator, verifiers, markers, or hash pins applies here unless this file says so.

## 1. The five rules

1. Every build session ends with a deploy at one stable HTTPS address that you open on your iPhone. If you cannot open it, the session is not done.
2. One status file, STATUS.md, holds what is done, what is next, and what you need to check on your phone. No other process documents.
3. Facts come from named sources with a date: the training program from the V5.2 program file, trail facts from the park's official map or the NY-NJ Trail Conference, video links checked by hand on the day they are added. Your workout data never leaves your phone unless you press Back up.
4. Ship mode: I build and test in the browser. You test on the phone and say go or no-go at the end of each phase. Anything only a real iPhone can prove is labeled "check on your phone".
5. Scope grows only by editing this file. Anything not in it is not being built.

## 2. What we keep and what we throw away

Keep, as plain data files copied into the new repo:
- the 12-week Return to the 1000-Pound Club program (every week, day, exercise, load, sets, reps, rest, RPE cap, choice group, optional finisher);
- the heart-rate zone rules, the control priority (symptoms, talk test, RPE, recovery, heat, cap), and the stop rules;
- the progression and readiness rules (deload, calibration, substitution identity, Sunday protection, hard-activity replacement);
- the Palisades trail registry: 17 routes, blaze colors, closures, GPS traces, and the map facts;
- the technique guide mapping and the verified instructional video links;
- the safety language and the "training tool, not a medical device" statement.

Throw away: the single-file React app, the Navigator, the sync service, the schema migration machinery, the privacy modes, the owner-decision dialogs, and every verifier that pinned process state.

Code is written from zero. The data is the skeleton.

## 3. What you will see that is different

- Opens from your home screen in about a second, with or without gym signal. Installed as a real iPhone web app, not a Mac address.
- Every set saves the instant you tap it. No save badge, no "save failed", no locked Today.
- One record per workout in the phone's database instead of one 3 MB blob, so storage limits stop mattering.
- No first-use decisions, no schema codes, no import previews, no source hashes. First open shows Today.
- Designed at phone width first. Bottom tab bar, thumb-reach buttons, dark by default, big type option for the gym.
- A fraction of the old size. The old bundle was 2.3 MB of code and 3 MB of state before you logged a single set.

## 4. The new UX

Inspiration: Hevy and Strong for set logging, Strava and Apple Fitness for summaries and rings, JuggernautAI and Boostcamp for program maps and readiness, AllTrails for route cards.

Tabs: Today, Plan, Progress, Trails, More.

Today
- Hero card: today's session name, purpose, estimated time, and one Start button. Rest days show the recovery module.
- The 1000-Pound Club meter: your best tested total against 1,000 lb with a bar per lift. Tested singles only. Estimates never move it.
- A three-tap readiness check-in (sleep, soreness, energy) plus the symptom question. It adjusts today's loads with the program's own rules and always shows why.

Workout mode (full screen, from Today or Plan)
- One exercise at a time, its set rows, and "last time" beside every set.
- Tap a row to complete it. Weight and reps prefilled from the plan; RPE or RIR picker per your preference.
- Auto rest timer with the end time shown, a sound, and the screen kept awake.
- Plate calculator per set using your gym's plate set. Warm-up ramp generated from the working weight.
- Swap exercise sheet filtered by equipment, with a reason (busy rack, pain, missing gear) that keeps the substitution honest.
- Notes with the keyboard mic for dictation.
- Finish screen: duration, tonnage, PRs (weight, reps, estimated 1RM), and a preview of the next session.

Plan
- The 12-week map: phases colored, deload and test weeks marked, today highlighted, the current week expanded.
- Tap any day for the complete prescription: loads, sets, reps, rest, RPE cap, choices, finishers, technique guide, and the video link.
- Move a session to tomorrow, or skip it with a reason. History stays honest.

Progress
- Per-lift chart of tested singles, observed Epley, and RIR-adjusted estimates as three separate series.
- PR list, weekly report (planned versus done, tonnage, minutes in zone, readiness average), and a consistency heatmap with streak.
- Conditioning panel from comparable sessions: volume, pace or setting, time in zone, recovery heart rate, weekly consistency, and how much evidence backs each line.
- Workout history with View and Correct. Corrections keep the original.

Trails
- Route cards per park: distance, elevation gain, difficulty, blaze, closure status, an official map link, and Apple Maps to the trailhead.
- Route sketch drawn from the GPS trace, readable offline, no map tiles required.
- Trail session entry: pick the route, log time, average and peak heart rate, and a built-in two-minute recovery countdown.
- Parks are packs. Pack one is the Palisades. Pack two is the Kinnelon area.

More
- Units, RPE or RIR, theme, big type, rest timer defaults, plate set, default conditioning modality and sensor.
- Back up (share the file to iCloud Drive or Files) and Restore. Nothing else.

## 4b. Claude's additions

Everything in section 4 stays. These are added on top, with the app that inspired each.

Gym (Hevy, Strong, JuggernautAI)
- Superset grouping with one shared rest timer for the accessory pairs.
- Set types on any row: warm-up, working, AMRAP, to failure, drop. A copy-last-set button.
- Exercise history sheet inside workout mode: the last five sessions of that lift and its estimated-1RM trend, without leaving the workout.
- Test-week mode: guided warm-up singles and attempt jumps for the squat, bench, and deadlift singles that count toward the 1,000.
- Coach cues per exercise from the program, collapsed under the set rows.
- Session clock against the planned time. An "over time" note, never a nag.
- Deep links so an Apple Shortcut or Siri can open today's workout directly.

Conditioning (Nike Run Club, Garmin, Apple Fitness)
- Guided run-walk timer that runs the Tuesday row: jog until 165 bpm or 60 seconds, walk to 135 to 140, with beeps and a stop button pinned on top.
- Weekly rings: sessions done, minutes in zone, and tonnage against the plan.
- Zone-2 base streak.

Trails (AllTrails, Gaia)
- Elevation profile drawn from each GPS trace.
- Time estimate per route from distance and gain, corrected by your own logged pace.
- Sunset time at the trailhead, computed on the phone, so a late start shows a turnaround time.
- The official park map cached offline inside the pack.

Progress and motivation (Apple Fitness, Strava, Whoop)
- Club milestones at 600, 700, 800, 900, and 1,000 lb tested totals, with the date each fell.
- Cycle review at week 12: starting versus ending totals, sessions done, PRs, and what changed.
- Readiness trend from the check-ins beside the lift charts, so soreness can be read against load.

Approved by Nick after Phase 0 (2026-09-02)
- A one-tap high-contrast light theme for bright gyms, alongside dark.
- A dot on the Today tab when a session is planned and not yet logged.
- A Siri Shortcut link that opens straight into today's workout.

Reliability
- Sunday backup nudge that shares the file to iCloud Drive in one tap. Restore shows the file's date and workout count before it replaces anything.
- Big-type mode and a left- or right-hand layout toggle for one-hand logging.

Where they land: gym additions and the three Phase 0 approvals in Phase 1, test-week mode in Phase 2, conditioning and progress additions in Phase 3, trail additions in Phase 4, reliability split between Phases 1 and 4.

Not possible in an iPhone web app, so not promised: Apple Health sync, background GPS, haptics, lock-screen timers, home-screen widgets.

At the end of every phase I propose two or three more additions. They enter the plan only when you say yes.

## 5. Kinnelon-area trails

Candidates, to be verified against the Morris County Park Commission and NY-NJ Trail Conference maps when the pack is built:
- Pyramid Mountain Natural Historic Area (Montville and Kinnelon border): Tripod Rock, Bear Rock, Lucy's Overlook loops.
- Silas Condict County Park (Kinnelon): lake loop and ridge trails.
- Norvin Green State Forest from the Otter Hole trailhead (Bloomingdale): Wyanokie High Point.

New trail packs need GPS traces. Two ways to get them: import a GPX file, or record the hike in the app with the screen on. Web apps cannot record GPS in the background on iPhone, so the recorder is screen-on only.

## 6. Hosting and GitHub

The old repo `nalbericci-alt/summit-protocol` stays private and archived. It must never be made public: it has your health exports and message screenshots committed to it.

The new app gets a new repository, `summit`, with app code, the program data, and the trail packs. Workout data is never in the repo.

GitHub Pages on a free account requires a public repository. That exposes the program file, which includes your prescribed loads. Two choices:
- Option A, recommended for simplicity: public repo `summit`, GitHub Pages, address `nalbericci-alt.github.io/summit`. Your loads are visible to anyone who finds it. No workout logs ever are.
- Option B, private: keep `summit` private and deploy through Cloudflare Pages, which is free and reads a private GitHub repo. Needs one Cloudflare account that you create.

Either way the address never changes, the deploy runs automatically on every push, and the app works while the Mac is off.

## 7. Stack

Vite, React, TypeScript. Installable PWA with an offline cache. IndexedDB for records. Lightweight charts. Vitest for the program and rule logic. Deploy by GitHub Actions on push. No backend, no accounts, no sync in v1. Apple Health sync is not possible for a web app and is not planned.

## 8. Program timing

The app stores a program start date. Week 8 was August 24 to 30, so the current cycle runs to September 27. When v1 ships you choose in More: continue this cycle at the current week, or start a new 12-week cycle on the next Monday. Your Week 8 numbers are the default starting loads.

## 9. Phases

| Phase | Builds | Sessions | Your check |
|---|---|---|---|
| 0 | New repo, empty app with tabs, install on phone, works offline | 1 | Open it from your home screen with airplane mode on |
| 1 | Program data, Today, workout mode, rest timer, plates, backup | 2 to 3 | Log one real strength session at the gym |
| 2 | Plan map, day drill-down, videos, swaps, reschedule, readiness | 1 to 2 | Open every day of the current week |
| 3 | Conditioning entry, Palisades trail cards, Progress, weekly report | 2 to 3 | Log one run or hike and read the report |
| 4 | Kinnelon pack, GPX import, hike recorder, big type, polish, review | 1 to 2 | Walk one Kinnelon route with the recorder |

Roughly 7 to 11 sessions total. You can use the app from the end of Phase 1.

## 10. Decisions you make now

1. Option A (public repo, GitHub Pages) or Option B (private repo, Cloudflare Pages). Recommendation: Option A.

Sections 4 and 4b are the v1 feature scope. Then Phase 0 starts.
