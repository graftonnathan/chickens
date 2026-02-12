/**
 * Hero class - The Wizard (simplified for egg collection gameplay)
 * Uses a 2-slot hand system: each hand can hold a chicken OR a tool.
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

        // 2-slot hand system: each hand holds { type: 'chicken'|'tool', item: object } or null
        this.leftHand = null;
        this.rightHand = null;

        // Repair state for hammer
        this.isRepairing = false;
        this.repairTimer = 0;
        this.repairDuration = 2.0;
        this.repairTarget = null;

        // Deposit channel state (depositing takes time — hero must stand still)
        this.isDepositing = false;
        this.depositTimer = 0;
        this.depositDuration = 1.5;   // seconds per chicken
        this.depositTarget = null;     // the coop being deposited into

        // Feeding channel state
        this.isFeeding = false;
        this.feedTimer = 0;
        this.feedDuration = 2.0;      // seconds to dump all food into coop
        this.feedTarget = null;        // coop being fed

        // Egg collection channel state
        this.isCollecting = false;
        this.collectTimer = 0;
        this.collectDuration = 1.0;   // seconds per egg collected
        this.collectTarget = null;     // chicken whose egg is being collected

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

        // Backward-compatible carrying object (computed from hand slots)
        this.carrying = {
            chickens: [],           // Kept in sync with hand slots
            maxChickens: 2         // Max 2 slots total
        };

        // Interaction ranges
        this.ranges = {
            pickupRadius: 40,
            depositRadius: 60
        };

        // Coop state
        this.inCoop = false;
    }

    // ==================== HAND SLOT HELPERS ====================

    /** Get first empty hand slot name, or null if both full */
    _getEmptyHand() {
        if (!this.leftHand) return 'leftHand';
        if (!this.rightHand) return 'rightHand';
        return null;
    }

    /** Count total items in hands */
    _handCount() {
        return (this.leftHand ? 1 : 0) + (this.rightHand ? 1 : 0);
    }

    /** Sync the backward-compatible carrying.chickens array from hand slots */
    _syncCarryingArray() {
        this.carrying.chickens = [];
        if (this.leftHand && this.leftHand.type === 'chicken') {
            this.carrying.chickens.push(this.leftHand.item);
        }
        if (this.rightHand && this.rightHand.type === 'chicken') {
            this.carrying.chickens.push(this.rightHand.item);
        }
    }

    /** Force-drop a specific chicken from whichever hand it's in */
    forceDropChicken(chicken) {
        if (this.leftHand && this.leftHand.type === 'chicken' && this.leftHand.item === chicken) {
            this.leftHand = null;
        } else if (this.rightHand && this.rightHand.type === 'chicken' && this.rightHand.item === chicken) {
            this.rightHand = null;
        }
        chicken.worldSpriteVisible = true;
        this._syncCarryingArray();
    }

    /** Get the tool currently held (backward-compatible with this.currentTool) */
    get currentTool() {
        if (this.leftHand && this.leftHand.type === 'tool') return this.leftHand.item;
        if (this.rightHand && this.rightHand.type === 'tool') return this.rightHand.item;
        return null;
    }

    /** Set current tool (backward-compatible setter — places tool in first empty hand) */
    set currentTool(val) {
        if (val === null) {
            // Remove tool from whichever hand holds it
            if (this.leftHand && this.leftHand.type === 'tool') this.leftHand = null;
            if (this.rightHand && this.rightHand.type === 'tool') this.rightHand = null;
        }
        // Setting to non-null is handled by pickUpTool
    }

    /** Get what's in each hand for rendering: { left: {type, item}|null, right: {type, item}|null } */
    getHandContents() {
        return {
            left: this.leftHand,
            right: this.rightHand
        };
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
        return this._getEmptyHand() !== null;
    }

    pickUpChicken(chicken) {
        if (!this.canPickUpChicken()) return false;
        if (!chicken.canBePickedUp()) return false;

        const hand = this._getEmptyHand();
        this[hand] = { type: 'chicken', item: chicken };
        this._syncCarryingArray();
        chicken.pickUp();

        // Hide world sprite when carrying (will be shown in carried position)
        chicken.worldSpriteVisible = false;

        return true;
    }

    depositChicken(coop) {
        if (this.carrying.chickens.length === 0) return false;

        // Find first hand holding a chicken
        const chicken = this.carrying.chickens[0];
        const deposited = coop.returnChicken(chicken);

        if (deposited) {
            // Remove from hand slot
            if (this.leftHand && this.leftHand.type === 'chicken' && this.leftHand.item === chicken) {
                this.leftHand = null;
            } else if (this.rightHand && this.rightHand.type === 'chicken' && this.rightHand.item === chicken) {
                this.rightHand = null;
            }
            this._syncCarryingArray();
            return true;
        }

        return false;
    }

    depositAllChickens(coop) {
        if (this.carrying.chickens.length === 0) return 0;

        let depositedCount = 0;
        // Collect chickens from hands
        const chickensToDeposit = [...this.carrying.chickens];
        for (const chicken of chickensToDeposit) {
            const deposited = coop.returnChicken(chicken);
            if (deposited) {
                // Remove from hand slot
                if (this.leftHand && this.leftHand.type === 'chicken' && this.leftHand.item === chicken) {
                    this.leftHand = null;
                } else if (this.rightHand && this.rightHand.type === 'chicken' && this.rightHand.item === chicken) {
                    this.rightHand = null;
                }
                depositedCount++;
            }
        }
        this._syncCarryingArray();

        return depositedCount;
    }

    getCarriedChickenPosition(index) {
        // Position chickens at hand positions
        if (this.carrying.chickens.length === 1) {
            // Single chicken - on the side of whichever hand holds it
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

        // Check for chicken escape from carry
        const hands = [this.leftHand, this.rightHand];
        for (const hand of hands) {
            if (hand && hand.type === 'chicken' && hand.item) {
                const result = hand.item.updateCarried(deltaTime);
                if (result === 'escape_carry') {
                    const chicken = hand.item;
                    this.forceDropChicken(chicken);
                    // Place the chicken at the hero's position
                    chicken.x = this.x;
                    chicken.y = this.y;
                    chicken.state = 'wild';
                    chicken.stateTimer = 0;
                    // Invulnerable to pickup for 0.2 seconds with speed burst
                    chicken.escapeInvulnerable = true;
                    chicken.escapeInvulnerableTimer = 0.2;
                    // Set a random escape direction
                    chicken.wanderAngle = Math.random() * Math.PI * 2;
                    break; // Only handle one escape per frame
                }
            }
        }

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

        // Update carried chicken positions (for collision etc.)
        this._updateCarriedChickenPositions();

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

        // Clamp to play area (25px inside the visual fences, extends into roof area in south)
        this.x = Math.max(45, Math.min(755, this.x));
        this.y = Math.max(60, Math.min(570, this.y));
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
        // Check if already holding this type of tool
        if (this.currentTool !== null) return false;
        // Need an empty hand slot
        const hand = this._getEmptyHand();
        if (!hand) return false;
        this[hand] = { type: 'tool', item: tool };
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
        // Remove from hand slot
        if (this.leftHand && this.leftHand.type === 'tool' && this.leftHand.item === tool) {
            this.leftHand = null;
        } else if (this.rightHand && this.rightHand.type === 'tool' && this.rightHand.item === tool) {
            this.rightHand = null;
        }
        return tool;
    }
    
    // ==================== DEPOSIT CHANNEL SYSTEM ====================

    startDeposit(coop) {
        if (this.isChanneling() || !this.isCarrying()) return;
        this.isDepositing = true;
        this.depositTimer = 0;
        this.depositTarget = coop;
    }

    updateDeposit(deltaTime) {
        if (!this.isDepositing) return null;

        // Cancel if hero moves
        if (this.isMoving) {
            this.cancelDeposit();
            return null;
        }

        this.depositTimer += deltaTime;
        if (this.depositTimer >= this.depositDuration) {
            this.isDepositing = false;
            // Deposit ONE chicken per channel completion
            const chicken = this.carrying.chickens[0];
            const coop = this.depositTarget;
            const deposited = coop.returnChicken(chicken);

            if (deposited) {
                // Remove from hand slot
                if (this.leftHand && this.leftHand.type === 'chicken' && this.leftHand.item === chicken) {
                    this.leftHand = null;
                } else if (this.rightHand && this.rightHand.type === 'chicken' && this.rightHand.item === chicken) {
                    this.rightHand = null;
                }
                this._syncCarryingArray();
            }

            // If still carrying chickens, auto-start next channel
            if (this.carrying.chickens.length > 0) {
                this.isDepositing = true;
                this.depositTimer = 0;
            } else {
                this.depositTarget = null;
            }

            return deposited ? chicken : null;
        }
        return null;
    }

    cancelDeposit() {
        this.isDepositing = false;
        this.depositTimer = 0;
        this.depositTarget = null;
    }

    getDepositProgress() {
        if (!this.isDepositing) return 0;
        return this.depositTimer / this.depositDuration;
    }

    // ==================== FEEDING CHANNEL SYSTEM ====================

    startFeeding(coop) {
        if (this.isChanneling()) return;
        this.isFeeding = true;
        this.feedTimer = 0;
        this.feedTarget = coop;
    }

    updateFeeding(deltaTime) {
        if (!this.isFeeding) return null;

        // Cancel if hero moves
        if (this.isMoving) {
            this.cancelFeeding();
            return null;
        }

        this.feedTimer += deltaTime;
        if (this.feedTimer >= this.feedDuration) {
            this.isFeeding = false;
            const chicken = this.feedTarget;
            this.feedTarget = null;
            return chicken; // Signal: feeding complete on this chicken
        }
        return null;
    }

    cancelFeeding() {
        this.isFeeding = false;
        this.feedTimer = 0;
        this.feedTarget = null;
    }

    getFeedProgress() {
        if (!this.isFeeding) return 0;
        return this.feedTimer / this.feedDuration;
    }

    // ==================== EGG COLLECTION CHANNEL SYSTEM ====================

    startCollecting(chicken) {
        if (this.isChanneling()) return;
        this.isCollecting = true;
        this.collectTimer = 0;
        this.collectTarget = chicken;
    }

    updateCollecting(deltaTime) {
        if (!this.isCollecting) return null;

        // Cancel if hero moves
        if (this.isMoving) {
            this.cancelCollecting();
            return null;
        }

        this.collectTimer += deltaTime;
        if (this.collectTimer >= this.collectDuration) {
            this.isCollecting = false;
            const chicken = this.collectTarget;
            this.collectTarget = null;
            return chicken; // Signal: collection complete on this chicken
        }
        return null;
    }

    cancelCollecting() {
        this.isCollecting = false;
        this.collectTimer = 0;
        this.collectTarget = null;
    }

    getCollectProgress() {
        if (!this.isCollecting) return 0;
        return this.collectTimer / this.collectDuration;
    }

    // Helper: is hero in any channeled action?
    isChanneling() {
        return this.isDepositing || this.isFeeding || this.isCollecting || this.isRepairing;
    }

    // Cancel all channels (useful when spooked/hit)
    cancelAllChannels() {
        this.cancelDeposit();
        this.cancelFeeding();
        this.cancelCollecting();
        this.isRepairing = false;
        this.repairTimer = 0;
        this.repairTarget = null;
    }

    // ==================== REPAIR SYSTEM ====================
    
    startRepair(hole) {
        if (this.isChanneling()) return;
        this.isRepairing = true;
        this.repairTimer = 0;
        this.repairTarget = hole;
    }
    
    updateRepair(deltaTime) {
        if (!this.isRepairing) return null;
        
        // Cancel if hero moves
        if (this.isMoving) {
            this.isRepairing = false;
            this.repairTimer = 0;
            this.repairTarget = null;
            return null;
        }
        
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
        // Pass hand contents to animator so it can draw carried items at hand positions
        const handContents = this.getHandContents();
        this.animator.draw(ctx, animState, this.time, this.facingDirection, handContents);

        ctx.restore();

        // Update carried chicken world positions (for collision etc.)
        this._updateCarriedChickenPositions();

        // Draw spell effects
        this.drawSpellEffects(ctx);

        // Draw channel progress bar (deposit / feed / collect)
        if (this.isChanneling()) {
            this.drawChannelProgress(ctx);
        }

    }

    /** Update carried chicken world positions for collision/interaction purposes */
    _updateCarriedChickenPositions() {
        for (let i = 0; i < this.carrying.chickens.length; i++) {
            const chicken = this.carrying.chickens[i];
            const pos = this.getCarriedChickenPosition(i);
            const bobPhase = i === 0 ? 0 : Math.PI;
            const bobOffset = Math.sin((this.time * 4) + bobPhase) * 2;
            chicken.x = pos.x;
            chicken.y = pos.y + bobOffset;
        }
    }

    drawChannelProgress(ctx) {
        let progress = 0;
        let label = '';
        let barColor = '#ffd700';

        if (this.isDepositing) {
            progress = this.getDepositProgress();
            label = 'DEPOSITING...';
            barColor = '#ffd700'; // Gold
        } else if (this.isFeeding) {
            progress = this.getFeedProgress();
            label = '🌾 FEEDING...';
            barColor = '#ff9800'; // Orange
        } else if (this.isCollecting) {
            progress = this.getCollectProgress();
            label = '🥚 COLLECTING...';
            barColor = '#8bc34a'; // Green
        } else if (this.isRepairing) {
            progress = this.repairTimer / this.repairDuration;
            label = '🔨 REPAIRING...';
            barColor = '#4caf50'; // Green
        }

        const barWidth = 50;
        const barHeight = 8;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 60;

        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress fill
        ctx.fillStyle = barColor;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, this.x, barY - 3);

        ctx.restore();
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
    
    drawCapacityIndicator(ctx) {
        const totalSlots = 2;
        const usedSlots = this._handCount();

        // Show indicator above hero's head
        const indicatorX = this.x;
        const indicatorY = this.y - 50;

        ctx.save();
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';

        // Draw hand slot indicators
        const hands = [this.leftHand, this.rightHand];
        for (let i = 0; i < totalSlots; i++) {
            const x = indicatorX + (i - (totalSlots - 1) / 2) * 16;
            const hand = hands[i];
            if (hand) {
                if (hand.type === 'chicken') {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillText('🐔', x, indicatorY);
                } else if (hand.type === 'tool') {
                    const toolIcon = hand.item.type === 'eggBasket' ? '🧺' :
                                     hand.item.type === 'hammer' ? '🔨' : '🌾';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(toolIcon, x, indicatorY);
                }
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillText('○', x, indicatorY);
            }
        }

        ctx.restore();
    }
    
    determineAnimationState() {
        if (this.isStartled) return 'startled';
        if (this.isDepositing) return 'deposit';
        if (this.isFeeding) return 'deposit';      // Reuse deposit pose for feeding
        if (this.isCollecting) return 'deposit';    // Reuse deposit pose for collecting
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Hero };
}
