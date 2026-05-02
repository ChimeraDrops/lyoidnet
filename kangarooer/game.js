// Game Configuration
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 40;
const ROWS = CANVAS_HEIGHT / GRID_SIZE;
const COLS = CANVAS_WIDTH / GRID_SIZE;

// Game State
let canvas, ctx;
let gameState = 'playing'; // 'playing', 'gameOver', 'levelComplete'
let score = 0;
let level = 1;
let lives = 3;
let baseSpeed = 0.05;

// Player
let player = {
    x: 7,
    y: 14,
    width: GRID_SIZE - 4,
    height: GRID_SIZE - 4
};

// Game Objects
let vehicles = [];
let snakes = [];
let crocodiles = [];
let koalas = [];
let trees = [];

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
    
    setupLevel();
    setupEventListeners();
    gameLoop();
}

function setupLevel() {
    vehicles = [];
    snakes = [];
    crocodiles = [];
    koalas = [];
    trees = [];
    
    const speedMultiplier = 1 + (level - 1) * 0.15;
    
    // Create vehicle lanes (rows 10-13)
    createVehicleLane(10, 0.15 * speedMultiplier, 'right', 3);
    createVehicleLane(11, 0.1 * speedMultiplier, 'left', 4);
    createVehicleLane(12, 0.19 * speedMultiplier, 'right', 2);
    createVehicleLane(13, 0.13 * speedMultiplier, 'left', 3);
    
    // Create snakes (fewer, more dangerous)
    createSnake(11, 0.125 * speedMultiplier, 'left');
    if (level > 1) {
        createSnake(12, 0.15 * speedMultiplier, 'right');
    }
    
    // Create eucalyptus trees in center (rows 7-8)
    for (let i = 0; i < 5; i++) {
        trees.push({
            x: i * 3 + 1,
            y: 7,
            width: GRID_SIZE - 5,
            height: GRID_SIZE - 5
        });
    }
    
    // Create koalas on trees
    trees.forEach(tree => {
        koalas.push({
            x: tree.x,
            y: tree.y,
            attackRadius: 1.5,
            width: GRID_SIZE - 10,
            height: GRID_SIZE - 10
        });
    });
    
    // Create crocodiles in water (rows 1-5)
    for (let row = 1; row <= 5; row++) {
        const numCrocs = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numCrocs; i++) {
            crocodiles.push({
                x: Math.random() * COLS,
                y: row,
                size: Math.random() > 0.5 ? 2 : 1, // Varying sizes
                speed: (Math.random() * 0.04 + 0.04) * speedMultiplier,
                direction: Math.random() > 0.5 ? 1 : -1,
                width: GRID_SIZE - 5,
                height: GRID_SIZE - 5
            });
        }
    }
}

function createVehicleLane(row, speed, direction, count) {
    const spacing = COLS / count;
    for (let i = 0; i < count; i++) {
        vehicles.push({
            x: i * spacing + Math.random() * spacing,
            y: row,
            speed: speed,
            direction: direction === 'right' ? 1 : -1,
            type: Math.random() > 0.5 ? 'landcruiser' : 'jeep',
            width: GRID_SIZE * 1.5 - 5,
            height: GRID_SIZE - 5
        });
    }
}

function createSnake(row, speed, direction) {
    snakes.push({
        x: Math.random() * COLS,
        y: row,
        speed: speed,
        direction: direction === 'right' ? 1 : -1,
        width: GRID_SIZE * 1.2 - 5,
        height: GRID_SIZE - 8,
        laneChangeTimer: 0,
        laneChangeCooldown: 60 + Math.random() * 120
    });
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    if (e.code === 'Space') {
        if (gameState === 'gameOver') {
            resetGame();
        } else if (gameState === 'levelComplete') {
            level++;
            score += 100;
            player.x = 7;
            player.y = 14;
            setupLevel();
            gameState = 'playing';
            document.getElementById('levelComplete').classList.add('hidden');
        }
        return;
    }
    
    if (gameState !== 'playing') return;
    
    const oldX = player.x;
    const oldY = player.y;
    
    switch(e.code) {
        case 'ArrowUp':
            player.y = Math.max(0, player.y - 1);
            break;
        case 'ArrowDown':
            player.y = Math.min(ROWS - 1, player.y + 1);
            break;
        case 'ArrowLeft':
            player.x = Math.max(0, player.x - 1);
            break;
        case 'ArrowRight':
            player.x = Math.min(COLS - 1, player.x + 1);
            break;
    }
    
    // Check immediate collision after move
    if (checkCollisions()) {
        player.x = oldX;
        player.y = oldY;
    }
    
    // Check if reached goal
    if (player.y === 0) {
        gameState = 'levelComplete';
        document.getElementById('levelComplete').classList.remove('hidden');
        document.getElementById('levelScore').textContent = score;
    }
}

