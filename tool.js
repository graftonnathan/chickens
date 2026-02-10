/**
 * tool.js - Unified tool system for egg basket, hammer, and food basket
 */

class Tool {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'eggBasket', 'hammer', 'foodBasket'
        this.pickedUp = false;
        this.radius = 20;
        this.glowPhase = 0;
        
        // Tool-specific properties
        this.maxUses = this.getMaxUses();
        this.usesRemaining = this.maxUses;
        
        // Egg basket specific: holds collected eggs
        this.eggs = 0;
        this.maxEggs = this.getMaxEggs();
    }
    
    getMaxUses() {
        switch(this.type) {
            case 'eggBasket': return 10;  // 10 egg capacity (not uses, but capacity)
            case 'hammer': return 3;      // 3 repairs
            case 'foodBasket': return 5;  // 5 feedings
            default: return 1;
        }
    }
    
    getMaxEggs() {
        return this.type === 'eggBasket' ? 10 : 0;
    }
    
    update(deltaTime) {
        if (!this.pickedUp) {
            this.glowPhase += deltaTime * 2;
        }
    }
    
    draw(ctx) {
        if (this.pickedUp) return;
        
        ctx.save();
        
        // Glow hint (pulsing)
        const glowOpacity = 0.3 + Math.sin(this.glowPhase) * 0.2;
        ctx.strokeStyle = `rgba(255,215,0,${glowOpacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 5, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tool-specific visuals
        switch(this.type) {
            case 'eggBasket':
                this.drawEggBasket(ctx);
                break;
            case 'hammer':
                this.drawHammer(ctx);
                break;
            case 'foodBasket':
                this.drawFoodBasket(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    drawEggBasket(ctx) {
        // Brown woven basket
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI, false);
        ctx.fill();
        
        // Weave pattern
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = -10; i <= 10; i += 4) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + 10);
            ctx.stroke();
        }
        
        // Handle
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 12, Math.PI, 0, false);
        ctx.stroke();
        
        // Egg indicator
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawHammer(ctx) {
        // Metal head
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(this.x - 12, this.y - 8, 24, 10);
        
        // Claw
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y - 3, 5, 0, Math.PI, false);
        ctx.fill();
        
        // Handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x - 2, this.y, 4, 20);
        
        // Handle end cap
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(this.x, this.y + 20, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawFoodBasket(ctx) {
        // Orange/brown basket
        ctx.fillStyle = '#d2691e';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI, false);
        ctx.fill();
        
        // Weave pattern
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1;
        for (let i = -10; i <= 10; i += 4) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + 10);
            ctx.stroke();
        }
        
        // Handle
        ctx.strokeStyle = '#d2691e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 12, Math.PI, 0, false);
        ctx.stroke();
        
        // Feed visible
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 2, this.y - 4, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 1, this.y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    checkPickup(hero) {
        if (this.pickedUp) return false;
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.radius + hero.radius;
    }
    
    pickup() {
        this.pickedUp = true;
    }
    
    drop() {
        this.pickedUp = false;
    }
    
    use() {
        if (this.usesRemaining > 0) {
            this.usesRemaining--;
            return true;
        }
        return false;
    }
    
    isEmpty() {
        return this.usesRemaining <= 0;
    }
    
    reset() {
        this.usesRemaining = this.maxUses;
        this.eggs = 0;
        this.pickedUp = false;
        this.glowPhase = 0;
    }
    
    // Egg basket specific methods
    canCollect() {
        return this.type === 'eggBasket' && this.eggs < this.maxEggs;
    }
    
    collectEgg() {
        if (this.canCollect()) {
            this.eggs++;
            return true;
        }
        return false;
    }
    
    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}

/**
 * ToolManager - Manages all tools at house
 */
class ToolManager {
    constructor() {
        // Tools spawn at house (south wall) - spread horizontally
        this.tools = [
            new Tool(200, 560, 'eggBasket'),
            new Tool(400, 560, 'hammer'),
            new Tool(600, 560, 'foodBasket')
        ];
    }
    
    update(deltaTime) {
        this.tools.forEach(tool => tool.update(deltaTime));
        
        // Check for empty tools to respawn
        this.tools.forEach(tool => {
            if (tool.pickedUp && tool.isEmpty()) {
                // Reset after being empty
                tool.reset();
            }
        });
    }
    
    checkPickups(hero) {
        const pickedUp = [];
        
        this.tools.forEach(tool => {
            if (tool.checkPickup(hero) && !tool.pickedUp) {
                pickedUp.push(tool);
            }
        });
        
        return pickedUp;
    }
    
    getToolByType(type) {
        return this.tools.find(t => t.type === type);
    }
    
    draw(ctx) {
        this.tools.forEach(tool => tool.draw(ctx));
    }
    
    reset() {
        this.tools.forEach(tool => tool.reset());
    }
}
