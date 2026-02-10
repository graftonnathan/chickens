/**
 * Chicken class - Egg laying coop chicken with hunger system and escape mechanic
 */
class Chicken {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = 15;

        // Chicken type (affects escape timer)
        this.chickenType = ['common', 'rare', 'golden'][Math.floor(Math.random() * 3)];

        // State
        this.inCoop = true;           // In coop or escaped/roaming
        this.hasEgg = false;          // Has egg ready to collect
        this.hunger = 100;            // 0-100%

        // Timers
        this.eggTimer = 0;            // Time until next egg
        this.hungerDecayRate = 0.5;   // 0.5% per second
        this.animTimer = 0;

        // Escape mechanic
        this.escapeTimer = 0;         // Time until escape if egg ignored
        this.escapeThresholds = {
            common: 45,   // 45 seconds
            rare: 30,     // 30 seconds
            golden: 20    // 20 seconds
        };
        this.isEscaping = false;      // Currently escaping state
        this.eggsLaid = 0;            // Track lifetime eggs

        // Visual
        this.color = this.getTypeColor();
        this.state = 'idle';          // idle, moving, eating, laying, escaping, escaped

        // Movement
        this.targetX = x;
        this.targetY = y;
        this.moveSpeed = 30;
        this.baseMoveSpeed = 30;

        // Fleeing
        this.isFleeing = false;
        this.fleeTargetY = 600; // House direction

