// ============================================
// P&G GLOBAL - SHOWRUNNER TERMINAL
// ui.js — Rendering, UI helpers, and application initialization
//
// This module owns:
//   - All major rendering (roster, show card, market, last show recap, etc.)
//   - Creative tab (titles, stipulations, promo generator)
//   - Roster editing and wrestler creation
//   - Venue/tour UI
//   - Tab system and various population helpers
//   - Game initialization (initializeGame)
//   - Accessibility helpers
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

// === MARKET / FREE AGENCY RENDERING (extracted from updateUI) ===
// Used in both the old Operations location and the Roster tab "Free Agents" section.
function renderMarket(container) {
    if (!container) return;
    container.innerHTML = '';

    if (!state.market || state.market.length === 0) {
        container.innerHTML = '<div style="color:#666; font-size:0.9em; padding:8px 0;">No free agents available right now.</div>';
        return;
    }

    state.market.forEach((m, i) => {
        const archDisplay = getArchetypeDisplay(m.archetype || "Brawler");
        const stamColor = m.stamina < 50 ? '#ff6666' : (m.stamina < 80 ? '#ffcc66' : '#66ff99');
        const stamBar = Math.max(10, Math.min(100, m.stamina));

        container.innerHTML += `
            <div class="market-entry">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${m.name}</strong>
                        <span style="color:#666; font-size:0.75em; margin-left:4px;">(${m.alignment ? m.alignment.toUpperCase() : ''})</span>
                    </div>
                    <div style="font-size:0.8em; color:#888;">
                        Pop <span style="color:#39ff14; font-weight:600;">${m.pop}</span>
                    </div>
                </div>

                <div style="margin: 6px 0 4px; display:flex; align-items:center; gap:6px; font-size:0.8em;">
                    <span style="color:#888; min-width:32px;">Stam</span>
                    <div style="flex:1; height:5px; background:#222; border-radius:3px; overflow:hidden; max-width:70px;">
                        <div style="width:${stamBar}%; height:100%; background:${stamColor};"></div>
                    </div>
                    <span style="color:${stamColor}; font-weight:600; min-width:26px;">${Math.floor(m.stamina)}%</span>
                </div>

                <div style="font-size:0.8em; color:#aaa; margin-bottom:6px;">
                    ${archDisplay}
                </div>

                <button onclick="hire(${i})" style="padding:5px 12px; font-size:0.75em; width:auto;">
                    SIGN ($${m.salary * 3})
                </button>
            </div>`;
    });
}

// === SMALL UI POPULATORS (extracted from updateUI for cleanliness) ===

