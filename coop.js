/**
 * Coop class - Garden Shed with solid rectangular barrier
 * The coop itself is the barrier. A small door on the south side
 * allows chickens to escape.
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

        // Initialize 12 chickens in coop
        this.initChickens();
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
        // Step 1: Hide world sprites for chickens with window assignments
        for (let windowIndex = 0; windowIndex < 12; windowIndex++) {
            const chickenId = this.windowAssignments[windowIndex];

            if (chickenId !== null) {
                const chicken = this.getChickenById(chickenId);

                if (chicken && chicken.inCoop) {
                    // Chicken has a window slot - show window avatar, hide world sprite
                    chicken.worldSpriteVisible = false;
                    chicken.assignedWindow = windowIndex;
                }
            }
        }

        // Step 2: Show world sprites for chickens without windows
        this.chickens.forEach(chicken => {
            if (chicken.assignedWindow === -1 || !chicken.inCoop) {
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
    
    draw(ctx) {
        ctx.save();
        
        // Draw coop shed (the shed IS the barrier)
        this.drawShed(ctx);

        // Draw the small door on south wall
        this.drawDoor(ctx);
        
        ctx.restore();
    }
    
    drawShed(ctx) {
        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height + 5, this.width/2 + 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw realistic coop exterior
        this.drawCoopExterior(ctx);

        // Draw 12 windows (2x6 grid) showing nesting chickens
        this.drawWindowsRealistic(ctx);
    }

    drawCoopExterior(ctx) {
        const leftX = this.x - this.width / 2;
        const topY = this.y;

        // Roof - Dark gray shingles with angled peak
        const roofHeight = 35;
        const roofOverhang = 8;

        // Roof gradient
        const roofGradient = ctx.createLinearGradient(this.x, topY - roofHeight, this.x, topY);
        roofGradient.addColorStop(0, '#2D2D2D');
        roofGradient.addColorStop(1, '#3D3D3D');

        // Main roof triangle
        ctx.fillStyle = roofGradient;
        ctx.beginPath();
        ctx.moveTo(leftX - roofOverhang, topY);
        ctx.lineTo(this.x, topY - roofHeight);
        ctx.lineTo(leftX + this.width + roofOverhang, topY);
        ctx.closePath();
        ctx.fill();

        // Roof shingle lines
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const y = topY - roofHeight + (i * roofHeight / 4);
            const leftOffset = (i * roofOverhang / 4);
            ctx.beginPath();
            ctx.moveTo(leftX - roofOverhang + leftOffset, y);
            ctx.lineTo(leftX + this.width + roofOverhang - leftOffset, y);
            ctx.stroke();
        }

        // Roof trim (barn red)
        ctx.strokeStyle = '#B85450';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftX - roofOverhang, topY);
        ctx.lineTo(this.x, topY - roofHeight);
        ctx.lineTo(leftX + this.width + roofOverhang, topY);
        ctx.stroke();

        // Main body - Wood siding with gradient
        const bodyGradient = ctx.createLinearGradient(leftX, topY, leftX, topY + this.height);
        bodyGradient.addColorStop(0, '#8B7355');
        bodyGradient.addColorStop(0.5, '#7A6548');
        bodyGradient.addColorStop(1, '#6B5344');

        ctx.fillStyle = bodyGradient;
        ctx.fillRect(leftX, topY, this.width, this.height);

        // Wood planks texture (horizontal lines)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        const plankHeight = 15;
        for (let y = topY + plankHeight; y < topY + this.height; y += plankHeight) {
            ctx.beginPath();
            ctx.moveTo(leftX, y);
            ctx.lineTo(leftX + this.width, y);
            ctx.stroke();
        }

        // Vertical corner trim (barn red)
        ctx.fillStyle = '#B85450';
        ctx.fillRect(leftX - 3, topY, 4, this.height);           // Left trim
        ctx.fillRect(leftX + this.width - 1, topY, 4, this.height); // Right trim

        // Foundation - Stone base
        const foundationHeight = 18;
        ctx.fillStyle = '#5C5C5C';
        ctx.fillRect(leftX - 5, topY + this.height, this.width + 10, foundationHeight);

        // Stone texture lines
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 1;
        for (let x = leftX; x < leftX + this.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, topY + this.height);
            ctx.lineTo(x, topY + this.height + foundationHeight);
            ctx.stroke();
        }

        // Sign on coop
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(this.x - 25, topY + 8, 50, 14);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 25, topY + 8, 50, 14);
        ctx.fillStyle = '#5D4037';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('COOP', this.x, topY + 15);
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

    drawWindowsRealistic(ctx) {
        const { cols, rows, width: w, height: h, gap } = this.windows;

        // Calculate starting position (centered on coop face)
        const totalWidth = (cols * w) + ((cols - 1) * gap);
        const startX = this.x - totalWidth / 2;
        const startY = this.y + 40; // Positioned below roof and sign

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const windowIndex = row * cols + col;
                const wx = startX + col * (w + gap);
                const wy = startY + row * (h + gap);

                this.drawWindowFrame(ctx, wx, wy, w, h);

                // MODIFIED: Use assignment system instead of direct index
                const chicken = this.getChickenForWindow(windowIndex);

                if (chicken && chicken.state !== 'escaping') {
                    // Chicken is present - show in window
                    this.drawNestInterior(ctx, wx, wy, w, h);
                    this.drawChickenSprite(ctx, chicken, wx, wy, w, h);
                } else {
                    // Window empty (chicken escaped or unassigned)
                    this.drawEmptyWindow(ctx, wx, wy, w, h);
                }
            }
        }
    }

    drawWindowFrame(ctx, x, y, w, h) {
        // Outer frame (white/cream with shadow)
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

        // Shadow on right and bottom
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + w, y, 2, h + 2);
        ctx.fillRect(x, y + h, w + 2, 2);

        // Inner frame (4-pane window)
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(x, y, w, h);

        // Glass panes (semi-transparent)
        ctx.fillStyle = 'rgba(200, 220, 255, 0.15)';
        const paneW = (w - 2) / 2;
        const paneH = (h - 2) / 2;
        ctx.fillRect(x + 1, y + 1, paneW, paneH);
        ctx.fillRect(x + 1 + paneW, y + 1, paneW, paneH);
        ctx.fillRect(x + 1, y + 1 + paneH, paneW, paneH);
        ctx.fillRect(x + 1 + paneW, y + 1 + paneH, paneW, paneH);

        // Muntins (cross bars)
        ctx.strokeStyle = '#E8E8D0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();
    }

    drawNestInterior(ctx, x, y, w, h) {
        // Dark wood interior
        const interiorGradient = ctx.createLinearGradient(x, y, x, y + h);
        interiorGradient.addColorStop(0, '#3D3124');
        interiorGradient.addColorStop(1, '#2C2416');
        ctx.fillStyle = interiorGradient;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

        // Nesting straw at bottom
        ctx.fillStyle = '#D4A574';
        for (let i = 0; i < 8; i++) {
            const strawX = x + 3 + Math.random() * (w - 6);
            const strawY = y + h - 8 + Math.random() * 6;
            ctx.fillRect(strawX, strawY, 2, 1);
        }
    }

    drawEmptyWindow(ctx, x, y, w, h) {
        // Dark empty interior
        const interiorGradient = ctx.createLinearGradient(x, y, x, y + h);
        interiorGradient.addColorStop(0, '#2C2416');
        interiorGradient.addColorStop(1, '#1A150F');
        ctx.fillStyle = interiorGradient;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

        // Empty indicator
        ctx.fillStyle = '#5D4037';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('·', x + w / 2, y + h / 2);
    }

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
        // Body (rounded shape)
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = colors.highlight;
        ctx.beginPath();
        ctx.ellipse(x - 2, y - 2, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.arc(x + 5, y - 4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(x + 8, y - 4);
        ctx.lineTo(x + 11, y - 3);
        ctx.lineTo(x + 8, y - 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + 6, y - 5, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + 6.5, y - 5.5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Comb (red on head)
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.arc(x + 5, y - 8, 2, Math.PI, 0);
        ctx.fill();

        // Wing
        ctx.fillStyle = colors.shadow;
        ctx.beginPath();
        ctx.ellipse(x - 2, y + 1, 4, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Tail feathers
        ctx.fillStyle = colors.shadow;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 2);
        ctx.lineTo(x - 10, y - 5);
        ctx.lineTo(x - 9, y);
        ctx.lineTo(x - 7, y + 1);
        ctx.fill();

        // Egg if present
        if (hasEgg) {
            ctx.fillStyle = '#FFF8DC';
            ctx.beginPath();
            ctx.ellipse(x + 3, y + 4, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Egg highlight
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(x + 2, y + 3, 1, 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawSleepingChicken(ctx, x, y, colors) {
        // Lower body (sleeping position)
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head tucked in
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.arc(x + 3, y - 1, 4, 0, Math.PI * 2);
        ctx.fill();

        // Closed eye (sleeping)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 4, y - 2);
        ctx.lineTo(x + 6, y - 2);
        ctx.stroke();

        // Zzz
        ctx.fillStyle = '#87CEEB';
        ctx.font = 'bold 6px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('z', x + 8, y - 6);
        ctx.font = 'bold 4px sans-serif';
        ctx.fillText('z', x + 11, y - 9);
    }

    drawAlertChicken(ctx, x, y, colors) {
        // Body (more upright)
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head raised
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.arc(x + 4, y - 6, 4, 0, Math.PI * 2);
        ctx.fill();

        // Beak open (alert)
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(x + 7, y - 5);
        ctx.lineTo(x + 10, y - 4);
        ctx.lineTo(x + 7, y - 3);
        ctx.fill();

        // Alert eye (larger)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + 5, y - 7, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + 5.8, y - 7.5, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Comb
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.arc(x + 4, y - 10, 2, Math.PI, 0);
        ctx.fill();
    }
    
    drawDoor(ctx) {
        // Draw a small barn door on the south wall of the coop (at visual bottom)
        const doorX = this.x - this.doorWidth / 2;
        const doorY = this.visualBottom - this.doorHeight;

        // Door opening (dark interior)
        ctx.fillStyle = '#1A150F';
        ctx.fillRect(doorX, doorY, this.doorWidth, this.doorHeight);

        // Door frame (barn red)
        ctx.strokeStyle = '#B85450';
        ctx.lineWidth = 2;
        ctx.strokeRect(doorX, doorY, this.doorWidth, this.doorHeight);

        // Door header
        ctx.fillStyle = '#B85450';
        ctx.fillRect(doorX - 2, doorY - 3, this.doorWidth + 4, 4);

        // Chicken icon above door
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🐔', this.x, doorY - 5);
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
