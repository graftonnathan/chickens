/**
 * Coop class - Garden Shed with redesigned fence barrier and chicken management
 * Larger coop with southern barrier featuring:
 * - Small chicken escape opening
 * - Player access opening for egg harvest/feeding
 */
class Coop {
    constructor(x, y) {
        this.x = x || 400;
        this.y = y || 80;
        // ENLARGED: 90x65 → 140x90
        this.width = 140;
        this.height = 90;

        // New fence barrier properties - larger radius
        this.fenceRadius = 120;       // Increased for larger coop
        this.fenceHeight = 30;

        // South side openings
        // Chicken escape gap (small, south side)
        this.chickenGapStart = Math.PI * 0.40;  // ~72 degrees
        this.chickenGapEnd = Math.PI * 0.50;    // ~90 degrees (center south)

        // Player access gap (larger, also on south side but offset)
        this.playerGapStart = Math.PI * 0.55;   // ~99 degrees
        this.playerGapEnd = Math.PI * 0.70;     // ~126 degrees

        // Gap markers for visual indication
        this.gapMarkers = [
            { angle: (this.chickenGapStart + this.chickenGapEnd) / 2, type: 'chicken', label: '🐔' },
            { angle: (this.playerGapStart + this.playerGapEnd) / 2, type: 'player', label: '🚪' }
        ];

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

        // Window configuration (12 windows in 3x4 grid)
        this.windows = {
            cols: 3,
            rows: 4,
            width: 28,
            height: 22,
            gap: 6
        };

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
        // Initialize 12 chickens inside the coop using golden angle spiral distribution
        this.chickens = [];
        const types = Object.keys(CHICKEN_TYPE_TEMPLATES);
        const maxChickens = this.maxChickens;
        
        // Golden angle for natural distribution (in radians)
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        
        for (let i = 0; i < maxChickens; i++) {
            // Golden angle spiral distribution
            const t = (i + 0.5) / maxChickens;
            const angle = i * goldenAngle;
            const radius = 20 + t * (this.fenceRadius - 40); // Keep within fence with padding
            
            // Calculate position relative to coop center
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            
            // Create chicken with staggered type assignment
            const chickenType = types[i % types.length];
            const chicken = new Chicken(i, x, y, chickenType);
            
            // Set initial state to in_coop
            chicken.state = 'in_coop';
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
            
            this.chickens.push(chicken);
        }
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

        // Remove fully escaped chickens (reached exit)
        escaped.forEach(chicken => {
            const idx = this.chickens.indexOf(chicken);
            if (idx > -1) {
                this.chickens.splice(idx, 1);
                this.escapedChickens.push(chicken);
            }
        });

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
        if (chicken && !chicken.inCoop) {
            chicken.returnToCoop();
            if (!this.chickens.includes(chicken)) {
                this.chickens.push(chicken);
            }
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw fence first (behind coop)
        this.drawFence(ctx);
        
        // Draw coop shed
        this.drawShed(ctx);
        
        // Draw gap markers
        this.drawGapMarkers(ctx);
        
        ctx.restore();
    }
    
    drawShed(ctx) {
        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height, this.width/2 + 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Garden shed body
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);

        // Shed roof
        ctx.fillStyle = '#546E7A';
        ctx.beginPath();
        ctx.moveTo(this.x - this.width/2 - 5, this.y);
        ctx.lineTo(this.x, this.y - 25);
        ctx.lineTo(this.x + this.width/2 + 5, this.y);
        ctx.closePath();
        ctx.fill();

        // Roof overhang detail
        ctx.strokeStyle = '#455A64';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw 12 windows (3x4 grid) showing nesting chickens
        this.drawWindows(ctx);

        // Flower bed
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(this.x - 55, this.y + this.height + 5, 110, 8);

        const flowerColors = ['#E91E63', '#9C27B0', '#FF5722', '#FFC107'];
        for (let i = 0; i < 7; i++) {
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.beginPath();
            ctx.arc(this.x - 42 + i * 14, this.y + this.height + 3, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 42 + i * 14, this.y + this.height + 5);
            ctx.lineTo(this.x - 42 + i * 14, this.y + this.height + 13);
            ctx.stroke();
        }
    }

