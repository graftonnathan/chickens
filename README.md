# Chickens - Catch the Fugitives!

A browser-based arcade game where you play as a hero catching chickens escaping from a central coop.

## How to Play

1. Open `index.html` in any modern web browser
2. Click "Start Game"
3. Use **WASD** or **Arrow Keys** to move your hero
4. Catch chickens before they reach the fence!
5. You have 3 lives - don't let chickens escape

## Scoring

- **+10 points** for each chicken caught
- **Lose 1 life** for each chicken that escapes
- **Game Over** when all lives are lost
- High score is saved locally

## Game Mechanics

- Chickens spawn from the central red barn coop
- They run outward in random directions
- Difficulty increases every 30 seconds:
  - Chickens spawn faster
  - More chickens allowed on screen
- Catch particles: Gold sparkles
- Escape particles: Gray smoke

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Move Up |
| S / ↓ | Move Down |
| A / ← | Move Left |
| D / → | Move Right |

## Files

- `index.html` - Game page
- `style.css` - Farmyard arcade styling
- `game.js` - Main game loop and state
- `hero.js` - Player character
- `chicken.js` - Chicken entities
- `coop.js` - Central barn/coop
- `spawner.js` - Chicken spawn logic
- `renderer.js` - Canvas drawing
- `input.js` - Keyboard controls
- `collision.js` - Collision detection
- `particle.js` - Visual effects

## Technical

- HTML5 Canvas with 2D context
- Vanilla JavaScript (ES6 classes)
- No external dependencies
- 60 FPS gameplay
- localStorage for high score persistence
