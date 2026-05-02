// HexSim Game - Main Game Logic

// ===== CONSTANTS =====
const TERRAIN_TYPES = {
    FARMLAND: 'farmland',
    MOUNTAIN: 'mountain',
    SEA: 'sea',
    RIVER: 'river',
    FOREST: 'forest',
    DESERT: 'desert'
};

// ===== LOADING SCREEN =====
class LoadingScreen {
    constructor() {
        this.element = document.getElementById('loading-screen');
        this.progressElement = document.getElementById('loading-progress');
        this.statusElement = document.getElementById('loading-status');
    }
    
    show() {
        this.element.classList.remove('hidden');
    }
    
    hide() {
        this.element.classList.add('hidden');
    }
    
    updateProgress(current, total, status) {
        this.progressElement.textContent = `${current} / ${total}`;
        this.statusElement.textContent = status;
    }
    
    updateStatus(status) {
        this.statusElement.textContent = status;
    }
}

const TERRAIN_COLORS = {
    farmland: '#90EE90',
    mountain: '#8B7355',
    sea: '#4682B4',
    river: '#87CEEB',
    forest: '#228B22',
    desert: '#F4A460'
};

const TERRAIN_RESOURCES = {
    farmland: 'food',
    mountain: 'ore',
    sea: 'food',
    river: 'water',
    forest: 'wood',
    desert: 'sand'
};

const STRUCTURE_TYPES = {
    CAMP: 'camp',
    SETTLEMENT: 'settlement',
    TOWN: 'town',
    CITY: 'city',
    FORT: 'fort',
    WELL: 'well',
    MINE: 'mine',
    BARRACKS: 'barracks',
    FARM: 'farm',
    LUMBERYARD: 'lumberyard',
    BLACKSMITH: 'blacksmith',
    SHIPYARD: 'shipyard'
};

const TROOP_TYPES = {
    FARMER: 'farmer',
    HUNTER: 'hunter',
    WORKER: 'worker',
    ARCHER: 'archer',
    SPEARMAN: 'spearman',
    SWORDSMAN: 'swordsman',
    AXEMAN: 'axeman',
    SAILOR: 'sailor'
};

const RECIPES = {
    // Craft
    bricks: { water: 1, sand: 1 },
    bow: { wood: 1 },
    metal: { ore: 1 },
    gold: { ore: 1 },
    spear: { wood: 1, ore: 1, requires: 'blacksmith' },
    sword: { metal: 3, requires: 'blacksmith' },
    'axe&shield': { wood: 3, metal: 5 },
    boat: { wood: 5, metal: 3, requires: 'shipyard' },
    
    // Build
    well: { food: 3, wood: 2 },
    mine: { food: 10, wood: 10, bricks: 5 },
    barracks: { wood: 10, bricks: 5 },
    farm: { wood: 4 },
    camp: { wood: 10, food: 10, bricks: 10 },
    lumberyard: { wood: 10, metal: 5 },
    blacksmith: { wood: 10, metal: 10, sand: 10, water: 10 },
    shipyard: { wood: 10, metal: 10 },
    fort: { wood: 15, metal: 15, sand: 15, water: 15 },
    
    // Improve
    'camp->settlement': { wood: 15, food: 10 },
    'settlement->town': { wood: 15, ore: 15, bricks: 15, sand: 15, food: 25 },
    'town->city': { wood: 20, bricks: 20, sand: 20, water: 20, food: 50 },
    'barracks->college': { wood: 30, bricks: 30, sand: 20, water: 20, food: 100 },
    
    // Train
    farmer: { food: 4 },
    hunter: { bow: 1, food: 4 },
    worker: { food: 2 },
    archer: { bow: 1, food: 5 },
    spearman: { spear: 1, food: 10 },
    swordsman: { sword: 1, food: 10 },
    axeman: { 'axe&shield': 1, food: 10 },
    sailor: { water: 3, food: 3, boat: 1 }
};

// Troop stats for production/consumption
const TROOP_STATS = {
    farmer: { produces: { food: 2 }, consumes: { food: 1, water: 1 } },
    hunter: { produces: { food: 3 }, consumes: { food: 1, water: 1 } },
    worker: { produces: { food: 1, water: 2 }, consumes: { food: 1, water: 1 } },
    archer: { produces: {}, consumes: { food: 1, water: 1 } },
    spearman: { produces: {}, consumes: { food: 2, water: 1 } },
    swordsman: { produces: {}, consumes: { food: 2, water: 1 } },
    axeman: { produces: {}, consumes: { food: 3, water: 2 } },
    sailor: { produces: { water: 3, food: 3 }, consumes: { wood: 1 } }
};

// Combat stats
const COMBAT_STATS = {
    archer: { health: 5, attack: 1, bonus: { axeman: 1 } },
    spearman: { health: 10, attack: 2, bonus: { archer: 1 } },
    swordsman: { health: 15, attack: 2, bonus: { spearman: 1 } },
    axeman: { health: 25, attack: 4, bonus: { swordsman: 1 } }
};

const SETTLEMENT_DEFENSE = {
    camp: { health: 50, damage: 10 },
    settlement: { health: 100, damage: 20 },
    town: { health: 200, damage: 50 },
    city: { health: 300, damage: 150 }
};

// ===== HEXAGON UTILITIES =====
class HexUtils {
    static axialToPixel(q, r, size) {
        const x = size * (3/2 * q);
        const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
        return { x, y };
    }
    
    static pixelToAxial(x, y, size) {
        const q = (2/3 * x) / size;
        const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
        return this.axialRound(q, r);
    }
    
    static axialRound(q, r) {
        const s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);
        
        const qDiff = Math.abs(rq - q);
        const rDiff = Math.abs(rr - r);
        const sDiff = Math.abs(rs - s);
        
        if (qDiff > rDiff && qDiff > sDiff) {
            rq = -rr - rs;
        } else if (rDiff > sDiff) {
            rr = -rq - rs;
        }
        
        return { q: rq, r: rr };
    }
    
    static getNeighbors(q, r) {
        const directions = [
            [+1, 0], [+1, -1], [0, -1],
            [-1, 0], [-1, +1], [0, +1]
        ];
        return directions.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
    }
    
    static distance(q1, r1, q2, r2) {
        return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
    }
    
    static getHexesInRange(q, r, range) {
        const hexes = [];
        for (let dq = -range; dq <= range; dq++) {
            for (let dr = Math.max(-range, -dq - range); dr <= Math.min(range, -dq + range); dr++) {
                if (dq === 0 && dr === 0) continue;
                hexes.push({ q: q + dq, r: r + dr });
            }
        }
        return hexes;
    }
}

// ===== GAME STATE =====
class GameState {
    constructor() {
        this.hexGrid = new Map(); // key: "q,r" -> Hex object
        this.players = [];
        this.currentPlayerIndex = 0;
        this.turnNumber = 1;
        this.phase = 'setup'; // setup, placement, playing
        this.lastRoll = null;
        this.selectedHex = null;
        this.hasRolled = false;
    }
    
    getHex(q, r) {
        return this.hexGrid.get(`${q},${r}`);
    }
    
    setHex(q, r, hex) {
        this.hexGrid.set(`${q},${r}`, hex);
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        if (this.currentPlayerIndex === 0) {
            this.turnNumber++;
        }
        this.hasRolled = false;
    }
}

// ===== HEX CLASS =====
class Hex {
    constructor(q, r, terrain, number) {
        this.q = q;
        this.r = r;
        this.terrain = terrain;
        this.number = number;
        this.structure = null;
        this.structureLevel = null; // for camp/settlement/town/city
        this.owner = null;
        this.troops = {}; // playerId -> { archer: 0, spearman: 0, ... }
        this.improvements = []; // well, mine, farm, etc.
        this.movedTroops = {}; // Track which troops have moved this turn
        this.isCapital = false; // Whether this hex contains a player's capital
    }
}

// ===== PLAYER CLASS =====
class Player {
    constructor(id, name, isAI = false) {
        this.id = id;
        this.name = name;
        this.isAI = isAI;
        this.resources = {
            food: 0,
            ore: 0,
            water: 0,
            wood: 0,
            sand: 0,
            bricks: 0,
            metal: 0,
            gold: 0,
            bow: 0,
            spear: 0,
            sword: 0,
            'axe&shield': 0,
            boat: 0
        };
        this.troops = {
            farmer: 0,
            hunter: 0,
            worker: 0,
            archer: 0,
            spearman: 0,
            swordsman: 0,
            axeman: 0,
            sailor: 0
        };
        this.settlements = []; // array of {q, r}
        this.capital = null; // {q, r} of capital (first settlement)
        this.hasBlacksmith = false;
        this.hasShipyard = false;
        this.hasBarracks = false;
        this.hasMilitaryCollege = false;
        this.aiStrategy = null; // For AI players: 'economic', 'aggressive', 'defensive'
        this.aiStrategyData = {}; // Strategy-specific data (e.g., turn counters, pivot states)
    }
    
    addResource(type, amount) {
        this.resources[type] = (this.resources[type] || 0) + amount;
    }
    
    canAfford(recipe) {
        for (const [resource, amount] of Object.entries(recipe)) {
            if (resource === 'requires') continue;
            if ((this.resources[resource] || 0) < amount) {
                return false;
            }
        }
        return true;
    }
    
    spend(recipe) {
        for (const [resource, amount] of Object.entries(recipe)) {
            if (resource === 'requires') continue;
            this.resources[resource] -= amount;
        }
    }
}

// ===== BOARD GENERATOR =====
class BoardGenerator {
    static generateBoard(loadingScreen) {
        console.log('=== BOARD GENERATION START ===');
        console.log('Starting board generation...');
        loadingScreen.updateStatus('Generating hex positions...');
        
        const hexes = [];
        const radius = 16; // Creates approximately 700 hexes
        
        // Generate hex positions
        console.log('Generating hex positions with radius', radius);
        for (let q = -radius; q <= radius; q++) {
            const r1 = Math.max(-radius, -q - radius);
            const r2 = Math.min(radius, -q + radius);
            for (let r = r1; r <= r2; r++) {
                hexes.push({ q, r });
            }
        }
        
        console.log(`Generated ${hexes.length} hex positions`);
        loadingScreen.updateProgress(1, 6, `${hexes.length} hexes created`);
        
        // Initialize hexMap with no terrain assigned yet
        const hexMap = new Map();
        
        loadingScreen.updateStatus('Initializing hex grid...');
        hexes.forEach(({ q, r }) => {
            hexMap.set(`${q},${r}`, { q, r, terrain: null, neighbors: [] });
        });
        
        console.log('Applying terrain rules (Ocean -> River -> Land)...');
        loadingScreen.updateProgress(2, 6, 'Hex grid initialized');
        
        // Apply terrain generation in correct order: Ocean -> River -> Land
        this.applyTerrainRules(hexMap, hexes, loadingScreen);
        
        console.log('Assigning numbers...');
        loadingScreen.updateProgress(5, 6, 'Assigning tile numbers...');
        
        // Assign numbers
        this.assignNumbers(hexMap, hexes);
        
        console.log('Board generation complete!');
        loadingScreen.updateProgress(6, 6, 'Board generation complete!');
        
        return hexMap;
    }
    
