/**
 * Coop class - Garden Shed on ground at y=80
 */
class Coop {
    constructor(x, y) {
        this.x = x || 400;
        this.y = y || 80; // Ground level (below north fence)
        this.width = 70;
        this.height = 55;
    }

    draw(ctx) {
        ctx.save();
        
        // Ground shadow (drawn first, beneath coop)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(
            this.x, 
            this.y + this.height, 
            this.width / 2 + 10, 
            8, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Garden shed body (light green/gray)
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        
        // Shed roof (dark gray shingles)
        ctx.fillStyle = '#546E7A';
        ctx.beginPath();
        ctx.moveTo(this.x - this.width/2 - 5, this.y);
        ctx.lineTo(this.x, this.y - 25);
        ctx.lineTo(this.x + this.width/2 + 5, this.y);
        ctx.closePath();
        ctx.fill();
        
        // Roof overhang detail
        ctx.strokeStyle = '#455A64';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shed door (wooden) - facing SOUTH (toward house)
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(this.x - 12, this.y + 15, 24, 40);
        
        // Door frame
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 12, this.y + 15, 24, 40);
        
        // Door handle
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + 35, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Window on side
        ctx.fillStyle = '#B3E5FC';
        ctx.fillRect(this.x + 18, this.y + 5, 12, 12);
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 18, this.y + 5, 12, 12);
        
        // Window cross
        ctx.beginPath();
        ctx.moveTo(this.x + 24, this.y + 5);
        ctx.lineTo(this.x + 24, this.y + 17);
        ctx.moveTo(this.x + 18, this.y + 11);
        ctx.lineTo(this.x + 30, this.y + 11);
        ctx.stroke();
        
        // Flower bed in front of shed
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(this.x - 35, this.y + this.height + 5, 70, 8);
        
        // Flowers
        const flowerColors = ['#E91E63', '#9C27B0', '#FF5722', '#FFC107'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.beginPath();
            ctx.arc(this.x - 28 + i * 14, this.y + this.height + 3, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Green stem
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 28 + i * 14, this.y + this.height + 5);
            ctx.lineTo(this.x - 28 + i * 14, this.y + this.height + 13);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    getSpawnPosition() {
        // Random position near the shed door (facing south)
        const offset = 15;
        return {
            x: this.x + (Math.random() - 0.5) * offset,
            y: this.y + this.height + 20 + (Math.random() - 0.5) * offset
        };
    }
    
    // Check if position is in deposit zone (in front of coop)
    isInDepositZone(x, y) {
        const dx = x - this.x;
        const dy = y - (this.y + this.height);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 80; // Within 80 pixels of coop front
    }
}
