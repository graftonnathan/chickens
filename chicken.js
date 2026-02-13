/**
 * Chicken class - Egg laying coop chicken with automatic interactions
 * and prerequisite-based egg laying system
 */

// Chicken type templates with attributes
// Escape timers are staggered so multiple chickens create overlapping deadlines
const CHICKEN_TYPE_TEMPLATES = {
    common: {
        minCoopTime: 25,           // Seconds in coop before eligible to lay
        foodThreshold: 50,          // Minimum hunger % to lay egg
        escapeTimer: 30,            // Moderate window to collect egg
        hungerDecayRate: 2,         // Hunger lost per second
        eggValue: 10,
        color: '#ffffff',
        icon: '🐔',
        label: 'Common'
    },
    fast: {
        minCoopTime: 12,           // Lays quickly
        foodThreshold: 60,
        escapeTimer: 12,            // Very short fuse — collect immediately
        hungerDecayRate: 4,         // Hungry often
        eggValue: 15,
        color: '#d2691e',
        icon: '🏃',
        label: 'Fast'
    },
    slow: {
        minCoopTime: 50,           // Takes time
        foodThreshold: 40,
        escapeTimer: 50,            // Patient but not infinite
        hungerDecayRate: 1,
        eggValue: 20,
        color: '#808080',
        icon: '🐢',
        label: 'Slow'
    },
    rare: {
        minCoopTime: 70,           // Very long to mature
        foodThreshold: 80,          // Very hungry before laying
        escapeTimer: 8,             // Ultra-short — high-value panic window
        hungerDecayRate: 5,
        eggValue: 50,
        color: '#ffd700',
        icon: '💎',
        label: 'Rare'
    },
    stubborn: {
        minCoopTime: 25,
        foodThreshold: 50,
        escapeTimer: 45,            // Reliable but not forever
        hungerDecayRate: 3,         // Gets hungrier than before
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
        this.state = 'wild';        // wild, carried, in_coop, eligible_to_lay, laying, egg_waiting, escaping, grabbed
        this.previousState = null;
        this.inCoop = false;         // Shorthand for coop membership (synced with coopResidency.inCoop)

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
            case 'grabbed':
                // Position controlled by raccoon, don't update
                return null;
        }

        return null;
    }

    updateWild(deltaTime) {
        // Handle post-escape invulnerability and speed burst
        if (this.escapeInvulnerable) {
            this.escapeInvulnerableTimer -= deltaTime;
            if (this.escapeInvulnerableTimer <= 0) {
                this.escapeInvulnerable = false;
                this.escapeInvulnerableTimer = 0;
            }
        }

        // Wandering behavior for wild chickens
        if (Math.random() < 0.01) {
            this.wanderAngle += (Math.random() - 0.5) * Math.PI;
        }

        const speed = this.escapeInvulnerable ? 150 : 20;
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
        if (this.carryTimer !== undefined && this.carryTimer !== null) {
            this.carryTimer -= deltaTime;
            if (this.carryTimer <= 0) {
                this.carryTimer = null;
                return 'escape_carry';
            }
        }
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
        const exitY = coop.visualBottom + 10;  // Just past the visual bottom of coop

        const dx = exitX - this.x;
        const dy = exitY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Keep hidden until past the visual bottom of the coop
        if (this.y < coop.visualBottom) {
            this.worldSpriteVisible = false;
        } else {
            this.worldSpriteVisible = true;
        }

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
        this.inCoop = false;
        this.coopResidency.inCoop = false;
        this.coopResidency.coopId = null;
        this.coopResidency.entryTime = null;
        this.hasEgg = false;
        this.escapeTimerStart = null;
        this.escapeWarningTriggered = false;

        // Place just outside the coop door
        this.x = coop.x;
        this.y = coop.visualBottom + 20;

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
        this.inCoop = false;
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
        this.carryTimer = 5.0; // 5 seconds before escape
        this.inCoop = false;
        this.coopResidency.inCoop = false;
        // Note: accumulated time is preserved in entryTime
        return true;
    }

    // Deposit this chicken into coop
    depositIntoCoop(coop) {
        if (this.state !== 'carried') return false;

        this.state = 'in_coop';
        this.inCoop = true;
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
        return this.state === 'wild' && !this.escapeInvulnerable;
    }

    // Check if player can catch this chicken (escaped wild chickens)
    canBeCaught(hero) {
        if (this.state !== 'wild') return false;
        const dist = Math.hypot(this.x - hero.x, this.y - hero.y);
        return dist < 40;
    }
    
    // --- Color utility helpers ---
    _darkenColor(hex, amount) {
        const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.floor(255 * amount));
        const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.floor(255 * amount));
        const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.floor(255 * amount));
        return `rgb(${r},${g},${b})`;
    }

    _lightenColor(hex, amount) {
        const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.floor(255 * amount));
        const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.floor(255 * amount));
        const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.floor(255 * amount));
        return `rgb(${r},${g},${b})`;
    }

    // --- State-dependent animation parameters ---
    _getStateParams() {
        const t = this.animTimer;
        const isMoving = this.state === 'wild' || this.state === 'escaping';
        const isCarried = this.state === 'carried' || this.state === 'grabbed';
        const isScared = this.state === 'escaping';
        const isIdle = this.state === 'idle' || this.state === 'in_coop' || this.state === 'eligible_to_lay' || this.state === 'egg_waiting';
        const isLaying = this.state === 'laying';

        // Body squash/stretch
        let bodyScaleX = 1.0, bodyScaleY = 1.0;
        if (isMoving) {
            bodyScaleX = 1.0 + Math.sin(t * 8) * 0.04;
            bodyScaleY = 1.0 - Math.sin(t * 8) * 0.04;
        }
        if (isScared) {
            bodyScaleX = 0.9; bodyScaleY = 1.1; // Stretched upward
        }
        if (isCarried) {
            bodyScaleX = 1.1; bodyScaleY = 0.85; // Squished
        }
        if (isLaying) {
            bodyScaleX = 1.0 + Math.sin(t * 10) * 0.08;
            bodyScaleY = 1.0 - Math.sin(t * 10) * 0.06;
        }

        // Head bob
        let headBob = 0;
        if (isMoving) headBob = Math.sin(t * 6) * 2;
        if (isIdle) headBob = Math.sin(t * 2) * 0.8; // Gentle idle bob

        // Leg animation (walking cycle)
        let legPhase = 0;
        if (isMoving) legPhase = t * 8;
        if (isScared) legPhase = t * 12; // Faster when scared

        // Wing flap
        let wingAngle = 0;
        if (isScared) wingAngle = Math.sin(t * 10) * 0.4;
        else if (isMoving) wingAngle = Math.sin(t * 5) * 0.15;

        // Beak open
        let beakOpen = 0;
        if (isScared) beakOpen = 3;
        if (isLaying) beakOpen = 2 + Math.sin(t * 6) * 1;

        // Eye state
        let eyeScale = 1.0;
        if (isScared) eyeScale = 1.5; // Wide eyes
        if (isCarried) eyeScale = 1.3;

        // Tail sway
        let tailSway = Math.sin(t * 3) * 0.1;
        if (isMoving) tailSway = Math.sin(t * 5) * 0.2;

        return {
            bodyScaleX, bodyScaleY, headBob, legPhase,
            wingAngle, beakOpen, eyeScale, tailSway,
            isMoving, isCarried, isScared, isIdle, isLaying
        };
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

        // Draw chicken body (illustrative overhaul)
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
        switch (hungerState) {
            case 'full':
            case 'satisfied':
                ctx.globalAlpha = Math.min(ctx.globalAlpha || 1.0, 1.0);
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

        const bodyColor = this.attributes ? this.attributes.color : '#ffffff';
        const darkColor = this._darkenColor(bodyColor, 0.2);
        const lightColor = this._lightenColor(bodyColor, 0.2);
        const sp = this._getStateParams();
        const cx = this.x;
        const cy = this.y;

        // 1) Shadow — soft ellipse, scales with movement
        this._drawShadow(ctx, cx, cy, sp);

        // 2) Tail feathers — behind body
        this._drawTailFeathers(ctx, cx, cy, bodyColor, darkColor, sp);

        // 3) Legs/Feet
        this._drawLegs(ctx, cx, cy, sp);

        // 4) Body — layered feather body
        this._drawFeatheredBody(ctx, cx, cy, bodyColor, darkColor, lightColor, sp);

        // 5) Wing
        this._drawWing(ctx, cx, cy, bodyColor, darkColor, lightColor, sp);

        // 6) Neck + Head
        this._drawHead(ctx, cx, cy, bodyColor, darkColor, lightColor, sp);

        ctx.restore(); // Restore filter
    }

    _drawShadow(ctx, cx, cy, sp) {
        const shadowStretch = sp.isMoving ? 1.15 : 1.0;
        ctx.fillStyle = 'rgba(0,0,0,0.13)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 13 * shadowStretch, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawTailFeathers(ctx, cx, cy, bodyColor, darkColor, sp) {
        ctx.save();
        ctx.translate(cx - 10, cy - 2);
        ctx.rotate(-0.3 + sp.tailSway);
        // 4 tail feathers as bezier curves fanning out
        const featherColors = [darkColor, bodyColor, darkColor, bodyColor];
        const angles = [-0.35, -0.15, 0.05, 0.25];
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate(angles[i]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-4, -8, -8, -14, -3 + i * 1.5, -18);
            ctx.bezierCurveTo(-1 + i, -14, 1, -7, 0, 0);
            ctx.fillStyle = featherColors[i];
            ctx.fill();
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    _drawLegs(ctx, cx, cy, sp) {
        const legColor = '#e8a020';
        const legDark = '#c08010';
        // Left leg
        const leftPhase = Math.sin(sp.legPhase) * 4;
        const rightPhase = Math.sin(sp.legPhase + Math.PI) * 4;

        // Carried state: legs dangle
        if (sp.isCarried) {
            this._drawDanglingLeg(ctx, cx - 4, cy + 8, legColor, legDark);
            this._drawDanglingLeg(ctx, cx + 4, cy + 8, legColor, legDark);
            return;
        }

        this._drawLeg(ctx, cx - 4, cy + 7, leftPhase, legColor, legDark);
        this._drawLeg(ctx, cx + 4, cy + 7, rightPhase, legColor, legDark);
    }

    _drawLeg(ctx, lx, ly, phase, color, darkColor) {
        // Upper leg (thicker)
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + phase * 0.3, ly + 5);
        ctx.stroke();

        // Lower leg (thinner)
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx + phase * 0.3, ly + 5);
        ctx.lineTo(lx + phase * 0.6, ly + 10);
        ctx.stroke();

        // 3-toed foot
        const footX = lx + phase * 0.6;
        const footY = ly + 10;
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX - 2.5, footY + 3);
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + 0.5, footY + 3.5);
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + 3, footY + 2.5);
        ctx.stroke();
    }

    _drawDanglingLeg(ctx, lx, ly, color, darkColor) {
        const dangle = Math.sin(this.animTimer * 4) * 1.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(lx + dangle, ly + 5, lx + dangle * 0.5, ly + 10);
        ctx.stroke();

        // Dangling toes
        const footX = lx + dangle * 0.5;
        const footY = ly + 10;
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX - 2, footY + 2);
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + 0.5, footY + 2.5);
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + 2.5, footY + 2);
        ctx.stroke();
    }

    _drawFeatheredBody(ctx, cx, cy, bodyColor, darkColor, lightColor, sp) {
        const sx = sp.bodyScaleX;
        const sy = sp.bodyScaleY;

        // Main body ellipse — bottom-heavy
        ctx.beginPath();
        ctx.ellipse(cx, cy + 1, 12 * sx, 10 * sy, 0, 0, Math.PI * 2);
        // Gradient fill: lighter belly, darker back
        const grad = ctx.createRadialGradient(cx + 3, cy + 4, 2, cx, cy, 12);
        grad.addColorStop(0, lightColor);
        grad.addColorStop(0.7, bodyColor);
        grad.addColorStop(1, darkColor);
        ctx.fillStyle = grad;
        ctx.fill();

        // Subtle outline (hand-drawn feel — slight thickness variation)
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Breast feathers — 3 overlapping small ellipses (lighter)
        ctx.fillStyle = lightColor;
        ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(
                cx + 2 + i * 2, cy + 3 + i * 1.5,
                4 * sx, 3 * sy, 0.2, 0, Math.PI * 2
            );
            ctx.fill();
        }
        ctx.globalAlpha = Math.min(1, (ctx.globalAlpha || 0.5) / 0.5);

        // Feather texture strokes on body edge (curved ink-like strokes)
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 0.6;
        for (let i = 0; i < 5; i++) {
            const angle = -0.8 + i * 0.4;
            const edgeX = cx + Math.cos(angle) * 11 * sx;
            const edgeY = cy + Math.sin(angle) * 9 * sy;
            ctx.beginPath();
            ctx.moveTo(edgeX, edgeY);
            ctx.quadraticCurveTo(
                edgeX - 2, edgeY + 2,
                edgeX - 3, edgeY + 4
            );
            ctx.stroke();
        }
    }

    _drawWing(ctx, cx, cy, bodyColor, darkColor, lightColor, sp) {
        ctx.save();
        ctx.translate(cx - 6, cy + 1);
        ctx.rotate(sp.wingAngle);

        // Layered feather wing — 4 feather tips via bezier
        const featherShades = [darkColor, bodyColor, lightColor, bodyColor];
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, -2 + i * 2);
            ctx.bezierCurveTo(
                -6, -4 + i * 2.5,
                -10, -1 + i * 3,
                -7, 3 + i * 2
            );
            ctx.bezierCurveTo(
                -4, 2 + i * 1.5,
                -1, 0 + i * 1,
                0, -2 + i * 2
            );
            ctx.fillStyle = featherShades[i];
            ctx.fill();
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 0.4;
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawHead(ctx, cx, cy, bodyColor, darkColor, lightColor, sp) {
        const headX = cx + 2;
        const headY = cy - 9 + sp.headBob;

        // Neck connection — small tapered shape
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5);
        ctx.quadraticCurveTo(cx + 2, cy - 7, headX, headY + 5);
        ctx.quadraticCurveTo(cx + 4, cy - 7, cx + 3, cy - 4);
        ctx.fill();

        // Head shape — rounded
        const headGrad = ctx.createRadialGradient(headX + 2, headY - 1, 1, headX, headY, 7);
        headGrad.addColorStop(0, lightColor);
        headGrad.addColorStop(1, bodyColor);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(headX, headY, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Comb — 3-4 rounded bumps on top
        this._drawComb(ctx, headX, headY);

        // Wattle — small red drops beneath beak
        this._drawWattle(ctx, headX, headY, sp);

        // Beak — upper/lower mandible
        this._drawBeak(ctx, headX, headY, sp);

        // Eye — iris, pupil, highlight
        this._drawEye(ctx, headX, headY, sp);
    }

    _drawComb(ctx, headX, headY) {
        ctx.fillStyle = '#d63030';
        const combGrad = ctx.createLinearGradient(headX - 4, headY - 14, headX + 4, headY - 10);
        combGrad.addColorStop(0, '#e74c3c');
        combGrad.addColorStop(1, '#c0392b');
        ctx.fillStyle = combGrad;
        // 3 bumps
        ctx.beginPath();
        ctx.arc(headX - 3, headY - 11, 2.5, Math.PI, 0);
        ctx.arc(headX, headY - 12, 3, Math.PI, 0);
        ctx.arc(headX + 3, headY - 11, 2.5, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#a93226';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    _drawWattle(ctx, headX, headY, sp) {
        // Two small red drops below beak
        const wattleGrad = ctx.createLinearGradient(headX + 5, headY + 1, headX + 7, headY + 5);
        wattleGrad.addColorStop(0, '#e74c3c');
        wattleGrad.addColorStop(1, '#c0392b');
        ctx.fillStyle = wattleGrad;
        ctx.beginPath();
        ctx.ellipse(headX + 5, headY + 3, 1.5, 2.5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(headX + 7, headY + 2.5, 1.2, 2, 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawBeak(ctx, headX, headY, sp) {
        const beakGrad = ctx.createLinearGradient(headX + 5, headY - 3, headX + 12, headY);
        beakGrad.addColorStop(0, '#f0a030');
        beakGrad.addColorStop(1, '#e08020');

        // Upper mandible
        ctx.fillStyle = beakGrad;
        ctx.beginPath();
        ctx.moveTo(headX + 5, headY - 2);
        ctx.quadraticCurveTo(headX + 10, headY - 3, headX + 12, headY - 1 - sp.beakOpen * 0.3);
        ctx.quadraticCurveTo(headX + 9, headY - 0.5, headX + 5, headY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c07018';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Lower mandible
        ctx.fillStyle = '#d89030';
        ctx.beginPath();
        ctx.moveTo(headX + 5, headY);
        ctx.quadraticCurveTo(headX + 9, headY + 0.5 + sp.beakOpen * 0.4, headX + 11, headY + 1 + sp.beakOpen * 0.5);
        ctx.quadraticCurveTo(headX + 8, headY + 1, headX + 5, headY);
        ctx.closePath();
        ctx.fill();
    }

    _drawEye(ctx, headX, headY, sp) {
        const eyeX = headX + 3;
        const eyeY = headY - 1;
        const r = 2 * sp.eyeScale;

        // Eye white
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, r * 1.1, r, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        ctx.fillStyle = '#2c1810';
        ctx.beginPath();
        ctx.arc(eyeX + 0.3, eyeY, r * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(eyeX + 0.5, eyeY, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Highlight (top-right, light source)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX + 0.8, eyeY - r * 0.4, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawEggIndicator(ctx) {
        const eggY = this.y - 25;

        // Egg shape with gradient
        ctx.save();
        const wobble = this.state === 'laying' ? Math.sin(this.animTimer * 8) * 0.08 : 0;
        ctx.translate(this.x, eggY);
        ctx.rotate(wobble);

        // Base egg with vertical gradient
        const eggGrad = ctx.createLinearGradient(0, -8, 0, 8);
        eggGrad.addColorStop(0, '#ffffff');
        eggGrad.addColorStop(1, '#f5e6c8');
        ctx.fillStyle = eggGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shadow curve on bottom-left
        ctx.fillStyle = 'rgba(180,150,100,0.2)';
        ctx.beginPath();
        ctx.ellipse(-2, 3, 4, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Highlight spot on top-right
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(2, -3, 2, 2.5, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Glow pulse
        const pulse = Math.sin(this.animTimer * 3) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, eggY, 10, 0, Math.PI * 2);
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
            'escaping': { text: '🏃 ESCAPE', color: '#e74c3c' },
            'grabbed': { text: '🦝 GRABBED', color: '#ff0000' }
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHICKEN_TYPE_TEMPLATES, Chicken };
}
