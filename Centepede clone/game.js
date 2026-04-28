// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'menu'; // menu, playing, paused, gameOver
let score = 0;
let lives = 3;
let level = 1;
let animationId;

// Game constants
const PLAYER_SIZE = 20;
const BULLET_SIZE = 4;
const MUSHROOM_SIZE = 20;
const CENTIPEDE_SEGMENT_SIZE = 16;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const CENTIPEDE_SPEED = 2;

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: PLAYER_SPEED,
    color: '#00ff88'
};

// Arrays for game objects
let bullets = [];
let mushrooms = [];
let centipede = [];
let enemies = [];

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        shoot();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Button event listeners
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('pauseButton').addEventListener('click', togglePause);
document.getElementById('restartButton').addEventListener('click', restartGame);

// Initialize mushrooms
function initMushrooms() {
    mushrooms = [];
    const rows = 15;
    const cols = 20;
    const spacing = canvas.width / cols;
    
    for (let i = 0; i < 40; i++) {
        const x = Math.floor(Math.random() * cols) * spacing + spacing / 2;
        const y = Math.floor(Math.random() * rows) * spacing + spacing;
        
        // Don't place mushrooms in player area (bottom 100px)
        if (y < canvas.height - 100) {
            mushrooms.push({
                x: x,
                y: y,
                width: MUSHROOM_SIZE,
                height: MUSHROOM_SIZE,
                health: 3,
                color: '#ff00ff'
            });
        }
    }
}

// Initialize centipede
function initCentipede() {
    centipede = [];
    const segmentCount = 10 + (level - 1) * 2;
    const startX = canvas.width / 2;
    const startY = 30;
    
    for (let i = 0; i < segmentCount; i++) {
        centipede.push({
            x: startX - i * CENTIPEDE_SEGMENT_SIZE,
            y: startY,
            width: CENTIPEDE_SEGMENT_SIZE,
            height: CENTIPEDE_SEGMENT_SIZE,
            speedX: CENTIPEDE_SPEED,
            speedY: 0,
            direction: 1, // 1 = right, -1 = left
            color: '#ff3366'
        });
    }
}

// Start game
function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    level = 1;
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    bullets = [];
    
    initMushrooms();
    initCentipede();
    
    document.getElementById('startButton').disabled = true;
    document.getElementById('pauseButton').disabled = false;
    document.getElementById('gameOver').classList.add('hidden');
    
    updateUI();
    gameLoop();
}

// Toggle pause
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pauseButton').textContent = 'Resume';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseButton').textContent = 'Pause';
        gameLoop();
    }
}

// Restart game
function restartGame() {
    startGame();
}

// Shoot bullet
function shoot() {
    bullets.push({
        x: player.x,
        y: player.y,
        width: BULLET_SIZE,
        height: 10,
        speed: BULLET_SPEED,
        color: '#ffff00'
    });
}

// Update player
function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > player.width / 2) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width / 2) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] && player.y > canvas.height - 150) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height / 2) {
        player.y += player.speed;
    }
}

// Update bullets
function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > 0;
    });
}