    drawWindows(ctx) {
        const { cols, rows, width: w, height: h, gap } = this.windows;

        // Calculate starting position (centered on coop face)
        const totalWidth = (cols * w) + ((cols - 1) * gap);
        const totalHeight = (rows * h) + ((rows - 1) * gap);
        const startX = this.x - totalWidth / 2;
        const startY = this.y + 10; // Below roof line

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const index = row * cols + col;
                const wx = startX + col * (w + gap);
                const wy = startY + row * (h + gap);

                // Draw window frame
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(wx - 2, wy - 2, w + 4, h + 4);

                // Get chicken for this window slot
                const chicken = this.chickens[index];

                if (chicken && chicken.inCoop && chicken.state !== 'escaping') {
                    // Window shows nesting chicken
                    ctx.fillStyle = '#8D6E63'; // Dark interior
                    ctx.fillRect(wx, wy, w, h);

                    // Draw chicken silhouette/emoji
                    ctx.font = '16px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🐔', wx + w/2, wy + h/2);

                    // Show egg if present
                    if (chicken.hasEgg) {
                        ctx.font = '10px sans-serif';
                        ctx.fillText('🥚', wx + w - 6, wy + h - 4);
                    }
                } else {
                    // Empty window - dark interior
                    ctx.fillStyle = '#3E2723';
                    ctx.fillRect(wx, wy, w, h);

                    // Subtle "empty" indicator
                    ctx.fillStyle = '#5D4037';
                    ctx.font = '10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('·', wx + w/2, wy + h/2);
                }

