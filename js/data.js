// ============================================
// P&G GLOBAL - SHOWRUNNER TERMINAL
// data.js — All data-driven game constants
// These are the single source of truth for the UI and simulation.
// Nothing should be hardcoded outside these structures.
// ============================================

// === LIVE EVENTS & TOURING DATA (RNG weather / venue system) ===
const VENUES = [
    { id: "chi", name: "CHICAGO ARMORY", type: "indoor", weatherRisk: 0.15, flavor: "Classic hard-hitting crowd" },
    { id: "dal", name: "DALLAS OUTDOOR ARENA", type: "outdoor", weatherRisk: 0.55, flavor: "Hot & unpredictable" },
    { id: "nyc", name: "NYC DOME", type: "dome", weatherRisk: 0.10, flavor: "Electric but expensive" },
    { id: "la",  name: "LOS ANGELES COLISEUM", type: "outdoor", weatherRisk: 0.35, flavor: "Glamour + traffic chaos" },
    { id: "atl", name: "ATLANTA WAREHOUSE", type: "indoor", weatherRisk: 0.20, flavor: "Rowdy southern heat" },
    { id: "sea", name: "SEATTLE PIER", type: "outdoor", weatherRisk: 0.65, flavor: "Rain city - high weather variance" }
];

// === DATA-DRIVEN WRESTLER ATTRIBUTES ===
const ALIGNMENTS = ["heel", "face"];

// Archetypes with legend-style icons (editable per wrestler)
const ARCHETYPE_DATA = {
    "Technician":            { icon: "⚙️" },
    "High Flyer":            { icon: "🪂" },
    "Brawler":               { icon: "🥊" },
    "Powerhouse":            { icon: "💪" },
    "Submission Specialist": { icon: "🌀" },
    "Showman":               { icon: "✨" },
    "Hardcore":              { icon: "⛓️" },
    "Striker":               { icon: "🥋" },
    "Giant":                 { icon: "🏔️" },
    "Speedster":             { icon: "⚡" }
};

const ARCHETYPES = Object.keys(ARCHETYPE_DATA);

function getArchetypeDisplay(archetype) {
    const data = ARCHETYPE_DATA[archetype];
    return data ? `${data.icon} ${archetype}` : archetype;
}

// === LEGEND STYLE ICONS (per-wrestler) ===
const DEFAULT_LEGEND_ICON = "★";

// === STIPULATIONS (Creative HQ system) ===
// Layerable onto matches for real mechanical effects
const STIPULATIONS = [
    {
        id: "no_dq",
        name: "No Disqualification",
        description: "Anything goes. More weapons and run-ins possible.",
        effects: { rating: 0.25, weaponsChance: 1.5 }
    },
    {
        id: "hardcore",
        name: "Hardcore Rules",
        description: "Weapons everywhere. High risk, high reward.",
        effects: { rating: 0.4, staminaDrain: 12, revenue: 1.2 }
    },
    {
        id: "ladder",
        name: "Ladder Match",
        description: "High spots and big spots. Very physically demanding.",
        effects: { rating: 0.5, staminaDrain: 25, popGain: 2 }
    },
    {
        id: "cage",
        name: "Steel Cage",
        description: "No escape. Brutal and dramatic.",
        effects: { rating: 0.6, staminaDrain: 30, titleChangeChance: 1.3 }
    },
    {
        id: "first_blood",
        name: "First Blood",
        description: "First to bleed loses. Very intense.",
        effects: { rating: 0.35, popGain: 1.5 }
    },
    {
        id: "loser_leaves",
        name: "Loser Leaves Town",
        description: "High stakes. Loser is gone for a while.",
        effects: { rating: 0.45, popGain: 3 }
    },
    {
        id: "tables",
        name: "Tables Match",
        description: "Must put opponent through a table to win.",
        effects: { rating: 0.3, staminaDrain: 15 }
    }
];