    static applyTerrainRules(hexMap, hexes, loadingScreen) {
        console.log('=== APPLYING TERRAIN RULES ===');
        console.log('Total hexes:', hexes.length);
        
        // STEP 1: Generate exactly 100 ocean tiles at bottom (flood fill, no nulls inside)
        loadingScreen.updateProgress(3, 6, 'Step 1: Generating oceans...');
        console.log('STEP 1: Generating 100 ocean tiles at bottom...');
        this.generateOceansSolid(hexMap, hexes, loadingScreen);
        console.log('STEP 1: Ocean generation complete');
        
        // STEP 2: Generate rivers (up to 100 tiles)
        loadingScreen.updateStatus('Step 2: Generating rivers...');
        console.log('STEP 2: Starting river generation...');
        const riverCount = this.generateRiversSimple(hexMap, hexes, loadingScreen);
        console.log(`STEP 2: Generated ${riverCount} river tiles`);
        
        // STEP 3: Fill with exactly 100 farmland, 100 mountain, 100 forest
        loadingScreen.updateStatus('Step 3: Generating land terrain...');
        console.log('STEP 3: Generating exactly 100 each of farmland, mountain, forest...');
        this.fillLandTerrainSimple(hexMap, hexes, loadingScreen);
        console.log('STEP 3: Land terrain complete');
        
        // STEP 4: Fill all remaining nulls with desert
        loadingScreen.updateStatus('Step 4: Filling remaining with desert...');
        console.log('STEP 4: Filling remaining nulls with desert...');
        let desertFilled = 0;
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (hex && hex.terrain === null) {
                hex.terrain = 'desert';
                desertFilled++;
            }
        });
        console.log(`Filled ${desertFilled} remaining tiles with desert`);
        
        // Log final terrain distribution
        const finalCounts = {
            farmland: 0, mountain: 0, forest: 0, desert: 0, sea: 0, river: 0
        };
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (hex && hex.terrain) {
                finalCounts[hex.terrain] = (finalCounts[hex.terrain] || 0) + 1;
            }
        });
        console.log('=== FINAL TERRAIN DISTRIBUTION ===');
        console.log('Ocean:', finalCounts.sea);
        console.log('River:', finalCounts.river);
        console.log('Farmland:', finalCounts.farmland);
        console.log('Mountain:', finalCounts.mountain);
        console.log('Forest:', finalCounts.forest);
        console.log('Desert:', finalCounts.desert);
        const totalTiles = finalCounts.sea + finalCounts.river + finalCounts.farmland + finalCounts.mountain + finalCounts.forest + finalCounts.desert;
        console.log('Total:', hexes.length, '(Verified:', totalTiles, ')');
        console.log('=== TERRAIN RULES COMPLETE ===');
        
        loadingScreen.updateProgress(4, 6, 'Terrain generation complete');
    }
    
    static generateOceans(hexMap, hexes, loadingScreen) {
        // Start with bottom center hex (q=0, r=16 for radius 16 grid)
        console.log('Starting ocean at bottom center (0, 16)');
        const startHex = hexMap.get(`0,16`);
        if (!startHex) {
            console.error('Bottom center hex not found!');
            return;
        }
        
        startHex.terrain = 'sea';
        loadingScreen.updateStatus('Ocean started at bottom center');
        
        const oceanHexes = [startHex];
        const candidates = [];
        
        // Add neighbors of start hex as candidates
        HexUtils.getNeighbors(0, 16).forEach(({ q, r }) => {
            if (hexMap.has(`${q},${r}`)) {
                candidates.push({ q, r });
            }
        });
        
        // Target: about 100 ocean tiles
        const targetOceanTiles = 100;
        
        while (oceanHexes.length < targetOceanTiles && candidates.length > 0) {
            if (oceanHexes.length % 5 === 0) {
                loadingScreen.updateStatus(`Oceans: ${oceanHexes.length}/${targetOceanTiles}`);
            }
            
            // Pick a random candidate
            const idx = Math.floor(Math.random() * candidates.length);
            const { q, r } = candidates[idx];
            candidates.splice(idx, 1);
            
            const hex = hexMap.get(`${q},${r}`);
            if (!hex || hex.terrain === 'sea') continue;
            
            // Make it ocean
            hex.terrain = 'sea';
            oceanHexes.push(hex);
            
            // Add its empty neighbors as candidates
            HexUtils.getNeighbors(q, r).forEach(({ q: nq, r: nr }) => {
                const neighborHex = hexMap.get(`${nq},${nr}`);
                if (neighborHex && neighborHex.terrain === null) {
                    const alreadyCandidate = candidates.some(c => c.q === nq && c.r === nr);
                    if (!alreadyCandidate) {
                        candidates.push({ q: nq, r: nr });
                    }
                }
            });
        }
        
        console.log(`Generated ${oceanHexes.length} ocean tiles`);
        loadingScreen.updateStatus(`Ocean complete: ${oceanHexes.length} tiles`);
    }
    
    static generateOceansSolid(hexMap, hexes, loadingScreen) {
        // Simply fill the bottom tiles with ocean (highest r values = bottom of map)
        // 817 tiles / 6 terrain types = 137 tiles per type
        console.log('Filling bottom tiles with ocean...');
        
        // Sort hexes by r value (descending) to get bottom tiles first
        const sortedByBottom = [...hexes].sort((a, b) => b.r - a.r);
        
        const targetOceanTiles = 137;
        let oceanCount = 0;
        
        for (const { q, r } of sortedByBottom) {
            if (oceanCount >= targetOceanTiles) break;
            
            const hex = hexMap.get(`${q},${r}`);
            if (hex) {
                hex.terrain = 'sea';
                oceanCount++;
                
                if (oceanCount % 20 === 0) {
                    loadingScreen.updateStatus(`Ocean: ${oceanCount}/${targetOceanTiles}`);
                }
            }
        }
        
        console.log(`Generated ocean band at bottom: ${oceanCount} tiles`);
        loadingScreen.updateStatus(`Ocean complete: ${oceanCount} tiles`);
    }
    
    static findNullGroups(hexMap, hexes) {
        // Find all connected groups of NULL tiles using flood-fill (not ocean, not river)
        const visited = new Set();
        const groups = [];
        
        hexes.forEach(({ q, r }) => {
            const key = `${q},${r}`;
            if (visited.has(key)) return;
            
            const hex = hexMap.get(key);
            // Only look at null tiles (not ocean, not river, not any terrain)
            if (!hex || hex.terrain !== null) return;
            
            // Start a new group with flood-fill
            const group = new Set();
            const queue = [{ q, r }];
            
            while (queue.length > 0) {
                const current = queue.shift();
                const currentKey = `${current.q},${current.r}`;
                
                if (visited.has(currentKey)) continue;
                visited.add(currentKey);
                
                const currentHex = hexMap.get(currentKey);
                // Only include null tiles in groups
                if (!currentHex || currentHex.terrain !== null) continue;
                
                group.add(currentKey);
                
                // Add neighbors to queue
                HexUtils.getNeighbors(current.q, current.r).forEach(({ q: nq, r: nr }) => {
                    const neighborKey = `${nq},${nr}`;
                    if (!visited.has(neighborKey) && hexMap.has(neighborKey)) {
                        queue.push({ q: nq, r: nr });
                    }
                });
            }
            
            if (group.size > 0) {
                groups.push(group);
            }
        });
        
        return groups;
    }
    
    static findLandGroups(hexMap, hexes) {
        // Find all connected groups of non-ocean, non-river tiles using flood-fill
        const visited = new Set();
        const groups = [];
        
        hexes.forEach(({ q, r }) => {
            const key = `${q},${r}`;
            if (visited.has(key)) return;
            
            const hex = hexMap.get(key);
            if (!hex || hex.terrain === 'sea' || hex.terrain === 'river' || hex.terrain === 'desert') return;
            
            // Start a new group with flood-fill
            const group = new Set();
            const queue = [{ q, r }];
            
            while (queue.length > 0) {
                const current = queue.shift();
                const currentKey = `${current.q},${current.r}`;
                
                if (visited.has(currentKey)) continue;
                visited.add(currentKey);
                
                const currentHex = hexMap.get(currentKey);
                if (!currentHex || currentHex.terrain === 'sea' || currentHex.terrain === 'river' || currentHex.terrain === 'desert') continue;
                
                group.add(currentKey);
                
                // Add neighbors to queue
                HexUtils.getNeighbors(current.q, current.r).forEach(({ q: nq, r: nr }) => {
                    const neighborKey = `${nq},${nr}`;
                    if (!visited.has(neighborKey) && hexMap.has(neighborKey)) {
                        queue.push({ q: nq, r: nr });
                    }
                });
            }
            
            if (group.size > 0) {
                groups.push(group);
            }
        });
        
        return groups;
    }
    
    static generateRiversSimple(hexMap, hexes, loadingScreen) {
        // Find all ocean hexes that border null hexes (potential river starts)
        const getRiverStartPoints = () => {
            const startPoints = [];
            hexes.forEach(({ q, r }) => {
                const hex = hexMap.get(`${q},${r}`);
                if (hex && hex.terrain === 'sea') {
                    const neighbors = HexUtils.getNeighbors(q, r);
                    neighbors.forEach(({ q: nq, r: nr }) => {
                        const neighborHex = hexMap.get(`${nq},${nr}`);
                        const neighborKey = `${nq},${nr}`;
                        if (neighborHex && neighborHex.terrain === null) {
                            if (!startPoints.some(p => p.key === neighborKey)) {
                                startPoints.push({ q: nq, r: nr, key: neighborKey });
                            }
                        }
                    });
                }
            });
            return startPoints;
        };
        
        let totalRiverTiles = 0;
        const targetRiverTiles = 137; // 817 / 6 = 137
        const riverDirections = [
            [-1, 0],  // 1: up-left
            [0, -1],  // 2: up  
            [+1, -1]  // 3: up-right
        ];
        
        const isAtMapEdge = (q, r) => {
            const s = -q - r;
            return Math.abs(q) === 16 || Math.abs(r) === 16 || Math.abs(s) === 16;
        };
        
        let riverChainCount = 0;
        
        while (totalRiverTiles < targetRiverTiles) {
            const startPoints = getRiverStartPoints();
            
            if (startPoints.length === 0) {
                console.log('No valid river start points remaining, aborting river generation');
                break;
            }
            
            // Pick random start point
            const start = startPoints[Math.floor(Math.random() * startPoints.length)];
            let current = { q: start.q, r: start.r };
            const chainTiles = [];
            
            riverChainCount++;
            let lastDir = null;
            
            while (totalRiverTiles < targetRiverTiles) {
                // Place river tile at current position
                const currentHex = hexMap.get(`${current.q},${current.r}`);
                if (!currentHex || currentHex.terrain !== null) break; // Already occupied
                
                currentHex.terrain = 'river';
                chainTiles.push({ q: current.q, r: current.r });
                totalRiverTiles++;
                
                if (totalRiverTiles % 10 === 0) {
                    loadingScreen.updateStatus(`Rivers: ${totalRiverTiles}/${targetRiverTiles}`);
                }
                
                // Check if we should end: touching edge or touching another river (not part of this chain)
                if (isAtMapEdge(current.q, current.r)) {
                    console.log(`River chain ${riverChainCount}: hit edge at ${chainTiles.length} tiles`);
                    break;
                }
                
                const neighbors = HexUtils.getNeighbors(current.q, current.r);
                const touchingExistingRiver = neighbors.some(({ q: nq, r: nr }) => {
                    const n = hexMap.get(`${nq},${nr}`);
                    // Check if it's a river that's not part of current chain
                    if (n && n.terrain === 'river') {
                        return !chainTiles.some(t => t.q === nq && t.r === nr);
                    }
                    return false;
                });
                
                if (touchingExistingRiver) {
                    console.log(`River chain ${riverChainCount}: joined existing river at ${chainTiles.length} tiles`);
                    break;
                }
                
                // Pick random direction (1-3)
                const dirIndex = Math.floor(Math.random() * 3);
                const [dq, dr] = riverDirections[dirIndex];
                const next = { q: current.q + dq, r: current.r + dr };
                const nextKey = `${next.q},${next.r}`;
                
                // Check if next position is valid (exists and is null)
                const nextHex = hexMap.get(nextKey);
                if (!nextHex || nextHex.terrain !== null) {
                    console.log(`River chain ${riverChainCount}: blocked at ${chainTiles.length} tiles`);
                    break;
                }
                
                current = next;
            }
            
            console.log(`River chain ${riverChainCount}: created ${chainTiles.length} tiles, total: ${totalRiverTiles}`);
        }
        
        return totalRiverTiles;
    }
    
    static fillLandTerrainSimple(hexMap, hexes, loadingScreen) {
        // Count how many tiles are still null
        let nullCount = 0;
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (hex && hex.terrain === null) {
                nullCount++;
            }
        });
        
        console.log(`${nullCount} null tiles remaining to fill with land terrain`);
        
        // We need exactly 137 of each: farmland, mountain, forest (817 / 6 = 137)
        const targetPerTerrain = 137;
        const terrains = ['farmland', 'mountain', 'forest'];
        const counts = { farmland: 0, mountain: 0, forest: 0 };
        
        // Collect all null hexes
        const nullHexes = [];
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (hex && hex.terrain === null) {
                nullHexes.push(hex);
            }
        });
        
        // Shuffle for random distribution
        for (let i = nullHexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nullHexes[i], nullHexes[j]] = [nullHexes[j], nullHexes[i]];
        }
        
        // Assign terrain to null hexes, 100 of each type
        let index = 0;
        for (const terrain of terrains) {
            for (let i = 0; i < targetPerTerrain && index < nullHexes.length; i++) {
                nullHexes[index].terrain = terrain;
                counts[terrain]++;
                index++;
            }
        }
        
        console.log(`Assigned land terrain: farmland=${counts.farmland}, mountain=${counts.mountain}, forest=${counts.forest}`);
        console.log(`${nullHexes.length - index} tiles remain null (will become desert)`);
    }
    
    static fillLandTerrain(hexMap, hexes, loadingScreen, islandTiles) {
        // Count how many mainland tiles are still null (excluding islands)
        let nullCount = 0;
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            const key = `${q},${r}`;
            if (hex && hex.terrain === null && !islandTiles.has(key)) {
                nullCount++;
            }
        });
        
        console.log(`${nullCount} mainland null tiles remaining to fill with land terrain`);
        console.log(`${islandTiles.size} island tiles will be filled with desert later`);
        
        // We need exactly 100 of each: farmland, mountain, forest
        const targetPerTerrain = 100;
        const terrains = ['farmland', 'mountain', 'forest'];
        const counts = { farmland: 0, mountain: 0, forest: 0 };
        
        // Collect all null hexes on mainland (not islands)
        const nullHexes = [];
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            const key = `${q},${r}`;
            if (hex && hex.terrain === null && !islandTiles.has(key)) {
                nullHexes.push(hex);
            }
        });
        
        // Shuffle for random distribution
        for (let i = nullHexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nullHexes[i], nullHexes[j]] = [nullHexes[j], nullHexes[i]];
        }
        
        // Assign terrain to null hexes, 100 of each type
        let index = 0;
        for (const terrain of terrains) {
            for (let i = 0; i < targetPerTerrain && index < nullHexes.length; i++) {
                nullHexes[index].terrain = terrain;
                counts[terrain]++;
                index++;
            }
        }
        
        console.log(`Assigned land terrain: farmland=${counts.farmland}, mountain=${counts.mountain}, forest=${counts.forest}`);
        console.log(`${nullHexes.length - index} mainland tiles remain null (will become desert)`);
    }
    
    static generateRivers_OLD(hexMap, hexes, loadingScreen) {
        // Find ocean EDGE hexes (ocean tiles that border empty/land tiles, but NOT desert islands)
        const oceanEdgeHexes = [];
        
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (hex && hex.terrain === 'sea') {
                // Check if this ocean hex has at least one NON-OCEAN, NON-DESERT neighbor
                const neighbors = HexUtils.getNeighbors(q, r);
                const validNeighbors = neighbors.filter(({ q: nq, r: nr }) => {
                    const neighborHex = hexMap.get(`${nq},${nr}`);
                    // Must be null (empty) - not ocean, not desert
                    return neighborHex && neighborHex.terrain === null;
                });
                
                // This is a valid ocean edge if it has empty neighbors (not desert islands)
                if (validNeighbors.length > 0) {
                    oceanEdgeHexes.push({ q, r, nonOceanNeighbors: validNeighbors });
                }
            }
        });
        
        console.log(`Found ${oceanEdgeHexes.length} ocean edge hexes (excluding desert islands)`);
        loadingScreen.updateStatus(`Found ${oceanEdgeHexes.length} ocean edge points`);
        
        if (oceanEdgeHexes.length === 0) {
            console.log('No ocean edge found, skipping rivers');
            return;
        }
        
        // Generate rivers until we have 100 river tiles total
        const targetRiverTiles = 100;
        let totalRiverTiles = 0;
        let riverCount = 0;
        let attempts = 0;
        const maxAttempts = 200; // Safety limit
        
        while (totalRiverTiles < targetRiverTiles && attempts < maxAttempts) {
            attempts++;
            riverCount++;
            loadingScreen.updateStatus(`River ${riverCount}: ${totalRiverTiles}/${targetRiverTiles} tiles`);
            
            // Pick a random ocean edge hex
            const edgeHex = oceanEdgeHexes[Math.floor(Math.random() * oceanEdgeHexes.length)];
            
            // Find empty neighbors to start the river (not ocean, not already river)
            const emptyNeighbors = edgeHex.nonOceanNeighbors.filter(({ q, r }) => {
                const hex = hexMap.get(`${q},${r}`);
                return hex && hex.terrain === null;
            });
            
            if (emptyNeighbors.length > 0) {
                // Pick random empty neighbor to start river
                const firstRiverHex = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                
                // Generate river chain - no length limit, runs until edge or blocked
                const tilesCreated = this.createRiverChain(hexMap, firstRiverHex, targetRiverTiles - totalRiverTiles, loadingScreen);
                
                if (tilesCreated > 0) {
                    totalRiverTiles += tilesCreated;
                    console.log(`River ${riverCount}: created ${tilesCreated} tiles, total: ${totalRiverTiles}`);
                }
            }
        }
        
        console.log(`River generation complete: ${totalRiverTiles} tiles created in ${riverCount} rivers`);
        loadingScreen.updateStatus(`River generation complete: ${totalRiverTiles} tiles`);
    }
    
    static createRiverChain(hexMap, startPos, maxTiles, loadingScreen) {
        const riverHexes = [];
        let current = startPos;
        const minRiverLength = 20;
        let joinedAnotherRiver = false;
        
        // Validate first hex
        const firstHex = hexMap.get(`${current.q},${current.r}`);
        if (!firstHex || firstHex.terrain !== null) return 0;
        
        // First tile must touch ocean on EXACTLY ONE side
        const firstNeighbors = HexUtils.getNeighbors(current.q, current.r);
        const oceanNeighborCount = firstNeighbors.filter(({ q, r }) => {
            const n = hexMap.get(`${q},${r}`);
            return n && n.terrain === 'sea';
        }).length;
        
        if (oceanNeighborCount !== 1) {
            console.log(`First river tile rejected: touches ${oceanNeighborCount} ocean sides (needs exactly 1)`);
            return 0;
        }
        
        firstHex.terrain = 'river';
        riverHexes.push(firstHex);
        
        // Check if at map edge (radius 16)
        const isAtMapEdge = (q, r) => {
            const s = -q - r;
            return Math.abs(q) === 16 || Math.abs(r) === 16 || Math.abs(s) === 16;
        };
        
        // Build the chain - can only move upward, not horizontally or down
        // Allowed directions: up-right [+1,-1], up-left [0,-1]
        // Disallowed: right [+1,0], left [-1,0], down-left [-1,+1], down-right [0,+1]
        while (riverHexes.length < maxTiles) {
            // Check if current tile is at map edge
            if (riverHexes.length >= minRiverLength && isAtMapEdge(current.q, current.r)) {
                console.log(`River hit map edge at length ${riverHexes.length}`);
                break;
            }
            
            const allNeighbors = HexUtils.getNeighbors(current.q, current.r);
            
            // Filter for valid directions (only upward movement - dr must be negative)
            const validDirections = allNeighbors.filter(({ q, r }) => {
                const dq = q - current.q;
                const dr = r - current.r;
                
                // Only allow upward movements (dr < 0)
                // This excludes horizontal (dr = 0) and downward (dr > 0) movements
                if (dr >= 0) return false;
                
                const hex = hexMap.get(`${q},${r}`);
                if (!hex || hex.terrain !== null) return false;
                
                // Check this potential tile's neighbors
                const hexNeighbors = HexUtils.getNeighbors(q, r);
                
                // Subsequent river tiles must NOT touch ocean
                const oceanCount = hexNeighbors.filter(({ q: nq, r: nr }) => {
                    const n = hexMap.get(`${nq},${nr}`);
                    return n && n.terrain === 'sea';
                }).length;
                
                if (oceanCount > 0) return false;
                
                // Count river neighbors
                const riverCount = hexNeighbors.filter(({ q: nq, r: nr }) => {
                    const n = hexMap.get(`${nq},${nr}`);
                    return n && n.terrain === 'river';
                }).length;
                
                // Allow riverCount === 1 (normal flow connecting to current chain)
                // Allow riverCount === 2 (touching another river - will be terminal tile)
                // Reject riverCount > 2 (would create complex junction)
                return riverCount >= 1 && riverCount <= 2;
            });
            
            // Debug: log direction options and which one was chosen
            if (riverHexes.length < 5) {
                const directionNames = validDirections.map(({ q, r }) => {
                    const dq = q - current.q;
                    const dr = r - current.r;
                    if (dq === 1 && dr === -1) return 'up-right [+1,-1]';
                    if (dq === 0 && dr === -1) return 'up-left [0,-1]';
                    return `[${dq},${dr}]`;
                });
                console.log(`River tile ${riverHexes.length}: ${validDirections.length} valid directions: ${directionNames.join(', ')}`);
            }
            
            if (validDirections.length === 0) {
                console.log(`River terminated: no valid directions at length ${riverHexes.length}`);
                break;
            }
            
            // Pick a random valid direction
            const nextPos = validDirections[Math.floor(Math.random() * validDirections.length)];
            
            // Log which direction was chosen
            if (riverHexes.length < 5) {
                const dq = nextPos.q - current.q;
                const dr = nextPos.r - current.r;
                const chosenDir = (dq === 1 && dr === -1) ? 'up-right [+1,-1]' : (dq === 0 && dr === -1) ? 'up-left [0,-1]' : `[${dq},${dr}]`;
                console.log(`  → Chose: ${chosenDir}`);
            }
            const nextHex = hexMap.get(`${nextPos.q},${nextPos.r}`);
            
            if (nextHex) {
                // Check if this tile will touch another river (creating a junction)
                const hexNeighbors = HexUtils.getNeighbors(nextPos.q, nextPos.r);
                const riverNeighborCount = hexNeighbors.filter(({ q: nq, r: nr }) => {
                    const n = hexMap.get(`${nq},${nr}`);
                    return n && n.terrain === 'river';
                }).length;
                
                nextHex.terrain = 'river';
                riverHexes.push(nextHex);
                current = nextPos;
                
                // If this tile touches 2 rivers (our chain + another river), terminate here
                if (riverNeighborCount === 2) {
                    console.log(`River joined another river at length ${riverHexes.length}`);
                    joinedAnotherRiver = true;
                    break;
                }
            } else {
                break;
            }
        }
        
        // If river is shorter than minimum and didn't hit edge or join another river, it's invalid - rollback
        if (riverHexes.length < minRiverLength && !isAtMapEdge(current.q, current.r) && !joinedAnotherRiver) {
            console.log(`River too short (${riverHexes.length} < ${minRiverLength}), rolling back`);
            riverHexes.forEach(hex => hex.terrain = null);
            return 0;
        }
        
        console.log(`Created river chain with ${riverHexes.length} tiles`);
        return riverHexes.length;
    }
    
    static smoothLandTerrain(hexMap, hexes, loadingScreen) {
        // Apply adjacency rules to make terrain cluster
        const maxIterations = 15; // Reduced from 30 for faster generation
        
        for (let iter = 0; iter < maxIterations; iter++) {
            loadingScreen.updateStatus(`Smoothing terrain: pass ${iter + 1}/${maxIterations}`);
            let changes = 0;
            
            // Only process a sample of hexes each iteration for speed
            const sampleSize = Math.min(hexes.length, 300);
            const shuffled = [...hexes].sort(() => Math.random() - 0.5).slice(0, sampleSize);
            
            shuffled.forEach(({ q, r }) => {
                const hex = hexMap.get(`${q},${r}`);
                
                // Skip water tiles and desert (desert is only final filler)
                if (hex.terrain === 'sea' || hex.terrain === 'river' || hex.terrain === 'desert') return;
                
                const neighbors = HexUtils.getNeighbors(q, r)
                    .map(({ q: nq, r: nr }) => hexMap.get(`${nq},${nr}`))
                    .filter(n => n !== undefined && n.terrain !== 'sea' && n.terrain !== 'river' && n.terrain !== 'desert');
                
                // Count terrain types in neighbors
                const terrainCounts = {};
                neighbors.forEach(n => {
                    terrainCounts[n.terrain] = (terrainCounts[n.terrain] || 0) + 1;
                });
                
                // If no matching terrain in neighbors, potentially change
                if (!terrainCounts[hex.terrain] && Math.random() < 0.4) {
                    // Pick the most common neighbor terrain
                    const mostCommon = Object.entries(terrainCounts)
                        .sort((a, b) => b[1] - a[1])[0];
                    
                    if (mostCommon) {
                        hex.terrain = mostCommon[0];
                        changes++;
                    }
                }
            });
            
            if (changes === 0) break;
        }
        
        console.log('Land terrain smoothing complete');
    }
    
    static balanceTerrains(hexMap, hexes, islandHexes) {
        // Count current distribution
        const counts = {
            farmland: 0,
            mountain: 0,
            forest: 0,
            desert: 0,
            sea: 0,
            river: 0
        };
        
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (hex && hex.terrain) {
                counts[hex.terrain] = (counts[hex.terrain] || 0) + 1;
            }
        });
        
        console.log('Terrain distribution before balancing:', counts);
        
        const targetPerTerrain = 100;
        const landTerrains = ['farmland', 'mountain', 'forest', 'desert'];
        
        // Get all mutable tiles (not ocean or river) grouped by terrain
        const tilesByTerrain = {
            farmland: [],
            mountain: [],
            forest: [],
            desert: []
        };
        
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (hex && landTerrains.includes(hex.terrain)) {
                tilesByTerrain[hex.terrain].push(hex);
            }
        });
        
        // Convert island hexes to desert first
        islandHexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (hex && hex.terrain !== 'desert' && landTerrains.includes(hex.terrain)) {
                // Remove from old terrain list
                const oldTerrain = hex.terrain;
                const idx = tilesByTerrain[oldTerrain].indexOf(hex);
                if (idx > -1) {
                    tilesByTerrain[oldTerrain].splice(idx, 1);
                }
                
                // Change to desert
                hex.terrain = 'desert';
                tilesByTerrain['desert'].push(hex);
                counts[oldTerrain]--;
                counts['desert']++;
            }
        });
        
        console.log(`After converting ${islandHexes.length} islands to desert:`, { ...counts });
        
        // Balance to exactly 100 each using shuffled tile lists
        for (const terrain of landTerrains) {
            // Shuffle the tiles for this terrain for random distribution
            const tiles = tilesByTerrain[terrain];
            for (let i = tiles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
            }
        }
        
        // Iteratively balance
        let maxIterations = 1000;
        let iterations = 0;
        
        while (iterations < maxIterations) {
            iterations++;
            let madeChange = false;
            
            for (const terrain of landTerrains) {
                if (tilesByTerrain[terrain].length > targetPerTerrain) {
                    // This terrain has too many - convert some to an under-target terrain
                    const underTerrain = landTerrains.find(t => tilesByTerrain[t].length < targetPerTerrain);
                    if (underTerrain) {
                        // Take the last tile from the over-target terrain
                        const hex = tilesByTerrain[terrain].pop();
                        hex.terrain = underTerrain;
                        tilesByTerrain[underTerrain].push(hex);
                        madeChange = true;
                    }
                }
            }
            
            if (!madeChange) break;
        }
        
        // Recalculate final counts
        Object.keys(counts).forEach(k => counts[k] = 0);
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (hex && hex.terrain) {
                counts[hex.terrain] = (counts[hex.terrain] || 0) + 1;
            }
        });
        
        console.log('Balanced terrain distribution:', counts);
        console.log(`Balancing completed in ${iterations} iterations`);
        
        // FINAL STEP: Re-detect islands after all terrain modifications
        console.log('Re-detecting islands after balancing...');
        let additionalIslands = 0;
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (!hex || hex.terrain === 'sea' || hex.terrain === 'river' || hex.terrain === 'desert') return;
            
            const neighbors = HexUtils.getNeighbors(q, r);
            const existingNeighbors = neighbors.filter(({ q: nq, r: nr }) => hexMap.has(`${nq},${nr}`));
            
            if (existingNeighbors.length > 0) {
                const allOcean = existingNeighbors.every(({ q: nq, r: nr }) => {
                    const n = hexMap.get(`${nq},${nr}`);
                    return n && n.terrain === 'sea';
                });
                
                if (allOcean) {
                    hex.terrain = 'desert';
                    additionalIslands++;
                }
            }
        });
        console.log(`Converted ${additionalIslands} additional islands to desert after balancing`);
    }
    
    static assignNumbers(hexMap, hexes) {
        // Filter hexes that need numbers:
        // - All land tiles (farmland, mountain, forest, desert)
        // - All river tiles (produce water)
        // - Ocean tiles adjacent to land (produce food)
        // - Exclude ocean tiles not adjacent to land (middle of ocean)
        hexes.forEach(({ q, r }) => {
            const hex = hexMap.get(`${q},${r}`);
            if (!hex) return;
            
            // Check if this is an ocean tile
            if (hex.terrain === 'sea') {
                // Only assign number if adjacent to a land tile
                const neighbors = HexUtils.getNeighbors(q, r);
                const hasLandNeighbor = neighbors.some(({ q: nq, r: nr }) => {
                    const neighborHex = hexMap.get(`${nq},${nr}`);
                    return neighborHex && neighborHex.terrain !== 'sea' && neighborHex.terrain !== 'river';
                });
                
                if (hasLandNeighbor) {
                    hex.number = Math.floor(Math.random() * 12) + 1; // 1-12
                }
                // Else leave number undefined for deep ocean
            } else {
                // All non-ocean tiles (land, river, desert) get numbers
                hex.number = Math.floor(Math.random() * 12) + 1; // 1-12
            }
        });
    }
}

