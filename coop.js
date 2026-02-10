/**
 * Coop class - Garden Shed with fence barrier and chicken management
 */
class Coop {
    constructor(x, y) {
        this.x = x || 400;
        this.y = y || 80;
        this.width = 70;
        this.height = 55;
        
        // Fence barrier properties - fence on N/E/W, gap on SOUTH
        this.fenceRadius = 50;
        this.fenceHeight = 30;
        this.gapStart = Math.PI * 0.25;  // 45 degrees (SE)
        this.gapEnd = Math.PI * 0.75;    // 135 degrees (SW)
        
        // Chicken management
        this.chickens = [];
        this.maxChickens = 12;
        
        // Spook state
        this.wasSpooked = false;
        this.spookTimer = 0;
        
        // Initialize 12 chickens in coop
        this.initChickens();
    }
    
    initChickens() {
        for (let i = 0; i < 12; i++) {
            // Random position inside fence
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * (this.fenceRadius - 20);
            const chicken = new Chicken(
                i,
                this.x + Math.cos(angle) * dist,
                this.y + Math.sin(angle) * dist
            );
            this.chickens.push(chicken);
        }
    }
    
    update(deltaTime) {
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
            const result = chicken.update(deltaTime, this);
            if (result === 'escaped') {
                escaped.push(chicken);
            }
        });
        
        // Remove escaped chickens
        escaped.forEach(chicken => {
            const idx = this.chickens.indexOf(chicken);
            if (idx > -1) {
                this.chickens.splice(idx, 1);
            }
        });
        
        return escaped.length; // Return number of escaped chickens
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
        const posts = 8;
        const arcLength = Math.PI * 2 - (this.gapEnd - this.gapStart);
        const angleStep = arcLength / posts;
        
        // Draw rails
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Top rail
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= posts; i++) {
            let angle = this.gapEnd + i * angleStep;
            if (angle > Math.PI * 2) angle -= Math.PI * 2;
            if (this.isAngleInGap(angle)) continue;
            
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
            let angle = this.gapEnd + i * angleStep;
            if (angle > Math.PI * 2) angle -= Math.PI * 2;
            if (this.isAngleInGap(angle)) continue;
            
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
        for (let i = 0; i <= posts; i++) {
            let angle = this.gapEnd + i * angleStep;
            if (angle > Math.PI * 2) angle -= Math.PI * 2;
            if (this.isAngleInGap(angle)) continue;
            
            const px = this.x + Math.cos(angle) * this.fenceRadius;
            const py = this.y + Math.sin(angle) * this.fenceRadius;
            this.drawFencePost(ctx, px, py);
        }
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
        const markerAngles = [this.gapStart, this.gapEnd];
        
        markerAngles.forEach(angle => {
            const px = this.x + Math.cos(angle) * this.fenceRadius;
            const py = this.y + Math.sin(angle) * this.fenceRadius;
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px - 2, py - 20, 4, 20);
            
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.strokeRect(px - 2, py - 20, 4, 20);
            
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(px, py - 25, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(px, py - 25, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    isAngleInGap(angle) {
        let normalized = angle;
        while (normalized < 0) normalized += Math.PI * 2;
        while (normalized > Math.PI * 2) normalized -= Math.PI * 2;
        return normalized >= this.gapStart && normalized <= this.gapEnd;
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
        const inGap = this.isAngleInGap(angle);
        
        if (dist < this.fenceRadius - radius) {
            if (hasBasket && inGap) {
                return { x, y, inGap: true, inCoop: true };
            }
            
            if (inGap) {
                return { x, y, inGap: true, inCoop: false };
            }
            
            const targetDist = this.fenceRadius - radius;
            return {
                x: this.x + (dx / dist) * targetDist,
                y: this.y + (dy / dist) * targetDist,
                inGap: false,
                inCoop: false
            };
        }
        
        return { x, y, inGap: inGap && dist < this.fenceRadius + radius, inCoop: false };
    }
    
    isAtDepositZone(hero) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const nearFence = Math.abs(dist - this.fenceRadius) < hero.radius + 5;
        const inGap = this.isAngleInGap(angle);
        
        return nearFence && inGap;
    }
    
    drawDepositHint(ctx, hero) {
        if (!this.isAtDepositZone(hero)) return;
        
        const gapCenterAngle = (this.gapStart + this.gapEnd) / 2;
        const hintX = this.x + Math.cos(gapCenterAngle) * this.fenceRadius;
        const hintY = this.y + Math.sin(gapCenterAngle) * this.fenceRadius + 30;
        
        const pulse = Math.sin(Date.now() / 200) * 3;
        
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('▼ ENTER ▼', hintX, hintY);
        
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