function update() {
    if (gameState !== 'playing') return;
    
    // Update vehicles
    vehicles.forEach(vehicle => {
        vehicle.x += vehicle.speed * vehicle.direction * baseSpeed;
        
        if (vehicle.direction > 0 && vehicle.x > COLS + 2) {
            vehicle.x = -2;
        } else if (vehicle.direction < 0 && vehicle.x < -2) {
            vehicle.x = COLS + 2;
        }
    });
    
    // Update snakes with lane changing ability
    snakes.forEach(snake => {
        snake.x += snake.speed * snake.direction * baseSpeed;
        
        if (snake.direction > 0 && snake.x > COLS + 2) {
            snake.x = -2;
        } else if (snake.direction < 0 && snake.x < -2) {
            snake.x = COLS + 2;
        }
        
        // Lane changing logic
        snake.laneChangeTimer++;
        if (snake.laneChangeTimer > snake.laneChangeCooldown) {
            // Check if there's a vehicle nearby to dodge or player to attack
            const playerNearby = Math.abs(snake.x - player.x) < 3 && Math.abs(snake.y - player.y) < 2;
            const shouldChange = playerNearby || Math.random() < 0.3;
            
            if (shouldChange && snake.y >= 10 && snake.y <= 13) {
                const direction = Math.random() > 0.5 ? 1 : -1;
                const newY = snake.y + direction;
                if (newY >= 10 && newY <= 13) {
                    snake.y = newY;
                }
            }
            
            snake.laneChangeTimer = 0;
            snake.laneChangeCooldown = 60 + Math.random() * 120;
        }
    });
    
    // Update crocodiles
    crocodiles.forEach(croc => {
        croc.x += croc.speed * croc.direction * baseSpeed;
        
        if (croc.direction > 0 && croc.x > COLS + 1) {
            croc.x = -1;
        } else if (croc.direction < 0 && croc.x < -1) {
            croc.x = COLS + 1;
        }
    });
    
    // Check collisions
    checkCollisions();
}

function checkCollisions() {
    const playerCenterX = player.x + 0.5;
    const playerCenterY = player.y + 0.5;
    
    // Check vehicle collisions
    for (let vehicle of vehicles) {
        if (checkBoxCollision(player, {
            x: vehicle.x * GRID_SIZE,
            y: vehicle.y * GRID_SIZE,
            width: vehicle.width,
            height: vehicle.height
        })) {
            playerHit('vehicle');
            return true;
        }
    }
    
    // Check snake collisions
    for (let snake of snakes) {
        if (checkBoxCollision(player, {
            x: snake.x * GRID_SIZE,
            y: snake.y * GRID_SIZE,
            width: snake.width,
            height: snake.height
        })) {
            playerHit('snake');
            return true;
        }
    }
    
    // Check koala attack radius
    for (let koala of koalas) {
        const distance = Math.sqrt(
            Math.pow(playerCenterX - (koala.x + 0.5), 2) +
            Math.pow(playerCenterY - (koala.y + 0.5), 2)
        );
        
        if (distance < koala.attackRadius) {
            playerHit('koala');
            return true;
        }
    }
    
    // Check crocodile collisions (instant death)
    for (let croc of crocodiles) {
        if (Math.floor(playerCenterX) === Math.floor(croc.x) && 
            Math.floor(playerCenterY) === Math.floor(croc.y)) {
            playerHit('crocodile');
            return true;
        }
    }
    
    // Check if in water without a platform (rows 1-5)
    if (player.y >= 1 && player.y <= 5) {
        playerHit('water');
        return true;
    }
    
    return false;
}

