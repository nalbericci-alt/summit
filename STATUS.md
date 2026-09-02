# Summit status

App: https://nalbericci-alt.github.io/summit/
Rulebook: PLAN.md. This file is the only navigation. Newest entry at the top of each section.

## Where we are

| Phase | State | Your check |
|---|---|---|
| 0 Shell, install, offline | Confirmed on Nick's iPhone 2026-09-02 | Open the address in Safari, Share, Add to Home Screen, open Summit from the home screen, turn on airplane mode, reopen it, and confirm More says "Ready offline" |
| 1 Program, Today, workout mode, backup | In progress from 2026-09-02 | Log one real strength session at the gym |
| 2 Plan map, drill-down, videos, swaps, readiness | Waiting | Open every day of the current week |
| 3 Conditioning, Palisades cards, Progress, weekly report | Waiting | Log one run or hike and read the report |
| 4 Kinnelon pack, GPX import, hike recorder, polish, review | Waiting | Walk one Kinnelon route with the recorder |

## Next step

Phase 1 step 1: program data carried into `src/data/`, then the Today screen with the session card and Start button.

## Verified so far

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

## Suggestions queue

All three Phase 0 suggestions approved by Nick on 2026-09-02 and moved into PLAN.md section 4b, Phase 1. Next suggestions come at the end of Phase 1.

## Housekeeping

- Old repository renamed to `summit-archive` and archived on GitHub, private. Local folder `Cardio Workout` still points at it.
- Node and npm installed with Homebrew on 2026-09-02.
- Builds are not byte-identical between machines by design: the build stamp embeds the build time.
