// --- SYSTEM DATA MODELS & STATE ---
const GameState = {
    funds: 500000,
    reputation: 1,
    marketShare: 2.4,
    roster: [
        { id: "w_01", name: "Alpha Steel", overness: 45, stamina: 90, morale: 80, wage: 1200 },
        { id: "w_02", name: "Kid Mercury", overness: 32, stamina: 95, morale: 90, wage: 800 },
        { id: "w_03", name: "Baroness Vane", overness: 58, stamina: 85, morale: 75, wage: 2100 }
    ],
    freeAgents: [
        { id: "fa_01", name: "Concrete Collins", askingRate: 1500, skillIndex: 62, demand: "Medium" },
        { id: "fa_02", name: "Vapor Weaver", askingRate: 600, skillIndex: 28, demand: "Low" }
    ],
    championships: []
};

// --- CORE TERMINAL INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    renderRoster();
    renderMarket();
    populateBookingDropdowns();
    setupEventListeners();
});

// --- NAVIGATION INTERFACE CONTROLLER ---
function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    const panels = document.querySelectorAll(".workspace-panel");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove active status from all elements
            navButtons.forEach(b => b.classList.remove("active"));
            panels.forEach(p => p.classList.add("hidden"));

            // Set current active path
            btn.classList.add("active");
            const target = btn.getAttribute("data-target");
            document.getElementById(target).classList.remove("hidden");
        });
    });
}

// --- RENDERING INTEGRITY ---
function renderRoster() {
    const tbody = document.getElementById("roster-rows");
    if (!tbody) return;
    
    tbody.innerHTML = GameState.roster.map(worker => `
        <tr>
            <td><strong>${worker.name}</strong></td>
            <td>${worker.overness}</td>
            <td>${worker.stamina}%</td>
            <td>${worker.morale}%</td>
            <td>$${worker.wage}</td>
        </tr>
    `).join('');
}

function renderMarket() {
    const tbody = document.getElementById("market-rows");
    if (!tbody) return;

    tbody.innerHTML = GameState.freeAgents.map(agent => `
        <tr>
            <td><strong>${agent.name}</strong></td>
            <td>$${agent.askingRate}/wk</td>
            <td>${agent.skillIndex}</td>
            <td>${agent.demand}</td>
            <td><button class="action-btn" style="margin:0; padding:4px 8px;" onclick="signTalent('${agent.id}')">SIGN_CONTRACT</button></td>
        </tr>
    `).join('');
}

function populateBookingDropdowns() {
    const selectA = document.getElementById("worker-a");
    const selectB = document.getElementById("worker-b");
    if (!selectA || !selectB) return;

    const optionsHTML = GameState.roster.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    
    selectA.innerHTML = `<option value="">Select Talent A</option>` + optionsHTML;
    selectB.innerHTML = `<option value="">Select Talent B</option>` + optionsHTML;
}

// --- EVENT HANDLERS ---
function setupEventListeners() {
    const btnRun = document.getElementById("btn-run-match");
    if (btnRun) {
        btnRun.addEventListener("click", executeMatchLogic);
    }

    const btnForge = document.getElementById("btn-forge-belt");
    if (btnForge) {
        btnForge.addEventListener("click", forgeChampionshipLogic);
    }
}

// --- ENGINE LOGIC SIMULATION ---
function executeMatchLogic() {
    const workerAId = document.getElementById("worker-a").value;
    const workerBId = document.getElementById("worker-b").value;
    const ticker = document.getElementById("live-ticker");

    if (!workerAId || !workerBId || workerAId === workerBId) {
        ticker.innerHTML = `<p class="text-muted" style="color:var(--danger)">Error: Invalid card pairing configurations.</p>`;
        return;
    }

    const workerA = GameState.roster.find(w => w.id === workerAId);
    const workerB = GameState.roster.find(w => w.id === workerBId);

    ticker.innerHTML = `<p>[INIT] Running calculation arrays for ${workerA.name} vs ${workerB.name}...</p>`;
    
    setTimeout(() => {
        // Simple deterministic roll for demo logic
        const roll = Math.random() * (workerA.overness + workerB.overness);
        const winner = roll > workerA.overness ? workerB.name : workerA.name;
        
        ticker.innerHTML += `
            <p>[EXEC] Match completed successfully.</p>
            <p class="text-green"><strong>Result: ${winner} wins the contest.</strong></p>
        `;
    }, 800);
}

function forgeChampionshipLogic() {
    const nameInput = document.getElementById("belt-name");
    const tierSelect = document.getElementById("belt-tier");
    
    if (!nameInput.value.trim()) return;

    const newBelt = {
        name: nameInput.value.trim(),
        tier: tierSelect.value,
        holder: "Vacant"
    };

    GameState.championships.push(newBelt);
    alert(`System confirmation: Champion title layout for "${newBelt.name}" stored.`);
    nameInput.value = "";
}

function signTalent(id) {
    const index = GameState.freeAgents.findIndex(fa => fa.id === id);
    if (index === -1) return;

    const agent = GameState.freeAgents.splice(index, 1)[0];
    const newWorker = {
        id: agent.id,
        name: agent.name,
        overness: Math.floor(agent.skillIndex * 0.8),
        stamina: 100,
        morale: 100,
        wage: agent.askingRate
    };

    GameState.roster.push(newWorker);
    renderRoster();
    renderMarket();
    populateBookingDropdowns();
}