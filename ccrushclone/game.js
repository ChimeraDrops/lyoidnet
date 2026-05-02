// Meat Crush Game Logic

const BOARD_SIZE = 8;
const MEATS = ['🥓', '🥩', '🍖', '🌭', '🍗', '🥪'];
const MATCH_MIN = 3;

class MeatCrush {
    constructor() {
        this.board = [];
        this.score = 0;
        this.moves = 30;
        this.target = 1000;
        this.selectedCell = null;
        this.isProcessing = false;
        
        this.boardElement = document.getElementById('board');
        this.scoreElement = document.getElementById('score');
        this.movesElement = document.getElementById('moves');
        this.targetElement = document.getElementById('target');
        
        this.initializeBoard();
        this.renderBoard();
        this.attachEventListeners();
    }
    
    initializeBoard() {
        // Create initial board
        for (let row = 0; row < BOARD_SIZE; row++) {
            this.board[row] = [];
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.board[row][col] = this.getRandomMeat();
            }
        }
        
        // Remove initial matches
        while (this.findMatches().length > 0) {
            const matches = this.findMatches();
            matches.forEach(({row, col}) => {
                this.board[row][col] = this.getRandomMeat();
            });
        }
    }
    
    getRandomMeat() {
        return MEATS[Math.floor(Math.random() * MEATS.length)];
    }
    
    renderBoard() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.textContent = this.board[row][col];
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    handleCellClick(row, col) {
        if (this.isProcessing) return;
        
        const cell = this.getCellElement(row, col);
        
        if (!this.selectedCell) {
            // First selection
            this.selectedCell = {row, col};
            cell.classList.add('selected');
        } else {
            // Second selection
            const prevCell = this.getCellElement(this.selectedCell.row, this.selectedCell.col);
            prevCell.classList.remove('selected');
            
            // Check if adjacent
            if (this.areAdjacent(this.selectedCell, {row, col})) {
                this.swapCells(this.selectedCell, {row, col});
            }
            
            this.selectedCell = null;
        }
    }
    
    areAdjacent(cell1, cell2) {
        const rowDiff = Math.abs(cell1.row - cell2.row);
        const colDiff = Math.abs(cell1.col - cell2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    async swapCells(cell1, cell2) {
        this.isProcessing = true;
        
        // Swap in board array
        const temp = this.board[cell1.row][cell1.col];
        this.board[cell1.row][cell1.col] = this.board[cell2.row][cell2.col];
        this.board[cell2.row][cell2.col] = temp;
        
        this.renderBoard();
        await this.sleep(200);
        
        const matches = this.findMatches();
        
        if (matches.length === 0) {
            // Swap back if no matches
            const temp = this.board[cell1.row][cell1.col];
            this.board[cell1.row][cell1.col] = this.board[cell2.row][cell2.col];
            this.board[cell2.row][cell2.col] = temp;
            this.renderBoard();
            this.isProcessing = false;
        } else {
            // Valid move
            this.moves--;
            this.movesElement.textContent = this.moves;
            await this.processMatches();
            this.isProcessing = false;
            this.checkGameOver();
        }
    }
    
    findMatches() {
        const matches = [];
        
        // Check horizontal matches
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col <= BOARD_SIZE - MATCH_MIN; col++) {
                const meat = this.board[row][col];
                let matchLength = 1;
                
                for (let i = 1; i < BOARD_SIZE - col; i++) {
                    if (this.board[row][col + i] === meat) {
                        matchLength++;
                    } else {
                        break;
                    }
                }
                
                if (matchLength >= MATCH_MIN) {
                    for (let i = 0; i < matchLength; i++) {
                        matches.push({row, col: col + i});
                    }
                }
            }
        }
        
        // Check vertical matches
        for (let col = 0; col < BOARD_SIZE; col++) {
            for (let row = 0; row <= BOARD_SIZE - MATCH_MIN; row++) {
                const meat = this.board[row][col];
                let matchLength = 1;
                
                for (let i = 1; i < BOARD_SIZE - row; i++) {
                    if (this.board[row + i][col] === meat) {
                        matchLength++;
                    } else {
                        break;
                    }
                }
                
                if (matchLength >= MATCH_MIN) {
                    for (let i = 0; i < matchLength; i++) {
                        matches.push({row: row + i, col});
                    }
                }
            }
        }
        
        // Remove duplicates
        const uniqueMatches = [];
        const seen = new Set();
        
        for (const match of matches) {
            const key = `${match.row},${match.col}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueMatches.push(match);
            }
        }
        
        return uniqueMatches;
    }
    
    async processMatches() {
        let matches = this.findMatches();
        
        while (matches.length > 0) {
            // Highlight matches
            matches.forEach(({row, col}) => {
                const cell = this.getCellElement(row, col);
                cell.classList.add('matching');
            });
            
            await this.sleep(300);
            
            // Calculate score
            const basePoints = 10;
            const points = matches.length * basePoints;
            this.score += points;
            this.scoreElement.textContent = this.score;
            
            // Remove matches
            matches.forEach(({row, col}) => {
                this.board[row][col] = null;
            });
            
            // Drop pieces
            this.dropPieces();
            
            // Fill empty spaces
            this.fillBoard();
            
            this.renderBoard();
            await this.sleep(300);
            
            // Check for new matches
            matches = this.findMatches();
        }
    }
    
    dropPieces() {
        for (let col = 0; col < BOARD_SIZE; col++) {
            let emptyRow = BOARD_SIZE - 1;
            
            for (let row = BOARD_SIZE - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    if (row !== emptyRow) {
                        this.board[emptyRow][col] = this.board[row][col];
                        this.board[row][col] = null;
                    }
                    emptyRow--;
                }
            }
        }
    }
    
    fillBoard() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === null) {
                    this.board[row][col] = this.getRandomMeat();
                }
            }
        }
    }
    
    getCellElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    findPossibleMoves() {
        const moves = [];
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // Try swapping right
                if (col < BOARD_SIZE - 1) {
                    this.swapForCheck(row, col, row, col + 1);
                    if (this.findMatches().length > 0) {
                        moves.push({row1: row, col1: col, row2: row, col2: col + 1});
                    }
                    this.swapForCheck(row, col, row, col + 1); // Swap back
                }
                
                // Try swapping down
                if (row < BOARD_SIZE - 1) {
                    this.swapForCheck(row, col, row + 1, col);
                    if (this.findMatches().length > 0) {
                        moves.push({row1: row, col1: col, row2: row + 1, col2: col});
                    }
                    this.swapForCheck(row, col, row + 1, col); // Swap back
                }
            }
        }
        
        return moves;
    }
    
    swapForCheck(row1, col1, row2, col2) {
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
    }
    
    showHint() {
        const moves = this.findPossibleMoves();
        
        if (moves.length > 0) {
            const move = moves[0];
            const cell1 = this.getCellElement(move.row1, move.col1);
            const cell2 = this.getCellElement(move.row2, move.col2);
            
            cell1.classList.add('hint-highlight');
            cell2.classList.add('hint-highlight');
            
            setTimeout(() => {
                cell1.classList.remove('hint-highlight');
                cell2.classList.remove('hint-highlight');
            }, 2000);
        }
    }
    
    checkGameOver() {
        if (this.moves <= 0) {
            this.endGame();
        } else if (this.score >= this.target) {
            this.winGame();
        }
    }
    
    endGame() {
        const modal = document.getElementById('gameOver');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const finalScore = document.getElementById('finalScore');
        
        if (this.score >= this.target) {
            title.textContent = 'You Win! 🎉';
            message.innerHTML = `Congratulations! Your score: <span id="finalScore">${this.score}</span>`;
        } else {
            title.textContent = 'Game Over! 😢';
            message.innerHTML = `You ran out of moves! Your score: <span id="finalScore">${this.score}</span>`;
        }
        
        modal.classList.remove('hidden');
    }
    
    winGame() {
        this.endGame();
    }
    
    attachEventListeners() {
        document.getElementById('newGame').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('hint').addEventListener('click', () => {
            if (!this.isProcessing) {
                this.showHint();
            }
        });
        
        document.getElementById('playAgain').addEventListener('click', () => {
            document.getElementById('gameOver').classList.add('hidden');
            this.resetGame();
        });
    }
    
    resetGame() {
        this.board = [];
        this.score = 0;
        this.moves = 30;
        this.selectedCell = null;
        this.isProcessing = false;
        
        this.scoreElement.textContent = this.score;
        this.movesElement.textContent = this.moves;
        
        this.initializeBoard();
        this.renderBoard();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MeatCrush();
});
