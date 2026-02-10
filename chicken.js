/**
 * Chicken class - Egg laying coop chicken with hunger system
 */
class Chicken {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = 15;
        
        // State
        this.inCoop = true;           // In coop or escaped/roaming
        this.hasEgg = false;          // Has egg ready to collect
        this.hunger = 100;            // 0-100%
        
        // Timers
        this.eggTimer = 0;            // Time until next egg
        this.hungerDecayRate = 0.5;   // 0.5% per second
        this.animTimer = 0;
        
        // Visual
        this.color = ['#fff', '#ffeb3b', '#ff9800'][Math.floor(Math.random() * 3)];
        this.state = 'idle';          // idle, moving, eating, laying
        
        // Movement
        this.targetX = x;
        this.targetY = y;
        this.moveSpeed = 30;
        
        // Fleeing
        this.isFleeing = false;
        this.fleeTargetY = 600; // House direction
    }
    
    update(deltaTime, coop) {
        this.animTimer += deltaTime;
        
        // Update hunger
        this.hunger -= this.hungerDecayRate * deltaTime;
        this.hunger = Math.max(0, this.hunger);
        
        if (this.inCoop) {
            this.updateInCoop(deltaTime, coop);
        } else {
            return this.updateOutOfCoop(deltaTime);
        }
        
        return null;
    }
    
    updateInCoop(deltaTime, coop) {
        // Check if should leave coop (starving, overcrowded, or spooked)
        if (this.hunger === 0 || coop.isOvercrowded() || coop.wasSpooked) {
            this.leaveCoop();
            return;
        }
        
        // Try to lay egg
        if (!this.hasEgg) {
            const eggInterval = this.getEggInterval();
            this.eggTimer += deltaTime * 1000; // Convert to ms
            
            if (this.eggTimer >= eggInterval) {
                this.layEgg();
            }
        }
        
        // Idle movement in coop (small random movements)
        this.updateIdleMovement(deltaTime);
    }
    
    updateIdleMovement(deltaTime) {
        // Random idle movement within coop
        if (Math.random() < 0.01) {
            this.targetX = 400 + (Math.random() - 0.5) * 60;
            this.targetY = 80 + (Math.random() - 0.5) * 60;
        }
        
        // Move toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 2) {
            this.x += (dx / dist) * this.moveSpeed * deltaTime;
            this.y += (dy / dist) * this.moveSpeed * deltaTime;
            this.state = 'moving';
        } else {
            this.state = 'idle';
        }
    }
    
    updateOutOfCoop(deltaTime) {
        // Move toward house (south)
        const speed = 60; // pixels per second (faster when fleeing)
        this.y += speed * deltaTime;
        this.state = 'fleeing';
        
        // Check escape at house (y=550)
        if (this.y > 550) {
            return 'escaped';
        }
        return null;
    }
    
    getEggInterval() {
        // Milliseconds between eggs based on hunger
        if (this.hunger > 50) return 10000;  // 10 seconds
        if (this.hunger > 20) return 20000;  // 20 seconds
        if (this.hunger > 0) return 40000;   // 40 seconds
        return Infinity;  // No eggs when starving
    }
    
    layEgg() {
        this.hasEgg = true;
        this.eggTimer = 0;
        this.state = 'laying';
        // Brief laying animation
        setTimeout(() => { if (this.state === 'laying') this.state = 'idle'; }, 500);
    }
    
    collectEgg() {
        if (this.hasEgg) {
            this.hasEgg = false;
            this.eggTimer = 0;
            return true;
        }
        return false;
    }
    
    feed() {
        this.hunger = 100;
        this.state = 'eating';
        setTimeout(() => { if (this.state === 'eating') this.state = 'idle'; }, 1000);
    }
    
    leaveCoop() {
        this.inCoop = false;
        this.isFleeing = true;
        this.state = 'fleeing';
        // Push to just outside coop fence
        this.y += 60;
    }
    
    returnToCoop() {
        this.inCoop = true;
        this.isFleeing = false;
        this.x = 400 + (Math.random() - 0.5) * 40;
        this.y = 80 + (Math.random() - 0.5) * 20;
        this.state = 'idle';
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw chicken body
        this.drawBody(ctx);
        
        // Draw egg indicator if has egg
        if (this.hasEgg) {
            this.drawEggIndicator(ctx);
        }
        
        // Draw hunger indicator
        this.drawHungerIndicator(ctx);
        
        // Draw fleeing indicator
        if (this.isFleeing) {
            this.drawFleeingIndicator(ctx);
        }
        
        ctx.restore();
    }
    
    drawBody(ctx) {
        const hungerState = this.getHungerState();
        
        // Apply visual filters based on hunger
        switch(hungerState) {
            case 'full':
            case 'satisfied':
                ctx.globalAlpha = 1.0;
                break;
            case 'hungry':
                ctx.filter = 'brightness(0.85)';
                break;
            case 'very_hungry':
                ctx.filter = 'brightness(0.7)';
                break;
            case 'starving':
                ctx.filter = 'brightness(0.5) grayscale(0.6)';
                break;
        }
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing
        ctx.fillStyle = this.color === '#fff' ? '#f5f5f5' : this.color;
        ctx.beginPath();
        ctx.ellipse(this.x - 5, this.y, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 8, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y - 8);
        ctx.lineTo(this.x + 12, this.y - 6);
        ctx.lineTo(this.x + 5, this.y - 4);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y - 9, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Comb (red thing on head)
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 15, 4, Math.PI, 0);
        ctx.fill();
        
        // Legs
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + 8);
        ctx.lineTo(this.x - 5, this.y + 15);
        ctx.moveTo(this.x + 5, this.y + 8);
        ctx.lineTo(this.x + 5, this.y + 15);
        ctx.stroke();
        
        ctx.restore(); // Restore filter
    }
    
    drawEggIndicator(ctx) {
        // White egg above chicken
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 25, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.ellipse(this.x - 2, this.y - 27, 2, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow pulse
        const pulse = Math.sin(this.animTimer * 3) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 10, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawHungerIndicator(ctx) {
        const yOffset = this.hasEgg ? -38 : -28;
        const barWidth = 16;
        const barHeight = 3;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y + yOffset, barWidth, barHeight);
        
        // Fill color based on hunger
        if (this.hunger > 50) ctx.fillStyle = '#4caf50';
        else if (this.hunger > 20) ctx.fillStyle = '#ff9800';
        else ctx.fillStyle = '#f44336';
        
        ctx.fillRect(this.x - barWidth/2, this.y + yOffset, barWidth * (this.hunger/100), barHeight);
    }
    
    drawFleeingIndicator(ctx) {
        // Red exclamation
        ctx.fillStyle = '#f44336';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', this.x, this.y - 45);
    }
    
    getHungerState() {
        if (this.hunger >= 75) return 'full';
        if (this.hunger >= 50) return 'satisfied';
        if (this.hunger >= 20) return 'hungry';
        if (this.hunger > 0) return 'very_hungry';
        return 'starving';
    }
    
    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}
