## Tetris Game

### Description

This is a browser-based implementation of the classic **Tetris** game, built with plain HTML, CSS, and JavaScript. The game runs entirely in your browser, features smooth keyboard controls, score tracking, and multiple speed levels, all wrapped in a retro-inspired UI.

### Features

- **Classic 10x20 grid**: Standard Tetris playfield with 10 columns and 20 rows.
- **Seven tetromino shapes**: Includes all classic pieces — I, O, T, L, J, S, and Z.
- **Line clearing and scoring**:
  - 1 line cleared: **100 points**
  - 2 lines cleared: **300 points**
  - 3 lines cleared: **500 points**
  - 4 lines cleared (Tetris): **800 points**
- **Score display**: Live score updates beneath the game.
- **Game over detection**: Game ends when new pieces can no longer spawn; a clear "Game Over" message is shown.
- **Restart button**: Start a new game instantly without reloading the page.
- **Pause / Resume button**: Temporarily stop and resume piece falling and input.
- **Speed control (3 levels)**:
  - **Slow** – 800 ms fall interval
  - **Medium** – 500 ms fall interval (default)
  - **Fast** – 300 ms fall interval
- **Keyboard controls**:
  - Move, rotate, soft drop, and hard drop using the arrow keys and spacebar.
- **Responsive layout**: Game container is centered on the page and adapts to smaller screens.
- **No dependencies**: Implemented with **HTML**, **CSS**, and **vanilla JavaScript** only.

### How to Play

The objective of Tetris is to:

- **Arrange falling tetrominoes** to form complete horizontal lines.
- When a row is completely filled with blocks (no gaps), it **clears** and you earn points.
- As pieces lock and stack, you must prevent them from reaching the top of the playfield.
- The game ends when a new piece can no longer spawn because the stack has reached the top (**Game Over**).

Try to clear multiple lines at once to maximize your score!

### Controls

#### Keyboard Controls

| Key             | Action                                            |
| --------------- | ------------------------------------------------- |
| **Left Arrow**  | Move piece left                                   |
| **Right Arrow** | Move piece right                                  |
| **Down Arrow**  | Soft drop (fall one row faster)                   |
| **Up Arrow**    | Rotate piece (clockwise)                          |
| **Spacebar**    | Hard drop (instantly drop to the bottom and lock) |

#### On-Screen Buttons

- **New Game**: Resets the board, score, and speed to start a fresh game.
- **Pause / Resume**: Toggles between pausing and resuming the game.
- **- Speed**: Decreases falling speed (down to **Slow**).
- **+ Speed**: Increases falling speed (up to **Fast**).

The current speed level is shown next to the speed controls (e.g., `Speed: Medium`).

### Setup / How to Run

No build tools or server are required.

1. **Download or clone** this repository.
2. Ensure the following files are in the same directory:
   - `index.html`
   - `style.css`
   - `script.js`
3. **Open** `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari, etc.).
4. Start playing immediately — everything runs locally in your browser.

### Technologies Used

- **HTML5** — Markup and canvas element for the playfield.
- **CSS3** — Layout, retro visual theme, and responsive design.
- **JavaScript (ES6)** — Game logic, input handling, rendering, scoring, and timing.

### File Structure

- `index.html`  
  Sets up the game page structure:
  - Canvas element for the Tetris playfield.
  - Score display.
  - Game over message.
  - Restart, pause, and speed control buttons.
  - Links to `style.css` and `script.js`.

- `style.css`  
  Handles all visual styling:
  - Dark, retro-themed background and centered game container.
  - Canvas appearance (grid look, neon border).
  - Score, game over text, and button styles.
  - Responsive tweaks for smaller screens.

- `script.js`  
  Contains the game logic:
  - Board representation and rendering.
  - Tetromino definitions, movement, rotation, and collision detection.
  - Line clearing and scoring.
  - Game loop, speed control, pause/resume, and restart behavior.
  - Keyboard and button event handlers.

### Screenshot

Add your own screenshot of the game and reference it here:

```markdown
![Game Screenshot](screenshot.png)
```

Make sure `screenshot.png` is placed in the repository root (or adjust the path accordingly).

### Future Improvements / Credits

Possible enhancements:

- **Next piece preview** window.
- **Hold piece** mechanic.
- **Level system** that increases speed as you clear more lines.
- **Sound effects and music** for drops, line clears, and game over.
- **High score tracking** using `localStorage`.
- **Mobile touch controls** for devices without keyboards.

Feel free to fork this project, customize the visuals, or extend the gameplay.  
Inspired by the classic Tetris experience and built as a learning/demo project for browser-based game development.
