// ============================================
// P&G GLOBAL - SHOWRUNNER TERMINAL
// booking.js — Show booking, simulation, and game systems
// Responsibilities:
//   - addSegment(), removeSegment(), moveSegment(), clearCard()
//   - executeShow() / broadcast logic (live events, simulation, post-broadcast)
//   - resolveLiveEvents() (weather, attacks, ref bumps, etc.)
//   - processPostBroadcast (ratings war, finance, decay, contracts, reset)
//   - Free agency / market (refreshMarket, hire)
//   - Post-PPV contract negotiations, happiness effects, walkouts
//   - Title change logic (including multi-holder / individual belts)
//   - Promo generator effects
//   - Any other core game systems (non-UI)
// ============================================

// === CARD EDITING HELPERS ===
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

// === LIVE EVENTS SYSTEM ===
// Contains preview + resolver for weather, backstage attacks, and forced spots.

function previewLiveRisks() {
    if (!activeCard || activeCard.length === 0) {
        alert("Build your 6-segment card first, then check risks.");
        return;
    }

    const venue = currentVenue;
    if (!venue) {
        log("No venue selected — risks unknown.");
        return;
    }

    log(`<b>— LIVE EVENT RISK PREVIEW (${venue.name}) —</b>`);

    const riskPct = Math.round((venue.weatherRisk || 0) * 100);
    log(`Weather risk: ${riskPct}%`);

    const vulnerable = activeCard.filter(m => ['ladder', 'cage'].includes(m.type));
    if (vulnerable.length > 0 && Math.random() < (venue.weatherRisk || 0)) {
        log(`<span style="color:#ffaa66">Possible weather impact on high-risk matches (ladder/cage).</span>`);
    } else if (vulnerable.length > 0) {
        log(`High-risk matches present, but weather looks stable for now.`);
    }

    const bookedIndices = new Set();
    activeCard.forEach(m => {
        bookedIndices.add(m.a);
        bookedIndices.add(m.b);
        if (m.isTag) { bookedIndices.add(m.a2); bookedIndices.add(m.b2); }
    });

    const tenseBooked = Array.from(bookedIndices)
        .map(i => state.roster[i])
        .filter(w => w && (w.happiness < 50 || w.stamina < 55));

    if (tenseBooked.length > 0) {
        log(`<span style="color:#ffaa66">Backstage tension: ${tenseBooked.length} booked wrestler(s) are vulnerable to attacks.</span>`);
    }

    if (Math.random() < 0.18) {
        log(`<span style="color:#ffcc66">Possible unplanned moment (run-in or ref bump) on a random segment.</span>`);
    }

    log(`Preview is directional only. Actual events are still rolled at broadcast time.`);
}

function resolveLiveEvents(venue) {
    const events = [];
    if (!venue || !activeCard.length) return events;

    // 1. Weather event (location-dependent)
    if (Math.random() < venue.weatherRisk) {
        const vulnerableTypes = ['ladder', 'cage'];
        const vulnerableMatches = activeCard
            .map((m, i) => ({ match: m, index: i }))
            .filter(item => vulnerableTypes.includes(item.match.type));

        if (vulnerableMatches.length > 0) {
            const toCancel = vulnerableMatches[Math.floor(Math.random() * vulnerableMatches.length)];
            events.push({
                type: 'weather_cancel',
                venue: venue.name,
                matchIndex: toCancel.index,
                reason: venue.type === 'outdoor' 
                    ? 'Severe weather warning - match moved/cancelled' 
                    : 'Weather delay forces last-minute change'
            });
        } else {
            events.push({
                type: 'weather_general',
                venue: venue.name,
                effect: 'attendance_hit',
                reason: 'Weather keeping fans away'
            });
        }
    }

    // 2. Backstage attack / ambush (prefers booked or unhappy wrestlers)
    if (Math.random() < 0.22) {
        let candidates = state.roster
            .map((w, i) => ({ w, i }))
            .filter(item => item.w && (activeCard.some(m =>
                m.a === item.i || m.b === item.i ||
                (m.isTag && (m.a2 === item.i || m.b2 === item.i))
            ) || item.w.happiness < 50 || item.w.stamina < 55));

        if (candidates.length === 0) candidates = state.roster.map((w, i) => ({ w, i })).filter(x => x.w);

        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        events.push({
            type: 'backstage_attack',
            wrestlerIdx: pick.i,
            name: pick.w.name,
            staminaHit: 25 + Math.floor(Math.random() * 15)
        });
    }

    // 3. Surprise run-in or forced spot on a random booked match
    if (Math.random() < 0.18 && activeCard.length > 0) {
        const randomMatchIdx = Math.floor(Math.random() * activeCard.length);
        const surpriseType = Math.random() < 0.5 ? 'runIn' : 'refBump';
        events.push({
            type: 'surprise_moment',
            matchIndex: randomMatchIdx,
            forcedSpot: surpriseType,
            flavor: surpriseType === 'runIn' ? 'Unplanned interference' : 'Ref gets bumped in the chaos'
        });
    }

    return events;
}

