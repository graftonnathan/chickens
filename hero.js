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
        
        // Tool system (ONE tool at a time)
        this.currentTool = null;
        
        // Repair state for hammer
        this.isRepairing = false;
        this.repairTimer = 0;
        this.repairDuration = 2.0;
        this.repairTarget = null;
        
        // Animation system
        this.animator = new WizardAnimator();
    }
    
    update(deltaTime, input, chickens, particleSystem) {
        this.time += deltaTime;
        
        // Movement
        const move = input.getMovementVector();
        this.speed = this.baseSpeed;
        
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
        
        // Timers
        if (this.startledTimer > 0) {
            this.startledTimer -= deltaTime;
            if (this.startledTimer <= 0) this.isStartled = false;
        }
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
        if (this.isRepairing) return 'cast';
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
