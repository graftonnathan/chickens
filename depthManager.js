/**
 * DepthManager - Handles Y-sorted depth rendering for proper occlusion
 * Ensures entities are drawn in correct order relative to roof
 */
class DepthManager {
    constructor() {
        // Roof geometry constants
        this.roofPeakX = 400;
        this.roofPeakY = 500;
        this.roofBaseY = 600;
        this.roofSlope = 0.25; // (600-500)/400
    }

    /**
     * Calculate the Y coordinate of the roof edge at a given X position
     * @param {number} x - X coordinate
     * @returns {number} Y coordinate of roof edge
     */
    getRoofYAt(x) {
        return this.roofPeakY + Math.abs(x - this.roofPeakX) * this.roofSlope;
    }

    /**
     * Calculate depth Y for an entity (position at feet)
     * @param {Object} entity - Entity with x, y, and optional height
     * @returns {number} Depth Y coordinate
     */
    getEntityDepthY(entity) {
        const height = entity.height || 40;
        // Use bottom of sprite (feet position) as depth point
        // Entity.y is center, so feet are at y + height/2
        return entity.y + height * 0.5;
    }

    /**
     * Check if an entity is behind the roof at its X position
     * @param {Object} entity - Entity to check
     * @returns {boolean} True if entity is behind roof
     */
    isBehindRoof(entity) {
        const depthY = this.getEntityDepthY(entity);
        const roofY = this.getRoofYAt(entity.x);
        return depthY < roofY;
    }

    /**
     * Sort entities by depth (Y position) for proper render order
     * @param {Array} entities - Array of entities to sort
     * @returns {Array} New sorted array (shallow copy)
     */
    sortByDepth(entities) {
        return [...entities].sort((a, b) => {
            const depthA = this.getEntityDepthY(a);
            const depthB = this.getEntityDepthY(b);
            return depthA - depthB;
        });
    }

    /**
     * Get all renderable entities from the game state
     * @param {Game} game - Game instance
     * @returns {Array} Array of entities with draw methods
     */
    collectEntities(game) {
        const entities = [];

        // Coop chickens
        if (game.coop && game.coop.chickens) {
            entities.push(...game.coop.chickens);
        }

        // Wild chickens
        if (game.wildChickens) {
            entities.push(...game.wildChickens);
        }

        // Raccoons
        if (game.raccoons) {
            entities.push(...game.raccoons);
        }

        // Hero (add height property for depth calculation)
        if (game.hero) {
            const heroWithHeight = game.hero;
            heroWithHeight.height = 45; // Wizard sprite height
            entities.push(heroWithHeight);
        }

        return entities;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DepthManager };
}
