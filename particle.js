/**
 * Particle System for visual effects
 */
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'catch' or 'escape'
        this.life = 1.0;
        this.decay = 0.02;
        
        if (type === 'catch') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.color = '#ffd700';
            this.size = Math.random() * 4 + 2;
        } else {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = -Math.random() * 3 - 1;
            this.color = '#888';
            this.size = Math.random() * 3 + 1;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'escape') {
            this.vy += 0.1; // gravity
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawn(x, y, type, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return p.life > 0;
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}
