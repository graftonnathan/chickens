/**
 * Chicken class - The fugitives!
 */
class Chicken {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        
        // Random direction outward from center
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
        
        // Random speed
        this.speed = 80 + Math.random() * 70; // 80-150 pixels/sec
        
        // Animation
        this.waddleOffset = Math.random() * Math.PI * 2;
        this.waddleSpeed = 10 + Math.random() * 5;
    }

    update(deltaTime) {
        this.x += this.vx * this.speed * deltaTime;
        this.y += this.vy * this.speed * deltaTime;
        this.waddleOffset += this.waddleSpeed * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Waddle effect
        const waddle = Math.sin(this.waddleOffset) * 0.1;
        ctx.rotate(waddle);
        
        // Body
        ctx.fillStyle = '#fff';
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
        ctx.arc(10, -10, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Comb (red thing on head)
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(8, -14, 4, Math.PI, 0);
        ctx.fill();
        
        // Wings
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.ellipse(-3, 2, 6, 4, Math.sin(this.waddleOffset) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, 8);
        ctx.lineTo(-4, 14);
        ctx.moveTo(4, 8);
        ctx.lineTo(4, 14);
        ctx.stroke();
        
        ctx.restore();
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}
