// Global variable for tooltip
let tooltip;
let isHoveringItem = false;  // Track if we're hovering over an item

document.addEventListener('DOMContentLoaded', function() {
    // Create tooltip element to display item information
    tooltip = document.createElement('div');
    tooltip.classList.add('item-tooltip');
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    
    // Initialize tabs
    initTabs();
    
    // Initialize build data
    initBuildData();
    
    // Initialize round selector
    initRoundSelector();
    
    // Initialize reset button
    initResetButton();
    
    // Populate items and powers from config
    populateItems();
    populatePowers();
    
    // Update build display
    updateBuildDisplay();
    updatePowerDisplay();
    updateRoundDisplay();
    
    // Update stats display initially
    updateStatsDisplay();
});

// Default build data structure
const defaultBuildData = {
    cashByRound: {
        1: 5000,
        2: 5000,
        3: 5000,
        4: 5000,
        5: 5000,
        6: 5000,
        7: 5000
    },
    equippedItemsByRound: {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: []
    },
    equippedPowers: [],
    maxItems: 6,
    maxPowers: 4,
    currentRound: 1,
    stats: {
        life: {
            health: 350,
            armor: 50,
            shield: 50
        },
        weaponPower: 0,
        abilityPower: 0,
        attackSpeed: 5,
        cooldownReduction: 0,
        maxAmmo: 0,
        weaponLifesteal: 0,
        abilityLifesteal: 0,
        moveSpeed: 0,
        reloadSpeed: 0,
        meleeDamage: 0,
        criticalDamage: 0
    }
};

// Global variable to store build data
let buildData = { ...defaultBuildData };

// Initialize build data from localStorage or default
function initBuildData() {
    const savedData = localStorage.getItem('buildData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Handle migration from old data structure if needed
        if (!parsedData.equippedItemsByRound && Array.isArray(parsedData.equippedItems)) {
            // Migrate old data to new structure
            parsedData.equippedItemsByRound = {
                1: parsedData.equippedItems || [],
                2: [],
                3: [],
                4: [],
                5: [],
                6: [],
                7: []
            };
            delete parsedData.equippedItems;
        }
        
        // Migrate currency to cashByRound if needed
        if (parsedData.currency !== undefined && !parsedData.cashByRound) {
            parsedData.cashByRound = {
                1: parsedData.currency,
                2: parsedData.currency,
                3: parsedData.currency,
                4: parsedData.currency,
                5: parsedData.currency,
                6: parsedData.currency,
                7: parsedData.currency
            };
            delete parsedData.currency;
        }
        
        // Ensure stats object exists
        if (!parsedData.stats) {
            parsedData.stats = defaultBuildData.stats;
        }
        
        buildData = parsedData;
    }
    
    // Ensure all rounds exist in the structure
    for (let i = 1; i <= 7; i++) {
        if (!buildData.equippedItemsByRound[i]) {
            buildData.equippedItemsByRound[i] = [];
        }
        if (buildData.cashByRound === undefined) {
            buildData.cashByRound = {};
        }
        if (!buildData.cashByRound[i]) {
            buildData.cashByRound[i] = 5000;
        }
    }
    
    // Update cash and stats display
    updateCashDisplay();
    updateStatsDisplay();
}

// Initialize round selector
function initRoundSelector() {
    const roundTabs = document.querySelectorAll('.round-tab');
    
    // Set the initial active round
    roundTabs.forEach(tab => {
        const round = parseInt(tab.getAttribute('data-round'));
        
        if (round === buildData.currentRound) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
        
        // Add click event listener
        tab.addEventListener('click', function() {
            // Set the current round
            buildData.currentRound = round;
            
            // Update active tab
            roundTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update UI for the new round
            updateRoundDisplay();
            
            // Repopulate items for the current round
            populateItems();
            
            // Repopulate powers for the current round (to update disabled state)
            populatePowers();
            
            // Update cash display for the new round
            updateCashDisplay();
            
            // Save changes
            saveBuildData();
        });
    });
}