// (duplicate early simulateSegment removed during processPostBroadcast extraction + stamDrain fix)

// === CORE SIMULATION (highest-leverage extraction) ===
// Per-segment match resolution: rating, stamina, pop, revenue, titles, logging prep.
// This will eventually replace the giant inline forEach in the broadcast handler.

function simulateSegment(match, participants) {
    // participants = [a, b] or [a, b, a2, b2] depending on isTag
    // Returns an object the broadcast handler can use to apply changes + log.

    const a = participants[0];
    const b = participants[1];
    const a2 = match.isTag ? participants[2] : null;
    const b2 = match.isTag ? participants[3] : null;

    let teamAPop = match.isTag ? (a.pop + a2.pop) / 2 : a.pop;
    let teamBPop = match.isTag ? (b.pop + b2.pop) / 2 : b.pop;

    // V2.1 WORKRATE NERF: Base divisor increased from 15 to 25.
    let rating = (teamAPop + teamBPop) / 25;
    let stamDrain = 15;
    let revMod = 1.0;

    // V2.1 WORKRATE NERF: Spot bonuses drastically reduced.
    if (match.type === 'tag') { rating += 0.3; revMod = 1.1; stamDrain = 12; }
    if (match.type === 'ladder') { rating += 0.5; stamDrain = 30; revMod = 1.3; }
    if (match.type === 'cage') { rating += 0.8; stamDrain = 45; revMod = 1.8; }

    // Title matches (any title) get bonus
    if (Object.keys(TITLES).includes(match.stakes)) {
        rating += 0.5;
        stamDrain += 10;
        revMod += 0.2;
    }

    if (match.promo) rating += 0.1;
    if (match.weapons) { rating += 0.3; stamDrain += 10; }
    if (match.refBump) rating += 0.1;
    if (match.runIn) rating += 0.2;

    // V2.1 WORKRATE NERF: Stamina penalty is harsher and kicks in earlier (< 50).
    participants.forEach(p => { if (p.stamina < 50) rating -= 0.5; });

    // === WORKOUT BONUSES (Medical system) ===
    const medicalBonus = (state.medLvl || 0) * 0.08;

    participants.forEach(p => {
        if (p.activeWorkouts && p.activeWorkouts.length > 0) {
            p.activeWorkouts.forEach(workoutId => {
                const workoutData = WORKOUTS.find(wo => wo.id === workoutId);
                if (workoutData && workoutData.bonus) {
                    if (workoutData.bonus.rating) {
                        rating += (workoutData.bonus.rating + medicalBonus);
                    }
                    if (workoutData.bonus.popGain) {
                        p._workoutPopBonus = (p._workoutPopBonus || 0) + workoutData.bonus.popGain + Math.floor((state.medLvl || 0) / 2);
                    }
                }
            });
        }

        // === HAPPINESS PENALTIES / BONUSES ===
        if (p.happiness < HAPPINESS_EFFECTS.low) {
            rating -= 0.35;
        } else if (p.happiness < HAPPINESS_EFFECTS.neutral) {
            rating -= 0.15;
        } else if (p.happiness > HAPPINESS_EFFECTS.good) {
            rating += 0.1;
        }
    });

    // V2.1 WORKRATE NERF: RNG adds slight chaos (-0.2 to +0.3).
    let finalStars = rating + ((Math.random() * 0.5) - 0.2);

    // Strict 5.0 Cap - keep as number for calculations, format only for display
    finalStars = Math.min(5.0, Math.max(0.5, finalStars));

    const starsHTML = "★".repeat(Math.floor(finalStars)) + (finalStars % 1 >= 0.5 ? "½" : "");

    // Calculate revenue for this segment
    let matchRev = (finalStars * 500) * revMod * (1 + ((state.hype || 0) / 100));

    // Title changes (world / tag / trios)
    let titleMsg = "";
    const stake = match.stakes;

    if (stake === 'world') {
        if (state.champIdx === match.a && Math.random() > 0.5) { state.champIdx = match.b; titleMsg = " [NEW CHAMP!]"; }
        else if (state.champIdx === match.b && Math.random() > 0.5) { state.champIdx = match.a; titleMsg = " [NEW CHAMP!]"; }
        else if (state.champIdx !== match.a && state.champIdx !== match.b) { state.champIdx = (Math.random() > 0.5 ? match.a : match.b); titleMsg = " [CROWNED!]"; }
    }

    if (stake === 'tag') {
        let winnerTeam = Math.random() > 0.5 ? [match.a, match.a2] : [match.b, match.b2];
        if (!state.tagChampIdx.includes(winnerTeam[0])) {
            state.tagChampIdx = winnerTeam;
            titleMsg = " [NEW TAG CHAMPS!]";
        }
    }

    if (stake === 'trios') {
        titleMsg = " [TRIOS TITLE CONTENDER MATCH]";
    }

    // Build rich log text (type + spots + stakes)
    let resultExtras = [];
    if (match.stakes && match.stakes !== 'exhibition') resultExtras.push(match.stakes.toUpperCase());
    if (match.promo) resultExtras.push('PROMO');
    if (match.weapons) resultExtras.push('WEAPONS');
    if (match.refBump) resultExtras.push('REF BUMP');
    if (match.runIn) resultExtras.push('RUN-IN');

    let resultExtraText = resultExtras.length > 0 ? ` [${resultExtras.join(', ')}]` : '';
    let typeLabel = ` <span style="color:#39ff14; font-size:0.9em;">(${match.type.toUpperCase()})</span>`;

    const logText = `[SEG ${/* caller will provide index */ ''}] ${match.isTag ? `${a.name} & ${a2.name} vs ${b.name} & ${b2.name}` : `${a.name} vs ${b.name}`}${typeLabel}${resultExtraText}${titleMsg} | <span class="stars">${starsHTML}</span>`;

    return {
        finalStars,
        starsHTML,
        revenue: matchRev,
        titleMsg,
        logText,
        stamDrain,   // restored for the broadcast handler (was missing after extraction)
        // Note: pop/stamina mutations still applied by caller for now (incremental)
    };
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

// ============================================
// processPostBroadcast — extracted post-show orchestration
// Handles: ratings war (vs Syndicate Pro), finance/gate, roster decay,
// passive drama, lastShow snapshot, activeCard reset, PPV contract talks trigger.
// Called from the thinned execute-show handler in index.html.
// ============================================
function processPostBroadcast(data) {
    if (!data) data = {};
    const showRevenue = data.showRevenue || 0;
    const showStarsTotal = data.showStarsTotal || 0;
    const processedCard = data.processedCard || [];
    const showEvents = data.showEvents || [];
    const isPPV = !!data.isPPV;

    const numSegments = processedCard.length || 1;
    const avgRating = (showStarsTotal / numSegments).toFixed(1);
    const avgRatingNum = parseFloat(avgRating);

    log(`<b>— POST-BROADCAST SUMMARY —</b>`);
    log(`Show Rating: ${avgRating} ★  |  Segments Run: ${numSegments}  |  Gate: $${Math.floor(showRevenue)}`);

    // === RATINGS WAR vs SYNDICATE PRO (uses state.rivalHype / state.hype) ===
    // Rival "performance" scales with their current hype + a bit of chaos.
    const rivalBase = (state.rivalHype || 30) / 20; // ~1.5 to 5.0 range
    const rivalPerf = rivalBase + (Math.random() * 1.2 - 0.6);
    let warMsg = "";
    let hypeDelta = 0;

    if (avgRatingNum > rivalPerf + 0.3) {
        hypeDelta = Math.max(1, Math.floor((avgRatingNum - rivalPerf) * 2.2));
        state.hype = Math.min(100, (state.hype || 10) + hypeDelta);
        state.rivalHype = Math.max(0, (state.rivalHype || 30) - Math.max(1, Math.floor(hypeDelta * 0.6)));
        warMsg = `<span style="color:#39ff14">P&G WINS RATINGS WAR! +${hypeDelta}% Hype (Syndicate lost ground)</span>`;
    } else if (avgRatingNum < rivalPerf - 0.3) {
        hypeDelta = Math.max(1, Math.floor((rivalPerf - avgRatingNum) * 2.0));
        state.hype = Math.max(0, (state.hype || 10) - hypeDelta);
        state.rivalHype = Math.min(100, (state.rivalHype || 30) + Math.max(1, Math.floor(hypeDelta * 0.7)));
        warMsg = `<span style="color:#ff6666">Syndicate PRO edged the ratings. Hype -${hypeDelta}%</span>`;
    } else {
        warMsg = `Ratings war was a dead heat. No major hype swing.`;
    }
    if (warMsg) log(warMsg);

    // === FINANCE (gate already aggregated in simulateSegment calls) ===
    state.funds = (state.funds || 0) + Math.floor(showRevenue);

    // Sponsor / local market bonus scales with rating + current hype
    const sponsorBonus = Math.floor(avgRatingNum * 95 + ((state.hype || 0) * 2.5));
    state.funds += sponsorBonus;
    log(`Sponsor & Merch bonus: +$${sponsorBonus}`);

    // Force the funds display update here (defensive, in case the general
    // updateUI path has transient issues after complex broadcasts).
    const fundsEl = document.getElementById('funds');
    if (fundsEl) {
        fundsEl.textContent = Math.floor(state.funds || 0);
    }

    // === PASSIVE ROSTER DECAY (small, realistic locker room fatigue) ===
    if (state.roster && state.roster.length > 0) {
        state.roster.forEach(w => {
            if (!w) return;
            // Light universal decay
            if (w.happiness > 25) {
                w.happiness = Math.max(18, w.happiness - (Math.random() < 0.55 ? 1 : 2));
            }
            // Extra grumpiness if exhausted
            if (w.stamina < 45 && Math.random() < 0.35) {
                w.happiness = Math.max(12, w.happiness - 3);
            }
        });
    }

    // === PASSIVE DRAMA (occasional random backstage moment) ===
    if (Math.random() < 0.28 && state.roster && state.roster.length > 0) {
        const pick = state.roster[Math.floor(Math.random() * state.roster.length)];
        if (pick) {
            const hit = 5 + Math.floor(Math.random() * 6);
            pick.happiness = Math.max(8, pick.happiness - hit);
            log(`<span style="color:#ffaa66">[PASSIVE DRAMA] ${pick.name} dealing with backstage heat. -${hit} Happiness</span>`);
        }
    }

    // === RECORD LAST SHOW (for future UI / recap use) ===
    state.lastShow = {
        rating: avgRating,
        revenue: Math.floor(showRevenue + sponsorBonus),
        segments: numSegments,
        liveEvents: showEvents.length,
        isPPV: isPPV,
        ts: Date.now()
    };

    // === PPV POST-SHOW CONTRACT TALKS (in-page panel, no more blocking confirms) ===
    if (isPPV) {
        const candidates = (state.roster || [])
            .map((w, i) => ({ w, i }))
            .filter(item => item.w &&
                (item.w.pop >= 55 || item.w.happiness < 58) &&
                item.w.happiness < 78)
            .sort((a, b) => b.w.pop - a.w.pop)
            .slice(0, 3);

        if (candidates.length > 0) {
            const demandingDetails = candidates.map(item => {
                const raise = Math.max(45, Math.floor(item.w.pop * 0.75 + (item.w.happiness < 40 ? 25 : 0)));
                const demands = [];
                if (item.w.pop > 72) demands.push("I want a stronger push or I'm exploring options");
                if (item.w.happiness < 42) demands.push("Therapy / time off — the road is killing me");
                if (item.w.pop > 82) demands.push("I deserve a title opportunity");
                if (demands.length === 0) demands.push("Fair compensation for what I'm bringing to the table");
                return {
                    w: item.w,
                    demandedRaise: raise,
                    demands: demands
                };
            });

            log(`<b>— POST-PPV CONTRACT TALKS —</b> ${demandingDetails.length} wrestler(s) are waiting.`);
            if (typeof showContractTalks === 'function') {
                showContractTalks(demandingDetails);
            } else if (typeof window.showContractTalks === 'function') {
                window.showContractTalks(demandingDetails);
            }
        } else {
            log(`PPV completed. The locker room is content (for now).`);
        }
    }

    // === RESET FOR NEXT WEEK (the key "button turns back on" fix) ===
    activeCard = [];
    window.activeCard = activeCard;

    if (typeof renderRundown === 'function') {
        renderRundown();
    } else if (typeof window.renderRundown === 'function') {
        window.renderRundown();
    }

    log(`Show card cleared — ready to book next week.`);
    console.log('%c[booking.js] processPostBroadcast complete (ratings war + finance + reset)', 'color:#0f0');
}

// ============================================
// CONTRACT TALKS SYSTEM
// In-page replacement for old blocking confirm() dialogs after PPV.
// Called from processPostBroadcast when isPPV is true.
// The static HTML panel lives in index.html (Booking tab).
// ============================================

let pendingContractTalks = [];

function showContractTalks(demandingDetails) {
    if (!demandingDetails || demandingDetails.length === 0) return;

    pendingContractTalks = demandingDetails;

    const panel = document.getElementById('contract-talks-panel');
    const list = document.getElementById('contract-talks-list');
    if (!panel || !list) return;

    list.innerHTML = '';

    pendingContractTalks.forEach((talk, idx) => {
        const card = document.createElement('div');
        card.className = 'contract-demand-card';
        card.id = `contract-card-${idx}`;

        const demandsHtml = talk.demands.map(d => `• ${d}`).join('<br>');

        card.innerHTML = `
            <div class="header">
                <span class="wrestler-name">${talk.w.name} (Pop ${talk.w.pop}, Hap ${talk.w.happiness})</span>
                <span class="raise">Demands +$${talk.demandedRaise}</span>
            </div>
            <div class="demands">${demandsHtml}</div>
            <div class="actions">
                <button class="btn-accept" onclick="resolveContractDemand(${idx}, true)">ACCEPT (costs $${talk.demandedRaise * 2})</button>
                <button class="btn-reject" onclick="resolveContractDemand(${idx}, false)">REJECT</button>
            </div>
        `;
        list.appendChild(card);
    });

    panel.style.display = 'block';
    log(`<b>— POST-PPV CONTRACT TALKS —</b> Resolve below.`);
}

function resolveContractDemand(pendingIdx, accepted) {
    const talk = pendingContractTalks[pendingIdx];
    if (!talk || talk.resolved) return;

    const w = talk.w;
    const card = document.getElementById(`contract-card-${pendingIdx}`);
    if (card) card.classList.add('resolved');

    if (accepted && state.funds >= talk.demandedRaise * 2) {
        w.salary += talk.demandedRaise;
        w.happiness = Math.min(100, w.happiness + 25);
        state.funds -= talk.demandedRaise * 2;

        if (!w.promises) w.promises = [];
        if (talk.demands.some(d => d.includes("push"))) w.promises.push("better_push");
        if (talk.demands.some(d => d.includes("title"))) w.promises.push("title_shot");
        if (talk.demands.some(d => d.includes("creative"))) w.promises.push("promo_time");

        log(`${w.name} accepted the new contract. Happiness greatly improved.`);
    } else {
        const drop = (w.pop > 75) ? 22 : 15;
        w.happiness = Math.max(5, w.happiness - drop);

        log(`${w.name} was furious after the rejection.`);

        if (w.happiness < 18 && Math.random() < 0.65) {
            log(`<span style="color:#ff6666">${w.name} has had enough and LEFT THE COMPANY!</span>`);
            const idx = state.roster.indexOf(w);
            if (idx > -1) state.roster.splice(idx, 1);
        } else if (w.happiness < 30) {
            log(`${w.name} is now refusing to work until their demands are met.`);
        }
    }

    talk.resolved = true;

    // Check if all talks are done
    const remaining = pendingContractTalks.filter(t => !t.resolved);
    if (remaining.length === 0) {
        const panel = document.getElementById('contract-talks-panel');
        if (panel) {
            setTimeout(() => {
                panel.style.display = 'none';
                document.getElementById('contract-talks-list').innerHTML = '';
                // Force a full refresh of the CURRENT SHOW CARD after contracts are done
                activeCard = [];
                window.activeCard = activeCard;
                if (typeof renderRundown === 'function') renderRundown();
            }, 1200);
        }
        pendingContractTalks = [];
    }

    save(); updateUI();
    // Ensure the CURRENT SHOW CARD and booking buttons are refreshed
    // after contract resolutions (updateUI alone doesn't call renderRundown post-split)
    if (typeof renderRundown === 'function') renderRundown();
}

// ============================================
// EXECUTE SHOW / BROADCAST (final heavy extraction)
// This now owns the entire "hit Broadcast" flow that used to live
// inline in the execute-show-btn listener:
//   - Live events (weather, attacks, forced spots)
//   - processedCard simulation loop (simulateSegment + mutations)
//   - processPostBroadcast (ratings, finance, contracts, reset)
// The handler in index.html is now almost pure wiring.
// ============================================
function executeShow() {
    let showRevenue = 0;
    let showStarsTotal = 0;

    // === LIVE EVENTS RESOLUTION (new RNG weather + drama system) ===
    // See resolveLiveEvents() for weather cancellations, backstage attacks, and forced spots.
    // These layer on top of player-chosen spots (Planned vs Chaos).
    const showEvents = resolveLiveEvents(currentVenue);
    let processedCard = [...activeCard]; // work on a copy so we can mutate safely

    // Apply pre-match effects from events (attacks, forced spots)
    showEvents.forEach(ev => {
        if (ev.type === 'backstage_attack' && state.roster[ev.wrestlerIdx]) {
            state.roster[ev.wrestlerIdx].stamina = Math.max(0, state.roster[ev.wrestlerIdx].stamina - ev.staminaHit);
            log(`<span style="color:#ff6666">[BACKSTAGE] ${ev.name} was attacked! -${ev.staminaHit} STAMINA</span>`);
        }
        if (ev.type === 'surprise_moment' && processedCard[ev.matchIndex]) {
            processedCard[ev.matchIndex][ev.forcedSpot] = true;
            log(`<span style="color:#ffcc66">[UNPLANNED] ${ev.flavor} on SEG ${ev.matchIndex + 1}!</span>`);
        }
    });

    // Handle weather cancellations (remove affected matches)
    const cancelledIndices = [];
    showEvents.forEach(ev => {
        if (ev.type === 'weather_cancel' && processedCard[ev.matchIndex]) {
            cancelledIndices.push(ev.matchIndex);
            log(`<span style="color:#ff6666">[WEATHER] ${ev.reason} at ${ev.venue} — SEG ${ev.matchIndex + 1} CANCELLED</span>`);
        }
    });

    // Filter out cancelled matches (reverse order to preserve indices)
    cancelledIndices.sort((a, b) => b - a).forEach(idx => {
        processedCard.splice(idx, 1);
    });

    const venueLine = currentVenue ? ` — ${currentVenue.name}` : '';
    if (showEvents.length > 0) {
        log(`<b>— LIVE EVENTS RESOLVED${venueLine} —</b>`);
    } else {
        log(`<b>====== P&G LIVE BROADCAST${venueLine} ======</b>`);
    }

    processedCard.forEach((match, index) => {
        const a = state.roster[match.a];
        const b = state.roster[match.b];
        const a2 = match.isTag ? state.roster[match.a2] : null;
        const b2 = match.isTag ? state.roster[match.b2] : null;

        if (!a || !b || (match.isTag && (!a2 || !b2))) {
            log(`[ERROR] Invalid wrestler in segment ${index + 1}. Skipping.`);
            return;
        }

        let participants = [a, b];
        if (match.isTag) participants.push(a2, b2);

        // Simulation layer lives in booking.js
        const result = simulateSegment(match, participants);

        showStarsTotal += result.finalStars;
        showRevenue += result.revenue;

        // Apply mutations (pop, stamina, workout bonuses)
        participants.forEach(p => {
            if (result.finalStars >= 4) p.pop += 2;
            else if (result.finalStars <= 1.5) p.pop -= 1;
            if (result.finalStars >= 3.0 && p.pop < 25) p.pop += 1;

            if (p._workoutPopBonus) {
                p.pop += p._workoutPopBonus;
                delete p._workoutPopBonus;
            }

            p.stamina = Math.max(0, p.stamina - result.stamDrain);
        });

        // Use the pre-built log line from the simulation helper
        // (we inject the correct segment number here)
        const finalLog = result.logText.replace('[SEG ]', `[SEG ${index + 1}]`);
        log(finalLog);
    });

    // Post-broadcast processing (ratings war, finance, decay, contracts, reset)
    processPostBroadcast({
        showRevenue,
        showStarsTotal,
        processedCard,
        showEvents,
        isPPV: document.getElementById('is-ppv')?.checked
    });

    save(); 
    updateUI();  // includes renderRundown()

    // Extra defensive funds display update after shows.
    const fundsEl2 = document.getElementById('funds');
    if (fundsEl2) {
        fundsEl2.textContent = Math.floor(state.funds || 0);
    }
}

// === FREE AGENCY / MARKET ===
// refreshMarket and hire are game state operations (spending funds, generating talent,
// adding to roster). They belong with other booking/operations logic.

function refreshMarket() {
    if (state.funds < 100) return;
    state.funds -= 100; state.market = [];
    const n1 = ["Neon", "Titan", "Viper", "Grave", "Steel"]; const n2 = ["Striker", "Havoc", "Bane", "Wolf", "Rex"];
    const alignments = ALIGNMENTS;
    const archetypes = ARCHETYPES;

    for(let i=0; i<3; i++) {
        const arch = archetypes[Math.floor(Math.random()*archetypes.length)];
        state.market.push({
            name: n1[Math.floor(Math.random()*5)] + " " + n2[Math.floor(Math.random()*5)],
            pop: Math.floor(Math.random() * 40) + 10,
            salary: Math.floor(Math.random() * 100) + 50,
            stamina: 100,
            alignment: alignments[Math.floor(Math.random()*2)],
            archetype: arch,
            legendIcon: ARCHETYPE_DATA[arch] ? ARCHETYPE_DATA[arch].icon : DEFAULT_LEGEND_ICON
        });
    }
    save(); updateUI();
}

function hire(idx) {
    let t = state.market[idx]; if (state.funds < t.salary * 3) return;
    state.funds -= (t.salary * 3);
    // Ensure new hires always have the new fields
    if (!t.alignment) t.alignment = ALIGNMENTS[Math.floor(Math.random() * ALIGNMENTS.length)];
    if (!t.archetype) t.archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
    if (!t.legendIcon) t.legendIcon = ARCHETYPE_DATA[t.archetype]?.icon || DEFAULT_LEGEND_ICON;
    t.activeWorkouts = [];
    t.happiness = 70 + Math.floor(Math.random() * 20);
    state.roster.push(t);
    state.market.splice(idx, 1);
    save(); updateUI();
    renderFullRoster(); // keep the new rich roster fresh
}