                // Window cross bars (4-pane look)
                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(wx + w/2, wy);
                ctx.lineTo(wx + w/2, wy + h);
                ctx.moveTo(wx, wy + h/2);
                ctx.lineTo(wx + w, wy + h/2);
                ctx.stroke();
            }
        }
    }
    
    drawFence(ctx) {
        // SOUTH-END BARRIER ONLY: Draw only the southern arc (90° to 270° approx)
        const startAngle = Math.PI * 0.25;  // Southwest (~45 degrees)
        const endAngle = Math.PI * 0.75;    // Southeast (~135 degrees)
        const posts = 8; // Fewer posts for smaller arc

        // Draw rails - only on south side
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        // Top rail
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= posts; i++) {
            const t = i / posts;
            const angle = startAngle + t * (endAngle - startAngle);

            // Skip gaps
            if (this.isAngleInChickenGap(angle) || this.isAngleInPlayerGap(angle)) continue;

            const px = this.x + Math.cos(angle) * this.fenceRadius;
            const py = this.y + Math.sin(angle) * this.fenceRadius - this.fenceHeight;

            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();

        // Bottom rail
        ctx.beginPath();
        first = true;
        for (let i = 0; i <= posts; i++) {
            const t = i / posts;
            const angle = startAngle + t * (endAngle - startAngle);

            // Skip gaps
            if (this.isAngleInChickenGap(angle) || this.isAngleInPlayerGap(angle)) continue;

            const px = this.x + Math.cos(angle) * this.fenceRadius;
            const py = this.y + Math.sin(angle) * this.fenceRadius - this.fenceHeight + 15;

            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();

        // Draw posts - only on south side
        for (let i = 0; i <= posts; i++) {
            const t = i / posts;
            const angle = startAngle + t * (endAngle - startAngle);

            // Skip gaps
            if (this.isAngleInChickenGap(angle) || this.isAngleInPlayerGap(angle)) continue;

            const px = this.x + Math.cos(angle) * this.fenceRadius;
            const py = this.y + Math.sin(angle) * this.fenceRadius;
            this.drawFencePost(ctx, px, py);
        }

        // Draw gap borders (posts at edges of gaps)
        this.drawGapBorders(ctx);
    }

    drawGapBorders(ctx) {
        // Chicken gap borders
        [this.chickenGapStart, this.chickenGapEnd].forEach(angle => {
            const px = this.x + Math.cos(angle) * this.fenceRadius;
            const py = this.y + Math.sin(angle) * this.fenceRadius;
            this.drawFencePost(ctx, px, py);
        });

        // Player gap borders
        [this.playerGapStart, this.playerGapEnd].forEach(angle => {
            const px = this.x + Math.cos(angle) * this.fenceRadius;
            const py = this.y + Math.sin(angle) * this.fenceRadius;
            this.drawFencePost(ctx, px, py);
        });
    }
    
    drawFencePost(ctx, x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 2, y - this.fenceHeight, 4, this.fenceHeight);
        
        // Pointed top
        ctx.beginPath();
        ctx.moveTo(x - 2, y - this.fenceHeight);
        ctx.lineTo(x, y - this.fenceHeight - 6);
        ctx.lineTo(x + 2, y - this.fenceHeight);
        ctx.fill();
        
        // Shadow
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 2, y - this.fenceHeight, 4, this.fenceHeight);
    }
    
    drawGapMarkers(ctx) {
        // Draw gap markers with icons
        this.gapMarkers.forEach(marker => {
            const px = this.x + Math.cos(marker.angle) * this.fenceRadius;
            const py = this.y + Math.sin(marker.angle) * this.fenceRadius;

            // Pulsing gold orb
            const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;

            // Glow
            ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`;
            ctx.beginPath();
            ctx.arc(px, py - 15, 8 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(px, py - 15, 4, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(marker.label, px, py + 10);
        });

        // Draw gap labels
        const chickenAngle = (this.chickenGapStart + this.chickenGapEnd) / 2;
        const playerAngle = (this.playerGapStart + this.playerGapEnd) / 2;

        const cpx = this.x + Math.cos(chickenAngle) * (this.fenceRadius + 25);
        const cpy = this.y + Math.sin(chickenAngle) * (this.fenceRadius + 25);

        const ppx = this.x + Math.cos(playerAngle) * (this.fenceRadius + 25);
        const ppy = this.y + Math.sin(playerAngle) * (this.fenceRadius + 25);

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CHICKEN EXIT', cpx, cpy);
        ctx.fillText('PLAYER ACCESS', ppx, ppy);
        ctx.restore();
    }

    isAngleInChickenGap(angle) {
        let normalized = angle;
        while (normalized < 0) normalized += Math.PI * 2;
        while (normalized > Math.PI * 2) normalized -= Math.PI * 2;
        return normalized >= this.chickenGapStart && normalized <= this.chickenGapEnd;
    }

    isAngleInPlayerGap(angle) {
        let normalized = angle;
        while (normalized < 0) normalized += Math.PI * 2;
        while (normalized > Math.PI * 2) normalized -= Math.PI * 2;
        return normalized >= this.playerGapStart && normalized <= this.playerGapEnd;
    }

    isAngleInGap(angle) {
        return this.isAngleInChickenGap(angle) || this.isAngleInPlayerGap(angle);
    }

    /**
     * Get fence segments for collision detection
     * @returns {Array} - Array of {x1, y1, x2, y2, isGap} segments
     */
    getFenceSegments() {
        if (typeof Collision === 'undefined' || !Collision.getFenceSegments) {
            console.error('Collision.getFenceSegments is not available');
            return [];
        }
        return Collision.getFenceSegments(this);
    }
    
    isInsideFence(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.fenceRadius;
    }
    
    isInGap(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const angle = Math.atan2(dy, dx);
        return this.isAngleInGap(angle);
    }
    
    pushOutside(x, y, radius, hero) {
        // STEP 1: Input validation
        if (!this.isValidPosition(x, y)) {
            // Return safe default - push to south side of fence
            const safeAngle = Math.PI / 2;  // South
            const safeDist = this.fenceRadius + radius + 10;
            this.logPositionCorruption('pushOutside input', {x, y}, {
                x: this.x + Math.cos(safeAngle) * safeDist,
                y: this.y + Math.sin(safeAngle) * safeDist
            });
            return {
                x: this.x + Math.cos(safeAngle) * safeDist,
                y: this.y + Math.sin(safeAngle) * safeDist,
                inGap: false,
                inCoop: false
            };
        }

        const dx = x - this.x;
        const dy = y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const hasBasket = hero && hero.hasTool && hero.hasTool('eggBasket');

        // STEP 2: Gap detection with epsilon tolerance
        const EPSILON = 0.02;  // ~1.15 degrees tolerance
        const normalizedAngle = this.normalizeAngle(angle);

        const inChickenGap = this.isAngleInGapWithTolerance(normalizedAngle,
            this.chickenGapStart, this.chickenGapEnd, EPSILON);
        const inPlayerGap = this.isAngleInGapWithTolerance(normalizedAngle,
            this.playerGapStart, this.playerGapEnd, EPSILON);
        const inAnyGap = inChickenGap || inPlayerGap;

        // SOUTH-END BARRIER ONLY: Only apply barrier on south side
        // South side is angles between π/4 (45°) and 3π/4 (135°)
        const isSouthSide = normalizedAngle > Math.PI * 0.25 && normalizedAngle < Math.PI * 0.75;

        // If not on south side, no barrier - free movement
        if (!isSouthSide) {
            // Check if inside coop area for tool interactions
            const inCoopArea = dist < this.fenceRadius;
            return {
                x,
                y,
                inGap: false,
                inCoop: inCoopArea && inAnyGap
            };
        }

        // STEP 3: Handle fence collision with zero-distance protection (SOUTH SIDE ONLY)
        if (dist < this.fenceRadius - radius) {
            // Inside the fence on south side
            if (hasBasket && inPlayerGap) {
                return { x, y, inGap: true, inCoop: true };
            }

            if (inAnyGap) {
                return { x, y, inGap: true, inCoop: false };
            }

            // Push to fence edge - PROTECTED from division by zero
            if (dist < 0.001) {
                // Too close to center, push south
                const fallbackAngle = Math.PI / 2;
                const targetDist = this.fenceRadius - radius;
                return {
                    x: this.x + Math.cos(fallbackAngle) * targetDist,
                    y: this.y + Math.sin(fallbackAngle) * targetDist,
                    inGap: false,
                    inCoop: false
                };
            }

            const targetDist = this.fenceRadius - radius;
            const newX = this.x + (dx / dist) * targetDist;
            const newY = this.y + (dy / dist) * targetDist;

            // Validate output
            if (!this.isValidPosition(newX, newY)) {
                this.logPositionCorruption('pushOutside calculation', {x: newX, y: newY}, {x, y});
                return { x, y, inGap: false, inCoop: false };  // Return original as fallback
            }

            return {
                x: newX,
                y: newY,
                inGap: false,
                inCoop: false
            };
        }

        // Outside or at fence boundary
        const result = {
            x,
            y,
            inGap: inAnyGap && dist < this.fenceRadius + radius,
            inCoop: false
        };

        // Final validation
        if (!this.isValidPosition(result.x, result.y)) {
            this.logPositionCorruption('pushOutside final', result, {x, y});
            return { x, y, inGap: false, inCoop: false };
        }

        return result;
    }

    // Check if a chicken is at the escape gap
    isAtEscapeGap(chicken) {
        const dx = chicken.x - this.x;
        const dy = chicken.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const nearFence = Math.abs(dist - this.fenceRadius) < 20;
        const inChickenGap = this.isAngleInChickenGap(angle);

        return nearFence && inChickenGap;
    }
    
    isAtDepositZone(hero) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const nearFence = Math.abs(dist - this.fenceRadius) < hero.radius + 10;
        const inPlayerGap = this.isAngleInPlayerGap(angle);

        return nearFence && inPlayerGap;
    }

    drawDepositHint(ctx, hero) {
        if (!this.isAtDepositZone(hero)) return;

        const gapCenterAngle = (this.playerGapStart + this.playerGapEnd) / 2;
        const hintX = this.x + Math.cos(gapCenterAngle) * this.fenceRadius;
        const hintY = this.y + Math.sin(gapCenterAngle) * this.fenceRadius + 30;

        const pulse = Math.sin(Date.now() / 200) * 3;

        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#000';
        ctx.fillText('[E] ENTER COOP', hintX, hintY);

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(hintX, hintY + 10 + pulse);
        ctx.lineTo(hintX - 8, hintY + pulse);
        ctx.lineTo(hintX + 8, hintY + pulse);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    // Check egg collection when hero is inside coop with basket
    checkEggCollection(hero, basket) {
        const collected = [];
        
        if (!basket || basket.eggs >= basket.maxEggs) return collected;
        
        // Check if hero is inside coop
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist >= this.fenceRadius - hero.radius) return collected;
        
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
    
    // Check feeding when hero is inside coop with food basket
    checkFeeding(hero, foodBasket) {
        const fed = [];
        
        if (!foodBasket || foodBasket.usesRemaining <= 0) return fed;
        
        // Check if hero is inside coop
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist >= this.fenceRadius - hero.radius) return fed;
        
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
