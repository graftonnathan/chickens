/**
 * Coop class - Garden Shed with solid rectangular barrier
 * The coop itself is the barrier. A small door on the south side
 * allows chickens to escape.
 *
 * === GRAPHIC OVERHAUL: Illustrative Storybook Style ===
 * - Wood plank texture with grain, knots, and weathering
 * - Shingled roof with staggered rows and ridge cap
 * - Framed windows with sills, cross-bars, and warm glow
 * - Barn door with hardware detail
 * - Stone foundation with mortar lines
 * - Weather vane, hanging sign, lantern, hay wisps
 * - Offscreen canvas caching for static elements
 */
class Coop {
    constructor(x, y) {
        this.x = x || 400;
        this.y = y || 80;
        // ENLARGED FOR 2x6 WINDOW GRID: 180x120
        this.width = 180;
        this.height = 120;

        // Foundation adds to effective collision height
        this.foundationHeight = 18;

        // Door on south wall (chicken escape)
        this.doorWidth = 30;
        this.doorHeight = 28;

        // Visual bottom of the coop (body + foundation)
        this.visualBottom = this.y + this.height + this.foundationHeight; // 218

        // Rectangular barrier bounds - front retracted 50px so hero can approach
        this.barrierLeft = this.x - this.width / 2 - 5;
        this.barrierRight = this.x + this.width / 2 + 5;
        this.barrierTop = this.y - 5;
        this.barrierBottom = this.visualBottom - 50; // 168

        // Door opening bounds (centered on south wall, at visual bottom)
        this.doorLeft = this.x - this.doorWidth / 2;
        this.doorRight = this.x + this.doorWidth / 2;
        this.doorY = this.visualBottom;  // Actual visual bottom of coop

        // Keep fenceRadius for backward compat with deposit zone
        this.fenceRadius = Math.max(this.width, this.height) / 2 + 20;

        // Chicken management
        this.chickens = [];
        this.maxChickens = 12;

        // Spook state
        this.wasSpooked = false;
        this.spookTimer = 0;

        // Escape tracking
        this.escapedChickens = [];

        // Debug mode (set to true for verbose logging)
        this.debugCollision = false;

        // Window configuration (12 windows in 2x6 grid)
        this.windows = {
            cols: 6,      // 6 columns
            rows: 2,      // 2 rows
            width: 20,    // Interior width
            height: 28,   // Interior height
            gap: 4        // Space between windows
        };

        // NEW: Window assignment system (1 chicken per window)
        this.windowAssignments = new Array(12).fill(null); // windowAssignments[windowIndex] = chickenId or null
        this.chickenWindowMap = {}; // chickenWindowMap[chickenId] = windowIndex (persistent)

        // === OFFSCREEN CACHING ===
        this._cachedBarn = null;       // Offscreen canvas for static barn structure
        this._cacheValid = false;      // Whether cache needs rebuilding
        this._cachedWindowFrames = null; // Offscreen canvas for window frames only
        this._cachedWindowFramesValid = false;
        // Seeded random values for consistent textures
        this._plankSeeds = [];
        this._shingleSeeds = [];
        this._stoneSeeds = [];
        this._initTextureSeeds();

        // Initialize 12 chickens in coop
        this.initChickens();
    }

    /**
     * Initialize deterministic random seeds for texture consistency
     */
    _initTextureSeeds() {
        // Simple seeded PRNG for consistent textures across frames
        const seed = (this.x * 137 + this.y * 251) | 0;
        const rng = (s) => {
            s = (s * 16807 + 0) % 2147483647;
            return { next: s, val: (s & 0xffff) / 0xffff };
        };

        let s = seed;
        // Plank seeds: color variation, grain offset, has-knot, knot-x, knot-y
        this._plankSeeds = [];
        for (let i = 0; i < 10; i++) {
            let r;
            r = rng(s); s = r.next; const colorVar = r.val;
            r = rng(s); s = r.next; const grainOff = r.val;
            r = rng(s); s = r.next; const hasKnot = r.val < 0.2;
            r = rng(s); s = r.next; const knotX = r.val;
            r = rng(s); s = r.next; const knotY = r.val;
            r = rng(s); s = r.next; const weathering = r.val;
            this._plankSeeds.push({ colorVar, grainOff, hasKnot, knotX, knotY, weathering });
        }

        // Shingle seeds: color variation per shingle
        this._shingleSeeds = [];
        for (let i = 0; i < 80; i++) {
            let r;
            r = rng(s); s = r.next; const col = r.val;
            r = rng(s); s = r.next; const hOff = r.val;
            r = rng(s); s = r.next; const wVar = r.val;
            this._shingleSeeds.push({ col, hOff, wVar });
        }

        // Stone seeds for foundation
        this._stoneSeeds = [];
        for (let i = 0; i < 20; i++) {
            let r;
            r = rng(s); s = r.next; const w = r.val;
            r = rng(s); s = r.next; const h = r.val;
            r = rng(s); s = r.next; const c = r.val;
            r = rng(s); s = r.next; const moss = r.val < 0.15;
            this._stoneSeeds.push({ w, h, c, moss });
        }
    }

    /**
     * Log debug message if debug mode is enabled
     */
    debugLog(message, data = null) {
        if (!this.debugCollision) return;

        if (data) {
            console.log(`[Coop Debug] ${message}:`, data);
        } else {
            console.log(`[Coop Debug] ${message}`);
        }
    }

    /**
     * Validates that position coordinates are finite and within canvas bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} canvasWidth - Canvas width (default: 800)
     * @param {number} canvasHeight - Canvas height (default: 600)
     * @returns {boolean} - True if position is valid
     */
    isValidPosition(x, y, canvasWidth = 800, canvasHeight = 600) {
        return Number.isFinite(x) && Number.isFinite(y) &&
               x >= -100 && x <= canvasWidth + 100 &&  // Allow slight overshoot
               y >= -100 && y <= canvasHeight + 100;
    }

    /**
     * Logs position corruption for debugging
     * @param {string} context - Where the corruption was detected
     * @param {Object} position - {x, y} the invalid position
     * @param {Object} fallback - {x, y} the fallback position used
     */
    logPositionCorruption(context, position, fallback) {
        console.error(`[Position Error] ${context}:`, {
            invalid: position,
            fallback: fallback,
            timestamp: Date.now()
        });
    }

    /**
     * Normalize angle to 0-2π range
     * @param {number} angle - Any angle in radians
     * @returns {number} - Normalized angle (0 to 2π)
     */
    normalizeAngle(angle) {
        let normalized = angle % (Math.PI * 2);
        if (normalized < 0) normalized += Math.PI * 2;
        return normalized;
    }

    /**
     * Check if angle is within a gap range with floating-point tolerance
     * @param {number} angle - Normalized angle (0 to 2π)
     * @param {number} gapStart - Gap start angle
     * @param {number} gapEnd - Gap end angle
     * @param {number} epsilon - Tolerance in radians (default: 0.02)
     * @returns {boolean} - True if angle is in gap (with tolerance)
     */
    isAngleInGapWithTolerance(angle, gapStart, gapEnd, epsilon = 0.02) {
        // Handle wrap-around case (gap crosses 0/2π boundary)
        if (gapStart > gapEnd) {
            return angle >= gapStart - epsilon || angle <= gapEnd + epsilon;
        }
        return angle >= gapStart - epsilon && angle <= gapEnd + epsilon;
    }
    
    initChickens() {
        // Initialize 12 chickens inside the coop
        this.chickens = [];
        const types = Object.keys(CHICKEN_TYPE_TEMPLATES);
        const maxChickens = this.maxChickens;

        for (let i = 0; i < maxChickens; i++) {
            // Place chickens within the coop rectangle
            const col = i % 6;
            const row = Math.floor(i / 6);
            const x = this.x - this.width / 2 + 20 + col * 28;
            const y = this.y + 50 + row * 30;

            // Create chicken with staggered type assignment
            const chickenType = types[i % types.length];
            const chicken = new Chicken(i, x, y, chickenType);

            // Set initial state to in_coop
            chicken.state = 'in_coop';
            chicken.inCoop = true;
            chicken.coopResidency = {
                inCoop: true,
                coopId: this,
                entryTime: Date.now() / 1000 - Math.random() * 30 // Random entry time for variety
            };

            // Stagger fade-in animation
            chicken.spawnAnimation = {
                active: true,
                progress: 0,
                delay: i * 0.1 // 100ms stagger between each chicken
            };

            // Assign chicken to a window (1:1 mapping)
            this.assignChickenToWindow(chicken);

            this.chickens.push(chicken);
        }

        // Sync visibility after all chickens are assigned to windows
        this.syncChickenVisibility();
    }

