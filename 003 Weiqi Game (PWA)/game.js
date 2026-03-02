// ========== GAME SETUP ==========
const BOARD_SIZE = 18; // 18x18 Weiqi board
let board = [];              // This tracks where stones are placed
let gameStarted = false;      // Is the game running?
let currentPlayer = 'black'; // You always play as black first
let blackScore = 0;          // Your stone count
let whiteScore = 0;          // Computer's stone count
let lastMove = null;         // Track last move for star points

// Canvas setup
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const CELL_SIZE = canvas.width / (BOARD_SIZE + 1); // Cell size for spacing
const STONE_RADIUS = CELL_SIZE * 0.45;

// Get all the game elements from HTML
const startBtn = document.getElementById('start-btn');   // Start button
const restartBtn = document.getElementById('restart-btn'); // Restart button
const giveUpBtn = document.getElementById('give-up-btn');  // Give up button
const gameStatus = document.getElementById('game-status'); // Status messages
const blackScoreElement = document.getElementById('black-score'); // Your score
const whiteScoreElement = document.getElementById('white-score'); // Computer's score
const lastMoveElement = document.getElementById('last-move'); // Last move display

// ========== CREATE THE BOARD ==========
function createBoard() {
    // Clear the board array
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];

        for (let col = 0; col < BOARD_SIZE; col++) {
            // Remember where no stone is yet
            board[row][col] = null;
        }
    }

    // Draw the initial board
    drawBoard();
}

// ========== START THE GAME ==========
startBtn.addEventListener('click', () => {
    // Reset everything for a new game
    gameStarted = true;
    currentPlayer = 'black';
    blackScore = 0;
    whiteScore = 0;

    // Update scores on screen
    blackScoreElement.textContent = '0';
    whiteScoreElement.textContent = '0';

    // Create fresh board
    createBoard();

    // Enable the restart and give up buttons
    restartBtn.disabled = false;
    giveUpBtn.disabled = false;

    // Hide start button
    startBtn.disabled = true;
    startBtn.style.display = 'none';

    // Show it's your turn
    gameStatus.textContent = "Your turn! Click a square to place your black stone.";
});

// ========== YOUR MOVE ==========
function playerMove(row, col) {
    // Make sure game is running and square is empty
    if (!gameStarted || board[row][col] !== null) return;

    // Place your stone (black)
    placeStone(row, col, 'black');

    // Check if computer can take any stones
    checkForCaptures('black');

    // Add to your score
    blackScore++;
    updateScores();

    // Track last move for star points
    lastMove = { row, col };
    drawBoard();

    // Computer's turn now
    setTimeout(() => {
        computerMove();
    }, 500); // Wait half second before computer moves
}

// ========== COMPUTER MOVE ==========
function computerMove() {
    // Try to find the best move
    const bestMove = findBestMove();

    // Place computer's stone (white)
    placeStone(bestMove.row, bestMove.col, 'white');

    // Check if you can take any computer stones
    checkForCaptures('white');

    // Add to computer's score
    whiteScore++;
    updateScores();

    // Check if game is over
    checkGameOver();
}

// ========== PLACE A STONE ==========
function placeStone(row, col, color) {
    // Update the board array
    board[row][col] = color;

    // Redraw the board with the new stone
    drawBoard();
}

// ========== CHECK FOR CAPTURES (Stones that lose!) ==========
function checkForCaptures(capturedColor) {
    // Try capturing from all 8 directions (up, down, left, right, and diagonals)
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1], // Up, Down, Left, Right
        [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
    ];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // Only check empty squares that we just played on
            if (board[row][col] !== capturedColor) continue;

            // Get the group of connected stones for this color
            const group = getGroup(row, col, capturedColor);

            // If the group has 0 liberties (no empty space around it), capture it!
            if (countLiberties(group) === 0) {
                // Remove all stones in this group
                removeStones(group);
            }
        }
    }
}

// ========== FIND ALL CONNECTED STONES (same color touching) ==========
function getGroup(row, col, color) {
    const group = [];
    const visited = new Set();

    // Start searching from this stone
    searchGroup(row, col, color, visited, group);

    return group;
}

