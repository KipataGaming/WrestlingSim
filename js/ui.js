// ============================================
// P&G GLOBAL - SHOWRUNNER TERMINAL
// ui.js — All rendering and DOM manipulation
// Responsibilities (planned / in progress):
//   - renderFullRoster()
//   - renderRundown() / renderCurrentShowCard()
//   - renderMarket() (free agents)
//   - renderMedical() / workout UI
//   - showTab() + tab switching
//   - updateUI() (funds, hype, etc.)
//   - Accessibility helpers and dynamic class application
//   - Any other pure "paint the screen" functions
// ============================================

// Placeholder – functions will be moved here incrementally from the old inline script
// to continue shrinking the monolith in index.html.

console.log('%c[ui.js] loaded (render functions moved here)', 'color:#39ff14');

// === CURRENT SHOW CARD RENDERING (moved from index.html as part of the split) ===
// This owns the visual state of the prominent 6-segment rundown and the
// enabled/disabled state of the Add/Broadcast buttons.

function renderRundown() {
    // Note: this function expects the booking form elements and #card-rundown to exist
    const cardCountEl = document.getElementById('card-count');
    if (cardCountEl) cardCountEl.innerText = activeCard.length;

    const rundown = document.getElementById('card-rundown');
    if (!rundown) return;

    rundown.innerHTML = '';

    if (!activeCard || activeCard.length === 0) {
        rundown.innerHTML = '<div style="color:#666; padding:10px 0;">No segments booked yet. Add matches below.</div>';
        // still need to update button states
    } else {
        activeCard.forEach((match, i) => {
            let matchText = match.isTag 
                ? `${state.roster[match.a].name} & ${state.roster[match.a2].name} vs ${state.roster[match.b].name} & ${state.roster[match.b2].name}`
                : `${state.roster[match.a].name} vs ${state.roster[match.b].name}`;

            let extra = [];
            if (match.stakes && match.stakes !== 'exhibition') extra.push(match.stakes.toUpperCase());
            if (match.promo) extra.push('PROMO');
            if (match.weapons) extra.push('WEAPONS');
            if (match.refBump) extra.push('REF BUMP');
            if (match.runIn) extra.push('RUN-IN');

            let extraTags = '';
            if (extra.length > 0) {
                extraTags = extra.map(e => `<span class="extras-tag">${e}</span>`).join(' ');
            }

            rundown.innerHTML += `
                <div class="rundown-item">
                    <div class="match-text">
                        <span class="seg-label">[SEG ${i+1}]</span>
                        ${matchText}
                        <span class="match-type">(${match.type.toUpperCase()})</span>
                        ${extraTags}
                    </div>
                    <div class="controls">
                        <button onclick="moveSegment(${i}, -1)" title="Move up">↑</button>
                        <button onclick="moveSegment(${i}, 1)" title="Move down">↓</button>
                        <button onclick="removeSegment(${i})" title="Remove segment" style="color:#ff6666; border-color:#ff6666;">X</button>
                    </div>
                </div>`;
        });
    }

    const hasRoster = state.roster && state.roster.length > 0;
    const addBtn = document.getElementById('add-card-btn');
    const broadcastBtn = document.getElementById('execute-show-btn');
    if (addBtn) addBtn.disabled = !hasRoster || activeCard.length >= 6;
    if (broadcastBtn) broadcastBtn.disabled = !hasRoster || activeCard.length < 6;

    if (typeof updateTicker === 'function') updateTicker();
}