        // Frozen by spell
        this.isFrozen = false;
        this.frozenTimer = 0;
    }

    getTypeColor() {
        switch(this.chickenType) {
            case 'golden': return '#ffd700';
            case 'rare': return '#87ceeb';
            case 'common':
            default: return ['#fff', '#ffeb3b', '#ff9800'][Math.floor(Math.random() * 3)];
        }
    }
    
    update(deltaTime, coop) {
        this.animTimer += deltaTime;

        // Handle frozen state
        if (this.isFrozen) {
            this.frozenTimer -= deltaTime;
            if (this.frozenTimer <= 0) {
                this.isFrozen = false;
            }
            return null; // Don't update when frozen
        }

        // Update hunger
        this.hunger -= this.hungerDecayRate * deltaTime;
        this.hunger = Math.max(0, this.hunger);

        // Update escape timer if egg not collected
        if (this.hasEgg && !this.isEscaping) {
            this.escapeTimer -= deltaTime;
            if (this.escapeTimer <= 0) {
                this.startEscape(coop);
            }
        }

        if (this.inCoop) {
            this.updateInCoop(deltaTime, coop);
        } else {
            return this.updateOutOfCoop(deltaTime);
        }

        return null;
    }

    updateInCoop(deltaTime, coop) {
        // Check if escaping - move to escape gap
        if (this.isEscaping) {
            this.updateEscaping(deltaTime, coop);
            return;
        }

        // Check if should leave coop (starving, overcrowded, or spooked)
        if (this.hunger === 0 || coop.isOvercrowded() || coop.wasSpooked) {
            this.leaveCoop();
            return;
        }

        // Try to lay egg
        if (!this.hasEgg && !this.isEscaping) {
            const eggInterval = this.getEggInterval();
            this.eggTimer += deltaTime * 1000; // Convert to ms

            if (this.eggTimer >= eggInterval) {
                this.layEgg();
            }
        }

        // Idle movement in coop (small random movements)
        this.updateIdleMovement(deltaTime);
    }

    startEscape(coop) {
        this.isEscaping = true;
        this.state = 'escaping';

        // Find target: chicken escape gap on south side
        const escapeAngle = (coop.chickenGapStart + coop.chickenGapEnd) / 2;
        this.escapeTargetX = coop.x + Math.cos(escapeAngle) * coop.fenceRadius;
        this.escapeTargetY = coop.y + Math.sin(escapeAngle) * coop.fenceRadius;
    }

    updateEscaping(deltaTime, coop) {
        // Move toward escape gap
        const dx = this.escapeTargetX - this.x;
        const dy = this.escapeTargetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            // Running faster when escaping
            const escapeSpeed = this.baseMoveSpeed * 1.5;
            this.x += (dx / dist) * escapeSpeed * deltaTime;
            this.y += (dy / dist) * escapeSpeed * deltaTime;
        } else {
            // Reached escape gap - exit coop
            this.leaveCoop();
        }
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
        // Move toward house (south) - wandering behavior
        const speed = 40; // pixels per second (wandering speed)

        // Random wandering
        if (Math.random() < 0.02) {
            this.wanderAngle = (Math.random() - 0.5) * Math.PI;
        }

        this.y += speed * deltaTime;
        this.x += Math.sin(this.wanderAngle || 0) * speed * 0.5 * deltaTime;

        this.state = 'escaped';

        // Keep within bounds
        this.x = Math.max(20, Math.min(780, this.x));

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
        this.eggsLaid++;
        this.state = 'laying';

        // Start escape timer based on chicken type
        this.escapeTimer = this.escapeThresholds[this.chickenType] || 45;

        // Brief laying animation
        setTimeout(() => { if (this.state === 'laying') this.state = 'idle'; }, 500);
    }

    collectEgg() {
        if (this.hasEgg) {
            this.hasEgg = false;
            this.eggTimer = 0;
            this.escapeTimer = 0;
            this.isEscaping = false;
            if (this.state === 'escaping') {
                this.state = 'idle';
            }
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
        this.isEscaping = false;
        this.state = 'escaped';
        // Push to just outside coop fence
        this.y += 60;
    }

    returnToCoop(coop) {
        this.inCoop = true;
        this.isFleeing = false;
        this.isEscaping = false;
        this.state = 'idle';
        // Random position inside coop
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 35;
        this.x = coop.x + Math.cos(angle) * dist;
        this.y = coop.y + Math.sin(angle) * dist;
    }

    // Check if player can catch this chicken
    canBeCaught(hero) {
        if (this.inCoop || this.state !== 'escaped') return false;
        const dist = Math.hypot(this.x - hero.x, this.y - hero.y);
        return dist < 40; // Catch range
    }
    
    draw(ctx) {
        ctx.save();

        // Draw frozen effect
        if (this.isFrozen) {
            ctx.globalAlpha = 0.7;
            ctx.filter = 'hue-rotate(180deg) brightness(1.2)';
        }

        // Draw chicken body
        this.drawBody(ctx);

        // Draw egg indicator if has egg
        if (this.hasEgg) {
            this.drawEggIndicator(ctx);
        }

        // Draw hunger indicator
        this.drawHungerIndicator(ctx);

        // Draw escape timer bar if egg not collected
        if (this.hasEgg && !this.isEscaping) {
            this.drawEscapeTimer(ctx);
        }

        // Draw escaping indicator
        if (this.isEscaping) {
            this.drawEscapingIndicator(ctx);
        }

        // Draw fleeing indicator
        if (this.isFleeing) {
            this.drawFleeingIndicator(ctx);
        }

        // Draw type indicator for rare/golden
        if (this.chickenType !== 'common') {
            this.drawTypeIndicator(ctx);
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

    drawEscapeTimer(ctx) {
        const barWidth = 20;
        const barHeight = 3;
        const yOffset = -42;

        const threshold = this.escapeThresholds[this.chickenType] || 45;
        const percent = this.escapeTimer / threshold;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y + yOffset, barWidth, barHeight);

        // Fill color based on time remaining
        if (percent > 0.5) ctx.fillStyle = '#2ecc71';
        else if (percent > 0.25) ctx.fillStyle = '#ff9800';
        else ctx.fillStyle = '#e74c3c';

        ctx.fillRect(this.x - barWidth/2, this.y + yOffset, barWidth * percent, barHeight);

        // Warning indicator when low
        if (percent < 0.25) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x, this.y + yOffset - 5);
        }
    }

    drawEscapingIndicator(ctx) {
        // Red ESCAPING text
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#000';
        ctx.fillText('ESCAPING!', this.x, this.y - 40);
        ctx.shadowBlur = 0;

        // Running animation indicator
        const bounce = Math.sin(this.animTimer * 15) * 3;
        ctx.fillStyle = '#e74c3c';
        ctx.font = '12px sans-serif';
        ctx.fillText('🏃', this.x + 18, this.y - 10 + bounce);
    }

    drawTypeIndicator(ctx) {
        // Draw type badge
        const icon = this.chickenType === 'golden' ? '👑' :
                     this.chickenType === 'rare' ? '💎' : '';

        if (icon) {
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(icon, this.x + 12, this.y - 18);
        }
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
