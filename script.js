// Global Constants
const MAX_ITEMS = 6;
const MAX_POWERS = 4;
const ROUND_SLOTS = [1, 3, 5, 7];
const ROUND_TO_SLOT_MAP = {
    1: 0,  // first slot is for round 1
    3: 1,  // second slot is for round 3 
    5: 2,  // third slot is for round 5
    7: 3   // fourth slot is for round 7
};

// Default values
const DEFAULT_ECONOMY_VALUES = {
    low: {
        1: 3000,
        2: 3500,
        3: 4000,
        4: 4500,
        5: 5000,
        6: 5500,
        7: 6000
    },
    normal: {
        1: 5000,
        2: 5500,
        3: 6000,
        4: 6500,
        5: 7000,
        6: 7500,
        7: 8000
    },
    high: {
        1: 7000,
        2: 7500,
        3: 8000,
        4: 8500,
        5: 9000,
        6: 9500,
        7: 10000
    }
};

// Default build data structure
const DEFAULT_BUILD_DATA = {
    equippedItemsByRound: {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: []
    },
    equippedPowers: {
        1: null,
        3: null,
        5: null,
        7: null
    },
};

const DEFAULT_HERO_DATA = {
    items: { weapon: {}, ability: {}, survival: {} },
    powers: [],
    hero: null // Add hero data field
};

// Global variable for tooltip
let tooltip;
let isHoveringItem = false;  // Track if we're hovering over an item

// State Storage which are persistable
const builds = {
    heroes: {},
    economySettings: {
        simulationMode: false, // false = unlimited, true = simulation
        economyPresets: {}, // Stores selected preset for each round (1-7)
        customValues: {     // Stores custom values for each preset for each round
            low: {},        // Structure: { 1: value, 2: value, ... }
            normal: {},     // Structure: { 1: value, 2: value, ... }
            high: {}        // Structure: { 1: value, 2: value, ... }
        }
    }
};

// State tracked in the flight
let currentHero = '';
let currentRound = 1;
let cashByRound = {};
let costByRound = {};
let stats = {
    // Life stats will be loaded from hero JSON file
    life: {
        health: 0,
        armor: 0,
        shield: 0
    },
    // All other stats are modifiers (percentage increases)
    weaponPower: 0,
    abilityPower: 0,
    attackSpeed: 0,
    cooldownReduction: 0,
    maxAmmo: 0,
    weaponLifesteal: 0,
    abilityLifesteal: 0,
    moveSpeed: 0,
    reloadSpeed: 0,
    meleeDamage: 0,
    criticalDamage: 0
}
let config = {}; // Stores the loaded config data
// Global cash variable removed - cash is now tracked per hero in builds.heroes[heroId]

function isDisabledRound() {
    return currentRound % 2 === 0;
}

// Set current hero
function setCurrentHero(heroId) {
    currentHero = heroId;
    // Initialize hero state if it doesn't exist
    getHeroBuild(heroId);
}

// Get current hero state
function getCurrentHeroBuild() {
    return getHeroBuild(currentHero);
}

// Get hero state for a specific hero, initialize if needed
function getHeroBuild(heroId) {
    // Initialize a new hero state if needed
    if (!builds.heroes[heroId]) {
        builds.heroes[heroId] = JSON.parse(JSON.stringify(DEFAULT_BUILD_DATA)); // Deep copy
    }
    return builds.heroes[heroId];
}

// Reset hero build
function resetHeroBuild(heroId) {
    builds.heroes[heroId] = JSON.parse(JSON.stringify(DEFAULT_BUILD_DATA));
    // No need for purchasedItems array in the new structure
    builds.heroes[heroId].cashByRound = {}; // Initialize empty cashByRound object
}

function updateCost(round, cost) {
    costByRound[round] = cost;
}

function updateCash(round, cash) {
    cashByRound[round] = cash;
}

// Get global economy settings
function getEconomySettings() {
    return builds.economySettings;
}

function isEconomyModeSimulation() {
    return builds.economySettings.simulationMode;
}

// Update economy mode (unlimited vs simulation)
function setEconomyModeUnlimited() {
    builds.economySettings.simulationMode = false;
}

function setEconomyModeSimulation() {
    builds.economySettings.simulationMode = true;
}

// Update economy preset for a specific round
function setEconomyPreset(round, preset) {
    builds.economySettings.economyPresets[round] = preset;
}

// Update economy value for a specific round and preset
function setEconomyValue(round, preset, value) {
    // Ensure customValues structure exists
    if (!builds.economySettings.customValues[preset]) {
        builds.economySettings.customValues[preset] = {};
    }

    // Update the value for this specific preset and round
    builds.economySettings.customValues[preset][round] = value;
}

// Get economy preset value for a round
function getEconomyPresetValue(round, presetName) {
    // Check if we have a custom value for this preset and round
    if (builds.economySettings.customValues &&
        builds.economySettings.customValues[presetName] &&
        builds.economySettings.customValues[presetName][round] !== undefined) {
        return builds.economySettings.customValues[presetName][round];
    }

    // Fall back to default value
    return DEFAULT_ECONOMY_VALUES[presetName][round];
}

function getCurrentRoundBudget() {
    // Get the currently selected preset for this round
    const selectedPreset = builds.economySettings.economyPresets[currentRound] || 'normal';

    // Get the value for this preset (custom or default)
    return getEconomyPresetValue(currentRound, selectedPreset);
}

// Reset all economy presets to default normal values
function resetEconomyPresets() {
    for (let round = 1; round <= 7; round++) {
        builds.economySettings.economyPresets[round] = 'normal';

        // Reset all custom values to defaults
        builds.economySettings.customValues.low[round] = DEFAULT_ECONOMY_VALUES.low[round];
        builds.economySettings.customValues.normal[round] = DEFAULT_ECONOMY_VALUES.normal[round];
        builds.economySettings.customValues.high[round] = DEFAULT_ECONOMY_VALUES.high[round];
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize economy structure if needed
    if (!builds.economySettings.customValues) {
        builds.economySettings.customValues = {
            low: {},
            normal: {},
            high: {}
        };
    }

    // Initialize default values for all presets and rounds
    resetEconomyPresets();

    // Set initial hero ID (used by subsequent functions)
    setCurrentHero('dva'); // Sets currentHero and ensures builds.heroes['dva'] exists

    // Load config from shared_items.json and hero-specific data
    try {
        // Initialize config structure
        config = JSON.parse(JSON.stringify(DEFAULT_HERO_DATA));

        // Load shared items first
        const sharedResponse = await fetch('data/shared_items.json');
        if (!sharedResponse.ok) {
            throw new Error(`HTTP error! status: ${sharedResponse.status}`);
        }
        const sharedData = await sharedResponse.json();

        // Load hero-specific data
        const heroResponse = await fetch(`data/hero/${currentHero}.json`);
        if (!heroResponse.ok) {
            throw new Error(`HTTP error! status: ${heroResponse.status}`);
        }
        const heroData = await heroResponse.json();

        // Store hero data metadata
        config.hero = heroData;

        console.log("Loaded hero data:", config.hero);

        // Merge shared items with hero-specific items
        // Start with shared items
        Object.assign(config.items, sharedData.items);

        // Add hero-specific items
        if (heroData.items) {
            for (const category in heroData.items) {
                for (const rarity in heroData.items[category]) {
                    // Initialize arrays if they don't exist
                    if (!config.items[category][rarity]) {
                        config.items[category][rarity] = [];
                    }
                    // Add hero-specific items to the corresponding arrays
                    config.items[category][rarity] = config.items[category][rarity].concat(heroData.items[category][rarity]);
                }
            }
        }

        // Add powers from hero data
        if (heroData.powers) {
            config.powers = heroData.powers;
        }

        console.log('Config loaded successfully');

        // --- Initialize UI Elements and Listeners (Setup Phase) ---

        // Create tooltip element (needs to exist before potential use)
        tooltip = document.createElement('div');
        tooltip.classList.add('item-tooltip');
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);

        // Initialize tabs (event listeners)
        initTabs();

        // Initialize round selector (event listeners)
        initRoundSelector();

        // Initialize reset button (event listeners)
        initResetButton();

        // Initialize hero roster (event listeners)
        initHeroRoster();

        // Initialize advanced options (event listeners)
        initAdvancedOptionsListeners(); // Renamed and focused on listeners

        // --- Update UI Based on Initial State (Render Phase) ---
        updateUI(); // Single call to render the initial state

    } catch (error) {
        console.error('Error during initialization:', error);
        showMessage('Failed to initialize application. Please refresh the page.', 'error');
    }
});

// Central function to update the entire UI based on current state
function updateUI() {
    console.log("--- Updating Full UI ---");
    updateHeroUI(); // Update hero name/portrait based on config.hero
    calculateCurrentStats(); // Reset stats and apply effects from equipped items/powers
    updateRoundDisplay(); // Update visual cues on power slots based on currentRound
    populateItems(); // Populate item lists based on config and current build state (handles 'owned')
    populatePowers(); // Populate power list based on config and current build state (handles 'equipped', disabled states)
    updateBuildDisplay(); // Render equipped items for the current round
    updatePowerDisplay(); // Render equipped powers and attach hover/click listeners
    updateStatsDisplay(); // Recalculate and display all stats based on the 'stats' object
    updateCashDisplay(); // Update build cost / remaining cash display based on economy mode and round cost
    updateAdvancedOptionsUI(); // Refresh economy panel visuals based on 'builds.economySettings'
    // Note: initPowerHoverEffects is now integrated into updatePowerDisplay
    console.log("--- Full UI Update Complete ---");
}

// Hero roster initialization
function initHeroRoster() {
    console.log("Current hero:", currentHero);
    const heroIcons = document.querySelectorAll('.hero-icon');

    // Set the current hero as active
    const currentHeroElement = document.querySelector(`.hero-icon[data-hero="${currentHero}"]`);
    if (currentHeroElement) {
        currentHeroElement.classList.add('active');
    }

    heroIcons.forEach(icon => {
        icon.addEventListener('click', async function () {
            const heroId = this.dataset.hero;

            // Skip if already selected
            if (this.classList.contains('active')) {
                return;
            }

            // Show loading state
            document.body.style.cursor = 'wait';
            this.style.opacity = '0.5';

            try {
                // Remove active class from all icons
                heroIcons.forEach(icon => icon.classList.remove('active'));

                // Add active class to clicked icon
                this.classList.add('active');

                // Switch to the selected hero
                await loadHero(heroId);

                // Reset cursor
                document.body.style.cursor = 'default';
                this.style.opacity = '1';

                // Show success message
                showMessage(`Switched to ${getHeroName(heroId)}`);
            } catch (error) {
                console.error('Error switching hero:', error);
                document.body.style.cursor = 'default';
                this.style.opacity = '1';
                showMessage('Error loading hero data');
            }
        });
    });
}

// Helper function to get the hero name from the hero ID
function getHeroName(heroId) {
    // Convert from kebab-case to proper case
    const name = heroId.split('-').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');

    // Special case for D.Va
    return name === 'Dva' ? 'D.Va' : name;
}

