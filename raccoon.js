/**
 * Raccoon class - Enemy that tries to reach the coop
 * Now spawns from NORTH, EAST, or WEST
 */
class Raccoon {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.radius = 18;
        this.speed = 130; // faster than chickens
        
        // State: 'spawning', 'moving', 'fleeing', 'escaped'
        this.state = 'spawning';
        this.spawnTimer = 0;
        this.spawnDelay = 0.5; // half second spawn animation
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        
        // Animation
        this.time = 0;
        this.waddleOffset = Math.random() * Math.PI * 2;
        
        // Trail timer
        this.trailTimer = 0;
        
        // Spawn punch properties
        this.spawnSide = null;
        this.hasPunched = false;
        this.punchTimer = 0;
        this.punchDuration = 0.5; // 500ms punch animation
        
        this.calculateDirection();
    }
    
    // Static method to spawn raccoon with fence punch
    static spawnWithPunch(coop, fenceHoleManager, particleSystem) {
        // Choose spawn side (N/E/W)
        const sides = ['north', 'east', 'west'];
        const side = sides[Math.floor(Math.random() * sides.length)];
        
        let spawnX, spawnY;
        switch(side) {
            case 'north':
                spawnX = 100 + Math.random() * 600;
                spawnY = 40;
                break;
            case 'east':
                spawnX = 760;
                spawnY = 100 + Math.random() * 400;
                break;
            case 'west':
                spawnX = 40;
                spawnY = 100 + Math.random() * 400;
                break;
        }
        
        // Create raccoon
        const raccoon = new Raccoon(spawnX, spawnY, coop.x, coop.y);
        raccoon.spawnSide = side;
        
        // Punch fence and create hole
        raccoon.punchFence(fenceHoleManager, particleSystem);
        
        return raccoon;
    }
    
    punchFence(fenceHoleManager, particleSystem) {
        // Start punch animation
        this.hasPunched = true;
        this.punchTimer = this.punchDuration;
        
        // Create hole at spawn location
        if (fenceHoleManager) {
            fenceHoleManager.createHole(this.x, this.y, this.spawnSide);
        }
        
        // Emit wood break particles
        if (particleSystem) {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
                const speed = 50 + Math.random() * 50;
                particleSystem.spawnWoodParticle(this.x, this.y, angle, speed);
            }
        }
    }

    calculateDirection() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
        }
    }

    update(deltaTime, particleSystem) {
        this.time += deltaTime;
        
        // Handle punch animation
        if (this.hasPunched && this.punchTimer > 0) {
            this.punchTimer -= deltaTime;
            if (this.punchTimer <= 0) {
                this.hasPunched = false;
            }
            return; // Don't move during punch
        }
        
        if (this.state === 'spawning') {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnDelay) {
                this.state = 'moving';
            }
            return;
        }
        
        if (this.state === 'moving') {
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            
            // Spawn paw print trail
            if (particleSystem) {
                this.trailTimer += deltaTime;
                if (this.trailTimer > 0.15) {
                    this.trailTimer = 0;
                    particleSystem.spawnPawPrint(this.x, this.y, this.vx, this.vy);
                }
            }
        }
        
        if (this.state === 'fleeing') {
            // Move away quickly
            this.x += this.vx * 2 * deltaTime;
            this.y += this.vy * 2 * deltaTime;
        }
    }

    checkReachedTarget() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 40;
    }

    intercept(particleSystem) {
        if (this.state !== 'moving') return;
        
        this.state = 'fleeing';
        // Reverse direction
        this.vx = -this.vx;
        this.vy = -this.vy;
        
        // Spawn star burst
        if (particleSystem) {
            particleSystem.spawnStarBurst(this.x, this.y);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Punch pose animation
        if (this.hasPunched && this.punchTimer > 0) {
            this.drawPunchPose(ctx);
            ctx.restore();
            return;
        }
        
        // Spawning animation (scale up with dust)
        if (this.state === 'spawning') {
            const progress = this.spawnTimer / this.spawnDelay;
            const scale = Math.min(1, progress * 1.5);
            ctx.scale(scale, scale);
            ctx.globalAlpha = Math.min(1, progress * 2);
        }
        
        // Fleeing animation (shrink)
        if (this.state === 'fleeing') {
            ctx.globalAlpha = 0.7;
        }
        
        // Waddle while moving
        if (this.state === 'moving' || this.state === 'fleeing') {
            const waddle = Math.sin(this.time * 8 + this.waddleOffset) * 0.15;
            ctx.rotate(waddle);
        }
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 15, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (oval, brown-gray)
        ctx.fillStyle = '#6D5A4B';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Lighter belly
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(0, 3, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#6D5A4B';
        ctx.beginPath();
        ctx.arc(12, -6, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Black mask around eyes
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(12, -6, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (white with black pupils)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(9, -7, 2.5, 0, Math.PI * 2);
        ctx.arc(15, -7, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(9, -7, 1, 0, Math.PI * 2);
        ctx.arc(15, -7, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(19, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears (pointed)
        ctx.fillStyle = '#6D5A4B';
        ctx.beginPath();
        ctx.moveTo(6, -12);
        ctx.lineTo(4, -20);
        ctx.lineTo(10, -14);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(14, -14);
        ctx.lineTo(16, -22);
        ctx.lineTo(18, -12);
        ctx.closePath();
        ctx.fill();
        
        // Inner ears (lighter)
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.moveTo(7, -13);
        ctx.lineTo(6, -17);
        ctx.lineTo(9, -14);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(15, -14);
        ctx.lineTo(16, -18);
        ctx.lineTo(17, -13);
        ctx.closePath();
        ctx.fill();
        
        // Striped tail (curved behind)
        const tailX = -18;
        const tailY = -5;
        const tailCurve = Math.sin(this.time * 3) * 3;
        
        // Tail base
        ctx.fillStyle = '#6D5A4B';
        ctx.beginPath();
        ctx.ellipse(tailX, tailY + tailCurve, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail stripes (black bands)
        ctx.fillStyle = '#1a1a1a';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(tailX - 3 + i * 5, tailY + tailCurve, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Paws
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(-8, 10, 4, 0, Math.PI * 2);
        ctx.arc(8, 10, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
    
    drawPunchPose(ctx) {
        const punchProgress = 1 - (this.punchTimer / this.punchDuration);
        const pawOffset = Math.sin(punchProgress * Math.PI) * 15;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 15, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (vertical - standing on hind legs)
        ctx.fillStyle = '#6D5A4B';
        ctx.fillRect(-10, -30, 20, 35);
        
        // Raised paw (animates)
        ctx.fillStyle = '#6D5A4B';
        ctx.beginPath();
        ctx.arc(15, -20 + pawOffset, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Mask (angry)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(0, -35, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Angry eyes (red)
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-6, -38, 4, 3);
        ctx.fillRect(2, -38, 4, 3);
        
        // Slanted angry eyebrows
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -42);
        ctx.lineTo(-2, -40);
        ctx.moveTo(2, -40);
        ctx.lineTo(8, -42);
        ctx.stroke();
        
        // Nose
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(8, -32, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Punch impact effect at peak
        if (punchProgress > 0.4 && punchProgress < 0.6) {
            ctx.strokeStyle = '#ff5722';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(20, -10, 15 + pawOffset * 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

/**
 * RaccoonSpawner - Manages raccoon spawning from 3 sides (N, E, W)
 */
class RaccoonSpawner {
    constructor(coop) {
        this.coop = coop;
        this.spawnTimer = 0;
        this.baseSpawnRate = 12; // 12 seconds initially
        this.currentSpawnRate = this.baseSpawnRate;
        this.minSpawnRate = 4; // floor at 4 seconds
        this.spawnAcceleration = 0.96; // 4% faster each time
        this.warningTime = 2.5; // 2.5 second warning before spawn
        this.warningActive = false;
        this.nextSpawnTime = this.currentSpawnRate;
    }

    update(deltaTime, raccoons) {
        this.spawnTimer += deltaTime;
        
        // Check if warning should show
        const timeUntilSpawn = this.nextSpawnTime - this.spawnTimer;
        this.warningActive = timeUntilSpawn <= this.warningTime && timeUntilSpawn > 0;
        
        // Spawn raccoon
        if (this.spawnTimer >= this.nextSpawnTime && raccoons.length === 0) {
            this.spawnTimer = 0;
            this.nextSpawnTime = this.currentSpawnRate;
            
            // Accelerate spawn rate
            this.currentSpawnRate = Math.max(
                this.minSpawnRate,
                this.currentSpawnRate * this.spawnAcceleration
            );
            
            return true; // Time to spawn
        }
        
        return false;
    }

    spawnRaccoon(fenceHoleManager, particleSystem) {
        // Use spawnWithPunch to create raccoon with hole
        return Raccoon.spawnWithPunch(this.coop, fenceHoleManager, particleSystem);
    }

    getWarningProgress() {
        if (!this.warningActive) return 0;
        const timeUntilSpawn = this.nextSpawnTime - this.spawnTimer;
        return 1 - (timeUntilSpawn / this.warningTime);
    }
    
    getWarningSide() {
        // Return which side will spawn (for UI indicator)
        return Math.floor(Math.random() * 3);
    }

    reset() {
        this.spawnTimer = 0;
        this.currentSpawnRate = this.baseSpawnRate;
        this.nextSpawnTime = this.currentSpawnRate;
        this.warningActive = false;
    }
}
