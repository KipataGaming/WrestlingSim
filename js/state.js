// ============================================
// P&G GLOBAL - SHOWRUNNER TERMINAL
// state.js — Core game state + persistence + migration
// Handles save/load, backwards compatibility, and the one-time welcome bonus.
// ============================================

// The single source of truth for the entire game
let state = {
    funds: 5000,
    medLvl: 0,
    hype: 10,
    rivalHype: 30,
    champIdx: -1,
    tagChampIdx: [-1, -1],
    roster: [
        { name: "HEX PURPLE", pop: 30, salary: 150, stamina: 100, alignment: "heel", archetype: "Technician", legendIcon: "🟣", activeWorkouts: [], happiness: 82 },
        { name: "CYBER GREEN", pop: 25, salary: 120, stamina: 100, alignment: "face", archetype: "High Flyer", legendIcon: "🟢", activeWorkouts: [], happiness: 78 },
        { name: "STEEL WOLF", pop: 28, salary: 130, stamina: 100, alignment: "heel", archetype: "Brawler", legendIcon: "🐺", activeWorkouts: [], happiness: 71 },
        { name: "IRON BANE", pop: 22, salary: 100, stamina: 100, alignment: "face", archetype: "Powerhouse", legendIcon: "🛡️", activeWorkouts: [], happiness: 85 }
    ],
    market: [],
    customTitles: [],
    customStipulations: [],
    activePromos: [],
    promotionName: "P&G Global",
    promotionLocation: "Chicago, IL"
};

let activeCard = []; // The 6-segment show the player is currently building

// === PERSISTENCE ===
function save() {
    localStorage.setItem('pg2_funds', state.funds);
    localStorage.setItem('pg2_med_lvl', state.medLvl);
    localStorage.setItem('pg2_hype', state.hype);
    localStorage.setItem('pg2_rival_hype', state.rivalHype);
    localStorage.setItem('pg2_champ_idx', state.champIdx);
    localStorage.setItem('pg2_tag_champ_idx', JSON.stringify(state.tagChampIdx));
    localStorage.setItem('pg2_roster', JSON.stringify(state.roster));
    localStorage.setItem('pg2_custom_titles', JSON.stringify(state.customTitles));
    localStorage.setItem('pg2_custom_stipulations', JSON.stringify(state.customStipulations));
    localStorage.setItem('pg2_active_promos', JSON.stringify(state.activePromos));
    localStorage.setItem('pg2_promotion_name', state.promotionName);
    localStorage.setItem('pg2_promotion_location', state.promotionLocation);
}

function load() {
    const savedFunds = localStorage.getItem('pg2_funds');
    if (savedFunds !== null && !isNaN(savedFunds)) state.funds = parseFloat(savedFunds);

    state.medLvl = parseInt(localStorage.getItem('pg2_med_lvl')) || 0;
    state.hype = parseInt(localStorage.getItem('pg2_hype')) || 10;
    state.rivalHype = parseInt(localStorage.getItem('pg2_rival_hype')) || 30;
    state.champIdx = localStorage.getItem('pg2_champ_idx') !== null ? parseInt(localStorage.getItem('pg2_champ_idx')) : -1;

    const tagRaw = localStorage.getItem('pg2_tag_champ_idx');
    state.tagChampIdx = tagRaw ? JSON.parse(tagRaw) : [-1, -1];

    const rosterRaw = localStorage.getItem('pg2_roster');
    if (rosterRaw) state.roster = JSON.parse(rosterRaw);

    const customT = localStorage.getItem('pg2_custom_titles');
    if (customT) state.customTitles = JSON.parse(customT);

    const customS = localStorage.getItem('pg2_custom_stipulations');
    if (customS) state.customStipulations = JSON.parse(customS);

    const promos = localStorage.getItem('pg2_active_promos');
    if (promos) state.activePromos = JSON.parse(promos);

    state.promotionName = localStorage.getItem('pg2_promotion_name') || "P&G Global";
    state.promotionLocation = localStorage.getItem('pg2_promotion_location') || "Chicago, IL";
}

// === SAVE MIGRATION + WELCOME BACK BONUS ===
// Keeps old beta saves working and gives returning players a small meaningful gift.
function migrateSave() {
    if (!state.roster) state.roster = [];

    const isVeryOldSave = !state.roster[0] || state.roster[0].happiness === undefined;

    state.roster.forEach(w => {
        if (w.alignment === undefined) w.alignment = "face";
        if (w.archetype === undefined) w.archetype = "Brawler";
        if (w.legendIcon === undefined) w.legendIcon = "★";
        if (w.happiness === undefined) w.happiness = 70;
        if (w.promises === undefined) w.promises = [];

        // Convert old single-workout model to the new stackable array (max 4)
        if (w.activeWorkouts === undefined) {
            w.activeWorkouts = [];
            if (w.currentWorkout) {
                w.activeWorkouts.push(w.currentWorkout);
            }
        }
        delete w.currentWorkout;
    });

    if (!state.customTitles) state.customTitles = [];
    if (!state.customStipulations) state.customStipulations = [];
    if (!state.activePromos) state.activePromos = [];

    // One-time welcome package for very old saves (pre-happiness era)
    const alreadyReceivedBonus = localStorage.getItem('pg2_welcome_back_received') === 'true';

    if (isVeryOldSave && !alreadyReceivedBonus) {
        state.funds += 6500;

        state.roster.forEach(w => {
            w.happiness = Math.min(100, w.happiness + 18);
        });

        if (!state.customStipulations) state.customStipulations = [];
        state.customStipulations.push({
            id: 'welcome_back_custom',
            name: "Welcome Back Match",
            description: "A special stipulation granted as a welcome back gift.",
            effects: { rating: 0.3 },
            isCustom: true
        });

        localStorage.setItem('pg2_welcome_back_received', 'true');

        setTimeout(() => {
            log(`<span style="color:#ffcc66"><b>WELCOME BACK!</b></span>`);
            log(`As thanks for playing an early beta, you've received a one-time bonus:`);
            log(`• +$6,500 to your funds`);
            log(`• +18 Happiness to every wrestler on your roster`);
            log(`• One free custom stipulation added to your library`);
            log(`Thank you for sticking with the game through development!`);
        }, 1500);
    }
}

// Initialize persistence on load
function initState() {
    load();
    migrateSave();
    // Ensure activeCard is always an array
    if (!window.activeCard) window.activeCard = [];
}
