/**
 * FenceHole class - Represents a hole punched in the fence by raccoons
 */
class FenceHole {
    constructor(x, y, side) {
        this.x = x;
        this.y = y;
        this.side = side; // 'north', 'east', 'west'
        this.width = 40;
        this.height = 40;
        this.createdAt = Date.now();
        this.repairProgress = 0; // 0-100
        this.isBeingRepaired = false;

        // Chicken leak system — unrepaired holes cause chickens to escape
        this.leakTimer = 0;
        this.leakInterval = 20;        // Seconds between leaks
        this.leakWarningTime = 5;      // Seconds of warning before leak
        this.isLeaking = false;        // True when a leak event fires
        
        // Random debris rotation for visual variety
        this.debrisRotations = [
            Math.random() * 0.5 - 0.25,
            Math.random() * 0.5 - 0.25,
            Math.random() * 0.5 - 0.25,
            Math.random() * 0.5 - 0.25
        ];
    }

    // Update leak timer — returns true when a chicken should leak through
    update(deltaTime) {
        if (this.isBeingRepaired) return false;

        this.leakTimer += deltaTime;

        if (this.leakTimer >= this.leakInterval) {
            this.leakTimer = 0;       // Reset for next leak cycle
            this.isLeaking = true;
            return true;               // Signal: a chicken should escape through this hole
        }

        this.isLeaking = false;
        return false;
    }

    getLeakProgress() {
        return this.leakTimer / this.leakInterval;
    }

    isLeakWarning() {
        return this.leakTimer >= (this.leakInterval - this.leakWarningTime);
    }

    draw(ctx) {
        // Draw broken fence section
        this.drawBrokenFence(ctx);
        
        // Draw debris on ground
        this.drawDebris(ctx);
        
        // Draw repair progress if being repaired
        if (this.isBeingRepaired) {
            this.drawRepairProgress(ctx);
        }

    }

    drawBrokenFence(ctx) {
        ctx.fillStyle = '#5d4037'; // Dark wood
        
        if (this.side === 'north') {
            // Horizontal fence - vertical gap
            const leftPostX = this.x - this.width / 2 - 4;
            const rightPostX = this.x + this.width / 2;
            
            // Broken post stubs (shorter)
            ctx.fillRect(leftPostX, this.y - 15, 4, 15);
            ctx.fillRect(rightPostX, this.y - 15, 4, 15);
            
            // Jagged broken edges
            ctx.beginPath();
            ctx.moveTo(leftPostX, this.y - 15);
            ctx.lineTo(leftPostX + 2, this.y - 20);
            ctx.lineTo(leftPostX + 4, this.y - 15);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(rightPostX, this.y - 15);
            ctx.lineTo(rightPostX + 2, this.y - 20);
            ctx.lineTo(rightPostX + 4, this.y - 15);
            ctx.fill();
            
        } else {
            // Vertical fences - horizontal gap
            const topPostY = this.y - this.height / 2 - 4;
            const bottomPostY = this.y + this.height / 2;
            
            // Broken post stubs
            ctx.fillRect(this.x - 15, topPostY, 15, 4);
            ctx.fillRect(this.x - 15, bottomPostY, 15, 4);
            
            // Jagged edges
            ctx.beginPath();
            ctx.moveTo(this.x - 15, topPostY);
            ctx.lineTo(this.x - 20, topPostY + 2);
            ctx.lineTo(this.x - 15, topPostY + 4);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.x - 15, bottomPostY);
            ctx.lineTo(this.x - 20, bottomPostY + 2);
            ctx.lineTo(this.x - 15, bottomPostY + 4);
            ctx.fill();
        }
    }

    drawDebris(ctx) {
        // Wood splinters on ground
        ctx.fillStyle = '#8d6e63';
        const debris = [
            { x: -10, y: 5, w: 6, h: 3 },
            { x: 5, y: 8, w: 4, h: 5 },
            { x: -5, y: 12, w: 5, h: 4 },
            { x: 8, y: 3, w: 3, h: 6 }
        ];
        
        debris.forEach((d, i) => {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.debrisRotations[i]);
            ctx.fillRect(d.x, d.y, d.w, d.h);
            ctx.restore();
        });
    }

    drawRepairProgress(ctx) {
        const barX = this.x - 20;
        const barY = this.y - 50;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, 40, 6);
        
        // Progress fill
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(barX, barY, 40 * (this.repairProgress / 100), 6);
        
        // Text
        ctx.fillStyle = '#4caf50';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('REPAIRING...', this.x, barY - 5);
    }

    drawLeakWarning(ctx) {
        const progress = this.getLeakProgress();
        const barWidth = 36;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 30;

        ctx.save();

        // Leak countdown bar (always visible once hole exists)
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress fill — turns red as it approaches leak
        const isWarning = this.isLeakWarning();
        if (isWarning) {
            // Pulse red when close to leaking
            const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
        } else {
            ctx.fillStyle = '#ff9800';  // Orange for normal countdown
        }
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Warning text when close to leaking
        if (isWarning) {
            const remaining = Math.ceil(this.leakInterval - this.leakTimer);
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🐔 LEAK ${remaining}s`, this.x, barY - 3);
        }

        ctx.restore();
    }

    // Check if point is in hole (escape zone)
    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.abs(dx) < this.width / 2 && Math.abs(dy) < this.height / 2;
    }

    // Check if hero is close enough to repair
    canRepair(hero) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < 35; // Repair radius
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.width / 2 };
    }
}

/**
 * FenceHoleManager - Manages all fence holes
 */
class FenceHoleManager {
    constructor() {
        this.holes = [];
        this.maxHoles = 6; // Prevent overwhelming player
    }

    createHole(x, y, side) {
        if (this.holes.length >= this.maxHoles) {
            // Remove oldest hole if at max
            this.holes.shift();
        }
        
        const hole = new FenceHole(x, y, side);
        this.holes.push(hole);
        return hole;
    }

    removeHole(hole) {
        this.holes = this.holes.filter(h => h !== hole);
    }

    // Check if position is in any hole
    isInHole(x, y) {
        return this.holes.find(hole => hole.contains(x, y));
    }

    // Get nearest hole to position
    getNearestHole(x, y) {
        let nearest = null;
        let nearestDist = Infinity;
        
        this.holes.forEach(hole => {
            const dx = hole.x - x;
            const dy = hole.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = hole;
            }
        });
        
        return nearest;
    }

    // Update all holes — returns array of holes that leaked a chicken
    update(deltaTime) {
        const leakingHoles = [];
        this.holes.forEach(hole => {
            if (hole.update(deltaTime)) {
                leakingHoles.push(hole);
            }
        });
        return leakingHoles;
    }

    // Get hole count for UI
    getHoleCount() {
        return this.holes.length;
    }

    draw(ctx) {
        this.holes.forEach(hole => hole.draw(ctx));
    }

    reset() {
        this.holes = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FenceHole, FenceHoleManager };
}