function checkBoxCollision(obj1, obj2) {
    const obj1Pixel = {
        x: obj1.x * GRID_SIZE + 2,
        y: obj1.y * GRID_SIZE + 2,
        width: obj1.width,
        height: obj1.height
    };
    
    return obj1Pixel.x < obj2.x + obj2.width &&
           obj1Pixel.x + obj1Pixel.width > obj2.x &&
           obj1Pixel.y < obj2.y + obj2.height &&
           obj1Pixel.y + obj1Pixel.height > obj2.y;
}

function playerHit(cause) {
    lives--;
    updateLivesDisplay();
    
    if (lives <= 0) {
        gameState = 'gameOver';
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = score;
    } else {
        // Reset player position
        player.x = 7;
        player.y = 14;
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw zones
    drawZones();
    
    // Draw water (rows 1-5)
    ctx.fillStyle = '#4682b4';
    ctx.fillRect(0, GRID_SIZE, CANVAS_WIDTH, GRID_SIZE * 5);
    
    // Draw road (rows 10-13)
    ctx.fillStyle = '#2f2f2f';
    ctx.fillRect(0, GRID_SIZE * 10, CANVAS_WIDTH, GRID_SIZE * 4);
    
    // Draw road markings
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    for (let i = 10; i < 14; i++) {
        ctx.beginPath();
        ctx.moveTo(0, GRID_SIZE * i + GRID_SIZE / 2);
        ctx.lineTo(CANVAS_WIDTH, GRID_SIZE * i + GRID_SIZE / 2);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Draw safe zone with grass (rows 7-8)
    ctx.fillStyle = '#7cfc00';
    ctx.fillRect(0, GRID_SIZE * 7, CANVAS_WIDTH, GRID_SIZE * 2);
    
    // Draw goal zone (row 0)
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(0, 0, CANVAS_WIDTH, GRID_SIZE);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 GOAL 🏆', CANVAS_WIDTH / 2, GRID_SIZE / 2 + 7);
    
    // Draw trees
    trees.forEach(tree => {
        drawTree(tree.x, tree.y);
    });
    
    // Draw koalas
    koalas.forEach(koala => {
        drawKoala(koala.x, koala.y);
        
        // Draw attack radius when player is close
        const distance = Math.sqrt(
            Math.pow(player.x + 0.5 - (koala.x + 0.5), 2) +
            Math.pow(player.y + 0.5 - (koala.y + 0.5), 2)
        );
        
        if (distance < koala.attackRadius + 1) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                (koala.x + 0.5) * GRID_SIZE,
                (koala.y + 0.5) * GRID_SIZE,
                koala.attackRadius * GRID_SIZE,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }
    });
    
    // Draw crocodiles
    crocodiles.forEach(croc => {
        drawCrocodile(croc.x, croc.y, croc.size);
    });
    
    // Draw vehicles
    vehicles.forEach(vehicle => {
        drawVehicle(vehicle);
    });
    
    // Draw snakes
    snakes.forEach(snake => {
        drawSnake(snake);
    });
    
    // Draw player (kangaroo)
    drawKangaroo(player.x, player.y);
    
    // Draw grid (debug)
    // drawGrid();
}

function drawZones() {
    // Starting zone (rows 14)
    ctx.fillStyle = '#deb887';
    ctx.fillRect(0, GRID_SIZE * 14, CANVAS_WIDTH, GRID_SIZE);
}

function drawKangaroo(x, y) {
    const centerX = x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = y * GRID_SIZE + GRID_SIZE / 2;
    
    // Body
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - 12, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.fillStyle = '#a0522d';
    ctx.beginPath();
    ctx.ellipse(centerX - 5, centerY - 18, 3, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 5, centerY - 18, 3, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 10);
    ctx.quadraticCurveTo(centerX + 15, centerY + 15, centerX + 10, centerY + 5);
    ctx.stroke();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 13, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 3, centerY - 13, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawVehicle(vehicle) {
    const x = vehicle.x * GRID_SIZE;
    const y = vehicle.y * GRID_SIZE + GRID_SIZE / 2 - vehicle.height / 2;
    
    // Vehicle body
    ctx.fillStyle = vehicle.type === 'landcruiser' ? '#8b0000' : '#4a4a4a';
    ctx.fillRect(x, y, vehicle.width, vehicle.height);
    
    // Windows
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(x + 5, y + 5, vehicle.width - 10, vehicle.height - 15);
    
    // Wheels
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 10, y + vehicle.height, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + vehicle.width - 10, y + vehicle.height, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawSnake(snake) {
    const x = snake.x * GRID_SIZE;
    const y = snake.y * GRID_SIZE + GRID_SIZE / 2 - snake.height / 2;
    
    // Snake body (wavy)
    ctx.fillStyle = '#006400';
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = snake.height;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + snake.height / 2);
    
    const segments = 3;
    for (let i = 0; i <= segments; i++) {
        const segX = x + (snake.width / segments) * i;
        const segY = y + snake.height / 2 + Math.sin(Date.now() / 200 + i) * 5;
        ctx.lineTo(segX, segY);
    }
    
    ctx.stroke();
    
    // Snake head
    ctx.fillStyle = '#ff0000';
    const headX = snake.direction > 0 ? x + snake.width : x;
    ctx.beginPath();
    ctx.arc(headX, y + snake.height / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(headX + (snake.direction > 0 ? 2 : -2), y + snake.height / 2 - 2, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawTree(x, y) {
    const centerX = x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = y * GRID_SIZE + GRID_SIZE / 2;
    
    // Trunk
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(centerX - 5, centerY, 10, GRID_SIZE / 2);
    
    // Leaves (eucalyptus style)
    ctx.fillStyle = '#228b22';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 5, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX - 8, centerY + 2, 10, 8, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 8, centerY + 2, 10, 8, 0.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawKoala(x, y) {
    const centerX = x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = y * GRID_SIZE + GRID_SIZE / 2 - 10;
    
    // Body
    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.arc(centerX - 6, centerY - 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 6, centerY - 12, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Ear inner
    ctx.fillStyle = '#ffc0cb';
    ctx.beginPath();
    ctx.arc(centerX - 6, centerY - 12, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 6, centerY - 12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 6, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 9, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 3, centerY - 9, 1.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawCrocodile(x, y, size) {
    const centerX = x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = y * GRID_SIZE + GRID_SIZE / 2;
    const scale = size;
    
    // Body
    ctx.fillStyle = '#2f4f2f';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 15 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.ellipse(centerX - 12 * scale, centerY, 8 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail
    ctx.beginPath();
    ctx.moveTo(centerX + 15 * scale, centerY);
    ctx.lineTo(centerX + 20 * scale, centerY - 5 * scale);
    ctx.lineTo(centerX + 25 * scale, centerY);
    ctx.lineTo(centerX + 20 * scale, centerY + 5 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Eyes (menacing)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(centerX - 10 * scale, centerY - 3 * scale, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Teeth
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX - 15 * scale + i * 4, centerY + 2);
        ctx.lineTo(centerX - 13 * scale + i * 4, centerY + 5);
        ctx.lineTo(centerX - 11 * scale + i * 4, centerY + 2);
        ctx.fill();
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
    }
    
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(CANVAS_WIDTH, i * GRID_SIZE);
        ctx.stroke();
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLevel() {
    document.getElementById('level').textContent = level;
}

function updateLivesDisplay() {
    const hearts = '❤️'.repeat(Math.max(0, lives));
    document.getElementById('lives').textContent = hearts || '💀';
}

function resetGame() {
    gameState = 'playing';
    score = 0;
    level = 1;
    lives = 3;
    player.x = 7;
    player.y = 14;
    
    updateScore();
    updateLevel();
    updateLivesDisplay();
    
    setupLevel();
    document.getElementById('gameOver').classList.add('hidden');
}

function gameLoop() {
    update();
    draw();
    updateScore();
    updateLevel();
    requestAnimationFrame(gameLoop);
}

// Start game when page loads
window.addEventListener('load', init);