// Update centipede
function updateCentipede() {
    for (let i = 0; i < centipede.length; i++) {
        const segment = centipede[i];
        
        // Move horizontally
        segment.x += segment.speedX * segment.direction;
        
        // Check boundaries and mushroom collision
        let shouldMoveDown = false;
        
        if (segment.x <= 0 || segment.x >= canvas.width) {
            shouldMoveDown = true;
        }
        
        // Check mushroom collision
        for (const mushroom of mushrooms) {
            if (checkCollision(segment, mushroom)) {
                shouldMoveDown = true;
                break;
            }
        }
        
        if (shouldMoveDown) {
            segment.direction *= -1;
            segment.y += CENTIPEDE_SEGMENT_SIZE;
        }
        
        // Check if centipede reached player area
        if (segment.y > canvas.height - 100) {
            loseLife();
            break;
        }
    }
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Handle collisions
function handleCollisions() {
    // Bullet-mushroom collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = mushrooms.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], mushrooms[j])) {
                mushrooms[j].health--;
                bullets.splice(i, 1);
                
                if (mushrooms[j].health <= 0) {
                    mushrooms.splice(j, 1);
                    score += 1;
                }
                break;
            }
        }
    }
    
    // Bullet-centipede collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = centipede.length - 1; j >= 0; j--) {
            if (bullets[i] && checkCollision(bullets[i], centipede[j])) {
                // Create mushroom at segment position
                mushrooms.push({
                    x: centipede[j].x,
                    y: centipede[j].y,
                    width: MUSHROOM_SIZE,
                    height: MUSHROOM_SIZE,
                    health: 3,
                    color: '#ff00ff'
                });
                
                centipede.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                break;
            }
        }
    }
    
    // Check if centipede is destroyed
    if (centipede.length === 0) {
        level++;
        initCentipede();
        // Add more mushrooms with each level
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * (canvas.width - MUSHROOM_SIZE);
            const y = Math.random() * (canvas.height - 200);
            mushrooms.push({
                x: x,
                y: y,
                width: MUSHROOM_SIZE,
                height: MUSHROOM_SIZE,
                health: 3,
                color: '#ff00ff'
            });
        }
    }
    
    // Player-centipede collision
    for (const segment of centipede) {
        if (checkCollision(player, segment)) {
            loseLife();
            break;
        }
    }
}

// Lose a life
function loseLife() {
    lives--;
    updateUI();
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Reset player position
        player.x = canvas.width / 2;
        player.y = canvas.height - 50;
        // Reset centipede
        initCentipede();
    }
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('startButton').disabled = false;
    document.getElementById('pauseButton').disabled = true;
    cancelAnimationFrame(animationId);
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

// Draw functions
function drawPlayer() {
    ctx.save();
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = player.color;
    
    // Draw ship
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawBullets() {
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ffff00';
    
    bullets.forEach(bullet => {
        ctx.fillRect(
            bullet.x - bullet.width / 2,
            bullet.y - bullet.height / 2,
            bullet.width,
            bullet.height
        );
    });
    
    ctx.shadowBlur = 0;
}

function drawMushrooms() {
    mushrooms.forEach(mushroom => {
        ctx.fillStyle = mushroom.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = mushroom.color;
        
        // Draw mushroom cap
        ctx.beginPath();
        ctx.arc(
            mushroom.x,
            mushroom.y - mushroom.height / 4,
            mushroom.width / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw mushroom stem
        ctx.fillRect(
            mushroom.x - mushroom.width / 6,
            mushroom.y - mushroom.height / 4,
            mushroom.width / 3,
            mushroom.height / 2
        );
        
        // Draw health indicator
        const alpha = mushroom.health / 3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mushroom.x - 8, mushroom.y + 8, 16, 3);
        ctx.globalAlpha = 1;
    });
    
    ctx.shadowBlur = 0;
}

function drawCentipede() {
    centipede.forEach((segment, index) => {
        ctx.fillStyle = segment.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = segment.color;
        
        // Draw segment as circle
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, segment.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes on head
        if (index === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(segment.x - 3, segment.y - 2, 2, 0, Math.PI * 2);
            ctx.arc(segment.x + 3, segment.y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    ctx.shadowBlur = 0;
}

// Main game loop
function gameLoop() {
    if (gameState !== 'playing') return;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update
    updatePlayer();
    updateBullets();
    updateCentipede();
    handleCollisions();
    
    // Draw
    drawMushrooms();
    drawCentipede();
    drawPlayer();
    drawBullets();
    
    // Draw player area indicator
    ctx.strokeStyle = '#00ff88';
    ctx.globalAlpha = 0.2;
    ctx.strokeRect(0, canvas.height - 100, canvas.width, 100);
    ctx.globalAlpha = 1;
    
    updateUI();
    
    animationId = requestAnimationFrame(gameLoop);
}

// Initial draw
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#00ff88';
ctx.font = '30px Courier New';
ctx.textAlign = 'center';
ctx.fillText('Press START GAME to begin', canvas.width / 2, canvas.height / 2);
