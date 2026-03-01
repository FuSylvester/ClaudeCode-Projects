// Run the game setup only after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // 1. Get the canvas element and its 2D drawing context
  const canvas = document.getElementById("tetrisCanvas");
  const ctx = canvas.getContext("2d");

  // 2. Define constants for the Tetris board
  const COLS = 10;          // Number of columns
  const ROWS = 20;          // Number of rows
  const CELL_SIZE = 30;     // Size of each cell in pixels (30x30)

  // Score tracking, game state, and UI elements
  let score = 0;
  let gameOver = false;
  let paused = false;
  let speedLevel = 2; // 1 = Slow, 2 = Medium, 3 = Fast
  const speedDelays = {
    1: 800,
    2: 500,
    3: 300,
  };

  const scoreElement = document.getElementById("score");
  const gameOverElement = document.getElementById("gameOverMessage");
  const restartButton = document.getElementById("restartButton");
  const pauseButton = document.getElementById("pauseButton");
  const speedLevelElement = document.getElementById("speedLevel");
  const speedDownButton = document.getElementById("speedDown");
  const speedUpButton = document.getElementById("speedUp");

  // 3. Create a 2D array called `board` to represent the game board.
  //    0 = empty cell, 1 = occupied cell (to be used later when pieces are added)
  const board = [];
  for (let row = 0; row < ROWS; row++) {
    const rowArray = [];
    for (let col = 0; col < COLS; col++) {
      rowArray.push(0); // initialize all cells as empty
    }
    board.push(rowArray);
  }

  // 4. Define all seven tetromino shapes as 2D arrays.
  //    Each inner array represents a row, and "1" means a filled block.
  const PIECES = [
    // I
    [[1, 1, 1, 1]],
    // O
    [
      [1, 1],
      [1, 1],
    ],
    // T
    [
      [0, 1, 0],
      [1, 1, 1],
    ],
    // S
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
    // Z
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
    // L
    [
      [1, 0, 0],
      [1, 1, 1],
    ],
    // J
    [
      [0, 0, 1],
      [1, 1, 1],
    ],
  ];

  // 5. Current falling piece state:
  //    - matrix: the tetromino shape (2D array)
  //    - x, y: top-left position in board coordinates (columns, rows)
  const currentPiece = {
    matrix: null,
    x: 0,
    y: 0,
  };

  // 6. Function to draw the board grid and any locked blocks
  function drawBoard() {
    // Clear the canvas with a dark background
    ctx.fillStyle = "#000000"; // pure black; matches the dark theme
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // First, draw any locked blocks stored in the board array
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (board[row][col] === 1) {
          const x = col * CELL_SIZE;
          const y = row * CELL_SIZE;

          ctx.fillStyle = "#666666"; // color for locked blocks
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Then draw the grid lines on top
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 1;

    // Draw vertical grid lines
    for (let col = 0; col <= COLS; col++) {
      const x = col * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0); // +0.5 keeps lines crisp on pixel boundaries
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let row = 0; row <= ROWS; row++) {
      const y = row * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }
  }

  // 7. Function to draw a single tetromino piece on the board.
  //    - `piece` is a 2D array (one of the entries from PIECES).
  //    - `offsetX` and `offsetY` are the grid coordinates (column, row)
  //      where the top-left of the piece should be placed.
  function drawPiece(piece, offsetX, offsetY) {
    ctx.fillStyle = "cyan"; // temporary single color for all pieces

    for (let row = 0; row < piece.length; row++) {
      for (let col = 0; col < piece[row].length; col++) {
        if (piece[row][col] === 1) {
          const x = (offsetX + col) * CELL_SIZE;
          const y = (offsetY + row) * CELL_SIZE;

          // Draw a filled square for each "1" in the matrix
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

          // Optional: add a subtle border for a more blocky look
          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }
  }

  // 8. Spawn a new random piece at the top of the board
  function spawnNewPiece() {
    // Pick a random shape from PIECES
    const randomIndex = Math.floor(Math.random() * PIECES.length);
    const matrix = PIECES[randomIndex];

    currentPiece.matrix = matrix;
    // Center the piece horizontally based on its width
    const pieceWidth = matrix[0].length;
    currentPiece.x = Math.floor((COLS - pieceWidth) / 2);
    currentPiece.y = 0; // start at the top row

    // If the new piece immediately collides, the stack has reached the top -> game over
    if (collision(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
      gameOver = true;

      // Show a game over message if present
      if (gameOverElement) {
        gameOverElement.style.display = "block";
      }
    }
  }

  // 9. Collision detection for a given piece matrix at (x, y)
  function collision(matrix, offsetX, offsetY) {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const boardX = offsetX + col;
          const boardY = offsetY + row;

          // Check bounds against walls and floor/ceiling
          if (
            boardX < 0 ||
            boardX >= COLS ||
            boardY >= ROWS
          ) {
            return true;
          }

          // If we're above the visible board (boardY < 0) just ignore board cells
          if (boardY >= 0 && board[boardY][boardX] === 1) {
            // Collides with an already locked block
            return true;
          }
        }
      }
    }
    return false;
  }

  // 10. Rotate a piece matrix 90 degrees clockwise and return a new matrix
  function rotatePiece(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];

    for (let row = 0; row < cols; row++) {
      rotated[row] = [];
      for (let col = 0; col < rows; col++) {
        // Clockwise rotation: new[row][col] = old[rows - 1 - col][row]
        rotated[row][col] = matrix[rows - 1 - col][row];
      }
    }

    return rotated;
  }

  // 11. Clear any full rows and update the score
  function clearFullRows() {
    let rowsCleared = 0;

    // Scan from bottom to top so that when we remove rows,
    // rows above fall down correctly.
    for (let row = ROWS - 1; row >= 0; row--) {
      const isFull = board[row].every((cell) => cell === 1);

      if (isFull) {
        // Remove the full row
        board.splice(row, 1);
        // Insert a new empty row at the top
        board.unshift(new Array(COLS).fill(0));

        rowsCleared++;

        // Stay on the same row index since new content has shifted down
        row++;
      }
    }

    if (rowsCleared > 0) {
      // Classic Tetris-style scoring for line clears
      let points = 0;
      switch (rowsCleared) {
        case 1:
          points = 100;
          break;
        case 2:
          points = 300;
          break;
        case 3:
          points = 500;
          break;
        case 4:
          points = 800;
          break;
        default:
          // In case more than 4 lines somehow get cleared at once
          points = 800 + (rowsCleared - 4) * 300;
          break;
      }

      score += points;

      if (scoreElement) {
        scoreElement.textContent = "Score: " + score;
      }
    }
  }

  // 12. Lock the current piece into the board
  function lockPiece() {
    const matrix = currentPiece.matrix;
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const boardX = currentPiece.x + col;
          const boardY = currentPiece.y + row;

          // Only write into the board if we're within visible bounds
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            board[boardY][boardX] = 1;
          }
        }
      }
    }

    // After locking the piece, clear any completed rows and update score
    clearFullRows();

    // Spawn a new falling piece after locking and clearing,
    // unless the game is already over.
    if (!gameOver) {
      spawnNewPiece();
      draw();
    }
  }

  // 13. Move the current piece by (dx, dy) if possible
  function movePiece(dx, dy) {
    if (gameOver) return;
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;

    if (!collision(currentPiece.matrix, newX, newY)) {
      // No collision: apply move
      currentPiece.x = newX;
      currentPiece.y = newY;
      draw();
    } else if (dy === 1) {
      // Collision while moving down: lock the piece
      lockPiece();
    }
    // For horizontal collision, just ignore the move
  }

  // 14. Rotate the current piece in place if there is no collision
  function rotateCurrentPiece() {
    if (gameOver) return;
    if (!currentPiece.matrix) return;

    const rotated = rotatePiece(currentPiece.matrix);

    // Only apply rotation if it does not collide at the current position
    if (!collision(rotated, currentPiece.x, currentPiece.y)) {
      currentPiece.matrix = rotated;
      draw();
    }
  }

  // 15. Hard drop: instantly drop the piece to the lowest valid position
  function hardDrop() {
    if (!currentPiece.matrix || gameOver) return;

    let newY = currentPiece.y;

    // Move down until the next step would collide
    while (!collision(currentPiece.matrix, currentPiece.x, newY + 1)) {
      newY++;
    }

    currentPiece.y = newY;
    // Lock the piece at its final resting position
    lockPiece();
  }

  // 16. Draw everything: board + current falling piece
  function draw() {
    drawBoard();
    if (currentPiece.matrix) {
      drawPiece(currentPiece.matrix, currentPiece.x, currentPiece.y);
    }
  }

  // 17. Simple game loop helper: move the piece down with speed control
  let gameInterval = null;

  // Update the on-screen speed label
  function updateSpeedLabel() {
    if (!speedLevelElement) return;
    const labels = ["Slow", "Medium", "Fast"];
    const text = labels[speedLevel - 1] || "Medium";
    speedLevelElement.textContent = "Speed: " + text;
  }

  // Start or restart the game loop at the current speed
  function startGameLoop() {
    if (gameInterval) {
      clearInterval(gameInterval);
    }
    const delay = speedDelays[speedLevel] || speedDelays[2];
    gameInterval = setInterval(() => {
      if (!paused && !gameOver) {
        movePiece(0, 1);
      }
    }, delay);
  }

  // Change speed level (1..3) and restart loop
  function setSpeed(level) {
    // Clamp speed between 1 and 3
    if (level < 1) level = 1;
    if (level > 3) level = 3;
    speedLevel = level;
    updateSpeedLabel();
    startGameLoop();
  }

  function increaseSpeed() {
    setSpeed(speedLevel + 1);
  }

  function decreaseSpeed() {
    setSpeed(speedLevel - 1);
  }

  // Toggle paused state and update button text
  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    if (pauseButton) {
      pauseButton.textContent = paused ? "Resume" : "Pause";
    }
  }

  // 18. Game initialization
  spawnNewPiece();
  draw();
  updateSpeedLabel();
  startGameLoop();

  // 19. Keyboard controls and preventing default scrolling
  window.addEventListener("keydown", (event) => {
    const key = event.key;

    // Prevent default actions (like page scrolling) for game control keys
    if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === " " ||
      key === "Spacebar"
    ) {
      event.preventDefault();
    }

    switch (key) {
      case "ArrowLeft":
        if (gameOver || paused) return;
        movePiece(-1, 0); // move left
        break;
      case "ArrowRight":
        if (gameOver || paused) return;
        movePiece(1, 0); // move right
        break;
      case "ArrowDown":
        if (gameOver || paused) return;
        movePiece(0, 1); // soft drop
        break;
      case "ArrowUp":
        if (gameOver || paused) return;
        rotateCurrentPiece(); // rotate clockwise
        break;
      case " ":
      case "Spacebar":
        if (gameOver || paused) return;
        hardDrop(); // hard drop
        break;
      default:
        // Ignore all other keys
        break;
    }
  });

  // 20. Restart button: reset all game state and start a new game
  function restartGame() {
    // Reset the board to all zeros
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        board[row][col] = 0;
      }
    }

    // Reset score and UI
    score = 0;
    if (scoreElement) {
      scoreElement.textContent = "Score: " + score;
    }

    // Reset game over / pause state and hide the message
    gameOver = false;
    paused = false;
    if (pauseButton) {
      pauseButton.textContent = "Pause";
    }
    if (gameOverElement) {
      gameOverElement.style.display = "none";
    }

    // Reset speed to default (Medium) and restart game loop
    setSpeed(2);

    // Spawn a fresh piece and redraw
    spawnNewPiece();
    draw();
  }

  if (restartButton) {
    restartButton.addEventListener("click", restartGame);
  }

  if (pauseButton) {
    pauseButton.addEventListener("click", togglePause);
  }

  if (speedDownButton) {
    speedDownButton.addEventListener("click", decreaseSpeed);
  }

  if (speedUpButton) {
    speedUpButton.addEventListener("click", increaseSpeed);
  }
});