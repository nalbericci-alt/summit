# Summit status

App: https://nalbericci-alt.github.io/summit/
Rulebook: PLAN.md. This file is the only navigation. Newest entry at the top of each section.

## Where we are

| Phase | State | Your check |
|---|---|---|
| 0 Shell, install, offline | Confirmed on Nick's iPhone 2026-09-02 | Open the address in Safari, Share, Add to Home Screen, open Summit from the home screen, turn on airplane mode, reopen it, and confirm More says "Ready offline" |
| 1 Program, Today, workout mode, backup | Built and deployed 2026-09-02 (build 4d59542), awaiting your gym check | Open Summit from the home screen on a lifting day, tap Start workout, log every set with the Complete button, let the rest timer run once, tap Finish, pick a status, tap Save workout. Then tell me what was wrong, slow, or missing |
| 2 Plan map, drill-down, videos, swaps, readiness | Waiting | Open every day of the current week |
| 3 Conditioning, Palisades cards, Progress, weekly report | Waiting | Log one run or hike and read the report |
| 4 Kinnelon pack, GPX import, hike recorder, polish, review | Waiting | Walk one Kinnelon route with the recorder |

## Next step

Nick logs one real strength session at the gym with the deployed build and reports. Fixes from that report close Phase 1; then Phase 2 (Plan map, day drill-down, videos, swaps, reschedule) starts.

## Known limits in this build

- Conditioning days (Tuesday, Thursday, Saturday) show the week's prescription but logging arrives in Phase 3.
- The 1000-Pound Club meter stays at zero until a tested single is logged in Week 12; working baselines S and D are shown, not counted.
- The plate calculator uses the original lift's equipment even after a swap.
- The rest timer beeps only while Summit is open. iPhone web apps cannot sound a timer from the lock screen.
- Backup shares a file through the iPhone share sheet; if the share sheet is unavailable, a download link appears instead.
- A phone that installed Phase 0 may show the old screens once; closing Summit fully and reopening it picks up the new build.

## Verified so far

2026-09-02, Phase 1
- Automated: 103 tests across 15 files, TypeScript clean, production build green, Actions deploy green.
- Program data: five tests pin the PDF's worked examples (squat and deadlift formulas, paused squat percentages, Week 12 checks) and the archived Week 8 table Nick trained from.
- Local interactive check in a 375-wide Chromium viewport: Today shows Week 9 of 12 with the session card and tab dot; Start creates the draft; workout mode shows rows with targets and last-time column, Complete marks the row and starts the rest bar with its end time, Finish shows tonnage, status choices, and Next up; nothing overflows; every button is at least 44 px.
- Live address: build stamp 4d59542 served, service worker and manifest present. The service worker now registers at startup so a new build reloads onto the phone from any screen; before this fix it only registered on More.
- Not performed: a real iPhone session, the Web Share backup on a real phone, the wake lock and beep on a real phone. Those are your gym check.

2026-09-02, Phase 0
- Automated: 2 tests pass, TypeScript clean, build produces a 12-entry offline precache, Actions run 33655238798 deployed green.
- Live address: index, manifest, service worker, and apple-touch-icon all answer 200.
- Rendered in a 375 by 812 Chromium viewport: five tabs in order, no horizontal overflow, service worker scope `/summit/`, More shows "Ready offline" after one reload, no console messages, build stamp `b0ff2c1`.
- Not performed: real iPhone install, airplane-mode open on a real phone. Those are your check above.

## Model and effort log

| Date | Step | Model | Effort | Why |
|---|---|---|---|---|
| 2026-09-02 | Plan (PLAN.md) | Claude Fable 5.1 | high (session setting) | Planning is always Fable at high |
| 2026-09-02 | Phase 0 build | Claude Fable 5.1, direct | session setting | Account setup plus a small shell; cheaper than briefing a subagent. Phase 1 build steps go to Sonnet subagents with written specs where the spec is clear |
| 2026-09-02 | Phase 1 program data (src/data/program.ts, loads resolver, tests) | Claude Fable 5.1, direct | session setting | Transcribing 26 PDF pages of loads needs accuracy and the pages were already in context; 5 tests pin the PDF's worked examples and Nick's Week 8 table |
| 2026-09-02 | Phase 1 storage and engine (calendar, session builder, warm-ups, plates, IndexedDB, backup) | Claude Sonnet subagent | agent default | Well-specified, fully testable logic with a written brief; Fable reviews the result |
| 2026-09-02 | Phase 1 Today, readiness, More settings, backup and restore, app state | Claude Sonnet subagent | agent default | UI against fixed interfaces from a written brief; Fable reviews and renders it |
| 2026-09-02 | Phase 1 workout mode (set logging, rest timer, plates, swap, history, finish, PRs) | Claude Sonnet subagent | agent default | Largest UI piece, fully specified in a written brief; Fable reviews, renders, and deploys |

## Suggestions queue

All three Phase 0 suggestions approved by Nick on 2026-09-02 and moved into PLAN.md section 4b, Phase 1. Next suggestions come at the end of Phase 1.

## Housekeeping

- Old repository renamed to `summit-archive` and archived on GitHub, private. Local folder `Cardio Workout` still points at it.
- Node and npm installed with Homebrew on 2026-09-02.
- Builds are not byte-identical between machines by design: the build stamp embeds the build time.