// Function to load hero data and update the UI
async function loadHero(heroName) {
    if (!heroName) return;

    try {
        // Show loading indicator
        document.body.style.cursor = 'wait';

        // --- State Update ---
        // Fetch hero data
        const response = await fetch(`data/hero/${heroName}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load hero data for ${heroName}`);
        }
        const data = await response.json();

        // Validate hero data structure
        const hasValidData = data && typeof data === 'object' && data.hero && (data.powers || Array.isArray(data.powers));
        if (!hasValidData) {
            showMessage(`Warning: ${getHeroName(heroName)} has incomplete data structure`, 'warning');
        }

        // Set current hero state
        setCurrentHero(heroName); // Updates currentHero and initializes build state if needed

        // Reset and update config with new hero data
        // Initialize config structure (re-initialize to clear old hero specifics)
        config = JSON.parse(JSON.stringify(DEFAULT_HERO_DATA));

        // Load shared items again (as config was reset)
        const sharedResponse = await fetch('data/shared_items.json');
        if (!sharedResponse.ok) throw new Error(`HTTP error! status: ${sharedResponse.status}`);
        const sharedData = await sharedResponse.json();
        Object.assign(config.items, sharedData.items);

        // Store new hero data metadata
        config.hero = data;

        // Merge hero-specific items
        if (data.items) {
            for (const category in data.items) {
                for (const rarity in data.items[category]) {
                    if (!config.items[category]) config.items[category] = {}; // Ensure category exists
                    if (!config.items[category][rarity]) config.items[category][rarity] = [];
                    config.items[category][rarity] = config.items[category][rarity].concat(data.items[category][rarity]);
                }
            }
        }

        // Add powers from hero data
        if (data.powers) {
            config.powers = data.powers;
        } else {
            showMessage(`Warning: No powers found for ${getHeroName(heroName)}`, 'warning');
            config.powers = []; // Ensure powers is an empty array if none found
        }

        // Check if items data is valid after merge
        const hasValidItems = config.items && typeof config.items === 'object' && (config.items.weapon || config.items.ability || config.items.survival);
        if (!hasValidItems) {
            showMessage(`Warning: No items found for ${getHeroName(heroName)}`, 'warning');
        }

        // --- UI Update ---
        updateUI(); // Update the entire UI based on the new state

        // Reset cursor
        document.body.style.cursor = 'default';
        return true;

    } catch (error) {
        console.error("Error loading hero:", error);
        document.body.style.cursor = 'default';
        showMessage(`Error loading hero ${getHeroName(heroName)}: ${error.message}`, 'error');
        // Attempt to revert to the previous hero if possible? Or maybe just leave UI in error state.
        return false;
    } finally {
        // Ensure cursor is always reset
        document.body.style.cursor = 'default';
    }
}

// Function to update hero name and portrait in UI
function updateHeroUI() {
    if (config && config.hero) {
        // console.log("Updating hero UI with:", config.hero); // Reduce console noise

        // Update hero name
        const heroNameElement = document.querySelector('.hero');
        if (heroNameElement && config.hero.name) {
            heroNameElement.textContent = config.hero.name;

            // Update document title with hero name
            document.title = `${config.hero.name} Build Panel`;
        }

        // Update hero portrait if available
        const portraitElement = document.querySelector('.portrait-placeholder');

        if (portraitElement && config.hero.portraitPath) {
            // console.log("Setting portrait image to:", config.hero.portraitPath);

            // Remove the placeholder gradient
            portraitElement.style.background = "none";

            // Set image properties
            portraitElement.style.backgroundImage = `url(${config.hero.portraitPath})`;
            portraitElement.style.backgroundSize = 'cover';
            portraitElement.style.backgroundPosition = 'center center';
            portraitElement.style.border = "none";

            // Add a small delay to allow the browser to process the style changes
            setTimeout(() => {
                // Verify the image is loaded
                // console.log("Current background image:", portraitElement.style.backgroundImage);
            }, 100);

            // Log image loading with an actual Image object
            const img = new Image();
            img.onload = () => {
                // console.log("Portrait image loaded successfully:", config.hero.portraitPath);

                // Force a repaint
                portraitElement.style.opacity = "0.99";
                setTimeout(() => {
                    portraitElement.style.opacity = "1";
                }, 50);
            };
            img.onerror = (err) => {
                // console.error("Error loading portrait image:", err);
                // Fallback to a generic placeholder if image fails to load
                portraitElement.style.background = "linear-gradient(135deg, #ff4d8c, #ff8a5c)";
            };
            img.src = config.hero.portraitPath;
        } else {
            console.warn("Could not set portrait: ",
                portraitElement ? "Missing portraitPath" : "Missing portrait element",
                config.hero ? config.hero.portraitPath : "No hero data");
        }
    } else {
        // console.warn("Hero data not available for UI update");
    }
}

// Reset base stats - Sets life from hero config and zeroes out modifiers
function resetBaseStats() {
    // Make sure we apply hero data first if config is loaded
    // console.log("Hero life data from config:", config.hero); // Remove this line as it's no longer needed

    // Reset all modifier stats to 0 before potentially applying base hero stats
    stats.weaponPower = 0;
    stats.abilityPower = 0;
    stats.attackSpeed = 0;
    stats.cooldownReduction = 0;
    stats.maxAmmo = 0;
    stats.weaponLifesteal = 0;
    stats.abilityLifesteal = 0;
    stats.moveSpeed = 0;
    stats.reloadSpeed = 0;
    stats.meleeDamage = 0;
    stats.criticalDamage = 0;

    // Reload hero base life data from config
    if (config && config.hero) {
        stats.life = {
            health: config.hero.health || 0,
            armor: config.hero.armor || 0,
            shield: config.hero.shield || 0
        };
    }
}

// Calculate current stats based on hero, equipped items, and powers for the current round
function calculateCurrentStats() {
    // 1. Reset stats to base hero values
    resetBaseStats();

    // 2. Apply stats from equipped items for the current round
    const heroBuild = getCurrentHeroBuild();
    const currentRoundItems = heroBuild.equippedItemsByRound[currentRound] || [];

    currentRoundItems.forEach(itemRef => {
        const itemData = findItemById(itemRef.id);
        if (itemData) {
            applyItemStatsModification(itemData, true); // Apply stats (add=true)
        } else {
            console.warn(`Data not found for equipped item ID: ${itemRef.id} in calculateCurrentStats`);
        }
    });

    // 3. Apply stats from equipped powers (if any)
    // NOTE: Power cards don't have stats yet. This code will be enabled when stats are added to powers.
    // When implementing, remember to handle both object and array formats of equippedPowers:
    /*
    if (heroBuild.equippedPowers) {
        // If equippedPowers is still an object with round keys
        if (!Array.isArray(heroBuild.equippedPowers)) {
            // Process each power in the object format
            Object.entries(heroBuild.equippedPowers).forEach(([round, power]) => {
                if (power) {
                    const powerData = findPowerById(power.id);
                    if (powerData && powerData.stats) {
                        applyItemStatsModification(powerData, true);
                    }
                }
            });
        } else {
            // If already converted to array, process normally
            heroBuild.equippedPowers.forEach(power => {
                const powerData = findPowerById(power.id);
                if (powerData && powerData.stats) {
                    applyItemStatsModification(powerData, true);
                }
            });
        }
    }
    */

    // console.log("Calculated Stats:", JSON.parse(JSON.stringify(stats))); // Deep copy for logging
}

// Initialize round selector
function initRoundSelector() {
    const roundTabs = document.querySelectorAll('.round-tab:not(.copy-button)');

    // Set the initial active round
    roundTabs.forEach(tab => {
        const round = parseInt(tab.getAttribute('data-round'));

        if (round === currentRound) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }

        // Add click event listener
        tab.addEventListener('click', function () {
            // Set the current round
            currentRound = round;

            // Update active tab
            roundTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Update the UI based on the new round state
            updateUI(); // Call the central UI update function
        });
    });

    // Initialize the copy to next round button
    initCopyToNextRoundButton();
}

