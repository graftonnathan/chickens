import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Raccoon, RaccoonSpawner } from '../../raccoon.js';
import { Coop } from '../../coop.js';
import { Chicken, CHICKEN_TYPE_TEMPLATES } from '../../chicken.js';
import { Collision } from '../../collision.js';
import { ParticleSystem } from '../../particle.js';
import { FenceHole, FenceHoleManager } from '../../fenceHole.js';

beforeEach(() => {
    global.Chicken = Chicken;
    global.CHICKEN_TYPE_TEMPLATES = CHICKEN_TYPE_TEMPLATES;
    global.Collision = Collision;
    global.Raccoon = Raccoon;
});

describe('Raccoon–Coop Integration', () => {
    let coop;
    let raccoon;

    beforeEach(() => {
        coop = new Coop(400, 80);
        raccoon = new Raccoon(760, 300, coop);
    });

    // ── Raccoon spawning and movement toward coop ─────────────────
    describe('raccoon spawning and movement', () => {
        it('raccoon initializes with correct state', () => {
            expect(raccoon.state).toBe('spawning');
            expect(raccoon.x).toBe(760);
            expect(raccoon.y).toBe(300);
        });

        it('raccoon has coop reference', () => {
            expect(raccoon.coop).toBe(coop);
        });

        it('raccoon targets the coop door', () => {
            expect(raccoon.doorX).toBe(coop.x);
            expect(raccoon.doorY).toBe(coop.visualBottom + 5);
        });

        it('raccoon transitions from spawning to approaching', () => {
            // Advance past spawnDelay (0.5s)
            raccoon.update(0.6, null);

            expect(raccoon.state).toBe('approaching');
        });

        it('raccoon moves toward coop door while approaching', () => {
            // Transition to approaching
            raccoon.update(0.6, null);
            expect(raccoon.state).toBe('approaching');

            const startX = raccoon.x;
            raccoon.update(0.1, null);

            // Should have moved toward the door (to the left since door is at x=400)
            expect(raccoon.x).toBeLessThan(startX);
        });

        it('raccoon reaches coop door and enters', () => {
            // Transition to approaching
            raccoon.update(0.6, null);

            // Place raccoon near door to trigger entry
            raccoon.x = coop.x;
            raccoon.y = coop.visualBottom + 6;

            raccoon.update(0.1, null);

            expect(raccoon.state).toBe('entering_coop');
        });

        it('raccoon setDirectionToward sets velocity correctly', () => {
            raccoon.setDirectionToward(0, 0);

            // Velocity should point from (760,300) toward (0,0)
            expect(raccoon.vx).toBeLessThan(0);
            expect(raccoon.vy).toBeLessThan(0);

            // Speed magnitude should equal raccoon.speed
            const speed = Math.sqrt(raccoon.vx * raccoon.vx + raccoon.vy * raccoon.vy);
            expect(speed).toBeCloseTo(raccoon.speed, 0);
        });
    });

    // ── Raccoon interaction with coop ─────────────────────────────
    describe('raccoon interaction with coop', () => {
        it('raccoon entering coop sets hasSpookedChickens flag', () => {
            // Fast-forward to entering state
            raccoon.state = 'entering_coop';
            raccoon.enterTimer = 0;

            // Complete entry animation
            raccoon.updateEnteringCoop(raccoon.enterDuration + 0.1);

            expect(raccoon.state).toBe('inside_coop');
            expect(raccoon.hasSpookedChickens).toBe(true);
        });

        it('raccoon inside coop transitions to exiting after duration', () => {
            raccoon.state = 'inside_coop';
            raccoon.insideTimer = 0;

            raccoon.updateInsideCoop(raccoon.insideDuration + 0.1);

            expect(raccoon.state).toBe('exiting_coop');
        });

        it('raccoon exiting coop transitions to dragging', () => {
            raccoon.state = 'exiting_coop';
            raccoon.enterTimer = 0;

            raccoon.updateExitingCoop(raccoon.enterDuration + 0.1);

            expect(raccoon.state).toBe('dragging');
        });

        it('raccoon spooks coop chickens on entry', () => {
            // Coop spook method causes some chickens to flee
            const initialInCoop = coop.getInCoopCount();

            // Force deterministic random for testing
            const originalRandom = Math.random;
            Math.random = () => 0.1; // Always < 0.3, so all chickens flee

            coop.spook();

            Math.random = originalRandom;

            expect(coop.wasSpooked).toBe(true);
            expect(coop.spookTimer).toBe(5000);
        });

        it('raccoon intercept during approaching makes it flee', () => {
            raccoon.state = 'approaching';
            const result = raccoon.intercept(null);

            expect(raccoon.state).toBe('fleeing');
            expect(result).toBeNull(); // No chicken grabbed yet
        });

        it('raccoon intercept during dragging drops chicken', () => {
            raccoon.state = 'dragging';
            const grabbedChicken = new Chicken(99, 100, 100, 'common');
            raccoon.grabbedChicken = grabbedChicken;

            const result = raccoon.intercept(null);

            expect(raccoon.state).toBe('fleeing');
            expect(result).toBe(grabbedChicken);
            expect(raccoon.grabbedChicken).toBeNull();
        });

        it('raccoon intercept not possible when inside coop', () => {
            raccoon.state = 'inside_coop';
            const result = raccoon.intercept(null);

            expect(result).toBeNull();
            expect(raccoon.state).toBe('inside_coop'); // Unchanged
        });

        it('raccoon drags chicken toward escape target', () => {
            raccoon.state = 'dragging';
            raccoon.findEscapeTarget();
            raccoon.spawnSide = 'east';
            raccoon.escapeTargetX = 810;
            raccoon.escapeTargetY = raccoon.y;
            raccoon.setDirectionToward(raccoon.escapeTargetX, raccoon.escapeTargetY);

            const grabbedChicken = new Chicken(99, raccoon.x, raccoon.y, 'common');
            raccoon.grabbedChicken = grabbedChicken;

            const startX = raccoon.x;
            raccoon.updateDragging(0.1, null);

            // Raccoon should move toward escape target
            expect(raccoon.x).not.toBe(startX);
            // Grabbed chicken follows raccoon
            expect(grabbedChicken.x).toBeCloseTo(raccoon.x - (raccoon.facingLeft ? -15 : 15), 0);
        });

        it('raccoon escapes when reaching escape target', () => {
            raccoon.state = 'dragging';
            raccoon.escapeTargetX = 810;
            raccoon.escapeTargetY = 300;
            raccoon.setDirectionToward(810, 300);

            // Place raccoon near escape target
            raccoon.x = 800;
            raccoon.y = 300;

            raccoon.updateDragging(0.1, null);

            expect(raccoon.state).toBe('escaped');
        });
    });

    // ── Raccoon spawner timing/logic ──────────────────────────────
    describe('RaccoonSpawner', () => {
        let spawner;

        beforeEach(() => {
            spawner = new RaccoonSpawner(coop);
        });

        it('spawner starts with correct initial values', () => {
            expect(spawner.baseSpawnRate).toBe(12);
            expect(spawner.currentSpawnRate).toBe(12);
            expect(spawner.minSpawnRate).toBe(4);
            expect(spawner.spawnTimer).toBe(0);
        });

        it('spawner signals spawn when timer exceeds rate and no active raccoons', () => {
            const raccoons = [];
            const shouldSpawn = spawner.update(13, raccoons); // 13 seconds > 12

            expect(shouldSpawn).toBe(true);
        });

        it('spawner does not signal spawn when raccoon already active', () => {
            const raccoons = [raccoon]; // One active raccoon
            const shouldSpawn = spawner.update(13, raccoons);

            expect(shouldSpawn).toBe(false);
        });

        it('spawner does not signal before timer expires', () => {
            const raccoons = [];
            const shouldSpawn = spawner.update(5, raccoons);

            expect(shouldSpawn).toBe(false);
        });

        it('spawner accelerates spawn rate after each spawn', () => {
            const raccoons = [];
            spawner.update(13, raccoons); // triggers spawn

            // Rate should decrease (faster spawning)
            expect(spawner.currentSpawnRate).toBeLessThan(spawner.baseSpawnRate);
        });

        it('spawner rate does not go below minimum', () => {
            // Simulate many spawn cycles
            const raccoons = [];
            for (let i = 0; i < 200; i++) {
                spawner.spawnTimer = spawner.nextSpawnTime + 1;
                spawner.update(0.01, raccoons);
            }

            expect(spawner.currentSpawnRate).toBeGreaterThanOrEqual(spawner.minSpawnRate);
        });

        it('spawner reset restores defaults', () => {
            spawner.spawnTimer = 100;
            spawner.currentSpawnRate = 5;

            spawner.reset();

            expect(spawner.spawnTimer).toBe(0);
            expect(spawner.currentSpawnRate).toBe(spawner.baseSpawnRate);
        });
    });

    // ── Raccoon visibility and bounds ─────────────────────────────
    describe('raccoon visibility and bounds', () => {
        it('raccoon is visible when not inside coop', () => {
            raccoon.state = 'approaching';
            expect(raccoon.isVisible()).toBe(true);
        });

        it('raccoon is not visible when inside coop', () => {
            raccoon.state = 'inside_coop';
            expect(raccoon.isVisible()).toBe(false);
        });

        it('getBounds returns correct collision bounds', () => {
            raccoon.x = 500;
            raccoon.y = 250;

            const bounds = raccoon.getBounds();
            expect(bounds).toEqual({ x: 500, y: 250, radius: 18 });
        });

        it('checkReachedTarget returns true when entering/inside coop', () => {
            raccoon.state = 'entering_coop';
            expect(raccoon.checkReachedTarget()).toBe(true);

            raccoon.state = 'inside_coop';
            expect(raccoon.checkReachedTarget()).toBe(true);

            raccoon.state = 'approaching';
            expect(raccoon.checkReachedTarget()).toBe(false);
        });

        it('raccoon collision with hero can be detected', () => {
            raccoon.x = 400;
            raccoon.y = 300;

            const heroBounds = { x: 410, y: 305, radius: 22 };
            const raccoonBounds = raccoon.getBounds();

            expect(Collision.circleCircle(heroBounds, raccoonBounds)).toBe(true);
        });
    });
});