    // NEW: Window assignment methods
    /**
     * Assign a chicken to an available window
     * Returns assigned window index (0-11) or -1 if full
     */
    assignChickenToWindow(chicken) {
        // Check if chicken already has a window assignment
        if (this.chickenWindowMap[chicken.id] !== undefined) {
            const windowIndex = this.chickenWindowMap[chicken.id];

            // Verify window is available (empty or already assigned to this chicken)
            if (this.windowAssignments[windowIndex] === null ||
                this.windowAssignments[windowIndex] === chicken.id) {

                this.windowAssignments[windowIndex] = chicken.id;
                chicken.assignedWindow = windowIndex;
                return windowIndex;
            }
        }

        // Find first available window
        for (let i = 0; i < 12; i++) {
            if (this.windowAssignments[i] === null) {
                this.windowAssignments[i] = chicken.id;
                this.chickenWindowMap[chicken.id] = i;
                chicken.assignedWindow = i;
                return i;
            }
        }

        // No windows available
        console.warn(`No available windows for chicken ${chicken.id}`);
        return -1;
    }

    /**
     * Release a chicken's window when they escape
     * Window becomes empty but mapping is remembered
     */
    releaseWindowAssignment(chickenId) {
        const windowIndex = this.chickenWindowMap[chickenId];

        if (windowIndex !== undefined &&
            this.windowAssignments[windowIndex] === chickenId) {

            // Mark window as empty
            this.windowAssignments[windowIndex] = null;

            // NOTE: We keep chickenWindowMap entry so chicken
            // returns to the same window when they come back
        }
        // Invalidate cache since window state changed
        this._cachedWindowFramesValid = false;
    }

    /**
     * Get the chicken assigned to a specific window
     * Returns chicken object or null
     */
    getChickenForWindow(windowIndex) {
        const chickenId = this.windowAssignments[windowIndex];

        if (chickenId === null) {
            return null;
        }

        // Find chicken by ID in active chickens array
        return this.chickens.find(c => c.id === chickenId) || null;
    }

    /**
     * Get the window index assigned to a specific chicken
     * Returns window index (0-11) or -1
     */
    getWindowForChicken(chickenId) {
        return this.chickenWindowMap[chickenId] ?? -1;
    }

    /**
     * Synchronize chicken visibility with window assignments
     * Chickens with windows have hidden world sprites (shown in windows)
     * Chickens without windows have visible world sprites
     */
    syncChickenVisibility() {
        // Step 1: Hide world sprites for chickens with window assignments that are in the coop
        for (let windowIndex = 0; windowIndex < 12; windowIndex++) {
            const chickenId = this.windowAssignments[windowIndex];

            if (chickenId !== null) {
                const chicken = this.getChickenById(chickenId);

                if (chicken && chicken.coopResidency && chicken.coopResidency.inCoop) {
                    // Chicken has a window slot and is in coop - show window avatar, hide world sprite
                    chicken.worldSpriteVisible = false;
                    chicken.assignedWindow = windowIndex;
                }
            }
        }

        // Step 2: Show world sprites for chickens without windows or not in coop
        this.chickens.forEach(chicken => {
            // Don't override visibility for escaping chickens (handled by updateEscaping)
            if (chicken.state === 'escaping') return;

            if (chicken.assignedWindow === -1 || !(chicken.coopResidency && chicken.coopResidency.inCoop)) {
                // No window assigned or not in coop - show world sprite
                chicken.worldSpriteVisible = true;
            }
        });
    }

    /**
     * Get chicken by ID from active chickens
     */
    getChickenById(id) {
        return this.chickens.find(c => c.id === id) || null;
    }

    addChicken(chicken) {
        if (this.chickens.length >= this.maxChickens) return false;
        this.chickens.push(chicken);
        return true;
    }
    
    update(deltaTime, gameTime) {
        // Update spook timer
        if (this.spookTimer > 0) {
            this.spookTimer -= deltaTime * 1000;
            if (this.spookTimer <= 0) {
                this.wasSpooked = false;
                this.spookTimer = 0;
            }
        }

        // Update all chickens
        const escaped = [];
        this.chickens.forEach(chicken => {
            const result = chicken.update(deltaTime, this, gameTime);
            if (result === 'escaped') {
                escaped.push(chicken);
            }
        });

        // Handle escaped chickens
        escaped.forEach(chicken => {
            // Release window assignment (window becomes empty)
            this.releaseWindowAssignment(chicken.id);

            // Show world sprite for escaped chicken
            chicken.worldSpriteVisible = true;
            chicken.assignedWindow = -1;

            // Remove from active chickens
            const idx = this.chickens.indexOf(chicken);
            if (idx > -1) {
                this.chickens.splice(idx, 1);
                this.escapedChickens.push(chicken);
            }
        });

        // Sync visibility every frame to ensure consistency
        this.syncChickenVisibility();

        return escaped; // Return array of escaped chickens
    }
    
    spook() {
        // Raccoon or other event spooks chickens
        this.wasSpooked = true;
        this.spookTimer = 5000;  // 5 seconds of spook effect
        
        // 30% chance for each chicken to flee
        this.chickens.forEach(chicken => {
            if (chicken.inCoop && Math.random() < 0.3) {
                chicken.leaveCoop();
            }
        });
    }
    
    isOvercrowded() {
        return this.chickens.filter(c => c.inCoop).length >= this.maxChickens;
    }
    
    getChickensWithEggs() {
        return this.chickens.filter(c => c.inCoop && c.hasEgg);
    }
    
    getHungryChickens() {
        return this.chickens.filter(c => c.inCoop && c.hunger < 50);
    }
    
    getInCoopCount() {
        return this.chickens.filter(c => c.inCoop).length;
    }
    
    getEscapedCount() {
        return 12 - this.chickens.length;
    }
    
    returnChicken(chicken) {
        if (!chicken || chicken.inCoop) return false;

        // Check if chicken has previous window assignment
        const windowIndex = this.chickenWindowMap[chicken.id];

        if (windowIndex !== undefined) {
            // Reassign to original window
            this.windowAssignments[windowIndex] = chicken.id;
            chicken.assignedWindow = windowIndex;
        } else {
            // New chicken - assign to first available
            const newWindow = this.assignChickenToWindow(chicken);
            if (newWindow === -1) {
                console.warn('Cannot return chicken - no windows available');
                return false;
            }
        }

        // Add back to active chickens
        chicken.state = 'in_coop';
        chicken.inCoop = true;
        chicken.coopResidency.inCoop = true;
        chicken.coopResidency.coopId = this.id || 'main';
        chicken.coopResidency.entryTime = Date.now() / 1000;

        // Hide world sprite - chicken will be shown in window
        chicken.worldSpriteVisible = false;

        this.chickens.push(chicken);

        // Remove from escaped list
        const escapeIdx = this.escapedChickens.indexOf(chicken);
        if (escapeIdx > -1) {
            this.escapedChickens.splice(escapeIdx, 1);
        }

        return true;
    }

    // ==================== DRAWING METHODS (STORYBOOK OVERHAUL) ====================

    /**
     * Invalidate the offscreen cache (call when coop state changes significantly)
     */
    invalidateCache() {
        this._cacheValid = false;
        this._cachedWindowFramesValid = false;
    }

    /**
     * Build or return the cached offscreen canvas for the static barn structure
     * Contains: walls, roof, foundation, sign, decorations, weather vane, window frames
     */
    _ensureBarnCache() {
        if (this._cacheValid && this._cachedBarn) return this._cachedBarn;

        // Create offscreen canvas sized to contain the full barn + overhang
        const padding = 30;
        const roofHeight = 35;
        const cacheW = this.width + padding * 2 + 20;
        const cacheH = this.height + this.foundationHeight + roofHeight + padding * 2 + 30;

        if (typeof OffscreenCanvas !== 'undefined') {
            this._cachedBarn = new OffscreenCanvas(cacheW, cacheH);
        } else if (typeof document !== 'undefined') {
            this._cachedBarn = document.createElement('canvas');
            this._cachedBarn.width = cacheW;
            this._cachedBarn.height = cacheH;
        } else {
            // No canvas available (server-side) — skip caching
            this._cacheValid = false;
            return null;
        }

        const offCtx = this._cachedBarn.getContext('2d');
        if (!offCtx) { this._cacheValid = false; return null; }

        // Compute offset: barn is drawn at relative (padding, padding + roofHeight + extra)
        this._cacheOffsetX = this.x - this.width / 2 - padding - 10;
        this._cacheOffsetY = this.y - roofHeight - padding - 15;

        offCtx.save();
        offCtx.translate(-this._cacheOffsetX, -this._cacheOffsetY);

        // Draw all static barn elements
        this._drawGroundShadow(offCtx);
        this._drawFoundation(offCtx);
        this._drawBarnWalls(offCtx);
        this._drawRoof(offCtx);
        this._drawWindowFramesStatic(offCtx);
        this._drawHangingSign(offCtx);
        this._drawWeatherVane(offCtx);
        this._drawHayWisps(offCtx);
        this._drawLantern(offCtx);

        offCtx.restore();

        this._cacheValid = true;
        return this._cachedBarn;
    }

