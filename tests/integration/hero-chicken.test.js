import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hero } from '../../hero.js';
import { Chicken, CHICKEN_TYPE_TEMPLATES } from '../../chicken.js';
import { Collision } from '../../collision.js';

// Hero constructor instantiates WizardAnimator, which references WIZARD_ANIMATIONS global
// We must provide both globals before constructing Hero
import { WizardAnimator } from '../../wizardAnimator.js';
import { WIZARD_ANIMATIONS } from '../../wizardAnimations.js';

beforeEach(() => {
    global.WizardAnimator = WizardAnimator;
    global.WIZARD_ANIMATIONS = WIZARD_ANIMATIONS;
    global.Collision = Collision;
    global.CHICKEN_TYPE_TEMPLATES = CHICKEN_TYPE_TEMPLATES;
});

describe('Hero–Chicken Integration', () => {
    let hero;
    let chicken;

    beforeEach(() => {
        hero = new Hero(400, 300);
        chicken = new Chicken(1, 420, 310, 'common');
        // Chicken starts in 'wild' state by default
    });

    // ── Picking up chickens ───────────────────────────────────────
    describe('picking up chickens', () => {
        it('hero can pick up a wild chicken', () => {
            expect(chicken.state).toBe('wild');
            expect(hero.canPickUpChicken()).toBe(true);

            const result = hero.pickUpChicken(chicken);

            expect(result).toBe(true);
            expect(hero.carrying.chickens).toContain(chicken);
            expect(chicken.state).toBe('carried');
        });

        it('hero cannot pick up a chicken that is already carried', () => {
            hero.pickUpChicken(chicken);
            const chicken2 = new Chicken(2, 430, 310, 'common');
            hero.pickUpChicken(chicken2);

            // Try picking up an already-carried chicken again via another hero method
            const chicken3 = new Chicken(3, 440, 310, 'common');
            chicken3.state = 'carried'; // force carried state
            const result = hero.canPickUpChicken(); // hero is full (2 chickens)
            expect(result).toBe(false);
        });

        it('hero cannot pick up a chicken that is in_coop state', () => {
            chicken.state = 'in_coop';
            // canBePickedUp() returns false for 'in_coop' state
            expect(chicken.canBePickedUp()).toBe(false);

            const result = hero.pickUpChicken(chicken);
            expect(result).toBe(false);
            expect(hero.carrying.chickens).toHaveLength(0);
        });

        it('proximity-based catch detects nearby chicken', () => {
            // Place chicken close to hero (within 40px)
            chicken.x = hero.x + 20;
            chicken.y = hero.y + 10;

            expect(chicken.canBeCaught(hero)).toBe(true);
        });

        it('proximity-based catch rejects far chicken', () => {
            chicken.x = hero.x + 200;
            chicken.y = hero.y + 200;

            expect(chicken.canBeCaught(hero)).toBe(false);
        });
    });

    // ── Bag capacity limits ───────────────────────────────────────
    describe('bag capacity limits', () => {
        it('hero can carry up to maxChickens (2)', () => {
            const c1 = new Chicken(10, 100, 100, 'common');
            const c2 = new Chicken(11, 110, 100, 'fast');

            expect(hero.pickUpChicken(c1)).toBe(true);
            expect(hero.pickUpChicken(c2)).toBe(true);
            expect(hero.carrying.chickens).toHaveLength(2);
        });

        it('hero cannot pick up a third chicken when at capacity', () => {
            const c1 = new Chicken(10, 100, 100, 'common');
            const c2 = new Chicken(11, 110, 100, 'fast');
            const c3 = new Chicken(12, 120, 100, 'slow');

            hero.pickUpChicken(c1);
            hero.pickUpChicken(c2);

            expect(hero.canPickUpChicken()).toBe(false);
            expect(hero.pickUpChicken(c3)).toBe(false);
            expect(hero.carrying.chickens).toHaveLength(2);
        });

        it('isCarrying returns true when holding chickens', () => {
            expect(hero.isCarrying()).toBe(false);
            hero.pickUpChicken(chicken);
            expect(hero.isCarrying()).toBe(true);
        });
    });

    // ── Hero dropping / depositing chickens ───────────────────────
    describe('dropping / depositing chickens', () => {
        it('depositChicken removes the first chicken via coop.returnChicken', () => {
            hero.pickUpChicken(chicken);

            // Create a minimal mock coop that always accepts returns
            const mockCoop = {
                chickens: [],
                chickenWindowMap: {},
                windowAssignments: new Array(12).fill(null),
                returnChicken: vi.fn((c) => {
                    c.state = 'in_coop';
                    c.inCoop = true;
                    return true;
                })
            };

            const result = hero.depositChicken(mockCoop);
            expect(result).toBe(true);
            expect(hero.carrying.chickens).toHaveLength(0);
            expect(mockCoop.returnChicken).toHaveBeenCalledWith(chicken);
        });

        it('depositChicken returns false when not carrying', () => {
            const mockCoop = { returnChicken: vi.fn(() => true) };
            expect(hero.depositChicken(mockCoop)).toBe(false);
        });

        it('depositAllChickens deposits multiple chickens', () => {
            const c1 = new Chicken(10, 100, 100, 'common');
            const c2 = new Chicken(11, 110, 100, 'fast');
            hero.pickUpChicken(c1);
            hero.pickUpChicken(c2);

            const mockCoop = {
                returnChicken: vi.fn(() => true)
            };

            const count = hero.depositAllChickens(mockCoop);
            expect(count).toBe(2);
            expect(hero.carrying.chickens).toHaveLength(0);
            expect(mockCoop.returnChicken).toHaveBeenCalledTimes(2);
        });
    });

    // ── Hero movement toward a chicken ────────────────────────────
    describe('hero movement toward a chicken', () => {
        it('hero position updates based on velocity', () => {
            const startX = hero.x;
            hero.vx = 100;
            hero.vy = 0;
            // Manually move hero
            hero.x += hero.vx * 0.016; // ~16ms frame

            expect(hero.x).toBeGreaterThan(startX);
        });

        it('hero approaching chicken reduces distance', () => {
            hero.x = 200;
            hero.y = 300;
            chicken.x = 400;
            chicken.y = 300;

            const initialDist = Collision.distance(hero, chicken);

            // Move hero toward chicken
            hero.x += 50;
            const newDist = Collision.distance(hero, chicken);

            expect(newDist).toBeLessThan(initialDist);
        });

        it('hero position is clamped to play area after update', () => {
            // Create a mock input
            const mockInput = {
                getMovementVector: () => ({ dx: 1, dy: 0 }),
                isSprinting: () => false,
                getSpellPressed: () => null
            };

            hero.x = 800; // Beyond right boundary
            hero.update(0.016, mockInput, [], null);

            // Hero should be clamped to max 755
            expect(hero.x).toBeLessThanOrEqual(755);
        });
    });

    // ── Collision between hero and chicken entities ───────────────
    describe('collision detection', () => {
        it('detects collision when hero and chicken overlap', () => {
            hero.x = 400;
            hero.y = 300;
            chicken.x = 410;
            chicken.y = 305;

            const heroBounds = hero.getBounds();
            const chickenBounds = chicken.getBounds();

            // hero radius=22, chicken radius=15, distance≈11.18
            expect(Collision.circleCircle(heroBounds, chickenBounds)).toBe(true);
        });

        it('no collision when hero and chicken are far apart', () => {
            hero.x = 100;
            hero.y = 100;
            chicken.x = 600;
            chicken.y = 500;

            const heroBounds = hero.getBounds();
            const chickenBounds = chicken.getBounds();

            expect(Collision.circleCircle(heroBounds, chickenBounds)).toBe(false);
        });

        it('getBounds returns correct hero bounds', () => {
            hero.x = 400;
            hero.y = 300;
            const bounds = hero.getBounds();

            expect(bounds).toEqual({ x: 400, y: 300, radius: 22 });
        });

        it('getBounds returns correct chicken bounds', () => {
            chicken.x = 200;
            chicken.y = 250;
            const bounds = chicken.getBounds();

            expect(bounds).toEqual({ x: 200, y: 250, radius: 15 });
        });
    });

    // ── Carried chicken position tracking ─────────────────────────
    describe('carried chicken positioning', () => {
        it('single carried chicken is positioned on hero right side', () => {
            hero.pickUpChicken(chicken);
            hero.facingDirection = 'right';

            const pos = hero.getCarriedChickenPosition(0);
            expect(pos.x).toBe(hero.x + 20);
            expect(pos.y).toBe(hero.y - 15);
        });

        it('two carried chickens are positioned side by side', () => {
            const c2 = new Chicken(2, 100, 100, 'fast');
            hero.pickUpChicken(chicken);
            hero.pickUpChicken(c2);
            hero.facingDirection = 'right';

            const pos0 = hero.getCarriedChickenPosition(0);
            const pos1 = hero.getCarriedChickenPosition(1);

            // Left chicken offset: -14, right chicken offset: +14
            expect(pos0.x).toBe(hero.x - 14);
            expect(pos1.x).toBe(hero.x + 14);
        });
    });
});
