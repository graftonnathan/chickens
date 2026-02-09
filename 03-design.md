# Design: TICKET-1770603482934-chickens

## Visual Identity

A charming, cartoon-style arcade game with a farmyard theme. Bright, cheerful colors with smooth animations and satisfying visual feedback. Think "Stardew Valley meets arcade classics."

## Color Palette

```css
/* Background & Arena */
--bg-color: #2d4a22          /* Deep grass green */
--arena-grass: #3d5a32       /* Lighter grass for play area */
--arena-border: #8b4513      /* Wooden fence brown */
--arena-shadow: #1a2f15      /* Shadow under fence */

/* Coop (Central Spawn Point) */
--coop-wood: #a0522d         /* Reddish barn wood */
--coop-wood-dark: #8b4513    /* Darker wood details */
--coop-roof: #8b0000         /* Dark red barn roof */
--coop-trim: #ffd700         /* Yellow/gold trim */

/* Hero (Player Character) */
--hero-shirt: #4169e1        /* Royal blue shirt */
--hero-pants: #2f4f4f        /* Dark slate pants */
--hero-skin: #fdbcb4         /* Peach skin tone */
--hero-hair: #4a3728         /* Brown hair */
--hero-outline: #1a1a2e      /* Dark outline */

/* Chickens */
--chicken-white: #fffaf0     /* Off-white feathers */
--chicken-beak: #ffa500      /* Orange beak */
--chicken-comb: #dc143c      /* Red comb */
--chicken-leg: #ffa500       /* Orange legs */
--chicken-outline: #2d2d2d   /* Dark outline */

/* UI & HUD */
--ui-bg: rgba(0, 0, 0, 0.6)  /* Semi-transparent black */
--ui-text: #ffffff           /* White text */
--ui-accent: #ffd700         /* Gold accent */
--score-color: #00ff88       /* Bright green for score */
--lives-color: #ff3366       /* Red for lives/hearts */
--timer-color: #87ceeb       /* Light blue for timer */

/* Effects */
--catch-sparkle: #ffff00     /* Yellow sparkle on catch */
--escape-dust: #d2691e       /* Brown dust on escape */
--shadow-color: rgba(0,0,0,0.3) /* Drop shadows */
```

## Canvas & Arena

### Canvas Size
- **Width**: 800 pixels
- **Height**: 600 pixels
- **Aspect ratio**: 4:3 (classic arcade)

### Arena Layout
- **Playable area**: 700x500px (centered, 50px margin)
- **Grass texture**: Subtle radial gradient from center (lighter near coop)
- **Border**: Wooden fence around perimeter with posts every 100px
- **Coop position**: Center of canvas (400, 300)

### Grass Pattern
```javascript
// Radial gradient from center
const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
gradient.addColorStop(0, '#4a6b3d');   // Lighter near coop
gradient.addColorStop(1, '#2d4a22');   // Darker at edges
```

## Character Designs

### Hero (Player)
- **Size**: 40x40px (collision radius: 20px)
- **Style**: Cartoon farmer/rancher, top-down view
- **Visual elements**:
  - Round head with simple face (dot eyes, small smile)
  - Blue shirt with short sleeves
  - Dark pants
  - Small boots (visible from top)
  - Optional: straw hat or cap
- **Animation**:
  - Subtle bounce while walking (2px up/down, 200ms cycle)
  - Direction indicator: slight stretch in movement direction
  - Catch animation: arms briefly extend outward

### Chickens
- **Size**: 30x30px (collision radius: 15px)
- **Style**: Cute, round cartoon chickens
- **Visual elements**:
  - Round fluffy body (off-white)
  - Small head with beak pointing in movement direction
  - Red comb on top
  - Two little orange legs (animated when running)
  - Tiny wings flapping while moving
- **Animation**:
  - Running: legs alternate, slight body wobble
  - Caught: flash white then disappear with feather particles
  - Escape: poof of dust at arena edge

### Coop (Central Spawn Point)
- **Size**: 80x80px
- **Style**: Classic red barn-style chicken coop
- **Visual elements**:
  - Square base with wooden plank texture
  - Slanted roof (dark red)
  - Small door facing south (toward player)
  - Yellow trim around door and roof edges
  - Hay/straw visible inside entrance
- **Animation**:
  - Subtle idle: slight scale pulse (1.0 to 1.02)
  - Spawn: door opens briefly, chicken pops out
  - Nest indicator: shows how many chickens remain to spawn

## UI & HUD Layout

