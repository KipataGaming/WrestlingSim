# P&G Global // Showrunner Terminal
## Beta Testing Notes (Post-Modular Split)

**Current Phase**: Major refactoring largely complete  
**Goal**: Stabilize the now-modular codebase and gather feedback on gameplay feel before adding significant new features.

---

## Current State of the Codebase

The original ~2380-line monolithic `index.html` has been successfully broken down:

- `js/data.js` — All static data (MATCH_TYPES, TITLES, VENUES, WORKOUTS, etc.)
- `js/state.js` — Core state, persistence, migration, welcome-back bonus
- `js/ui.js` — Rendering, Creative HQ, roster editing, promo tools, initialization
- `js/booking.js` — Full broadcast pipeline, live events, contracts, market/free agency, title changes

`index.html` is now mostly clean HTML + a tiny bootstrap script.

The split is considered functionally complete for now.

---

## What Works Well

- Booking flow with prominent CURRENT SHOW CARD
- Broadcast → results loop (including live events and post-PPV contracts)
- Roster management (Free Agency + Create New Wrestler)
- Medical / healing system
- Accessibility options
- Multiple shows in a row (including PPV runs)

---

## Known Rough Edges / Future Polish

### Live Events
- Still the most "chaotic" system. Weather cancellations and forced spots can feel arbitrary.
- No strong pre-broadcast risk visualization on the show card.

### Post-PPV Contracts
- The in-page panel is much better than the old blocking `confirm()` spam, but the UX can still be improved (e.g., better demand clarity, bulk actions).

### Polish & Quality of Life
- Last Show Recap is basic (good start, can be richer).
- Market / Free Agency could use better filtering or history.
- More visual feedback on long-term roster trends would be nice.

### Technical Debt
- A few old inline comments and minor inconsistencies remain (minor cleanup only).
- No automated tests yet.

---

## Recommended Testing Focus

1. Play several full "seasons" (multiple shows, PPVs, roster turnover).
2. Pay special attention to how live events feel after you've carefully built a card.
3. Try the Create New Wrestler flow and see if the data-driven constraints feel good.
4. Use accessibility settings if you have any visual or motor considerations.

---

## Next Priorities (Once Feedback is Gathered)

- Deeper live events agency / telegraphing
- Contract negotiation UX improvements
- Richer progression / meta systems
- More Last Show / career history visibility

Report any crashes, broken flows, confusing mechanics, or "this feels bad" moments. Gameplay feel feedback is currently more valuable than "this code could be cleaner" notes.

Thank you for testing!
- Refusal sets a `refusing: true` flag. The wrestler is then completely blocked from future booking until the player manually improves their happiness in Medical or triggers another contract talk.
- No good persistent view of active promises or "owed" pushes/title shots.
- Funds check uses `demandedRaise * 2` (the multiplier feels arbitrary).
- **Testing focus**: Do at least one PPV per play session. Note every time a negotiation appears — was the demand reasonable? Did the dialog flow feel broken? Did a refusal leave you unable to book a key wrestler?

### 3. Modular Split Is Still Partial (by design)
- `js/data.js` and `js/state.js` are properly extracted and wired.
- `js/ui.js` and `js/booking.js` are mostly empty stubs with responsibility comments only.
- The vast majority of game logic (booking, simulation, live events, negotiations, render functions, etc.) still lives in the large inline `<script>` inside `index.html`.
- This was a deliberate low-risk choice to reach a testable beta without re-breaking the playable core.

### 4. Smaller / Edge Issues
- Title changes on tag/trios belts (individual belt indices) work but the UI for "who holds which belt" is minimal.
- Some very old saves may receive the one-time "Welcome Back" bonus; heavy migration testing is welcome.
- No undo for major decisions (broadcast, contract accept/decline, spending money on recovery).
- The log can become long and scroll-heavy after several weeks.
- Free agency and roster management have no search/filter yet.

---

## Recommended Testing Flow (Focus Areas)

Please try to complete at least one full "week" (roster → book → broadcast) and ideally 3–5 weeks in one session.

1. **New Game** — Choose a fun promotion name and home location. Note if the header updates correctly.
2. **Roster Tab**
   - Sign 3–5 free agents.
   - Use the "Create New Wrestler" form (all text + dropdowns) to make 2–3 custom talents.
   - Assign workouts and watch the buff icons appear.
3. **Booking Tab — THE MOST IMPORTANT AREA**
   - Build multiple full 6-segment cards.
   - **Actively use and evaluate the CURRENT SHOW CARD**: Is it scannable? Do the type badges and extras tags help? Can you easily reorder or cancel?
   - Try different match types, spots, and title stakes.
   - Check the PPV box at least once.
4. **Broadcast**
   - Watch the live events resolve.
   - Read the results log carefully — does it clearly tell you what each segment was and what extras were active?
   - Note any title changes.
5. **Post-PPV Negotiations** (if PPV)
   - Go through the confirm dialogs.
   - Decide which demands to accept or refuse.
   - See the immediate effect on the roster (happiness, refusing flags).
6. **Medical Tab**
   - Use the heal dropdown + "PAY FOR RECOVERY / THERAPY" button on hurt wrestlers.
   - Confirm both stamina and happiness actually improve and cost scales reasonably.
7. **Accessibility**
   - Toggle text size (large / xlarge), high-contrast, reduce-motion, and simplify-ui.
   - Book and broadcast a show with the settings on. Report any visual or usability problems.
8. **Save / Load**
   - Save mid-session, reload the page, continue. Try an older save if you have one.

---

## What Feedback Is Most Valuable Right Now

Please focus on the areas the developer has been iterating on:

- **CURRENT SHOW CARD visibility** — Did it solve "you can see what matches you're booking"?
- **Results clarity** — Did the labeled output (type + [extras]) help you understand what happened and learn the systems?
- **Live events** — Did the chaos feel exciting or just punishing?
- **Contract negotiations** — Were the demands fair? Did the dialog system get in the way?
- **Overall flow** — Did you ever get stuck or feel like you couldn't progress?
- **Accessibility** — Did any setting combination break the UI or make text hard to read?

Any crashes, numbers that don't make sense, or wrestlers getting permanently stuck are high-priority bugs.

---

## How to Report Issues

Since this is a local browser game with no backend:

- Take a screenshot of the log + any error in the browser console (F12).
- Note the exact sequence (e.g., "PPV with 4 wrestlers below 40 happiness, accepted two demands, one wrestler still refusing").
- Send feedback however you normally communicate with the developer (chat, email, Discord, etc.).

The more specific the reproduction steps, the better.

---

## Credits & Philosophy

This beta exists because the developer has very limited remaining free credits. The priority was:

1. Make the most important player-facing pain points (booking visibility + results clarity) actually good.
2. Stabilize the critical flow (new game, heal, create wrestler).
3. Document honestly so testers know exactly what they are playing.
4. Do not risk another large refactor that could re-break the playable core.

Thank you for helping test. Your feedback directly decides what gets fixed first when more credits are available.

**Beta v0.9 — Core loop is here. Let's see how it actually plays.**

---

*This document was created as the first deliverable of the "Option A – Low-Risk Beta Polish" plan chosen by the user when credits were critically low.*
