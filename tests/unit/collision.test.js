import { describe, it, expect } from 'vitest';
import { Collision } from '../../collision.js';

describe('Collision', () => {
    // ── circleCircle ────────────────────────────────────────────────
    describe('circleCircle', () => {
        it('detects overlapping circles', () => {
            const c1 = { x: 0, y: 0, radius: 10 };
            const c2 = { x: 15, y: 0, radius: 10 };
            expect(Collision.circleCircle(c1, c2)).toBe(true);
        });

        it('returns false for non-overlapping circles', () => {
            const c1 = { x: 0, y: 0, radius: 10 };
            const c2 = { x: 25, y: 0, radius: 10 };
            expect(Collision.circleCircle(c1, c2)).toBe(false);
        });

        it('returns false for circles exactly touching (strict less-than)', () => {
            // distance == r1 + r2 → should be false because code uses <
            const c1 = { x: 0, y: 0, radius: 10 };
            const c2 = { x: 20, y: 0, radius: 10 };
            expect(Collision.circleCircle(c1, c2)).toBe(false);
        });

        it('detects collision for circles at identical positions', () => {
            const c1 = { x: 100, y: 200, radius: 5 };
            const c2 = { x: 100, y: 200, radius: 5 };
            expect(Collision.circleCircle(c1, c2)).toBe(true);
        });

        it('handles zero-radius circles at same position', () => {
            const c1 = { x: 50, y: 50, radius: 0 };
            const c2 = { x: 50, y: 50, radius: 0 };
            // distance = 0, combined radii = 0, 0 < 0 → false
            expect(Collision.circleCircle(c1, c2)).toBe(false);
        });

        it('works with diagonal distance', () => {
            const c1 = { x: 0, y: 0, radius: 10 };
            const c2 = { x: 7, y: 7, radius: 10 }; // distance ≈ 9.9
            expect(Collision.circleCircle(c1, c2)).toBe(true);
        });

        it('works with game-scale coordinates (800x600 canvas)', () => {
            const hero = { x: 400, y: 300, radius: 20 };
            const chicken = { x: 415, y: 310, radius: 15 };
            // distance ≈ 18.03, combined radii = 35
            expect(Collision.circleCircle(hero, chicken)).toBe(true);
        });
    });

    // ── outsideBounds ───────────────────────────────────────────────
    describe('outsideBounds', () => {
        const bounds = { left: 0, right: 800, top: 0, bottom: 600 };

        it('returns false for circle fully inside bounds', () => {
            const circle = { x: 400, y: 300, radius: 10 };
            expect(Collision.outsideBounds(circle, bounds)).toBe(false);
        });

        it('detects circle outside left boundary', () => {
            const circle = { x: 5, y: 300, radius: 10 };
            expect(Collision.outsideBounds(circle, bounds)).toBe(true);
        });

        it('detects circle outside right boundary', () => {
            const circle = { x: 795, y: 300, radius: 10 };
            expect(Collision.outsideBounds(circle, bounds)).toBe(true);
        });

        it('detects circle outside top boundary', () => {
            const circle = { x: 400, y: 5, radius: 10 };
            expect(Collision.outsideBounds(circle, bounds)).toBe(true);
        });

        it('detects circle outside bottom boundary', () => {
            const circle = { x: 400, y: 595, radius: 10 };
            expect(Collision.outsideBounds(circle, bounds)).toBe(true);
        });

        it('returns false when circle edge exactly touches boundary', () => {
            // x - radius == left → not < left → false for that check
            const circle = { x: 10, y: 300, radius: 10 };
            expect(Collision.outsideBounds(circle, bounds)).toBe(false);
        });

        it('handles zero-radius circle at boundary', () => {
            const circle = { x: 0, y: 0, radius: 0 };
            expect(Collision.outsideBounds(circle, bounds)).toBe(false);
        });
    });

    // ── distance ────────────────────────────────────────────────────
    describe('distance', () => {
        it('returns 0 for same point', () => {
            expect(Collision.distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
        });

        it('calculates horizontal distance', () => {
            expect(Collision.distance({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10);
        });

        it('calculates vertical distance', () => {
            expect(Collision.distance({ x: 0, y: 0 }, { x: 0, y: 10 })).toBe(10);
        });

        it('calculates diagonal distance correctly', () => {
            const d = Collision.distance({ x: 0, y: 0 }, { x: 3, y: 4 });
            expect(d).toBe(5);
        });

        it('is symmetric', () => {
            const p1 = { x: 100, y: 200 };
            const p2 = { x: 400, y: 500 };
            expect(Collision.distance(p1, p2)).toBe(Collision.distance(p2, p1));
        });

        it('works with negative coordinates', () => {
            const d = Collision.distance({ x: -3, y: -4 }, { x: 0, y: 0 });
            expect(d).toBe(5);
        });

        it('works across game canvas scale', () => {
            const d = Collision.distance({ x: 0, y: 0 }, { x: 800, y: 600 });
            expect(d).toBe(1000);
        });
    });

    // ── circleSegmentCollision ──────────────────────────────────────
    describe('circleSegmentCollision', () => {
        it('detects collision when circle overlaps segment midpoint', () => {
            const circle = { x: 5, y: 5, radius: 10 };
            const segment = { x1: 0, y1: 0, x2: 10, y2: 0 };
            expect(Collision.circleSegmentCollision(circle, segment)).toBe(true);
        });

        it('returns false when circle is far from segment', () => {
            const circle = { x: 5, y: 50, radius: 10 };
            const segment = { x1: 0, y1: 0, x2: 10, y2: 0 };
            expect(Collision.circleSegmentCollision(circle, segment)).toBe(false);
        });

        it('detects collision near segment endpoint', () => {
            const circle = { x: 12, y: 0, radius: 5 };
            const segment = { x1: 0, y1: 0, x2: 10, y2: 0 };
            expect(Collision.circleSegmentCollision(circle, segment)).toBe(true);
        });

        it('returns false when circle is just outside segment endpoint', () => {
            const circle = { x: 20, y: 0, radius: 5 };
            const segment = { x1: 0, y1: 0, x2: 10, y2: 0 };
            expect(Collision.circleSegmentCollision(circle, segment)).toBe(false);
        });

        it('handles degenerate segment (point)', () => {
            const circle = { x: 3, y: 4, radius: 6 };
            const segment = { x1: 0, y1: 0, x2: 0, y2: 0 };
            // distance from circle to point is 5, radius is 6 → collision
            expect(Collision.circleSegmentCollision(circle, segment)).toBe(true);
        });

        it('handles degenerate segment (point) with no collision', () => {
            const circle = { x: 3, y: 4, radius: 4 };
            const segment = { x1: 0, y1: 0, x2: 0, y2: 0 };
            // distance from circle to point is 5, radius is 4 → no collision
            expect(Collision.circleSegmentCollision(circle, segment)).toBe(false);
        });

        it('handles vertical segment', () => {
            const circle = { x: 3, y: 5, radius: 5 };
            const segment = { x1: 0, y1: 0, x2: 0, y2: 10 };
            // closest point on segment is (0,5), distance = 3, radius = 5 → collision
            expect(Collision.circleSegmentCollision(circle, segment)).toBe(true);
        });

        it('handles diagonal segment', () => {
            const circle = { x: 0, y: 0, radius: 1 };
            const segment = { x1: 10, y1: 10, x2: 20, y2: 20 };
            expect(Collision.circleSegmentCollision(circle, segment)).toBe(false);
        });
    });

    // ── resolveCircleSegmentCollision ───────────────────────────────
    describe('resolveCircleSegmentCollision', () => {
        it('returns null when no collision', () => {
            const circle = { x: 50, y: 50, radius: 5 };
            const segment = { x1: 0, y1: 0, x2: 10, y2: 0 };
            expect(Collision.resolveCircleSegmentCollision(circle, segment)).toBeNull();
        });

        it('returns corrected position when colliding', () => {
            const circle = { x: 5, y: 3, radius: 5 };
            const segment = { x1: 0, y1: 0, x2: 10, y2: 0 };
            const result = Collision.resolveCircleSegmentCollision(circle, segment);
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('x');
            expect(result).toHaveProperty('y');
        });

        it('pushes circle away from segment', () => {
            const circle = { x: 5, y: 3, radius: 5 };
            const segment = { x1: 0, y1: 0, x2: 10, y2: 0 };
            const result = Collision.resolveCircleSegmentCollision(circle, segment);
            // After resolution, distance from segment should be >= radius
            // The y should be pushed further from segment (upward, y positive direction)
            expect(result.y).toBeGreaterThan(circle.y);
        });

        it('handles circle center exactly on segment (dist === 0)', () => {
            const circle = { x: 5, y: 0, radius: 5 };
            const segment = { x1: 0, y1: 0, x2: 10, y2: 0 };
            const result = Collision.resolveCircleSegmentCollision(circle, segment);
            expect(result).not.toBeNull();
            // Should push along segment normal
            expect(typeof result.x).toBe('number');
            expect(typeof result.y).toBe('number');
        });

        it('includes +1 safety margin in push distance', () => {
            const circle = { x: 5, y: 2, radius: 5 };
            const segment = { x1: 0, y1: 0, x2: 10, y2: 0 };
            const result = Collision.resolveCircleSegmentCollision(circle, segment);
            // The resolved position should place the circle further than exactly radius away
            const distToSegment = Math.abs(result.y); // segment is on y=0
            expect(distToSegment).toBeGreaterThan(5); // radius + safety margin
        });
    });
});