// ===== RENDERER =====
class Renderer {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
        this.hexSize = 20;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        
        this.setupCanvas();
        this.setupInteraction();
    }
    
    setupCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        
        // Center the view
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
    }
    
    setupInteraction() {
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.offsetX += e.clientX - lastX;
                this.offsetY += e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;
                this.render();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.scale *= zoomFactor;
            this.scale = Math.max(0.5, Math.min(3, this.scale));
            this.render();
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (isDragging) return;
            this.handleClick(e);
        });
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;
        
        const { q, r } = HexUtils.pixelToAxial(x, y, this.hexSize);
        const hex = this.gameState.getHex(q, r);
        
        if (hex) {
            game.handleHexClick(hex);
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        // Render all hexes
        this.gameState.hexGrid.forEach(hex => {
            this.drawHex(hex);
        });
        
        // Render structures and troops
        this.gameState.hexGrid.forEach(hex => {
            this.drawStructures(hex);
        });
        
        // Highlight selected hex
        if (this.gameState.selectedHex) {
            this.highlightHex(this.gameState.selectedHex);
        }
        
        this.ctx.restore();
    }
    
    drawHex(hex) {
        const { x, y } = HexUtils.axialToPixel(hex.q, hex.r, this.hexSize);
        
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
            const hx = x + this.hexSize * Math.cos(angle);
            const hy = y + this.hexSize * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(hx, hy);
            } else {
                this.ctx.lineTo(hx, hy);
            }
        }
        this.ctx.closePath();
        
        // Fill with terrain color
        this.ctx.fillStyle = TERRAIN_COLORS[hex.terrain] || '#ccc';
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
        
        // Draw number
        if (hex.number) {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '8px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(hex.number, x, y);
        }
    }
    
    drawStructures(hex) {
        if (!hex.structure && !hex.owner) return;
        
        const { x, y } = HexUtils.axialToPixel(hex.q, hex.r, this.hexSize);
        
        // Draw structure icon
        if (hex.structure) {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            let icon = '';
            if (hex.structure === 'camp') icon = '⛺';
            else if (hex.structure === 'settlement') icon = '🏘️';
            else if (hex.structure === 'town') icon = '🏙️';
            else if (hex.structure === 'city') icon = '🏛️';
            else if (hex.structure === 'fort') icon = '🏰';
            
            this.ctx.fillText(icon, x, y - 8);
            
            // Draw capital indicator (crown)
            if (hex.isCapital) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '10px sans-serif';
                this.ctx.fillText('👑', x, y - 18);
            }
            
            // Draw improvement count indicator if settlement has improvements
            if (['camp', 'settlement', 'town', 'city'].includes(hex.structure) && 
                hex.improvements && hex.improvements.length > 0) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(x + 10, y - 8, 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw improvement count
                this.ctx.fillStyle = '#000';
                this.ctx.font = 'bold 7px sans-serif';
                this.ctx.fillText(hex.improvements.length, x + 10, y - 8);
            }
        }
        
        // Draw owner color indicator
        if (hex.owner !== null) {
            const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00'];
            this.ctx.fillStyle = colors[hex.owner] || '#888';
            this.ctx.beginPath();
            this.ctx.arc(x, y + 8, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw troop type indicators
        this.drawTroopIcons(hex, x, y);
    }
    
    drawTroopIcons(hex, x, y) {
        // Collect all troops by type across all players on this hex
        const troopsByType = {};
        const playerOwnership = {}; // Track which player owns which troop type
        
        Object.entries(hex.troops).forEach(([playerId, playerTroops]) => {
            Object.entries(playerTroops || {}).forEach(([troopType, count]) => {
                if (count > 0) {
                    if (!troopsByType[troopType]) {
                        troopsByType[troopType] = 0;
                        playerOwnership[troopType] = playerId;
                    }
                    troopsByType[troopType] += count;
                }
            });
        });
        
        if (Object.keys(troopsByType).length === 0) return;
        
        // Troop type letters and colors (using letters for better compatibility)
        const troopDisplay = {
            farmer: { letter: 'F', color: '#8B4513', name: 'Farmer' },
            hunter: { letter: 'H', color: '#2F4F2F', name: 'Hunter' },
            worker: { letter: 'W', color: '#DAA520', name: 'Worker' },
            archer: { letter: 'A', color: '#4169E1', name: 'Archer' },
            spearman: { letter: 'S', color: '#DC143C', name: 'Spearman' },
            swordsman: { letter: 'K', color: '#8B0000', name: 'Swordsman' },
            axeman: { letter: 'X', color: '#B8860B', name: 'Axeman' },
            sailor: { letter: 'N', color: '#00CED1', name: 'Sailor' }
        };
        
        // Arrange troops in a circle around the hex center
        const troops = Object.entries(troopsByType);
        const angleStep = (Math.PI * 2) / Math.max(troops.length, 3);
        const radius = this.hexSize * 0.5;
        
        troops.forEach(([troopType, count], index) => {
            const info = troopDisplay[troopType] || { letter: '?', color: '#808080', name: 'Unknown' };
            const angle = angleStep * index - Math.PI / 2; // Start from top
            const iconX = x + Math.cos(angle) * radius;
            const iconY = y + Math.sin(angle) * radius;
            
            // Draw background circle for icon (player color)
            const playerId = playerOwnership[troopType];
            const playerColors = ['#FF6B6B', '#4ECDC4', '#95E77D', '#FFE66D'];
            this.ctx.fillStyle = playerColors[playerId] || '#888';
            this.ctx.beginPath();
            this.ctx.arc(iconX, iconY, 7, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw black border
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            // Draw troop letter
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2.5;
            this.ctx.font = 'bold 10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            // Stroke for outline
            this.ctx.strokeText(info.letter, iconX, iconY);
            // Fill for letter
            this.ctx.fillText(info.letter, iconX, iconY);
            
            // Draw count badge if more than 1
            if (count > 1) {
                // Draw small badge circle
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(iconX + 6, iconY - 5, 4.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw badge border
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                
                // Draw count number
                this.ctx.fillStyle = '#000';
                this.ctx.font = 'bold 7px sans-serif';
                this.ctx.fillText(count.toString(), iconX + 6, iconY - 5);
            }
        });
    }
    
    highlightHex(hex) {
        const { x, y } = HexUtils.axialToPixel(hex.q, hex.r, this.hexSize);
        
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
            const hx = x + this.hexSize * Math.cos(angle);
            const hy = y + this.hexSize * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(hx, hy);
            } else {
                this.ctx.lineTo(hx, hy);
            }
        }
        this.ctx.closePath();
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }
}

// ===== GAME CONTROLLER =====
class Game {
    constructor() {
        this.state = new GameState();
        this.renderer = null;
        this.ui = null;
    }
    
