# Summit status

App: https://nalbericci-alt.github.io/summit/
Rulebook: PLAN.md. This file is the only navigation. Newest entry at the top of each section.

## Where we are

| Phase | State | Your check |
|---|---|---|
| 0 Shell, install, offline | Deployed 2026-09-02, awaiting your phone check | Open the address in Safari, Share, Add to Home Screen, open Summit from the home screen, turn on airplane mode, reopen it, and confirm More says "Ready offline" |
| 1 Program, Today, workout mode, backup | Next | Log one real strength session at the gym |
| 2 Plan map, drill-down, videos, swaps, readiness | Waiting | Open every day of the current week |
| 3 Conditioning, Palisades cards, Progress, weekly report | Waiting | Log one run or hike and read the report |
| 4 Kinnelon pack, GPX import, hike recorder, polish, review | Waiting | Walk one Kinnelon route with the recorder |

## Next step

Nick installs Phase 0 on the iPhone and says go or no-go. On go, Phase 1 starts with the program data copied from the archive into `src/data/` and the Today screen.

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

## Suggestions queue

Proposed at the end of Phase 0. They enter PLAN.md only when Nick says yes.
1. Gym-mode brightness: a one-tap high-contrast light theme for bright gyms, alongside dark.
2. Home-screen badge of the day: the Today tab label shows a dot when a session is planned and not yet logged.
3. Quick log from the home screen: a Siri Shortcut link that opens straight into workout mode for today's session.

## Housekeeping

- Old repository renamed to `summit-archive` and archived on GitHub, private. Local folder `Cardio Workout` still points at it.
- Node and npm installed with Homebrew on 2026-09-02.
- Builds are not byte-identical between machines by design: the build stamp embeds the build time.
