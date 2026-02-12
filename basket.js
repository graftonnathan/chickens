/**
 * BasketItem - Stationary basket at the house for egg collection
 */
class BasketItem {
    constructor() {
        this.x = 400; // Center of house (south)
        this.y = 550; // Near house wall
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
        ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
        ctx.stroke();
        
        // Basket shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 5, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Basket body (brown wicker)
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI, false);
        ctx.fill();
        
        // Basket weave texture
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = -12; i <= 12; i += 4) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + 8);
            ctx.stroke();
        }
        
        // Handle
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 12, Math.PI, 0, false);
        ctx.stroke();
        
        ctx.restore();
    }

    // Check if hero can pick up basket
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

    // Respawn basket when delivery is complete
    respawn() {
        this.collected = false;
        this.glowPhase = 0;
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}

/**
 * HouseDepositZone - Area at house for egg delivery
 */
class HouseDepositZone {
    constructor() {
        this.x = 400;
        this.y = 530;
        this.radius = 50;
    }

    // Check if hero is in delivery zone
    isInZone(hero) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.radius;
    }

    drawHint(ctx, hero) {
        if (!hero.hasBasket() || hero.eggsInBasket === 0) return;
        
        const pulse = Math.sin(Date.now() / 200) * 3;
        
        ctx.save();
        
        // Text
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DELIVER EGGS ▼', this.x, this.y + 20);
        
        // Pulsing arrow
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 25 + pulse);
        ctx.lineTo(this.x - 8, this.y + 15 + pulse);
        ctx.lineTo(this.x + 8, this.y + 15 + pulse);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BasketItem, HouseDepositZone };
}
