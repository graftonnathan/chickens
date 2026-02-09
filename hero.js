/**
 * Hero class - The Wizard!
 */
class Hero {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 22;
        this.speed = 220; // slightly slower for wizard feel
        this.vx = 0;
        this.vy = 0;
        this.facing = 0; // angle in radians
        
        // Animation timers
        this.time = 0;
        this.trailTimer = 0;
        
        // Proximity glow
        this.glowIntensity = 0;
    }

    update(deltaTime, input, chickens, particleSystem) {
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
        
        // Update animation time
        this.time += deltaTime;
        
        // Spawn trail particles when moving
        if ((move.dx !== 0 || move.dy !== 0) && particleSystem) {
            this.trailTimer += deltaTime;
            if (this.trailTimer > 0.05) { // every 50ms
                this.trailTimer = 0;
                particleSystem.spawnWizardSparkle(this.x, this.y);
            }
        }
        
        // Calculate proximity glow
        this.updateGlow(chickens);
    }
    
    updateGlow(chickens) {
        if (!chickens || chickens.length === 0) {
            this.glowIntensity = 0;
            return;
        }
        
        // Find nearest chicken
        let nearestDist = Infinity;
        for (const chicken of chickens) {
            const dx = this.x - chicken.x;
            const dy = this.y - chicken.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
            }
        }
        
        // Glow increases as chickens get closer (within 150 pixels)
        const glowRange = 150;
        if (nearestDist < glowRange) {
            this.glowIntensity = 1 - (nearestDist / glowRange);
        } else {
            this.glowIntensity = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Bob animation
        const bob = Math.sin(this.time * 3) * 2;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Proximity glow (magic hands)
        if (this.glowIntensity > 0) {
            const glowRadius = 30 + Math.sin(this.time * 8) * 5;
            const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, glowRadius);
            gradient.addColorStop(0, `rgba(0, 255, 255, ${0.4 * this.glowIntensity})`);
            gradient.addColorStop(1, `rgba(0, 255, 255, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Staff (drawn behind body)
        const staffBob = Math.sin(this.time * 2 + 1) * 3;
        ctx.save();
        ctx.translate(12, -10 + staffBob);
        ctx.rotate(0.1);
        
        // Staff wood
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(0, -35);
        ctx.stroke();
        
        // Staff crystal
        const pulse = 0.7 + Math.sin(this.time * 4) * 0.3;
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-6, -45);
        ctx.lineTo(0, -55);
        ctx.lineTo(6, -45);
        ctx.closePath();
        ctx.fill();
        
        // Crystal glow
        ctx.fillStyle = `rgba(0, 255, 255, ${0.3 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, -45, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Robe body (indigo with gold trim)
        ctx.fillStyle = '#4b0082'; // Indigo
        ctx.beginPath();
        ctx.moveTo(-15, 15);
        ctx.lineTo(-12, -15);
        ctx.lineTo(12, -15);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();
        
        // Gold trim on robe
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 15);
        ctx.lineTo(-12, -15);
        ctx.lineTo(12, -15);
        ctx.lineTo(15, 15);
        ctx.stroke();
        
        // Belt
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-12, -5, 24, 4);
        ctx.fillStyle = '#ffd700'; // Gold buckle
        ctx.fillRect(-3, -6, 6, 6);
        
        // Beard (flowing white)
        const beardSway = Math.sin(this.time * 2) * 2;
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.moveTo(-8, -12);
        ctx.quadraticCurveTo(-10 + beardSway, 0, -6, 10);
        ctx.lineTo(6, 10);
        ctx.quadraticCurveTo(10 + beardSway, 0, 8, -12);
        ctx.closePath();
        ctx.fill();
        
        // Face
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, -18, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -20, 2, 0, Math.PI * 2);
        ctx.arc(3, -20, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat (pointed with star)
        const hatBounce = Math.sin(this.time * 4) * 1.5;
        ctx.save();
        ctx.translate(0, -25 + bob + hatBounce);
        
        // Hat cone
        ctx.fillStyle = '#4b0082'; // Indigo
        ctx.beginPath();
        ctx.moveTo(-18, 5);
        ctx.lineTo(0, -40);
        ctx.lineTo(18, 5);
        ctx.closePath();
        ctx.fill();
        
        // Gold trim on hat
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Hat band
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-12, -5, 24, 4);
        
        // Star on hat
        ctx.fillStyle = '#ffd700';
        this.drawStar(ctx, 0, -25, 6, 5, 2);
        
        ctx.restore();
        
        // Hands (glowing when near chickens)
        if (this.glowIntensity > 0) {
            ctx.fillStyle = `rgba(0, 255, 255, ${0.6 + this.glowIntensity * 0.4})`;
        } else {
            ctx.fillStyle = '#ffdbac';
        }
        ctx.beginPath();
        ctx.arc(-10, 0, 4, 0, Math.PI * 2);
        ctx.arc(10, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawStar(ctx, cx, cy, outerRadius, innerRadius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI / points) - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}
