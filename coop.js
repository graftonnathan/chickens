/**
 * Coop class - Central spawn point
 */
class Coop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 60;
    }

    draw(ctx) {
        ctx.save();
        
        // Main barn body
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Roof
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.moveTo(this.x - this.width/2 - 10, this.y - this.height/2);
        ctx.lineTo(this.x, this.y - this.height/2 - 30);
        ctx.lineTo(this.x + this.width/2 + 10, this.y - this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Door
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.x - 15, this.y - 10, 30, 30);
        
        // Door frame
        ctx.strokeStyle = '#5c2e0b';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - 15, this.y - 10, 30, 30);
        
        // X pattern on door
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 7);
        ctx.lineTo(this.x + 12, this.y + 17);
        ctx.moveTo(this.x + 12, this.y - 7);
        ctx.lineTo(this.x - 12, this.y + 17);
        ctx.stroke();
        
        // Hay decoration
        ctx.fillStyle = '#f1c40f';
        for (let i = 0; i < 5; i++) {
            const hx = this.x + 25 + i * 8;
            const hy = this.y + 15 + Math.sin(i) * 5;
            ctx.beginPath();
            ctx.arc(hx, hy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    getSpawnPosition() {
        // Random position near the door
        const offset = 20;
        return {
            x: this.x + (Math.random() - 0.5) * offset,
            y: this.y + (Math.random() - 0.5) * offset
        };
    }
}
