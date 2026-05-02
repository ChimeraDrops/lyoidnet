# HexSim - Strategy Game

A hexagonal board strategy game inspired by Catan and Civilization, built with HTML5 Canvas and vanilla JavaScript.

## How to Play

### Setup
1. Open `index.html` in a web browser
2. The game will generate a random 600-hex board with 6 terrain types
3. Place your first camp on a farmland tile (must be 6+ tiles away from other camps)
4. AI players will automatically place their camps
5. Game begins once all camps are placed

### Game Flow
Each turn consists of:
1. **Roll Dice** - Roll a d20 to generate resources from tiles
2. **Take Actions** - Use the action menu to:
   - **Craft** - Create items and weapons
   - **Build** - Construct buildings and facilities
   - **Improve** - Upgrade settlements
   - **Train** - Create troops
   - **Deploy** - Move troops to adjacent hexes
   - **Trade** - Exchange 6 of any resource for 1 of another
3. **End Turn** - Pass to next player

### Resources
- **Food** - From farmland and sea tiles
- **Ore** - From mountain tiles
- **Water** - From river tiles
- **Wood** - From forest tiles
- **Sand** - From desert tiles

### Buildings
- **Camp** → **Settlement** → **Town** → **City** (upgradable, increases resource production)
- **Well** - Generates +1 water when adjacent water tiles roll
- **Mine** - Generates +1 ore when adjacent mountain tiles roll
- **Farm** - Generates +1 food when adjacent food tiles roll
- **Lumberyard** - Generates +1 wood when adjacent forest tiles roll
- **Barracks** - Allows training of military units
- **Blacksmith** - Allows crafting advanced weapons
- **Shipyard** - Allows crafting boats
- **Fort** - Provides defense and protects nearby settlements

### Troops
**Workers:**
- Farmer, Hunter, Worker - Generate resources but consume food/water

**Military:**
- Archer (Health: 5, Attack: 1)
- Spearman (Health: 10, Attack: 2)
- Swordsman (Health: 15, Attack: 2)
- Axeman (Health: 25, Attack: 4)

**Special:**
- Sailor - Requires boat, generates food/water but consumes wood

### Combat
- Move troops to enemy territory to initiate combat
- Combat uses 2d6 rolls to determine attack effectiveness
- Rock-paper-scissors bonuses:
  - Archer bonus vs Axeman
  - Spearman bonus vs Archer
  - Swordsman bonus vs Spearman
  - Axeman bonus vs Swordsman
- Attacker can retreat after each round
- Defeat all defending troops to conquer territory

### Victory Condition
Conquer all enemy settlements to win!

## Controls
- **Pan** - Click and drag the board
- **Zoom** - Mouse wheel to zoom in/out
- **Select Hex** - Click on any hex to view details
- **Actions** - Use the action menu on the right side

## Tips
1. Build economy first - train workers and farmers
2. Manage consumption - troops consume resources each turn
3. Upgrade settlements to increase resource production
4. Protect settlements with forts
5. Balance military and economic development
6. **Protect your capital!** If your capital is conquered, you lose all other camps and troops
7. Use bulk crafting (Craft Max button) to quickly produce resources
8. You can build a maximum of 6 camps, but conquering enemy capitals lets you exceed this limit
9. Each AI player has a distinct strategy - adapt your tactics accordingly

## Technical Details
- **Board Size**: ~817 hexagonal tiles (radius 16)
- **Terrain Types**: 6 (balanced distribution - ~137 tiles each)
- **Number Distribution**: 1-12, randomly distributed
- **Players**: 1 human + 3 AI with distinct strategies
  - **Rockefeller**: Economic Snowball - focuses on workers, improvements, expansion, then overwhelming military
  - **Geronimo**: Archer Rush - aggressive early attacks with archers; pivots to economy for 15 turns if unsuccessful, then returns to aggression
  - **Eisenhower**: Fortress Network - builds camps first, then forts for defense, develops economy behind fortress line
- **Camp Limit**: Maximum 6 camps per player (can exceed by conquering enemy capitals)
- **Capital System**: First camp is your capital; if conquered, all other camps are destroyed and all resources are transferred

Built with vanilla JavaScript, HTML5 Canvas, and minimalist CSS design.