// Initialize the copy to next round button
function initCopyToNextRoundButton() {
    const copyButton = document.getElementById('copy-next-round');
    if (!copyButton) return;

    copyButton.addEventListener('click', function () {
        // Get the current round from the global state
        const roundNow = currentRound;

        // Check if we're already at the last round
        if (roundNow >= 7) {
            showMessage("Already at the last round!");
            return;
        }

        // --- State Update ---
        const nextRound = roundNow + 1;
        const heroBuild = getCurrentHeroBuild();
        // Deep copy items from current round to next round
        heroBuild.equippedItemsByRound[nextRound] = JSON.parse(JSON.stringify(heroBuild.equippedItemsByRound[roundNow] || []));
        // Powers are not copied round-to-round

        // Update the current round state
        currentRound = nextRound;

        // --- UI Update ---
        // Update the active round tab styling
        const roundTabs = document.querySelectorAll('.round-tab:not(.copy-button)');
        roundTabs.forEach(tab => {
            const round = parseInt(tab.getAttribute('data-round'));
            if (round === nextRound) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update the entire UI for the new round
        updateUI();

        // Show a confirmation message
        showMessage(`Copied items from Round ${roundNow} to Round ${nextRound}!`);
    });
}

// Update the UI based on the current round
function updateRoundDisplay() {
    // Get all power slots
    const powerSlots = document.querySelectorAll('.power-slots .power-slot');

    // First, remove all special classes from all slots
    powerSlots.forEach(slot => {
        slot.classList.remove('active-round');
        slot.classList.remove('between-rounds');
        slot.classList.remove('current-round');
        slot.classList.remove('unlocked');
    });

    // Determine which rounds are unlocked based on current round
    for (let i = 0; i < powerSlots.length; i++) {
        const roundNumber = ROUND_SLOTS[i];
        if (currentRound >= roundNumber) {
            powerSlots[i].classList.add('unlocked');
        }
    }

    // Determine the currently active round slot index, but only for rounds that can select powers
    let activeSlotIndex = -1;
    // For rounds 1, 3, 5, 7, set the active slot index based on the round
    if (currentRound % 2 === 1) { // Odd rounds
        activeSlotIndex = ROUND_TO_SLOT_MAP[currentRound];
    } else {
        // Even rounds (2, 4, 6) don't have power selection
        activeSlotIndex = -1;
    }

    // Highlight only the active slot for the current round
    if (activeSlotIndex >= 0 && activeSlotIndex < powerSlots.length) {
        powerSlots[activeSlotIndex].classList.add('active-round');
        powerSlots[activeSlotIndex].classList.add('current-round');
    }
}

// Function to switch to a different hero
async function switchHero(heroId) {
    // Skip if already selected
    const selectedHero = document.querySelector(`.hero-icon[data-hero="${heroId}"]`);
    if (!selectedHero || selectedHero.classList.contains('active')) {
        return;
    }

    // Update current hero in global state
    setCurrentHero(heroId);

    // Get all hero icons
    const heroIcons = document.querySelectorAll('.hero-icon');

    // Show loading state
    document.body.style.cursor = 'wait';
    selectedHero.style.opacity = '0.5';

    try {
        // Remove active class from all icons
        heroIcons.forEach(icon => icon.classList.remove('active'));

        // Add active class to clicked icon
        selectedHero.classList.add('active');

        // Try to load the new hero data
        const heroLoadSuccess = await loadHero(heroId);

        if (!heroLoadSuccess) {
            throw new Error(`Could not load hero data for ${getHeroName(heroId)}`);
        }

        try {
            // Update the entire UI for the current hero state
            updateUI(); // This will call all the necessary UI updates
        } catch (updateError) {
            console.error('Error updating UI:', updateError);
            showMessage('Failed to update UI for the new hero state', 'error');
        }

        // Reset cursor
        document.body.style.cursor = 'default';
        selectedHero.style.opacity = '1';

        // Show success message
        showMessage(`Switched to ${getHeroName(heroId)}`);
    } catch (error) {
        console.error('Error switching hero:', error);
        document.body.style.cursor = 'default';
        selectedHero.style.opacity = '1';

        // Reset active state
        const currentHero = document.querySelector(`.hero-icon[data-hero="${currentHero}"]`);
        if (currentHero) {
            currentHero.classList.add('active');
        }

        // No need to revert in localStorage since we're using global state

        // Show error message
        showMessage(`Error switching to ${getHeroName(heroId)}: ${error.message}`, 'error');
    }
}

// Function to reset current hero build
function resetCurrentHeroBuild() {
    const heroId = currentHero;

    // Reset hero state in the state manager
    resetHeroBuild(heroId); // Resets the build data in the 'builds' object

    // Update UI based on reset state
    updateUI(); // Single call to refresh the entire UI

    showMessage('Current hero build reset to defaults');
}


// Tab switching functionality
function initTabs() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Get the tab name
            const tabName = this.getAttribute('data-tab');

            // Hide all tab panes
            const tabPanes = document.querySelectorAll('.tab-pane');
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Show the selected tab pane
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Populate items from config
function populateItems() {
    const heroBuild = getCurrentHeroBuild();
    // Check if we have valid items data
    if (!config || !config.items) {
        console.warn('No items data available to populate');
        return;
    }

    // For each tab (weapon, ability, survival)
    ['weapon', 'ability', 'survival'].forEach(tabName => {
        // Skip if this category doesn't exist in config
        if (!config.items[tabName]) {
            console.warn(`No ${tabName} items found in config`);
            return;
        }

        // For each rarity (common, rare, epic)
        ['common', 'rare', 'epic'].forEach(rarity => {
            // Skip if this rarity doesn't exist for this category
            if (!config.items[tabName][rarity] || !Array.isArray(config.items[tabName][rarity])) {
                console.warn(`No ${rarity} ${tabName} items found in config`);
                return;
            }

            const items = config.items[tabName][rarity];
            const container = document.querySelector(`#${tabName}-tab .item-column:nth-child(${getRarityIndex(rarity)}) .items`);

            // Skip if container not found
            if (!container) {
                console.warn(`Container for ${tabName}-${rarity} items not found`);
                return;
            }

            // Clear existing items
            container.innerHTML = '';

            // Skip if no items
            if (items.length === 0) {
                const emptyNotice = document.createElement('div');
                emptyNotice.className = 'empty-items-notice';
                emptyNotice.textContent = `No ${rarity} ${tabName} items available`;
                container.appendChild(emptyNotice);
                return;
            }

            // Group items into rows of 3
            for (let i = 0; i < items.length; i += 3) {
                const row = document.createElement('div');
                row.className = 'item-row';

                // Add up to 3 items per row
                for (let j = 0; j < 3; j++) {
                    if (i + j < items.length) {
                        const item = items[i + j];

                        // Skip invalid item data
                        if (!item) continue;

                        const itemIndex = i + j;
                        item.id = `${tabName}-${rarity}-${itemIndex}`;
                        item.type = tabName;
                        item.rarity = rarity;

                        // Check if item is already owned/equipped in the current round's state
                        const currentRoundItems = heroBuild.equippedItemsByRound[currentRound] || [];
                        const isOwned = currentRoundItems.some(equippedItem => equippedItem.id === item.id);

                        // Pass the isOwned state to createItemElement
                        row.appendChild(createItemElement(item, rarity, isOwned));
                    } else {
                        // Add empty item if needed to fill the row
                        const emptyItem = document.createElement('div');
                        emptyItem.className = 'empty-item';
                        row.appendChild(emptyItem);
                    }
                }

                container.appendChild(row);
            }
        });
    });
}

// Helper function to get rarity index
function getRarityIndex(rarity) {
    switch (rarity) {
        case 'common': return 1;
        case 'rare': return 2;
        case 'epic': return 3;
        default: return 1;
    }
}

// Create item element
function createItemElement(item, rarity, isOwned = false) {
    const itemElement = document.createElement('div');
    itemElement.className = `item ${getRarityClass(rarity)}`;
    itemElement.dataset.itemId = item.id;

    // Set owned state based on the passed parameter
    if (isOwned) {
        itemElement.classList.add('owned');
    }

    const iconElement = document.createElement('div');
    iconElement.className = 'item-icon';

    // Set background image if iconPath is provided
    if (item.iconPath) {
        iconElement.style.backgroundImage = `url(${item.iconPath})`;
        // If we have an icon, make the background more transparent
        iconElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }

    const costElement = document.createElement('div');
    costElement.className = 'item-cost';

    // Set cost text based on the passed owned state
    if (isOwned) {
        costElement.textContent = 'Owned';
    } else {
        const gemIcon = document.createElement('i');
        gemIcon.className = 'currency-icon';

        costElement.appendChild(gemIcon);
        costElement.appendChild(document.createTextNode(`${item.cost.toLocaleString()}`));
    }

    itemElement.appendChild(iconElement);
    itemElement.appendChild(costElement);

    // Make items clickable
    itemElement.addEventListener('click', function () {
        const itemId = this.dataset.itemId;

        // No direct DOM manipulation here, just call the state update functions
        if (this.classList.contains('owned')) {
            // Item is currently owned (based on class), call unequip
            unequipItem(itemId);
        } else {
            // Try to purchase and equip the item
            purchaseAndEquipItem(itemId);
        }
    });

    // Add tooltip functionality
    itemElement.addEventListener('mouseenter', (event) => {
        // Show the tooltip
        const itemData = findItemById(item.id); // Get full item data for tooltip
        if (itemData) showTooltip(itemData, event);

        // Explicitly check if the item is owned by checking the DOM element class
        const isCurrentlyOwned = itemElement.classList.contains('owned');
        console.log('Item hover:', item.id, 'Initial isOwned:', isOwned, 'DOM check:', isCurrentlyOwned);

        // Highlight the appropriate slot based on whether the item is owned
        if (itemData) highlightTargetSlot(itemData, isCurrentlyOwned);
    });

    itemElement.addEventListener('mouseleave', () => {
        // Hide the tooltip
        hideTooltip();

        // Remove highlighting
        removeSlotHighlight();
    });

    return itemElement;
}

// Find item by id
function findItemById(itemId) {
    const [type, rarity, index] = itemId.split('-');
    return config.items[type][rarity][parseInt(index)];
}

// Purchase and equip an item
function purchaseAndEquipItem(itemId) {
    const heroBuild = getCurrentHeroBuild();
    const itemData = findItemById(itemId);

    // --- Validation ---
    if (!itemData) {
        showMessage('Item data not found', 'error');
        return;
    }

    // Check if we have enough currency in simulation mode
    if (isEconomyModeSimulation()) {
        // Get current budget for this round
        const currentBudget = getCurrentRoundBudget();

        // Calculate current cost of all items in this round
        const currentCost = calculateRoundBuildCost(currentRound);

        // Calculate remaining cash
        const currentCash = currentBudget - currentCost;

        // Strict check: Prevent purchase if cash is insufficient
        if (currentCash < itemData.cost) {
            showMessage(`Insufficient funds! Need ${itemData.cost.toLocaleString()}, have ${currentCash.toLocaleString()}`, 'error');
            return;
        }
    }

    // Check if we have room for more items
    if ((heroBuild.equippedItemsByRound[currentRound] || []).length >= MAX_ITEMS) { // Ensure array exists
        showMessage('Item slots full! Unequip an item first.', 'error');
        return;
    }

    // --- State Update ---

    // Deduct cost in simulation mode
    if (isEconomyModeSimulation()) {
        // Ensure cash for the round exists before decrementing
        if (heroBuild.cashByRound[currentRound] === undefined) {
            heroBuild.cashByRound[currentRound] = getCurrentRoundBudget() - calculateRoundBuildCost(currentRound);
        }
        heroBuild.cashByRound[currentRound] -= itemData.cost;
    }

    // Ensure the equipped items array exists for the current round
    if (!heroBuild.equippedItemsByRound[currentRound]) {
        heroBuild.equippedItemsByRound[currentRound] = [];
    }

    // Add to equipped items state
    heroBuild.equippedItemsByRound[currentRound].push({
        id: itemId,
        type: itemData.type,
        rarity: itemData.rarity,
        cost: itemData.cost
    });

    // Update stats for the newly equipped item
    applyItemStatsModification(itemData, true);

    // --- UI Update ---
    updateUI(); // Refresh the entire UI to reflect the state change

    showMessage(`${itemData.name} purchased!`, 'success');
}

// Unequip an item
function unequipItem(itemId) {
    const heroBuild = getCurrentHeroBuild();
    const itemData = findItemById(itemId);

    if (!itemData) {
        console.error("Item data not found for unequip:", itemId);
        showMessage('Error: Item data not found.', 'error');
        return;
    }

    // Remove from equipped items
    const initialLength = (heroBuild.equippedItemsByRound[currentRound] || []).length;
    heroBuild.equippedItemsByRound[currentRound] = heroBuild.equippedItemsByRound[currentRound].filter(item => item.id !== itemId);
    const itemRemoved = (heroBuild.equippedItemsByRound[currentRound] || []).length < initialLength;

    // Refund cost in simulation mode
    if (itemRemoved && isEconomyModeSimulation()) {
        // Ensure cash for the round exists before incrementing
        if (heroBuild.cashByRound[currentRound] === undefined) {
            heroBuild.cashByRound[currentRound] = getCurrentRoundBudget(); // Initialize with budget if missing
        }
        heroBuild.cashByRound[currentRound] += itemData.cost;
    }

    // Update stats for the unequipped item
    if (itemRemoved) {
        applyItemStatsModification(itemData, false);
    } else {
        console.warn("Attempted to unequip item not found in state:", itemId);
    }

    // --- UI Update ---
    updateUI(); // Refresh the entire UI to reflect the state change

    if (itemRemoved) {
        showMessage(`${itemData.name} unequipped!`);
    }
}

// Update the build display in the left panel
function updateBuildDisplay() {
    const heroBuild = getCurrentHeroBuild();
    const itemSlots = document.querySelectorAll('.item-slots .item-slot');

    console.log(`Updating build display for round ${currentRound}`);
    console.log('Current round items:', heroBuild.equippedItemsByRound[currentRound]);

    // Clear all item slots first
    itemSlots.forEach(slot => {
        slot.innerHTML = '<div class="empty-slot"></div>';
    });

    // Get items for the current round
    const currentRoundItems = heroBuild.equippedItemsByRound[currentRound] || [];

    // Add equipped items to slots
    currentRoundItems.forEach((item, index) => {
        if (index < itemSlots.length) {
            const slot = itemSlots[index];
            // Make sure to clear the slot before adding content
            slot.innerHTML = '';

            const itemElement = document.createElement('div');
            itemElement.className = `item ${getRarityClass(item.rarity)}`;

            // Get the full item data to get the iconPath
            const fullItem = findItemById(item.id);

            const iconElement = document.createElement('div');
            iconElement.className = 'item-icon';

            if (fullItem && fullItem.iconPath) {
                iconElement.style.backgroundImage = `url(${fullItem.iconPath})`;
                iconElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }

            itemElement.appendChild(iconElement);
            slot.appendChild(itemElement);

            // Add click handler to unequip
            itemElement.addEventListener('click', function () {
                // Call the unequip function which handles state and UI update
                unequipItem(item.id);
            });

            // Add tooltip and original item highlight functionality
            itemElement.addEventListener('mouseenter', (event) => {
                showTooltip(fullItem, event);
                highlightOriginalItem(item.id);
            });
            itemElement.addEventListener('mouseleave', () => {
                hideTooltip();
                removeOriginalItemHighlight();
            });
        }
    });
}

// Helper function to get rarity class
function getRarityClass(rarity) {
    switch (rarity) {
        case 'common': return 'common-item';
        case 'rare': return 'rare-item';
        case 'epic': return 'epic-item';
        default: return 'common-item';
    }
}

// Show temporary message
function showMessage(text, type = 'info') {
    // Get or create message container
    let messageContainer = document.querySelector('.message-container');
    
    // If container doesn't exist, create it
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        document.body.appendChild(messageContainer);
    }

    // Clear existing messages
    const existingMessages = messageContainer.querySelectorAll('.message');
    existingMessages.forEach(msg => {
        messageContainer.removeChild(msg);
    });

    // Create new message element
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;

    // No need for inline styling - all styling is now in CSS

    // Add to container
    messageContainer.appendChild(message);
    
    // Add show class to make it visible
    requestAnimationFrame(() => {
        message.classList.add('show');
    });

    // Auto-remove after 3 seconds
    setTimeout(() => {
        // First remove the show class to animate out
        message.classList.remove('show');
        
        // Then remove from DOM after animation completes
        setTimeout(() => {
            if (messageContainer.contains(message)) {
                messageContainer.removeChild(message);
            }
        }, 300); // Match the CSS transition time
    }, 3000);
}

// Populate powers for the current hero
function populatePowers() {
    const heroBuild = getCurrentHeroBuild();
    const powerGrid = document.querySelector('#power-tab .power-grid');

    // Check if we have valid power grid and powers data
    if (!powerGrid || !config || !config.powers || !Array.isArray(config.powers)) {
        console.warn('Cannot populate powers: missing power grid or powers data');
        return;
    }

    // Clear existing powers
    powerGrid.innerHTML = '';

    // If no powers available, show message
    if (config.powers.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-powers-message';
        emptyMessage.textContent = 'No powers available for this hero';
        powerGrid.appendChild(emptyMessage);
        return;
    }

    // Determine round for current power
    const assignedRound = getAssignedRound(currentRound);

    // Check if a power is already equipped for this round
    // Convert equippedPowers to array if it's still an object
    if (!Array.isArray(heroBuild.equippedPowers)) {
        // Initialize as array from object entries
        const equippedPowersArray = [];
        // If it's an object with round keys (1, 3, 5, 7)
        if (heroBuild.equippedPowers && typeof heroBuild.equippedPowers === 'object') {
            Object.entries(heroBuild.equippedPowers).forEach(([round, power]) => {
                if (power) {
                    // Add the round property to the power object
                    power.round = parseInt(round);
                    equippedPowersArray.push(power);
                }
            });
        }
        heroBuild.equippedPowers = equippedPowersArray;
    }

    const isRoundPowerEquipped = heroBuild.equippedPowers.some(power => power.round === assignedRound);

    // Create rows of 4 powers
    for (let i = 0; i < config.powers.length; i += 4) {
        const row = document.createElement('div');
        row.className = 'power-row';

        // Add up to 4 powers per row
        for (let j = 0; j < 4; j++) {
            if (i + j < config.powers.length) {
                const power = config.powers[i + j];

                // Skip invalid power data
                if (!power || !power.title) {
                    console.warn('Invalid power data', power);
                    continue;
                }

                power.id = `power-${i + j}`;

                // Use hero's powerIcon if available, otherwise use default
                if (!power.iconPath) {
                    if (config.hero && config.hero.powerIcon) {
                        power.iconPath = config.hero.powerIcon;
                    } else {
                        power.iconPath = 'res/items/shared/power_default.png';
                    }
                }

                // Check if power is already equipped
                const isEquipped = heroBuild &&
                    heroBuild.equippedPowers &&
                    heroBuild.equippedPowers.some(equippedPower =>
                        equippedPower.id === power.id);

                // Create the power element and add it to the row
                const powerElement = createPowerElement(power, isEquipped);

                // If we're in a disabled round and the power is not equipped, add a disabled class
                if (isDisabledRound() && !isEquipped) {
                    powerElement.classList.add('disabled');
                    powerElement.title = "Powers can only be selected in rounds 1, 3, 5, and 7";
                }
                // If we're in a round where a power is already equipped, disable other powers
                else if (!isDisabledRound() && isRoundPowerEquipped && !isEquipped) {
                    powerElement.classList.add('disabled');
                    powerElement.title = "You've already equipped a power for this round";
                }

                row.appendChild(powerElement);
            } else {
                // Add empty placeholder to maintain grid
                const emptyPower = document.createElement('div');
                emptyPower.className = 'power-card empty';
                row.appendChild(emptyPower);
            }
        }

        powerGrid.appendChild(row);
    }
}

// Create power element
function createPowerElement(power, isEquipped = false) {
    const powerCard = document.createElement('div');
    powerCard.className = 'power-card';
    powerCard.dataset.powerId = power.id;

    if (isEquipped) {
        powerCard.classList.add('equipped');
    }

    const powerHeader = document.createElement('div');
    powerHeader.className = 'power-header';

    // Use an img element for the icon
    const powerIconImg = document.createElement('img');
    powerIconImg.className = 'power-icon-img'; // Use a different class if needed for styling

    // Use hero-specific power icon path
    if (power.iconPath) {
        // Use the iconPath from the power object if available
        powerIconImg.src = power.iconPath;
    } else if (config.hero && config.hero.powerIcon) {
        // Fall back to hero's default power icon
        powerIconImg.src = config.hero.powerIcon;
    } else {
        // Last resort fallback
        powerIconImg.src = 'res/items/shared/power_default.png';
    }

    powerIconImg.alt = power.title; // Use title for alt text
    powerIconImg.onerror = () => { // Fallback if the image fails to load
        if (config.hero && config.hero.powerIcon) {
            powerIconImg.src = config.hero.powerIcon;
        } else {
            powerIconImg.src = 'res/items/shared/power_default.png';
        }
    };

    const powerTitle = document.createElement('div');
    powerTitle.className = 'power-title';
    powerTitle.textContent = power.title;

    const powerDescription = document.createElement('div');
    powerDescription.className = 'power-description';
    powerDescription.textContent = power.description;

    powerHeader.appendChild(powerIconImg); // Append the img element
    powerHeader.appendChild(powerTitle);

    powerCard.appendChild(powerHeader);
    powerCard.appendChild(powerDescription);

    // Make powers clickable
    powerCard.addEventListener('click', function () {
        const powerId = this.dataset.powerId;

        if (this.classList.contains('equipped')) {
            // Power is already equipped, unequip it
            unequipPower(powerId, this);
        } else {
            // Try to equip the power
            equipPower(powerId, this);
        }
    });

    // Add hover events for highlighting
    powerCard.addEventListener('mouseenter', (event) => {
        highlightTargetPowerSlot(power, isEquipped);
    });

    powerCard.addEventListener('mouseleave', () => {
        removePowerSlotHighlight();
    });

    return powerCard;
}

// Find power by ID
function findPowerById(powerId) {
    if (!powerId || !config || !config.powers || !Array.isArray(config.powers)) {
        console.warn('Cannot find power by ID: missing data');
        return null;
    }

    try {
        const index = parseInt(powerId.split('-')[1]);
        if (isNaN(index) || index < 0 || index >= config.powers.length) {
            console.warn(`Invalid power index: ${index}`);
            return null;
        }
        return config.powers[index];
    } catch (error) {
        console.error('Error finding power by ID:', error);
        return null;
    }
}

// Update the power display in the power slots area
function updatePowerDisplay() {
    console.log("Updating power display");
    const heroBuild = getCurrentHeroBuild();

    // Clear all power slots first
    const powerSlots = document.querySelectorAll('.power-slots .power-slot');

    if (!powerSlots || powerSlots.length === 0) {
        console.warn('Power slots not found');
        return;
    }

    // First, remove all event listeners and reset all slots
    powerSlots.forEach(slot => {
        // Clone the slot to remove all event listeners
        const newSlot = slot.cloneNode(true);
        slot.parentNode.replaceChild(newSlot, slot);

        // Get the empty slot and power icon in the new slot
        const emptySlot = newSlot.querySelector('.empty-slot');
        const powerIcon = newSlot.querySelector('.power-icon');

        // Remove any existing power icon
        if (powerIcon) {
            powerIcon.remove();
        }

        // Show the empty slot
        if (emptySlot) {
            emptySlot.style.display = 'flex';
        } else {
            // If empty slot is missing, recreate it
            const newEmptySlot = document.createElement('div');
            newEmptySlot.className = 'empty-slot';

            // Insert before slot label
            const slotLabel = newSlot.querySelector('.slot-label');
            if (slotLabel) {
                newSlot.insertBefore(newEmptySlot, slotLabel);
            } else {
                newSlot.appendChild(newEmptySlot);
            }
        }

        // Also remove any power-specific styles from the slot itself
        newSlot.classList.remove('power-equipped');
    });

    // Check if we have valid build data
    if (!heroBuild || !heroBuild.equippedPowers || !Array.isArray(heroBuild.equippedPowers)) {
        console.warn('No equipped powers data available');
        return;
    }

    console.log("Equipped powers:", heroBuild.equippedPowers);

    // Get fresh slots after cloning
    const freshPowerSlots = document.querySelectorAll('.power-slots .power-slot');

    // Add equipped powers to slots
    heroBuild.equippedPowers.forEach(power => {
        if (!power || !power.id || !power.round) {
            console.warn('Invalid equipped power data', power);
            return;
        }

        const slotIndex = ROUND_SLOTS.indexOf(power.round);

        if (slotIndex !== -1 && slotIndex < freshPowerSlots.length) {
            const slot = freshPowerSlots[slotIndex];
            const emptySlot = slot.querySelector('.empty-slot');

            if (emptySlot) {
                // Hide the empty slot instead of removing it
                emptySlot.style.display = 'none';

                // Create a power icon for the slot
                const fullPower = findPowerById(power.id);

                if (fullPower) {
                    const powerIcon = document.createElement('div');
                    powerIcon.className = 'power-icon';
                    // Make sure we set the correct data attribute
                    powerIcon.setAttribute('data-power-id', power.id);
                    powerIcon.style.cursor = 'pointer'; // Make it look clickable

                    // Handle icon - use proper path hierarchy
                    if (fullPower.iconPath) {
                        // Use the power's specific icon path
                        powerIcon.style.backgroundImage = `url(${fullPower.iconPath})`;
                    } else if (config.hero && config.hero.powerIcon) {
                        // Fall back to hero's default power icon
                        powerIcon.style.backgroundImage = `url(${config.hero.powerIcon})`;
                    } else {
                        // Last resort fallback
                        powerIcon.style.backgroundImage = `url(res/items/shared/power_default.png)`;
                        // If no icon, use a subtle background color
                        powerIcon.style.backgroundColor = 'rgba(58, 90, 154, 0.8)';
                    }

                    // Add power info to title tooltip
                    powerIcon.title = fullPower.title + " (Click to unequip)";

                    // Add the power icon to the slot
                    slot.insertBefore(powerIcon, slot.querySelector('.slot-label'));

                    // Mark slot as having a power equipped
                    slot.classList.add('power-equipped');
                    slot.setAttribute('data-power-id', power.id);
                    slot.style.cursor = 'pointer';
                    slot.title = "Click to unequip " + fullPower.title;

                    // Make the entire slot clickable
                    slot.addEventListener('click', function (event) {
                        event.stopPropagation(); // Prevent event bubbling
                        const powerId = this.getAttribute('data-power-id');
                        if (powerId) {
                            console.log("%c POWER SLOT CLICKED: " + powerId, "color: red; font-size: 16px; font-weight: bold;");

                            // Show a message to confirm click was detected
                            showMessage(`Unequipping power: ${fullPower.title}`);

                            // Direct call to unequipPower with the power ID
                            unequipPower(powerId);

                            // Update display after unequipping
                            updatePowerDisplay();
                        }
                    });

                    // Add tooltip and highlight functionality (keep for hover effects)
                    powerIcon.addEventListener('mouseenter', (event) => {
                        event.stopPropagation(); // Prevent event bubbling to slot
                        highlightOriginalPower(power.id);
                    });

                    powerIcon.addEventListener('mouseleave', (event) => {
                        event.stopPropagation(); // Prevent event bubbling to slot
                        removeOriginalPowerHighlight();
                    });

                    // Also add special highlight effect to slot
                    slot.addEventListener('mouseenter', (event) => {
                        highlightOriginalPower(power.id);
                    });

                    slot.addEventListener('mouseleave', (event) => {
                        removeOriginalPowerHighlight();
                    });
                } else {
                    console.warn(`Power with ID ${power.id} not found in config`);
                }
            }
        }
    });

    // Update the power count
    const powerCount = document.querySelector('.build-count.power-count');
    if (powerCount) {
        powerCount.textContent = `${heroBuild.equippedPowers.length}/${MAX_POWERS}`;
    }

    // Make sure to reinitialize power hover effects
    setTimeout(initPowerHoverEffects, 0);
}

// Equip a power
function equipPower(powerId, powerElement) {
    // Get the current hero build
    const heroBuild = getCurrentHeroBuild();

    console.log("equipPower called with powerId:", powerId);
    console.log("Current hero build:", heroBuild);
    console.log("Current equipped powers:", heroBuild.equippedPowers);

    // Check if we're in a round that shouldn't allow power selection (2, 4, 6)
    if (isDisabledRound()) {
        showMessage('Powers can only be selected in rounds 1, 3, 5, and 7.', 'error');
        return;
    }

    // Check if we already have the max number of powers
    if (heroBuild.equippedPowers.length >= MAX_POWERS) {
        showMessage('You already have the maximum number of powers equipped.', 'error');
        return;
    }

    // Check if we already have a power for this round
    const assignedRound = getAssignedRound(currentRound);
    if (heroBuild.equippedPowers.some(p => p.round === assignedRound)) {
        showMessage(`You already have a power equipped for round ${assignedRound}.`, 'error');
        return;
    }

    // Find the power data
    const powerData = findPowerById(powerId);
    if (!powerData) {
        console.error('Power not found:', powerId);
        return;
    }

    console.log("Adding power to equipped powers:", powerData.title, "for round", assignedRound);

    // Add to equipped powers
    heroBuild.equippedPowers.push({
        id: powerId,
        round: assignedRound
    });

    console.log("Updated equipped powers:", heroBuild.equippedPowers);

    // Update UI
    if (powerElement) {
        powerElement.classList.add('equipped');
    }

    // Remove any slot highlighting that might be active
    removePowerSlotHighlight();

    // Update power display - this will handle all the UI updates
    updatePowerDisplay();

    // Show success message
    showMessage(`${powerData.title} equipped for round ${assignedRound}`);

    // Reinitialize power hover effects to ensure they work correctly
    initPowerHoverEffects();
}

// Unequip a power
function unequipPower(powerId, powerElement = null) { // powerElement is optional now
    console.log("UNEQUIP POWER called with powerId:", powerId);
    const heroBuild = getCurrentHeroBuild();

    // Find the power to unequip in the state
    const powerIndex = heroBuild.equippedPowers.findIndex(power => power.id === powerId);

    if (powerIndex !== -1) {
        // --- State Update ---
        heroBuild.equippedPowers.splice(powerIndex, 1); // Remove the power

        // --- UI Update ---
        // Update the entire UI based on the new state
        updateUI(); // This handles updating the power slots and power cards

        // Show success message
        const fullPower = findPowerById(powerId);
        if (fullPower) {
            showMessage(`Unequipped power: ${fullPower.title}`);
        }

    } else {
        console.error("Power not found in equipped powers:", powerId);
        showMessage("Power not found", "error");
    }
}

// Helper function to get the assigned round group for a given round
function getAssignedRound(round) {
    if (round <= 2) {
        return 1;
    } else if (round <= 4) {
        return 3;
    } else if (round <= 6) {
        return 5;
    } else {
        return 7;
    }
}

// Initialize reset button
function initResetButton() {
    const resetButton = document.getElementById('reset-button');
    const resetModal = document.getElementById('reset-modal');
    const cancelReset = document.getElementById('cancel-reset');
    const confirmReset = document.getElementById('confirm-reset');

    // Show the modal when reset button is clicked
    resetButton.addEventListener('click', function () {
        resetModal.classList.add('active');
    });

    // Hide the modal when cancel is clicked
    cancelReset.addEventListener('click', function () {
        resetModal.classList.remove('active');
    });

    // Handle reset confirmation
    confirmReset.addEventListener('click', function () {
        // Hide the modal
        resetModal.classList.remove('active');

        // Reset build data state for the current hero
        resetCurrentHeroBuild(); // Calls resetHeroBuild(currentHero) and then updateUI()

        // Show success message
        showMessage('All data has been reset to defaults'); // Message shown in resetCurrentHeroBuild
    });

    // Close modal when clicking outside
    resetModal.addEventListener('click', function (e) {
        if (e.target === resetModal) {
            resetModal.classList.remove('active');
        }
    });

    // Close modal with ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && resetModal.classList.contains('active')) {
            resetModal.classList.remove('active');
        }
    });
}