// ========== SEARCH FOR ALL CONNECTED STONES ==========
function searchGroup(row, col, color, visited, group) {
    // If already visited or different color, stop
    if (visited.has(`${row},${col}`) || board[row][col] !== color) return;

    // Mark as visited
    visited.add(`${row},${col}`);

    // Add this stone to the group
    group.push({ row, col });

    // Check all 8 directions
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1], // Up, Down, Left, Right
        [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
    ];

    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        // Check if new position is on the board
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
            searchGroup(newRow, newCol, color, visited, group);
        }
    }
}

// ========== COUNT HOW MANY EMPTY SPACES ARE AROUND A GROUP ==========
function countLiberties(group) {
    const liberties = new Set();

    // Check each stone in the group
    for (const { row, col } of group) {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1], // Up, Down, Left, Right
            [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
        ];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            // If empty space, mark as liberty
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                if (board[newRow][newCol] === null) {
                    liberties.add(`${newRow},${newCol}`);
                }
            }
        }
    }

    // Return how many liberties we found
    return liberties.size;
}

// ========== REMOVE STONES (when they have no space to escape) ==========
function removeStones(group) {
    // Remove stones one by one
    for (const { row, col } of group) {
        // Clear from memory
        board[row][col] = null;
    }

    // Redraw the board
    drawBoard();

    // Check if computer can capture stones now
    setTimeout(() => {
        checkForCaptures('white');
    }, 100);
}

// ========== FIND COMPUTER'S BEST MOVE ==========
function findBestMove() {
    const possibleMoves = [];

    // Find all empty squares
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                possibleMoves.push({ row, col });
            }
        }
    }

    if (possibleMoves.length === 0) {
        return { row: 0, col: 0 }; // Shouldn't happen
    }

    // Pick a random move (keep it simple for now!)
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

// ========== UPDATE SCORE DISPLAY ==========
function updateScores() {
    blackScoreElement.textContent = blackScore;
    whiteScoreElement.textContent = whiteScore;
}

// ========== CHECK IF GAME IS OVER ==========
function checkGameOver() {
    // Count total stones on board
    let totalStones = blackScore + whiteScore;

    // If board is full or no more moves possible, game over
    if (totalStones >= BOARD_SIZE * BOARD_SIZE) {
        gameStarted = false;
        showWinner();
    }
}

// ========== SHOW WHO WON ==========
function showWinner() {
    // Stop taking turns
    gameStarted = false;

    if (blackScore > whiteScore) {
        gameStatus.textContent = `🎉 You win! You have ${blackScore} stones to ${whiteScore}!`;
    } else if (whiteScore > blackScore) {
        gameStatus.textContent = `😢 Computer wins! It has ${whiteScore} stones to your ${blackScore}.`;
    } else {
        gameStatus.textContent = `🤝 It's a tie! Both have ${blackScore} stones.`;
    }

    // Make start button visible again
    startBtn.disabled = false;
    startBtn.style.display = 'block';
}

// ========== GIVE UP GAME ==========
giveUpBtn.addEventListener('click', () => {
    if (!gameStarted) return;

    // Stop the game
    gameStarted = false;

    // Show results
    if (blackScore > whiteScore) {
        gameStatus.textContent = "🏳️ You gave up, but you were winning! Better luck next time!";
    } else if (whiteScore > blackScore) {
        gameStatus.textContent = "🎉 Computer wins! Better luck next time!";
    } else {
        gameStatus.textContent = "🤝 You gave up! Try again?";
    }

    // Enable start button
    startBtn.disabled = false;
    startBtn.style.display = 'block';
});

// ========== RESTART GAME ==========
restartBtn.addEventListener('click', () => {
    // Just start a new game
    startBtn.click();
});

// ========== MOUSE/TOUCH HANDLING ==========
canvas.addEventListener('click', (e) => {
    if (!gameStarted) return;

    // Get canvas coordinates
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click coordinates to grid coordinates
    // Each cell is CELL_SIZE units, and we need to adjust for the padding
    const col = Math.round(clickX / CELL_SIZE) - 1;
    const row = Math.round(clickY / CELL_SIZE) - 1;

    // Check if click is valid
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        playerMove(row, col);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!gameStarted) return;

    // Get canvas coordinates
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to grid coordinates
    const col = Math.round(mouseX / CELL_SIZE) - 1;
    const row = Math.round(mouseY / CELL_SIZE) - 1;

    // Check if valid and empty
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === null) {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'crosshair';
    }
});

canvas.addEventListener('mouseleave', () => {
    canvas.style.cursor = 'crosshair';
});