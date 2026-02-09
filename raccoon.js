/**
 * Raccoon class - Enemy that tries to reach the coop
 */
class Raccoon {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.radius = 18;
        this.speed = 120; // pixels per second (faster than chickens)
        
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
        
        this.calculateDirection();
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
        return distance < 30;
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
}

/**
 * RaccoonSpawner - Manages raccoon spawning with accelerated intervals
 */
class RaccoonSpawner {
    constructor(coop) {
        this.coop = coop;
        this.spawnTimer = 0;
        this.baseSpawnRate = 15; // 15 seconds initially
        this.currentSpawnRate = this.baseSpawnRate;
        this.minSpawnRate = 5; // floor at 5 seconds
        this.spawnAcceleration = 0.95; // 5% faster each time
        this.warningTime = 3; // 3 second warning before spawn
        this.warningActive = false;
        this.nextSpawnTime = this.currentSpawnRate;
        
        // Spawn position (over back fence)
        this.spawnX = 400; // center of bottom fence
        this.spawnY = 575;
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

    spawnRaccoon() {
        return new Raccoon(
            this.spawnX + (Math.random() - 0.5) * 100, // Random position along fence
            this.spawnY,
            this.coop.x,
            this.coop.y
        );
    }

    getWarningProgress() {
        if (!this.warningActive) return 0;
        const timeUntilSpawn = this.nextSpawnTime - this.spawnTimer;
        return 1 - (timeUntilSpawn / this.warningTime);
    }

    reset() {
        this.spawnTimer = 0;
        this.currentSpawnRate = this.baseSpawnRate;
        this.nextSpawnTime = this.currentSpawnRate;
        this.warningActive = false;
    }
}