    init() {
        console.log('Initializing HexSim...');
        
        // Create loading screen
        const loadingScreen = new LoadingScreen();
        loadingScreen.show();
        
        // Use setTimeout to let the loading screen render before starting heavy computation
        setTimeout(() => {
            try {
                // Generate board
                console.log('Generating board...');
                loadingScreen.updateProgress(0, 6, 'Starting generation...');
                const hexMap = BoardGenerator.generateBoard(loadingScreen);
                
                console.log('Converting hex map to game state...');
                loadingScreen.updateStatus('Converting to game state...');
                
                // Convert to GameState format
                let converted = 0;
                hexMap.forEach((hexData, key) => {
                    const hex = new Hex(hexData.q, hexData.r, hexData.terrain, hexData.number);
                    this.state.setHex(hexData.q, hexData.r, hex);
                    converted++;
                    
                    if (converted % 100 === 0) {
                        loadingScreen.updateStatus(`Converting: ${converted}/${hexMap.size}`);
                    }
                });
                
                console.log('Creating players...');
                loadingScreen.updateStatus('Creating players...');
                
                // Create players
                this.state.players = [
                    new Player(0, 'Player', false),
                    new Player(1, 'Rockefeller', true),
                    new Player(2, 'Geronimo', true),
                    new Player(3, 'Eisenhower', true)
                ];
                
                // Set AI strategies
                this.state.players[1].aiStrategy = 'economic'; // Rockefeller: Economic Snowball
                this.state.players[2].aiStrategy = 'aggressive'; // Geronimo: Archer Rush
                this.state.players[2].aiStrategyData = { failedAttacks: 0, pivotTurn: null, mode: 'aggressive' };
                this.state.players[3].aiStrategy = 'defensive'; // Eisenhower: Fortress Network
                this.state.players[3].aiStrategyData = { campsBuilt: 0, fortsBuilt: 0 };
                
                console.log('Setting up renderer...');
                loadingScreen.updateStatus('Setting up renderer...');
                
                // Setup renderer
                const canvas = document.getElementById('hex-canvas');
                this.renderer = new Renderer(canvas, this.state);
                this.renderer.render();
                
                console.log('Setting up UI...');
                loadingScreen.updateStatus('Setting up UI...');
                
                // Setup UI
                this.ui = new UI(this);
                this.ui.update();
                
                // Start placement phase
                this.state.phase = 'placement';
                
                // Hide loading screen
                loadingScreen.hide();
                
                this.startPlacement();
                
                console.log('Game initialized successfully!');
            } catch (error) {
                console.error('Error initializing game:', error);
                loadingScreen.updateStatus('ERROR: ' + error.message);
                alert('Error initializing game. Check console for details.');
            }
        }, 100); // 100ms delay to let loading screen render
    }
    
    startPlacement() {
        alert('Place your first camp on a farmland tile.');
    }
    
    handleHexClick(hex) {
        if (this.state.phase === 'placement') {
            this.handlePlacementClick(hex);
        } else if (this.state.phase === 'playing') {
            this.handlePlayingClick(hex);
        }
    }
    
    handlePlacementClick(hex) {
        const player = this.state.getCurrentPlayer();
        
        // Check if it's a valid terrain (only farmland for first camp)
        if (hex.terrain !== 'farmland') {
            alert('You must place your camp on farmland!');
            return;
        }
        
        // Check distance from other camps
        let tooClose = false;
        this.state.hexGrid.forEach(otherHex => {
            if (otherHex.structure === 'camp' || otherHex.structure === 'settlement' || 
                otherHex.structure === 'town' || otherHex.structure === 'city') {
                const dist = HexUtils.distance(hex.q, hex.r, otherHex.q, otherHex.r);
                if (dist < 6) {
                    tooClose = true;
                }
            }
        });
        
        if (tooClose) {
            alert('Too close to another camp! Must be at least 6 tiles away.');
            return;
        }
        
        // Place camp
        hex.structure = 'camp';
        hex.owner = player.id;
        player.settlements.push({ q: hex.q, r: hex.r });
        
        // Set as capital if first settlement
        if (!player.capital) {
            player.capital = { q: hex.q, r: hex.r };
            hex.isCapital = true; // Mark hex as capital
        }
        
        // Give starting resources
        player.resources.food = 10;
        player.resources.wood = 10;
        player.resources.water = 5;
        
        this.renderer.render();
        this.ui.update();
        
        // Move to next player
        this.state.nextPlayer();
        
        // If all players have placed, start game
        if (this.state.players.every(p => p.settlements.length > 0)) {
            this.state.phase = 'playing';
            this.state.currentPlayerIndex = 0;
            this.ui.update();
            alert('All camps placed! Game starting. Player 1\'s turn.');
        } else if (this.state.getCurrentPlayer().isAI) {
            // AI placement
            setTimeout(() => this.aiPlaceCamp(), 500);
        }
    }
    
    aiPlaceCamp() {
        const player = this.state.getCurrentPlayer();
        const farmlandHexes = [];
        
        // Find valid farmland hexes
        this.state.hexGrid.forEach(hex => {
            if (hex.terrain === 'farmland' && !hex.structure) {
                // Check distance
                let valid = true;
                this.state.hexGrid.forEach(otherHex => {
                    if (otherHex.structure === 'camp') {
                        const dist = HexUtils.distance(hex.q, hex.r, otherHex.q, otherHex.r);
                        if (dist < 6) valid = false;
                    }
                });
                if (valid) farmlandHexes.push(hex);
            }
        });
        
        if (farmlandHexes.length > 0) {
            const chosen = farmlandHexes[Math.floor(Math.random() * farmlandHexes.length)];
            chosen.structure = 'camp';
            chosen.owner = player.id;
            player.settlements.push({ q: chosen.q, r: chosen.r });
            
            // Set as capital if first settlement
            if (!player.capital) {
                player.capital = { q: chosen.q, r: chosen.r };
                chosen.isCapital = true;
            }
            player.resources.food = 10;
            player.resources.wood = 10;
            player.resources.water = 5;
            
            this.renderer.render();
            
            this.state.nextPlayer();
            
            if (this.state.players.every(p => p.settlements.length > 0)) {
                this.state.phase = 'playing';
                this.state.currentPlayerIndex = 0;
                this.ui.update();
                alert('All camps placed! Game starting.');
            } else if (this.state.getCurrentPlayer().isAI) {
                setTimeout(() => this.aiPlaceCamp(), 500);
            }
        }
    }
    
    handlePlayingClick(hex) {
        const player = this.state.getCurrentPlayer();
        
        // Handle build mode for improvements
        if (this.state.buildMode && ['well', 'mine', 'farm', 'lumberyard'].includes(this.state.buildMode)) {
            if (hex.owner === player.id && (hex.structure === 'camp' || hex.structure === 'settlement' || hex.structure === 'town' || hex.structure === 'city')) {
                if (!hex.improvements) hex.improvements = [];
                hex.improvements.push(this.state.buildMode);
                alert(`${this.state.buildMode} added to ${hex.structure}!`);
                this.state.buildMode = null;
                this.updateBuildModeDisplay();
                this.renderer.render();
                return;
            } else {
                alert('Must select one of your settlements!');
                return;
            }
        }
        
        // Handle build mode for camp/fort
        if (this.state.buildMode && ['camp', 'fort'].includes(this.state.buildMode)) {
            const structure = this.state.buildMode;
            const recipe = this.state.buildRecipe;
            
            // Validate placement
            if (structure === 'camp') {
                // Camps can only be built on land terrain (farmland, mountain, forest)
                // NOT on river, ocean, or desert
                if (!['farmland', 'mountain', 'forest'].includes(hex.terrain)) {
                    alert('Camps can only be built on farmland, mountain, or forest terrain!');
                    return;
                }
                
                // Must be within 3 tiles of existing settlement (any terrain after first camp)
                let nearSettlement = false;
                player.settlements.forEach(({q, r}) => {
                    const dist = HexUtils.distance(hex.q, hex.r, q, r);
                    if (dist <= 3) nearSettlement = true;
                });
                
                if (!nearSettlement) {
                    alert('Camp must be within 3 tiles of an existing settlement!');
                    return;
                }
                
                // Check not too close to other camps
                let tooClose = false;
                this.state.hexGrid.forEach(otherHex => {
                    if (otherHex.structure && ['camp', 'settlement', 'town', 'city'].includes(otherHex.structure)) {
                        const dist = HexUtils.distance(hex.q, hex.r, otherHex.q, otherHex.r);
                        if (dist < 3) tooClose = true;
                    }
                });
                
                if (tooClose) {
                    alert('Too close to another settlement!');
                    return;
                }
            } else if (structure === 'fort') {
                // Fort can be placed on any empty hex player owns or near their settlements
                if (hex.structure) {
                    alert('Hex already has a structure!');
                    return;
                }
                
                // Check if within 2 tiles of player settlement
                let nearSettlement = false;
                player.settlements.forEach(({q, r}) => {
                    const dist = HexUtils.distance(hex.q, hex.r, q, r);
                    if (dist <= 2) nearSettlement = true;
                });
                
                if (!nearSettlement) {
                    alert('Fort must be within 2 tiles of one of your settlements!');
                    return;
                }
            }
            
            // Place structure and spend resources
            if (player.canAfford(recipe)) {
                player.spend(recipe);
                hex.structure = structure;
                hex.owner = player.id;
                
                if (structure === 'camp') {
                    player.settlements.push({ q: hex.q, r: hex.r });
                }
                
                alert(`${structure} built successfully!`);
                this.state.buildMode = null;
                this.updateBuildModeDisplay();
                this.state.buildRecipe = null;
                this.renderer.render();
                this.ui.update();
                return;
            } else {
                alert('Insufficient resources!');
                return;
            }
        }
        
        // Handle upgrade mode
        if (this.state.upgradeMode) {
            if (hex.owner === player.id && hex.structure) {
                const [from, to] = this.state.upgradeMode.split('->');
                if (hex.structure === from) {
                    hex.structure = to;
                    alert(`${from} upgraded to ${to}!`);
                    this.state.upgradeMode = null;
                    this.renderer.render();
                    return;
                }
            }
            alert('Invalid hex for this upgrade!');
            return;
        }
        
        
        // Handle deploy mode
        if (this.state.deployMode) {
            if (!this.state.deployFrom) {
                // Select source hex
                if (hex.owner === player.id && hex.troops[player.id]) {
                    this.state.deployFrom = hex;
                    this.state.selectedHex = hex;
                    this.renderer.render();
                    alert('Source hex selected. Now click adjacent hex to move troops.');
                }
            } else {
                // Select destination hex
                const fromHex = this.state.deployFrom;
                
                // Show troop selection dialog
                this.ui.showDeployDialog(fromHex, hex);
                
                this.state.deployFrom = null;
                this.state.deployMode = false;
            }
            return;
        }
        
        // Normal hex selection
        this.state.selectedHex = hex;
        this.renderer.render();
        this.ui.showHexDetails(hex);
    }
    
    rollDice() {
        if (this.state.hasRolled) {
            alert('You have already rolled this turn!');
            return;
        }
        
        // Roll a d12
        const roll = Math.floor(Math.random() * 12) + 1;
        this.state.lastRoll = roll;
        this.state.hasRolled = true;
        
        // Distribute resources to ALL players based on dice roll
        const resourcesGained = this.distributeResources(roll);
        
        this.ui.update();
        document.getElementById('last-roll').textContent = `Last Roll: ${roll}`;
        
        return resourcesGained;
    }
    
    distributeResources(roll) {
        // Track resources gained by each player
        const resourcesGained = {};
        this.state.players.forEach(player => {
            resourcesGained[player.id] = {};
        });
        
        this.state.players.forEach(player => {
            player.settlements.forEach(({ q, r }) => {
                const campHex = this.state.getHex(q, r);
                if (!campHex) return;
                
                // Get settlement level bonus
                let bonus = 1;
                if (campHex.structure === 'settlement') bonus = 2;
                else if (campHex.structure === 'town') bonus = 3;
                else if (campHex.structure === 'city') bonus = 4;
                
                // Check the hex and neighbors
                const hexesToCheck = [campHex, ...HexUtils.getNeighbors(q, r)
                    .map(({ q: nq, r: nr }) => this.state.getHex(nq, nr))
                    .filter(h => h !== undefined)];
                
                hexesToCheck.forEach(hex => {
                    if (hex.number === roll) {
                        const resource = TERRAIN_RESOURCES[hex.terrain];
                        if (resource) {
                            player.addResource(resource, bonus);
                            resourcesGained[player.id][resource] = (resourcesGained[player.id][resource] || 0) + bonus;
                            
                            // Check for improvements on the settlement hex (not individual tiles)
                            if (campHex.improvements && campHex.improvements.length > 0) {
                                campHex.improvements.forEach(improvement => {
                                    if (improvement === 'well' && resource === 'water') {
                                        player.addResource('water', 1);
                                        resourcesGained[player.id]['water'] = (resourcesGained[player.id]['water'] || 0) + 1;
                                    } else if (improvement === 'mine' && resource === 'ore') {
                                        player.addResource('ore', 1);
                                        resourcesGained[player.id]['ore'] = (resourcesGained[player.id]['ore'] || 0) + 1;
                                    } else if (improvement === 'farm' && resource === 'food') {
                                        player.addResource('food', 1);
                                        resourcesGained[player.id]['food'] = (resourcesGained[player.id]['food'] || 0) + 1;
                                    } else if (improvement === 'lumberyard' && resource === 'wood') {
                                        player.addResource('wood', 1);
                                        resourcesGained[player.id]['wood'] = (resourcesGained[player.id]['wood'] || 0) + 1;
                                    }
                                });
                            }
                        }
                    }
                });
            });
        });
        
        return resourcesGained;
    }
    
    applyProduction(player) {
        // Apply troop production for the specified player only
        // (Workers, farmers, etc. only produce on their own turn)
        Object.entries(player.troops).forEach(([troopType, count]) => {
            const stats = TROOP_STATS[troopType];
            if (stats) {
                // Production
                Object.entries(stats.produces).forEach(([resource, amount]) => {
                    player.addResource(resource, amount * count);
                });
                
                // Consumption
                Object.entries(stats.consumes).forEach(([resource, amount]) => {
                    player.addResource(resource, -amount * count);
                });
            }
        });
        
        // Check for negative resources and apply attrition
        this.applyAttrition(player);
    }
    
    applyAttrition(player) {
        const troopRanking = ['axeman', 'swordsman', 'spearman', 'archer', 'sailor', 'hunter', 'farmer', 'worker'];
        
        // Check each resource
        Object.entries(player.resources).forEach(([resource, amount]) => {
            if (amount < 0) {
                // Lose troops until we can afford consumption
                for (const troopType of troopRanking) {
                    while (player.troops[troopType] > 0 && player.resources[resource] < 0) {
                        player.troops[troopType]--;
                        const stats = TROOP_STATS[troopType];
                        if (stats && stats.consumes[resource]) {
                            player.resources[resource] += stats.consumes[resource];
                        }
                    }
                    if (player.resources[resource] >= 0) break;
                }
                
                // If still negative, set to 0
                if (player.resources[resource] < 0) {
                    player.resources[resource] = 0;
                }
            }
        });
    }
    
    endTurn() {
        if (!this.state.hasRolled) {
            alert('You must roll the dice before ending your turn!');
            return;
        }
        
        // Apply production for the human player (their turn)
        const currentPlayer = this.state.getCurrentPlayer();
        this.applyProduction(currentPlayer);
        
        // Check victory condition
        if (this.checkVictory()) {
            return;
        }
        
        this.state.nextPlayer();
        this.ui.update();
        
        // If AI turn, play it
        if (this.state.getCurrentPlayer().isAI) {
            setTimeout(() => this.playAITurn(), 1000);
        }
    }
    
    checkVictory() {
        const activePlayers = this.state.players.filter(p => p.settlements.length > 0);
        
        if (activePlayers.length === 1) {
            alert(`${activePlayers[0].name} wins the game!`);
            this.state.phase = 'ended';
            return true;
        }
        
        return false;
    }
    
    // ===== AI HELPER METHODS =====
    
    aiEvaluateTrade(player, targetResource, targetAmount) {
        // Check if trading can help us get the target resource
        const needed = targetAmount - (player.resources[targetResource] || 0);
        if (needed <= 0) return null;
        
        // Only allow trading for raw resources (not crafted items)
        const rawResources = ['food', 'wood', 'water', 'ore', 'sand'];
        if (!rawResources.includes(targetResource)) {
            return null; // Cannot trade for crafted items (bricks, metal, weapons, etc.)
        }
        
        // Find resources we have 6+ of that we can trade away
        const tradeableResources = ['food', 'wood', 'water', 'ore', 'sand'];
        for (const resource of tradeableResources) {
            if (resource === targetResource) continue;
            if ((player.resources[resource] || 0) >= 6) {
                return { give: resource, receive: targetResource };
            }
        }
        return null;
    }
    
    aiGetResourceShortfall(player, recipe) {
        // Returns what resources are needed and how many
        const shortfall = {};
        for (const [resource, amount] of Object.entries(recipe)) {
            if (resource === 'requires') continue;
            const have = player.resources[resource] || 0;
            if (have < amount) {
                shortfall[resource] = amount - have;
            }
        }
        return shortfall;
    }
    
    aiAttemptTradeFor(player, recipe) {
        // Try to trade to afford a recipe
        const shortfall = this.aiGetResourceShortfall(player, recipe);
        if (Object.keys(shortfall).length === 0) return false;
        
        // Try to trade for each missing resource
        for (const [resource, amount] of Object.entries(shortfall)) {
            const trade = this.aiEvaluateTrade(player, resource, amount);
            if (trade) {
                console.log(`🤖 AI trading 6 ${trade.give} for 1 ${trade.receive}`);
                this.trade(trade.give, trade.receive);
                return true;
            }
        }
        return false;
    }
    