    /**
     * Main draw entry point — uses cached static barn + dynamic overlays
     */
    draw(ctx) {
        ctx.save();

        // Draw cached static barn structure
        const cache = this._ensureBarnCache();
        if (cache) {
            ctx.drawImage(cache, this._cacheOffsetX, this._cacheOffsetY);
        } else {
            // Fallback: draw directly (no caching available)
            this._drawGroundShadow(ctx);
            this._drawFoundation(ctx);
            this._drawBarnWalls(ctx);
            this._drawRoof(ctx);
            this._drawWindowFramesStatic(ctx);
            this._drawHangingSign(ctx);
            this._drawWeatherVane(ctx);
            this._drawHayWisps(ctx);
            this._drawLantern(ctx);
        }

        // Dynamic elements drawn every frame
        this._drawWindowContents(ctx);
        this._drawDoor(ctx);
        this._drawLanternGlow(ctx);

        ctx.restore();
    }

    // ==================== STATIC BARN ELEMENTS ====================

    /**
     * Ground shadow beneath the coop
     */
    _drawGroundShadow(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height + this.foundationHeight + 5, this.width / 2 + 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Darker core shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height + this.foundationHeight + 3, this.width / 2 + 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Stone foundation at the base of the barn
     */
    _drawFoundation(ctx) {
        const leftX = this.x - this.width / 2;
        const topY = this.y + this.height;
        const fH = this.foundationHeight;
        const fW = this.width + 10;
        const fX = leftX - 5;

        ctx.save();

        // Base fill with gradient (darker at bottom)
        const foundGrad = ctx.createLinearGradient(fX, topY, fX, topY + fH);
        foundGrad.addColorStop(0, '#6B6B6B');
        foundGrad.addColorStop(0.5, '#5C5C5C');
        foundGrad.addColorStop(1, '#4A4A4A');
        ctx.fillStyle = foundGrad;
        ctx.fillRect(fX, topY, fW, fH);

        // Individual interlocking stones
        let sx = fX + 2;
        let si = 0;
        let row = 0;
        const stoneY = [topY + 1, topY + fH / 2 + 1];
        const stoneRowH = fH / 2 - 2;
        const offsets = [0, 10]; // Stagger offset per row

        for (row = 0; row < 2; row++) {
            sx = fX + 2 + offsets[row];
            while (sx < fX + fW - 4) {
                const seed = this._stoneSeeds[si % this._stoneSeeds.length];
                si++;
                const stW = 14 + seed.w * 16; // 14-30px wide
                const stH = stoneRowH;

                // Stone color variation
                const brightness = 75 + seed.c * 30;
                ctx.fillStyle = `rgb(${brightness}, ${brightness - 3}, ${brightness - 6})`;

                // Slightly rounded stone shape
                const r = 2;
                ctx.beginPath();
                ctx.moveTo(sx + r, stoneY[row]);
                ctx.lineTo(sx + stW - r, stoneY[row]);
                ctx.quadraticCurveTo(sx + stW, stoneY[row], sx + stW, stoneY[row] + r);
                ctx.lineTo(sx + stW, stoneY[row] + stH - r);
                ctx.quadraticCurveTo(sx + stW, stoneY[row] + stH, sx + stW - r, stoneY[row] + stH);
                ctx.lineTo(sx + r, stoneY[row] + stH);
                ctx.quadraticCurveTo(sx, stoneY[row] + stH, sx, stoneY[row] + stH - r);
                ctx.lineTo(sx, stoneY[row] + r);
                ctx.quadraticCurveTo(sx, stoneY[row], sx + r, stoneY[row]);
                ctx.closePath();
                ctx.fill();

                // Mortar lines (lighter outline)
                ctx.strokeStyle = 'rgba(180,175,165,0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Moss on some stones near bottom
                if (seed.moss && row === 1) {
                    ctx.fillStyle = 'rgba(80, 140, 60, 0.4)';
                    ctx.beginPath();
                    ctx.arc(sx + stW * 0.3, stoneY[row] + stH - 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(sx + stW * 0.7, stoneY[row] + stH - 1, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                sx += stW + 2; // 2px mortar gap
            }
        }

        // Ambient occlusion at top (where wall meets foundation)
        const aoGrad = ctx.createLinearGradient(fX, topY, fX, topY + 4);
        aoGrad.addColorStop(0, 'rgba(0,0,0,0.25)');
        aoGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aoGrad;
        ctx.fillRect(fX, topY, fW, 4);

        ctx.restore();
    }

    /**
     * Barn walls with wood plank texture, grain, knots, and weathering
     */
    _drawBarnWalls(ctx) {
        const leftX = this.x - this.width / 2;
        const topY = this.y;
        const w = this.width;
        const h = this.height;

        ctx.save();

        // Base wall gradient (lighter at top for light source from top-right)
        const wallGrad = ctx.createLinearGradient(leftX, topY, leftX + w, topY + h);
        wallGrad.addColorStop(0, '#A0622D'); // top-left: slightly lit
        wallGrad.addColorStop(0.3, '#A0522D'); // base coop-wood
        wallGrad.addColorStop(0.7, '#8B4726');
        wallGrad.addColorStop(1, '#7A3E22'); // bottom: darker
        ctx.fillStyle = wallGrad;
        ctx.fillRect(leftX, topY, w, h);

        // Individual horizontal planks
        const plankH = 15;
        const numPlanks = Math.ceil(h / plankH);

        for (let i = 0; i < numPlanks; i++) {
            const py = topY + i * plankH;
            const pH = Math.min(plankH, topY + h - py);
            if (pH <= 0) break;

            const seed = this._plankSeeds[i % this._plankSeeds.length];

            // Per-plank color variation (weathering)
            const baseR = 160 + (seed.colorVar - 0.5) * 20;
            const baseG = 82 + (seed.colorVar - 0.5) * 12;
            const baseB = 45 + (seed.colorVar - 0.5) * 10;

            // Light gradient per plank (lighter at top edge, darker at bottom)
            const plankGrad = ctx.createLinearGradient(leftX, py, leftX, py + pH);
            plankGrad.addColorStop(0, `rgba(${baseR + 10}, ${baseG + 6}, ${baseB + 4}, 0.4)`);
            plankGrad.addColorStop(0.5, `rgba(${baseR}, ${baseG}, ${baseB}, 0.15)`);
            plankGrad.addColorStop(1, `rgba(${baseR - 15}, ${baseG - 10}, ${baseB - 5}, 0.3)`);
            ctx.fillStyle = plankGrad;
            ctx.fillRect(leftX, py, w, pH);

            // Plank gap (thin dark line between planks)
            if (i > 0) {
                ctx.strokeStyle = 'rgba(40, 20, 10, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(leftX, py);
                ctx.lineTo(leftX + w, py);
                ctx.stroke();
            }

            // Wood grain lines (2-3 thin darker streaks per plank)
            ctx.strokeStyle = 'rgba(80, 40, 20, 0.15)';
            ctx.lineWidth = 0.5;
            const grainCount = 2 + Math.floor(seed.grainOff * 2);
            for (let g = 0; g < grainCount; g++) {
                const gy = py + 3 + (g * (pH - 6)) / grainCount + seed.grainOff * 2;
                ctx.beginPath();
                ctx.moveTo(leftX + 2, gy);
                // Wavy grain using quadratic curves
                const midX1 = leftX + w * 0.3;
                const midX2 = leftX + w * 0.7;
                ctx.quadraticCurveTo(midX1, gy + (seed.grainOff - 0.5) * 3, leftX + w * 0.5, gy + 0.5);
                ctx.quadraticCurveTo(midX2, gy - (seed.grainOff - 0.5) * 2, leftX + w - 2, gy + 1);
                ctx.stroke();
            }

            // Knot holes on some planks
            if (seed.hasKnot) {
                const kx = leftX + 10 + seed.knotX * (w - 20);
                const ky = py + 3 + seed.knotY * (pH - 6);
                // Outer knot ring
                ctx.fillStyle = 'rgba(60, 30, 15, 0.5)';
                ctx.beginPath();
                ctx.ellipse(kx, ky, 3.5, 2.5, seed.grainOff * 0.5, 0, Math.PI * 2);
                ctx.fill();
                // Inner knot
                ctx.fillStyle = 'rgba(40, 20, 10, 0.6)';
                ctx.beginPath();
                ctx.ellipse(kx, ky, 2, 1.5, seed.grainOff * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Weathering patches (subtle darker/lighter spots)
            if (seed.weathering > 0.7) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(leftX + seed.knotX * w * 0.6 + 5, py + 2, 20 + seed.weathering * 15, pH - 4);
            } else if (seed.weathering < 0.2) {
                ctx.fillStyle = 'rgba(255, 240, 220, 0.06)';
                ctx.fillRect(leftX + seed.knotY * w * 0.5 + 10, py + 1, 15 + seed.weathering * 20, pH - 2);
            }
        }

        // Light source highlight from top-right (subtle diagonal gradient overlay)
        const lightGrad = ctx.createLinearGradient(leftX + w, topY, leftX, topY + h);
        lightGrad.addColorStop(0, 'rgba(255, 240, 200, 0.08)');
        lightGrad.addColorStop(0.5, 'rgba(255, 240, 200, 0)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.06)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(leftX, topY, w, h);

        // Vertical corner trim (barn red with highlight)
        // Left trim
        const trimGradL = ctx.createLinearGradient(leftX - 4, topY, leftX, topY);
        trimGradL.addColorStop(0, '#C96450');
        trimGradL.addColorStop(1, '#B85450');
        ctx.fillStyle = trimGradL;
        ctx.fillRect(leftX - 4, topY, 5, h);
        // Highlight edge
        ctx.strokeStyle = 'rgba(255, 200, 150, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftX - 4, topY);
        ctx.lineTo(leftX - 4, topY + h);
        ctx.stroke();

        // Right trim
        const trimGradR = ctx.createLinearGradient(leftX + w - 1, topY, leftX + w + 4, topY);
        trimGradR.addColorStop(0, '#B85450');
        trimGradR.addColorStop(1, '#9E4440');
        ctx.fillStyle = trimGradR;
        ctx.fillRect(leftX + w - 1, topY, 5, h);

        // Nail heads where trim meets planks
        ctx.fillStyle = 'rgba(40, 40, 40, 0.5)';
        for (let i = 0; i < numPlanks; i++) {
            const ny = topY + i * plankH + plankH / 2;
            if (ny < topY + h - 2) {
                // Left trim nails
                ctx.beginPath();
                ctx.arc(leftX - 2, ny, 1, 0, Math.PI * 2);
                ctx.fill();
                // Right trim nails
                ctx.beginPath();
                ctx.arc(leftX + w + 1, ny, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Roof overhang shadow on top of wall
        const overhangShadow = ctx.createLinearGradient(leftX, topY, leftX, topY + 8);
        overhangShadow.addColorStop(0, 'rgba(0,0,0,0.3)');
        overhangShadow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = overhangShadow;
        ctx.fillRect(leftX, topY, w, 8);

        ctx.restore();
    }

    /**
     * Shingled roof with staggered rows, ridge cap, and organic shapes
     */
    _drawRoof(ctx) {
        const leftX = this.x - this.width / 2;
        const topY = this.y;
        const roofHeight = 35;
        const roofOverhang = 10;

        const peakX = this.x;
        const peakY = topY - roofHeight;
        const leftEdge = leftX - roofOverhang;
        const rightEdge = leftX + this.width + roofOverhang;

        ctx.save();

        // Clip to roof triangle for shingles
        ctx.beginPath();
        ctx.moveTo(leftEdge - 2, topY + 2);
        ctx.lineTo(peakX, peakY - 2);
        ctx.lineTo(rightEdge + 2, topY + 2);
        ctx.closePath();
        ctx.clip();

        // Base roof fill
        const roofGrad = ctx.createLinearGradient(peakX, peakY, peakX, topY);
        roofGrad.addColorStop(0, '#5B1A1A'); // darker at peak
        roofGrad.addColorStop(0.3, '#8B0000'); // coop-roof
        roofGrad.addColorStop(0.7, '#7B2020');
        roofGrad.addColorStop(1, '#6B1515');
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(leftEdge - 2, topY + 2);
        ctx.lineTo(peakX, peakY - 2);
        ctx.lineTo(rightEdge + 2, topY + 2);
        ctx.closePath();
        ctx.fill();

        // Staggered shingle rows
        const shingleH = 6;
        const shingleW = 14;
        const numRows = Math.ceil(roofHeight / shingleH) + 1;
        let sIdx = 0;

        for (let row = 0; row < numRows; row++) {
            const rowY = peakY + 4 + row * shingleH;
            if (rowY > topY + 2) break;

            // Calculate row width at this Y position (lerp from peak to base)
            const t = (rowY - peakY) / roofHeight;
            const rowHalfW = t * ((rightEdge - leftEdge) / 2);
            const rowLeft = peakX - rowHalfW;
            const rowRight = peakX + rowHalfW;
            const stagger = (row % 2) * (shingleW / 2);

            let sx = rowLeft + stagger - shingleW;
            while (sx < rowRight + shingleW) {
                const seed = this._shingleSeeds[sIdx % this._shingleSeeds.length];
                sIdx++;

                // Per-shingle color variation
                const rr = 100 + seed.col * 50;
                const gg = 15 + seed.col * 20;
                const bb = 15 + seed.col * 15;
                ctx.fillStyle = `rgb(${rr}, ${gg}, ${bb})`;

                // Slightly irregular shingle shape using bezier
                const sw = shingleW + (seed.wVar - 0.5) * 3;
                const sh = shingleH + (seed.hOff - 0.5) * 1.5;

                ctx.beginPath();
                ctx.moveTo(sx + 1, rowY);
                ctx.lineTo(sx + sw - 1, rowY);
                ctx.quadraticCurveTo(sx + sw, rowY + sh * 0.7, sx + sw - 1, rowY + sh);
                ctx.lineTo(sx + 1, rowY + sh);
                ctx.quadraticCurveTo(sx, rowY + sh * 0.7, sx + 1, rowY);
                ctx.closePath();
                ctx.fill();

                // Shingle shadow at bottom edge
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(sx + 2, rowY + sh);
                ctx.lineTo(sx + sw - 2, rowY + sh);
                ctx.stroke();

                sx += sw + 1;
            }
        }

        ctx.restore(); // Restore clip

        // Ridge cap at the peak
        ctx.save();
        ctx.strokeStyle = '#4A0E0E';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftEdge + 15, topY - roofHeight + 6);
        ctx.lineTo(rightEdge - 15, topY - roofHeight + 6);
        ctx.stroke();
        // Ridge highlight
        ctx.strokeStyle = 'rgba(200, 120, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftEdge + 16, topY - roofHeight + 5);
        ctx.lineTo(rightEdge - 16, topY - roofHeight + 5);
        ctx.stroke();
        ctx.restore();

        // Roof edge trim (barn red outline)
        ctx.save();
        ctx.strokeStyle = '#B85450';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftEdge, topY);
        ctx.lineTo(peakX, peakY);
        ctx.lineTo(rightEdge, topY);
        ctx.stroke();

        // Gold trim accent along roof edge
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftEdge + 1, topY - 1);
        ctx.lineTo(peakX, peakY - 1);
        ctx.lineTo(rightEdge - 1, topY - 1);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Static window frames (cached) — frame borders, sills, shutters hints
     */
    _drawWindowFramesStatic(ctx) {
        const { cols, rows, width: w, height: h, gap } = this.windows;
        const totalWidth = (cols * w) + ((cols - 1) * gap);
        const startX = this.x - totalWidth / 2;
        const startY = this.y + 40;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const wx = startX + col * (w + gap);
                const wy = startY + row * (h + gap);
                this._drawSingleWindowFrame(ctx, wx, wy, w, h);
            }
        }
    }

    /**
     * Draw a single framed window (static structure only)
     */
    _drawSingleWindowFrame(ctx, x, y, w, h) {
        ctx.save();

        // Outer frame (darker wood border) — 3D illusion with double stroke
        // Shadow/depth outline
        ctx.fillStyle = '#5D3A1A';
        ctx.fillRect(x - 3, y - 3, w + 6, h + 8); // +8 for sill

        // Inner frame (lighter wood)
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

        // Window pane background (semi-translucent)
        const paneGrad = ctx.createLinearGradient(x, y, x, y + h);
        paneGrad.addColorStop(0, 'rgba(180, 210, 240, 0.25)');
        paneGrad.addColorStop(0.5, 'rgba(200, 220, 255, 0.15)');
        paneGrad.addColorStop(1, 'rgba(160, 190, 220, 0.2)');
        ctx.fillStyle = paneGrad;
        ctx.fillRect(x, y, w, h);

        // Cross-bar dividers (muntins)
        ctx.strokeStyle = '#A07828';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();

        // Window sill at bottom
        ctx.fillStyle = '#6B4E2A';
        const sillH = 3;
        ctx.fillRect(x - 3, y + h + 1, w + 6, sillH);
        // Sill highlight on top edge
        ctx.strokeStyle = 'rgba(200, 170, 120, 0.4)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - 3, y + h + 1);
        ctx.lineTo(x + w + 3, y + h + 1);
        ctx.stroke();
        // Sill shadow below
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x - 2, y + h + sillH + 1, w + 4, 2);

        // Subtle shutter hints (tiny angled lines on each side)
        ctx.strokeStyle = 'rgba(93, 58, 26, 0.35)';
        ctx.lineWidth = 0.5;
        // Left shutter
        for (let i = 0; i < 3; i++) {
            const sy = y + 4 + i * (h / 3);
            ctx.beginPath();
            ctx.moveTo(x - 2, sy);
            ctx.lineTo(x - 1, sy + 3);
            ctx.stroke();
        }
        // Right shutter
        for (let i = 0; i < 3; i++) {
            const sy = y + 4 + i * (h / 3);
            ctx.beginPath();
            ctx.moveTo(x + w + 2, sy);
            ctx.lineTo(x + w + 1, sy + 3);
            ctx.stroke();
        }

        // Curtain hint (tiny fabric curves at top inside corners)
        ctx.strokeStyle = 'rgba(245, 235, 210, 0.3)';
        ctx.lineWidth = 1;
        // Left curtain
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 1);
        ctx.quadraticCurveTo(x + 3, y + 5, x + 1, y + 8);
        ctx.stroke();
        // Right curtain
        ctx.beginPath();
        ctx.moveTo(x + w - 1, y + 1);
        ctx.quadraticCurveTo(x + w - 3, y + 5, x + w - 1, y + 8);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Hanging sign on front — "COOP" text on wooden plank with chains
     */
    _drawHangingSign(ctx) {
        const signW = 52;
        const signH = 16;
        const signX = this.x - signW / 2;
        const signY = this.y + 10;

        ctx.save();

        // Chain segments (series of small circles from roof area)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = '#888';
        const chainY = signY - 4;
        // Left chain
        for (let i = 0; i < 3; i++) {
            const cy = signY - 3 - i * 3;
            ctx.beginPath();
            ctx.arc(signX + 6, cy, 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Right chain
        for (let i = 0; i < 3; i++) {
            const cy = signY - 3 - i * 3;
            ctx.beginPath();
            ctx.arc(signX + signW - 6, cy, 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Wooden plaque with beveled edge
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(signX + 1, signY + 1, signW, signH);

        // Main plaque
        const plankGrad = ctx.createLinearGradient(signX, signY, signX, signY + signH);
        plankGrad.addColorStop(0, '#D2A66A');
        plankGrad.addColorStop(0.5, '#C9963E');
        plankGrad.addColorStop(1, '#B8862B');
        ctx.fillStyle = plankGrad;

        // Slightly rounded plaque shape
        const pr = 2;
        ctx.beginPath();
        ctx.moveTo(signX + pr, signY);
        ctx.lineTo(signX + signW - pr, signY);
        ctx.quadraticCurveTo(signX + signW, signY, signX + signW, signY + pr);
        ctx.lineTo(signX + signW, signY + signH - pr);
        ctx.quadraticCurveTo(signX + signW, signY + signH, signX + signW - pr, signY + signH);
        ctx.lineTo(signX + pr, signY + signH);
        ctx.quadraticCurveTo(signX, signY + signH, signX, signY + signH - pr);
        ctx.lineTo(signX, signY + pr);
        ctx.quadraticCurveTo(signX, signY, signX + pr, signY);
        ctx.closePath();
        ctx.fill();

        // Beveled border
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Wood grain lines on sign
        ctx.strokeStyle = 'rgba(120, 80, 30, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(signX + 3, signY + 5);
        ctx.lineTo(signX + signW - 3, signY + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(signX + 3, signY + 11);
        ctx.lineTo(signX + signW - 3, signY + 11);
        ctx.stroke();

        // "COOP" text with hand-lettered style (slight wobble via shadow)
        ctx.fillStyle = '#3E2215';
        ctx.font = 'bold 10px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Slight shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillText('COOP', this.x + 0.5, signY + signH / 2 + 0.5);
        // Main text
        ctx.fillStyle = '#3E2215';
        ctx.fillText('COOP', this.x, signY + signH / 2);

        // Gold trim text outline
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeText('COOP', this.x, signY + signH / 2);

        ctx.restore();
    }

    /**
     * Weather vane / chicken silhouette on roof peak
     */
    _drawWeatherVane(ctx) {
        const peakX = this.x;
        const peakY = this.y - 35;

        ctx.save();

        // Pole
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(peakX, peakY);
        ctx.lineTo(peakX, peakY - 18);
        ctx.stroke();

        // Cross bar
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(peakX - 8, peakY - 14);
        ctx.lineTo(peakX + 8, peakY - 14);
        ctx.stroke();

        // N-S-E-W indicators (tiny)
        ctx.fillStyle = '#4A4A4A';
        ctx.font = '4px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', peakX, peakY - 16);
        ctx.fillText('S', peakX, peakY - 12);
        ctx.fillText('E', peakX + 10, peakY - 14);
        ctx.fillText('W', peakX - 10, peakY - 14);

        // Chicken silhouette on top
        ctx.fillStyle = '#2D2D2D';
        ctx.beginPath();
        // Body
        ctx.ellipse(peakX + 1, peakY - 20, 4, 2.5, -0.1, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(peakX + 4, peakY - 22, 2, 0, Math.PI * 2);
        ctx.fill();
        // Beak
        ctx.beginPath();
        ctx.moveTo(peakX + 5.5, peakY - 22);
        ctx.lineTo(peakX + 8, peakY - 21.5);
        ctx.lineTo(peakX + 5.5, peakY - 21);
        ctx.fill();
        // Tail
        ctx.beginPath();
        ctx.moveTo(peakX - 3, peakY - 21);
        ctx.lineTo(peakX - 6, peakY - 24);
        ctx.lineTo(peakX - 4, peakY - 19);
        ctx.fill();
        // Comb
        ctx.fillStyle = '#6B1515';
        ctx.beginPath();
        ctx.arc(peakX + 4, peakY - 24, 1.2, Math.PI, 0);
        ctx.fill();

        // Pole cap (small circle)
        ctx.fillStyle = '#5A5A5A';
        ctx.beginPath();
        ctx.arc(peakX, peakY - 18, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Hay wisps sticking out from wall edges
     */
    _drawHayWisps(ctx) {
        const leftX = this.x - this.width / 2;
        const rightX = this.x + this.width / 2;
        const bottomY = this.y + this.height;

        ctx.save();
        ctx.strokeStyle = '#D4A554';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        // Left side wisps
        const wisps = [
            { x: leftX - 2, y: this.y + 30, dx: -8, dy: -3, cp: -4 },
            { x: leftX - 1, y: this.y + 55, dx: -10, dy: -1, cp: -6 },
            { x: leftX, y: this.y + 80, dx: -7, dy: 2, cp: -5 },
            { x: leftX - 1, y: bottomY - 5, dx: -9, dy: -2, cp: -3 },
        ];

        wisps.forEach(w => {
            ctx.beginPath();
            ctx.moveTo(w.x, w.y);
            ctx.quadraticCurveTo(w.x + w.cp, w.y + w.dy, w.x + w.dx, w.y + w.dy * 2);
            ctx.stroke();
        });

        // Right side wisps
        const rightWisps = [
            { x: rightX + 2, y: this.y + 25, dx: 7, dy: -4, cp: 5 },
            { x: rightX + 1, y: this.y + 60, dx: 9, dy: -1, cp: 4 },
            { x: rightX, y: this.y + 90, dx: 6, dy: 3, cp: 3 },
        ];

        rightWisps.forEach(w => {
            ctx.beginPath();
            ctx.moveTo(w.x, w.y);
            ctx.quadraticCurveTo(w.x + w.cp, w.y + w.dy, w.x + w.dx, w.y + w.dy * 2);
            ctx.stroke();
        });

        // Bottom edge wisps (near foundation)
        ctx.strokeStyle = '#C89844';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const bx = leftX + 15 + i * 45;
            // Skip door area
            if (bx > this.doorLeft - 8 && bx < this.doorRight + 8) continue;
            ctx.beginPath();
            ctx.moveTo(bx, bottomY);
            ctx.quadraticCurveTo(bx + 3, bottomY + 4, bx + 6, bottomY + 7);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Lantern by the door (static structure — glow is dynamic)
     */
    _drawLantern(ctx) {
        const lanternX = this.doorLeft - 12;
        const lanternY = this.visualBottom - this.doorHeight - 5;

        ctx.save();

        // Bracket arm
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lanternX + 5, lanternY - 8);
        ctx.lineTo(lanternX, lanternY - 5);
        ctx.lineTo(lanternX, lanternY);
        ctx.stroke();

        // Lantern body (small rectangle)
        ctx.fillStyle = '#3A3A3A';
        ctx.fillRect(lanternX - 3, lanternY, 6, 8);

        // Glass pane (warm)
        ctx.fillStyle = 'rgba(255, 200, 80, 0.6)';
        ctx.fillRect(lanternX - 2, lanternY + 1, 4, 6);

        // Top and bottom caps
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(lanternX - 4, lanternY - 1, 8, 2);
        ctx.fillRect(lanternX - 4, lanternY + 8, 8, 2);

        // Hook
        ctx.beginPath();
        ctx.arc(lanternX, lanternY - 2, 2, Math.PI, 0);
        ctx.stroke();

        ctx.restore();
    }

    // ==================== DYNAMIC ELEMENTS (drawn every frame) ====================

    /**
     * Lantern warm glow effect (dynamic — pulsing)
     */
    _drawLanternGlow(ctx) {
        const lanternX = this.doorLeft - 12;
        const lanternY = this.visualBottom - this.doorHeight - 1;
        const time = Date.now() / 1000;
        const pulse = 0.85 + Math.sin(time * 3) * 0.15;

        ctx.save();
        const glow = ctx.createRadialGradient(lanternX, lanternY + 4, 0, lanternX, lanternY + 4, 18 * pulse);
        glow.addColorStop(0, 'rgba(255, 200, 80, 0.2)');
        glow.addColorStop(0.5, 'rgba(255, 180, 60, 0.08)');
        glow.addColorStop(1, 'rgba(255, 160, 40, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lanternX, lanternY + 4, 18 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw window contents (dynamic — chickens change)
     */
    _drawWindowContents(ctx) {
        const { cols, rows, width: w, height: h, gap } = this.windows;
        const totalWidth = (cols * w) + ((cols - 1) * gap);
        const startX = this.x - totalWidth / 2;
        const startY = this.y + 40;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const windowIndex = row * cols + col;
                const wx = startX + col * (w + gap);
                const wy = startY + row * (h + gap);

                const chicken = this.getChickenForWindow(windowIndex);

                if (chicken && chicken.coopResidency && chicken.coopResidency.inCoop && chicken.state !== 'escaping') {
                    // Occupied window: warm interior + chicken
                    this._drawOccupiedWindow(ctx, wx, wy, w, h, chicken);
                } else {
                    // Empty window: dark interior
                    this._drawEmptyWindowInterior(ctx, wx, wy, w, h);
                }
            }
        }
    }

    /**
     * Occupied window with warm glow and chicken sprite
     */
    _drawOccupiedWindow(ctx, x, y, w, h, chicken) {
        ctx.save();

        // Warm interior glow
        const glowGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w);
        glowGrad.addColorStop(0, 'rgba(255, 220, 150, 0.25)');
        glowGrad.addColorStop(0.5, 'rgba(255, 200, 120, 0.12)');
        glowGrad.addColorStop(1, 'rgba(255, 180, 80, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Warm brown interior
        const interiorGrad = ctx.createLinearGradient(x, y, x, y + h);
        interiorGrad.addColorStop(0, '#5D4232');
        interiorGrad.addColorStop(0.5, '#4D3424');
        interiorGrad.addColorStop(1, '#3D2818');
        ctx.fillStyle = interiorGrad;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

        // Warm ambient tint
        ctx.fillStyle = 'rgba(255, 200, 120, 0.08)';
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

        // Straw nest at bottom (enhanced)
        ctx.strokeStyle = '#D4A554';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const strawX = x + 2 + (i * (w - 4)) / 10;
            const strawY = y + h - 6 + Math.sin(i * 1.5) * 2;
            ctx.beginPath();
            ctx.moveTo(strawX, strawY + 3);
            ctx.quadraticCurveTo(strawX + 1, strawY, strawX + 3, strawY + 1);
            ctx.stroke();
        }
        // Crossing straw
        ctx.strokeStyle = '#C89844';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 5; i++) {
            const sx = x + 3 + i * (w - 6) / 5;
            ctx.beginPath();
            ctx.moveTo(sx, y + h - 3);
            ctx.lineTo(sx + 4, y + h - 7);
            ctx.stroke();
        }

        // Draw chicken sprite in window
        this.drawChickenSprite(ctx, chicken, x, y, w, h);

        ctx.restore();
    }

    /**
     * Empty window interior (dark, with subtle depth)
     */
    _drawEmptyWindowInterior(ctx, x, y, w, h) {
        ctx.save();

        // Dark interior with depth gradient
        const interiorGrad = ctx.createLinearGradient(x, y, x, y + h);
        interiorGrad.addColorStop(0, '#2C2416');
        interiorGrad.addColorStop(0.5, '#231D12');
        interiorGrad.addColorStop(1, '#1A150F');
        ctx.fillStyle = interiorGrad;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

        // Darker corners for depth
        const cornerGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w);
        cornerGrad.addColorStop(0, 'rgba(30, 25, 15, 0)');
        cornerGrad.addColorStop(1, 'rgba(10, 8, 5, 0.3)');
        ctx.fillStyle = cornerGrad;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

        // Some remaining straw at bottom
        ctx.strokeStyle = 'rgba(180, 140, 80, 0.3)';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 4; i++) {
            const sx = x + 3 + i * (w - 6) / 4;
            const sy = y + h - 4;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + 2, sy - 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Draw chicken sprite inside a window (simplified but illustrative)
     */
    drawChickenSprite(ctx, chicken, x, y, w, h) {
        const cx = x + w / 2;
        const cy = y + h / 2 + 2;

        // Chicken colors based on chicken ID
        const colorVariations = [
            { body: '#F5F5F5', highlight: '#FFFFFF', shadow: '#E0E0E0' }, // White
            { body: '#8B4513', highlight: '#A0522D', shadow: '#654321' }, // Brown
            { body: '#CD5C5C', highlight: '#F08080', shadow: '#8B3A3A' }, // Red
            { body: '#2F2F2F', highlight: '#4A4A4A', shadow: '#1A1A1A' }, // Black
            { body: '#DAA520', highlight: '#FFD700', shadow: '#B8860B' }, // Golden
            { body: '#E6A8D7', highlight: '#FFB6C1', shadow: '#C71585' }, // Pink
            { body: '#808080', highlight: '#A9A9A9', shadow: '#696969' }, // Gray
            { body: '#4169E1', highlight: '#6495ED', shadow: '#27408B' }, // Blue
            { body: '#228B22', highlight: '#32CD32', shadow: '#006400' }, // Green
            { body: '#FF8C00', highlight: '#FFA500', shadow: '#CC7000' }, // Orange
            { body: '#800080', highlight: '#9932CC', shadow: '#4B0082' }, // Purple
            { body: '#40E0D0', highlight: '#00CED1', shadow: '#20B2AA' }, // Cyan
        ];

        const colors = colorVariations[chicken.id % colorVariations.length];

        // Determine pose based on chicken state
        let pose = 'nesting';
        if (chicken.state === 'sleeping' || chicken.state === 'resting') {
            pose = 'sleeping';
        } else if (chicken.state === 'alert' || chicken.state === 'pecking') {
            pose = 'alert';
        }

        // Subtle idle animation
        const time = Date.now() / 1000;
        const bobOffset = Math.sin(time * 2 + chicken.id) * 1;
        const drawY = cy + bobOffset;

        // Draw chicken based on pose
        switch (pose) {
            case 'nesting':
                this.drawNestingChicken(ctx, cx, drawY, colors, chicken.hasEgg);
                break;
            case 'sleeping':
                this.drawSleepingChicken(ctx, cx, drawY, colors);
                break;
            case 'alert':
                this.drawAlertChicken(ctx, cx, drawY, colors);
                break;
            default:
                this.drawNestingChicken(ctx, cx, drawY, colors, chicken.hasEgg);
        }
    }

    drawNestingChicken(ctx, x, y, colors, hasEgg) {
        ctx.save();

        // Body (rounded shape with feather feel — layered ellipses)
        // Base body
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Body outline
        ctx.strokeStyle = colors.shadow;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Breast feather layer (lighter)
        ctx.fillStyle = colors.highlight;
        ctx.beginPath();
        ctx.ellipse(x + 1, y + 1, 5, 3.5, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Highlight (top-right for light source)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y - 2, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing (accent layer)
        ctx.fillStyle = colors.shadow;
        ctx.beginPath();
        ctx.ellipse(x - 2, y + 1, 4, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Wing feather detail (tiny lines)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x - 1, y + 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 0.5);
        ctx.lineTo(x, y + 1.5);
        ctx.stroke();

        // Tail feathers (organic bezier shapes)
        ctx.fillStyle = colors.shadow;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 1);
        ctx.bezierCurveTo(x - 9, y - 4, x - 11, y - 5, x - 10, y - 3);
        ctx.bezierCurveTo(x - 11, y - 1, x - 9, y + 1, x - 7, y + 1);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.arc(x + 5, y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.shadow;
        ctx.lineWidth = 0.4;
        ctx.stroke();

        // Beak (two-part for open/closed feel)
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(x + 8, y - 4);
        ctx.lineTo(x + 11, y - 3.5);
        ctx.lineTo(x + 8, y - 3);
        ctx.closePath();
        ctx.fill();
        // Lower beak hint
        ctx.fillStyle = '#E8960A';
        ctx.beginPath();
        ctx.moveTo(x + 8, y - 3);
        ctx.lineTo(x + 10, y - 2.5);
        ctx.lineTo(x + 8, y - 2.5);
        ctx.closePath();
        ctx.fill();

        // Eye (with sclera and highlight)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 5, 1.5, 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + 6.3, y - 5, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + 6.7, y - 5.4, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Comb (red, organic shape with bumps)
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.moveTo(x + 3.5, y - 7);
        ctx.bezierCurveTo(x + 4, y - 9, x + 5, y - 9.5, x + 5, y - 8);
        ctx.bezierCurveTo(x + 5.5, y - 9.5, x + 6.5, y - 9, x + 6.5, y - 7);
        ctx.closePath();
        ctx.fill();

        // Egg if present
        if (hasEgg) {
            // Egg with gradient shading
            const eggGrad = ctx.createRadialGradient(x + 2.5, y + 3.5, 0.5, x + 3, y + 4, 3);
            eggGrad.addColorStop(0, '#FFFFF0');
            eggGrad.addColorStop(0.7, '#FFF8DC');
            eggGrad.addColorStop(1, '#F0E6C0');
            ctx.fillStyle = eggGrad;
            ctx.beginPath();
            ctx.ellipse(x + 3, y + 4, 3, 2.2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Egg highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(x + 2, y + 3, 1, 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawSleepingChicken(ctx, x, y, colors) {
        ctx.save();

        // Lower body (sleeping position — flattened)
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.shadow;
        ctx.lineWidth = 0.4;
        ctx.stroke();

        // Breast highlight
        ctx.fillStyle = colors.highlight;
        ctx.beginPath();
        ctx.ellipse(x + 1, y + 2, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing resting
        ctx.fillStyle = colors.shadow;
        ctx.beginPath();
        ctx.ellipse(x - 1, y + 3, 4, 2.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Head tucked in
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.arc(x + 3, y - 1, 4, 0, Math.PI * 2);
        ctx.fill();

        // Closed eye (sleeping line)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 4, y - 2);
        ctx.lineTo(x + 6, y - 2);
        ctx.stroke();

        // Zzz (floating)
        const time = Date.now() / 1000;
        const zFloat = Math.sin(time * 1.5) * 1.5;
        ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
        ctx.font = 'bold 6px serif';
        ctx.textAlign = 'center';
        ctx.fillText('z', x + 8, y - 6 + zFloat);
        ctx.font = 'bold 4px serif';
        ctx.fillStyle = 'rgba(135, 206, 235, 0.5)';
        ctx.fillText('z', x + 11, y - 9 + zFloat * 0.7);

        ctx.restore();
    }

    drawAlertChicken(ctx, x, y, colors) {
        ctx.save();

        // Body (more upright)
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 6, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.shadow;
        ctx.lineWidth = 0.4;
        ctx.stroke();

        // Highlight
        ctx.fillStyle = colors.highlight;
        ctx.beginPath();
        ctx.ellipse(x + 1, y - 1, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing (slightly raised)
        ctx.fillStyle = colors.shadow;
        ctx.beginPath();
        ctx.ellipse(x - 2, y + 0.5, 4, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Head raised higher
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.arc(x + 4, y - 6, 4, 0, Math.PI * 2);
        ctx.fill();

        // Beak open (alert)
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(x + 7, y - 6);
        ctx.lineTo(x + 10.5, y - 5);
        ctx.lineTo(x + 7, y - 4.5);
        ctx.closePath();
        ctx.fill();
        // Lower beak
        ctx.fillStyle = '#E8960A';
        ctx.beginPath();
        ctx.moveTo(x + 7, y - 4.5);
        ctx.lineTo(x + 9.5, y - 3.5);
        ctx.lineTo(x + 7, y - 3.5);
        ctx.closePath();
        ctx.fill();

        // Alert eye (larger, surprised)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x + 5, y - 7, 2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + 5.5, y - 7, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + 6, y - 7.5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Comb (raised, alert)
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.moveTo(x + 2.5, y - 9);
        ctx.bezierCurveTo(x + 3, y - 11.5, x + 4.5, y - 12, x + 4.5, y - 9.5);
        ctx.bezierCurveTo(x + 5, y - 12, x + 6.5, y - 11, x + 6, y - 9);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    /**
     * Barn door with wood plank texture, hardware, and frame
     * This is drawn every frame since door state can change
     */
    _drawDoor(ctx) {
        const doorX = this.x - this.doorWidth / 2;
        const doorY = this.visualBottom - this.doorHeight;
        const dw = this.doorWidth;
        const dh = this.doorHeight;

        ctx.save();

        // Door opening (dark interior)
        const interiorGrad = ctx.createLinearGradient(doorX, doorY, doorX, doorY + dh);
        interiorGrad.addColorStop(0, '#1A150F');
        interiorGrad.addColorStop(1, '#0F0C08');
        ctx.fillStyle = interiorGrad;
        ctx.fillRect(doorX, doorY, dw, dh);

        // Double barn door (two halves, slightly ajar feel)
        const halfW = dw / 2 - 1;

        // Left door panel
        this._drawDoorPanel(ctx, doorX + 1, doorY + 1, halfW, dh - 2, true);
        // Right door panel
        this._drawDoorPanel(ctx, doorX + halfW + 2, doorY + 1, halfW, dh - 2, false);

        // Door frame (barn red with highlight)
        ctx.strokeStyle = '#B85450';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(doorX - 1, doorY - 1, dw + 2, dh + 2);

        // Frame highlight (inner edge)
        ctx.strokeStyle = 'rgba(200, 120, 100, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(doorX, doorY, dw, dh);

        // Door header (thicker beam above)
        const headerGrad = ctx.createLinearGradient(doorX - 3, doorY - 5, doorX - 3, doorY);
        headerGrad.addColorStop(0, '#C96450');
        headerGrad.addColorStop(1, '#B85450');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(doorX - 3, doorY - 5, dw + 6, 5);
        // Header highlight
        ctx.strokeStyle = 'rgba(255, 200, 150, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(doorX - 3, doorY - 5);
        ctx.lineTo(doorX + dw + 3, doorY - 5);
        ctx.stroke();

        // Metal hinges (two on left side)
        this._drawHinge(ctx, doorX + 1, doorY + 5);
        this._drawHinge(ctx, doorX + 1, doorY + dh - 8);
        // Right side hinges
        this._drawHinge(ctx, doorX + dw - 1, doorY + 5);
        this._drawHinge(ctx, doorX + dw - 1, doorY + dh - 8);

        // Center gap line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(doorX + dw / 2, doorY + 1);
        ctx.lineTo(doorX + dw / 2, doorY + dh - 1);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw a single door panel with wood texture
     */
    _drawDoorPanel(ctx, x, y, w, h, isLeft) {
        ctx.save();

        // Panel wood gradient
        const panelGrad = ctx.createLinearGradient(x, y, x, y + h);
        panelGrad.addColorStop(0, '#8B5E3C');
        panelGrad.addColorStop(0.5, '#7A4E2C');
        panelGrad.addColorStop(1, '#6B4020');
        ctx.fillStyle = panelGrad;
        ctx.fillRect(x, y, w, h);

        // Vertical plank lines
        ctx.strokeStyle = 'rgba(40, 20, 10, 0.3)';
        ctx.lineWidth = 0.5;
        const plankW = w / 3;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * plankW, y);
            ctx.lineTo(x + i * plankW, y + h);
            ctx.stroke();
        }

        // Cross brace (Z pattern typical of barn doors)
        ctx.strokeStyle = 'rgba(60, 30, 15, 0.4)';
        ctx.lineWidth = 2;
        // Top horizontal brace
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 3);
        ctx.lineTo(x + w - 1, y + 3);
        ctx.stroke();
        // Bottom horizontal brace
        ctx.beginPath();
        ctx.moveTo(x + 1, y + h - 3);
        ctx.lineTo(x + w - 1, y + h - 3);
        ctx.stroke();
        // Diagonal brace
        if (isLeft) {
            ctx.beginPath();
            ctx.moveTo(x + 1, y + 3);
            ctx.lineTo(x + w - 1, y + h - 3);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(x + w - 1, y + 3);
            ctx.lineTo(x + 1, y + h - 3);
            ctx.stroke();
        }

        // Wood grain
        ctx.strokeStyle = 'rgba(80, 40, 20, 0.12)';
        ctx.lineWidth = 0.4;
        for (let i = 0; i < 3; i++) {
            const gy = y + 6 + i * (h / 3);
            ctx.beginPath();
            ctx.moveTo(x + 2, gy);
            ctx.quadraticCurveTo(x + w / 2, gy + 1, x + w - 2, gy - 0.5);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Draw a metal hinge
     */
    _drawHinge(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = '#3A3A3A';
        // Hinge plate
        ctx.fillRect(x - 4, y, 8, 3);
        // Hinge pin
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(x, y + 1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Metallic highlight
        ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
        ctx.beginPath();
        ctx.arc(x - 0.5, y + 1, 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Keep drawShed as backward-compat alias
    drawShed(ctx) {
        this._drawGroundShadow(ctx);
        this._drawFoundation(ctx);
        this._drawBarnWalls(ctx);
        this._drawRoof(ctx);
        this._drawWindowFramesStatic(ctx);
        this._drawWindowContents(ctx);
        this._drawHangingSign(ctx);
        this._drawWeatherVane(ctx);
        this._drawHayWisps(ctx);
        this._drawLantern(ctx);
    }

    // Keep drawDoor as backward-compat alias
    drawDoor(ctx) {
        this._drawDoor(ctx);
    }

    drawFlowerBed(ctx) {
        const bedY = this.y + this.height + 20;
        const leftX = this.x - this.width / 2 + 10;
        const bedWidth = this.width - 20;

        // Soil bed
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(leftX, bedY, bedWidth, 10);

        // Flowers (skip area around door)
        const flowerColors = ['#E91E63', '#9C27B0', '#FF9800', '#FFEB3B', '#F44336'];
        const flowerPositions = [15, 35, 55, 75, 95, 115, 135, 155];

        flowerPositions.forEach((offset, i) => {
            if (offset >= bedWidth) return;

            const fx = leftX + offset;

            // Skip flowers in the door area
            if (fx >= this.doorLeft - 5 && fx <= this.doorRight + 5) return;

            const fy = bedY - 2;

            // Stem
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fx, fy + 8);
            ctx.lineTo(fx, fy);
            ctx.stroke();

            // Flower petals
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.beginPath();
            ctx.arc(fx, fy, 5, 0, Math.PI * 2);
            ctx.fill();

            // Flower center
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.arc(fx, fy, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Keep old method names as aliases for backward compatibility
    drawWindowsRealistic(ctx) {
        this._drawWindowFramesStatic(ctx);
        this._drawWindowContents(ctx);
    }

    drawWindowFrame(ctx, x, y, w, h) {
        this._drawSingleWindowFrame(ctx, x, y, w, h);
    }

    drawNestInterior(ctx, x, y, w, h) {
        // Warm interior
        const interiorGrad = ctx.createLinearGradient(x, y, x, y + h);
        interiorGrad.addColorStop(0, '#5D4232');
        interiorGrad.addColorStop(1, '#3D2818');
        ctx.fillStyle = interiorGrad;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

        // Enhanced straw
        ctx.strokeStyle = '#D4A554';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const strawX = x + 2 + (i * (w - 4)) / 10;
            const strawY = y + h - 6 + Math.sin(i * 1.5) * 2;
            ctx.beginPath();
            ctx.moveTo(strawX, strawY + 3);
            ctx.quadraticCurveTo(strawX + 1, strawY, strawX + 3, strawY + 1);
            ctx.stroke();
        }
    }

    drawEmptyWindow(ctx, x, y, w, h) {
        this._drawEmptyWindowInterior(ctx, x, y, w, h);
    }

    drawCoopExterior(ctx) {
        this._drawBarnWalls(ctx);
        this._drawRoof(ctx);
        this._drawFoundation(ctx);
        this._drawHangingSign(ctx);
    }
    
    // ==================== RECTANGULAR BARRIER COLLISION ====================

    /**
     * Check if a point is inside the coop barrier rectangle
     */
    isInsideBarrier(x, y) {
        return x >= this.barrierLeft && x <= this.barrierRight &&
               y >= this.barrierTop && y <= this.barrierBottom;
    }

    /**
     * Check if a point is in the door opening
     */
    isInDoor(x, y) {
        return x >= this.doorLeft && x <= this.doorRight &&
               y >= (this.visualBottom - this.doorHeight) && y <= this.visualBottom + 10;
    }

    /**
     * Push an entity outside the coop barrier.
     * Entities cannot enter the coop rectangle except through the door.
     * @param {number} x - Entity X
     * @param {number} y - Entity Y
     * @param {number} radius - Entity collision radius
     * @param {Object} hero - Hero object (for tool checks)
     * @returns {Object} {x, y, inGap, inCoop}
     */
    pushOutside(x, y, radius, hero) {
        // Check if entity overlaps the coop barrier
        const closestX = Math.max(this.barrierLeft, Math.min(x, this.barrierRight));
        const closestY = Math.max(this.barrierTop, Math.min(y, this.barrierBottom));
        
        const dx = x - closestX;
        const dy = y - closestY;
        const distSq = dx * dx + dy * dy;

        // If entity is within the door opening, allow passage
        if (this.isInDoor(x, y)) {
            return { x, y, inGap: true, inCoop: true };
        }

        // Check if entity's circle overlaps the coop rectangle
        if (distSq < radius * radius) {
            // Entity overlaps coop - push out
            const dist = Math.sqrt(distSq);
            
            if (dist < 0.001) {
                // Entity center is inside the rectangle - push to nearest edge
                const pushLeft = x - this.barrierLeft;
                const pushRight = this.barrierRight - x;
                const pushTop = y - this.barrierTop;
                const pushBottom = this.barrierBottom - y;
                
                const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);
                
                if (minPush === pushLeft) return { x: this.barrierLeft - radius, y, inGap: false, inCoop: false };
                if (minPush === pushRight) return { x: this.barrierRight + radius, y, inGap: false, inCoop: false };
                if (minPush === pushTop) return { x, y: this.barrierTop - radius, inGap: false, inCoop: false };
                return { x, y: this.barrierBottom + radius, inGap: false, inCoop: false };
            }
            
            // Push entity out along the vector from closest point to entity center
            const pushDist = radius - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            
            return {
                x: x + nx * pushDist,
                y: y + ny * pushDist,
                inGap: false,
                inCoop: false
            };
        }

        // No collision
        return { x, y, inGap: false, inCoop: false };
    }

    /**
     * Legacy compatibility: isInsideFence now checks rectangular barrier
     */
    isInsideFence(x, y) {
        return this.isInsideBarrier(x, y);
    }

    /**
     * Legacy compatibility: isInGap now checks door
     */
    isInGap(x, y) {
        return this.isInDoor(x, y);
    }

    /**
     * Check if a chicken is at the escape door
     */
    isAtEscapeGap(chicken) {
        const dx = Math.abs(chicken.x - this.x);
        const dy = Math.abs(chicken.y - this.doorY);
        return dx < this.doorWidth / 2 + 10 && dy < 20;
    }

    /**
     * Check if hero is near the coop for deposit
     */
    isAtDepositZone(hero) {
        const dist = Math.hypot(hero.x - this.x, hero.y - this.y);
        return dist < this.fenceRadius + 20;
    }

    /**
     * Legacy stub - no fence segments needed for rectangular barrier
     */
    getFenceSegments() {
        return [];
    }

    // REMOVED: drawDepositHint no longer needed - coop entry is now automatic
    // when carrying feed basket or egg basket (see game.js checkProximityInteractions)
    // drawDepositHint(ctx, hero) {
    //     if (!this.isAtDepositZone(hero)) return;
    //     ...
    // }
    
    // Check egg collection when hero is near coop with basket
    checkEggCollection(hero, basket) {
        const collected = [];
        
        if (!basket || basket.eggs >= basket.maxEggs) return collected;
        
        // Check if hero is near coop (within deposit range)
        const dist = Math.hypot(hero.x - this.x, hero.y - this.y);
        
        if (dist >= this.fenceRadius + 20) return collected;
        
        // Find nearby chickens with eggs
        this.chickens.forEach(chicken => {
            if (chicken.hasEgg && chicken.inCoop) {
                const cdx = chicken.x - hero.x;
                const cdy = chicken.y - hero.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                
                if (cdist < 40 && basket.canCollect()) {
                    if (chicken.collectEgg()) {
                        basket.collectEgg();
                        collected.push(chicken);
                    }
                }
            }
        });
        
        return collected;
    }
    
    // Check feeding when hero is near coop with food basket
    checkFeeding(hero, foodBasket) {
        const fed = [];
        
        if (!foodBasket || foodBasket.usesRemaining <= 0) return fed;
        
        // Check if hero is near coop
        const dist = Math.hypot(hero.x - this.x, hero.y - this.y);
        
        if (dist >= this.fenceRadius + 20) return fed;
        
        // Find nearby hungry chickens
        this.chickens.forEach(chicken => {
            if (chicken.hunger < 80 && chicken.inCoop) {
                const cdx = chicken.x - hero.x;
                const cdy = chicken.y - hero.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                
                if (cdist < 40) {
                    chicken.feed();
                    foodBasket.use();
                    fed.push(chicken);
                }
            }
        });
        
        return fed;
    }
    
    drawChickens(ctx) {
        this.chickens.forEach(chicken => chicken.draw(ctx));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Coop };
}
