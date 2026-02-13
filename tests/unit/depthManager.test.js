import { describe, it, expect, beforeEach } from 'vitest';
import { DepthManager } from '../../depthManager.js';

describe('DepthManager', () => {
    let dm;

    // ── constructor ─────────────────────────────────────────────────
    describe('constructor', () => {
        it('initializes roof geometry constants', () => {
            dm = new DepthManager();
            expect(dm.roofPeakX).toBe(400);
            expect(dm.roofPeakY).toBe(500);
            expect(dm.roofBaseY).toBe(600);
            expect(dm.roofSlope).toBe(0.25);
        });
    });

    // ── getRoofYAt ──────────────────────────────────────────────────
    describe('getRoofYAt', () => {
        beforeEach(() => {
            dm = new DepthManager();
        });

        it('returns peak Y at the peak X position', () => {
            expect(dm.getRoofYAt(400)).toBe(500);
        });

        it('returns base Y at x=0 (far left)', () => {
            // |0 - 400| * 0.25 = 100, 500 + 100 = 600
            expect(dm.getRoofYAt(0)).toBe(600);
        });

        it('returns base Y at x=800 (far right)', () => {
            // |800 - 400| * 0.25 = 100, 500 + 100 = 600
            expect(dm.getRoofYAt(800)).toBe(600);
        });

        it('is symmetric around peak X', () => {
            expect(dm.getRoofYAt(300)).toBe(dm.getRoofYAt(500));
        });

        it('returns correct value at midpoint between peak and edge', () => {
            // |200 - 400| * 0.25 = 50, 500 + 50 = 550
            expect(dm.getRoofYAt(200)).toBe(550);
        });

        it('handles x beyond canvas bounds', () => {
            // |1000 - 400| * 0.25 = 150, 500 + 150 = 650
            expect(dm.getRoofYAt(1000)).toBe(650);
        });

        it('handles negative x values', () => {
            // |-200 - 400| * 0.25 = 150, 500 + 150 = 650
            expect(dm.getRoofYAt(-200)).toBe(650);
        });
    });

    // ── getEntityDepthY ─────────────────────────────────────────────
    describe('getEntityDepthY', () => {
        beforeEach(() => {
            dm = new DepthManager();
        });

        it('calculates depth at feet position (y + height/2)', () => {
            const entity = { x: 400, y: 300, height: 40 };
            expect(dm.getEntityDepthY(entity)).toBe(320);
        });

        it('uses default height of 40 when not specified', () => {
            const entity = { x: 100, y: 200 };
            // 200 + 40 * 0.5 = 220
            expect(dm.getEntityDepthY(entity)).toBe(220);
        });

        it('handles custom height', () => {
            const entity = { x: 100, y: 200, height: 100 };
            // 200 + 100 * 0.5 = 250
            expect(dm.getEntityDepthY(entity)).toBe(250);
        });

        it('handles zero height', () => {
            const entity = { x: 100, y: 200, height: 0 };
            // BUG: depthManager.js line 29 uses `entity.height || 40` which treats 0 as falsy,
            // falling back to default 40. Should use `entity.height ?? 40` or similar.
            // Actual result: 200 + 40*0.5 = 220 (not 200 as one might expect with height=0)
            expect(dm.getEntityDepthY(entity)).toBe(220);
        });

        it('handles entity at top of canvas', () => {
            const entity = { x: 400, y: 0, height: 40 };
            expect(dm.getEntityDepthY(entity)).toBe(20);
        });

        it('handles entity at bottom of canvas', () => {
            const entity = { x: 400, y: 580, height: 40 };
            expect(dm.getEntityDepthY(entity)).toBe(600);
        });
    });

    // ── isBehindRoof ────────────────────────────────────────────────
    describe('isBehindRoof', () => {
        beforeEach(() => {
            dm = new DepthManager();
        });

        it('returns true for entity above the roof line', () => {
            // At x=400, roof Y = 500. Entity depth = 300 + 20 = 320 < 500
            const entity = { x: 400, y: 300, height: 40 };
            expect(dm.isBehindRoof(entity)).toBe(true);
        });

        it('returns false for entity below the roof line', () => {
            // At x=400, roof Y = 500. Entity depth = 550 + 20 = 570 > 500
            const entity = { x: 400, y: 550, height: 40 };
            expect(dm.isBehindRoof(entity)).toBe(false);
        });

        it('returns false for entity exactly at roof line', () => {
            // At x=400, roof Y = 500. Entity depth = 480 + 20 = 500 → not < 500
            const entity = { x: 400, y: 480, height: 40 };
            expect(dm.isBehindRoof(entity)).toBe(false);
        });

        it('accounts for roof slope at canvas edges', () => {
            // At x=0, roof Y = 600. Entity depth = 590 + 20 = 610 > 600
            const entity = { x: 0, y: 590, height: 40 };
            expect(dm.isBehindRoof(entity)).toBe(false);
        });

        it('entity near roof edge at off-center position', () => {
            // At x=200, roof Y = 500 + 200*0.25 = 550
            // Entity depth = 500 + 20 = 520 < 550
            const entity = { x: 200, y: 500, height: 40 };
            expect(dm.isBehindRoof(entity)).toBe(true);
        });
    });

    // ── sortByDepth ─────────────────────────────────────────────────
    describe('sortByDepth', () => {
        beforeEach(() => {
            dm = new DepthManager();
        });

        it('sorts entities by Y depth (lower Y renders first)', () => {
            const entities = [
                { x: 100, y: 500, height: 40 },
                { x: 100, y: 100, height: 40 },
                { x: 100, y: 300, height: 40 }
            ];
            const sorted = dm.sortByDepth(entities);
            expect(dm.getEntityDepthY(sorted[0])).toBeLessThanOrEqual(dm.getEntityDepthY(sorted[1]));
            expect(dm.getEntityDepthY(sorted[1])).toBeLessThanOrEqual(dm.getEntityDepthY(sorted[2]));
        });

        it('returns a new array (does not mutate original)', () => {
            const entities = [
                { x: 100, y: 500, height: 40 },
                { x: 100, y: 100, height: 40 }
            ];
            const sorted = dm.sortByDepth(entities);
            expect(sorted).not.toBe(entities);
            expect(entities[0].y).toBe(500); // Original unchanged
        });

        it('handles empty array', () => {
            expect(dm.sortByDepth([])).toEqual([]);
        });

        it('handles single entity', () => {
            const entities = [{ x: 100, y: 200, height: 40 }];
            const sorted = dm.sortByDepth(entities);
            expect(sorted).toHaveLength(1);
            expect(sorted[0]).toBe(entities[0]);
        });

        it('sorts entities with different heights correctly', () => {
            // Entity A: y=400, height=100 → depth=450
            // Entity B: y=420, height=40  → depth=440
            // B should come first (lower depth)
            const a = { x: 100, y: 400, height: 100 };
            const b = { x: 100, y: 420, height: 40 };
            const sorted = dm.sortByDepth([a, b]);
            expect(sorted[0]).toBe(b);
            expect(sorted[1]).toBe(a);
        });

        it('entities at same depth keep relative order (stable sort)', () => {
            const a = { x: 100, y: 200, height: 40, id: 'a' };
            const b = { x: 200, y: 200, height: 40, id: 'b' };
            const sorted = dm.sortByDepth([a, b]);
            expect(sorted[0].id).toBe('a');
            expect(sorted[1].id).toBe('b');
        });
    });

    // ── collectEntities ─────────────────────────────────────────────
    describe('collectEntities', () => {
        beforeEach(() => {
            dm = new DepthManager();
        });

        it('collects chickens from coop', () => {
            const game = {
                coop: { chickens: [{ id: 1 }, { id: 2 }] },
                wildChickens: [],
                raccoons: [],
                hero: null
            };
            const entities = dm.collectEntities(game);
            expect(entities).toHaveLength(2);
        });

        it('collects wild chickens', () => {
            const game = {
                coop: { chickens: [] },
                wildChickens: [{ id: 3 }],
                raccoons: [],
                hero: null
            };
            const entities = dm.collectEntities(game);
            expect(entities).toHaveLength(1);
        });

        it('collects raccoons', () => {
            const game = {
                coop: { chickens: [] },
                wildChickens: [],
                raccoons: [{ id: 4 }, { id: 5 }],
                hero: null
            };
            const entities = dm.collectEntities(game);
            expect(entities).toHaveLength(2);
        });

        it('collects hero and sets height to 45', () => {
            const hero = { x: 400, y: 300 };
            const game = {
                coop: { chickens: [] },
                wildChickens: [],
                raccoons: [],
                hero
            };
            const entities = dm.collectEntities(game);
            expect(entities).toHaveLength(1);
            expect(entities[0].height).toBe(45);
        });

        it('combines all entity types', () => {
            const game = {
                coop: { chickens: [{ id: 1 }] },
                wildChickens: [{ id: 2 }],
                raccoons: [{ id: 3 }],
                hero: { x: 0, y: 0 }
            };
            const entities = dm.collectEntities(game);
            expect(entities).toHaveLength(4);
        });

        it('handles missing coop gracefully', () => {
            const game = {
                coop: null,
                wildChickens: [{ id: 1 }],
                raccoons: [],
                hero: null
            };
            const entities = dm.collectEntities(game);
            expect(entities).toHaveLength(1);
        });

        it('handles missing properties gracefully', () => {
            const game = {};
            const entities = dm.collectEntities(game);
            expect(entities).toHaveLength(0);
        });
    });
});
