/**
 * Coop class - Garden Shed at NORTH of backyard
 */
class Coop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 70;
        this.height = 55;
    }

    draw(ctx) {
        ctx.save();
        
        // Garden shed body (light green/gray)
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Shed roof (dark gray shingles)
        ctx.fillStyle = '#546E7A';
        ctx.beginPath();
        ctx.moveTo(this.x - this.width/2 - 5, this.y - this.height/2);
        ctx.lineTo(this.x, this.y - this.height/2 - 25);
        ctx.lineTo(this.x + this.width/2 + 5, this.y - this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Roof overhang detail
        ctx.strokeStyle = '#455A64';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shed door (wooden) - facing SOUTH (toward house)
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(this.x - 12, this.y + 5, 24, 25);
        
        // Door frame
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 12, this.y + 5, 24, 25);
        
        // Door handle
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + 20, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Window on side
        ctx.fillStyle = '#B3E5FC';
        ctx.fillRect(this.x + 18, this.y - 10, 12, 12);
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 18, this.y - 10, 12, 12);
        
        // Window cross
        ctx.beginPath();
        ctx.moveTo(this.x + 24, this.y - 10);
        ctx.lineTo(this.x + 24, this.y + 2);
        ctx.moveTo(this.x + 18, this.y - 4);
        ctx.lineTo(this.x + 30, this.y - 4);
        ctx.stroke();
        
        // Flower bed in front of shed
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(this.x - 35, this.y + 28, 70, 8);
        
        // Flowers
        const flowerColors = ['#E91E63', '#9C27B0', '#FF5722', '#FFC107'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.beginPath();
            ctx.arc(this.x - 28 + i * 14, this.y + 26, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Green stem
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 28 + i * 14, this.y + 28);
            ctx.lineTo(this.x - 28 + i * 14, this.y + 32);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    getSpawnPosition() {
        // Random position near the shed door (facing south)
        const offset = 15;
        return {
            x: this.x + (Math.random() - 0.5) * offset,
            y: this.y + 35 + (Math.random() - 0.5) * offset
        };
    }
    
    // Check if position is in deposit zone (inside fence)
    isInDepositZone(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 80; // Within 80 pixels of coop
    }
}