// Update all stats displays
// This function does not calculate the stats, it just displays the stats object
function updateStatsDisplay() {
    console.log("updateStatsDisplay - Life data:", stats.life);

    // Calculate total life (health + armor + shield)
    const health = stats.life.health || 0;
    const armor = stats.life.armor || 0;
    const shield = stats.life.shield || 0;
    const totalLife = health + armor + shield;

    console.log("Displaying life values - Health:", health, "Armor:", armor, "Shield:", shield, "Total:", totalLife);

    // Update the life value in the header
    const lifeValue = document.querySelector('.total-life-value');
    if (lifeValue) {
        lifeValue.textContent = totalLife.toLocaleString(); // Format number
    }

    // Get the progress track element for the life bar
    const lifeTrack = document.querySelector('.total-life-track');
    // Clear existing segments
    lifeTrack.innerHTML = '';

    // Render the life bar using the helper function
    if (lifeTrack) {
        renderLifeBar(health, armor, shield, lifeTrack);
    }

    // Ensure the life bar wrapper has the dummy div for spacing
    const lifeBarWrapper = lifeTrack ? lifeTrack.closest('.stat-bar-wrapper') : null;
    if (lifeBarWrapper && !lifeBarWrapper.querySelector('.stat-icon-space')) {
        const dummySpace = document.createElement('div');
        dummySpace.className = 'stat-icon-space';
        lifeBarWrapper.insertBefore(dummySpace, lifeTrack);
    }

    // Update individual modifier stat bars
    updateStatBar('weapon-power', stats.weaponPower || 0);
    updateStatBar('ability-power', stats.abilityPower || 0);
    updateStatBar('attack-speed', stats.attackSpeed || 0);
    updateStatBar('cooldown-reduction', stats.cooldownReduction || 0);
    updateStatBar('max-ammo', stats.maxAmmo || 0);
    updateStatBar('weapon-lifesteal', stats.weaponLifesteal || 0);
    updateStatBar('ability-lifesteal', stats.abilityLifesteal || 0);
    updateStatBar('move-speed', stats.moveSpeed || 0);
    updateStatBar('reload-speed', stats.reloadSpeed || 0);
    updateStatBar('melee-damage', stats.meleeDamage || 0);
    updateStatBar('critical-damage', stats.criticalDamage || 0);
}