    aiFindValidCampLocation(player) {
        // Find a valid location to build a camp
        const validHexes = [];
        
        this.state.hexGrid.forEach(hex => {
            // Must be buildable terrain
            if (!['farmland', 'mountain', 'forest'].includes(hex.terrain)) return;
            // Must be empty
            if (hex.structure || hex.owner) return;
            
            // Must be within 3 tiles of existing settlement
            let nearSettlement = false;
            player.settlements.forEach(({q, r}) => {
                const dist = HexUtils.distance(hex.q, hex.r, q, r);
                if (dist <= 3) nearSettlement = true;
            });
            if (!nearSettlement) return;
            
            // Must not be too close to other settlements
            let tooClose = false;
            this.state.hexGrid.forEach(otherHex => {
                if (otherHex.structure && ['camp', 'settlement', 'town', 'city'].includes(otherHex.structure)) {
                    const dist = HexUtils.distance(hex.q, hex.r, otherHex.q, otherHex.r);
                    if (dist < 3) tooClose = true;
                }
            });
            if (tooClose) return;
            
            // Calculate score based on nearby resources
            let score = 0;
            const neighbors = HexUtils.getNeighbors(hex.q, hex.r);
            neighbors.forEach(({q, r}) => {
                const neighbor = this.state.getHex(q, r);
                if (neighbor) {
                    // Prefer diverse resources
                    if (neighbor.terrain === 'farmland') score += 3;
                    if (neighbor.terrain === 'forest') score += 2;
                    if (neighbor.terrain === 'mountain') score += 2;
                    if (neighbor.terrain === 'river') score += 3;
                }
            });
            
            validHexes.push({ hex, score });
        });
        
        if (validHexes.length === 0) return null;
        
        // Return the best location
        validHexes.sort((a, b) => b.score - a.score);
        return validHexes[0].hex;
    }
    
    aiEvaluateCombat(player) {
        // Find enemy hexes adjacent to our troops
        const opportunities = [];
        const humanPlayerId = 0; // Human is always player 0
        
        this.state.hexGrid.forEach(hex => {
            // Skip if no enemy presence
            if (!hex.owner || hex.owner === player.id) return;
            
            // Check if we have troops adjacent
            const neighbors = HexUtils.getNeighbors(hex.q, hex.r);
            neighbors.forEach(({q, r}) => {
                const neighborHex = this.state.getHex(q, r);
                if (!neighborHex) return;
                
                // Check if we have troops here
                if (neighborHex.troops && neighborHex.troops[player.id]) {
                    const ourTroops = neighborHex.troops[player.id];
                    const militaryTypes = ['archer', 'spearman', 'swordsman', 'axeman'];
                    const ourMilitary = militaryTypes.reduce((sum, type) => sum + (ourTroops[type] || 0), 0);
                    
                    if (ourMilitary > 0) {
                        // Calculate enemy strength
                        let enemyStrength = 0;
                        if (hex.troops && hex.troops[hex.owner]) {
                            const enemyTroops = hex.troops[hex.owner];
                            enemyStrength = militaryTypes.reduce((sum, type) => sum + (enemyTroops[type] || 0), 0);
                        }
                        
                        // Add settlement defense
                        if (hex.structure) {
                            enemyStrength += 5; // Rough estimate
                        }
                        
                        // Only attack if we have advantage
                        if (ourMilitary > enemyStrength * 1.5) {
                            // Calculate distance from our capital to enemy hex
                            let distanceFromCapital = 999;
                            if (player.capital) {
                                distanceFromCapital = HexUtils.distance(
                                    player.capital.q, player.capital.r,
                                    hex.q, hex.r
                                );
                            }
                            
                            opportunities.push({
                                fromHex: neighborHex,
                                toHex: hex,
                                ourStrength: ourMilitary,
                                enemyStrength: enemyStrength,
                                enemyPlayerId: hex.owner,
                                isHuman: hex.owner === humanPlayerId,
                                distanceFromCapital: distanceFromCapital,
                                isCapital: hex.isCapital
                            });
                        }
                    }
                }
            });
        });
        
        if (opportunities.length === 0) return null;
        
        // Sort opportunities by priority:
        // 1. Enemy capitals (highest priority)
        // 2. AI enemies that are closer than human player
        // 3. Closest enemies
        // 4. Highest strength advantage
        opportunities.sort((a, b) => {
            // Prioritize attacking capitals
            if (a.isCapital && !b.isCapital) return -1;
            if (!a.isCapital && b.isCapital) return 1;
            
            // AI vs AI combat: prefer closer targets
            if (!a.isHuman && !b.isHuman) {
                return a.distanceFromCapital - b.distanceFromCapital;
            }
            
            // If one is AI and one is human, prefer the closer one
            if (a.isHuman !== b.isHuman) {
                return a.distanceFromCapital - b.distanceFromCapital;
            }
            
            // Same type of enemy, prefer closer then stronger advantage
            const distDiff = a.distanceFromCapital - b.distanceFromCapital;
            if (Math.abs(distDiff) > 3) return distDiff; // Significantly closer
            
            // Similar distance, prefer higher advantage
            return (b.ourStrength - b.enemyStrength) - (a.ourStrength - a.enemyStrength);
        });
        
        return opportunities[0];
    }
    
    playAITurn() {
        const player = this.state.getCurrentPlayer();
        
        // Roll dice and get resource distribution (ALL players get terrain-based resources)
        const resourcesGained = this.rollDice();
        
        // Apply production ONLY for the AI player whose turn it is
        this.applyProduction(player);
        
        // Show human player what resources they received from the AI's dice roll
        const humanPlayer = this.state.players[0];
        const humanResources = resourcesGained[humanPlayer.id];
        const resourceList = Object.entries(humanResources)
            .filter(([_, amount]) => amount > 0)
            .map(([resource, amount]) => `${resource}: +${amount}`)
            .join(', ');
        
        if (resourceList) {
            console.log(`🎲 ${player.name} rolled ${this.state.lastRoll}: You received ${resourceList}`);
        } else {
            console.log(`🎲 ${player.name} rolled ${this.state.lastRoll}: You received no resources from this roll.`);
        }
        
        // Execute strategy-specific AI
        if (player.settlements.length > 0) {
            if (player.aiStrategy === 'economic') {
                this.aiRockefeller(player);
            } else if (player.aiStrategy === 'aggressive') {
                this.aiGeronimo(player);
            } else if (player.aiStrategy === 'defensive') {
                this.aiEisenhower(player);
            }
        }
        
        setTimeout(() => {
            if (this.checkVictory()) {
                return;
            }
            
            this.state.nextPlayer();
            this.ui.update();
            
            if (this.state.getCurrentPlayer().isAI) {
                setTimeout(() => this.playAITurn(), 1000);
            }
        }, 1500);
    }
    
    // ROCKEFELLER: Economic Snowball Strategy
    // Focus: Workers → Improvements → Expansion → Upgrades → Mass Military
    aiRockefeller(player) {
        let actionTaken = true;
        let iterations = 0;
        const maxIterations = 10;
        
        while (actionTaken && iterations < maxIterations) {
            actionTaken = false;
            iterations++;
            
            // Priority 1: Train economic units (workers, farmers) - aim for 8-10 each
            if (player.troops.worker < 10 && player.canAfford(RECIPES.worker)) {
                this.train('worker');
                console.log(`💰 Rockefeller trained worker (${player.troops.worker})`);
                actionTaken = true;
                continue;
            }
            
            if (player.troops.farmer < 10 && player.canAfford(RECIPES.farmer)) {
                this.train('farmer');
                console.log(`💰 Rockefeller trained farmer (${player.troops.farmer})`);
                actionTaken = true;
                continue;
            }
            
            // Priority 2: Build improvements on settlements
            player.settlements.forEach(({ q, r }) => {
                if (actionTaken) return;
                const hex = this.state.getHex(q, r);
                if (hex && (!hex.improvements || hex.improvements.length < 3)) {
                    if (!hex.improvements) hex.improvements = [];
                    
                    // Try to build well, farm, mine in that order
                    if (!hex.improvements.includes('well') && player.canAfford(RECIPES.well)) {
                        player.spend(RECIPES.well);
                        hex.improvements.push('well');
                        console.log(`💰 Rockefeller built well at settlement`);
                        actionTaken = true;
                        return;
                    }
                    if (!hex.improvements.includes('farm') && player.canAfford(RECIPES.farm)) {
                        player.spend(RECIPES.farm);
                        hex.improvements.push('farm');
                        console.log(`💰 Rockefeller built farm at settlement`);
                        actionTaken = true;
                        return;
                    }
                    if (!hex.improvements.includes('mine') && player.canAfford(RECIPES.mine)) {
                        player.spend(RECIPES.mine);
                        hex.improvements.push('mine');
                        console.log(`💰 Rockefeller built mine at settlement`);
                        actionTaken = true;
                        return;
                    }
                }
            });
            if (actionTaken) continue;
            
            // Priority 3: Expand - build camps (up to 4)
            if (player.settlements.length < 4 && player.canAfford(RECIPES.camp)) {
                const location = this.aiFindValidCampLocation(player);
                if (location) {
                    player.spend(RECIPES.camp);
                    location.structure = 'camp';
                    location.owner = player.id;
                    player.settlements.push({ q: location.q, r: location.r });
                    console.log(`💰 Rockefeller expanded! (${player.settlements.length} camps)`);
                    this.renderer.render();
                    actionTaken = true;
                    continue;
                }
            }
            
            // Priority 4: Upgrade settlements
            let upgraded = false;
            player.settlements.forEach(({ q, r }) => {
                if (upgraded) return;
                const hex = this.state.getHex(q, r);
                if (hex) {
                    if (hex.structure === 'camp' && player.canAfford(RECIPES['camp->settlement'])) {
                        player.spend(RECIPES['camp->settlement']);
                        hex.structure = 'settlement';
                        console.log(`💰 Rockefeller upgraded to settlement!`);
                        upgraded = true;
                        actionTaken = true;
                    } else if (hex.structure === 'settlement' && player.canAfford(RECIPES['settlement->town'])) {
                        player.spend(RECIPES['settlement->town']);
                        hex.structure = 'town';
                        console.log(`💰 Rockefeller upgraded to town!`);
                        upgraded = true;
                        actionTaken = true;
                    } else if (hex.structure === 'town' && player.canAfford(RECIPES['town->city'])) {
                        player.spend(RECIPES['town->city']);
                        hex.structure = 'city';
                        console.log(`💰 Rockefeller upgraded to city!`);
                        upgraded = true;
                        actionTaken = true;
                    }
                }
            });
            if (upgraded) continue;
            
            // Priority 5: Craft basic resources
            if ((player.resources.bricks || 0) < 20 && player.canAfford(RECIPES.bricks)) {
                this.craft('bricks');
                actionTaken = true;
                continue;
            }
            if ((player.resources.metal || 0) < 15 && player.canAfford(RECIPES.metal)) {
                this.craft('metal');
                actionTaken = true;
                continue;
            }
            
            // Priority 6: Build military infrastructure only after economy is strong
            if (player.troops.worker >= 8 && player.troops.farmer >= 8) {
                if (!player.hasBarracks && player.canAfford(RECIPES.barracks)) {
                    this.build('barracks');
                    console.log(`💰 Rockefeller built barracks!`);
                    actionTaken = true;
                    continue;
                }
                
                if (!player.hasBlacksmith && player.canAfford(RECIPES.blacksmith)) {
                    this.build('blacksmith');
                    console.log(`💰 Rockefeller built blacksmith!`);
                    actionTaken = true;
                    continue;
                }
                
                // Priority 7: Mass produce military units with superior economy
                if (player.hasBarracks && player.hasBlacksmith) {
                    // Craft weapons
                    if ((player.resources.bow || 0) < 5 && player.canAfford(RECIPES.bow)) {
                        this.craft('bow');
                        actionTaken = true;
                        continue;
                    }
                    if ((player.resources.spear || 0) < 3 && player.canAfford(RECIPES.spear)) {
                        this.craft('spear');
                        actionTaken = true;
                        continue;
                    }
                    if ((player.resources.sword || 0) < 2 && player.canAfford(RECIPES.sword)) {
                        this.craft('sword');
                        actionTaken = true;
                        continue;
                    }
                    
                    // Train military
                    if (player.canAfford(RECIPES.swordsman)) {
                        this.train('swordsman');
                        actionTaken = true;
                        continue;
                    }
                    if (player.canAfford(RECIPES.spearman)) {
                        this.train('spearman');
                        actionTaken = true;
                        continue;
                    }
                    if (player.canAfford(RECIPES.archer)) {
                        this.train('archer');
                        actionTaken = true;
                        continue;
                    }
                }
            }
            
            // Priority 8: Attack once we have overwhelming force
            const totalMilitary = player.troops.archer + player.troops.spearman + player.troops.swordsman + player.troops.axeman;
            if (totalMilitary >= 15) {
                const combatOp = this.aiEvaluateCombat(player);
                if (combatOp) {
                    const targetPlayer = this.state.players[combatOp.enemyPlayerId];
                    console.log(`💰 Rockefeller attacks ${targetPlayer.name} with overwhelming force!`);
                    const militaryTypes = ['archer', 'spearman', 'swordsman', 'axeman'];
                    const troopCounts = {};
                    militaryTypes.forEach(type => {
                        if (combatOp.fromHex.troops[player.id][type]) {
                            troopCounts[type] = combatOp.fromHex.troops[player.id][type];
                        }
                    });
                    this.deployTroops(combatOp.fromHex, combatOp.toHex, troopCounts);
                    actionTaken = true;
                    continue;
                }
            }
            
            // Priority 9: Trade excess resources
            if (this.aiTradeExcessResources(player)) {
                actionTaken = true;
                continue;
            }
        }
    }
    
