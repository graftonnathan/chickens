import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Chicken, CHICKEN_TYPE_TEMPLATES } from '../../chicken.js';
import { Coop } from '../../coop.js';
import { Spawner } from '../../spawner.js';

// Chicken must be global before TypedChicken class is evaluated
// (TypedChicken extends Chicken at module scope)
globalThis.Chicken = Chicken;
globalThis.CHICKEN_TYPE_TEMPLATES = CHICKEN_TYPE_TEMPLATES;

// Dynamic imports so they evaluate AFTER the globals are set
const { CHICKEN_TYPES, TypedChicken } = await import('../../chickenTypes.js');
const { ChickenManager } = await import('../../chickenManager.js');

globalThis.CHICKEN_TYPES = CHICKEN_TYPES;
globalThis.TypedChicken = TypedChicken;

describe('Chicken–Spawner Integration', () => {
    // ── Spawner creates chickens correctly ────────────────────────
    describe('Spawner', () => {
        let coop;
        let spawner;

        beforeEach(() => {
            coop = new Coop(400, 80);
            spawner = new Spawner(coop);
        });

        it('spawner starts with correct initial values', () => {
            expect(spawner.spawnRate).toBe(2000);
            expect(spawner.maxChickens).toBe(15);
            expect(spawner.spawnTimer).toBe(0);
        });

        it('spawner signals to spawn when timer exceeds spawnRate', () => {
            const chickens = [];
            // Pass enough deltaTime to exceed spawnRate (2000ms → 2 seconds)
            const shouldSpawn = spawner.update(2.1, chickens);
            expect(shouldSpawn).toBe(true);
        });

        it('spawner does not spawn when chickens are at max', () => {
            // Create array at max capacity
            const chickens = new Array(spawner.maxChickens).fill({});
            const shouldSpawn = spawner.update(3, chickens);
            expect(shouldSpawn).toBe(false);
        });

        it('spawner does not spawn before timer expires', () => {
            const chickens = [];
            const shouldSpawn = spawner.update(0.5, chickens);
            expect(shouldSpawn).toBe(false);
        });

        it('spawner increases difficulty over time', () => {
            const initialRate = spawner.spawnRate;
            spawner.increaseDifficulty();

            expect(spawner.spawnRate).toBeLessThan(initialRate);
            expect(spawner.maxChickens).toBeGreaterThan(15);
        });

        it('spawner difficulty has minimum spawn rate', () => {
            // Call many times to push rate down
            for (let i = 0; i < 100; i++) {
                spawner.increaseDifficulty();
            }

            expect(spawner.spawnRate).toBeGreaterThanOrEqual(spawner.minSpawnRate);
        });

        it('spawner reset restores defaults', () => {
            spawner.spawnTimer = 5000;
            spawner.spawnRate = 100;
            spawner.maxChickens = 50;

            spawner.reset();

            expect(spawner.spawnTimer).toBe(0);
            expect(spawner.spawnRate).toBe(spawner.initialSpawnRate);
            expect(spawner.maxChickens).toBe(15);
        });

        it('spawner resets timer after spawning', () => {
            const chickens = [];
            spawner.update(2.1, chickens); // triggers spawn
            expect(spawner.spawnTimer).toBe(0);
        });
    });

    // ── ChickenManager tracks active chickens ─────────────────────
    describe('ChickenManager', () => {
        let coop;
        let manager;

        beforeEach(() => {
            coop = new Coop(400, 80);
            manager = new ChickenManager(coop);
        });

        it('spawnChickens creates all 12 type chickens', () => {
            const chickens = manager.spawnChickens();
            expect(chickens).toHaveLength(12);
            expect(manager.chickens).toHaveLength(12);
        });

        it('each spawned chicken is a TypedChicken instance', () => {
            manager.spawnChickens();
            manager.chickens.forEach(chicken => {
                expect(chicken).toBeInstanceOf(TypedChicken);
            });
        });

        it('getChickenByType finds the correct chicken', () => {
            manager.spawnChickens();
            const rainbow = manager.getChickenByType('rainbow');
            expect(rainbow).toBeDefined();
            expect(rainbow.type).toBe('rainbow');
        });

        it('getSpecialChicken returns the rainbow chicken', () => {
            manager.spawnChickens();
            const special = manager.getSpecialChicken();
            expect(special).toBeDefined();
            expect(special.type).toBe('rainbow');
        });

        it('getAllChickens returns the full array', () => {
            manager.spawnChickens();
            expect(manager.getAllChickens()).toHaveLength(12);
        });

        it('getInCoopCount reflects chicken inCoop status', () => {
            manager.spawnChickens();
            // By default, spawned TypedChickens start with inCoop = false (wild)
            const initialInCoop = manager.getInCoopCount();

            // Put some in coop
            manager.chickens[0].inCoop = true;
            manager.chickens[1].inCoop = true;

            expect(manager.getInCoopCount()).toBe(initialInCoop + 2);
        });

        it('getChickensWithEggs filters correctly', () => {
            manager.spawnChickens();
            // No eggs initially
            expect(manager.getChickensWithEggs()).toHaveLength(0);

            // Simulate egg laying
            manager.chickens[0].inCoop = true;
            manager.chickens[0].hasEgg = true;

            expect(manager.getChickensWithEggs()).toHaveLength(1);
        });

        it('getHungryChickens returns chickens below 50 hunger', () => {
            manager.spawnChickens();
            manager.chickens[0].inCoop = true;
            manager.chickens[0].hunger = 30;

            const hungry = manager.getHungryChickens();
            expect(hungry).toHaveLength(1);
            expect(hungry[0].hunger).toBeLessThan(50);
        });

        it('reset re-creates chickens', () => {
            manager.spawnChickens();
            const first = manager.chickens[0];

            manager.reset();

            expect(manager.chickens).toHaveLength(12);
            // New chickens should be different objects
            expect(manager.chickens[0]).not.toBe(first);
        });
    });

    // ── Chickens escaping (reaching arena edge) ───────────────────
    describe('chicken escaping', () => {
        it('wild chicken wanders within bounds', () => {
            const chicken = new Chicken(1, 400, 300, 'common');
            chicken.state = 'wild';

            // Update multiple times
            for (let i = 0; i < 100; i++) {
                chicken.updateWild(0.1);
            }

            // Should stay within bounds
            expect(chicken.x).toBeGreaterThanOrEqual(50);
            expect(chicken.x).toBeLessThanOrEqual(750);
            expect(chicken.y).toBeGreaterThanOrEqual(200);
            expect(chicken.y).toBeLessThanOrEqual(550);
        });

        it('out-of-coop chicken moves south and can escape at y=550', () => {
            const chicken = new Chicken(1, 400, 540, 'common');
            chicken.state = 'escaped';

            const result = chicken.updateOutOfCoop(0.5);

            // Chicken moves south, may escape if y > 550
            if (chicken.y > 550) {
                expect(result).toBe('escaped');
            } else {
                expect(result).toBeNull();
            }
        });

        it('chicken escaping from coop transitions states correctly', () => {
            const coop = new Coop(400, 80);
            const chicken = new Chicken(50, 400, 120, 'common');
            chicken.state = 'in_coop';
            chicken.inCoop = true;
            chicken.coopResidency.inCoop = true;

            const result = chicken.leaveCoop();

            expect(result).toBe('escaping');
            expect(chicken.state).toBe('escaping');
            expect(chicken.inCoop).toBe(false);
        });
    });

    // ── Chicken personality behavior differences ──────────────────
    describe('chicken personality behavior', () => {
        it('different chicken types have different attributes', () => {
            const common = new Chicken(1, 100, 100, 'common');
            const fast = new Chicken(2, 100, 100, 'fast');
            const rare = new Chicken(3, 100, 100, 'rare');

            expect(common.attributes.escapeTimer).toBe(30);
            expect(fast.attributes.escapeTimer).toBe(12);
            expect(rare.attributes.escapeTimer).toBe(8);
        });

        it('fast chickens have higher hunger decay rate', () => {
            const common = new Chicken(1, 100, 100, 'common');
            const fast = new Chicken(2, 100, 100, 'fast');

            expect(fast.attributes.hungerDecayRate).toBeGreaterThan(
                common.attributes.hungerDecayRate
            );
        });

        it('rare chickens have higher egg value', () => {
            const common = new Chicken(1, 100, 100, 'common');
            const rare = new Chicken(2, 100, 100, 'rare');

            expect(rare.attributes.eggValue).toBeGreaterThan(common.attributes.eggValue);
        });

        it('slow chickens require more coop time before laying', () => {
            const common = new Chicken(1, 100, 100, 'common');
            const slow = new Chicken(2, 100, 100, 'slow');

            expect(slow.attributes.minCoopTime).toBeGreaterThan(
                common.attributes.minCoopTime
            );
        });

        it('feeding increases chicken hunger', () => {
            const chicken = new Chicken(1, 100, 100, 'common');
            chicken.hunger = 50;
            chicken.feed();

            expect(chicken.hunger).toBe(80);
        });

        it('hunger is capped at 100 when feeding', () => {
            const chicken = new Chicken(1, 100, 100, 'common');
            chicken.hunger = 90;
            chicken.feed();

            expect(chicken.hunger).toBe(100);
        });

        it('chicken egg interval depends on hunger level', () => {
            const chicken = new Chicken(1, 100, 100, 'common');

            chicken.hunger = 60;
            expect(chicken.getEggInterval()).toBe(10000);

            chicken.hunger = 30;
            expect(chicken.getEggInterval()).toBe(20000);

            chicken.hunger = 10;
            expect(chicken.getEggInterval()).toBe(40000);

            chicken.hunger = 0;
            expect(chicken.getEggInterval()).toBe(Infinity);
        });
    });
});
