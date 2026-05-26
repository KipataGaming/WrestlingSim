// ============================================
// P&G GLOBAL - SHOWRUNNER TERMINAL
// booking.js — Show booking, simulation, and game systems
// Responsibilities (planned / in progress):
//   - addSegment(), removeSegment(), moveSegment(), clearCard()
//   - renderRundown() calls / updates to the live show card
//   - executeShow() / broadcast logic
//   - resolveLiveEvents() (weather, attacks, ref bumps, etc.)
//   - Post-PPV contract negotiations, happiness effects, walkouts
//   - Title change logic (including multi-holder / individual belts)
//   - Any other "what happens when you hit Broadcast" systems
// ============================================

// Placeholder – core booking + simulation functions will be moved here
// incrementally to finish killing the 1500+ line mess in index.html.

console.log('%c[booking.js] loaded (stub – simulation logic will move here next)', 'color:#888');

// === CARD EDITING HELPERS (first extraction - low risk) ===
// These manage the activeCard array used by the CURRENT SHOW CARD.
// They are called from the rundown rendering (still in index.html) and from
// the ↑ ↓ X controls inside the prominent show card.

function removeSegment(i) {
    // Use the main activeCard binding (lexical global from state.js).
    // Also keep window.activeCard in sync for any defensive code.
    if (!activeCard) activeCard = [];
    activeCard.splice(i, 1);
    window.activeCard = activeCard; // keep the window copy consistent
    if (typeof updateUI === 'function') updateUI();
    else if (typeof window.updateUI === 'function') window.updateUI();
}

function moveSegment(i, dir) {
    if (!activeCard) activeCard = [];
    const j = i + dir;
    if (j < 0 || j >= activeCard.length) return;
    const temp = activeCard[i];
    activeCard[i] = activeCard[j];
    activeCard[j] = temp;
    window.activeCard = activeCard;
    if (typeof updateUI === 'function') updateUI();
    else if (typeof window.updateUI === 'function') window.updateUI();
}

function clearCard() {
    if (!activeCard) activeCard = [];
    if (!activeCard.length) return;
    if (confirm("Clear the entire show card?")) {
        activeCard = [];
        window.activeCard = activeCard;
        if (typeof updateUI === 'function') updateUI();
        else if (typeof window.updateUI === 'function') window.updateUI();
    }
}

// === ADD SEGMENT LOGIC (next extraction after card helpers + renderRundown) ===
// This contains the rules for building a valid matchConfig from the UI.

function addSegmentToCard() {
    let type = document.getElementById('match-type').value;
    let isTag = type === 'tag';
    
    const selA = document.getElementById('wrestler-a');
    const selB = document.getElementById('wrestler-b');
    const selA2 = document.getElementById('wrestler-a2');
    const selB2 = document.getElementById('wrestler-b2');

    if (!state.roster || state.roster.length === 0) {
        alert("You have no wrestlers! Sign some talent in Operations first.");
        return;
    }

    let iA = parseInt(selA ? selA.value : -1);
    let iB = parseInt(selB ? selB.value : -1);
    let iA2 = parseInt(selA2 ? selA2.value : -1);
    let iB2 = parseInt(selB2 ? selB2.value : -1);

    // Check for wrestlers who refuse to work (extremely low happiness)
    const selectedIndices = [iA, iB, iA2, iB2].filter(i => !isNaN(i) && i >= 0);
    const refusingWrestlers = selectedIndices
        .map(i => state.roster[i])
        .filter(w => w && w.happiness < 22);

    if (refusingWrestlers.length > 0) {
        alert(`These wrestlers are refusing to work (happiness too low):\n\n` + 
              refusingWrestlers.map(w => `• ${w.name} (Happiness: ${w.happiness})`).join('\n') +
              `\n\nYou must improve their mood through Medical, promos, or contract talks first.`);
        return;
    }

    let uniqueCheck = new Set([iA, iB]);
    if(isTag) {
        uniqueCheck.add(iA2); uniqueCheck.add(iB2);
        if(uniqueCheck.size !== 4) return alert("Wrestlers cannot be booked against themselves in a tag match!");
    } else {
        if(iA === iB) return alert("Cannot book a wrestler against themselves!");
    }

    let matchConfig = {
        type: type, isTag: isTag,
        a: iA, b: iB, a2: iA2, b2: iB2,
        stakes: document.getElementById('match-stakes').value,
        promo: document.getElementById('spot-promo').checked,
        weapons: document.getElementById('spot-weapons').checked,
        refBump: document.getElementById('spot-ref').checked,
        runIn: document.getElementById('spot-runin').checked
    };

    activeCard.push(matchConfig);
    document.querySelectorAll('.match-spot').forEach(cb => cb.checked = false);

    if (typeof updateUI === 'function') updateUI();
    if (typeof renderRundown === 'function') renderRundown();
}