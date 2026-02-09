/**
 * Particle System for visual effects
 */
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        this.decay = 0.02;
        
        if (type === 'catch') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.color = '#ffd700';
            this.size = Math.random() * 4 + 2;
        } else if (type === 'escape') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = -Math.random() * 3 - 1;
            this.color = '#888';
            this.size = Math.random() * 3 + 1;
        } else if (type === 'sparkle') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.color = '#00ffff';
            this.size = Math.random() * 3 + 1;
            this.decay = 0.03;
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

/**
 * Wizard Sparkle - Trail particles for the wizard
 */
class WizardSparkle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y + (Math.random() - 0.5) * 20;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1 - 0.5; // drift up
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = Math.random() * 3 + 1;
        this.hue = Math.random() * 60 + 180; // Cyan to blue range
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy *= 0.98; // slow down vertical drift
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life * 0.8;
        ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

/**
 * Magic Burst - Explosion when catching a chicken
 */
class MagicBurst {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = 0.025;
        this.size = Math.random() * 4 + 2;
        this.hue = Math.random() * 60 + 160; // Teal to cyan
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; // friction
        this.vy *= 0.95;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life;
        ctx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
        
        // Draw diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.7, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Magic Rune - Floating magical symbols on catch
 */
class MagicRune {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 40;
        this.y = y + (Math.random() - 0.5) * 40;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -1 - Math.random() * 0.5; // float up
        this.life = 1.0;
        this.decay = 0.015;
        this.size = 12 + Math.random() * 8;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.runeType = Math.floor(Math.random() * 4); // Different rune symbols
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life * 0.8;
        ctx.strokeStyle = '#ffd700'; // Gold
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffd700';

        const s = this.size;
        ctx.beginPath();
        
        switch(this.runeType) {
            case 0: // Circle with cross
                ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
                ctx.moveTo(0, -s * 0.5);
                ctx.lineTo(0, s * 0.5);
                ctx.moveTo(-s * 0.5, 0);
                ctx.lineTo(s * 0.5, 0);
                break;
            case 1: // Triangle
                ctx.moveTo(0, -s * 0.6);
                ctx.lineTo(s * 0.5, s * 0.4);
                ctx.lineTo(-s * 0.5, s * 0.4);
                ctx.closePath();
                break;
            case 2: // Square with X
                ctx.rect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
                ctx.moveTo(-s * 0.4, -s * 0.4);
                ctx.lineTo(s * 0.4, s * 0.4);
                ctx.moveTo(s * 0.4, -s * 0.4);
                ctx.lineTo(-s * 0.4, s * 0.4);
                break;
            case 3: // Star
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2 / 5) - Math.PI / 2;
                    const x = Math.cos(angle) * s * 0.5;
                    const y = Math.sin(angle) * s * 0.5;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
        }
        
        ctx.stroke();
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
    
    spawnWizardSparkle(x, y) {
        this.particles.push(new WizardSparkle(x, y));
    }
    
    spawnMagicBurst(x, y) {
        // Spawn multiple burst particles
        for (let i = 0; i < 12; i++) {
            this.particles.push(new MagicBurst(x, y));
        }
        // Spawn runes
        for (let i = 0; i < 3; i++) {
            this.particles.push(new MagicRune(x, y));
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