// Helper function to render the segmented life bar
function renderLifeBar(health, armor, shield, trackElement) {
    trackElement.innerHTML = ''; // Clear existing segments

    const totalLife = health + armor + shield;
    if (totalLife <= 0) return; // Nothing to render

    // Constants for rendering
    const lifePerSegment = 25;
    const minSegmentsToShow = 10; // Minimum visual width

    // Calculate the number of segments needed
    const actualSegments = Math.ceil(totalLife / lifePerSegment);
    const totalSegmentsToRender = Math.max(minSegmentsToShow, actualSegments);

    let remainingHealth = health;
    let remainingArmor = armor;
    let remainingShield = shield;

    for (let i = 0; i < totalSegmentsToRender; i++) {
        const segment = document.createElement('div');
        segment.className = 'stat-segment';

        const segmentStartLife = i * lifePerSegment;
        const segmentEndLife = (i + 1) * lifePerSegment;

        let currentFill = 0; // How much of the current segment is filled (0 to lifePerSegment)

        // Fill with Health
        if (remainingHealth > 0) {
            const healthStart = health - remainingHealth;
            const healthEnd = health;
            const overlapStart = Math.max(segmentStartLife, healthStart);
            const overlapEnd = Math.min(segmentEndLife, healthEnd);
            const healthInSegment = Math.max(0, overlapEnd - overlapStart);

            if (healthInSegment > 0) {
                const fillDiv = document.createElement('div');
                fillDiv.className = 'segment-fill health';
                fillDiv.style.left = `${(currentFill / lifePerSegment) * 100}%`;
                fillDiv.style.width = `${(healthInSegment / lifePerSegment) * 100}%`;
                segment.appendChild(fillDiv);
                currentFill += healthInSegment;
                remainingHealth -= healthInSegment; // Track remaining health accurately
            }
        }

        // Fill with Armor
        if (remainingArmor > 0 && currentFill < lifePerSegment) {
            const armorStart = health + armor - remainingArmor; // Start point of armor relative to total life
            const armorEnd = health + armor;
            const overlapStart = Math.max(segmentStartLife, armorStart);
            const overlapEnd = Math.min(segmentEndLife, armorEnd);
            const armorInSegment = Math.max(0, overlapEnd - overlapStart);

            if (armorInSegment > 0) {
                const fillDiv = document.createElement('div');
                fillDiv.className = 'segment-fill armor';
                fillDiv.style.left = `${(currentFill / lifePerSegment) * 100}%`;
                fillDiv.style.width = `${(armorInSegment / lifePerSegment) * 100}%`;
                segment.appendChild(fillDiv);
                currentFill += armorInSegment;
                remainingArmor -= armorInSegment;
            }
        }

        // Fill with Shield
        if (remainingShield > 0 && currentFill < lifePerSegment) {
            const shieldStart = health + armor + shield - remainingShield; // Start point of shield
            const shieldEnd = health + armor + shield;
            const overlapStart = Math.max(segmentStartLife, shieldStart);
            const overlapEnd = Math.min(segmentEndLife, shieldEnd);
            const shieldInSegment = Math.max(0, overlapEnd - overlapStart);

            if (shieldInSegment > 0) {
                const fillDiv = document.createElement('div');
                fillDiv.className = 'segment-fill shield';
                fillDiv.style.left = `${(currentFill / lifePerSegment) * 100}%`;
                fillDiv.style.width = `${(shieldInSegment / lifePerSegment) * 100}%`;
                segment.appendChild(fillDiv);
                currentFill += shieldInSegment;
                remainingShield -= shieldInSegment;
            }
        }

        // If segment is empty after filling (i.e., beyond total life), mark it
        if (currentFill === 0 && segmentStartLife >= totalLife) {
            segment.classList.add('empty');
        } else if (currentFill < lifePerSegment && segmentEndLife > totalLife) {
            // Partially filled segment at the end - style appropriately if needed
            //segment.classList.add('partially-empty'); // Optional class
        }

        trackElement.appendChild(segment);
    }
}

function updateStatBar(statId, value) {
    // Find the stat group using the data-stat-id attribute
    const statGroup = document.querySelector(`.stat-group[data-stat-id='${statId}']`);

    if (!statGroup) {
        // console.warn(`Stat group not found for ID: ${statId}`);
        return;
    }

    // Get the track and value elements within this specific group
    const statTrack = statGroup.querySelector('.stat-track');
    const statValue = statGroup.querySelector('.stat-value');

    if (!statTrack || !statValue) {
        console.warn(`Missing track or value element in stat group: ${statId}`);
        return;
    }

    // Calculate percentage (maximum value is 100 for all stats except critical damage which is 200)
    let maxValue = 100;
    if (statId === 'critical-damage') {
        maxValue = 200;
    }

    // Clear existing content
    statTrack.innerHTML = '';

    // Create a simple fill bar for regular stats
    const fillBar = document.createElement('div');
    fillBar.className = 'stat-fill';

    // Set different colors based on the stat type
    if (statId === 'weapon-power' || statId === 'critical-damage' || statId === 'melee-damage') {
        fillBar.style.backgroundColor = '#ff5722';
    } else if (statId === 'ability-power' || statId === 'cooldown-reduction' || statId === 'max-ammo') {
        fillBar.style.backgroundColor = '#00bcd4';
    } else if (statId === 'attack-speed' || statId === 'weapon-lifesteal' || statId === 'ability-lifesteal') {
        fillBar.style.backgroundColor = '#ff9800';
    } else if (statId === 'move-speed' || statId === 'reload-speed') {
        fillBar.style.backgroundColor = '#4CAF50';
    }

    // Calculate percentage and set width - ensure it's at least visible when not 0
    const percentage = value === 0 ? 0 : Math.min(100, Math.max(1, (value / maxValue) * 100));
    fillBar.style.width = `${percentage}%`;

    // Add the fill bar to the track
    statTrack.appendChild(fillBar);

    // Make sure the stat-bar-wrapper has the dummy div for spacing
    const barWrapper = statTrack.closest('.stat-bar-wrapper');
    if (barWrapper) {
        // Check if we need to add the dummy space div
        if (!barWrapper.querySelector('.stat-icon-space')) {
            const dummySpace = document.createElement('div');
            dummySpace.className = 'stat-icon-space';

            // Insert it before the track
            barWrapper.insertBefore(dummySpace, statTrack);
        }
    }

    // Update the numeric value - show as percentage
    if (statId === 'life' || statId === 'total-life') {
        statValue.textContent = value.toLocaleString(); // Format number
    } else {
        statValue.textContent = value + '%';
    }
}