// Update the UI based on the current round
function updateRoundDisplay() {
    // Get all power slots
    const powerSlots = document.querySelectorAll('.power-slots .power-slot');
    const roundSlots = [1, 3, 5, 7]; // The rounds that have slots
    
    // First, remove all special classes from all slots
    powerSlots.forEach(slot => {
        slot.classList.remove('active-round');
        slot.classList.remove('between-rounds');
        slot.classList.remove('current-round');
        slot.classList.remove('unlocked');
    });
    
    // Determine which rounds are unlocked based on current round
    for (let i = 0; i < powerSlots.length; i++) {
        const roundNumber = roundSlots[i];
        if (buildData.currentRound >= roundNumber) {
            powerSlots[i].classList.add('unlocked');
        }
    }
    
    // Determine the currently active round slot index, but only for rounds that can select powers
    let activeSlotIndex = -1;
    if (buildData.currentRound === 1) {
        activeSlotIndex = 0; // First slot (Round 1)
    } else if (buildData.currentRound === 3) {
        activeSlotIndex = 1; // Second slot (Round 3)
    } else if (buildData.currentRound === 5) {
        activeSlotIndex = 2; // Third slot (Round 5)
    } else if (buildData.currentRound === 7) {
        activeSlotIndex = 3; // Fourth slot (Round 7)
    } else if (buildData.currentRound === 2) {
        // In round 2, we've already obtained round 1 power, but can't yet select round 3
        activeSlotIndex = -1;
    } else if (buildData.currentRound === 4) {
        // In round 4, we've already obtained round 3 power, but can't yet select round 5
        activeSlotIndex = -1;
    } else if (buildData.currentRound === 6) {
        // In round 6, we've already obtained round 5 power, but can't yet select round 7
        activeSlotIndex = -1;
    }
    
    // Highlight only the active slot for the current round
    if (activeSlotIndex >= 0 && activeSlotIndex < powerSlots.length) {
        powerSlots[activeSlotIndex].classList.add('active-round');
        powerSlots[activeSlotIndex].classList.add('current-round');
    }
    
    // Update the build display to show items for the current round
    updateBuildDisplay();
    
    // Update cash display for the current round
    updateCashDisplay();
}

// Save build data to localStorage
function saveBuildData() {
    localStorage.setItem('buildData', JSON.stringify(buildData));
}

// Update cash display
function updateCashDisplay() {
    const costElement = document.querySelector('.build-cost .cost');
    if (buildData && buildData.cashByRound && buildData.cashByRound[buildData.currentRound] !== undefined) {
        costElement.textContent = buildData.cashByRound[buildData.currentRound].toLocaleString();
    } else {
        costElement.textContent = '5,000'; // Default value
    }
}

