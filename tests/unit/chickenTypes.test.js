import { describe, it, expect, beforeAll } from 'vitest';

// chickenTypes.js defines TypedChicken which extends Chicken (a global from chicken.js).
// We must provide a stub Chicken class before importing chickenTypes.js.
class ChickenStub {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.inCoop = false;
        this.hasEgg = false;
        this.hunger = 100;
        this.eggTimer = 0;
        this.moveSpeed = 60;
        this.radius = 15;
    }
    update() {}
    layEgg() {}
    getEggInterval() {
        return 10;
    }
    collectEgg() {
        return true;
    }
    draw() {}
    drawHungerIndicator() {}
    drawEggIndicator() {}
}

// Make Chicken available globally so TypedChicken can extend it
globalThis.Chicken = ChickenStub;

// Now we can safely import – the module-level class definition will find Chicken
const { CHICKEN_TYPES } = await import('../../chickenTypes.js');

describe('CHICKEN_TYPES', () => {
    const allTypeKeys = Object.keys(CHICKEN_TYPES);

    // ── type catalogue completeness ─────────────────────────────────
    describe('type catalogue', () => {
        it('contains exactly 12 chicken types', () => {
            expect(allTypeKeys).toHaveLength(12);
        });

        it.each([
            'rainbow',
            'rocket',
            'sleepy',
            'sneaky',
            'lucky',
            'music',
            'tank',
            'night',
            'sunny',
            'hungry',
            'circus',
            'ghost'
        ])('includes the "%s" type', (type) => {
            expect(CHICKEN_TYPES).toHaveProperty(type);
        });
    });

    // ── required properties ─────────────────────────────────────────
    describe('required properties', () => {
        it.each(allTypeKeys)('"%s" has a name string', (type) => {
            expect(typeof CHICKEN_TYPES[type].name).toBe('string');
            expect(CHICKEN_TYPES[type].name.length).toBeGreaterThan(0);
        });

        it.each(allTypeKeys)('"%s" has an icon string', (type) => {
            expect(typeof CHICKEN_TYPES[type].icon).toBe('string');
            expect(CHICKEN_TYPES[type].icon.length).toBeGreaterThan(0);
        });

        it.each(allTypeKeys)('"%s" has a description string', (type) => {
            expect(typeof CHICKEN_TYPES[type].description).toBe('string');
        });

        it.each(allTypeKeys)('"%s" has a bodyColor hex string', (type) => {
            expect(CHICKEN_TYPES[type].bodyColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it.each(allTypeKeys)('"%s" has an accentColor hex string', (type) => {
            expect(CHICKEN_TYPES[type].accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it.each(allTypeKeys)('"%s" has a speedMod number', (type) => {
            expect(typeof CHICKEN_TYPES[type].speedMod).toBe('number');
        });

        it.each(allTypeKeys)('"%s" has an eggRateMod number', (type) => {
            expect(typeof CHICKEN_TYPES[type].eggRateMod).toBe('number');
        });

        it.each(allTypeKeys)('"%s" has a special ability string', (type) => {
            expect(typeof CHICKEN_TYPES[type].special).toBe('string');
            expect(CHICKEN_TYPES[type].special.length).toBeGreaterThan(0);
        });
    });

    // ── speed modifier ranges ───────────────────────────────────────
    describe('speedMod ranges', () => {
        it.each(allTypeKeys)('"%s" speedMod is between 0.5 and 2.0', (type) => {
            const speed = CHICKEN_TYPES[type].speedMod;
            expect(speed).toBeGreaterThanOrEqual(0.5);
            expect(speed).toBeLessThanOrEqual(2.0);
        });

        it('sleepy has the slowest speed modifier', () => {
            const speeds = allTypeKeys.map((k) => CHICKEN_TYPES[k].speedMod);
            expect(CHICKEN_TYPES.sleepy.speedMod).toBe(Math.min(...speeds));
        });

        it('rainbow has a fast speed modifier (1.2)', () => {
            expect(CHICKEN_TYPES.rainbow.speedMod).toBe(1.2);
        });
    });

    // ── egg rate modifier ranges ────────────────────────────────────
    describe('eggRateMod ranges', () => {
        it.each(allTypeKeys)('"%s" eggRateMod is between 0.5 and 2.0', (type) => {
            const rate = CHICKEN_TYPES[type].eggRateMod;
            expect(rate).toBeGreaterThanOrEqual(0.5);
            expect(rate).toBeLessThanOrEqual(2.0);
        });

        it('hungry has reduced egg rate (0.7)', () => {
            expect(CHICKEN_TYPES.hungry.eggRateMod).toBe(0.7);
        });

        it('sleepy has reduced egg rate (0.8)', () => {
            expect(CHICKEN_TYPES.sleepy.eggRateMod).toBe(0.8);
        });
    });

    // ── unique special abilities ────────────────────────────────────
    describe('special abilities', () => {
        it('all types have unique special abilities', () => {
            const specials = allTypeKeys.map((k) => CHICKEN_TYPES[k].special);
            const uniqueSpecials = new Set(specials);
            expect(uniqueSpecials.size).toBe(specials.length);
        });

        it('rainbow has rainbowTrail ability', () => {
            expect(CHICKEN_TYPES.rainbow.special).toBe('rainbowTrail');
        });

        it('rocket has speedBurst ability', () => {
            expect(CHICKEN_TYPES.rocket.special).toBe('speedBurst');
        });

        it('ghost has phaseThrough ability', () => {
            expect(CHICKEN_TYPES.ghost.special).toBe('phaseThrough');
        });

        it('lucky has goldenEgg ability', () => {
            expect(CHICKEN_TYPES.lucky.special).toBe('goldenEgg');
        });

        it('tank has blockRaccoon ability', () => {
            expect(CHICKEN_TYPES.tank.special).toBe('blockRaccoon');
        });

        it('sneaky has slipThrough ability', () => {
            expect(CHICKEN_TYPES.sneaky.special).toBe('slipThrough');
        });
    });

    // ── type-specific properties ────────────────────────────────────
    describe('type-specific properties', () => {
        it('rainbow has hasHorn = true (unicorn)', () => {
            expect(CHICKEN_TYPES.rainbow.hasHorn).toBe(true);
        });

        it('rocket has tailType flame', () => {
            expect(CHICKEN_TYPES.rocket.tailType).toBe('flame');
        });

        it('sleepy has halfClosed eye type', () => {
            expect(CHICKEN_TYPES.sleepy.eyeType).toBe('halfClosed');
        });

        it('sneaky has mask face pattern', () => {
            expect(CHICKEN_TYPES.sneaky.facePattern).toBe('mask');
        });

        it('tank has sizeMod 1.3 (larger)', () => {
            expect(CHICKEN_TYPES.tank.sizeMod).toBe(1.3);
        });

        it('hungry has sizeMod 1.2', () => {
            expect(CHICKEN_TYPES.hungry.sizeMod).toBe(1.2);
        });

        it('ghost has alpha 0.7 (semi-transparent)', () => {
            expect(CHICKEN_TYPES.ghost.alpha).toBe(0.7);
        });

        it('night has stars pattern', () => {
            expect(CHICKEN_TYPES.night.pattern).toBe('stars');
        });

        it('circus has stripes pattern', () => {
            expect(CHICKEN_TYPES.circus.pattern).toBe('stripes');
        });
    });

    // ── unique names ────────────────────────────────────────────────
    describe('uniqueness', () => {
        it('all types have unique names', () => {
            const names = allTypeKeys.map((k) => CHICKEN_TYPES[k].name);
            expect(new Set(names).size).toBe(names.length);
        });

        it('all types have unique icons', () => {
            const icons = allTypeKeys.map((k) => CHICKEN_TYPES[k].icon);
            expect(new Set(icons).size).toBe(icons.length);
        });

        it('all types have unique body colors', () => {
            const colors = allTypeKeys.map((k) => CHICKEN_TYPES[k].bodyColor);
            expect(new Set(colors).size).toBe(colors.length);
        });
    });
});
