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
        this.width = 90;   // Larger shed
        this.height = 65;  // Taller shed

        // New fence barrier properties - larger radius
        this.fenceRadius = 90;       // Increased from 50
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

        // Initialize 12 chickens in coop
        this.initChickens();
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
        
        // Shed door - facing NORTH (toward gap)
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(this.x - 12, this.y + 5, 24, 40);
        
        // Door frame
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 12, this.y + 5, 24, 40);
        
        // Door handle
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + 25, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Window on side
        ctx.fillStyle = '#B3E5FC';
        ctx.fillRect(this.x + 18, this.y + 5, 12, 12);
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 18, this.y + 5, 12, 12);
        
        // Window cross
        ctx.beginPath();
        ctx.moveTo(this.x + 24, this.y + 5);
        ctx.lineTo(this.x + 24, this.y + 17);
        ctx.moveTo(this.x + 18, this.y + 11);
        ctx.lineTo(this.x + 30, this.y + 11);
        ctx.stroke();
        
        // Flower bed
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(this.x - 35, this.y + this.height + 5, 70, 8);
        
        const flowerColors = ['#E91E63', '#9C27B0', '#FF5722', '#FFC107'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.beginPath();
            ctx.arc(this.x - 28 + i * 14, this.y + this.height + 3, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 28 + i * 14, this.y + this.height + 5);
            ctx.lineTo(this.x - 28 + i * 14, this.y + this.height + 13);
            ctx.stroke();
        }
    }
    
    drawFence(ctx) {
        const posts = 12; // More posts for larger fence
        const totalPosts = posts + 2; // Extra posts for gaps

        // Draw rails - skip the gap areas
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        // Top rail
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= totalPosts; i++) {
            const angle = (i / totalPosts) * Math.PI * 2;
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
        for (let i = 0; i <= totalPosts; i++) {
            const angle = (i / totalPosts) * Math.PI * 2;
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

        // Draw posts
        for (let i = 0; i <= totalPosts; i++) {
            const angle = (i / totalPosts) * Math.PI * 2;
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
        const dx = x - this.x;
        const dy = y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const hasBasket = hero && hero.hasTool && hero.hasTool('eggBasket');
        const inChickenGap = this.isAngleInChickenGap(angle);
        const inPlayerGap = this.isAngleInPlayerGap(angle);
        const inAnyGap = inChickenGap || inPlayerGap;

        // Inside the fence
        if (dist < this.fenceRadius - radius) {
            // Player with basket can enter through player gap
            if (hasBasket && inPlayerGap) {
                return { x, y, inGap: true, inCoop: true };
            }

            // Can exit through any gap
            if (inAnyGap) {
                return { x, y, inGap: true, inCoop: false };
            }

            // Push to fence edge
            const targetDist = this.fenceRadius - radius;
            return {
                x: this.x + (dx / dist) * targetDist,
                y: this.y + (dy / dist) * targetDist,
                inGap: false,
                inCoop: false
            };
        }

        return { x, y, inGap: inAnyGap && dist < this.fenceRadius + radius, inCoop: false };
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