### Top Bar (Full Width)
```
┌─────────────────────────────────────────────────────┐
│  SCORE: 0000          ♥♥♥          TIME: 00:00    │
└─────────────────────────────────────────────────────┘
```

- **Height**: 50px
- **Background**: `rgba(0,0,0,0.6)` with bottom border
- **Score** (left): `SCORE: 0000` in `--score-color`, monospace font
- **Lives** (center): Heart icons (♥) in `--lives-color`, filled = alive, empty = lost
- **Timer** (right): `TIME: 00:00` in `--timer-color`, counts up

### Game Over Screen (Centered Overlay)
```
┌─────────────────────────────┐
│                             │
│       GAME OVER             │
│                             │
│    Final Score: 1250        │
│    High Score:  2400        │
│                             │
│   [SPACE to Restart]        │
│   [ESC to Menu]             │
│                             │
└─────────────────────────────┘
```

- **Background**: `rgba(0,0,0,0.85)` with blur
- **Title**: 36px, bold, white
- **Scores**: 20px, monospace, score in green, high score in gold
- **Instructions**: 14px, muted gray

### Start Screen
- Title: "CHICKEN CHASER" in large playful font (48px)
- Subtitle: "Catch the chickens before they escape!"
- Controls: "WASD or Arrows to move"
- Call to action: "Press SPACE to Start"
- Background: Animated demo with coop and wandering chickens

## Typography

- **Title font**: System sans-serif, bold (or Google Font 'Fredoka One' if available)
- **UI font**: 'Courier New', monospace (digital arcade feel)
- **Score font**: Monospace, bold
- **Sizes**:
  - Title: 48px
  - HUD: 16px
  - Game Over: 36px (title), 20px (scores)
  - Instructions: 14px

## Animation Specifications

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Hero walk | Bounce 2px | 200ms | ease-in-out, loop |
| Chicken run | Leg cycle | 150ms | linear, loop |
| Chicken catch | Flash + particles | 300ms | ease-out |
| Chicken escape | Dust poof | 400ms | ease-out |
| Coop idle | Scale 1.0-1.02 | 2000ms | ease-in-out, loop |
| Coop spawn | Door open | 200ms | ease-out |
| Score update | Pop scale 1.2 | 150ms | ease-out |
| Life lost | Heart shrink | 300ms | ease-in |

## Visual Effects

### Catch Effect
- Yellow sparkle particles (8-10 particles)
- Particles burst outward from catch point
- Fade out over 500ms
- Small "+10" text floats up and fades

### Escape Effect
- Brown dust cloud at arena edge
- 3-4 dust puffs expanding outward
- Fade out over 400ms
- Brief screen shake (2px, 100ms)

### Spawn Effect
- Coop door slides open (200ms)
- Chicken pops out with small bounce
- Door closes after spawn

### Particle System
```javascript
// Feather particle on catch
{
  x: catchX,
  y: catchY,
  vx: random(-2, 2),
  vy: random(-3, -1),
  rotation: random(0, 360),
  rotationSpeed: random(-5, 5),
  color: '#fffaf0',
  size: random(4, 8),
  life: 500 // ms
}
```

## Responsive Design

### Desktop (> 800px)
- Full 800x600 canvas
- All UI elements at full size

### Tablet (600-800px)
- Scale canvas to fit: `transform: scale(0.9)`
- Maintain aspect ratio

### Mobile (< 600px)
- Scale canvas: `transform: scale(0.75)`
- Touch controls overlay (virtual joystick)
- Simplified HUD (larger touch targets)

## Art Style Guidelines

1. **Outline style**: All characters have 2px dark outlines for cartoon look
2. **Shading**: Simple cel-shading (1-2 shadow colors max)
3. **Proportions**: Cute/squashy proportions (big heads, small bodies)
4. **Expressions**: Simple dot eyes, small smiles - readable at small size
5. **Consistency**: All sprites use same outline weight and shading style

## Asset Summary

All rendering via Canvas 2D API - no external images:
- `drawHero(ctx, x, y, direction, animationFrame)`
- `drawChicken(ctx, x, y, direction, animationFrame)`
- `drawCoop(ctx, x, y, animationFrame)`
- `drawArena(ctx)`
- `drawUI(ctx, score, lives, time)`
- `drawParticles(ctx, particles)`

## Reference Mood

- Stardew Valley (charming farm aesthetic)
- Crossy Road (simple cute characters)
- Classic arcade games (clean HUD, immediate feedback)
- Looney Tunes (playful chase energy)
