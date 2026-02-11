/**
 * Collision detection utilities
 */
class Collision {
    /**
     * Check circle-circle collision
     */
    static circleCircle(c1, c2) {
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (c1.radius + c2.radius);
    }

    /**
     * Check if a circle is outside rectangular bounds
     */
    static outsideBounds(circle, bounds) {
        return (
            circle.x - circle.radius < bounds.left ||
            circle.x + circle.radius > bounds.right ||
            circle.y - circle.radius < bounds.top ||
            circle.y + circle.radius > bounds.bottom
        );
    }

    /**
     * Get distance between two points
     */
    static distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if a circle collides with a line segment
     * @param {Object} circle - {x, y, radius}
     * @param {Object} segment - {x1, y1, x2, y2}
     * @returns {boolean} - true if colliding
     */
    static circleSegmentCollision(circle, segment) {
        const { x, y, radius } = circle;
        const { x1, y1, x2, y2 } = segment;

        // Find closest point on segment to circle center
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        let t;
        if (lenSq === 0) {
            // Segment is a point
            t = 0;
        } else {
            // Project circle center onto line, clamped to segment
            t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
        }

        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;

        // Check distance from circle center to closest point
        const distX = x - closestX;
        const distY = y - closestY;
        const distSq = distX * distX + distY * distY;

        return distSq < radius * radius;
    }

    /**
     * Resolve circle-line-segment collision, returning corrected position
     * @param {Object} circle - {x, y, radius}
     * @param {Object} segment - {x1, y1, x2, y2}
     * @returns {Object} - {x, y} corrected position, or null if no collision
     */
    static resolveCircleSegmentCollision(circle, segment) {
        if (!this.circleSegmentCollision(circle, segment)) {
            return null;
        }

        const { x, y, radius } = circle;
        const { x1, y1, x2, y2 } = segment;

        // Find closest point on segment
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        let t;
        if (lenSq === 0) {
            t = 0;
        } else {
            t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
        }

        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;

        // Calculate push vector
        const distX = x - closestX;
        const distY = y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist === 0) {
            // Circle center is exactly on the segment - push along segment normal
            const segLen = Math.sqrt(lenSq);
            const normalX = -dy / segLen;
            const normalY = dx / segLen;
            return {
                x: x + normalX * radius,
                y: y + normalY * radius
            };
        }

        // Push circle outside by required distance
        const pushDistance = radius - dist + 1; // +1 for safety margin
        const pushX = (distX / dist) * pushDistance;
        const pushY = (distY / dist) * pushDistance;

        return {
            x: x + pushX,
            y: y + pushY
        };
    }

    /**
     * Get all fence segments for collision from coop
     * @param {Coop} coop - The coop instance
     * @param {FenceHoleManager} fenceHoleManager - Optional hole manager to exclude hole areas
     * @returns {Array} - Array of segments with {x1, y1, x2, y2, isGap}
     */
    static getFenceSegments(coop, fenceHoleManager = null) {
        const segments = [];
        const posts = 12;
        const totalPosts = posts + 2;
        const radius = coop.fenceRadius;

        // Build segments between posts, skipping built-in gaps
        for (let i = 0; i < totalPosts; i++) {
            const angle1 = (i / totalPosts) * Math.PI * 2;
            const angle2 = ((i + 1) / totalPosts) * Math.PI * 2;

            // Check if this segment crosses a built-in gap
            const midAngle = (angle1 + angle2) / 2;
            const normalizedMid = coop.normalizeAngle(midAngle);

            const isInChickenGap = coop.isAngleInGapWithTolerance(normalizedMid,
                coop.chickenGapStart, coop.chickenGapEnd, 0.02);
            const isInPlayerGap = coop.isAngleInGapWithTolerance(normalizedMid,
                coop.playerGapStart, coop.playerGapEnd, 0.02);
            let isGap = isInChickenGap || isInPlayerGap;

            // Check if segment overlaps with any fence hole
            if (!isGap && fenceHoleManager && fenceHoleManager.holes.length > 0) {
                isGap = this.isSegmentInHoleArea(coop, angle1, angle2, fenceHoleManager);
            }

            const x1 = coop.x + Math.cos(angle1) * radius;
            const y1 = coop.y + Math.sin(angle1) * radius;
            const x2 = coop.x + Math.cos(angle2) * radius;
            const y2 = coop.y + Math.sin(angle2) * radius;

            segments.push({ x1, y1, x2, y2, isGap });
        }

        return segments;
    }

    /**
     * Check if a fence segment overlaps with any hole area
     * @param {Coop} coop - The coop instance
     * @param {number} angle1 - Start angle of segment
     * @param {number} angle2 - End angle of segment
     * @param {FenceHoleManager} fenceHoleManager - Hole manager
     * @returns {boolean} - True if segment overlaps with a hole
     */
    static isSegmentInHoleArea(coop, angle1, angle2, fenceHoleManager) {
        const HOLE_ANGLE_WIDTH = 0.15;  // ~8.6 degrees, approx 40px at 90px radius

        for (const hole of fenceHoleManager.holes) {
            // Calculate angle to hole from coop center
            const dx = hole.x - coop.x;
            const dy = hole.y - coop.y;
            const holeAngle = Math.atan2(dy, dx);
            const normalizedHole = coop.normalizeAngle(holeAngle);

            // Check if segment angles overlap with hole angle
            const minAngle = Math.min(angle1, angle2);
            const maxAngle = Math.max(angle1, angle2);

            // Handle wrap-around
            if (maxAngle - minAngle > Math.PI) {
                // Segment crosses 0/2π boundary
                return normalizedHole >= maxAngle || normalizedHole <= minAngle ||
                       Math.abs(coop.normalizeAngle(normalizedHole - minAngle)) < HOLE_ANGLE_WIDTH ||
                       Math.abs(coop.normalizeAngle(normalizedHole - maxAngle)) < HOLE_ANGLE_WIDTH;
            }

            if (normalizedHole >= minAngle - HOLE_ANGLE_WIDTH &&
                normalizedHole <= maxAngle + HOLE_ANGLE_WIDTH) {
                return true;
            }
        }
        return false;
    }
}

// Expose Collision class to window for global access
if (typeof window !== 'undefined') {
    window.Collision = Collision;
}
