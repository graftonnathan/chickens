/**
 * Hero class - The Wizard with shared 2-slot carry system (chickens OR basket)
 */
class Hero {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 22;
        this.baseSpeed = 220;
        this.speed = this.baseSpeed;
        this.vx = 0;
        this.vy = 0;
        this.facing = 0; // angle in radians
        
        // Animation timers
        this.time = 0;
        this.trailTimer = 0;
        
        // Proximity glow
        this.glowIntensity = 0;
        
        // Shared carry slots (2 total)
        this.carrySlots = [null, null]; // Each can be: 'chicken', 'basket', 'hammer'
        this.carryData = [{}, {}]; // Additional data for each slot
        
        // Basket-specific data
        this.eggsInBasket = 0;
        this.maxEggs = 5;
        
        // Hammer repair state
        this.isRepairing = false;
        this.repairTimer = 0;
        this.repairDuration = 2.0; // 2 seconds to repair
        this.repairTarget = null;
        
        // Food basket state
        this.foodCount = 0;
        this.maxFood = 5;
        this.isFeeding = false;
        this.feedingTimer = 0;
        
        // Carry animation for chickens
        this.carryAnimationTime = 0;
        this.carryBobOffset = [0, 0]; // Per-chicken bob offsets
        
        // Whimsical animation system
        this.animator = new WizardAnimator();
        this.facingDirection = 'right'; // 'left' or 'right'
        this.isMoving = false;
        this.lastVelocityX = 0;
        this.isStartled = false;
        this.startledTimer = 0;
        this.isDepositing = false;
        this.depositTimer = 0;
        this.isPickingUp = false;
        this.pickupTimer = 0;
    }

    update(deltaTime, input, chickens, particleSystem) {
        const move = input.getMovementVector();
        
        // Calculate speed based on carry load
        const items = this.carrySlots.filter(s => s !== null).length;
        const hasBasket = this.carrySlots.includes('basket');
        const speedPenalty = items * 20 + (hasBasket ? 10 : 0); // -20 per item, -10 for basket weight
        this.speed = this.baseSpeed - speedPenalty;
        
        this.vx = move.dx * this.speed;
        this.vy = move.dy * this.speed;
        
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Update facing direction
        if (move.dx !== 0 || move.dy !== 0) {
            this.facing = Math.atan2(move.dy, move.dx);
        }
        
        // Track facing direction for animation
        if (this.vx > 0.1) {
            this.facingDirection = 'right';
        } else if (this.vx < -0.1) {
            this.facingDirection = 'left';
        }
        
        // Track if moving
        this.isMoving = Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1;
        this.lastVelocityX = this.vx;
        
        // Update animation timers
        if (this.startledTimer > 0) {
            this.startledTimer -= deltaTime;
            if (this.startledTimer <= 0) {
                this.isStartled = false;
            }
        }
        if (this.depositTimer > 0) {
            this.depositTimer -= deltaTime;
            if (this.depositTimer <= 0) {
                this.isDepositing = false;
            }
        }
        if (this.pickupTimer > 0) {
            this.pickupTimer -= deltaTime;
            if (this.pickupTimer <= 0) {
                this.isPickingUp = false;
            }
        }
        
        // Update animator
        const animState = this.determineAnimationState();
        this.animator.update(deltaTime, animState);
        
        // Keep in bounds (within fences: x=40-760, y=80-500)
        this.x = Math.max(40 + this.radius, Math.min(760 - this.radius, this.x));
        this.y = Math.max(80 + this.radius, Math.min(500 - this.radius, this.y));
        
        // Update animation time
        this.time += deltaTime;
        
        // Update carry animation for chickens
        this.carryAnimationTime += deltaTime;
        this.carrySlots.forEach((slot, index) => {
            if (slot === 'chicken') {
                // Each chicken bobs with slightly different phase (180 degrees offset for 2nd)
                const phase = index * Math.PI;
                this.carryBobOffset[index] = Math.sin(this.carryAnimationTime * 8 + phase) * 3; // 3px amplitude, 8Hz
            }
        });
        
        // Spawn trail particles when moving
        if ((move.dx !== 0 || move.dy !== 0) && particleSystem) {
            this.trailTimer += deltaTime;
            if (this.trailTimer > 0.05) { // every 50ms
                this.trailTimer = 0;
                particleSystem.spawnWizardSparkle(this.x, this.y);
            }
        }
        
        // Calculate proximity glow (only when not carrying max)
        if (items < 2) {
            this.updateGlow(chickens);
        } else {
            this.glowIntensity = 0;
        }
    }
    
    // Get available slot count
    getAvailableSlots() {
        return this.carrySlots.filter(slot => slot === null).length;
    }
    
    // Check if can pick up item
    canPickUp(itemType) {
        return this.getAvailableSlots() >= 1;
    }
    
    // Check if carrying basket
    hasBasket() {
        return this.carrySlots.includes('basket');
    }
    
    // Get basket slot index (or -1 if not carrying)
    getBasketSlot() {
        return this.carrySlots.indexOf('basket');
    }
    
    // Get chicken count
    getChickenCount() {
        return this.carrySlots.filter(s => s === 'chicken').length;
    }
    
    // Get total carry count for UI
    getCarryCount() {
        return this.carrySlots.filter(s => s !== null).length;
    }
    
    // Try to pick up a chicken
    tryPickup(chicken) {
        if (this.canPickUp('chicken')) {
            const slotIndex = this.carrySlots.indexOf(null);
            this.carrySlots[slotIndex] = 'chicken';
            this.carryData[slotIndex] = {
                color: chicken.color || '#fff'
            };
            return true;
        }
        return false;
    }
    
    // Pick up basket
    pickUpBasket() {
        if (this.canPickUp('basket')) {
            const slotIndex = this.carrySlots.indexOf(null);
            this.carrySlots[slotIndex] = 'basket';
            this.carryData[slotIndex] = {};
            this.eggsInBasket = 0;
            return true;
        }
        return false;
    }
    
    // Drop basket (frees slot, loses eggs)
    dropBasket() {
        const slotIndex = this.getBasketSlot();
        if (slotIndex !== -1) {
            this.carrySlots[slotIndex] = null;
            this.carryData[slotIndex] = {};
            const lostEggs = this.eggsInBasket;
            this.eggsInBasket = 0;
            return lostEggs;
        }
        return 0;
    }
    
    // Collect egg into basket
    collectEgg() {
        if (this.hasBasket() && this.eggsInBasket < this.maxEggs) {
            this.eggsInBasket++;
            return true;
        }
        return false;
    }
    
    // Deposit chickens at coop (returns count)
    depositChickens() {
        let deposited = 0;
        for (let i = 0; i < this.carrySlots.length; i++) {
            if (this.carrySlots[i] === 'chicken') {
                this.carrySlots[i] = null;
                this.carryData[i] = {};
                deposited++;
            }
        }
        return deposited;
    }
    
    // Deposit eggs at house (returns count)
    depositEggs() {
        const eggs = this.eggsInBasket;
        this.eggsInBasket = 0;
        return eggs;
    }

    // Deposit all carried chickens (returns count) - used for raccoon steal
    deposit() {
        return this.depositChickens();
    }

    // ==================== UNIFIED TOOL SYSTEM ====================

    // Pick up a tool (egg basket, hammer, or food basket)
    pickUpTool(tool) {
        const slotIndex = this.getAvailableSlot();
        if (slotIndex === -1) return false;

        // Check if already carrying this tool type
        if (this.hasTool(tool.type)) return false;

        // Assign tool to slot
        this.carrySlots[slotIndex] = 'tool';
        this.carryData[slotIndex] = { toolType: tool.type, toolRef: tool };
        tool.pickup();

        // Transfer tool uses to hero's tracking
        switch(tool.type) {
            case 'eggBasket':
                this.eggsInBasket = tool.usesRemaining;
                break;
            case 'foodBasket':
                this.foodCount = tool.usesRemaining;
                break;
        }

        return true;
    }

    // Check if hero has a specific tool
    hasTool(toolType) {
        for (let i = 0; i < this.carrySlots.length; i++) {
            if (this.carrySlots[i] === 'tool' && this.carryData[i].toolType === toolType) {
                return true;
            }
        }
        return false;
    }

    // Get tool reference by type
    getTool(toolType) {
        for (let i = 0; i < this.carrySlots.length; i++) {
            if (this.carrySlots[i] === 'tool' && this.carryData[i].toolType === toolType) {
                return this.carryData[i].toolRef;
            }
        }
        return null;
    }

    // Use a tool (decrement uses)
    useTool(toolType) {
        const tool = this.getTool(toolType);
        if (!tool) return false;

        const success = tool.use();
        if (success) {
            // Update hero's tracking
            switch(toolType) {
                case 'eggBasket':
                    this.eggsInBasket = tool.usesRemaining;
                    break;
                case 'foodBasket':
                    this.foodCount = tool.usesRemaining;
                    break;
            }

            // If tool is empty, drop it
            if (tool.isEmpty()) {
                this.dropTool(toolType);
            }
        }
        return success;
    }

    // Drop a specific tool
    dropTool(toolType) {
        for (let i = 0; i < this.carrySlots.length; i++) {
            if (this.carrySlots[i] === 'tool' && this.carryData[i].toolType === toolType) {
                const tool = this.carryData[i].toolRef;
                tool.drop();
                this.carrySlots[i] = null;
                this.carryData[i] = {};

                // Clear tracking
                if (toolType === 'eggBasket') this.eggsInBasket = 0;
                if (toolType === 'foodBasket') this.foodCount = 0;

                return tool;
            }
        }
        return null;
    }

    // Get tool count for UI
    getToolCount() {
        return this.carrySlots.filter(slot => slot === 'tool').length;
    }

    // Update tool uses from tool reference (called when tool is used externally)
    syncToolUses(toolType) {
        const tool = this.getTool(toolType);
        if (tool) {
            switch(toolType) {
                case 'eggBasket':
                    this.eggsInBasket = tool.usesRemaining;
                    break;
                case 'foodBasket':
                    this.foodCount = tool.usesRemaining;
                    break;
            }
        }
    }

    updateGlow(chickens) {
        if (!chickens || chickens.length === 0) {
            this.glowIntensity = 0;
            return;
        }
        
        // Find nearest chicken
        let nearestDist = Infinity;
        for (const chicken of chickens) {
            const dx = this.x - chicken.x;
            const dy = this.y - chicken.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
            }
        }
        
        // Glow increases as chickens get closer (within 150 pixels)
        const glowRange = 150;
        if (nearestDist < glowRange) {
            this.glowIntensity = 1 - (nearestDist / glowRange);
        } else {
            this.glowIntensity = 0;
        }
    }

    determineAnimationState() {
        // Priority order for animation states
        if (this.isStartled) return 'startled';
        if (this.isFeeding) return 'pickup';
        if (this.isDepositing) return 'deposit';
        if (this.isPickingUp) return 'pickup';
        if (this.getChickenCount() > 0) return 'carry';
        if (this.isMoving) return 'walk';
        return 'idle';
    }
    
    triggerStartled() {
        this.isStartled = true;
        this.startledTimer = 0.2; // 200ms
    }
    
    triggerDeposit() {
        this.isDepositing = true;
        this.depositTimer = 0.75; // 750ms
    }
    
    triggerPickup() {
        this.isPickingUp = true;
        this.pickupTimer = 0.9; // 900ms
    }
    
    draw(ctx) {
        // Get current pose from animator
        const pose = this.animator.getCurrentPose();
        
        ctx.save();
        
        // Apply facing direction (flip horizontally if facing left)
        if (this.facingDirection === 'left') {
            ctx.translate(this.x * 2, 0);
            ctx.scale(-1, 1);
        }
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw wizard with pose
        this.drawWizardWithPose(ctx, this.x, this.y, pose);
        
        ctx.restore();
        
        // Draw carried items on top (not affected by facing flip)
        if (this.getChickenCount() > 0) {
            this.drawCarriedChickensEnhanced(ctx);
        }
        
        // Draw other carried items (basket, hammer, food)
        this.carrySlots.forEach((slot, index) => {
            if (slot === 'basket') {
                this.drawCarriedBasket(ctx, index);
            } else if (slot === 'hammer') {
                this.drawCarriedHammer(ctx, index);
            } else if (slot === 'food') {
                this.drawCarriedFoodBasket(ctx, index);
            }
        });
        
        // Draw feeding animation
        if (this.isFeeding) {
            this.drawFeedingAnimation(ctx);
        }
    }
    
    drawWizardWithPose(ctx, x, y, pose) {
        const centerX = x;
        const centerY = y - 20; // Body center
        
        // Apply body transformations
        ctx.save();
        ctx.translate(centerX, centerY + pose.bodyY);
        ctx.rotate(pose.bodyRotation);
        ctx.scale(1, pose.bodyScaleY);
        
        // Draw legs
        this.drawLegWithPose(ctx, pose.legL, 'left');
        this.drawLegWithPose(ctx, pose.legR, 'right');
        
        // Draw robe (body)
        this.drawRobeWithPose(ctx, pose.robeFlare);
        
        // Draw beard (with sway)
        this.drawBeardWithPose(ctx, pose.beardSway);
        
        // Draw head
        this.drawHeadWithPose(ctx);
        
        // Draw hat (with rotation and bounce)
        ctx.save();
        ctx.translate(0, pose.hatY - 25);
        ctx.rotate(pose.hatRotation);
        this.drawHatWithPose(ctx);
        ctx.restore();
        
        // Draw arms
        this.drawArmWithPose(ctx, pose.armL, 'left');
        this.drawArmWithPose(ctx, pose.armR, 'right');
        
        // Draw staff
        this.drawStaffWithPose(ctx, pose.staffAngle);
        
        // Proximity glow (magic hands) - only when can carry more
        if (this.glowIntensity > 0 && this.getAvailableSlots() > 0) {
            const glowRadius = 30 + Math.sin(this.time * 8) * 5;
            const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, glowRadius);
            gradient.addColorStop(0, `rgba(0, 255, 255, ${0.4 * this.glowIntensity})`);
            gradient.addColorStop(1, `rgba(0, 255, 255, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawRobeWithPose(ctx, flare) {
        // Robe body (indigo with gold trim)
        ctx.fillStyle = '#4b0082';
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.lineTo(20 + flare, 30);
        ctx.lineTo(-20 - flare, 30);
        ctx.closePath();
        ctx.fill();
        
        // Gold trim
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Belt
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-12, 10, 24, 4);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-3, 9, 6, 6);
    }
    
    drawLegWithPose(ctx, leg, side) {
        ctx.save();
        ctx.translate(leg.x, leg.y + 30);
        ctx.rotate(leg.angle);
        
        // Boot
        ctx.fillStyle = '#2d1b4e';
        ctx.fillRect(-4, 0, 8, 15);
        
        ctx.restore();
    }
    
    drawArmWithPose(ctx, arm, side) {
        ctx.save();
        ctx.translate(arm.x, arm.y);
        ctx.rotate(arm.angle);
        
        // Sleeve
        ctx.fillStyle = '#4b0082';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.lineTo(4, 20);
        ctx.lineTo(-4, 20);
        ctx.closePath();
        ctx.fill();
        
        // Hand
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, 22, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawHeadWithPose(ctx) {
        // Face
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, -15, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(-4, -18, 3, 3);
        ctx.fillRect(1, -18, 3, 3);
    }
    
    drawBeardWithPose(ctx, sway) {
        ctx.save();
        ctx.translate(0, -10);
        ctx.rotate(sway);
        
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.quadraticCurveTo(0, 15, 6, 0);
        ctx.quadraticCurveTo(0, 10, -6, 0);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawHatWithPose(ctx) {
        // Hat base
        ctx.fillStyle = '#2d1b4e';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat cone
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.quadraticCurveTo(-5, -25, 0, -35);
        ctx.quadraticCurveTo(5, -25, 12, 0);
        ctx.closePath();
        ctx.fill();
        
        // Hat band
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-12, -2, 24, 4);
        
        // Star
        ctx.fillStyle = '#ffd700';
        this.drawStar(ctx, 0, -25, 6, 5, 2);
    }
    
    drawStaffWithPose(ctx, angle) {
        ctx.save();
        ctx.translate(12, -5);
        ctx.rotate(angle);
        
        // Staff shaft
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -35);
        ctx.stroke();
        
        // Crystal
        const pulse = 0.7 + Math.sin(this.time * 4) * 0.3;
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, -38, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, -38, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Draw carried chickens ON TOP of wizard (1.5x scale, in hands)
    drawCarriedChickensEnhanced(ctx) {
        const visualScale = 1.5; // 1.5x larger visual size
        const chickenCount = this.getChickenCount();
        
        if (chickenCount === 0) return;
        
        if (chickenCount === 1) {
            // Single chicken - held in right hand
            this.drawSingleCarriedChickenEnhanced(ctx, visualScale);
        } else if (chickenCount === 2) {
            // Two chickens - one in each hand
            this.drawDualCarriedChickensEnhanced(ctx, visualScale);
        }
    }
    
    drawSingleCarriedChickenEnhanced(ctx, scale) {
        // Find which slot has the chicken
        const slotIndex = this.carrySlots.indexOf('chicken');
        if (slotIndex === -1) return;
        
        const bobY = this.carryBobOffset[slotIndex] || 0;
        const color = this.carryData[slotIndex].color || '#fff';
        
        // Position in right hand area
        const offsetX = 18; // Right hand position
        const offsetY = -5 + bobY;
        
        ctx.save();
        ctx.translate(this.x + offsetX, this.y + offsetY);
        ctx.scale(scale, scale);
        
        // Draw chicken sprite centered at origin
        this.drawChickenSprite(ctx, color);
        
        ctx.restore();
    }
    
    drawDualCarriedChickensEnhanced(ctx, scale) {
        // Find which slots have chickens
        const chickenIndices = [];
        this.carrySlots.forEach((slot, index) => {
            if (slot === 'chicken') chickenIndices.push(index);
        });
        
        if (chickenIndices.length < 2) return;
        
        // Left hand chicken
        const leftIndex = chickenIndices[0];
        const leftBobY = this.carryBobOffset[leftIndex] || 0;
        const leftColor = this.carryData[leftIndex].color || '#fff';
        
        ctx.save();
        ctx.translate(this.x - 20, this.y - 5 + leftBobY);
        ctx.scale(scale, scale);
        this.drawChickenSprite(ctx, leftColor);
        ctx.restore();
        
        // Right hand chicken
        const rightIndex = chickenIndices[1];
        const rightBobY = this.carryBobOffset[rightIndex] || 0;
        const rightColor = this.carryData[rightIndex].color || '#fff';
        
        ctx.save();
        ctx.translate(this.x + 20, this.y - 5 + rightBobY);
        ctx.scale(scale, scale);
        this.drawChickenSprite(ctx, rightColor);
        ctx.restore();
    }
    
    drawChickenSprite(ctx, color) {
        // Draw chicken centered at (0, 0) with scale applied (1.5x size)
        
        // Shadow (scaled with chicken)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (white, larger - 15x12 at 1.5x scale = ~45px visual)
        ctx.fillStyle = color || '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body outline
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Wing
        ctx.fillStyle = color === '#fff' ? '#f5f5f5' : color;
        ctx.beginPath();
        ctx.ellipse(-5, 2, 10, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Head
        ctx.fillStyle = color || '#ffffff';
        ctx.beginPath();
        ctx.arc(8, -8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e0e0e0';
        ctx.stroke();
        
        // Beak
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(16, -8);
        ctx.lineTo(24, -5);
        ctx.lineTo(16, -2);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(12, -10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(13, -11, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Comb (red on head)
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(6, -16, 4, 0, Math.PI, false);
        ctx.fill();
    }
    
    // Draw basket being carried
    drawCarriedBasket(ctx, index) {
        const offsetX = index === 0 ? -18 : 18;
        const offsetY = -25;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(0.6, 0.6);
        
        // Basket body (brown wicker)
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI, false);
        ctx.fill();
        
        // Basket weave texture
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = -8; i <= 8; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 8);
            ctx.stroke();
        }
        
        // Handle
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -5, 10, Math.PI, 0, false);
        ctx.stroke();
        
        // Egg count indicator on basket
        if (this.eggsInBasket > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.eggsInBasket.toString(), 0, 5);
        }
        
        ctx.restore();
    }
    
    drawStar(ctx, cx, cy, outerRadius, innerRadius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI / points) - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
    
    // Hammer methods
    hasHammer() {
        return this.carrySlots.includes('hammer');
    }
    
    pickUpHammer() {
        if (this.canPickUp('hammer')) {
            const slotIndex = this.carrySlots.indexOf(null);
            this.carrySlots[slotIndex] = 'hammer';
            this.carryData[slotIndex] = {};
            return true;
        }
        return false;
    }
    
    dropHammer() {
        const slotIndex = this.carrySlots.indexOf('hammer');
        if (slotIndex !== -1) {
            this.carrySlots[slotIndex] = null;
            this.carryData[slotIndex] = {};
            this.cancelRepair();
            return true;
        }
        return false;
    }
    
    // Repair methods
    startRepair(hole) {
        if (this.hasHammer() && !this.isRepairing && hole) {
            this.isRepairing = true;
            this.repairTimer = this.repairDuration;
            this.repairTarget = hole;
            hole.isBeingRepaired = true;
            return true;
        }
        return false;
    }
    
    updateRepair(deltaTime) {
        if (!this.isRepairing || !this.repairTarget) return null;
        
        // Check if still in range
        if (!this.repairTarget.canRepair(this)) {
            this.cancelRepair();
            return null;
        }
        
        // Update progress
        this.repairTimer -= deltaTime;
        this.repairTarget.repairProgress = ((this.repairDuration - this.repairTimer) / this.repairDuration) * 100;
        
        if (this.repairTimer <= 0) {
            // Repair complete
            const hole = this.repairTarget;
            this.cancelRepair();
            return hole;
        }
        
        return null; // Still repairing
    }
    
    cancelRepair() {
        if (this.repairTarget) {
            this.repairTarget.isBeingRepaired = false;
            this.repairTarget.repairProgress = 0;
        }
        this.isRepairing = false;
        this.repairTimer = 0;
        this.repairTarget = null;
    }
    
    // Draw hammer being carried
    drawCarriedHammer(ctx, index) {
        const offsetX = index === 0 ? -20 : 20;
        const offsetY = -15;
        
        // Add swing animation when repairing
        let swingAngle = 0;
        if (this.isRepairing) {
            const swingProgress = (this.repairDuration - this.repairTimer) / this.repairDuration;
            swingAngle = Math.sin(swingProgress * Math.PI * 6) * 0.5; // 3 swings per second
        }
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.rotate(swingAngle);
        ctx.scale(0.6, 0.6);
        
        // Handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-2, -10, 4, 25);
        
        // Hammer head
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(-10, -15, 20, 10);
        
        // Claw
        ctx.beginPath();
        ctx.arc(10, -10, 4, 0, Math.PI, false);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Food basket methods
    hasFoodBasket() {
        return this.carrySlots.includes('food');
    }
    
    pickUpFoodBasket() {
        if (this.canPickUp('food')) {
            const slotIndex = this.carrySlots.indexOf(null);
            this.carrySlots[slotIndex] = 'food';
            this.carryData[slotIndex] = {};
            this.foodCount = this.maxFood;
            return true;
        }
        return false;
    }
    
    dropFoodBasket() {
        const slotIndex = this.carrySlots.indexOf('food');
        if (slotIndex !== -1) {
            this.carrySlots[slotIndex] = null;
            this.carryData[slotIndex] = {};
            this.foodCount = 0;
            this.isFeeding = false;
            this.feedingTimer = 0;
            return true;
        }
        return false;
    }
    
    canFeed() {
        return this.hasFoodBasket() && this.foodCount > 0 && !this.isFeeding;
    }
    
    feedChicken(chicken) {
        if (this.canFeed() && chicken.canBeFed(this)) {
            this.isFeeding = true;
            this.feedingTimer = 1.0; // 1 second feeding animation
            this.foodCount--;
            
            chicken.feed();
            
            return true;
        }
        return false;
    }
    
    updateFeeding(deltaTime) {
        if (this.isFeeding) {
            this.feedingTimer -= deltaTime;
            if (this.feedingTimer <= 0) {
                this.isFeeding = false;
                this.feedingTimer = 0;
            }
        }
    }
    
    // Draw food basket being carried
    drawCarriedFoodBasket(ctx, index) {
        const offsetX = index === 0 ? -18 : 18;
        const offsetY = -25;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(0.6, 0.6);
        
        // Basket body (orange-brown)
        ctx.fillStyle = '#d2691e';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI, false);
        ctx.fill();
        
        // Weave texture
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1;
        for (let i = -8; i <= 8; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 8);
            ctx.stroke();
        }
        
        // Feed/grain inside
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-3, -3, 2, 0, Math.PI * 2);
        ctx.arc(2, -5, 1.5, 0, Math.PI * 2);
        ctx.arc(4, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Handle
        ctx.strokeStyle = '#d2691e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -5, 10, Math.PI, 0, false);
        ctx.stroke();
        
        // Food count indicator on basket
        if (this.foodCount > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.foodCount.toString(), 0, 5);
        }
        
        ctx.restore();
    }
    
    // Draw feeding animation
    drawFeedingAnimation(ctx) {
        const progress = 1 - (this.feedingTimer / 1.0);
        
        // Feed particles scattering
        for (let i = 0; i < 5; i++) {
            const angle = i * 1.2 + progress * 3;
            const px = this.x + Math.cos(angle) * 20 * progress;
            const py = this.y + Math.sin(angle) * 5 - progress * 10;
            
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