    // GERONIMO: Archer Rush Strategy (with economy pivot)
    // Focus: Quick barracks → Mass archers → Attack early; if fails, pivot to economy for 15 turns
    aiGeronimo(player) {
        let actionTaken = true;
        let iterations = 0;
        const maxIterations = 10;
        
        // Initialize strategy data if needed
        if (!player.aiStrategyData.turnCount) {
            player.aiStrategyData.turnCount = 0;
        }
        player.aiStrategyData.turnCount++;
        
        // Check if we should pivot modes
        if (player.aiStrategyData.mode === 'aggressive' && player.aiStrategyData.failedAttacks >= 3) {
            // Failed to conquer anyone after 3 tries, pivot to economy
            player.aiStrategyData.mode = 'economic';
            player.aiStrategyData.pivotTurn = this.state.turnNumber;
            console.log(`⚔️ Geronimo pivoting to economy mode!`);
        } else if (player.aiStrategyData.mode === 'economic' && player.aiStrategyData.pivotTurn && 
                   (this.state.turnNumber - player.aiStrategyData.pivotTurn) >= 15) {
            // 15 turns have passed, back to aggressive
            player.aiStrategyData.mode = 'aggressive';
            player.aiStrategyData.failedAttacks = 0;
            console.log(`⚔️ Geronimo returning to aggressive mode!`);
        }
        
        while (actionTaken && iterations < maxIterations) {
            actionTaken = false;
            iterations++;
            
            if (player.aiStrategyData.mode === 'aggressive') {
                // AGGRESSIVE MODE: Rush to military
                
                // Priority 1: Build barracks ASAP
                if (!player.hasBarracks && player.canAfford(RECIPES.barracks)) {
                    this.build('barracks');
                    console.log(`⚔️ Geronimo built barracks!`);
                    actionTaken = true;
                    continue;
                }
                
                // Priority 2: Craft bows
                if (player.hasBarracks && (player.resources.bow || 0) < 10 && player.canAfford(RECIPES.bow)) {
                    this.craft('bow');
                    actionTaken = true;
                    continue;
                }
                
                // Priority 3: Mass produce archers
                if (player.hasBarracks && player.troops.archer < 15 && player.canAfford(RECIPES.archer)) {
                    this.train('archer');
                    console.log(`⚔️ Geronimo trained archer (${player.troops.archer})`);
                    actionTaken = true;
                    continue;
                }
                
                // Priority 4: Attack aggressively once we have archers
                if (player.troops.archer >= 5) {
                    const combatOp = this.aiEvaluateCombat(player);
                    if (combatOp) {
                        const targetPlayer = this.state.players[combatOp.enemyPlayerId];
                        console.log(`⚔️ Geronimo ARCHER RUSH targeting ${targetPlayer.name}!`);
                        const militaryTypes = ['archer', 'spearman', 'swordsman', 'axeman'];
                        const troopCounts = {};
                        militaryTypes.forEach(type => {
                            if (combatOp.fromHex.troops[player.id][type]) {
                                troopCounts[type] = combatOp.fromHex.troops[player.id][type];
                            }
                        });
                        this.deployTroops(combatOp.fromHex, combatOp.toHex, troopCounts);
                        player.aiStrategyData.failedAttacks = (player.aiStrategyData.failedAttacks || 0) + 1;
                        actionTaken = true;
                        continue;
                    }
                }
                
                // Priority 5: Basic resource production
                if (player.troops.farmer < 3 && player.canAfford(RECIPES.farmer)) {
                    this.train('farmer');
                    actionTaken = true;
                    continue;
                }
                
                // Priority 6: Craft basics
                if ((player.resources.bricks || 0) < 5 && player.canAfford(RECIPES.bricks)) {
                    this.craft('bricks');
                    actionTaken = true;
                    continue;
                }
                
            } else {
                // ECONOMIC MODE: Build up for 15 turns
                
                // Priority 1: Train economic units
                if (player.troops.worker < 8 && player.canAfford(RECIPES.worker)) {
                    this.train('worker');
                    console.log(`⚔️ Geronimo (economic mode) trained worker`);
                    actionTaken = true;
                    continue;
                }
                
                if (player.troops.farmer < 8 && player.canAfford(RECIPES.farmer)) {
                    this.train('farmer');
                    actionTaken = true;
                    continue;
                }
                
                // Priority 2: Build improvements
                player.settlements.forEach(({ q, r }) => {
                    if (actionTaken) return;
                    const hex = this.state.getHex(q, r);
                    if (hex && (!hex.improvements || hex.improvements.length < 2)) {
                        if (!hex.improvements) hex.improvements = [];
                        
                        if (!hex.improvements.includes('farm') && player.canAfford(RECIPES.farm)) {
                            player.spend(RECIPES.farm);
                            hex.improvements.push('farm');
                            console.log(`⚔️ Geronimo (economic mode) built farm`);
                            actionTaken = true;
                            return;
                        }
                        if (!hex.improvements.includes('well') && player.canAfford(RECIPES.well)) {
                            player.spend(RECIPES.well);
                            hex.improvements.push('well');
                            actionTaken = true;
                            return;
                        }
                    }
                });
                if (actionTaken) continue;
                
                // Priority 3: Upgrade settlements
                let upgraded = false;
                player.settlements.forEach(({ q, r }) => {
                    if (upgraded) return;
                    const hex = this.state.getHex(q, r);
                    if (hex) {
                        if (hex.structure === 'camp' && player.canAfford(RECIPES['camp->settlement'])) {
                            player.spend(RECIPES['camp->settlement']);
                            hex.structure = 'settlement';
                            console.log(`⚔️ Geronimo (economic mode) upgraded settlement`);
                            upgraded = true;
                            actionTaken = true;
                        }
                    }
                });
                if (upgraded) continue;
                
                // Priority 4: Craft basic resources
                if ((player.resources.bricks || 0) < 10 && player.canAfford(RECIPES.bricks)) {
                    this.craft('bricks');
                    actionTaken = true;
                    continue;
                }
                if ((player.resources.metal || 0) < 5 && player.canAfford(RECIPES.metal)) {
                    this.craft('metal');
                    actionTaken = true;
                    continue;
                }
            }
            
            // Trade excess resources
            if (this.aiTradeExcessResources(player)) {
                actionTaken = true;
                continue;
            }
        }
    }
    
    // EISENHOWER: Fortress Network Strategy
    // Focus: Build 2-3 camps → Build forts → Economic development → Advance fortress line
    aiEisenhower(player) {
        let actionTaken = true;
        let iterations = 0;
        const maxIterations = 10;
        
        while (actionTaken && iterations < maxIterations) {
            actionTaken = false;
            iterations++;
            
            // Priority 1: Expand to 3 camps first
            if (player.settlements.length < 3 && player.canAfford(RECIPES.camp)) {
                const location = this.aiFindValidCampLocation(player);
                if (location) {
                    player.spend(RECIPES.camp);
                    location.structure = 'camp';
                    location.owner = player.id;
                    player.settlements.push({ q: location.q, r: location.r });
                    player.aiStrategyData.campsBuilt = player.settlements.length;
                    console.log(`🏰 Eisenhower expanded! (${player.settlements.length} camps)`);
                    this.renderer.render();
                    actionTaken = true;
                    continue;
                }
            }
            
            // Priority 2: Build forts to protect settlements (after having 2+ camps)
            if (player.settlements.length >= 2) {
                // Check if we have forts protecting our settlements
                let needsFort = false;
                player.settlements.forEach(({ q, r }) => {
                    // Check if there's a fort within 2 tiles
                    let hasFortProtection = false;
                    const hexesInRange = HexUtils.getHexesInRange(q, r, 2);
                    hexesInRange.forEach(({ q: fq, r: fr }) => {
                        const hex = this.state.getHex(fq, fr);
                        if (hex && hex.structure === 'fort' && hex.owner === player.id) {
                            hasFortProtection = true;
                        }
                    });
                    if (!hasFortProtection) {
                        needsFort = true;
                    }
                });
                
                if (needsFort && player.canAfford(RECIPES.fort)) {
                    // Find a good location for a fort (near settlements but not too close)
                    const fortLocations = [];
                    player.settlements.forEach(({ q, r }) => {
                        const hexesNearby = HexUtils.getHexesInRange(q, r, 2);
                        hexesNearby.forEach(({ q: fq, r: fr }) => {
                            const hex = this.state.getHex(fq, fr);
                            if (hex && !hex.structure && !hex.owner) {
                                const dist = HexUtils.distance(q, r, fq, fr);
                                if (dist >= 1 && dist <= 2) {
                                    fortLocations.push({ hex, distance: dist });
                                }
                            }
                        });
                    });
                    
                    if (fortLocations.length > 0) {
                        // Pick closest location to settlement
                        fortLocations.sort((a, b) => a.distance - b.distance);
                        const fortHex = fortLocations[0].hex;
                        player.spend(RECIPES.fort);
                        fortHex.structure = 'fort';
                        fortHex.owner = player.id;
                        player.aiStrategyData.fortsBuilt = (player.aiStrategyData.fortsBuilt || 0) + 1;
                        console.log(`🏰 Eisenhower built fort! (${player.aiStrategyData.fortsBuilt} total)`);
                        this.renderer.render();
                        actionTaken = true;
                        continue;
                    }
                }
            }
            
            // Priority 3: Train economic units
            if (player.troops.worker < 6 && player.canAfford(RECIPES.worker)) {
                this.train('worker');
                actionTaken = true;
                continue;
            }
            
            if (player.troops.farmer < 6 && player.canAfford(RECIPES.farmer)) {
                this.train('farmer');
                actionTaken = true;
                continue;
            }
            
            // Priority 4: Build improvements on settlements
            player.settlements.forEach(({ q, r }) => {
                if (actionTaken) return;
                const hex = this.state.getHex(q, r);
                if (hex && (!hex.improvements || hex.improvements.length < 2)) {
                    if (!hex.improvements) hex.improvements = [];
                    
                    if (!hex.improvements.includes('well') && player.canAfford(RECIPES.well)) {
                        player.spend(RECIPES.well);
                        hex.improvements.push('well');
                        console.log(`🏰 Eisenhower built well`);
                        actionTaken = true;
                        return;
                    }
                    if (!hex.improvements.includes('farm') && player.canAfford(RECIPES.farm)) {
                        player.spend(RECIPES.farm);
                        hex.improvements.push('farm');
                        actionTaken = true;
                        return;
                    }
                }
            });
            if (actionTaken) continue;
            
            // Priority 5: Craft basic resources
            if ((player.resources.bricks || 0) < 15 && player.canAfford(RECIPES.bricks)) {
                this.craft('bricks');
                actionTaken = true;
                continue;
            }
            if ((player.resources.metal || 0) < 10 && player.canAfford(RECIPES.metal)) {
                this.craft('metal');
                actionTaken = true;
                continue;
            }
            
            // Priority 6: Build military infrastructure
            if (!player.hasBarracks && player.canAfford(RECIPES.barracks)) {
                this.build('barracks');
                console.log(`🏰 Eisenhower built barracks!`);
                actionTaken = true;
                continue;
            }
            
            // Priority 7: Train defensive troops and station at forts
            if (player.hasBarracks) {
                // Craft weapons
                if ((player.resources.bow || 0) < 3 && player.canAfford(RECIPES.bow)) {
                    this.craft('bow');
                    actionTaken = true;
                    continue;
                }
                
                // Train troops
                if (player.canAfford(RECIPES.archer)) {
                    this.train('archer');
                    actionTaken = true;
                    continue;
                }
                
                if (!player.hasBlacksmith && player.canAfford(RECIPES.blacksmith)) {
                    this.build('blacksmith');
                    console.log(`🏰 Eisenhower built blacksmith!`);
                    actionTaken = true;
                    continue;
                }
                
                if (player.hasBlacksmith) {
                    if ((player.resources.spear || 0) < 2 && player.canAfford(RECIPES.spear)) {
                        this.craft('spear');
                        actionTaken = true;
                        continue;
                    }
                    if (player.canAfford(RECIPES.spearman)) {
                        this.train('spearman');
                        actionTaken = true;
                        continue;
                    }
                }
            }
            
            // Priority 8: Upgrade settlements
            let upgraded = false;
            player.settlements.forEach(({ q, r }) => {
                if (upgraded) return;
                const hex = this.state.getHex(q, r);
                if (hex) {
                    if (hex.structure === 'camp' && player.canAfford(RECIPES['camp->settlement'])) {
                        player.spend(RECIPES['camp->settlement']);
                        hex.structure = 'settlement';
                        console.log(`🏰 Eisenhower upgraded settlement!`);
                        upgraded = true;
                        actionTaken = true;
                    } else if (hex.structure === 'settlement' && player.canAfford(RECIPES['settlement->town'])) {
                        player.spend(RECIPES['settlement->town']);
                        hex.structure = 'town';
                        upgraded = true;
                        actionTaken = true;
                    }
                }
            });
            if (upgraded) continue;
            
            // Priority 9: Only attack when we have strong defensive position and superior force
            const totalMilitary = player.troops.archer + player.troops.spearman + player.troops.swordsman + player.troops.axeman;
            if (totalMilitary >= 20 && player.aiStrategyData.fortsBuilt >= 2) {
                const combatOp = this.aiEvaluateCombat(player);
                if (combatOp && combatOp.ourStrength > combatOp.enemyStrength * 2) {
                    const targetPlayer = this.state.players[combatOp.enemyPlayerId];
                    console.log(`🏰 Eisenhower advances fortress line against ${targetPlayer.name}!`);
                    const militaryTypes = ['archer', 'spearman', 'swordsman', 'axeman'];
                    const troopCounts = {};
                    militaryTypes.forEach(type => {
                        if (combatOp.fromHex.troops[player.id][type]) {
                            troopCounts[type] = combatOp.fromHex.troops[player.id][type];
                        }
                    });
                    this.deployTroops(combatOp.fromHex, combatOp.toHex, troopCounts);
                    actionTaken = true;
                    continue;
                }
            }
            
            // Trade excess resources
            if (this.aiTradeExcessResources(player)) {
                actionTaken = true;
                continue;
            }
        }
    }
    
    aiTradeExcessResources(player) {
        // Trade any resource we have 12+ of for something useful (raw resources only)
        const usefulResources = ['food', 'wood', 'water', 'ore', 'sand'];
        let traded = false;
        Object.entries(player.resources).forEach(([resource, amount]) => {
            if (traded) return;
            if (amount >= 12) {
                // Find a useful raw resource we're low on
                for (const target of usefulResources) {
                    if ((player.resources[target] || 0) < 10 && resource !== target && usefulResources.includes(resource)) {
                        this.trade(resource, target);
                        console.log(`🤖 ${player.name} traded excess ${resource} for ${target}`);
                        traded = true;
                        break;
                    }
                }
            }
        });
        return traded;
    }
    
    craft(item) {
        const player = this.state.getCurrentPlayer();
        const recipe = RECIPES[item];
        
        if (!recipe) return;
        
        // Check requirements
        if (recipe.requires === 'blacksmith' && !player.hasBlacksmith) {
            alert('Requires blacksmith!');
            return;
        }
        if (recipe.requires === 'shipyard' && !player.hasShipyard) {
            alert('Requires shipyard!');
            return;
        }
        
        if (player.canAfford(recipe)) {
            player.spend(recipe);
            player.addResource(item, 1);
            this.ui.update();
        } else {
            alert('Insufficient resources!');
        }
    }
    
    craftMultiple(item, count) {
        const player = this.state.getCurrentPlayer();
        const recipe = RECIPES[item];
        
        if (!recipe) return;
        
        // Check requirements
        if (recipe.requires === 'blacksmith' && !player.hasBlacksmith) {
            alert('Requires blacksmith!');
            return;
        }
        if (recipe.requires === 'shipyard' && !player.hasShipyard) {
            alert('Requires shipyard!');
            return;
        }
        
        // Check if we can afford count items
        let canAffordCount = true;
        Object.entries(recipe).forEach(([resource, amount]) => {
            if (resource === 'requires') return;
            if ((player.resources[resource] || 0) < amount * count) {
                canAffordCount = false;
            }
        });
        
        if (!canAffordCount) {
            alert(`Insufficient resources to craft ${count} ${item}!`);
            return;
        }
        
        // Craft all at once
        Object.entries(recipe).forEach(([resource, amount]) => {
            if (resource === 'requires') return;
            player.resources[resource] -= amount * count;
        });
        player.addResource(item, count);
        
        this.ui.update();
        // Update action menu to reflect new resource levels
        this.ui.showActionMenu('craft');
    }
    
    build(structure) {
        const player = this.state.getCurrentPlayer();
        const recipe = RECIPES[structure];
        
        if (!recipe) return;
        
        if (player.canAfford(recipe)) {
            // Global unlocks (don't need placement)
            if (structure === 'blacksmith') {
                player.spend(recipe);
                player.hasBlacksmith = true;
                alert('Blacksmith built! You can now craft advanced weapons.');
                this.ui.update();
            } else if (structure === 'shipyard') {
                player.spend(recipe);
                player.hasShipyard = true;
                alert('Shipyard built! You can now craft boats.');
                this.ui.update();
            } else if (structure === 'barracks') {
                player.spend(recipe);
                player.hasBarracks = true;
                alert('Barracks built! You can now train military units.');
                this.ui.update();
            } 
            // Improvements that attach to settlements (don't occupy space)
            else if (['well', 'mine', 'farm', 'lumberyard'].includes(structure)) {
                player.spend(recipe);
                this.state.buildMode = structure;
                alert(`${structure} purchased! Click on one of your settlements to add it.`);
                this.updateBuildModeDisplay();
                this.ui.update();
            }
            // Structures that need placement on map
            else if (['camp', 'fort'].includes(structure)) {
                // Check camp limit (max 6)
                if (structure === 'camp') {
                    if (player.settlements.length >= 6) {
                        alert('You have built the maximum number of camps (6). Conquer enemy capitals to exceed this limit.');
                        return;
                    }
                }
                this.state.buildMode = structure;
                this.state.buildRecipe = recipe;
                alert(`Ready to build ${structure}! Click on a valid hex to place it. Resources will be spent when placed.`);
                this.updateBuildModeDisplay();
            }
        } else {
            alert('Insufficient resources!');
        }
    }
    
    train(troopType) {
        const player = this.state.getCurrentPlayer();
        const recipe = RECIPES[troopType];
        
        if (!recipe) return;
        
        // Check if barracks needed
        const militaryUnits = ['archer', 'spearman', 'swordsman', 'axeman'];
        if (militaryUnits.includes(troopType) && !player.hasBarracks) {
            alert('Requires barracks!');
            return;
        }
        
        if (player.canAfford(recipe)) {
            player.spend(recipe);
            player.troops[troopType]++;
            
            // Place troop on first settlement
            if (player.settlements.length > 0) {
                const settlement = player.settlements[0];
                const hex = this.state.getHex(settlement.q, settlement.r);
                if (hex) {
                    if (!hex.troops) hex.troops = {};
                    if (!hex.troops[player.id]) hex.troops[player.id] = {};
                    hex.troops[player.id][troopType] = (hex.troops[player.id][troopType] || 0) + 1;
                }
            }
            
            this.renderer.render();
            this.ui.update();
            // Update action menu to reflect new resource levels
            this.ui.showActionMenu('train');
        } else {
            alert('Insufficient resources!');
        }
    }
    
