/**
 * Egg class - Collectible eggs inside the coop
 */
class Egg {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.collected = false;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 3 + Math.random() * 2; // Random wobble speed
    }

    update(deltaTime) {
        // Subtle wobble animation
        this.wobble += deltaTime * this.wobbleSpeed;
    }

    draw(ctx) {
        const wobbleX = Math.sin(this.wobble) * 1;
        const wobbleY = Math.cos(this.wobble * 0.7) * 0.5;
        
        const drawX = this.x + wobbleX;
        const drawY = this.y + wobbleY;
        
        ctx.save();
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(drawX, drawY + 6, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Egg white
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(drawX, drawY, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.ellipse(drawX - 2, drawY - 2, 2, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(drawX, drawY, 6, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    // Check collision with hero for collection
    checkCollection(hero) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < 15; // Collection radius
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: 8 };
    }
}

/**
 * EggManager - Manages egg spawning and collection inside the coop
 */
class EggManager {
    constructor(coop) {
        this.coop = coop;
        this.eggs = [];
        this.spawnTimer = 0;
        this.spawnInterval = 7; // Seconds between spawns
        this.maxEggs = 3; // Max eggs at once inside coop
    }

    update(deltaTime) {
        // Spawn new eggs
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.eggs.length < this.maxEggs) {
            this.spawnEgg();
            this.spawnTimer = 0;
        }
        
        // Update existing eggs
        this.eggs.forEach(egg => egg.update(deltaTime));
    }

    spawnEgg() {
        // Spawn inside coop area (within fence radius but not too close to center)
        const angle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 25; // 10-35px from center
        const x = this.coop.x + Math.cos(angle) * dist;
        const y = this.coop.y + Math.sin(angle) * dist;
        
        this.eggs.push(new Egg(x, y));
    }

    // Check and process collection by hero
    checkCollection(hero) {
        const collected = [];
        this.eggs = this.eggs.filter(egg => {
            if (egg.checkCollection(hero)) {
                if (hero.collectEgg()) {
                    collected.push(egg);
                    return false; // Remove collected egg
                }
            }
            return true;
        });
        return collected;
    }

    draw(ctx) {
        this.eggs.forEach(egg => egg.draw(ctx));
    }

    reset() {
        this.eggs = [];
        this.spawnTimer = 0;
    }
}