// Update item stats when purchased or sold - RENAME for clarity
function applyItemStatsModification(item, add = true) {
    if (!item || !item.stats) return;

    // Use the global stats object
    const currentStats = stats;

    // Iterate through each stat in the item and apply the modification
    for (const [stat, value] of Object.entries(item.stats)) {
        if (stat === 'health' || stat === 'armor' || stat === 'shield') {
            // Life stats are base values, not modifiers
            if (!currentStats.life[stat]) {
                currentStats.life[stat] = 0;
            }
            currentStats.life[stat] += value * (add ? 1 : -1);

            // Ensure we never go below 0
            if (currentStats.life[stat] < 0) {
                currentStats.life[stat] = 0;
            }
        } else {
            // All other stats are percentage modifiers
            if (currentStats[stat] === undefined) {
                currentStats[stat] = 0;
            }
            currentStats[stat] += value * (add ? 1 : -1);

            // Ensure we never go below 0
            if (currentStats[stat] < 0) {
                currentStats[stat] = 0;
            }
        }
    }

    // Update the display
    updateStatsDisplay();
}

// Function to format stat values with % sign for percentage stats
function formatStatValue(stat, value) {
    // Stats that should be displayed with percentage sign
    const percentageStats = ['weaponPower', 'reloadSpeed', 'criticalDamage',
        'attackSpeed', 'abilityPower', 'cooldownReduction',
        'moveSpeed', 'weaponLifesteal'];

    if (percentageStats.includes(stat)) {
        return `${value}%`;
    }
    return value;
}

// Function to get readable stat name
function getReadableStatName(stat) {
    const statNames = {
        'weaponPower': 'Weapon Power',
        'reloadSpeed': 'Reload Speed',
        'criticalDamage': 'Critical Damage',
        'attackSpeed': 'Attack Speed',
        'maxAmmo': 'Maximum Ammo',
        'abilityPower': 'Ability Power',
        'cooldownReduction': 'Cooldown Reduction',
        'health': 'Health',
        'armor': 'Armor',
        'shield': 'Shield',
        'moveSpeed': 'Movement Speed',
        'weaponLifesteal': 'Weapon Lifesteal'
    };

    return statNames[stat] || stat;
}

