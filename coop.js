/"""
 * Coop class - Now a Garden Shed in the backyard
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
        
        // Shed door (wooden)
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(this.x - 12, this.y - 5, 24, 30);
        
        // Door frame
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 12, this.y - 5, 24, 30);
        
        // Door handle
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Window on side
        ctx.fillStyle = '#B3E5FC';
        ctx.fillRect(this.x + 18, this.y - 15, 12, 12);
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 18, this.y - 15, 12, 12);
        // Window cross
        ctx.beginPath();
        ctx.moveTo(this.x + 24, this.y - 15);
        ctx.lineTo(this.x + 24, this.y - 3);
        ctx.moveTo(this.x + 18, this.y - 9);
        ctx.lineTo(this.x + 30, this.y - 9);
        ctx.stroke();
        
        // Garden tools leaning against shed
        // Shovel
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 25, this.y + 20);
        ctx.lineTo(this.x - 30, this.y - 10);
        ctx.stroke();
        // Shovel head
        ctx.fillStyle = '#B0BEC5';
        ctx.beginPath();
        ctx.ellipse(this.x - 30, this.y - 12, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Flower bed in front of shed
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(this.x - 35, this.y + 25, 70, 8);
        
        // Flowers
        const flowerColors = ['#E91E63', '#9C27B0', '#FF5722', '#FFC107'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.beginPath();
            ctx.arc(this.x - 28 + i * 14, this.y + 22, 4, 0, Math.PI * 2);
            ctx.fill();
            // Green stem
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 28 + i * 14, this.y + 25);
            ctx.lineTo(this.x - 28 + i * 14, this.y + 29);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    getSpawnPosition() {
        // Random position near the shed door
        const offset = 20;
        return {
            x: this.x + (Math.random() - 0.5) * offset,
            y: this.y + 15 + (Math.random() - 0.5) * offset
        };
    }
}
