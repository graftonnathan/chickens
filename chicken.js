/**
 * Chicken class - Realistic hop/pause movement with weave animation
 */
class Chicken {
    constructor(x, y) {
        // Base position (center line for weave)
        this.baseX = x;
        this.x = x;
        this.y = y;
        this.radius = 15;
        
        // Weave (side-to-side sine wave)
        this.weaveAmplitude = 15; // Max pixels from center
        this.weaveFrequency = 2 + Math.random() * 2; // Random 2-4 Hz
        this.weavePhase = Math.random() * Math.PI * 2;
        this.weaveTime = 0;
        
        // Hop cycle
        this.hopState = 'pause'; // 'pause' | 'hop'
        this.hopTimer = 0;
        this.hopDuration = 0.15; // 150ms hop
        this.pauseDuration = 0.1; // 100ms pause
        this.hopDistance = 15; // Pixels per hop
        
        // Random variation per chicken
        this.hopDuration += (Math.random() - 0.5) * 0.05;
        this.pauseDuration += (Math.random() - 0.5) * 0.05;
        
        // Visual animation offsets
        this.bounceY = 0;
        this.headLag = 0;
        this.wingAngle = 0;
        
        // For carrying
        this.color = ['#fff', '#ffeb3b', '#ff9800'][Math.floor(Math.random() * 3)];
        
        // Hole targeting
        this.targetHole = null;
        this.usingHole = false;
        
        // Hunger system
        this.hunger = 100; // 0-100%
        this.hungerDecayRate = 1; // % per second
        this.baseSpeed = 60; // Base movement speed
        
        // Feeding state
        this.isBeingFed = false;
        this.feedingTimer = 0;
        this.starveAnimTimer = 0;
    }

    update(deltaTime, fenceHoleManager) {
        // Handle feeding animation
        if (this.isBeingFed) {
            this.feedingTimer -= deltaTime;
            if (this.feedingTimer <= 0) {
                this.isBeingFed = false;
                this.feedingTimer = 0;
            }
            return null; // Don't move while being fed
        }
        
        // Decrease hunger over time
        this.hunger -= this.hungerDecayRate * deltaTime;
        this.hunger = Math.max(0, this.hunger);
        
        // Get speed multiplier based on hunger
        const speedMultiplier = this.getSpeedMultiplier();
        
        // Don't move if starving
        if (this.hunger === 0) {
            this.starveAnimTimer += deltaTime;
            return null;
        }
        
        // Check for holes - 50% chance to use if closer than south
        if (fenceHoleManager && !this.usingHole) {
            const nearestHole = fenceHoleManager.getNearestHole(this.x, this.y);
            if (nearestHole) {
                const distToHole = Math.sqrt(
                    Math.pow(nearestHole.x - this.x, 2) + 
                    Math.pow(nearestHole.y - this.y, 2)
                );
                const distToSouth = 500 - this.y; // Distance to house roof escape
                
                // 50% chance to use hole if closer
                if (distToHole < distToSouth && Math.random() < 0.5) {
                    this.targetHole = nearestHole;
                    this.usingHole = true;
                }
            }
        }
        
        // If using hole, move toward it
        if (this.usingHole && this.targetHole) {
            const dx = this.targetHole.x - this.x;
            const dy = this.targetHole.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 5) {
                // Reached hole - will escape
                return 'escaped_through_hole';
            }
            
            // Move toward hole with hunger speed modifier
            this.moveTowardHole(deltaTime, dx, dy, dist, speedMultiplier);
        } else {
            // Normal south movement with hunger speed modifier
            this.moveSouth(deltaTime, speedMultiplier);
        }
        
        // Check if reached south (house roof)
        if (this.y > 500) {
            return 'escaped_south';
        }
        
