/**
 * Hero class - The Wizard (simplified for egg collection gameplay)
 * Carries ONE tool at a time (egg basket, food basket, or hammer)
 */
class Hero {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 22;
        this.baseSpeed = 220;
        this.sprintSpeed = 380;
        this.speed = this.baseSpeed;
        this.vx = 0;
        this.vy = 0;
        this.facing = 0;

        // Animation
        this.time = 0;
        this.facingDirection = 'right';
        this.isMoving = false;
        this.lastVelocityX = 0;
        this.isStartled = false;
        this.startledTimer = 0;
        this.isSprinting = false;

        // Tool system (ONE tool at a time)
        this.currentTool = null;

        // Repair state for hammer
        this.isRepairing = false;
        this.repairTimer = 0;
        this.repairDuration = 2.0;
        this.repairTarget = null;

        // Spell system
        this.spells = [
            { id: 'freeze', name: 'Freeze', cooldown: 8, lastCast: 0, icon: '❄️', color: '#3498db' },
            { id: 'attract', name: 'Attract', cooldown: 10, lastCast: 0, icon: '🧲', color: '#9b59b6' },
            { id: 'speed', name: 'Speed', cooldown: 6, lastCast: 0, icon: '⚡', color: '#f1c40f' }
        ];
        this.activeSpellEffects = [];

        // Animation system
        this.animator = new WizardAnimator();

        // Trail for sprint
        this.sprintTrail = [];

        // Chicken carrying - supports up to 2 chickens
        this.carrying = {
            chickens: [],           // Array of chicken objects (max 2)
            maxChickens: 2         // Configurable limit
        };

        // Interaction ranges
        this.ranges = {
            pickupRadius: 40,
            depositRadius: 60
        };

