/**
 * FoodBasketItem - Food basket for feeding chickens
 */
class FoodBasketItem {
    constructor() {
        this.x = 350; // House area, offset from other items
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
        ctx.strokeStyle = `rgba(255,165,0,${glowOpacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
        ctx.stroke();
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 5, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Basket body (orange-brown)
        ctx.fillStyle = '#d2691e';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI, false);
        ctx.fill();
        
        // Weave texture
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1;
        for (let i = -10; i <= 10; i += 4) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + 10);
            ctx.stroke();
        }
        
        // Feed/grain inside
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 2, this.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Handle
        ctx.strokeStyle = '#d2691e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 12, Math.PI, 0, false);
        ctx.stroke();
        
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
