/**
 * Hero class - The player character
 */
class Hero {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 250; // pixels per second
        this.vx = 0;
        this.vy = 0;
        this.facing = 0; // angle in radians
    }

    update(deltaTime, input) {
        const move = input.getMovementVector();
        
        this.vx = move.dx * this.speed;
        this.vy = move.dy * this.speed;
        
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Update facing direction
        if (move.dx !== 0 || move.dy !== 0) {
            this.facing = Math.atan2(move.dy, move.dx);
        }
        
        // Keep in bounds
        this.x = Math.max(this.radius, Math.min(800 - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(600 - this.radius, this.y));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 15, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Direction indicator
        ctx.rotate(this.facing);
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.arc(10, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Face
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(6, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(7, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}