        // Coop state
        this.inCoop = false;
    }

    // ==================== COOP ENTRY/EXIT ====================

    enterCoop() {
        this.inCoop = true;
    }

    exitCoop() {
        this.inCoop = false;
    }

    // ==================== CHICKEN CARRYING ====================

    canPickUpChicken() {
        return this.carrying.chickens.length < this.carrying.maxChickens;
    }

    pickUpChicken(chicken) {
        if (!this.canPickUpChicken()) return false;
        if (!chicken.canBePickedUp()) return false;

        this.carrying.chickens.push(chicken);
        chicken.pickUp();

        // Hide world sprite when carrying (will be shown in carried position)
        chicken.worldSpriteVisible = false;

        return true;
    }

    depositChicken(coop) {
        if (this.carrying.chickens.length === 0) return false;

        // Deposit the first chicken (could deposit all if needed)
        const chicken = this.carrying.chickens[0];
        const deposited = chicken.depositIntoCoop(coop);

        if (deposited) {
            coop.chickens.push(chicken);
            this.carrying.chickens.shift(); // Remove first chicken
            return true;
        }

        return false;
    }

    depositAllChickens(coop) {
        if (this.carrying.chickens.length === 0) return 0;

        let depositedCount = 0;
        // Iterate backwards to safely remove items while iterating
        for (let i = this.carrying.chickens.length - 1; i >= 0; i--) {
            const chicken = this.carrying.chickens[i];
            const deposited = chicken.depositIntoCoop(coop);

            if (deposited) {
                coop.chickens.push(chicken);
                this.carrying.chickens.splice(i, 1);
                depositedCount++;
            }
        }

        return depositedCount;
    }

    getCarriedChickenPosition(index) {
        // Position chickens side-by-side (dual carry design)
        if (this.carrying.chickens.length === 1) {
            // Single chicken - right side
            const offsetX = this.facingDirection === 'right' ? 20 : -20;
            return {
                x: this.x + offsetX,
                y: this.y - 15
            };
        } else if (this.carrying.chickens.length === 2) {
            // Two chickens - side by side
            if (index === 0) {
                // Left chicken
                const offsetX = this.facingDirection === 'right' ? -14 : 14;
                return {
                    x: this.x + offsetX,
                    y: this.y - 6
                };
            } else {
                // Right chicken
                const offsetX = this.facingDirection === 'right' ? 14 : -14;
                return {
                    x: this.x + offsetX,
                    y: this.y - 10
                };
            }
        }
        return { x: this.x, y: this.y };
    }

    // Helper method to check if carrying chickens
    isCarrying() {
        return this.carrying.chickens.length > 0;
    }
    
    update(deltaTime, input, chickens, particleSystem) {
        // Store last valid position for recovery
        const lastX = this.x;
        const lastY = this.y;

        this.time += deltaTime;

        // Handle sprint
        this.isSprinting = input.isSprinting();
        this.speed = this.isSprinting ? this.sprintSpeed : this.baseSpeed;

        // Movement
        const move = input.getMovementVector();
        this.vx = move.dx * this.speed;
        this.vy = move.dy * this.speed;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        if (move.dx !== 0 || move.dy !== 0) {
            this.facing = Math.atan2(move.dy, move.dx);
        }

        if (this.vx > 0.1) this.facingDirection = 'right';
        else if (this.vx < -0.1) this.facingDirection = 'left';

        this.isMoving = Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1;
        this.lastVelocityX = this.vx;

        // Update sprint trail
        if (this.isSprinting && this.isMoving) {
            this.sprintTrail.push({ x: this.x, y: this.y, time: this.time, alpha: 0.6 });
        }
        this.sprintTrail = this.sprintTrail.filter(t => this.time - t.time < 0.4);

        // Timers
        if (this.startledTimer > 0) {
            this.startledTimer -= deltaTime;
            if (this.startledTimer <= 0) this.isStartled = false;
        }

        // Handle spell casting
        const spellSlot = input.getSpellPressed();
        if (spellSlot) {
            this.castSpell(spellSlot - 1, chickens, particleSystem);
        }

        // Update active spell effects
        this.updateSpellEffects(deltaTime, chickens);

        // Update carried chicken positions with bobbing animation
        for (let i = 0; i < this.carrying.chickens.length; i++) {
            const chicken = this.carrying.chickens[i];
            const pos = this.getCarriedChickenPosition(i);

            // Add bobbing animation - opposite phase for each chicken (seesaw effect)
            const bobPhase = i === 0 ? 0 : Math.PI; // 180° offset
            const bobOffset = Math.sin((this.time * 4) + bobPhase) * 2;

            chicken.x = pos.x;
            chicken.y = pos.y + bobOffset;
        }

        // Validate new position and recover if corrupted
        if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
            console.error('[Hero] Position corruption detected, recovering:', {
                bad: { x: this.x, y: this.y },
                recovering: { x: lastX, y: lastY }
            });
            this.x = lastX;
            this.y = lastY;
            this.vx = 0;
            this.vy = 0;
        }

        // Clamp to canvas bounds (with margin)
        const margin = 50;
        this.x = Math.max(-margin, Math.min(800 + margin, this.x));
        this.y = Math.max(-margin, Math.min(600 + margin, this.y));
    }

    // ==================== SPELL SYSTEM ====================

    castSpell(spellIndex, chickens, particleSystem) {
        const spell = this.spells[spellIndex];
        if (!spell) return;

        const now = this.time;
        const timeSinceCast = now - spell.lastCast;

        if (timeSinceCast < spell.cooldown) return; // On cooldown

        spell.lastCast = now;

        // Apply spell effect
        switch(spell.id) {
            case 'freeze':
                this.applyFreeze(chickens, particleSystem);
                break;
            case 'attract':
                this.applyAttract(chickens, particleSystem);
                break;
            case 'speed':
                this.applySpeedBoost(particleSystem);
                break;
        }
    }

    applyFreeze(chickens, particleSystem) {
        // Freeze all chickens for 3 seconds
        const freezeDuration = 3;
        chickens.forEach(chicken => {
            if (chicken.inCoop) {
                this.activeSpellEffects.push({
                    type: 'freeze',
                    target: chicken,
                    duration: freezeDuration,
                    elapsed: 0
                });
                chicken.isFrozen = true;
            }
        });

        // Visual effect
        if (particleSystem) {
            particleSystem.spawn(this.x, this.y, 'freeze_burst', 20);
        }
    }

    applyAttract(chickens, particleSystem) {
        // Pull nearby chickens toward player
        const attractRadius = 150;
        chickens.forEach(chicken => {
            if (chicken.inCoop && !chicken.isFrozen) {
                const dist = Math.hypot(chicken.x - this.x, chicken.y - this.y);
                if (dist < attractRadius) {
                    this.activeSpellEffects.push({
                        type: 'attract',
                        target: chicken,
                        duration: 2,
                        elapsed: 0,
                        pullStrength: 80
                    });
                }
            }
        });

        if (particleSystem) {
            particleSystem.spawn(this.x, this.y, 'attract_burst', 15);
        }
    }

    applySpeedBoost(particleSystem) {
        // Temporary speed boost for player
        this.activeSpellEffects.push({
            type: 'speed',
            target: this,
            duration: 4,
            elapsed: 0,
            speedBonus: 100
        });

        if (particleSystem) {
            particleSystem.spawn(this.x, this.y, 'speed_burst', 15);
        }
    }

    updateSpellEffects(deltaTime, chickens) {
        this.activeSpellEffects = this.activeSpellEffects.filter(effect => {
            effect.elapsed += deltaTime;

            if (effect.elapsed >= effect.duration) {
                // Effect expired
                if (effect.type === 'freeze' && effect.target) {
                    effect.target.isFrozen = false;
                }
                return false;
            }

            // Apply ongoing effects
            switch(effect.type) {
                case 'attract':
                    if (effect.target && effect.target.inCoop) {
                        const dx = this.x - effect.target.x;
                        const dy = this.y - effect.target.y;
                        const dist = Math.hypot(dx, dy);
                        if (dist > 0) {
                            effect.target.x += (dx / dist) * effect.pullStrength * deltaTime;
                            effect.target.y += (dy / dist) * effect.pullStrength * deltaTime;
                        }
                    }
                    break;
                case 'speed':
                    this.speed = this.sprintSpeed + effect.speedBonus;
                    break;
            }

            return true;
        });
    }

    getSpellCooldown(spellIndex) {
        const spell = this.spells[spellIndex];
        if (!spell) return 0;
        const timeSince = this.time - spell.lastCast;
        return Math.max(0, spell.cooldown - timeSince);
    }

    isSpellReady(spellIndex) {
        return this.getSpellCooldown(spellIndex) <= 0;
    }
    
    // ==================== TOOL SYSTEM ====================
    
    pickUpTool(tool) {
        if (this.currentTool !== null) return false;
        this.currentTool = tool;
        tool.pickup();
        return true;
    }
    
    hasTool(toolType) {
        return this.currentTool && this.currentTool.type === toolType;
    }
    
    getTool(toolType) {
        if (!toolType) return this.currentTool;
        return (this.currentTool && this.currentTool.type === toolType) ? this.currentTool : null;
    }
    
    useTool(toolType) {
        if (!this.currentTool || this.currentTool.type !== toolType) return false;
        return this.currentTool.use();
    }
    
    dropTool(toolType) {
        if (!this.currentTool) return null;
        if (toolType && this.currentTool.type !== toolType) return null;
        
        const tool = this.currentTool;
        tool.drop();
        this.currentTool = null;
        return tool;
    }
    
    // ==================== REPAIR SYSTEM ====================
    
    startRepair(hole) {
        if (this.isRepairing) return;
        this.isRepairing = true;
        this.repairTimer = 0;
        this.repairTarget = hole;
    }
    
    updateRepair(deltaTime) {
        if (!this.isRepairing) return null;
        
        this.repairTimer += deltaTime;
        if (this.repairTimer >= this.repairDuration) {
            this.isRepairing = false;
            const hole = this.repairTarget;
            this.repairTarget = null;
            return hole;
        }
        return null;
    }
    
    // ==================== DRAWING ====================

    draw(ctx) {
        // Draw sprint trail first (behind hero)
        if (this.isSprinting || this.sprintTrail.length > 0) {
            this.drawSprintTrail(ctx);
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // Flip for facing direction
        if (this.facingDirection === 'left') {
            ctx.scale(-1, 1);
        }

        const animState = this.determineAnimationState();
        this.animator.draw(ctx, animState, this.time, this.facingDirection);

        ctx.restore();

        // Draw carried tool
        this.drawTool(ctx);

        // Draw carried chicken (after hero so it appears on top)
        this.drawCarriedChicken(ctx);

        // Draw spell effects
        this.drawSpellEffects(ctx);
    }

    drawSprintTrail(ctx) {
        this.sprintTrail.forEach((point, i) => {
            const age = this.time - point.time;
            const alpha = point.alpha * (1 - age / 0.4);
            const scale = 1 - age / 0.4;

            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 15 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 25 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawSpellEffects(ctx) {
        // Draw active spell auras
        this.activeSpellEffects.forEach(effect => {
            if (effect.type === 'speed') {
                // Yellow aura for speed
                const pulse = Math.sin(this.time * 10) * 0.2 + 0.8;
                ctx.save();
                ctx.globalAlpha = 0.3 * pulse;
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
    }
    
    drawTool(ctx) {
        if (!this.currentTool) return;
        
        const offsetX = this.facingDirection === 'right' ? 20 : -20;
        
        ctx.save();
        ctx.translate(this.x + offsetX, this.y - 10);
        
        // Draw based on tool type
        switch(this.currentTool.type) {
            case 'eggBasket':
                this.drawEggBasketIcon(ctx);
                break;
            case 'foodBasket':
                this.drawFoodBasketIcon(ctx);
                break;
            case 'hammer':
                this.drawHammerIcon(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    drawEggBasketIcon(ctx) {
        // Simple basket icon
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(0, 5, 10, 0, Math.PI, false);
        ctx.fill();
        
        // Handle
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, Math.PI, 0, false);
        ctx.stroke();
        
        // Show egg count
        const eggs = this.currentTool.eggs || 0;
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(eggs.toString(), 0, 8);
    }
    
    drawFoodBasketIcon(ctx) {
        ctx.fillStyle = '#d2691e';
        ctx.beginPath();
        ctx.arc(0, 5, 10, 0, Math.PI, false);
        ctx.fill();
        
        // Grain visible
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-3, 0, 2, 0, Math.PI * 2);
        ctx.arc(2, -1, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawCarriedChicken(ctx) {
        if (this.carrying.chickens.length === 0) return;

        // Draw each carried chicken
        for (let i = 0; i < this.carrying.chickens.length; i++) {
            const chicken = this.carrying.chickens[i];
            chicken.draw(ctx);

            // Draw carrying indicator
            ctx.save();
            ctx.fillStyle = '#3498db';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('👋', chicken.x, chicken.y - 25);
            ctx.restore();
        }

        // Draw capacity indicator when carrying chickens
        this.drawCapacityIndicator(ctx);
    }

    drawCapacityIndicator(ctx) {
        const count = this.carrying.chickens.length;
        const max = this.carrying.maxChickens;

        // Show indicator above hero's head
        const indicatorX = this.x;
        const indicatorY = this.y - 50;

        ctx.save();
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';

        // Draw chicken silhouettes
        for (let i = 0; i < max; i++) {
            const x = indicatorX + (i - (max - 1) / 2) * 14;
            if (i < count) {
                // Filled chicken (carrying)
                ctx.fillStyle = '#ffd700';
                ctx.fillText('🐔', x, indicatorY);
            } else {
                // Empty slot (outline)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillText('○', x, indicatorY);
            }
        }

        ctx.restore();
    }

    drawHammerIcon(ctx) {
        // Hammer head
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(-8, -8, 16, 8);

        // Handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-2, 0, 4, 15);
    }
    
    determineAnimationState() {
        if (this.isStartled) return 'startled';
        if (this.isRepairing) return 'hammer';
        if (this.isSprinting && this.isMoving) return 'walk';
        if (this.isMoving) return 'walk';
        return 'idle';
    }
    
    triggerStartled() {
        this.isStartled = true;
        this.startledTimer = 1.0;
    }
    
    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}