// === PRE-PROGRAMMED MATCH TYPES (comprehensive, data-driven) ===
const MATCH_TYPES = [
    { value: "standard",   label: "1 ON 1 (STANDARD)" },
    { value: "submission", label: "SUBMISSION MATCH" },
    { value: "nodq",       label: "NO DQ / NO HOLDS BARRED" },
    { value: "hardcore",   label: "HARDCORE MATCH" },
    { value: "street",     label: "STREET FIGHT" },
    { value: "falls",      label: "FALLS COUNT ANYWHERE" },
    { value: "lastman",    label: "LAST MAN STANDING" },
    { value: "firstblood", label: "FIRST BLOOD" },
    { value: "iquit",      label: "I QUIT MATCH" },
    { value: "ladder",     label: "LADDER MATCH" },
    { value: "table",      label: "TABLE MATCH" },
    { value: "tlc",        label: "TLC MATCH (Tables, Ladders, Chairs)" },
    { value: "cage",       label: "STEEL CAGE" },
    { value: "hell",       label: "HELL IN A CELL" },
    { value: "buried",     label: "BURIED ALIVE" },
    { value: "casket",     label: "CASKET MATCH" },
    { value: "tag",        label: "2 ON 2 (TAG TEAM)" },
    { value: "trios",      label: "3 ON 3 (TRIOS)" },
    { value: "fourway",    label: "4-WAY" },
    { value: "fiveway",    label: "5-WAY" },
    { value: "handicap",   label: "HANDICAP MATCH (2v1)" },
    { value: "gauntlet",   label: "GAUNTLET MATCH" },
    { value: "battle",     label: "BATTLE ROYAL" },
    { value: "war",        label: "WARGAMES" },
    { value: "elim",       label: "ELIMINATION MATCH" }
];

// === WRESTLER HAPPINESS / MORALE THRESHOLDS ===
const HAPPINESS_EFFECTS = {
    veryLow: 30,
    low: 50,
    neutral: 70,
    good: 85
};

// === WORKOUTS / TRAINING (exactly 4 regimens, stackable up to 4 active) ===
const WORKOUTS = [
    {
        id: "strength",
        name: "Strength Training",
        description: "Focus on power and physical presence.",
        bonus: { rating: 0.35 }
    },
    {
        id: "cardio",
        name: "Cardio & Conditioning",
        description: "Builds endurance and recovery.",
        bonus: { staminaRetention: 12 }
    },
    {
        id: "technique",
        name: "Technical Drills",
        description: "Improves execution and psychology.",
        bonus: { rating: 0.3 }
    },
    {
        id: "promo",
        name: "Promo & Charisma",
        description: "Sharpens mic work and crowd connection.",
        bonus: { popGain: 2 }
    }
];

// === PRE-PROGRAMMED TITLES (data-driven, with multi-holder support) ===
// beltLabels are used for individual title tracking on tag/trios titles.
const TITLES = {
    world: {
        key: "world",
        name: "WORLD HEAVYWEIGHT CHAMPIONSHIP",
        maxHolders: 1,
        beltLabels: ["World Heavyweight Title"],
        short: "WORLD"
    },
    womens: {
        key: "womens",
        name: "WOMEN'S WORLD CHAMPIONSHIP",
        maxHolders: 1,
        beltLabels: ["Women's World Title"],
        short: "WOMEN'S"
    },
    tag: {
        key: "tag",
        name: "WORLD TAG TEAM CHAMPIONSHIP",
        maxHolders: 2,
        beltLabels: ["World Tag Belt 1", "World Tag Belt 2"],
        short: "TAG"
    },
    womensTag: {
        key: "womensTag",
        name: "WOMEN'S TAG TEAM CHAMPIONSHIP",
        maxHolders: 2,
        beltLabels: ["Women's Tag Belt 1", "Women's Tag Belt 2"],
        short: "WOMEN'S TAG"
    },
    trios: {
        key: "trios",
        name: "TRIOS CHAMPIONSHIP",
        maxHolders: 3,
        beltLabels: ["Trios Belt 1", "Trios Belt 2", "Trios Belt 3"],
        short: "TRIOS"
    },
    midcard: {
        key: "midcard",
        name: "INTERCONTINENTAL / TNT CHAMPIONSHIP",
        maxHolders: 1,
        beltLabels: ["Midcard Title"],
        short: "MIDCARD"
    },
    hardcore: {
        key: "hardcore",
        name: "HARDCORE CHAMPIONSHIP",
        maxHolders: 1,
        beltLabels: ["Hardcore Title"],
        short: "HARDCORE"
    },
    tv: {
        key: "tv",
        name: "TELEVISION CHAMPIONSHIP",
        maxHolders: 1,
        beltLabels: ["TV Title"],
        short: "TV"
    },
    cruiser: {
        key: "cruiser",
        name: "CRUISERWEIGHT / X-DIVISION CHAMPIONSHIP",
        maxHolders: 1,
        beltLabels: ["Cruiserweight Title"],
        short: "CRUISER"
    },
    secondary: {
        key: "secondary",
        name: "UNITED STATES / NATIONAL CHAMPIONSHIP",
        maxHolders: 1,
        beltLabels: ["Secondary Title"],
        short: "SECONDARY"
    }
};

// Default starting venue (can be changed in Operations / Touring)
let currentVenue = VENUES[0];