        return null;
    }
    
    // Get speed multiplier based on hunger
    getSpeedMultiplier() {
        if (this.hunger >= 50) return 1.0;      // Full speed
        if (this.hunger >= 25) return 0.7;      // Hungry, slower
        if (this.hunger > 0) return 0.4;        // Very hungry, very slow
        return 0;                                // Starving, stopped
    }
    
    // Get hunger state name
    getHungerState() {
        if (this.hunger >= 75) return 'full';      // 75-100%
        if (this.hunger >= 50) return 'satisfied'; // 50-74%
        if (this.hunger >= 25) return 'hungry';    // 25-49%
        if (this.hunger > 0) return 'very_hungry'; // 1-24%
        return 'starving';                          // 0%
    }
    
    // Feed the chicken
    feed() {
        if (this.hunger < 100 && !this.isBeingFed) {
            this.hunger = 100;
            this.isBeingFed = true;
            this.feedingTimer = 1.0; // 1 second feeding animation
            return true;
        }
        return false;
    }
    
    // Check if can be fed (in range)
    canBeFed(hero) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < 30 && this.hunger < 100 && !this.isBeingFed; // Within range and hungry
    }
    
    moveTowardHole(deltaTime, dx, dy, dist, speedMultiplier) {
        // Update hop cycle
        this.hopTimer += deltaTime;
        
        if (this.hopState === 'hop') {
            const hopProgress = Math.min(this.hopTimer / this.hopDuration, 1);
            this.bounceY = -12 * Math.sin(hopProgress * Math.PI);
            this.wingAngle = Math.sin(hopProgress * Math.PI * 4) * 0.4;
            
            if (this.hopTimer >= this.hopDuration) {
                // Move toward hole with hunger speed modifier
                const moveSpeed = this.hopDistance * speedMultiplier;
                this.x += (dx / dist) * moveSpeed;
                this.y += (dy / dist) * moveSpeed;
                
                this.hopState = 'pause';
                this.hopTimer = 0;
                this.bounceY = 0;
                this.wingAngle = 0;
            }
        } else {
            this.bounceY = Math.sin(Date.now() / 100) * 0.5;
            this.wingAngle = 0;
            
            if (this.hopTimer >= this.pauseDuration * (1 / speedMultiplier)) {
                this.hopState = 'hop';
                this.hopTimer = 0;
            }
        }
    }
    
    moveSouth(deltaTime, speedMultiplier) {
        // Update weave (continuous sine wave for X)
        this.weaveTime += deltaTime;
        const weaveOffset = Math.sin(
            this.weaveTime * this.weaveFrequency + this.weavePhase
        ) * this.weaveAmplitude;
        this.x = this.baseX + weaveOffset;
        
        // Update hop cycle with hunger speed modifier
        this.hopTimer += deltaTime;
        
        if (this.hopState === 'hop') {
            // During hop
            const hopProgress = Math.min(this.hopTimer / this.hopDuration, 1);
            
            // Vertical bounce (parabolic arc)
            this.bounceY = -12 * Math.sin(hopProgress * Math.PI);
            
            // Wing flap (rapid oscillation)
            this.wingAngle = Math.sin(hopProgress * Math.PI * 4) * 0.4;
            
            // Head lag (slightly behind body movement)
            const lagProgress = Math.max(0, hopProgress - 0.2);
            this.headLag = Math.sin(lagProgress * Math.PI) * 3;
            
            if (this.hopTimer >= this.hopDuration) {
                // End of hop - move forward with hunger speed modifier
                this.y += this.hopDistance * speedMultiplier;
                this.hopState = 'pause';
                this.hopTimer = 0;
                this.bounceY = 0;
                this.wingAngle = 0;
                this.headLag = 0;
            }
        } else {
            // During pause (longer pause when hungry)
            // Idle bob (breathing motion)
            this.bounceY = Math.sin(this.weaveTime * 10) * 1;
            this.wingAngle = 0;
            this.headLag = 0;
            
            const adjustedPause = this.pauseDuration * (1 / speedMultiplier);
            if (this.hopTimer >= adjustedPause) {
                // Start next hop
                this.hopState = 'hop';
                this.hopTimer = 0;
            }
        }
    }

    draw(ctx) {
        const drawX = this.x;
        const drawY = this.y + this.bounceY;
        const hungerState = this.getHungerState();
        
        ctx.save();
        
        // Apply visual filters based on hunger state
        switch(hungerState) {
            case 'full':
            case 'satisfied':
                ctx.globalAlpha = 1.0;
                break;
            case 'hungry':
                // Slightly dim
                ctx.filter = 'brightness(0.85)';
                break;
            case 'very_hungry':
                // Dim + slight grayscale
                ctx.filter = 'brightness(0.7)';
                break;
            case 'starving':
                // Very dim + grayscale
                ctx.filter = 'brightness(0.5) grayscale(0.6)';
                break;
        }
        
        // Shadow (on ground, not bouncing with chicken)
        const shadowAlpha = this.hopState === 'hop' ? 0.08 : 0.15;
        const shadowScale = this.hopState === 'hop' ? 0.8 : 1.0;
        ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(drawX, this.y + 10, 12 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(drawX, drawY, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing (with flap animation)
        ctx.save();
        ctx.translate(drawX - 5, drawY);
        ctx.rotate(this.wingAngle);
        ctx.fillStyle = this.color === '#fff' ? '#f5f5f5' : this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Head (with lag)
        const headX = drawX + this.headLag;
        const headY = drawY - 8;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(headX, headY, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(headX + 5, headY - 2);
        ctx.lineTo(headX + 12, headY);
        ctx.lineTo(headX + 5, headY + 2);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(headX + 3, headY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Comb (red thing on head)
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(headX, headY - 7, 4, Math.PI, 0);
        ctx.fill();
        
        // Legs (different during hop vs pause)
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        if (this.hopState === 'hop') {
            // Tucked legs during hop
            ctx.moveTo(drawX - 5, drawY + 8);
            ctx.lineTo(drawX - 3, drawY + 5);
            ctx.moveTo(drawX + 5, drawY + 8);
            ctx.lineTo(drawX + 3, drawY + 5);
        } else {
            // Standing legs during pause
            ctx.moveTo(drawX - 5, drawY + 8);
            ctx.lineTo(drawX - 5, drawY + 15);
            ctx.moveTo(drawX + 5, drawY + 8);
            ctx.lineTo(drawX + 5, drawY + 15);
        }
        ctx.stroke();
        
        ctx.restore(); // Restore filter
        
        // Draw hunger indicator bar above chicken (not affected by filter)
        this.drawHungerBar(ctx);
        
        // Draw starving effects
        if (hungerState === 'starving') {
            this.drawStarvingEffects(ctx);
        }
        
        // Draw feeding effects
        if (this.isBeingFed) {
            this.drawFeedingEffects(ctx);
        }
    }
    
    // Draw hunger bar above chicken
    drawHungerBar(ctx) {
        const barWidth = 20;
        const barHeight = 4;
        const x = this.x - barWidth / 2;
        const y = this.y - 35;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Fill color based on hunger level
        if (this.hunger > 50) {
            ctx.fillStyle = '#4caf50'; // Green (healthy)
        } else if (this.hunger > 25) {
            ctx.fillStyle = '#ff9800'; // Orange (hungry)
        } else {
            ctx.fillStyle = '#f44336'; // Red (starving)
        }
        
        ctx.fillRect(x, y, barWidth * (this.hunger / 100), barHeight);
    }
    
    // Draw "zzz" bubbles when starving
    drawStarvingEffects(ctx) {
        const zOffset = Math.sin(this.starveAnimTimer * 2) * 3;
        
        ctx.fillStyle = '#9e9e9e';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        
        // First z
        ctx.fillText('z', this.x + 8, this.y - 25 + zOffset);
        
        // Second z (smaller)
        ctx.font = '8px sans-serif';
        ctx.fillText('z', this.x + 12, this.y - 30 + zOffset);
    }
    
    // Draw feeding animation effects
    drawFeedingEffects(ctx) {
        const progress = 1 - (this.feedingTimer / 1.0); // 0 to 1
        
        // Heart floating up
        const heartY = this.y - 30 - progress * 20;
        ctx.fillStyle = '#e91e63';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('❤', this.x, heartY);
        
        // Pecking animation (head bob)
        const peckOffset = Math.sin(progress * Math.PI * 8) * 5;
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(this.x + 12, this.y - 8 + peckOffset);
        ctx.lineTo(this.x + 18, this.y - 5 + peckOffset);
        ctx.lineTo(this.x + 12, this.y - 2 + peckOffset);
        ctx.closePath();
        ctx.fill();
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}
