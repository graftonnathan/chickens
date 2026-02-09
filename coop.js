/**
 * Coop class - Garden Shed on ground at y=80 with fence barrier
 */
class Coop {
    constructor(x, y) {
        this.x = x || 400;
        this.y = y || 80; // Ground level (below north fence)
        this.width = 70;
        this.height = 55;
        
        // Fence barrier properties
        this.fenceRadius = 50;      // Distance from center to fence
        this.fenceHeight = 30;      // Visual height of fence posts
        this.gapStart = Math.PI * 0.75;  // 135 degrees (southwest)
        this.gapEnd = Math.PI * 1.25;    // 225 degrees (southeast)
    }

    draw(ctx) {
        ctx.save();
        
        // Draw fence first (behind coop)
        this.drawFence(ctx);
        
        // Ground shadow (drawn beneath coop)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(
            this.x, 
            this.y + this.height, 
            this.width / 2 + 10, 
            8, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Garden shed body (light green/gray)
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        
        // Shed roof (dark gray shingles)
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
        
        // Shed door (wooden) - facing SOUTH (toward house)
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(this.x - 12, this.y + 15, 24, 40);
        
        // Door frame
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 12, this.y + 15, 24, 40);
        
        // Door handle
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + 35, 2, 0, Math.PI * 2);
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
        
        // Flower bed in front of shed
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(this.x - 35, this.y + this.height + 5, 70, 8);
        
        // Flowers
        const flowerColors = ['#E91E63', '#9C27B0', '#FF5722', '#FFC107'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.beginPath();
            ctx.arc(this.x - 28 + i * 14, this.y + this.height + 3, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Green stem
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 28 + i * 14, this.y + this.height + 5);
            ctx.lineTo(this.x - 28 + i * 14, this.y + this.height + 13);
            ctx.stroke();
        }
        
        // Draw gap markers on top
        this.drawGapMarkers(ctx);
        
        ctx.restore();
    }
    
    // Draw circular fence with gap at south
    drawFence(ctx) {
        const posts = 8;  // Number of fence posts
        const arcLength = Math.PI * 2 - (this.gapEnd - this.gapStart);
        const angleStep = arcLength / posts;
        
        // Draw fence rails (horizontal lines connecting posts)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Top rail
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= posts; i++) {
            let angle = this.gapEnd + i * angleStep;
            if (angle > Math.PI * 2) angle -= Math.PI * 2;
            
            // Skip if in gap
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
        
        // Bottom rail (mid-post)
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
        
        // Draw fence posts
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
        // Post body
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - 2, y - this.fenceHeight, 4, this.fenceHeight);
        
        // Pointed top
        ctx.beginPath();
        ctx.moveTo(x - 2, y - this.fenceHeight);
        ctx.lineTo(x, y - this.fenceHeight - 6);
        ctx.lineTo(x + 2, y - this.fenceHeight);
        ctx.fill();
    }
    
    drawGapMarkers(ctx) {
        // Small marker posts at gap edges with gold orbs
        const markerAngles = [this.gapStart, this.gapEnd];
        
        markerAngles.forEach(angle => {
            const px = this.x + Math.cos(angle) * this.fenceRadius;
            const py = this.y + Math.sin(angle) * this.fenceRadius;
            
            // Shorter marker post
            ctx.fillStyle = '#a0522d';
            ctx.fillRect(px - 2, py - 20, 4, 20);
            
            // Gold orb on top
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(px, py - 25, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Orb glow
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(px, py - 25, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    isAngleInGap(angle) {
        // Normalize angle to 0-2PI
        let normalized = angle;
        while (normalized < 0) normalized += Math.PI * 2;
        while (normalized > Math.PI * 2) normalized -= Math.PI * 2;
        
        return normalized >= this.gapStart && normalized <= this.gapEnd;
    }
    
    // Check if point is inside fence (for collision)
    isInsideFence(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.fenceRadius;
    }
    
    // Check if point is in the gap area
    isInGap(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const angle = Math.atan2(dy, dx);
        return this.isAngleInGap(angle);
    }
    
    // Push position outside fence (for collision response)
    pushOutside(x, y, radius) {
        const dx = x - this.x;
        const dy = y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.fenceRadius - radius) {
            const angle = Math.atan2(dy, dx);
            
            // Check if in gap
            if (this.isAngleInGap(angle)) {
                return { x, y, inGap: true };  // Allow in gap
            }
            
            // Push to fence edge
            const targetDist = this.fenceRadius - radius;
            return {
                x: this.x + (dx / dist) * targetDist,
                y: this.y + (dy / dist) * targetDist,
                inGap: false
            };
        }
        
        return { x, y, inGap: false };
    }
    
    // Check if hero is at deposit zone (touching fence in gap)
    isAtDepositZone(hero) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Must be:
        // 1. Near fence radius (within hero radius + 5)
        // 2. In the gap angle
        const nearFence = Math.abs(dist - this.fenceRadius) < hero.radius + 5;
        const inGap = this.isAngleInGap(angle);
        
        return nearFence && inGap;
    }
    
    // Draw deposit hint UI
    drawDepositHint(ctx, hero) {
        if (!this.isAtDepositZone(hero) || hero.getCarryCount() === 0) return;
        
        const gapCenterAngle = (this.gapStart + this.gapEnd) / 2;
        const hintX = this.x + Math.cos(gapCenterAngle) * this.fenceRadius;
        const hintY = this.y + Math.sin(gapCenterAngle) * this.fenceRadius + 30;
        
        // Pulsing arrow
        const pulse = Math.sin(Date.now() / 200) * 3;
        
        ctx.save();
        
        // Text
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('▼ DEPOSIT ▼', hintX, hintY);
        
        // Pulsing arrow below text
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(hintX, hintY + 10 + pulse);
        ctx.lineTo(hintX - 8, hintY + pulse);
        ctx.lineTo(hintX + 8, hintY + pulse);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    getSpawnPosition() {
        // Random position inside fence (chickens spawn inside)
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (this.fenceRadius - 15);
        return {
            x: this.x + Math.cos(angle) * dist,
            y: this.y + Math.sin(angle) * dist
        };
    }
}
