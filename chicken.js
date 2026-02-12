/**
 * Chicken class - Egg laying coop chicken with automatic interactions
 * and prerequisite-based egg laying system
 */

// Chicken type templates with attributes
const CHICKEN_TYPE_TEMPLATES = {
    common: {
        minCoopTime: 30,           // Seconds in coop before eligible to lay
        foodThreshold: 50,          // Minimum hunger % to lay egg
        escapeTimer: 45,            // Seconds egg sits before escape
        hungerDecayRate: 2,         // Hunger lost per second
        eggValue: 10,
        color: '#ffffff',
        icon: '🐔',
        label: 'Common'
    },
    fast: {
        minCoopTime: 15,           // Lays quickly
        foodThreshold: 60,
        escapeTimer: 20,            // Escapes fast
        hungerDecayRate: 4,         // Hungry often
        eggValue: 15,
        color: '#d2691e',
        icon: '🏃',
        label: 'Fast'
    },
    slow: {
        minCoopTime: 60,           // Takes time
        foodThreshold: 40,
        escapeTimer: 60,            // But stays put
        hungerDecayRate: 1,
        eggValue: 20,
        color: '#808080',
        icon: '🐢',
        label: 'Slow'
    },
    rare: {
        minCoopTime: 90,           // Very long
        foodThreshold: 80,          // Very hungry
        escapeTimer: 10,            // Very fast escape
        hungerDecayRate: 5,
        eggValue: 50,
        color: '#ffd700',
        icon: '💎',
        label: 'Rare'
    },
    stubborn: {
        minCoopTime: 30,
        foodThreshold: 50,
        escapeTimer: 90,            // Very patient
        hungerDecayRate: 2,
        eggValue: 12,
        color: '#2c2c2c',
        icon: '🛡️',
        label: 'Stubborn'
    }
};

class Chicken {
    constructor(id, x, y, type = null) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = 15;

        // Chicken type - random if not specified
        const types = Object.keys(CHICKEN_TYPE_TEMPLATES);
        this.chickenType = type || types[Math.floor(Math.random() * types.length)];
        this.attributes = CHICKEN_TYPE_TEMPLATES[this.chickenType];

        // State machine
        this.state = 'wild';        // wild, carried, in_coop, eligible_to_lay, laying, egg_waiting, escaping
        this.previousState = null;

        // Coop residency tracking
        this.coopResidency = {
            inCoop: false,
            coopId: null,
            entryTime: null,        // Timestamp when entered
            accumulatedTime: 0      // Total seconds accumulated
        };

        // Hunger system
        this.hunger = 100;          // 0-100%

        // Egg laying
        this.hasEgg = false;
        this.eggsLaid = 0;

        // Escape tracking
        this.escapeTimerStart = null;
        this.escapeWarningTriggered = false;

        // Timers
        this.animTimer = 0;

        // Movement
        this.targetX = x;
        this.targetY = y;
        this.moveSpeed = 30;
        this.baseMoveSpeed = 30;

        // Frozen by spell
        this.isFrozen = false;
        this.frozenTimer = 0;

        // Wandering angle for wild chickens
        this.wanderAngle = Math.random() * Math.PI * 2;

        // Spawn animation for fade-in effect
        this.spawnAnimation = {
            active: false,
            progress: 1.0,
            delay: 0
        };

        // Window assignment for coop display (-1 = unassigned)
        this.assignedWindow = -1;