    improve(upgradeType) {
        const player = this.state.getCurrentPlayer();
        const recipe = RECIPES[upgradeType];
        
        if (!recipe) return;
        
        if (player.canAfford(recipe)) {
            player.spend(recipe);
            
            if (upgradeType === 'barracks->college') {
                player.hasMilitaryCollege = true;
                alert('Barracks upgraded to Military College!');
            } else {
                alert(`Upgrade available! Select a hex to upgrade its ${upgradeType.split('->')[0]}.`);
                this.state.upgradeMode = upgradeType;
            }
            
            this.ui.update();
        } else {
            alert('Insufficient resources!');
        }
    }
    
    trade(giveResource, receiveResource) {
        const player = this.state.getCurrentPlayer();
        
        if (player.resources[giveResource] >= 6) {
            player.resources[giveResource] -= 6;
            player.addResource(receiveResource, 1);
            this.ui.update();
            this.ui.showActionMenu('trade');
        } else {
            alert('Need 6 of the resource to trade!');
        }
    }
    
    tradeMultiple(giveResource, receiveResource, count) {
        const player = this.state.getCurrentPlayer();
        const maxTrades = Math.floor(player.resources[giveResource] / 6);
        const actualTrades = Math.min(count, maxTrades);
        
        if (actualTrades <= 0) {
            alert('Need at least 6 of the resource to trade!');
            return;
        }
        
        player.resources[giveResource] -= actualTrades * 6;
        player.addResource(receiveResource, actualTrades);
        this.ui.update();
        this.ui.showActionMenu('trade');
    }
    
    deployTroops(fromHex, toHex, troopCounts) {
        const player = this.state.getCurrentPlayer();
        
        // Validate adjacent
        const neighbors = HexUtils.getNeighbors(fromHex.q, fromHex.r);
        const isAdjacent = neighbors.some(({q, r}) => q === toHex.q && r === toHex.r);
        
        if (!isAdjacent) {
            alert('Can only move troops to adjacent hexes!');
            return;
        }
        
        // Initialize troop storage if needed
        if (!fromHex.troops[player.id]) fromHex.troops[player.id] = {};
        if (!toHex.troops) toHex.troops = {};
        if (!toHex.troops[player.id]) toHex.troops[player.id] = {};
        
        // Move troops
        Object.entries(troopCounts).forEach(([troopType, count]) => {
            if (count > 0 && fromHex.troops[player.id][troopType] >= count) {
                fromHex.troops[player.id][troopType] -= count;
                toHex.troops[player.id][troopType] = (toHex.troops[player.id][troopType] || 0) + count;
            }
        });
        
        // Check for combat
        if (toHex.owner !== null && toHex.owner !== player.id) {
            this.initiateCombat(toHex, player.id, toHex.owner);
        }
        
        this.renderer.render();
    }
    
    initiateCombat(hex, attackerId, defenderId) {
        const combat = {
            hex: hex,
            attacker: attackerId,
            defender: defenderId,
            attackerTroops: {...hex.troops[attackerId]},
            defenderTroops: {...hex.troops[defenderId]},
            round: 1
        };
        
        this.state.activeCombat = combat;
        this.ui.showCombatUI(combat);
    }
    
    resolveCombatRound(retreat = false) {
        const combat = this.state.activeCombat;
        if (!combat) return;
        
        if (retreat) {
            // Attacker retreats
            alert('Attacker retreated!');
            combat.hex.troops[combat.attacker] = {};
            this.state.activeCombat = null;
            this.ui.hideCombatUI();
            this.renderer.render();
            return;
        }
        
        // Roll 2d6
        const roll1 = Math.floor(Math.random() * 6) + 1;
        const roll2 = Math.floor(Math.random() * 6) + 1;
        const totalRoll = roll1 + roll2;
        
        // Calculate attack percentages based on roll
        const attackPercent = this.getAttackPercent(totalRoll);
        
        // Attacker attacks first
        this.applyCombatDamage(combat.attackerTroops, combat.defenderTroops, attackPercent, combat.hex);
        
        // Defender retaliates
        if (this.hasTroops(combat.defenderTroops)) {
            this.applyCombatDamage(combat.defenderTroops, combat.attackerTroops, attackPercent, combat.hex);
        }
        
        // Settlement damage to attackers
        if (combat.hex.structure && !this.hasTroops(combat.defenderTroops)) {
            const structDef = SETTLEMENT_DEFENSE[combat.hex.structure];
            if (structDef) {
                this.applySettlementDamage(combat.attackerTroops, structDef.damage);
            }
        }
        
        combat.round++;
        
        // Check if combat is over
        if (!this.hasTroops(combat.attackerTroops)) {
            alert('Attacker defeated!');
            combat.hex.troops[combat.attacker] = {};
            this.state.activeCombat = null;
            this.ui.hideCombatUI();
        } else if (!this.hasTroops(combat.defenderTroops) && combat.hex.structure) {
            // Attack settlement
            const structDef = SETTLEMENT_DEFENSE[combat.hex.structure];
            structDef.health -= this.calculateTotalAttack(combat.attackerTroops);
            
            if (structDef.health <= 0) {
                // Check if this is a capital
                const defenderPlayer = this.state.players[combat.defender];
                const isCapital = combat.hex.isCapital || 
                    (defenderPlayer.capital && combat.hex.q === defenderPlayer.capital.q && combat.hex.r === defenderPlayer.capital.r);
                
                if (isCapital) {
                    alert(`Capital conquered! ${defenderPlayer.name} is eliminated!`);
                    this.conquerCapital(combat.attacker, combat.defender, combat.hex);
                } else {
                    alert('Settlement conquered!');
                    combat.hex.owner = combat.attacker;
                    // Keep structure but transfer ownership
                    const attacker = this.state.players[combat.attacker];
                    attacker.settlements.push({ q: combat.hex.q, r: combat.hex.r });
                    // Remove from defender
                    defenderPlayer.settlements = defenderPlayer.settlements.filter(
                        s => !(s.q === combat.hex.q && s.r === combat.hex.r)
                    );
                }
                this.state.activeCombat = null;
                this.ui.hideCombatUI();
            }
        } else if (!this.hasTroops(combat.defenderTroops)) {
            alert('Defender defeated!');
            combat.hex.owner = combat.attacker;
            combat.hex.troops[combat.defender] = {};
            this.state.activeCombat = null;
            this.ui.hideCombatUI();
        }
        
        // Update troops on hex
        combat.hex.troops[combat.attacker] = combat.attackerTroops;
        combat.hex.troops[combat.defender] = combat.defenderTroops;
        
        if (this.state.activeCombat) {
            this.ui.showCombatUI(combat);
        }
        
        this.renderer.render();
    }
    
    conquerCapital(attackerId, defenderId, capitalHex) {
        const attacker = this.state.players[attackerId];
        const defender = this.state.players[defenderId];
        
        // Transfer ALL resources from defender to attacker
        Object.keys(defender.resources).forEach(resource => {
            attacker.resources[resource] += defender.resources[resource];
            defender.resources[resource] = 0;
        });
        
        // Destroy all defender's other settlements
        defender.settlements.forEach(({ q, r }) => {
            const hex = this.state.getHex(q, r);
            if (hex && !(hex.q === capitalHex.q && hex.r === capitalHex.r)) {
                hex.structure = null;
                hex.owner = null;
                hex.improvements = [];
            }
        });
        
        // Destroy ALL defender's troops across entire map
        this.state.hexGrid.forEach(hex => {
            if (hex.troops && hex.troops[defenderId]) {
                hex.troops[defenderId] = {};
            }
        });
        
        // Reset defender's troops count
        Object.keys(defender.troops).forEach(troopType => {
            defender.troops[troopType] = 0;
        });
        
        // Clear defender's settlements and capital
        defender.settlements = [];
        defender.capital = null;
        
        // Destroy improvements at capital
        capitalHex.improvements = [];
        
        // Transfer capital to attacker (as a camp at its current upgrade level)
        capitalHex.owner = attackerId;
        capitalHex.isCapital = false; // No longer a capital
        attacker.settlements.push({ q: capitalHex.q, r: capitalHex.r });
        
        this.renderer.render();
        this.ui.update();
        
        console.log(`🏛️ ${attacker.name} conquered ${defender.name}'s capital!`);
    }
    
    getAttackPercent(roll) {
        const percents = {
            1: 0.05, 2: 0.10, 3: 0.20, 4: 0.40, 5: 0.60,
            6: 0.80, 7: 1.00, 8: 0.80, 9: 0.60, 10: 0.40,
            11: 0.10, 12: 0.05
        };
        return percents[roll] || 0.40;
    }
    
    applyCombatDamage(attackerTroops, defenderTroops, attackPercent, hex) {
        const militaryTypes = ['archer', 'spearman', 'swordsman', 'axeman'];
        
        // Calculate total attack with bonuses
        let totalAttack = 0;
        militaryTypes.forEach(type => {
            const count = attackerTroops[type] || 0;
            if (count > 0) {
                const stats = COMBAT_STATS[type];
                let attack = stats.attack * count;
                
                // Apply bonuses against specific enemy types
                if (stats.bonus) {
                    Object.keys(stats.bonus).forEach(enemyType => {
                        if (defenderTroops[enemyType] > 0) {
                            attack += stats.bonus[enemyType] * count;
                        }
                    });
                }
                
                totalAttack += attack;
            }
        });
        
        // Apply attack percentage
        const damage = Math.floor(totalAttack * attackPercent);
        
        // Apply damage to defenders
        this.applyDamageToTroops(defenderTroops, damage);
    }
    
    applyDamageToTroops(troops, damage) {
        const militaryTypes = ['archer', 'spearman', 'swordsman', 'axeman'];
        let remainingDamage = damage;
        
        // Apply damage in order of troop type
        for (const type of militaryTypes) {
            while ((troops[type] || 0) > 0 && remainingDamage > 0) {
                const stats = COMBAT_STATS[type];
                if (remainingDamage >= stats.health) {
                    troops[type]--;
                    remainingDamage -= stats.health;
                } else {
                    break;
                }
            }
        }
    }
    
    applySettlementDamage(troops, damage) {
        this.applyDamageToTroops(troops, damage);
    }
    
    hasTroops(troopObj) {
        const militaryTypes = ['archer', 'spearman', 'swordsman', 'axeman'];
        return militaryTypes.some(type => (troopObj[type] || 0) > 0);
    }
    
    calculateTotalAttack(troops) {
        const militaryTypes = ['archer', 'spearman', 'swordsman', 'axeman'];
        let total = 0;
        militaryTypes.forEach(type => {
            const count = troops[type] || 0;
            if (count > 0) {
                const stats = COMBAT_STATS[type];
                total += stats.attack * count;
            }
        });
        return total;
    }
    
    // ===== SAVE/LOAD SYSTEM =====
    
    saveGame() {
        try {
            const saveData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                state: {
                    currentPlayerIndex: this.state.currentPlayerIndex,
                    turnNumber: this.state.turnNumber,
                    phase: this.state.phase,
                    lastRoll: this.state.lastRoll,
                    hasRolled: this.state.hasRolled
                },
                players: this.state.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    isAI: p.isAI,
                    resources: { ...p.resources },
                    troops: { ...p.troops },
                    settlements: [...p.settlements],
                    capital: p.capital ? { ...p.capital } : null,
                    hasBlacksmith: p.hasBlacksmith,
                    hasShipyard: p.hasShipyard,
                    hasBarracks: p.hasBarracks,
                    aiStrategy: p.aiStrategy,
                    aiStrategyData: { ...p.aiStrategyData }
                })),
                hexGrid: []
            };
            
            // Convert hex grid map to array
            this.state.hexGrid.forEach((hex, key) => {
                saveData.hexGrid.push({
                    q: hex.q,
                    r: hex.r,
                    terrain: hex.terrain,
                    number: hex.number,
                    structure: hex.structure,
                    owner: hex.owner,
                    troops: hex.troops,
                    improvements: [...(hex.improvements || [])],
                    isCapital: hex.isCapital || false
                });
            });
            
            // Save to localStorage
            localStorage.setItem('hexsim_save', JSON.stringify(saveData));
            alert('Game saved successfully!');
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            alert('Failed to save game: ' + error.message);
            return false;
        }
    }
    
    loadGame() {
        try {
            const saveDataString = localStorage.getItem('hexsim_save');
            if (!saveDataString) {
                alert('No saved game found!');
                return false;
            }
            
            const saveData = JSON.parse(saveDataString);
            
            // Restore players
            this.state.players = saveData.players.map(pData => {
                const player = new Player(pData.id, pData.name, pData.isAI);
                player.resources = { ...pData.resources };
                player.troops = { ...pData.troops };
                player.settlements = [...pData.settlements];
                player.capital = pData.capital || null;
                player.hasBlacksmith = pData.hasBlacksmith;
                player.hasShipyard = pData.hasShipyard;
                player.hasBarracks = pData.hasBarracks;
                player.aiStrategy = pData.aiStrategy || null;
                player.aiStrategyData = pData.aiStrategyData || {};
                return player;
            });
            
            // Restore hex grid
            this.state.hexGrid.clear();
            saveData.hexGrid.forEach(hexData => {
                const hex = new Hex(hexData.q, hexData.r, hexData.terrain, hexData.number);
                hex.structure = hexData.structure;
                hex.owner = hexData.owner;
                hex.troops = hexData.troops || {};
                hex.improvements = hexData.improvements || [];
                hex.isCapital = hexData.isCapital || false;
                this.state.setHex(hex.q, hex.r, hex);
            });
            
            // Restore game state
            this.state.currentPlayerIndex = saveData.state.currentPlayerIndex;
            this.state.turnNumber = saveData.state.turnNumber;
            this.state.phase = saveData.state.phase;
            this.state.lastRoll = saveData.state.lastRoll;
            this.state.hasRolled = saveData.state.hasRolled;
            
            // Update UI and rendering
            this.renderer.render();
            this.ui.update();
            
            alert('Game loaded successfully!');
            return true;
        } catch (error) {
            console.error('Error loading game:', error);
            alert('Failed to load game: ' + error.message);
            return false;
        }
    }
    
    newGame() {
        if (this.state.phase !== 'setup') {
            const confirm = window.confirm('Are you sure you want to start a new game? Current progress will be lost unless saved.');
            if (!confirm) return;
        }
        
        // Reset the game
        this.state = new GameState();
        
        // Re-initialize
        this.init();
    }
    
    updateBuildModeDisplay() {
        const statusDiv = document.getElementById('current-player');
        if (this.state.buildMode) {
            const originalText = statusDiv.textContent;
            statusDiv.textContent = `${originalText} | BUILD MODE: ${this.state.buildMode.toUpperCase()}`;
            statusDiv.style.backgroundColor = '#f39c12';
            statusDiv.style.color = 'white';
        } else {
            statusDiv.style.backgroundColor = '';
            statusDiv.style.color = '';
        }
    }
}

// ===== UI CONTROLLER =====
class UI {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('roll-dice').addEventListener('click', () => {
            this.game.rollDice();
        });
        
        document.getElementById('end-turn').addEventListener('click', () => {
            this.game.endTurn();
        });
        
        // Save/Load/New Game buttons
        document.getElementById('save-game').addEventListener('click', () => {
            this.game.saveGame();
        });
        
        document.getElementById('load-game').addEventListener('click', () => {
            this.game.loadGame();
        });
        
        document.getElementById('new-game').addEventListener('click', () => {
            this.game.newGame();
        });
        
        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Clear any active modes when switching actions
                this.game.state.buildMode = null;
                this.game.state.buildRecipe = null;
                this.game.state.deployMode = false;
                this.game.state.deployFrom = null;
                this.game.state.upgradeMode = null;
                
                const action = e.target.dataset.action;
                this.showActionMenu(action);
                
