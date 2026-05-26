# P&G Global // Showrunner Terminal
## Beta v0.9 — Testing Guide & Known Issues

**Version**: Beta v0.9  
**Date**: Current development session  
**Goal**: Gather real play feedback on the core loop before investing more credits in deeper refactors or new features.

This document is the single source of truth for what is ready to test and what is still rough.

---

## Current Playable State

The game has reached a point where a tester can complete full 30–90 minute sessions:

- Start a new game with custom promotion name + home location
- Manage and grow a roster (Free Agency + full "Create New Wrestler" form with alignment/archetype/stats)
- Book exactly 6-segment shows with a **prominent, scannable CURRENT SHOW CARD** (green-bordered, shows type badges, extras tags, reorder/cancel controls)
- Broadcast the show and receive meaningfully labeled post-show results (match type + [PROMO / WEAPONS / REF BUMP / RUN-IN] + title stakes)
- Experience live events, title changes, and post-PPV contract negotiations
- Use the Medical tab + heal dropdown to actually restore stamina + happiness
- Toggle accessibility options (text size, high contrast, reduce motion, simplify UI) — important for the developer who has MS

Recent stabilizations (see CHANGELOG.md):
- CURRENT SHOW CARD visibility overhaul
- Results log now clearly labels what happened each segment
- Heal button actually heals (dropdown + stamina + happiness restore)
- New Game button flows directly into the game
- Create New Wrestler form added
- Beta v0.9 banner with short testing instructions in the main menu

The core "book a show → watch the consequences" loop is functional and worth testing.

---

## Known Issues & Rough Edges (Report These!)

These are the areas that are intentionally left "good enough for beta" due to limited credits. They are the highest-priority items for future polish.

### 1. Live Events & RNG (resolveLiveEvents)
- Weather cancellations use venue.weatherRisk but the effect can feel arbitrary — a match you carefully built can simply disappear with little player agency.
- Backstage attacks hit a random roster member (not necessarily someone on the card).
- Surprise moments ("REF BUMP", "RUN-IN") are forcibly injected into random segments of the card you just built. The system mutates `processedCard` after you have seen the rundown.
- Feedback in the log is decent, but there is no pre-broadcast warning or visual indication on the CURRENT SHOW CARD that chaos is about to hit.
- **Testing focus**: Build a few shows, enable PPV, watch what actually gets cancelled or altered. Does it feel fair or frustrating?

### 2. Post-PPV Contract Negotiations (the jankiest UX)
- Triggered only when the "This is a PAY-PER-VIEW" checkbox is checked before broadcast.
- Uses old-school blocking `confirm()` and `alert()` browser dialogs for every demanding wrestler (happiness < 60). This is 1990s-era UX and can stack poorly.
- Demands scale with popularity + low happiness + bad attitude, but the exact math and "promises" tracking are opaque to the player.
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