        // World sprite visibility (false = hidden, shown in window instead)
        this.worldSpriteVisible = true;
    }
    
    update(deltaTime, coop, gameTime) {
        this.animTimer += deltaTime;

        // Handle spawn animation (fade-in)
        if (this.spawnAnimation.active) {
            this.spawnAnimation.delay -= deltaTime;
            if (this.spawnAnimation.delay <= 0) {
                this.spawnAnimation.progress += deltaTime * 2; // Fade in over 0.5 seconds
                if (this.spawnAnimation.progress >= 1.0) {
                    this.spawnAnimation.progress = 1.0;
                    this.spawnAnimation.active = false;
                }
            }
        }

        // Handle frozen state
        if (this.isFrozen) {
            this.frozenTimer -= deltaTime;
            if (this.frozenTimer <= 0) {
                this.isFrozen = false;
            }
            return null;
        }

        // State machine update
        switch(this.state) {
            case 'wild':
                return this.updateWild(deltaTime);
            case 'carried':
                return this.updateCarried(deltaTime);
            case 'in_coop':
                return this.updateInCoop(deltaTime, coop, gameTime);
            case 'eligible_to_lay':
                return this.updateEligibleToLay(deltaTime, coop);
            case 'laying':
                // Laying is handled by animation timer
                return null;
            case 'egg_waiting':
                return this.updateEggWaiting(deltaTime, coop);
            case 'escaping':
                return this.updateEscaping(deltaTime, coop);
        }

        return null;
    }

    updateWild(deltaTime) {
        // Wandering behavior for wild chickens
        if (Math.random() < 0.01) {
            this.wanderAngle += (Math.random() - 0.5) * Math.PI;
        }

        const speed = 20;
        this.x += Math.cos(this.wanderAngle) * speed * deltaTime;
        this.y += Math.sin(this.wanderAngle) * speed * deltaTime;

        // Keep in bounds
        this.x = Math.max(50, Math.min(750, this.x));
        this.y = Math.max(200, Math.min(550, this.y));

        // Reset angle if hitting bounds
        if (this.x <= 50 || this.x >= 750 || this.y <= 200 || this.y >= 550) {
            this.wanderAngle += Math.PI;
        }

        return null;
    }

    updateCarried(deltaTime) {
        // Position follows player - handled by game/hero
        return null;
    }

    updateInCoop(deltaTime, coop, gameTime) {
        // Decay hunger
        this.hunger -= this.attributes.hungerDecayRate * deltaTime;
        this.hunger = Math.max(0, this.hunger);

        // Check if enough time accumulated
        if (this.coopResidency.entryTime) {
            const now = gameTime || Date.now() / 1000;
            const timeInCoop = now - this.coopResidency.entryTime;

            if (timeInCoop >= this.attributes.minCoopTime) {
                this.state = 'eligible_to_lay';
            }
        }

        // Idle movement in coop
        this.updateIdleMovement(deltaTime);
        return null;
    }

    updateEligibleToLay(deltaTime, coop) {
        // Continue hunger decay
        this.hunger -= this.attributes.hungerDecayRate * deltaTime;
        this.hunger = Math.max(0, this.hunger);

        // Check if can lay egg
        if (this.hunger >= this.attributes.foodThreshold) {
            this.startLaying();
        }

        this.updateIdleMovement(deltaTime);
        return null;
    }

    startLaying() {
        this.state = 'laying';

        // Animation delay then lay egg
        setTimeout(() => {
            if (this.state === 'laying') {
                this.layEgg();
            }
        }, 2000); // 2 second lay animation
    }

    updateEggWaiting(deltaTime, coop) {
        if (this.escapeTimerStart) {
            const now = Date.now() / 1000;
            const elapsed = now - this.escapeTimerStart;
            const remaining = this.attributes.escapeTimer - elapsed;

            // Warning at 5 seconds left
            if (remaining <= 5 && !this.escapeWarningTriggered) {
                this.escapeWarningTriggered = true;
            }

            // Escape!
            if (remaining <= 0) {
                this.state = 'escaping';
            }
        }

        this.updateIdleMovement(deltaTime);
        return null;
    }

    updateEscaping(deltaTime, coop) {
        // Move toward the coop door on the south wall
        const exitX = coop.x;  // Door is centered on the coop
        const exitY = coop.barrierBottom + 10;  // Just past the door

        const dx = exitX - this.x;
        const dy = exitY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            const escapeSpeed = this.baseMoveSpeed * 2;
            this.x += (dx / dist) * escapeSpeed * deltaTime;
            this.y += (dy / dist) * escapeSpeed * deltaTime;
        } else {
            // Reached exit - complete escape
            return this.completeEscape(coop);
        }

        return null;
    }

    completeEscape(coop) {
        // Remove from coop
        if (coop && coop.chickens) {
            const idx = coop.chickens.indexOf(this);
            if (idx > -1) coop.chickens.splice(idx, 1);
        }

        // Reset to wild state
        this.state = 'wild';
        this.coopResidency.inCoop = false;
        this.coopResidency.coopId = null;
        this.coopResidency.entryTime = null;
        this.hasEgg = false;
        this.escapeTimerStart = null;
        this.escapeWarningTriggered = false;

        // Place just outside the coop door
        this.x = coop.x;
        this.y = coop.barrierBottom + 20;

        return 'escaped';
    }

    // Leave coop when spooked by raccoon - transitions to escaping state
    leaveCoop() {
        // Only valid if chicken is currently in coop
        if (!this.coopResidency.inCoop) {
            return null;
        }

        // Get the coop reference from residency
        const coopId = this.coopResidency.coopId;

        // Clear coop residency (but don't remove from chickens array - coop.update handles that)
        this.coopResidency.inCoop = false;
        this.coopResidency.coopId = null;
        this.coopResidency.entryTime = null;

        // Clear any egg-related state
        this.hasEgg = false;
        this.escapeTimerStart = null;
        this.escapeWarningTriggered = false;

        // Transition to escaping state
        this.state = 'escaping';

        // Position at the escape gap (if coop reference available)
        // The coop.update() will handle the escape movement via updateEscaping()
        // We just need to signal that escape has started

        return 'escaping';
    }
    
    updateIdleMovement(deltaTime) {
        // Random idle movement within coop rectangular bounds
        if (Math.random() < 0.01) {
            this.targetX = 340 + Math.random() * 120;  // Within coop width
            this.targetY = 100 + Math.random() * 80;   // Within coop height
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
        this.eggsLaid++;
        this.state = 'egg_waiting';
        this.escapeTimerStart = Date.now() / 1000;
        this.escapeWarningTriggered = false;
    }

    collectEgg() {
        if (this.hasEgg) {
            this.hasEgg = false;
            this.escapeTimerStart = null;
            this.escapeWarningTriggered = false;

            // Reset to in_coop state - needs to accumulate time again
            this.state = 'in_coop';
            this.coopResidency.entryTime = Date.now() / 1000;

            return true;
        }
        return false;
    }
    
    feed() {
        this.hunger = Math.min(100, this.hunger + 30);
    }

    // Pick up this chicken (called when player walks near)
    pickUp() {
        if (this.state !== 'wild' && this.state !== 'in_coop' &&
            this.state !== 'eligible_to_lay' && this.state !== 'egg_waiting') {
            return false;
        }

        this.previousState = this.state;
        this.state = 'carried';
        this.coopResidency.inCoop = false;
        // Note: accumulated time is preserved in entryTime
        return true;
    }

    // Deposit this chicken into coop
    depositIntoCoop(coop) {
        if (this.state !== 'carried') return false;

        this.state = 'in_coop';
        this.coopResidency.inCoop = true;
        this.coopResidency.coopId = coop.id || 'main';
        this.coopResidency.entryTime = Date.now() / 1000;

        // Position inside the coop rectangle
        this.x = coop.x - coop.width / 2 + 20 + Math.random() * (coop.width - 40);
        this.y = coop.y + 50 + Math.random() * 50;

        return true;
    }

    // Check if player can pick up this chicken
    canBePickedUp() {
        return this.state === 'wild';
    }

    // Check if player can catch this chicken (escaped wild chickens)
    canBeCaught(hero) {
        if (this.state !== 'wild') return false;
        const dist = Math.hypot(this.x - hero.x, this.y - hero.y);
        return dist < 40;
    }
    
    draw(ctx) {
        // Skip drawing if world sprite should be hidden (shown in coop window instead)
        if (!this.worldSpriteVisible) return;

        ctx.save();

        // Draw spawn animation (fade-in)
        if (this.spawnAnimation.active && this.spawnAnimation.progress < 1.0) {
            ctx.globalAlpha = this.spawnAnimation.progress;
        }

        // Draw frozen effect
        if (this.isFrozen) {
            ctx.globalAlpha = 0.7;
            ctx.filter = 'hue-rotate(180deg) brightness(1.2)';
        }

        // Draw chicken body
        this.drawBody(ctx);

        // Draw state badge
        this.drawStateBadge(ctx);

        // Draw egg indicator if has egg
        if (this.hasEgg) {
            this.drawEggIndicator(ctx);
        }

        // Draw hunger indicator
        this.drawHungerIndicator(ctx);

        // Draw residency timer bar (if in coop building up time)
        if (this.state === 'in_coop' && this.coopResidency.entryTime) {
            this.drawResidencyTimer(ctx);
        }

        // Draw escape timer bar if egg waiting
        if (this.state === 'egg_waiting') {
            this.drawEscapeTimer(ctx);
        }

        // Draw type indicator
        this.drawTypeIndicator(ctx);

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

        // Use chicken type color
        const bodyColor = this.attributes ? this.attributes.color : '#ffffff';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        ctx.fillStyle = bodyColor === '#ffffff' ? '#f5f5f5' : bodyColor;
        ctx.beginPath();
        ctx.ellipse(this.x - 5, this.y, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = bodyColor;
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
    
    drawStateBadge(ctx) {
        // State badge above chicken
        const stateConfig = {
            'wild': { text: '🌿 WILD', color: '#95a5a6' },
            'carried': { text: '👋 CARRY', color: '#3498db' },
            'in_coop': { text: '🏠 COOP', color: '#2ecc71' },
            'eligible_to_lay': { text: '⏳ WAITING', color: '#f1c40f' },
            'laying': { text: '🥚 LAYING', color: '#ffd700' },
            'egg_waiting': { text: '⚠️ EGG', color: '#ff9800' },
            'escaping': { text: '🏃 ESCAPE', color: '#e74c3c' }
        };

        const config = stateConfig[this.state];
        if (!config) return;

        ctx.save();
        ctx.fillStyle = config.color;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 2;
        ctx.shadowColor = '#000';
        ctx.fillText(config.text, this.x, this.y - 35);
        ctx.restore();
    }

    drawResidencyTimer(ctx) {
        // Show progress toward egg-laying eligibility
        const barWidth = 30;
        const barHeight = 3;
        const yOffset = -45;

        const now = Date.now() / 1000;
        const elapsed = this.coopResidency.entryTime ? now - this.coopResidency.entryTime : 0;
        const required = this.attributes.minCoopTime;
        const percent = Math.min(1, elapsed / required);

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y + yOffset, barWidth, barHeight);

        // Fill gradient
        if (percent >= 1) {
            ctx.fillStyle = '#2ecc71';
        } else {
            ctx.fillStyle = '#f1c40f';
        }

        ctx.fillRect(this.x - barWidth/2, this.y + yOffset, barWidth * percent, barHeight);
    }

    drawEscapeTimer(ctx) {
        const barWidth = 30;
        const barHeight = 3;
        const yOffset = -45;

        const now = Date.now() / 1000;
        const elapsed = this.escapeTimerStart ? now - this.escapeTimerStart : 0;
        const remaining = Math.max(0, this.attributes.escapeTimer - elapsed);
        const percent = remaining / this.attributes.escapeTimer;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y + yOffset, barWidth, barHeight);

        // Fill color based on time remaining
        if (percent > 0.5) ctx.fillStyle = '#2ecc71';
        else if (percent > 0.25) ctx.fillStyle = '#ff9800';
        else ctx.fillStyle = '#e74c3c';

        ctx.fillRect(this.x - barWidth/2, this.y + yOffset, barWidth * percent, barHeight);

        // Warning indicator when low
        if (percent < 0.25 || this.escapeWarningTriggered) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x, this.y + yOffset - 5);
        }
    }

    drawTypeIndicator(ctx) {
        // Draw type icon
        const icon = this.attributes ? this.attributes.icon : '🐔';

        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(icon, this.x + 14, this.y - 20);
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