// Function to show tooltip
function showTooltip(item, event) {
    if (!item) return;

    // Set hovering flag
    isHoveringItem = true;

    // Create tooltip content
    let tooltipContent = `
        <div class="tooltip-header">${item.name}</div>
    `;

    // Add stats if they exist
    if (item.stats) {
        tooltipContent += '<div class="tooltip-stats">';
        for (const stat in item.stats) {
            tooltipContent += `<div class="tooltip-stat">
                <span class="stat-name">${getReadableStatName(stat)}:</span> 
                <span class="stat-value">${formatStatValue(stat, item.stats[stat])}</span>
            </div>`;
        }
        tooltipContent += '</div>';
    }

    // Add cost
    tooltipContent += `<div class="tooltip-cost"> <span>${item.cost.toLocaleString()}</span></div>`;

    // Update tooltip content and display it
    tooltip.innerHTML = tooltipContent;
    tooltip.style.display = 'block';

    // Get element position and dimensions
    const itemRect = event.currentTarget.getBoundingClientRect();

    // Position tooltip centered beneath the item
    tooltip.style.left = `${window.pageXOffset + itemRect.left + (itemRect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    tooltip.style.top = `${window.pageYOffset + itemRect.bottom + 10}px`; // 10px below the item

    // Reposition if tooltip goes off-screen
    setTimeout(() => { // Use setTimeout to calculate after the tooltip is rendered
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Prevent tooltip from going off the right edge
        if (tooltipRect.right > viewportWidth) {
            tooltip.style.left = `${window.pageXOffset + viewportWidth - tooltipRect.width - 10}px`;
        }

        // Prevent tooltip from going off the left edge
        if (tooltipRect.left < 10) {
            tooltip.style.left = `${window.pageXOffset + 10}px`;
        }

        // If tooltip would go off the bottom of the screen, position it above the item instead
        if (tooltipRect.bottom > viewportHeight) {
            tooltip.style.top = `${window.pageYOffset + itemRect.top - tooltipRect.height - 10}px`;
        }
    }, 0);
}

// Function to hide tooltip
function hideTooltip() {
    // Clear hovering flag
    isHoveringItem = false;

    // Delay hiding the tooltip slightly to make it more stable
    setTimeout(() => {
        // Only hide if we're still not hovering an item
        if (!isHoveringItem) {
            tooltip.style.display = 'none';
        }
    }, 100);
}

// Function to update the item slot with event listeners for tooltip
function updateItemSlot(slot, item) {
    slot.innerHTML = '';
    slot.classList.remove('common-item', 'rare-item', 'epic-item', 'empty-slot');
    slot.classList.add('empty-slot');

    if (item) {
        const itemImage = document.createElement('div');
        itemImage.classList.add('item-image');

        // Set background image if iconPath is provided
        if (item.iconPath) {
            itemImage.style.backgroundImage = `url(${item.iconPath})`;
            // Make the background more transparent when an icon is present
            itemImage.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }

        slot.appendChild(itemImage);
        slot.classList.remove('empty-slot');

        // Add class based on item rarity
        if (item.cost >= 9000) {
            slot.classList.add('epic-item');
        } else if (item.cost >= 3500) {
            slot.classList.add('rare-item');
        } else {
            slot.classList.add('common-item');
        }

        // Add event listeners for tooltip
        slot.addEventListener('mouseenter', (event) => showTooltip(item, event));
        slot.addEventListener('mouseleave', hideTooltip);
    }
}

// Update the loadItems function to use the new updateItemSlot function
function loadItems() {
    // Get the items from the config
    const weaponItems = [
        ...config.items.weapon.common,
        ...config.items.weapon.rare,
        ...config.items.weapon.epic
    ];
    const abilityItems = [
        ...config.items.ability.common,
        ...config.items.ability.rare,
        ...config.items.ability.epic
    ];
    const survivalItems = [
        ...config.items.survival.common,
        ...config.items.survival.rare,
        ...config.items.survival.epic
    ];

    // Update weapon slots
    const weaponSlots = document.querySelectorAll('.weapon-item');
    weaponSlots.forEach((slot, index) => {
        if (index < weaponItems.length) {
            updateItemSlot(slot, weaponItems[index]);
        }
    });

    // Update ability slots
    const abilitySlots = document.querySelectorAll('.ability-item');
    abilitySlots.forEach((slot, index) => {
        if (index < abilityItems.length) {
            updateItemSlot(slot, abilityItems[index]);
        }
    });

    // Update survival slots
    const survivalSlots = document.querySelectorAll('.survival-item');
    survivalSlots.forEach((slot, index) => {
        if (index < survivalItems.length) {
            updateItemSlot(slot, survivalItems[index]);
        }
    });
}

// Function to highlight the target slot where an item would be equipped
function highlightTargetSlot(item, isOwned = false) {
    const heroBuild = getCurrentHeroBuild();
    // Get all item slots and current round items
    const itemSlots = document.querySelectorAll('.item-slots .item-slot');
    const currentRoundItems = heroBuild.equippedItemsByRound[currentRound] || [];

    if (isOwned) {
        console.log('Highlighting owned item:', item.name);

        // For owned items, find by item name since that's the most reliable identifier
        let equippedItemIndex = -1;

        for (let i = 0; i < currentRoundItems.length; i++) {
            const equippedItem = currentRoundItems[i];
            const fullEquippedItem = findItemById(equippedItem.id);

            // Compare names since that's more reliable than ID which may change
            if (fullEquippedItem && fullEquippedItem.name === item.name) {
                equippedItemIndex = i;
                break;
            }
        }

        console.log('Found equipped item at index:', equippedItemIndex);

        if (equippedItemIndex !== -1 && equippedItemIndex < itemSlots.length) {
            // Highlight the slot where this item is currently equipped
            const targetSlot = itemSlots[equippedItemIndex];

            console.log('Target slot found:', targetSlot);

            // Add highlight class to the target slot
            targetSlot.classList.add('target-slot');

            // Add the rarity class to show the right color
            if (item.cost >= 9000) {
                targetSlot.classList.add('target-epic');
            } else if (item.cost >= 3500) {
                targetSlot.classList.add('target-rare');
            } else {
                targetSlot.classList.add('target-common');
            }
        } else {
            console.log('Could not find matching equipped item slot');
        }
    } else {
        // For items not yet owned, highlight the next available slot
        // Check if we have space for more items
        if (currentRoundItems.length >= MAX_ITEMS) {
            // No space, don't highlight anything
            return;
        }

        if (currentRoundItems.length < itemSlots.length) {
            const targetSlot = itemSlots[currentRoundItems.length];

            // Add highlight class to the target slot
            targetSlot.classList.add('target-slot');

            // Add the rarity class to show the right color
            if (item.cost >= 9000) {
                targetSlot.classList.add('target-epic');
            } else if (item.cost >= 3500) {
                targetSlot.classList.add('target-rare');
            } else {
                targetSlot.classList.add('target-common');
            }
        }
    }
}

// Function to remove slot highlighting
function removeSlotHighlight() {
    // Remove the highlighting class from all slots
    const highlightedSlots = document.querySelectorAll('.target-slot');
    highlightedSlots.forEach(slot => {
        slot.classList.remove('target-slot', 'target-common', 'target-rare', 'target-epic');
    });
}

// Function to highlight the original item in the shop when hovering over an equipped item
function highlightOriginalItem(itemId) {
    const originalItem = document.querySelector(`.item[data-item-id="${itemId}"]`);
    if (originalItem) {
        originalItem.classList.add('highlight-original');
    }
}

// Function to remove highlight from the original item
function removeOriginalItemHighlight() {
    const highlightedItems = document.querySelectorAll('.highlight-original');
    highlightedItems.forEach(item => {
        item.classList.remove('highlight-original');
    });
}

// Function to highlight the target power slot where a power would be equipped
function highlightTargetPowerSlot(power, isEquipped = false) {
    const heroBuild = getCurrentHeroBuild();
    // Get all power slots
    const powerSlots = document.querySelectorAll('.power-slots .power-slot');

    // Determine which round this power would be assigned to
    let targetRound = getAssignedRound(currentRound);

    if (isEquipped) {
        // Find which slot this power is equipped in
        const equippedPowerIndex = heroBuild.equippedPowers.findIndex(p => p.id === power.id);
        if (equippedPowerIndex !== -1) {
            const equippedPower = heroBuild.equippedPowers[equippedPowerIndex];
            const equippedRound = equippedPower.round;

            // Map the round to the slot index

            const slotIndex = ROUND_TO_SLOT_MAP[equippedRound];
            if (slotIndex !== undefined && slotIndex < powerSlots.length) {
                // Highlight the slot with a consistent style
                powerSlots[slotIndex].classList.add('target-power-slot');
            }
        }
    } else {
        // For powers not yet equipped, highlight the appropriate round slot
        // Check if we're in a round that shouldn't allow power selection
        if (isDisabledRound()) {
            // Don't highlight any slot in the disabled rounds
            return;
        }

        // Find the slot index for the target round
        const targetSlotIndex = ROUND_SLOTS.indexOf(targetRound);

        if (targetSlotIndex !== -1 && targetSlotIndex < powerSlots.length) {
            // Check if this slot already has a power equipped
            const isSlotTaken = heroBuild.equippedPowers.some(p => p.round === targetRound);

            if (!isSlotTaken) {
                // Highlight the slot only if it's not already taken
                powerSlots[targetSlotIndex].classList.add('target-power-slot');
            }
        }
    }
}

// Function to remove power slot highlighting
function removePowerSlotHighlight() {
    // Remove highlighting classes from all power slots
    const highlightedSlots = document.querySelectorAll('.target-power-slot');
    highlightedSlots.forEach(slot => {
        slot.classList.remove('target-power-slot');
    });
}

// Function to highlight the original power card when hovering over a power in a slot
function highlightOriginalPower(powerId) {
    const originalPower = document.querySelector(`.power-card[data-power-id="${powerId}"]`);
    if (originalPower) {
        originalPower.classList.add('highlight-original-power');
    }
}

// Function to remove highlight from the original power card
function removeOriginalPowerHighlight() {
    const highlightedPowers = document.querySelectorAll('.highlight-original-power');
    highlightedPowers.forEach(power => {
        power.classList.remove('highlight-original-power');
    });
}

// New function to initialize power hover effects properly
function initPowerHoverEffects() {
    // Refresh power hover effects for equipped powers
    const powerIcons = document.querySelectorAll('.power-icon[data-power-id]');
    powerIcons.forEach(icon => {
        // Remove existing event listeners by cloning and replacing
        const newIcon = icon.cloneNode(true);
        const powerId = newIcon.getAttribute('data-power-id');

        // Add proper event listeners
        newIcon.addEventListener('mouseenter', (event) => {
            highlightOriginalPower(powerId);
            // Also highlight the target power slot
            const fullPower = findPowerById(powerId);
            if (fullPower) {
                highlightTargetPowerSlot(fullPower, true);
            }
        });

        newIcon.addEventListener('mouseleave', () => {
            removeOriginalPowerHighlight();
            removePowerSlotHighlight();
        });

        // Replace the original icon
        icon.parentNode.replaceChild(newIcon, icon);
    });

    // Also refresh for power cards
    const powerCards = document.querySelectorAll('.power-card');
    powerCards.forEach(card => {
        // Remove existing listeners by cloning
        const newCard = card.cloneNode(true);
        const powerId = newCard.dataset.powerId;
        const isEquipped = newCard.classList.contains('equipped');

        // Get the full power data - moved up to ensure we have this for event handlers
        const fullPower = findPowerById(powerId);

        // Add proper listeners
        newCard.addEventListener('mouseenter', (event) => {
            if (fullPower) {
                highlightTargetPowerSlot(fullPower, isEquipped);
            }
        });

        newCard.addEventListener('mouseleave', () => {
            removePowerSlotHighlight();
        });

        // Restore click handlers as well
        newCard.addEventListener('click', function () {
            if (this.classList.contains('equipped')) {
                unequipPower(powerId, this);
            } else {
                equipPower(powerId, this);
            }
        });

        // Replace the original card
        card.parentNode.replaceChild(newCard, card);
    });
}

// Helper to check if a stat should be displayed as percentage
function isPercentageStat(statKey) {
    const percentageStats = [
        'cooldownReduction', 'moveSpeed', 'damageReduction',
        'healingBoost', 'critChance', 'critDamage'
    ];
    return percentageStats.includes(statKey);
}

// Helper to format stat names for display
function formatStatName(statKey) {
    // Dictionary of stat display names
    const statNames = {
        'cooldownReduction': 'Cooldown Reduction',
        'moveSpeed': 'Movement Speed',
        'damageReduction': 'Damage Reduction',
        'healingBoost': 'Healing Boost',
        'critChance': 'Critical Hit Chance',
        'critDamage': 'Critical Hit Damage'
    };

    return statNames[statKey] ||
        statKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Initialize advanced options
function initAdvancedOptions() {
    const economyToggle = document.getElementById('economy-mode-toggle');
    const customToggle = document.getElementById('custom-toggle');
    const sliders = document.querySelectorAll('.economy-slider');
    const presetColumns = document.querySelectorAll('.preset-column');
    const resetPresetsButton = document.getElementById('reset-presets'); // Make sure this ID exists

    // --- Event Listener Setup ---

    // Economy Mode Toggle Listener
    if (economyToggle) {
        economyToggle.addEventListener('change', () => {
            const isSimulation = economyToggle.checked;
            if (isSimulation) {
                setEconomyModeSimulation();
            } else {
                setEconomyModeUnlimited();
            }
            // Update UI after changing state
            updateAdvancedOptionsUI();
        });
    }

    // Custom Mode Toggle Listener
    if (customToggle) {
        customToggle.addEventListener('change', () => {
            // Assuming customMode state is managed within economySettings
            const economySettings = getEconomySettings();
            economySettings.customMode = customToggle.checked; // Update the state directly
            showMessage(customToggle.checked ? 'Custom mode enabled' : 'Custom mode disabled');
            // Update UI after changing state
            updateAdvancedOptionsUI();
        });
    }

    // Slider Input/Change Listeners
    sliders.forEach((slider) => {
        const round = parseInt(slider.id.split('-')[2]); // Extract round from ID like 'economy-slider-1'
        const valueDisplay = document.getElementById(`slider-value-${round}`);
        const row = slider.closest('.economy-preset-row');

        slider.addEventListener('input', () => {
            if (valueDisplay) {
                valueDisplay.textContent = parseInt(slider.value).toLocaleString();
            }
            if (row) {
                const selectedPreset = row.querySelector('.preset-column.selected');
                if (selectedPreset) {
                    selectedPreset.textContent = parseInt(slider.value).toLocaleString();
                }
            }
        });

        slider.addEventListener('change', () => {
            const newValue = parseInt(slider.value);
            if (row) {
                const selectedPreset = row.querySelector('.preset-column.selected');
                if (selectedPreset) {
                    const presetName = selectedPreset.classList.contains('low') ? 'low' :
                        selectedPreset.classList.contains('normal') ? 'normal' : 'high';
                    // Update state
                    setEconomyPreset(round, presetName); // Keep track of which preset the custom value belongs to
                    setEconomyValue(round, presetName, newValue);
                    // Update the button's dataset and text definitively
                    selectedPreset.dataset.value = newValue;
                    selectedPreset.textContent = newValue.toLocaleString();
                } else {
                    // If no preset is selected (shouldn't happen in custom mode?), maybe default to saving as 'normal'
                    setEconomyPreset(round, 'normal'); // Or handle differently
                    setEconomyValue(round, 'normal', newValue);
                }
            } else {
                // Fallback if row not found?
                setEconomyValue(round, 'normal', newValue);
            }
            // Update UI (mainly cash display)
            updateAdvancedOptionsUI();
        });
    });

    // Preset Button Click Listeners
    presetColumns.forEach(preset => {
        preset.addEventListener('click', () => {
            // Only allow clicks if highlight-enabled (i.e., custom mode is on)
            if (!preset.classList.contains('highlight-enabled')) {
                return;
            }

            const row = preset.closest('.economy-preset-row');
            if (!row) return;

            const round = parseInt(row.dataset.round);
            const presetName = preset.classList.contains('low') ? 'low' :
                preset.classList.contains('normal') ? 'normal' : 'high';
            const value = parseInt(preset.dataset.value); // Use the value stored on the button

            // Update state
            setEconomyPreset(round, presetName);
            setEconomyValue(round, presetName, value); // Set the round's value to this preset's value

            showMessage(`Round ${round} economy set to ${presetName}`);

            // Update UI after changing state
            updateAdvancedOptionsUI();
        });
    });

    // Reset Presets Button Listener
    if (resetPresetsButton) {
        resetPresetsButton.addEventListener('click', () => {
            resetEconomyPresets(); // Reset state to defaults
            showMessage('Presets reset to default values');
            // Update UI after changing state
            updateAdvancedOptionsUI();
        });
    }

    // --- Initial UI Update ---
    // Call once after setting up listeners to reflect the loaded state
    updateAdvancedOptionsUI();
}

// Function to update the UI elements in the Advanced Options / Economy panel
// This function acts as a controller, calling specific UI update functions.
function updateAdvancedOptionsUI() {
    // Update Economy Settings UI
    updateEconomySettingsUI();

    // Update other advanced options UI (future)
    // updateOtherAdvancedOptionsUI();

    // Update elements potentially affected by any advanced option change
    updateCashDisplay();
}

// Initializes the Advanced Options panel - Sets up event listeners ONCE.
// This function acts as a controller, calling specific listener setup functions.
function initAdvancedOptionsListeners() {
    const economyToggle = document.getElementById('economy-mode-toggle');
    const customToggle = document.getElementById('custom-toggle');
    const sliders = document.querySelectorAll('.economy-slider');
    const presetColumns = document.querySelectorAll('.preset-column');
    const resetPresetsButton = document.getElementById('reset-presets'); // Make sure this ID exists

    // --- Event Listener Setup ---

    // Economy Mode Toggle Listener
    if (economyToggle) {
        economyToggle.addEventListener('change', () => {
            const isSimulation = economyToggle.checked;
            if (isSimulation) {
                setEconomyModeSimulation();
            } else {
                setEconomyModeUnlimited();
            }
            // Update UI after changing state
            updateAdvancedOptionsUI();
        });
    }

    // Custom Mode Toggle Listener
    if (customToggle) {
        customToggle.addEventListener('change', () => {
            // Assuming customMode state is managed within economySettings
            const economySettings = getEconomySettings();
            economySettings.customMode = customToggle.checked; // Update the state directly
            showMessage(customToggle.checked ? 'Custom mode enabled' : 'Custom mode disabled');
            // Update UI after changing state
            updateAdvancedOptionsUI();
        });
    }

    // Slider Input/Change Listeners
    sliders.forEach((slider) => {
        const round = parseInt(slider.id.split('-')[2]);
        const valueDisplay = document.getElementById(`slider-value-${round}`);
        const row = slider.closest('.economy-preset-row');

        // Update display during sliding
        slider.addEventListener('input', () => {
            if (valueDisplay) {
                valueDisplay.textContent = parseInt(slider.value).toLocaleString();
            }
            // Temporarily update the selected preset button's text while sliding
            if (row) {
                const selectedPreset = row.querySelector('.preset-column.selected');
                if (selectedPreset) {
                    selectedPreset.textContent = parseInt(slider.value).toLocaleString();
                }
            }
        });

        // Save value on change (when user releases slider)
        slider.addEventListener('change', () => {
            const newValue = parseInt(slider.value);
            if (row) {
                const selectedPreset = row.querySelector('.preset-column.selected');
                if (selectedPreset) {
                    const presetName = selectedPreset.classList.contains('low') ? 'low' :
                        selectedPreset.classList.contains('normal') ? 'normal' : 'high';
                    // Save the current preset selection 
                    setEconomyPreset(round, presetName);

                    // Save custom value for this specific preset
                    setEconomyValue(round, presetName, newValue);

                    // Update the button's dataset and text
                    selectedPreset.dataset.value = newValue;
                    selectedPreset.textContent = newValue.toLocaleString();

                    // Update UI to reflect the changes
                    updateAdvancedOptionsUI();
                    // If in simulation mode, update cash display
                    if (isEconomyModeSimulation() && parseInt(round) === currentRound) {
                        updateCashDisplay();
                    }
                } else {
                    // If no preset is selected, use normal as default
                    setEconomyPreset(round, 'normal');
                    setEconomyValue(round, 'normal', newValue);

                    // Update UI  
                    updateAdvancedOptionsUI();
                    // If in simulation mode, update cash display
                    if (isEconomyModeSimulation() && parseInt(round) === currentRound) {
                        updateCashDisplay();
                    }
                }
            } else {
                // If somehow row not found, use currently selected preset  
                const currentPreset = builds.economySettings.economyPresets[round] || 'normal';
                setEconomyValue(round, currentPreset, newValue);

                // Update UI  
                updateAdvancedOptionsUI();
                // If in simulation mode, update cash display
                if (isEconomyModeSimulation() && parseInt(round) === currentRound) {
                    updateCashDisplay();
                }
            }
        });
    });

    // Preset Button Click Listeners
    presetColumns.forEach(preset => {
        preset.addEventListener('click', () => {
            if (!preset.classList.contains('highlight-enabled')) {
                return;
            }
            const row = preset.closest('.economy-preset-row');
            if (!row) return;
            const round = parseInt(row.dataset.round);
            const presetName = preset.classList.contains('low') ? 'low' :
                preset.classList.contains('normal') ? 'normal' : 'high';
            // Get the value for this preset (custom or default)
            const value = getEconomyPresetValue(round, presetName);

            setEconomyPreset(round, presetName);
            // No need to call setEconomyValue since we're just switching presets, not changing values
            showMessage(`Round ${round} economy set to ${presetName}`);
            updateAdvancedOptionsUI(); // Update the entire panel after state change
        });
    });

    // Reset Presets Button Listener
    if (resetPresetsButton) {
        resetPresetsButton.addEventListener('click', () => {
            resetEconomyPresets();
            showMessage('Presets reset to default values');
            updateAdvancedOptionsUI(); // Update the entire panel after state change
        });
    }
}

// Updates the UI elements specifically for the economy settings section
function updateEconomySettingsUI() {
    const economySettings = getEconomySettings();

    const economyToggle = document.getElementById('economy-mode-toggle');
    const toggleText = document.getElementById('toggle-text');
    const economySimulationOptions = document.querySelector('.economy-simulation-options');
    const customToggle = document.getElementById('custom-toggle');

    // Update Economy Mode Toggle and Section Visibility
    if (economyToggle && toggleText && economySimulationOptions) {
        economyToggle.checked = economySettings.simulationMode;
        toggleText.textContent = economyToggle.checked ? 'Simulation (Round Budget)' : 'Unlimited (Build Cost)';
        economySimulationOptions.style.display = economyToggle.checked ? 'block' : 'none';
    }

    // Update Custom Mode Toggle and Related UI Elements
    if (customToggle) {
        const isCustomMode = economySettings.customMode || false;
        customToggle.checked = isCustomMode;

        document.querySelectorAll('.custom-column').forEach(column => {
            column.classList.toggle('active', isCustomMode);
        });

        document.querySelectorAll('.economy-slider').forEach(slider => {
            if (isCustomMode) {
                slider.removeAttribute('disabled');
                slider.style.opacity = '1';
            } else {
                slider.setAttribute('disabled', 'disabled');
                slider.style.opacity = '0.5';
            }
        });

        document.querySelectorAll('.preset-column').forEach(preset => {
            preset.classList.toggle('highlight-enabled', isCustomMode);
            if (!isCustomMode) {
                preset.classList.remove('selected');
            }
        });
    }

    // Update Sliders and Preset Buttons for each round
    for (let round = 1; round <= 7; round++) {
        const slider = document.getElementById(`economy-slider-${round}`);
        const valueDisplay = document.getElementById(`slider-value-${round}`);
        const economyRow = document.querySelector(`.economy-preset-row[data-round="${round}"]`);

        // Get the currently selected preset for this round
        const roundPreset = economySettings.economyPresets[round] || 'normal';

        // Get the value for this preset (custom or default)
        const roundValue = getEconomyPresetValue(round, roundPreset);

        if (slider && valueDisplay && roundValue !== undefined) {
            slider.value = roundValue;
            valueDisplay.textContent = roundValue.toLocaleString();
        }

        if (economyRow) {
            const allPresets = economyRow.querySelectorAll('.preset-column');
            allPresets.forEach(p => {
                p.classList.remove('selected');
                const presetName = p.classList.contains('low') ? 'low' :
                    p.classList.contains('normal') ? 'normal' : 'high';

                // Each preset button shows its own value (custom or default)
                const presetValue = getEconomyPresetValue(round, presetName);
                p.dataset.value = presetValue;
                p.textContent = presetValue.toLocaleString();
            });

            const selectedPresetButton = economyRow.querySelector(`.preset-column.${roundPreset}`);
            if (selectedPresetButton) {
                selectedPresetButton.classList.add('selected');
                selectedPresetButton.textContent = roundValue.toLocaleString();
            }
        }
    }
}

// Update the cash label based on the economy mode
function updateCashDisplay() {
    const cashContainer = document.querySelector('.build-cost');
    if (!cashContainer) return;

    // Clear existing content
    cashContainer.innerHTML = '';

    // Create label span
    const labelSpan = document.createElement('span');
    labelSpan.className = 'cost-label';

    // Create diamond icon
    const diamondIcon = document.createElement('span');
    diamondIcon.className = 'diamond-icon';

    // Create cost span
    const costSpan = document.createElement('span');
    costSpan.className = 'cost';

    if (!isEconomyModeSimulation()) {
        // Unlimited mode
        labelSpan.textContent = 'BUILD COST:';
        costSpan.textContent = calculateRoundBuildCost(currentRound).toLocaleString();
    } else {
        // In simulation mode, show remaining/total budget
        // Ensure we have accurate budget by checking global settings
        const currentBudget = getCurrentRoundBudget();

        // Recalculate remaining cash based on most current budget and cost
        const totalCost = calculateRoundBuildCost(currentRound);
        const remainingCash = currentBudget - totalCost;

        // Ensure the cash display is accurate by updating the state
        const heroBuild = getCurrentHeroBuild();
        if (!heroBuild.cashByRound) {
            heroBuild.cashByRound = {};
        }

        // Store the recalculated cash in the hero build state
        updateCash(currentRound, remainingCash);

        labelSpan.textContent = 'CASH:';

        // Create remaining cash display
        const remainingSpan = document.createElement('span');

        // If cash is negative, show it in red
        if (remainingCash < 0) {
            remainingSpan.className = 'negative-cash';
            remainingSpan.textContent = remainingCash.toLocaleString();
            // Show a warning if cash is negative (shouldn't happen with proper checks)
            console.warn(`Negative cash detected: ${remainingCash} for round ${currentRound}`);
        } else {
            remainingSpan.textContent = remainingCash.toLocaleString();
        }

        // Create separator
        const separatorSpan = document.createElement('span');
        separatorSpan.textContent = ' / ';

        // Create interactive budget element
        const budgetSpan = document.createElement('span');
        budgetSpan.className = 'budget-selector';
        budgetSpan.textContent = currentBudget.toLocaleString();

        // Make budget clickable to show a dropdown
        budgetSpan.addEventListener('click', function (e) {
            e.stopPropagation();
            showBudgetPresetMenu(e, currentRound);
        });

        // Append all parts to the cost span
        costSpan.appendChild(remainingSpan);
        costSpan.appendChild(separatorSpan);
        costSpan.appendChild(budgetSpan);
    }

    cashContainer.appendChild(labelSpan);
    cashContainer.appendChild(diamondIcon);
    cashContainer.appendChild(costSpan);
}

// Helper function to show the budget preset menu
function showBudgetPresetMenu(event, round) {
    // Remove any existing menu first
    const existingMenu = document.querySelector('.budget-preset-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Create the menu
    const menu = document.createElement('div');
    menu.className = 'budget-preset-menu';

    // Get preset values from the slider values in the economy menu
    const presets = getEconomyPresetValuesForRound(round);

    // Create menu items
    const presetNames = ['low', 'normal', 'high'];
    presetNames.forEach(presetName => {
        const menuItem = document.createElement('div');
        menuItem.className = 'budget-preset-item';
        menuItem.dataset.presetName = presetName;
        menuItem.textContent = `${presetName.toUpperCase()}: ${presets[presetName].toLocaleString()}`;

        // Select the preset when clicked
        menuItem.addEventListener('click', function (e) {
            e.stopPropagation();

            // Apply the preset
            applyBudgetPreset(round, presetName, presets[presetName]);

            // Update the display
            updateCashDisplay();

            // Sync with economy menu UI
            syncEconomyMenuUI(round, presetName);

            // Remove the menu
            menu.remove();

            // Show message
            showMessage(`Round ${round} economy set to ${presetName}`);
        });

        menu.appendChild(menuItem);
    });

    // Position the menu
    menu.style.position = 'absolute';
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;

    // Add menu to the document
    document.body.appendChild(menu);

    // Close menu when clicking elsewhere
    document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
    });
}

// Get the current economy preset values from the UI
function getEconomyPresetValuesForRound(round) {
    // Find the corresponding row in the economy settings
    const economyRow = document.querySelector(`.economy-preset-row[data-round="${round}"]`);

    if (!economyRow) {
        // Fallback to default values if UI elements not found
        return {
            low: getEconomyPresetValue(round, 'low'),
            normal: getEconomyPresetValue(round, 'normal'),
            high: getEconomyPresetValue(round, 'high')
        };
    }

    // Get values directly from the preset columns (which may have been customized)
    const lowPreset = economyRow.querySelector('.preset-column.low');
    const normalPreset = economyRow.querySelector('.preset-column.normal');
    const highPreset = economyRow.querySelector('.preset-column.high');

    return {
        low: parseInt(lowPreset?.dataset.value || getEconomyPresetValue(round, 'low')),
        normal: parseInt(normalPreset?.dataset.value || getEconomyPresetValue(round, 'normal')),
        high: parseInt(highPreset?.dataset.value || getEconomyPresetValue(round, 'high'))
    };
}

// Sync the economy menu UI with the selected preset
function syncEconomyMenuUI(round, presetName) {
    // Find the corresponding row in the economy settings
    const economyRow = document.querySelector(`.economy-preset-row[data-round="${round}"]`);

    if (!economyRow) return;

    // Get all preset columns in this row
    const presetColumns = economyRow.querySelectorAll('.preset-column');

    // Remove selected class from all
    presetColumns.forEach(col => col.classList.remove('selected'));

    // Add selected class to the matching preset type
    const selectedPreset = economyRow.querySelector(`.preset-column.${presetName}`);
    if (selectedPreset) {
        selectedPreset.classList.add('selected');

        // Update the slider value if in custom mode
        const slider = document.getElementById(`economy-slider-${round}`);
        const sliderValue = document.getElementById(`slider-value-${round}`);

        if (slider && sliderValue) {
            // Get the current value for this preset
            const presetValue = getEconomyPresetValue(round, presetName);
            slider.value = presetValue;
            sliderValue.textContent = presetValue.toLocaleString();

            // Update displayed value (preset buttons just show the value number)
            selectedPreset.textContent = presetValue.toLocaleString();

            // Save to state manager
            setEconomyPreset(round, presetName);
            // No need to call setEconomyValue when just switching presets
        }
    }
}

// Apply a budget preset to a specific round
function applyBudgetPreset(round, presetName, value) {
    // --- State Update ---
    setEconomyPreset(round, presetName);
    // If we want to update the value for this preset, do so:
    setEconomyValue(round, presetName, value);

    // --- UI Update ---
    // The main UI update will handle reflecting this change
    updateUI(); // Update the full UI
}

// Calculate the cost of all items in a specific round
function calculateRoundBuildCost(round) {
    const heroBuild = getCurrentHeroBuild();
    let totalCost = 0;

    // Sum the cost of all equipped items in the specified round
    const roundItems = heroBuild.equippedItemsByRound[round] || [];

    for (const item of roundItems) {
        totalCost += item.cost || 0;
    }

    updateCost(round, totalCost);

    return totalCost;
}
