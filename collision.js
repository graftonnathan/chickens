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
}