function populateHealDropdown() {
    const healSel = document.getElementById('heal-select');
    if (!healSel) return;

    const prevVal = healSel.value;
    healSel.innerHTML = '<option value="">-- Select Wrestler --</option>';

    if (state.roster && state.roster.length > 0) {
        state.roster.forEach((w, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${w.name} (Stam: ${Math.floor(w.stamina)}%, Hap: ${w.happiness})`;
            healSel.appendChild(opt);
        });
        if (prevVal && state.roster[prevVal]) {
            healSel.value = prevVal;
        }
    }
}

function populateCreateWrestlerForm() {
    const alignSel = document.getElementById('create-alignment');
    const archSel = document.getElementById('create-archetype');

    if (alignSel) {
        alignSel.innerHTML = '';
        ALIGNMENTS.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a.toUpperCase();
            alignSel.appendChild(opt);
        });
        alignSel.value = 'face';
    }

    if (archSel) {
        archSel.innerHTML = '';
        ARCHETYPES.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = getArchetypeDisplay(a);
            archSel.appendChild(opt);
        });
        archSel.value = ARCHETYPES[0];
    }
}

// === BOOKING DROPDOWNS (extracted from updateUI) ===
// Populates the four wrestler selects in the Booking tab while preserving
// any previously chosen values (important for UX when the roster or UI refreshes).
function populateBookingDropdowns() {
    const selA = document.getElementById('wrestler-a');
    const selB = document.getElementById('wrestler-b');
    const selA2 = document.getElementById('wrestler-a2');
    const selB2 = document.getElementById('wrestler-b2');
    
    let sA = selA ? selA.value : '', sB = selB ? selB.value : '', 
        sA2 = selA2 ? selA2.value : '', sB2 = selB2 ? selB2.value : '';
    
    if (selA) selA.innerHTML=''; 
    if (selB) selB.innerHTML=''; 
    if (selA2) selA2.innerHTML=''; 
    if (selB2) selB2.innerHTML='';

    state.roster.forEach((w, i) => {
        const optText = getWrestlerDisplayName(i);
        if (selA) selA.add(new Option(optText, i));
        if (selB) selB.add(new Option(optText, i));
        if (selA2) selA2.add(new Option(optText, i));
        if (selB2) selB2.add(new Option(optText, i));
    });

    if (selA && sA !== "") selA.value = sA; 
    if (selB && sB !== "") selB.value = sB;
    if (selA2 && sA2 !== "") selA2.value = sA2; 
    if (selB2 && sB2 !== "") selB2.value = sB2;
}

// === RICH ROSTER VIEW + EDITING (moved from inline script) ===
// This entire block (display + rename/icon/workout/medical editing) is now in the UI module.
// The generated HTML still uses onclick="renameWrestler(...)" etc., which continue to work
// because the functions remain global.

function getWrestlerDisplayName(i) {
    const w = state.roster[i];
    if (!w) return "";
    let tags = "";

    // World Title
    if (state.champIdx === i) {
        tags += ` [${TITLES.world.short}]`;
    }

    // Tag Titles (individual belts)
    const tagPos = state.tagChampIdx.indexOf(i);
    if (tagPos !== -1) {
        tags += ` [${TITLES.tag.beltLabels[tagPos] || 'TAG BELT'}]`;
    }

    // Future: Trios or other titles can be added here with their own arrays
    return w.name + tags;
}

function renderFullRoster() {
    const container = document.getElementById('roster-full');
    if (!container) return;

    if (!state.roster || state.roster.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; background: #111; border: 1px solid #444;">
                <div style="font-size: 1.1em; color: #ff6666; margin-bottom: 12px; font-weight: bold;">
                    NO WRESTLERS ON ROSTER
                </div>
                <div style="color: #888; margin-bottom: 18px; line-height: 1.4;">
                    Your promotion is completely empty.<br>
                    Go to the <strong>OPERATIONS</strong> tab and sign some talent from Free Agency.
                </div>
                <button onclick="document.querySelector('[data-tab=operations]').click()" 
                        style="background: #222; color: #39ff14; border: 1px solid #39ff14; padding: 8px 24px; cursor: pointer;">
                    OPEN FREE AGENCY
                </button>
            </div>
        `;
        return;
    }

    // Header showing the allowed data (transparency for the user)
    let html = `
        <div style="margin-bottom: 10px; padding: 6px 10px; background: #111; border: 1px solid #333; font-size: 0.72em; color: #888; display: inline-block;">
            <strong style="color:#aaa;">DATA:</strong> 
            ALIGNMENTS: <span style="color:#66ff99;">${ALIGNMENTS.map(a => a.toUpperCase()).join(" / ")}</span> &nbsp;|&nbsp; 
            ARCHETYPES: <span style="color:#39ff14;">${ARCHETYPES.map(a => getArchetypeDisplay(a)).join(" ")}</span>
        </div>
        <table class="roster-table">
            <thead>
                <tr>
                    <th style="width: 42px; text-align: center;">LEGEND</th>
                    <th>NAME</th>
                    <th>ARCHETYPE</th>
                    <th>WORKOUT</th>
                    <th>POP</th>
                    <th>STAM</th>
                    <th>HAPPY</th>
                    <th>SALARY</th>
                    <th>TITLES</th>
                    <th style="text-align:right;">ACTIONS</th>
                </tr>
            </thead>
            <tbody>`;

    state.roster.forEach((w, i) => {
        const isChamp = state.champIdx === i;
        let titleTags = "";
        if (isChamp) titleTags += '<span class="champ-tag">[WORLD TITLE]</span> ';

        // Multi-person titles using TITLES data (each wrestler gets one specific belt)
        const tagPos = state.tagChampIdx.indexOf(i);
        if (tagPos !== -1) {
            const beltLabel = TITLES.tag.beltLabels[tagPos] || `TAG BELT ${tagPos + 1}`;
            titleTags += `<span class="tag-champ-tag">[${beltLabel}]</span>`;
        }

        const alignClass = w.alignment === 'heel' ? 'alignment-heel' : 'alignment-face';
        const alignLabel = w.alignment ? w.alignment.toUpperCase() : '—';

        const legend = w.legendIcon || DEFAULT_LEGEND_ICON;
        const stamColor = w.stamina < 50 ? '#ff6666' : (w.stamina < 80 ? '#ffcc66' : '#66ff99');
        const stamBarWidth = Math.max(10, Math.min(100, w.stamina));

        html += `<tr>
            <td style="font-size:1.6em; text-align:center; width:42px; background:#111; border-right:1px solid #333;">${legend}</td>
            <td>
                <strong>${w.name}</strong>
                ${w.happiness < 25 ? '<span style="color:#ff6666; font-size:0.7em;"> [FURIOUS]</span>' : 
                  w.happiness < 40 ? '<span style="color:#ffcc66; font-size:0.7em;"> [UNHAPPY]</span>' : ''}
                ${w.promises && w.promises.length > 0 ? 
                    '<span style="color:#ffaa66; font-size:0.65em;"> [OWES]</span>' : ''}
            </td>
            
            <td style="font-size:0.9em;">${getArchetypeDisplay(w.archetype)}</td>
            
            <!-- WORKOUT STATUS (up to 4) -->
            <td style="font-size:0.8em; color: ${w.activeWorkouts && w.activeWorkouts.length > 0 ? '#ffcc66' : '#555'}">
                ${w.activeWorkouts && w.activeWorkouts.length > 0 
                    ? w.activeWorkouts.map(id => {
                        const wo = WORKOUTS.find(x => x.id === id);
                        return wo ? wo.name : id;
                      }).join(", ")
                    : "—"}
            </td>

            <!-- POP -->
            <td>
                <strong style="font-size:1.05em; color:#39ff14;">${w.pop}</strong>
            </td>
            
            <!-- STAMINA with bar -->
            <td>
                <div style="display:flex; align-items:center; gap:6px;">
                    <div style="width:48px; height:6px; background:#222; border-radius:3px; overflow:hidden;">
                        <div style="width:${stamBarWidth}%; height:100%; background:${stamColor};"></div>
                    </div>
                    <span style="color:${stamColor}; font-size:0.9em; min-width:28px;">${Math.floor(w.stamina)}%</span>
                </div>
            </td>

            <!-- HAPPINESS with bar -->
            <td>
                ${(() => {
                    const hapColor = w.happiness < 40 ? '#ff6666' : (w.happiness < 65 ? '#ffcc66' : '#66ff99');
                    const hapBar = Math.max(10, Math.min(100, w.happiness));
                    return `
                        <div style="display:flex; align-items:center; gap:6px;">
                            <div style="width:48px; height:6px; background:#222; border-radius:3px; overflow:hidden;">
                                <div style="width:${hapBar}%; height:100%; background:${hapColor};"></div>
                            </div>
                            <span style="color:${hapColor}; font-size:0.85em; min-width:28px;">${w.happiness}</span>
                        </div>
                    `;
                })()}
            </td>

            <td>$${w.salary}</td>
            <td>${titleTags}</td>
            <td style="text-align:right; white-space:nowrap;">
                <button onclick="renameWrestler(${i})" style="padding:2px 8px; font-size:0.7em; margin-right:4px;">RENAME</button>
                <button onclick="editLegendIcon(${i})" style="padding:2px 8px; font-size:0.7em;">ICON</button>
                <button onclick="assignWorkout(${i})" style="padding:2px 8px; font-size:0.7em;">WORKOUT</button>
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    // Wrap in a horizontally scrollable container so the table never breaks the page layout
    container.innerHTML = `
        <div style="overflow-x: auto; max-width: 100%; border: 1px solid #222; border-radius: 2px;">
            ${html}
        </div>
    `;
}

// === WRESTLER EDITING FUNCTIONS (data-driven) ===
function renameWrestler(index) {
    const w = state.roster[index];
    if (!w) return;
    const newName = prompt("Enter new name for this wrestler:", w.name);
    if (newName && newName.trim() !== "") {
        w.name = newName.trim().toUpperCase();
        save();
        updateUI();
        renderFullRoster();
    }
}

function toggleWrestlerAlignment(index) {
    const w = state.roster[index];
    if (!w) return;
    // Always flip using the central ALIGNMENTS list
    w.alignment = (w.alignment === "heel") ? "face" : "heel";
    save();
    updateUI();
    renderFullRoster();
}

function changeWrestlerArchetype(index, newArchetype) {
    const w = state.roster[index];
    if (!w) return;
    // Only allow values that exist in the central ARCHETYPES list
    if (ARCHETYPES.includes(newArchetype)) {
        w.archetype = newArchetype;
        save();
        updateUI();
        renderFullRoster();
    }
}

function editLegendIcon(index) {
    const w = state.roster[index];
    if (!w) return;
    const current = w.legendIcon || DEFAULT_LEGEND_ICON;
    const newIcon = prompt(`Enter Legend Icon for ${w.name} (emoji, symbol, or short text):`, current);
    if (newIcon !== null) {
        w.legendIcon = newIcon.trim() || DEFAULT_LEGEND_ICON;
        save();
        updateUI();
        renderFullRoster();
    }
}

// === WORKOUT ASSIGNMENT (supports up to 4 active workouts) ===
function assignWorkout(index) {
    const w = state.roster[index];
    if (!w) return;

    if (!w.activeWorkouts) w.activeWorkouts = [];

    let message = `Workouts for ${w.name} (max 4):\n\n`;
    message += `Currently active: ${w.activeWorkouts.length > 0 
        ? w.activeWorkouts.map(id => WORKOUTS.find(x => x.id === id)?.name).join(", ") 
        : "None"}\n\n`;

    WORKOUTS.forEach((workout, i) => {
        const isActive = w.activeWorkouts.includes(workout.id);
        message += `${i + 1}. ${workout.name} ${isActive ? "(Active)" : ""}\n`;
    });
    message += `\nEnter number to toggle (add/remove) a workout, or 0 to clear all.`;

    const choice = prompt(message);
    if (choice === null) return;

    const num = parseInt(choice);

    if (num === 0) {
        w.activeWorkouts = [];
    } else if (num >= 1 && num <= WORKOUTS.length) {
        const selectedId = WORKOUTS[num - 1].id;
        const idx = w.activeWorkouts.indexOf(selectedId);

        if (idx !== -1) {
            // Remove it
            w.activeWorkouts.splice(idx, 1);
        } else {
            // Add it (respect max 4)
            if (w.activeWorkouts.length >= 4) {
                alert("Maximum of 4 workouts allowed per wrestler.");
                return;
            }
            w.activeWorkouts.push(selectedId);
        }
    } else {
        alert("Invalid choice.");
        return;
    }

    save();
    updateUI();
    renderFullRoster();
}

// === PAY FOR RECOVERY (Healing stamina + happiness with money) ===
function payForRecovery() {
    const sel = document.getElementById('heal-select');
    if (!sel || !state.roster || state.roster.length === 0) {
        alert("No wrestlers available to heal.");
        return;
    }

    const idx = parseInt(sel.value);
    if (isNaN(idx) || !state.roster[idx]) {
        alert("Please select a wrestler from the dropdown.");
        return;
    }

    const wrestler = state.roster[idx];

    // Cost scales with how hurt they are (stamina + happiness)
    const hurtFactor = (100 - wrestler.stamina) + (100 - wrestler.happiness);
    const cost = Math.max(400, Math.floor(600 + hurtFactor * 6));

    if (state.funds < cost) {
        alert(`Not enough money. Healing ${wrestler.name} would cost $${cost}.`);
        return;
    }

    // Actually heal: restore stamina + boost happiness
    const stamRestore = Math.floor(20 + state.medLvl * 3);
    const hapBoost = Math.floor(15 + state.medLvl * 2);

    wrestler.stamina = Math.min(100, wrestler.stamina + stamRestore);
    wrestler.happiness = Math.min(100, wrestler.happiness + hapBoost);

    state.funds -= cost;

    log(`[MEDICAL] Paid $${cost} for recovery on ${wrestler.name}. Stamina +${stamRestore}%, Happiness +${hapBoost}.`);

    save();
    updateUI();
    renderFullRoster();
}

// === CREATIVE HQ (titles & stipulations management) ===
// Moved from inline script. These manage custom titles and stipulations
// and keep the Creative tab in sync.

function populateTitleStakes() {
    const sel = document.getElementById('match-stakes');
    if (!sel) return;
    sel.innerHTML = '';
    // Exhibition (no title)
    sel.add(new Option("EXHIBITION (NO STAKES)", "exhibition"));

    // All defined titles (built-in + custom)
    Object.values(TITLES).forEach(title => {
        const opt = new Option(title.name, title.key);
        sel.add(opt);
    });

    // Note: custom titles are added dynamically via createCustomTitle()
}

function renderCreativeTitles() {
    const container = document.getElementById('creative-titles-list');
    if (!container) return;

    let html = `<strong>Active Titles</strong><br><br>`;

    // Built-in titles
    Object.values(TITLES).forEach(t => {
        html += `<div style="margin-bottom:6px;">• <strong>${t.name}</strong> (${t.maxHolders} holder${t.maxHolders > 1 ? 's' : ''})</div>`;
    });

    // Custom titles
    if (state.customTitles.length > 0) {
        html += `<br><strong>Custom Titles</strong><br>`;
        state.customTitles.forEach((t, idx) => {
            html += `<div style="margin-bottom:4px;">• ${t.name} (${t.maxHolders} holders) 
            <button onclick="deleteCustomTitle(${idx})" style="font-size:0.65em; padding:1px 4px;">DELETE</button></div>`;
        });
    }

    container.innerHTML = html;
}

function renderStipulationsList() {
    const container = document.getElementById('stipulations-list');
    if (!container) return;

    let html = '';

    // Built-in stipulations
    STIPULATIONS.forEach(s => {
        html += `<div style="margin-bottom:4px;">• <strong>${s.name}</strong> — ${s.description}</div>`;
    });

    // Custom stipulations
    if (state.customStipulations.length > 0) {
        html += `<div style="margin: 8px 0 4px; color:#ffcc66;"><strong>Custom Stipulations</strong></div>`;
        state.customStipulations.forEach((s, idx) => {
            html += `<div style="margin-bottom:3px;">• ${s.name} 
                <button onclick="deleteCustomStipulation(${idx})" style="font-size:0.6em; padding:1px 4px;">DEL</button>
            </div>`;
        });
    }

    container.innerHTML = html;
}

function createCustomStipulation() {
    const name = document.getElementById('new-stip-name').value.trim();
    const desc = document.getElementById('new-stip-desc').value.trim();
    const rating = parseFloat(document.getElementById('new-stip-rating').value) || 0;
    const stam = parseInt(document.getElementById('new-stip-stam').value) || 0;

    if (!name) {
        alert("Please enter a name for the stipulation.");
        return;
    }

    const newStip = {
        id: 'custom_' + Date.now(),
        name: name,
        description: desc || "Custom stipulation",
        effects: {
            rating: rating,
            staminaDrain: stam
        },
        isCustom: true
    };

    state.customStipulations.push(newStip);
    save();

    // Clear inputs
    document.getElementById('new-stip-name').value = '';
    document.getElementById('new-stip-desc').value = '';

    renderStipulationsList();
}

function deleteCustomStipulation(index) {
    if (confirm("Delete this custom stipulation?")) {
        state.customStipulations.splice(index, 1);
        save();
        renderStipulationsList();
    }
}

function createCustomTitle() {
    const nameInput = document.getElementById('new-title-name').value.trim();
    const holders = parseInt(document.getElementById('new-title-holders').value);

    if (!nameInput) {
        alert("Please enter a title name.");
        return;
    }

    const newTitle = {
        key: 'custom_' + Date.now(),
        name: nameInput.toUpperCase(),
        maxHolders: holders,
        beltLabels: Array.from({length: holders}, (_, i) => `${nameInput} Belt ${i+1}`),
        isCustom: true
    };

    state.customTitles.push(newTitle);
    save();
    renderCreativeTitles();
    populateTitleStakes(); // refresh booking dropdown
    document.getElementById('new-title-name').value = '';
}

function deleteCustomTitle(index) {
    if (confirm("Delete this custom title?")) {
        state.customTitles.splice(index, 1);
        save();
        renderCreativeTitles();
        populateTitleStakes();
    }
}

// === PROMO GENERATOR TOOLS (moved from inline script) ===
// The "Procedural Promo Generator that actually matters" + supporting functions.

function generatePromo() {
    const w1 = document.getElementById('promo-wrestler-1').value;
    const w2 = document.getElementById('promo-wrestler-2').value;

    if (!w1) {
        alert("Select at least one wrestler for the promo.");
        return;
    }

    const wrestler1 = state.roster[parseInt(w1)];
    const wrestler2 = w2 ? state.roster[parseInt(w2)] : null;

    const templates = [
        `${wrestler1.name} cuts a fiery promo about how they're the best in the company and will prove it tonight.`,
        `A tense staredown segment between ${wrestler1.name}${wrestler2 ? ' and ' + wrestler2.name : ''}. Tension is high.`,
        `${wrestler1.name} calls out the champion and demands a title shot, getting huge crowd heat.`,
        `A surprise run-in during a promo by ${wrestler1.name} leads to a chaotic brawl.`,
        `${wrestler1.name} turns on their partner in a shocking promo moment.`
    ];

    let text = templates[Math.floor(Math.random() * templates.length)];

    // Make it actually matter
    let effect = "";
    if (wrestler2) {
        // Feud promo
        wrestler1.pop = Math.min(100, wrestler1.pop + 3);
        wrestler2.pop = Math.min(100, wrestler2.pop + 2);
        effect = "Both wrestlers gained popularity from the heated exchange.";
        state.activePromos.push({ type: "feud", wrestlers: [parseInt(w1), parseInt(w2)], weeks: 2 });
    } else {
        // Solo hype promo
        wrestler1.pop = Math.min(100, wrestler1.pop + 5);
        effect = `${wrestler1.name} is on a roll after that promo.`;
        state.activePromos.push({ type: "hot", wrestler: parseInt(w1), weeks: 1 });
    }

    document.getElementById('promo-text').value = text + "\n\n" + effect;
    save();
}

function savePromoToLog() {
    const text = document.getElementById('promo-text').value.trim();
    if (!text) return;

    log(`[CREATIVE] PROMO: ${text.substring(0, 120)}${text.length > 120 ? '...' : ''}`);
    document.getElementById('promo-text').value = '';
    save();
}

function populatePromoWrestlers() {
    const sel1 = document.getElementById('promo-wrestler-1');
    const sel2 = document.getElementById('promo-wrestler-2');
    if (!sel1 || !sel2) return;

    sel1.innerHTML = '<option value="">Select Wrestler...</option>';
    sel2.innerHTML = '<option value="">Select Opponent (optional)</option>';

    state.roster.forEach((w, i) => {
        const opt = new Option(w.name, i);
        sel1.add(opt.cloneNode(true));
        sel2.add(opt);
    });
}

// === VENUE / TOUR STOP INITIALIZATION (live events foundation) ===
// Moved from inline script. These set up the venue selector and weather risk display
// in the Operations tab. currentVenue remains global as it is read by booking.js live events.

function initVenues() {
    const sel = document.getElementById('venue-select');
    if (!sel) return;

    VENUES.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.name;
        sel.appendChild(opt);
    });

    // restore or default
    const savedId = localStorage.getItem('pg2_current_venue');
    const found = VENUES.find(v => v.id === savedId) || VENUES[0];
    currentVenue = found;
    sel.value = currentVenue.id;

    sel.addEventListener('change', () => {
        currentVenue = VENUES.find(v => v.id === sel.value) || VENUES[0];
        localStorage.setItem('pg2_current_venue', currentVenue.id);
        updateVenueDisplay();
    });

    updateVenueDisplay();
}

function updateVenueDisplay() {
    const info = document.getElementById('venue-info');
    if (!info || !currentVenue) return;
    const risk = Math.round(currentVenue.weatherRisk * 100);
    const riskColor = risk > 50 ? '#ff6666' : (risk > 25 ? '#ffcc66' : 'var(--main-green)');
    info.innerHTML = `${currentVenue.type.toUpperCase()} • <span style="color:${riskColor}">WEATHER RISK ${risk}%</span><br>${currentVenue.flavor}`;
}

// === LAST SHOW RECAP (new feature using persisted state.lastShow) ===
// Simple, scannable summary shown in the Operations tab.

function renderLastShowRecap() {
    const container = document.getElementById('last-show-recap');
    if (!container) return;

    const last = state.lastShow;

    if (!last) {
        container.innerHTML = `
            <div style="color:#666; font-size:0.9em; text-align:center;">
                No shows broadcast yet.<br>
                <span style="font-size:0.75em; color:#444;">Results will appear here after your first show.</span>
            </div>`;
        return;
    }

    const rating = parseFloat(last.rating) || 0;
    const stars = "★".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "½" : "");

    let ratingColor = "#39ff14";
    let quality = "Solid";
    if (rating >= 4.0) { ratingColor = "#39ff14"; quality = "Excellent"; }
    else if (rating >= 3.0) { ratingColor = "#aaff66"; quality = "Good"; }
    else if (rating >= 2.0) { ratingColor = "#ffcc66"; quality = "Average"; }
    else { ratingColor = "#ff6666"; quality = "Rough"; }

    const ppvBadge = last.isPPV 
        ? `<span class="extras-tag" style="background:#ffaa00; color:#111; padding:1px 5px; font-size:0.7em;">PPV</span>` 
        : '';

    const dateStr = last.ts ? new Date(last.ts).toLocaleDateString() : '';

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:#39ff14; font-size:0.9em;">LAST SHOW</strong>
            ${ppvBadge}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:12px;">
            <div>
                <div style="font-size:1.35em; line-height:1; color:${ratingColor};">
                    <span class="stars" style="font-size:1.1em;">${stars}</span>
                </div>
                <div style="font-size:0.7em; color:#888; margin-top:1px;">${quality}</div>
            </div>

            <div style="text-align:right; font-size:0.85em;">
                <div><span style="color:#888;">Revenue:</span> <span style="color:#39ff14; font-weight:600;">$${last.revenue.toLocaleString()}</span></div>
                <div style="margin-top:2px;"><span style="color:#888;">Segments:</span> ${last.segments}/6 &nbsp; <span style="color:#888;">Events:</span> ${last.liveEvents || 0}</div>
            </div>
        </div>

        ${dateStr ? `<div style="margin-top:5px; font-size:0.65em; color:#444; text-align:right;">${dateStr}</div>` : ''}
    `;
}

// === GAME INITIALIZATION (final extraction) ===
// All the one-time setup that used to live at the bottom of the inline script.
// This keeps index.html extremely clean (mostly HTML + one bootstrap call).

function initializeGame() {
    initVenues();
    initTabs();
    populateMatchTypes();
    populateTitleStakes();
    updateUI();
    renderFullRoster();

    // Initialize accessibility + main menu behavior
    initAccessibility();

    // Dynamically set promotion name in the main menu title (for returning players)
    const menuTitle = document.getElementById('main-menu-title');
    if (menuTitle && state.promotionName) {
        menuTitle.textContent = state.promotionName.toUpperCase();
    }

    // On first load, show main menu instead of jumping straight in
    // (We already have the menu visible by default via inline style)
}

// === CREATE NEW WRESTLER (moved from inline script) ===
// Form handler for the "Create New Wrestler" section in the Roster tab.

function createNewWrestler() {
    const name = (document.getElementById('create-name').value || '').trim();
    const alignment = document.getElementById('create-alignment').value;
    const archetype = document.getElementById('create-archetype').value;
    const icon = (document.getElementById('create-icon').value || '★').trim();
    const pop = parseInt(document.getElementById('create-pop').value) || 20;
    const stamina = parseInt(document.getElementById('create-stamina').value) || 90;
    const happiness = parseInt(document.getElementById('create-happiness').value) || 70;
    const salary = parseInt(document.getElementById('create-salary').value) || 110;

    if (!name) {
        alert("Wrestler needs a name.");
        return;
    }

    // Data-driven validation
    if (!ALIGNMENTS.includes(alignment)) {
        alert("Invalid alignment selected.");
        return;
    }
    if (!ARCHETYPES.includes(archetype)) {
        alert("Invalid archetype selected.");
        return;
    }

    const newWrestler = {
        name: name,
        pop: Math.max(5, Math.min(80, pop)),
        salary: Math.max(50, salary),
        stamina: Math.max(50, Math.min(100, stamina)),
        alignment: alignment,
        archetype: archetype,
        legendIcon: icon || "★",
        activeWorkouts: [],
        happiness: Math.max(30, Math.min(100, happiness)),
        promises: []
    };

    state.roster.push(newWrestler);
    save();
    updateUI();
    renderFullRoster();

    // Clear name field for quick successive creates
    document.getElementById('create-name').value = '';
    log(`[ROSTER] Created new wrestler: ${name}`);
}