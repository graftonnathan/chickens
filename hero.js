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
        
        // Keep in bounds (within fences: x=40-760, y=80-500)
        this.x = Math.max(40 + this.radius, Math.min(760 - this.radius, this.x));
        this.y = Math.max(80 + this.radius, Math.min(500 - this.radius, this.y));
        
        // Update animation time
        this.time += deltaTime;
        
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

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Bob animation
        const bob = Math.sin(this.time * 3) * 2;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
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
        
        // Draw carried items FIRST (behind wizard)
        this.carrySlots.forEach((slot, index) => {
            if (slot === 'chicken') {
                this.drawCarriedChicken(ctx, index, this.carryData[index].color);
            } else if (slot === 'basket') {
                this.drawCarriedBasket(ctx, index);
            } else if (slot === 'hammer') {
                this.drawCarriedHammer(ctx, index);
            }
        });
        
        // Staff (drawn behind body)
        const staffBob = Math.sin(this.time * 2 + 1) * 3;
        ctx.save();
        ctx.translate(12, -10 + staffBob);
        ctx.rotate(0.1);
        
        // Staff wood
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(0, -35);
        ctx.stroke();
        
        // Staff crystal
        const pulse = 0.7 + Math.sin(this.time * 4) * 0.3;
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-6, -45);
        ctx.lineTo(0, -55);
        ctx.lineTo(6, -45);
        ctx.closePath();
        ctx.fill();
        
        // Crystal glow
        ctx.fillStyle = `rgba(0, 255, 255, ${0.3 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, -45, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Robe body (indigo with gold trim)
        ctx.fillStyle = '#4b0082'; // Indigo
        ctx.beginPath();
        ctx.moveTo(-15, 15);
        ctx.lineTo(-12, -15);
        ctx.lineTo(12, -15);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();
        
        // Gold trim on robe
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 15);
        ctx.lineTo(-12, -15);
        ctx.lineTo(12, -15);
        ctx.lineTo(15, 15);
        ctx.stroke();
        
        // Belt
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-12, -5, 24, 4);
        ctx.fillStyle = '#ffd700'; // Gold buckle
        ctx.fillRect(-3, -6, 6, 6);
        
        // Beard (flowing white)
        const beardSway = Math.sin(this.time * 2) * 2;
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.moveTo(-8, -12);
        ctx.quadraticCurveTo(-10 + beardSway, 0, -6, 10);
        ctx.lineTo(6, 10);
        ctx.quadraticCurveTo(10 + beardSway, 0, 8, -12);
        ctx.closePath();
        ctx.fill();
        
        // Face
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, -18, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -20, 2, 0, Math.PI * 2);
        ctx.arc(3, -20, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat (pointed with star)
        const hatBounce = Math.sin(this.time * 4) * 1.5;
        ctx.save();
        ctx.translate(0, -25 + bob + hatBounce);
        
        // Hat cone
        ctx.fillStyle = '#4b0082'; // Indigo
        ctx.beginPath();
        ctx.moveTo(-18, 5);
        ctx.lineTo(0, -40);
        ctx.lineTo(18, 5);
        ctx.closePath();
        ctx.fill();
        
        // Gold trim on hat
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Hat band
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-12, -5, 24, 4);
        
        // Star on hat
        ctx.fillStyle = '#ffd700';
        this.drawStar(ctx, 0, -25, 6, 5, 2);
        
        ctx.restore();
        
        // Hands (glowing when near chickens and can carry)
        if (this.glowIntensity > 0 && this.getAvailableSlots() > 0) {
            ctx.fillStyle = `rgba(0, 255, 255, ${0.6 + this.glowIntensity * 0.4})`;
        } else {
            ctx.fillStyle = '#ffdbac';
        }
        ctx.beginPath();
        ctx.arc(-10, 0, 4, 0, Math.PI * 2);
        ctx.arc(10, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Draw a chicken being carried
    drawCarriedChicken(ctx, index, color) {
        const offsetX = index === 0 ? -18 : 18;
        const offsetY = -30;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(0.5, 0.5);
        
        // Body
        ctx.fillStyle = color || '#fff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.beginPath();
        ctx.arc(8, -8, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(14, -8);
        ctx.lineTo(18, -6);
        ctx.lineTo(14, -4);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(10, -10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Comb
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(8, -14, 3, Math.PI, 0);
        ctx.fill();
        
        ctx.restore();
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
}
