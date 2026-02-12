/**
 * HammerItem - Tool for repairing fence holes
 */
class HammerItem {
    constructor() {
        this.x = 450; // Near house, offset from basket
        this.y = 560;
        this.radius = 20;
        this.collected = false;
        this.glowPhase = 0;
    }

    update(deltaTime) {
        if (!this.collected) {
            this.glowPhase += deltaTime * 2;
        }
    }

    draw(ctx) {
        if (this.collected) return;
        
        ctx.save();
        
        // Glow hint (pulsing)
        const glowOpacity = 0.3 + Math.sin(this.glowPhase) * 0.2;
        ctx.strokeStyle = `rgba(255,215,0,${glowOpacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 5, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Hammer head (metal)
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(this.x - 12, this.y - 8, 24, 10);
        
        // Hammer claw (right side)
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y - 3, 5, 0, Math.PI, false);
        ctx.fill();
        
        // Handle (wood)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x - 2, this.y, 4, 20);
        
        ctx.restore();
    }

    checkPickup(hero) {
        if (this.collected) return false;
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.radius + hero.radius;
    }

    collect() {
        this.collected = true;
    }

    respawn() {
        this.collected = false;
        this.glowPhase = 0;
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HammerItem };
}