                // Update display
                this.update();
            });
        });
        
        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('modal').classList.add('hidden');
        });
    }
    
    update() {
        const player = this.game.state.getCurrentPlayer();
        
        // Update all resources (basic + crafted items)
        const allResources = ['food', 'ore', 'water', 'wood', 'sand', 'bricks', 'metal', 'gold', 
                              'bow', 'spear', 'sword', 'axe&shield', 'boat'];
        allResources.forEach(resource => {
            const elem = document.getElementById(resource);
            if (elem) {
                elem.textContent = Math.floor(player.resources[resource] || 0);
            }
        });
        
        // Calculate and update production
        const production = { food: 0, ore: 0, water: 0, wood: 0, sand: 0 };
        Object.entries(player.troops).forEach(([troopType, count]) => {
            const stats = TROOP_STATS[troopType];
            if (stats && stats.produces) {
                Object.entries(stats.produces).forEach(([resource, amount]) => {
                    if (production.hasOwnProperty(resource)) {
                        production[resource] += amount * count;
                    }
                });
            }
        });
        
        Object.keys(production).forEach(resource => {
            const elem = document.getElementById(`prod-${resource}`);
            if (elem) {
                elem.textContent = `+${production[resource]}`;
            }
        });
        
        // Calculate and update consumption
        const consumption = { food: 0, water: 0, wood: 0 };
        Object.entries(player.troops).forEach(([troopType, count]) => {
            const stats = TROOP_STATS[troopType];
            if (stats && stats.consumes) {
                Object.entries(stats.consumes).forEach(([resource, amount]) => {
                    if (consumption.hasOwnProperty(resource)) {
                        consumption[resource] += amount * count;
                    }
                });
            }
        });
        
        Object.keys(consumption).forEach(resource => {
            const elem = document.getElementById(`cons-${resource}`);
            if (elem) {
                elem.textContent = `-${consumption[resource]}`;
            }
        });
        
        // Update troops
        Object.keys(player.troops).forEach(troop => {
            const elem = document.getElementById(`count-${troop}`);
            if (elem) {
                elem.textContent = player.troops[troop];
            }
        });
        
        // Update current player
        document.getElementById('current-player').textContent = 
            `Current: ${player.name} (Turn ${this.game.state.turnNumber})`;
        
        // Update build mode display if active
        this.game.updateBuildModeDisplay();
        
        // Enable/disable roll button
        const rollBtn = document.getElementById('roll-dice');
        rollBtn.disabled = this.game.state.hasRolled || player.isAI;
        
        const endBtn = document.getElementById('end-turn');
        endBtn.disabled = player.isAI;
        
        // Save/Load buttons are always enabled (can save/load anytime)
        // New Game button is always enabled
        
        // Check if save exists and update load button text
        const loadBtn = document.getElementById('load-game');
        const saveData = localStorage.getItem('hexsim_save');
        if (saveData) {
            try {
                const parsed = JSON.parse(saveData);
                const saveDate = new Date(parsed.timestamp);
                loadBtn.title = `Last saved: ${saveDate.toLocaleString()}`;
            } catch (e) {
                loadBtn.title = 'Load saved game';
            }
        } else {
            loadBtn.title = 'No saved game found';
        }
        
        // Show/hide action menu
        if (this.game.state.phase === 'playing' && !player.isAI) {
            document.getElementById('action-menu').classList.remove('hidden');
        } else {
            document.getElementById('action-menu').classList.add('hidden');
        }
    }
    
    showActionMenu(action) {
        const detailsDiv = document.getElementById('action-details');
        detailsDiv.innerHTML = '';
        
        const player = this.game.state.getCurrentPlayer();
        
        if (action === 'craft') {
            const craftItems = ['bricks', 'bow', 'metal', 'gold', 'spear', 'sword', 'axe&shield', 'boat'];
            craftItems.forEach(item => {
                const recipe = RECIPES[item];
                const canAfford = player.canAfford(recipe);
                
                // Calculate how many can be crafted
                let maxCraftable = 999;
                Object.entries(recipe).forEach(([resource, amount]) => {
                    if (resource === 'requires') return;
                    const available = player.resources[resource] || 0;
                    const canMake = Math.floor(available / amount);
                    maxCraftable = Math.min(maxCraftable, canMake);
                });
                
                const div = document.createElement('div');
                div.className = `action-item ${canAfford ? '' : 'insufficient'}`;
                div.innerHTML = `
                    <div class="action-item-title">${item}</div>
                    <div class="action-item-cost">Cost: ${this.formatRecipe(recipe)}</div>
                    <div class="craft-buttons">
                        <button class="craft-btn" data-count="1" title="${this.formatRecipe(recipe)}">Craft 1</button>
                        <button class="craft-btn" data-count="5" title="Cost: ${this.getMultiRecipeCost(recipe, 5)}">Craft 5</button>
                        <button class="craft-btn" data-count="10" title="Cost: ${this.getMultiRecipeCost(recipe, 10)}">Craft 10</button>
                        <button class="craft-btn craft-max" data-count="${maxCraftable}" title="Cost: ${this.getMultiRecipeCost(recipe, maxCraftable)}">Craft Max (${maxCraftable})</button>
                    </div>
                `;
                
                // Add event listeners to craft buttons
                div.querySelectorAll('.craft-btn').forEach(btn => {
                    const count = parseInt(btn.dataset.count);
                    if (count > 0 && count <= maxCraftable) {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.game.craftMultiple(item, count);
                        });
                    } else {
                        btn.disabled = true;
                        btn.style.opacity = '0.5';
                    }
                });
                
                detailsDiv.appendChild(div);
            });
        } else if (action === 'build') {
            const buildings = ['well', 'mine', 'barracks', 'farm', 'camp', 'lumberyard', 'blacksmith', 'shipyard', 'fort'];
            buildings.forEach(building => {
                const recipe = RECIPES[building];
                let canAfford = player.canAfford(recipe);
                
                // Check camp limit
                let disabled = false;
                let disabledMessage = '';
                if (building === 'camp' && player.settlements.length >= 6) {
                    disabled = true;
                    canAfford = false;
                    disabledMessage = ' (Max camps reached - conquer enemy capitals to exceed limit)';
                }
                
                const div = document.createElement('div');
                div.className = `action-item ${(canAfford && !disabled) ? '' : 'insufficient'}`;
                div.innerHTML = `
                    <div class="action-item-title">${building}${disabledMessage}</div>
                    <div class="action-item-cost">Cost: ${this.formatRecipe(recipe)}</div>
                `;
                
                if (canAfford && !disabled) {
                    div.addEventListener('click', () => this.game.build(building));
                } else if (disabled) {
                    div.title = 'You have built the maximum number of camps';
                }
                
                detailsDiv.appendChild(div);
            });
        } else if (action === 'improve') {
            const upgrades = ['camp->settlement', 'settlement->town', 'town->city', 'barracks->college'];
            upgrades.forEach(upgrade => {
                const recipe = RECIPES[upgrade];
                const canAfford = player.canAfford(recipe);
                
                const div = document.createElement('div');
                div.className = `action-item ${canAfford ? '' : 'insufficient'}`;
                div.innerHTML = `
                    <div class="action-item-title">${upgrade}</div>
                    <div class="action-item-cost">Cost: ${this.formatRecipe(recipe)}</div>
                `;
                
                if (canAfford) {
                    div.addEventListener('click', () => this.game.improve(upgrade));
                }
                
                detailsDiv.appendChild(div);
            });
        } else if (action === 'train') {
            const troops = ['farmer', 'hunter', 'worker', 'archer', 'spearman', 'swordsman', 'axeman', 'sailor'];
            troops.forEach(troop => {
                const recipe = RECIPES[troop];
                const canAfford = player.canAfford(recipe);
                
                const div = document.createElement('div');
                div.className = `action-item ${canAfford ? '' : 'insufficient'}`;
                
                const stats = TROOP_STATS[troop];
                let statsText = '';
                if (stats) {
                    const prod = Object.entries(stats.produces).map(([r, a]) => `+${a} ${r}`).join(', ');
                    const cons = Object.entries(stats.consumes).map(([r, a]) => `-${a} ${r}`).join(', ');
                    statsText = `<div class="action-item-reward">Produces: ${prod || 'none'} | Consumes: ${cons || 'none'}</div>`;
                }
                
                div.innerHTML = `
                    <div class="action-item-title">${troop}</div>
                    <div class="action-item-cost">Cost: ${this.formatRecipe(recipe)}</div>
                    ${statsText}
                `;
                
                if (canAfford) {
                    div.addEventListener('click', () => this.game.train(troop));
                }
                
                detailsDiv.appendChild(div);
            });
        } else if (action === 'deploy') {
            detailsDiv.innerHTML = `
                <p>Click on a hex with your troops, then click an adjacent hex to move troops there.</p>
                <p>If you move into enemy territory, combat will begin!</p>
            `;
            this.game.state.deployMode = true;
        } else if (action === 'trade') {
            detailsDiv.innerHTML = '<h3>Trade Resources</h3><p>Trade 6 of any resource for 1 of any desired resource</p>';
            
            const resourceIcons = {
                food: '🌾',
                ore: '⛰️',
                water: '💧',
                wood: '🪵',
                sand: '🏖️'
            };
            
            const resources = ['food', 'ore', 'water', 'wood', 'sand'];
            resources.forEach(giveRes => {
                const maxTrades = Math.floor(player.resources[giveRes] / 6);
                if (maxTrades >= 1) {
                    const tradeDiv = document.createElement('div');
                    tradeDiv.style.marginTop = '10px';
                    tradeDiv.style.borderTop = '1px solid #444';
                    tradeDiv.style.paddingTop = '8px';
                    tradeDiv.innerHTML = `<strong>Give ${resourceIcons[giveRes]} ${giveRes} (have ${player.resources[giveRes]}, can trade ${maxTrades}x):</strong>`;
                    
                    resources.forEach(receiveRes => {
                        if (receiveRes !== giveRes) {
                            const receiveDiv = document.createElement('div');
                            receiveDiv.style.marginTop = '6px';
                            receiveDiv.style.marginLeft = '10px';
                            receiveDiv.innerHTML = `<span style="display: inline-block; width: 100px;">For ${resourceIcons[receiveRes]} ${receiveRes}:</span>`;
                            
                            // Trade 1 button
                            const btn1 = document.createElement('button');
                            btn1.textContent = 'Trade 1';
                            btn1.className = 'action-btn trade-btn';
                            btn1.style.marginLeft = '5px';
                            btn1.style.fontSize = '10px';
                            btn1.style.padding = '4px 8px';
                            btn1.addEventListener('click', () => this.game.trade(giveRes, receiveRes));
                            receiveDiv.appendChild(btn1);
                            
                            // Trade Max button
                            const btnMax = document.createElement('button');
                            btnMax.textContent = `Trade Max (${maxTrades})`;
                            btnMax.className = 'action-btn trade-btn trade-max';
                            btnMax.style.marginLeft = '5px';
                            btnMax.style.fontSize = '10px';
                            btnMax.style.padding = '4px 8px';
                            btnMax.addEventListener('click', () => this.game.tradeMultiple(giveRes, receiveRes, maxTrades));
                            receiveDiv.appendChild(btnMax);
                            
                            tradeDiv.appendChild(receiveDiv);
                        }
                    });
                    
                    detailsDiv.appendChild(tradeDiv);
                }
            });
            
            if (detailsDiv.children.length === 1) {
                const noTradeDiv = document.createElement('div');
                noTradeDiv.style.marginTop = '10px';
                noTradeDiv.innerHTML = '<p><em>You need at least 6 of a resource to trade.</em></p>';
                detailsDiv.appendChild(noTradeDiv);
            }
        }
    }
    
    showCombatUI(combat) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        const attackerTroops = Object.entries(combat.attackerTroops)
            .filter(([type, count]) => count > 0)
            .map(([type, count]) => `${count} ${type}(s)`)
            .join('<br>');
        
        const defenderTroops = Object.entries(combat.defenderTroops)
            .filter(([type, count]) => count > 0)
            .map(([type, count]) => `${count} ${type}(s)`)
            .join('<br>');
        
        modalBody.innerHTML = `
            <div class="combat-panel">
                <h2>Combat - Round ${combat.round}</h2>
                <div class="combat-stats">
                    <div class="combat-side combat-attacker">
                        <h3>Attacker</h3>
                        ${attackerTroops || 'No troops'}
                    </div>
                    <div class="combat-side combat-defender">
                        <h3>Defender</h3>
                        ${defenderTroops || 'No troops'}
                    </div>
                </div>
                <div class="combat-actions">
                    <button class="combat-btn combat-roll">Roll Dice & Attack</button>
                    <button class="combat-btn combat-retreat">Retreat</button>
                </div>
            </div>
        `;
        
        modal.querySelector('.combat-roll').addEventListener('click', () => {
            this.game.resolveCombatRound(false);
        });
        
        modal.querySelector('.combat-retreat').addEventListener('click', () => {
            this.game.resolveCombatRound(true);
        });
        
        modal.classList.remove('hidden');
        modal.style.display = 'block';
    }
    
    hideCombatUI() {
        const modal = document.getElementById('modal');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    
    showDeployDialog(fromHex, toHex) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const player = this.game.state.getCurrentPlayer();
        
        const troops = fromHex.troops[player.id] || {};
        const militaryTypes = ['archer', 'spearman', 'swordsman', 'axeman'];
        
        let html = `
            <h2>Deploy Troops</h2>
            <p>From: (${fromHex.q}, ${fromHex.r}) → To: (${toHex.q}, ${toHex.r})</p>
            <div id="deploy-controls">
        `;
        
        militaryTypes.forEach(type => {
            const count = troops[type] || 0;
            if (count > 0) {
                html += `
                    <div style="margin: 10px 0;">
                        <label>${type}: ${count} available</label><br>
                        <input type="number" id="deploy-${type}" min="0" max="${count}" value="0" style="width: 100px;">
                    </div>
                `;
            }
        });
        
        html += `
            </div>
            <button id="confirm-deploy" class="btn-primary" style="margin-top: 15px;">Deploy</button>
            <button id="cancel-deploy" class="btn-secondary" style="margin-top: 15px;">Cancel</button>
        `;
        
        modalBody.innerHTML = html;
        
        document.getElementById('confirm-deploy').addEventListener('click', () => {
            const troopCounts = {};
            militaryTypes.forEach(type => {
                const input = document.getElementById(`deploy-${type}`);
                if (input) {
                    troopCounts[type] = parseInt(input.value) || 0;
                }
            });
            
            this.game.deployTroops(fromHex, toHex, troopCounts);
            modal.classList.add('hidden');
            modal.style.display = 'none';
        });
        
        document.getElementById('cancel-deploy').addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        });
        
        modal.classList.remove('hidden');
        modal.style.display = 'block';
    }
    
    formatRecipe(recipe) {
        const icons = {
            food: '🌾', ore: '⛰️', water: '💧', wood: '🪵', sand: '🏖️',
            bricks: '🧱', metal: '⚙️', gold: '💰',
            bow: '🏹', spear: '🗡️', sword: '⚔️', 'axe&shield': '🪓', boat: '⛵'
        };
        
        return Object.entries(recipe)
            .filter(([k]) => k !== 'requires')
            .map(([resource, amount]) => `${amount} ${icons[resource] || ''}${resource}`)
            .join(', ');
    }
    
    getMultiRecipeCost(recipe, count) {
        const icons = {
            food: '🌾', ore: '⛰️', water: '💧', wood: '🪵', sand: '🏖️',
            bricks: '🧱', metal: '⚙️', gold: '💰',
            bow: '🏹', spear: '🗡️', sword: '⚔️', 'axe&shield': '🪓', boat: '⛵'
        };
        
        return Object.entries(recipe)
            .filter(([k]) => k !== 'requires')
            .map(([resource, amount]) => `${amount * count} ${icons[resource] || ''}${resource}`)
            .join(', ');
    }
    
    showHexDetails(hex) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        let html = `
            <h2>Hex Details</h2>
            <p><strong>Position:</strong> (${hex.q}, ${hex.r})</p>
            <p><strong>Terrain:</strong> ${hex.terrain}</p>
            <p><strong>Number:</strong> ${hex.number}</p>
        `;
        
        if (hex.structure) {
            html += `<p><strong>Structure:</strong> ${hex.structure}</p>`;
        }
        
        if (hex.owner !== null) {
            html += `<p><strong>Owner:</strong> ${this.game.state.players[hex.owner].name}</p>`;
        }
        
        // Show improvements if any
        if (hex.improvements && hex.improvements.length > 0) {
            html += '<h3>Improvements:</h3><ul>';
            hex.improvements.forEach(improvement => {
                html += `<li>${improvement}</li>`;
            });
            html += '</ul>';
        }
        
        // Show troops if any
        if (hex.troops && Object.keys(hex.troops).length > 0) {
            html += '<h3>Troops:</h3><ul>';
            Object.entries(hex.troops).forEach(([playerId, troops]) => {
                const playerName = this.game.state.players[playerId].name;
                Object.entries(troops).forEach(([troopType, count]) => {
                    if (count > 0) {
                        html += `<li>${playerName}: ${count} ${troopType}(s)</li>`;
                    }
                });
            });
            html += '</ul>';
        }
        
        modalBody.innerHTML = html;
        modal.classList.remove('hidden');
        modal.style.display = 'block';
    }
}

// ===== INITIALIZE GAME =====
let game;

window.addEventListener('load', () => {
    game = new Game();
    game.init();
});