// Tab switching functionality
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
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
    // For each tab (weapon, ability, survival)
    ['weapon', 'ability', 'survival'].forEach(tabName => {
        // For each rarity (common, rare, epic)
        ['common', 'rare', 'epic'].forEach(rarity => {
            const items = config.items[tabName][rarity];
            const container = document.querySelector(`#${tabName}-tab .item-column:nth-child(${getRarityIndex(rarity)}) .items`);
            
            // Clear existing items
            container.innerHTML = '';
            
            // Group items into rows of 3
            for (let i = 0; i < items.length; i += 3) {
                const row = document.createElement('div');
                row.className = 'item-row';
                
                // Add up to 3 items per row
                for (let j = 0; j < 3; j++) {
                    if (i + j < items.length) {
                        const item = items[i + j];
                        const itemIndex = i + j;
                        item.id = `${tabName}-${rarity}-${itemIndex}`;
                        item.type = tabName;
                        item.rarity = rarity;
                        
                        // Check if item is already owned/equipped in the current round
                        const currentRoundItems = buildData.equippedItemsByRound[buildData.currentRound] || [];
                        const isOwned = currentRoundItems.some(equippedItem => 
                            equippedItem.id === item.id);
                        
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
    
    if (item.isRed) {
        itemElement.className = 'item red-item';
    }
    
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
    
    if (isOwned) {
        costElement.textContent = 'Owned';
    } else {
        const gemIcon = document.createElement('i');
        gemIcon.className = 'fas fa-gem';
        
        costElement.appendChild(gemIcon);
        costElement.appendChild(document.createTextNode(` ${item.cost.toLocaleString()}`));
    }
    
    itemElement.appendChild(iconElement);
    itemElement.appendChild(costElement);
    
    // Make items clickable
    itemElement.addEventListener('click', function() {
        const itemId = this.dataset.itemId;
        const itemData = findItemById(itemId);
        
        if (this.classList.contains('owned')) {
            // Item is already owned, unequip it
            unequipItem(itemId, this, costElement, itemData);
        } else {
            // Try to purchase and equip the item
            purchaseAndEquipItem(itemId, this, costElement, itemData);
        }
    });
    
    // Add tooltip functionality
    itemElement.addEventListener('mouseenter', (event) => {
        // Show the tooltip
        showTooltip(item, event);
        
        // Explicitly check if the item is owned by checking the DOM element
        const isCurrentlyOwned = itemElement.classList.contains('owned');
        console.log('Item hover:', item.id, 'isOwned param:', isOwned, 'DOM check:', isCurrentlyOwned);
        
        // Highlight the appropriate slot based on whether the item is owned
        highlightTargetSlot(item, isCurrentlyOwned);
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
function purchaseAndEquipItem(itemId, itemElement, costElement, itemData) {
    // Check if we have enough currency
    if (buildData.cashByRound[buildData.currentRound] < itemData.cost) {
        // Show insufficient funds message
        showMessage('Insufficient funds!');
        return;
    }
    
    // Check if we have room for more items
    if (buildData.equippedItemsByRound[buildData.currentRound].length >= buildData.maxItems) {
        showMessage('Item slots full! Unequip an item first.');
        return;
    }
    
    // Deduct cost
    buildData.cashByRound[buildData.currentRound] -= itemData.cost;
    
    // Add to equipped items
    buildData.equippedItemsByRound[buildData.currentRound].push({
        id: itemId,
        type: itemData.type,
        rarity: itemData.rarity,
        cost: itemData.cost,
        isRed: itemData.isRed
    });
    
    // Update UI
    itemElement.classList.add('owned');
    costElement.textContent = 'Owned';
    
    // Update stats for the newly equipped item
    updateItemStats(itemData, true);
    
    // Remove any slot highlighting that might be active
    removeSlotHighlight();
    
    // Update build display
    updateBuildDisplay();
    updateCashDisplay();
    
    // Save changes
    saveBuildData();
}

// Unequip an item
function unequipItem(itemId, itemElement, costElement, itemData) {
    // Remove from equipped items
    buildData.equippedItemsByRound[buildData.currentRound] = buildData.equippedItemsByRound[buildData.currentRound].filter(item => item.id !== itemId);
    
    // Refund cost
    buildData.cashByRound[buildData.currentRound] += itemData.cost;
    
    // Update UI
    itemElement.classList.remove('owned');
    
    const gemIcon = document.createElement('i');
    gemIcon.className = 'fas fa-gem';
    
    costElement.innerHTML = '';
    costElement.appendChild(gemIcon);
    costElement.appendChild(document.createTextNode(` ${itemData.cost.toLocaleString()}`));
    
    // Update stats for the unequipped item
    updateItemStats(itemData, false);
    
    // Remove any slot highlighting that might be active
    removeSlotHighlight();
    
    // Update build display
    updateBuildDisplay();
    updateCashDisplay();
    
    // Save changes
    saveBuildData();
}

// Update the build display in the left panel
function updateBuildDisplay() {
    const itemSlots = document.querySelectorAll('.item-slots .item-slot');
    
    // Clear all item slots
    itemSlots.forEach(slot => {
        slot.innerHTML = '<div class="empty-slot"></div>';
    });
    
    // Get items for the current round
    const currentRoundItems = buildData.equippedItemsByRound[buildData.currentRound] || [];
    
    // Add equipped items to slots
    currentRoundItems.forEach((item, index) => {
        if (index < itemSlots.length) {
            const slot = itemSlots[index];
            slot.innerHTML = '';
            
            const itemElement = document.createElement('div');
            itemElement.className = `item ${getRarityClass(item.rarity)}`;
            
            if (item.isRed) {
                itemElement.className = 'item red-item';
            }
            
            // Get the full item data to get the iconPath
            const fullItem = findItemById(item.id);
            
            const iconElement = document.createElement('div');
            iconElement.className = 'item-icon';
            iconElement.style.width = '100%';
            iconElement.style.height = '100%';
            
            if (fullItem && fullItem.iconPath) {
                iconElement.style.backgroundImage = `url(${fullItem.iconPath})`;
                iconElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
            
            itemElement.appendChild(iconElement);
            slot.appendChild(itemElement);
            
            // Add click handler to unequip
            itemElement.addEventListener('click', function() {
                const foundItem = findItemById(item.id);
                
                // Find the original item and update its state
                const originalItem = document.querySelector(`.item[data-item-id="${item.id}"]`);
                
                if (originalItem) {
                    const costElement = originalItem.querySelector('.item-cost');
                    unequipItem(item.id, originalItem, costElement, foundItem);
                }
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
        case 'common': return 'green-item';
        case 'rare': return 'blue-item';
        case 'epic': return 'purple-item';
        default: return 'green-item';
    }
}

// Show temporary message
function showMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = text;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 300);
    }, 2000);
}

// Populate powers from config
function populatePowers() {
    const powerGrid = document.querySelector('#power-tab .power-grid');
    
    // Clear existing powers
    powerGrid.innerHTML = '';
    
    // Determine if we're in a round that doesn't allow power selection
    const isDisabledRound = buildData.currentRound === 2 || buildData.currentRound === 4 || buildData.currentRound === 6;
    
    // Group powers into rows of 4
    for (let i = 0; i < config.powers.length; i += 4) {
        const row = document.createElement('div');
        row.className = 'power-row';
        
        // Add up to 4 powers per row
        for (let j = 0; j < 4; j++) {
            if (i + j < config.powers.length) {
                const power = config.powers[i + j];
                power.id = `power-${i + j}`;
                
                // Check if power is already equipped
                const isEquipped = buildData && 
                                   buildData.equippedPowers && 
                                   buildData.equippedPowers.some(equippedPower => 
                                       equippedPower.id === power.id);
                
                // Create the power element and add it to the row
                const powerElement = createPowerElement(power, isEquipped);
                
                // If we're in a disabled round and the power is not equipped, add a disabled class
                if (isDisabledRound && !isEquipped) {
                    powerElement.classList.add('disabled');
                    powerElement.title = "Powers can only be selected in rounds 1, 3, 5, and 7";
                }
                
                row.appendChild(powerElement);
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
    
    const powerIcon = document.createElement('div');
    powerIcon.className = `power-icon ${power.color}`;
    
    const powerTitle = document.createElement('div');
    powerTitle.className = 'power-title';
    powerTitle.textContent = power.title;
    
    const powerDescription = document.createElement('div');
    powerDescription.className = 'power-description';
    powerDescription.textContent = power.description;
    
    powerHeader.appendChild(powerIcon);
    powerHeader.appendChild(powerTitle);
    
    powerCard.appendChild(powerHeader);
    powerCard.appendChild(powerDescription);
    
    // Make powers clickable
    powerCard.addEventListener('click', function() {
        const powerId = this.dataset.powerId;
        
        if (this.classList.contains('equipped')) {
            // Power is already equipped, unequip it
            unequipPower(powerId, this);
        } else {
            // Try to equip the power
            equipPower(powerId, this);
        }
    });
    
    // Add tooltip functionality
    powerCard.addEventListener('mouseenter', (event) => showPowerTooltip(power, event));
    powerCard.addEventListener('mouseleave', hideTooltip);
    
    return powerCard;
}

// Find power by ID
function findPowerById(powerId) {
    const index = parseInt(powerId.split('-')[1]);
    return config.powers[index];
}

// Update the power slots display
function updatePowerDisplay() {
    const powerSlots = document.querySelectorAll('.power-slots .power-slot');
    
    // Map the power slots to their corresponding rounds
    const roundToSlotMap = {
        1: 0,  // first slot is for round 1
        3: 1,  // second slot is for round 3 
        5: 2,  // third slot is for round 5
        7: 3   // fourth slot is for round 7
    };
    
    // Clear all power slots
    powerSlots.forEach(slot => {
        slot.innerHTML = '<div class="empty-slot"></div><div class="slot-label">' + slot.querySelector('.slot-label').textContent + '</div>';
    });
    
    // Get the round number from slot label
    function getSlotRound(slot) {
        const label = slot.querySelector('.slot-label').textContent;
        return parseInt(label.replace('ROUND ', ''));
    }
    
    // If there are no equipped powers or buildData is reset, just clear the slots
    if (!buildData || !buildData.equippedPowers || buildData.equippedPowers.length === 0) {
        return;
    }
    
    // Add equipped powers to their corresponding slots based on the assigned round
    buildData.equippedPowers.forEach(power => {
        // Skip powers assigned to future rounds
        if (power.round > buildData.currentRound) {
            return;
        }
        
        // Get the slot for this power's round
        const slotIndex = roundToSlotMap[power.round];
        if (slotIndex !== undefined && slotIndex < powerSlots.length) {
            const slot = powerSlots[slotIndex];
            const emptySlot = slot.querySelector('.empty-slot');
            
            if (!emptySlot) return; // Skip if the slot has already been filled
            
            const slotLabel = slot.querySelector('.slot-label').textContent;
            
            // Replace empty slot with power icon
            const powerIcon = document.createElement('div');
            powerIcon.className = `power-icon ${power.color}`;
            powerIcon.dataset.powerId = power.id;
            
            // Replace empty slot with power icon
            emptySlot.replaceWith(powerIcon);
            
            // Add click handler to unequip
            powerIcon.addEventListener('click', function() {
                const powerId = this.dataset.powerId;
                
                // Find the original power card and update its state
                const originalPower = document.querySelector(`.power-card[data-power-id="${powerId}"]`);
                
                if (originalPower) {
                    unequipPower(powerId, originalPower);
                }
            });
            
            // Add tooltip functionality
            const fullPower = findPowerById(power.id);
            powerIcon.addEventListener('mouseenter', (event) => showPowerTooltip(fullPower, event));
            powerIcon.addEventListener('mouseleave', hideTooltip);
        }
    });
}

// Equip a power
function equipPower(powerId, powerElement) {
    // Check if we're in a round that shouldn't allow power selection (2, 4, 6)
    if (buildData.currentRound === 2 || buildData.currentRound === 4 || buildData.currentRound === 6) {
        showMessage(`Powers can only be selected in rounds 1, 3, 5, and 7!`);
        return;
    }

    const powerData = findPowerById(powerId);
    
    // Check if we have space for more powers
    if (buildData.equippedPowers.length >= buildData.maxPowers) {
        showMessage('Power slots full! Unequip a power first.');
        return;
    }
    
    // Determine the corresponding round for the current round
    let assignedRound;
    if (buildData.currentRound <= 2) {
        assignedRound = 1;
    } else if (buildData.currentRound <= 4) {
        assignedRound = 3;
    } else if (buildData.currentRound <= 6) {
        assignedRound = 5;
    } else {
        assignedRound = 7;
    }
    
    // Check if this round slot is already taken
    const isSlotTaken = buildData.equippedPowers.some(power => power.round === assignedRound);
    
    // If the slot is already taken, just return
    if (isSlotTaken) {
        return;
    }
    
    // Add to equipped powers with round info
    buildData.equippedPowers.push({
        id: powerId,
        title: powerData.title,
        color: powerData.color,
        description: powerData.description,
        round: assignedRound
    });
    
    // Update UI
    powerElement.classList.add('equipped');
    
    // Update only the specific power slot
    const roundToSlotMap = {
        1: 0,  // first slot is for round 1
        3: 1,  // second slot is for round 3 
        5: 2,  // third slot is for round 5
        7: 3   // fourth slot is for round 7
    };
    
    const slotIndex = roundToSlotMap[assignedRound];
    if (slotIndex !== undefined) {
        const powerSlots = document.querySelectorAll('.power-slots .power-slot');
        if (slotIndex < powerSlots.length) {
            const slot = powerSlots[slotIndex];
            const slotLabel = slot.querySelector('.slot-label').textContent;
            
            // Replace empty slot with power icon
            const emptySlot = slot.querySelector('.empty-slot');
            if (emptySlot) {
                const powerIcon = document.createElement('div');
                powerIcon.className = `power-icon ${powerData.color}`;
                powerIcon.dataset.powerId = powerId;
                
                // Add tooltip
                powerIcon.title = powerData.title;
                
                // Replace empty slot with power icon
                emptySlot.replaceWith(powerIcon);
                
                // Add click handler to unequip
                powerIcon.addEventListener('click', function() {
                    const powerId = this.dataset.powerId;
                    
                    // Find the original power card and update its state
                    const originalPower = document.querySelector(`.power-card[data-power-id="${powerId}"]`);
                    
                    if (originalPower) {
                        unequipPower(powerId, originalPower);
                    }
                });
            }
        }
    }
    
    // Save changes
    saveBuildData();
}

// Unequip a power
function unequipPower(powerId, powerElement) {
    // Find the power to unequip
    const powerIndex = buildData.equippedPowers.findIndex(power => power.id === powerId);
    
    if (powerIndex !== -1) {
        try {
            // Get the round from the power before removing it
            const powerRound = buildData.equippedPowers[powerIndex].round;
            
            // Remove from equipped powers
            buildData.equippedPowers.splice(powerIndex, 1);
            
            // Update UI
            if (powerElement) {
                powerElement.classList.remove('equipped');
            }
            
            // Find and update just the specific power slot that was unequipped
            if (powerRound) {
                const roundToSlotMap = {
                    1: 0,  // first slot is for round 1
                    3: 1,  // second slot is for round 3 
                    5: 2,  // third slot is for round 5
                    7: 3   // fourth slot is for round 7
                };
                
                const slotIndex = roundToSlotMap[powerRound];
                if (slotIndex !== undefined) {
                    const powerSlots = document.querySelectorAll('.power-slots .power-slot');
                    if (slotIndex < powerSlots.length) {
                        const slot = powerSlots[slotIndex];
                        
                        // Only update this specific slot
                        const slotLabel = slot.querySelector('.slot-label').textContent;
                        slot.innerHTML = '<div class="empty-slot"></div><div class="slot-label">' + slotLabel + '</div>';
                        
                        // Ensure the unlocked class is maintained
                        if (powerRound <= buildData.currentRound) {
                            slot.classList.add('unlocked');
                        }
                    }
                }
            }
            
            // Save changes
            saveBuildData();
        } catch (error) {
            console.error("Error unequipping power:", error);
            showMessage("Error unequipping power");
        }
    }
}

// Initialize reset button
function initResetButton() {
    const resetButton = document.getElementById('reset-button');
    const resetModal = document.getElementById('reset-modal');
    const cancelReset = document.getElementById('cancel-reset');
    const confirmReset = document.getElementById('confirm-reset');
    
    // Show the modal when reset button is clicked
    resetButton.addEventListener('click', function() {
        resetModal.classList.add('active');
    });
    
    // Hide the modal when cancel is clicked
    cancelReset.addEventListener('click', function() {
        resetModal.classList.remove('active');
    });
    
    // Handle reset confirmation
    confirmReset.addEventListener('click', function() {
        // Hide the modal
        resetModal.classList.remove('active');
        
        // Reset to default data
        buildData = JSON.parse(JSON.stringify(defaultBuildData)); // Deep copy default data
        
        // Remove from localStorage
        localStorage.removeItem('buildData');
        
        // Reset the power cards in the power tab
        const powerCards = document.querySelectorAll('.power-card');
        powerCards.forEach(card => {
            card.classList.remove('equipped');
        });
        
        // Update UI
        updateRoundDisplay();
        updateCashDisplay();
        updateBuildDisplay();
        updatePowerDisplay();
        updateStatsDisplay(); // Update stats display
        populateItems();
        populatePowers();
        
        // Show success message
        showMessage('All data has been reset to defaults');
    });
    
    // Close modal when clicking outside
    resetModal.addEventListener('click', function(e) {
        if (e.target === resetModal) {
            resetModal.classList.remove('active');
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && resetModal.classList.contains('active')) {
            resetModal.classList.remove('active');
        }
    });
}

// Update all stats displays
function updateStatsDisplay() {
    // Calculate total life (health + armor + shield)
    const health = parseInt(buildData.stats.life.health) || 0;
    const armor = parseInt(buildData.stats.life.armor) || 0;
    const shield = parseInt(buildData.stats.life.shield) || 0;
    const totalLife = health + armor + shield;
    
    // Update the life value in the header
    const lifeValue = document.querySelector('.total-life-value');
    if (lifeValue) {
        lifeValue.textContent = totalLife;
    }
    
    // Get the progress track element for the life bar
    const progressTrack = document.querySelector('.total-life-track');
    if (progressTrack) {
        // Clear existing segments
        progressTrack.innerHTML = '';
        
        // Each segment represents 25 life
        const lifePerSegment = 25;
        const fullSegments = Math.floor(totalLife / lifePerSegment);
        const remainder = totalLife % lifePerSegment;
        
        // Calculate how many segments to show
        const totalSegments = remainder > 0 ? fullSegments + 1 : fullSegments;
        
        // Ensure we always show at least 1 segment
        const segmentsToShow = Math.max(1, totalSegments);
        
        // Calculate proportions of health, armor, shield
        const healthProportion = health / totalLife;
        const armorProportion = armor / totalLife;
        // Shield proportion is the remaining (1 - healthProportion - armorProportion)
        
        // Calculate life values for tracking where we are
        let remainingHealth = health;
        let remainingArmor = armor;
        let remainingShield = shield;
        let currentLifeTotal = 0;
        
        // Create segments according to our requirements
        for (let i = 0; i < segmentsToShow; i++) {
            const segment = document.createElement('div');
            segment.className = 'stat-segment';
            
            // Calculate how much life this segment represents
            let segmentLifeValue;
            if (i === segmentsToShow - 1 && remainder > 0) {
                segmentLifeValue = remainder; // Last segment represents the remainder
            } else {
                segmentLifeValue = lifePerSegment; // Full segment
            }
            
            // Calculate width of the segment relative to others
            const segmentWidth = `${(segmentLifeValue / totalLife) * 100}%`;
            segment.style.maxWidth = 'none'; // Override the default max-width
            segment.style.width = segmentWidth;
            
            // Determine what life components to display in this segment
            if (remainingHealth > 0) {
                // Determine how much health to display in this segment
                const healthInSegment = Math.min(remainingHealth, segmentLifeValue);
                const healthPercentage = (healthInSegment / segmentLifeValue) * 100;
                
                if (healthPercentage === 100) {
                    // If the segment is all health, just add the health class
                    segment.classList.add('health');
                } else {
                    // Create partial health fill
                    const healthFill = document.createElement('div');
                    healthFill.className = 'segment-fill health';
                    healthFill.style.width = `${healthPercentage}%`;
                    segment.appendChild(healthFill);
                }
                
                remainingHealth -= healthInSegment;
                currentLifeTotal += healthInSegment;
                
                // If we still have life to fill in this segment and we have armor
                const remainingSpaceInSegment = segmentLifeValue - (currentLifeTotal % lifePerSegment);
                
                if (remainingSpaceInSegment > 0 && remainingArmor > 0) {
                    const armorInSegment = Math.min(remainingArmor, remainingSpaceInSegment);
                    const armorPercentage = (armorInSegment / segmentLifeValue) * 100;
                    const armorStartPercentage = (healthInSegment / segmentLifeValue) * 100;
                    
                    if (armorPercentage === 100 - healthPercentage) {
                        // If the remaining segment is all armor
                        segment.classList.add('armor');
                    } else {
                        // Create partial armor fill
                        const armorFill = document.createElement('div');
                        armorFill.className = 'segment-fill armor';
                        armorFill.style.width = `${armorPercentage}%`;
                        armorFill.style.left = `${armorStartPercentage}%`;
                        segment.appendChild(armorFill);
                    }
                    
                    remainingArmor -= armorInSegment;
                    currentLifeTotal += armorInSegment;
                    
                    // Check if we still have space for shield
                    const remainingSpaceAfterArmor = segmentLifeValue - (currentLifeTotal % lifePerSegment);
                    
                    if (remainingSpaceAfterArmor > 0 && remainingShield > 0) {
                        const shieldInSegment = Math.min(remainingShield, remainingSpaceAfterArmor);
                        const shieldPercentage = (shieldInSegment / segmentLifeValue) * 100;
                        const shieldStartPercentage = ((healthInSegment + armorInSegment) / segmentLifeValue) * 100;
                        
                        // Create partial shield fill
                        const shieldFill = document.createElement('div');
                        shieldFill.className = 'segment-fill shield';
                        shieldFill.style.width = `${shieldPercentage}%`;
                        shieldFill.style.left = `${shieldStartPercentage}%`;
                        segment.appendChild(shieldFill);
                        
                        remainingShield -= shieldInSegment;
                        currentLifeTotal += shieldInSegment;
                    }
                }
            } else if (remainingArmor > 0) {
                // This segment starts with armor
                const armorInSegment = Math.min(remainingArmor, segmentLifeValue);
                const armorPercentage = (armorInSegment / segmentLifeValue) * 100;
                
                if (armorPercentage === 100) {
                    // If the segment is all armor, just add the armor class
                    segment.classList.add('armor');
                } else {
                    // Create partial armor fill
                    const armorFill = document.createElement('div');
                    armorFill.className = 'segment-fill armor';
                    armorFill.style.width = `${armorPercentage}%`;
                    segment.appendChild(armorFill);
                }
                
                remainingArmor -= armorInSegment;
                currentLifeTotal += armorInSegment;
                
                // Check if we still have space for shield
                const remainingSpaceInSegment = segmentLifeValue - (currentLifeTotal % lifePerSegment);
                
                if (remainingSpaceInSegment > 0 && remainingShield > 0) {
                    const shieldInSegment = Math.min(remainingShield, remainingSpaceInSegment);
                    const shieldPercentage = (shieldInSegment / segmentLifeValue) * 100;
                    const shieldStartPercentage = (armorInSegment / segmentLifeValue) * 100;
                    
                    // Create partial shield fill
                    const shieldFill = document.createElement('div');
                    shieldFill.className = 'segment-fill shield';
                    shieldFill.style.width = `${shieldPercentage}%`;
                    shieldFill.style.left = `${shieldStartPercentage}%`;
                    segment.appendChild(shieldFill);
                    
                    remainingShield -= shieldInSegment;
                    currentLifeTotal += shieldInSegment;
                }
            } else if (remainingShield > 0) {
                // This segment is all shield
                segment.classList.add('shield');
                remainingShield -= segmentLifeValue;
                currentLifeTotal += segmentLifeValue;
            }
            
            progressTrack.appendChild(segment);
        }
        
        // Make sure the stat-bar-wrapper has the dummy div for spacing
        const barWrapper = progressTrack.closest('.stat-bar-wrapper');
        if (barWrapper) {
            // Check if we need to add the dummy space div
            if (!barWrapper.querySelector('.stat-icon-space')) {
                const dummySpace = document.createElement('div');
                dummySpace.className = 'stat-icon-space';
                
                // Insert it before the track
                barWrapper.insertBefore(dummySpace, progressTrack);
            }
        }
    }
    
    // Update individual stat bars (these will NOT be segmented)
    updateStatBar('weapon-power', buildData.stats.weaponPower || 0);
    updateStatBar('ability-power', buildData.stats.abilityPower || 0);
    updateStatBar('attack-speed', buildData.stats.attackSpeed || 0);
    updateStatBar('cooldown-reduction', buildData.stats.cooldownReduction || 0);
    updateStatBar('max-ammo', buildData.stats.maxAmmo || 0);
    updateStatBar('weapon-lifesteal', buildData.stats.weaponLifesteal || 0);
    updateStatBar('ability-lifesteal', buildData.stats.abilityLifesteal || 0);
    updateStatBar('move-speed', buildData.stats.moveSpeed || 0);
    updateStatBar('reload-speed', buildData.stats.reloadSpeed || 0);
    updateStatBar('melee-damage', buildData.stats.meleeDamage || 0);
    updateStatBar('critical-damage', buildData.stats.criticalDamage || 0);
}

function updateStatBar(statId, value) {
    // Get the track element by finding the stat-group with matching stat-name
    let statTrack;
    
    // Find the stat track by looking for the stat group with the matching name
    const statGroups = document.querySelectorAll('.stat-group');
    for (const group of statGroups) {
        const nameElement = group.querySelector('.stat-name');
        if (nameElement) {
            const name = nameElement.textContent.toLowerCase().replace(/\s+/g, '-');
            if (name === statId) {
                statTrack = group.querySelector('.stat-track');
                break;
            }
        }
    }
    
    if (!statTrack) return;
    
    // Find the parent stat group that contains this track
    const statGroup = statTrack.closest('.stat-group');
    if (!statGroup) return;
    
    // Get the stat value element
    const statValue = statGroup.querySelector('.stat-value');
    if (!statValue) return;
    
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
    
    // Calculate percentage and set width
    const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
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
    
    // Update the numeric value
    if (statId === 'life' || statId === 'total-life') {
        statValue.textContent = value;
    } else {
        statValue.textContent = value + '%';
    }
}

// Update item stats when purchased
function updateItemStats(item, add = true) {
    // Sample stat modifications based on item type and rarity
    const statModifiers = {
        weapon: {
            common: { weaponPower: 5, attackSpeed: 3 },
            rare: { weaponPower: 10, attackSpeed: 5, criticalDamage: 5 },
            epic: { weaponPower: 20, attackSpeed: 8, criticalDamage: 10, weaponLifesteal: 5 }
        },
        ability: {
            common: { abilityPower: 5, cooldownReduction: 3 },
            rare: { abilityPower: 10, cooldownReduction: 8 },
            epic: { abilityPower: 20, cooldownReduction: 12, abilityLifesteal: 5 }
        },
        survival: {
            common: { health: 50 },
            rare: { health: 80, armor: 20 },
            epic: { health: 100, armor: 30, shield: 30, moveSpeed: 5 }
        }
    };
    
    // Get modifiers based on item type and rarity
    const modifiers = statModifiers[item.type]?.[item.rarity] || {};
    const multiplier = add ? 1 : -1; // Add or subtract based on equip/unequip
    
    // Apply modifiers to stats
    for (const [stat, value] of Object.entries(modifiers)) {
        if (stat === 'health' || stat === 'armor' || stat === 'shield') {
            buildData.stats.life[stat] += value * multiplier;
        } else {
            buildData.stats[stat] += value * multiplier;
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
        <div class="tooltip-header ${item.isRed ? 'red-item' : ''}">${item.name}</div>
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
    tooltipContent += `<div class="tooltip-cost"><i class="fas fa-gem"></i> <span>${item.cost.toLocaleString()}</span></div>`;
    
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
    slot.classList.remove('common-item', 'rare-item', 'epic-item', 'red-item', 'empty-slot');
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
        if (item.isRed) {
            slot.classList.add('red-item');
        } else if (item.cost >= 9000) {
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

// Function to show power tooltip
function showPowerTooltip(power, event) {
    if (!power) return;
    
    // Set hovering flag
    isHoveringItem = true;
    
    // Create tooltip content
    let tooltipContent = `
        <div class="tooltip-header tooltip-power ${power.color}">${power.title}</div>
    `;
    
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

// Function to highlight the target slot where an item would be equipped
function highlightTargetSlot(item, isOwned = false) {
    // Get all item slots and current round items
    const itemSlots = document.querySelectorAll('.item-slots .item-slot');
    const currentRoundItems = buildData.equippedItemsByRound[buildData.currentRound] || [];
    
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
            if (item.isRed) {
                targetSlot.classList.add('target-red');
            } else if (item.cost >= 9000) {
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
        if (currentRoundItems.length >= buildData.maxItems) {
            // No space, don't highlight anything
            return;
        }
        
        if (currentRoundItems.length < itemSlots.length) {
            const targetSlot = itemSlots[currentRoundItems.length];
            
            // Add highlight class to the target slot
            targetSlot.classList.add('target-slot');
            
            // Add the rarity class to show the right color
            if (item.isRed) {
                targetSlot.classList.add('target-red');
            } else if (item.cost >= 9000) {
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
        slot.classList.remove('target-slot', 'target-common', 'target-rare', 'target-epic', 'target-red');
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