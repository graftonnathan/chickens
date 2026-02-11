# Chickens - Master Design Document

**Project:** Chickens - Wizard's Backyard  
**Type:** Arcade-style chicken catching game  
**Last Updated:** 2026-02-10

---

## CORE CONCEPT

You are a wizard collecting magical chickens in your backyard. Catch chickens and deposit them in your coop before they escape.

---

## KEY FEATURES (DO NOT REMOVE)

### 1. Wizard Character
- **Visual:** Top-down wizard with blue shirt, dark pants, peach skin
- **Equipment:** WIZARD STAFF (do not remove - used for casting spells)
- **Movement:** WASD controls with sprint (Shift)
- **Abilities:**
  - Catch chickens (spacebar near chicken)
  - Cast spells (number keys 1-4):
    - Speed boost
    - Freeze chickens
    - Shield
    - Attract chickens
- **Bag system:** Carries up to 3 chickens at once

### 2. Chickens
- **Personalities:** Each chicken has unique behavior patterns:
  - **Nervous:** Runs away quickly, unpredictable
  - **Curious:** Approaches wizard, easy to catch
  - **Lazy:** Slow movement, often stops
  - **Sneaky:** Tries to escape when not looked at
  - **Golden:** Rare, worth 5x points
- **Visual:** Round fluffy bodies, different colors per personality
- **Animations:** Running legs, flapping wings, dust on escape

### 3. Coop (Central Hub)
- **Location:** Center of arena
- **Visual:** Red barn with 2x6 window grid, wooden fence
- **Function:** Deposit caught chickens
- **Barrier:** Fence with holes that wizard can path through
- **Spawn point:** All chickens spawn here at game start

### 4. Arena
- **Size:** 800x600px canvas
- **Visual:** Grass gradient (lighter near coop, darker at edges)
- **Border:** Wooden fence with posts
- **Escape zones:** Edges where chickens despawn

### 5. UI/HUD
- **Score:** Chickens deposited / target (e.g., 0/50)
- **Bag:** Shows carried chickens (up to 3)
- **Spell slots:** 4 slots with cooldown indicators
- **Timer:** Game countdown
- **Lives:** Hearts (if applicable)

### 6. Visual Effects
- **Catch:** Yellow sparkle + feather particles
- **Escape:** Brown dust poof at arena edge
- **Sprint:** Motion blur trail
- **Spell cast:** Colored aura effects

---

## COLOR PALETTE (MUST USE)

```css
/* Background & Arena */
--bg-color: #2d4a22          /* Deep grass green */
--arena-grass: #3d5a32       /* Lighter grass for play area */
--arena-border: #8b4513      /* Wooden fence brown */

/* Coop */
--coop-wood: #a0522d         /* Reddish barn wood */
--coop-roof: #8b0000         /* Dark red barn roof */
--coop-trim: #ffd700         /* Yellow/gold trim */

/* Hero/Wizard */
--hero-shirt: #4169e1        /* Royal blue shirt */
--hero-pants: #2f4f4f        /* Dark slate pants */
--hero-skin: #fdbcb4         /* Peach skin tone */
--hero-hair: #4a3728         /* Brown hair */

/* Chickens */
--chicken-white: #fffaf0     /* Off-white feathers */
--chicken-beak: #ffa500      /* Orange beak */
--chicken-comb: #dc143c      /* Red comb */

/* UI */
--ui-bg: rgba(0, 0, 0, 0.6)  /* Semi-transparent black */
--ui-text: #ffffff           /* White text */
--ui-accent: #ffd700         /* Gold accent */
--score-color: #00ff88       /* Bright green for score */
```

---

## CHICKEN PERSONALITIES (CRITICAL)

| Personality | Behavior | Color | Points |
|-------------|----------|-------|--------|
| Nervous | Runs fast, erratic | White | 100 |
| Curious | Approaches wizard | Yellow | 75 |
| Lazy | Slow, stops often | Brown | 50 |
| Sneaky | Escapes when not seen | Grey | 125 |
| Golden | Rare, fast, high value | Gold | 500 |

---

## CODE STRUCTURE

### Key Files
- `game.js` - Main game loop, state management
- `hero.js` - Wizard character, movement, spells, bag
- `chicken.js` - Chicken behaviors, personalities, AI
- `coop.js` - Coop rendering, fence collision, holes
- `renderer.js` - Drawing, canvas management
- `collision.js` - Hit detection, spatial queries
- `input.js` - Keyboard controls
- `wizardAnimations.js` - Wizard staff spells, effects

### Data Flow
1. Input → Hero movement/catch/spell
2. Collision detection (hero-chicken, hero-coop, chicken-fence)
3. Chicken AI updates (personality-based movement)
4. Renderer draws all entities
5. UI updates (score, bag, cooldowns)

---

## IMPORTANT NOTES FOR DEVELOPERS

### DO NOT REMOVE:
1. Wizard staff and spell system
2. Chicken personalities (Nervous, Curious, Lazy, Sneaky, Golden)
3. Bag limit (3 chickens max)
4. Coop fence with holes (pathing mechanic)
5. Sprint ability (Shift key)
6. Visual effects (sparkles, dust, trails)

### COMMON BUGS TO AVOID:
1. **Wizard disappearing** - Check collision with fence holes, position validation
2. **Chickens escaping through fence** - Ensure fence collision works
3. **Staff not rendering** - Check sprite layer order
4. **Personalities not working** - Verify AI state machine
5. **Bag not counting** - Check deposit logic in coop.js

---

## REFERENCE TICKETS

- Original design: TICKET-1770603482934-chickens
- Wizard staff: TICKET-1770773001115-chickens  
- Chicken personalities: TICKET-1770777887746-chickens
- Coop graphics: TICKET-1770781537837-chickens

---

## WHEN WORKING ON THIS PROJECT

**ALWAYS:**
1. Read this DESIGN.md first
2. Check existing features before adding new ones
3. Ensure personalities render correctly
4. Test wizard staff appears and works
5. Verify bag system still functions
6. Run visual test (screenshot comparison)

**NEVER:**
1. Remove the wizard staff
2. Delete chicken personality system
3. Change core color palette without designer approval
4. Break fence hole pathing
5. Remove visual effects (they're core to the feel)

---

*This document is the source of truth. Update it when adding permanent features.*
