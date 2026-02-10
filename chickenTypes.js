/**
 * chickenTypes.js - 12 unique chicken personalities with special powers
 */

const CHICKEN_TYPES = {
    rainbow: {
        name: 'Rainbow',
        icon: '🌈',
        description: 'The Unicorn Chicken',
        bodyColor: '#ffffff',
        accentColor: '#ff69b4',
        hasHorn: true,
        speedMod: 1.2,
        eggRateMod: 1.0,
        special: 'rainbowTrail'
    },
    rocket: {
        name: 'Rocket',
        icon: '🚀',
        description: 'Speed Demon',
        bodyColor: '#ff4444',
        accentColor: '#ff8800',
        tailType: 'flame',
        speedMod: 1.0,
        eggRateMod: 1.0,
        special: 'speedBurst'
    },
    sleepy: {
        name: 'Sleepy',
        icon: '💤',
        description: 'The Sloth',
        bodyColor: '#888888',
        accentColor: '#aaaaaa',
        eyeType: 'halfClosed',
        speedMod: 0.7,
        eggRateMod: 0.8,
        special: 'powerNap'
    },
    sneaky: {
        name: 'Sneaky',
        icon: '🎭',
        description: 'The Escape Artist',
        bodyColor: '#4a4a4a',
        accentColor: '#2a2a2a',
        facePattern: 'mask',
        speedMod: 1.1,
        eggRateMod: 1.0,
        special: 'slipThrough'
    },
    lucky: {
        name: 'Lucky',
        icon: '🍀',
        description: 'Golden Egg Layer',
        bodyColor: '#ffd700',
        accentColor: '#ffec8b',
        pattern: 'clover',
        speedMod: 1.0,
        eggRateMod: 1.0,
        special: 'goldenEgg'
    },
    music: {
        name: 'Music',
        icon: '🎵',
        description: 'The Bard',
        bodyColor: '#9370db',
        accentColor: '#ba55d3',
        pattern: 'musicNotes',
        speedMod: 1.0,
        eggRateMod: 1.0,
        special: 'speedAura'
    },
    tank: {
        name: 'Tank',
        icon: '🛡️',
        description: 'The Protector',
        bodyColor: '#708090',
        accentColor: '#4a4a4a',
        sizeMod: 1.3,
        speedMod: 0.8,
        eggRateMod: 1.0,
        special: 'blockRaccoon'
    },
    night: {
        name: 'Night',
        icon: '🌙',
        description: 'The Nocturnal',
        bodyColor: '#191970',
        accentColor: '#ffffff',
        pattern: 'stars',
        speedMod: 1.0,
        eggRateMod: 1.0,
        special: 'nocturnal'
    },
    sunny: {
        name: 'Sunny',
        icon: '🌻',
        description: 'The Optimist',
        bodyColor: '#ffeb3b',
        accentColor: '#ffa500',
        pattern: 'sunflower',
        speedMod: 1.0,
        eggRateMod: 1.0,
        special: 'outdoorLover'
    },
    hungry: {
        name: 'Hungry',
        icon: '🍔',
        description: 'The Glutton',
        bodyColor: '#d2691e',
        accentColor: '#8b4513',
        sizeMod: 1.2,
        speedMod: 0.9,
        eggRateMod: 0.7,
        special: 'foodBoost'
    },
    circus: {
        name: 'Circus',
        icon: '🎪',
        description: 'The Acrobat',
        bodyColor: '#ff1493',
        accentColor: '#00ced1',
        pattern: 'stripes',
        speedMod: 1.1,
        eggRateMod: 1.0,
        special: 'jumper'
    },
    ghost: {
        name: 'Ghost',
        icon: '👻',
        description: 'The Phantom',
        bodyColor: '#f0f0f0',
        accentColor: '#e0e0e0',
        alpha: 0.7,
        speedMod: 1.0,
        eggRateMod: 1.0,
        special: 'phaseThrough'
    }
};

/**
 * TypedChicken - Chicken with unique personality and special powers
 */
class TypedChicken extends Chicken {
    constructor(id, x, y, type) {
        super(id, x, y);
        
        this.type = type;
        this.typeData = CHICKEN_TYPES[type];
        this.name = this.typeData.name;
        
        // Apply type modifiers
        this.applyTypeModifiers();
        
        // Special ability state
        this.specialTimer = 0;
        this.specialCooldown = 0;
        this.trail = [];
        this.eggsLaid = 0;
        this.hasGoldenEgg = false;
        
        // Type-specific state
        this.isBoosting = false;
        this.isNapping = false;
        this.musicBoost = 1.0;
        this.isPhasing = false;
        this.phaseCooldown = 0;
        this.zzzTimer = 0;
    }
    
    applyTypeModifiers() {
        const data = this.typeData;
        
        // Speed modifier
        this.baseSpeed = 60 * (data.speedMod || 1);
        this.moveSpeed = this.baseSpeed;
        
        // Size modifier
        this.sizeMod = data.sizeMod || 1;
        this.radius = 15 * this.sizeMod;
        
        // Egg rate modifier
        this.eggRateMod = data.eggRateMod || 1;
        
        // Visual properties
        this.bodyColor = data.bodyColor;
        this.accentColor = data.accentColor;
        this.alpha = data.alpha || 1;
    }
    
    update(deltaTime, coop, gameTime) {
        // Update special abilities
        this.updateSpecial(deltaTime, coop, gameTime);
        
        // Update trail for rainbow
        if (this.type === 'rainbow') {
            this.updateTrail();
        }
        
        // Apply music boost decay
        if (this.musicBoost > 1.0) {
            this.musicBoost -= deltaTime * 0.5;
            if (this.musicBoost < 1.0) this.musicBoost = 1.0;
        }
        
        // Apply boosted speed
        if (!this.isNapping) {
            this.moveSpeed = this.baseSpeed * this.musicBoost;
        }
        
        // Call base update
        const result = super.update(deltaTime, coop);
        
        return result;
    }
    
    updateSpecial(deltaTime, coop, gameTime) {
        // Update cooldowns
        if (this.specialCooldown > 0) {
            this.specialCooldown -= deltaTime;
        }
        
        // Update active specials
        if (this.specialTimer > 0) {
            this.specialTimer -= deltaTime;
            if (this.specialTimer <= 0) {
                this.endSpecial();
            }
        }
        
        // Type-specific updates
        switch(this.type) {
            case 'rocket':
                this.updateRocket(deltaTime);
                break;
            case 'sleepy':
                this.updateSleepy(deltaTime);
                break;
            case 'music':
                this.updateMusic(coop);
                break;
            case 'night':
                this.updateNight(gameTime);
                break;
            case 'sunny':
                this.updateSunny(coop);
                break;
            case 'ghost':
                this.updateGhost(deltaTime);
                break;
            case 'lucky':
                this.updateLucky();
                break;
        }
    }
    
    updateRocket(deltaTime) {
        if (!this.isBoosting && this.inCoop && Math.random() < 0.005) {
            this.activateSpeedBurst();
        }
    }
    
    activateSpeedBurst() {
        this.isBoosting = true;
        this.moveSpeed = this.baseSpeed * 2;
        this.specialTimer = 1.0;
    }
    
    updateSleepy(deltaTime) {
        this.zzzTimer += deltaTime;
        if (!this.isNapping && this.inCoop && Math.random() < 0.002) {
            this.takeNap();
        }
    }
    
    takeNap() {
        this.isNapping = true;
        this.moveSpeed = 0;
        this.specialTimer = 3.0;
    }
    
    updateMusic(coop) {
        if (this.inCoop && coop) {
            const chickens = coop.chickens || [];
            chickens.forEach(c => {
                if (c !== this && c.inCoop && c.type !== 'music') {
                    const dist = Math.hypot(c.x - this.x, c.y - this.y);
                    if (dist < 60) {
                        c.musicBoost = Math.max(c.musicBoost, 1.3);
                    }
                }
            });
        }
    }
    
    updateNight(gameTime) {
        const minute = Math.floor((gameTime || 0) / 60);
        const isNight = minute % 2 === 1;
        this.nocturnalBonus = isNight ? 1.4 : 0.9;
        this.moveSpeed = this.baseSpeed * this.nocturnalBonus * this.musicBoost;
    }
    
    updateSunny(coop) {
        const outdoorBonus = this.inCoop ? 0.8 : 1.3;
        if (!this.isNapping && !this.isBoosting) {
            this.moveSpeed = this.baseSpeed * outdoorBonus * this.musicBoost;
        }
    }
    
    updateGhost(deltaTime) {
        if (this.phaseCooldown > 0) {
            this.phaseCooldown -= deltaTime;
        }
    }
    
    updateLucky() {
        // Golden egg logic handled in layEgg
    }
    
    tryPhaseThrough() {
        if (this.phaseCooldown <= 0) {
            this.isPhasing = true;
            this.phaseCooldown = 60;
            this.specialTimer = 2.0;
            return true;
        }
        return false;
    }
    
    endSpecial() {
        if (this.isBoosting) {
            this.isBoosting = false;
        }
        if (this.isNapping) {
            this.isNapping = false;
        }
        if (this.isPhasing) {
            this.isPhasing = false;
        }
    }
    
    layEgg() {
        if (this.isNapping) return;
        
        super.layEgg();
        this.eggsLaid++;
        
        // Lucky chicken golden egg chance
        if (this.type === 'lucky' && Math.random() < 0.15) {
            this.hasGoldenEgg = true;
        }
        
        // Hungry chicken bonus when well-fed
        if (this.type === 'hungry' && this.hunger > 50) {
            this.eggTimer *= 0.7; // 30% faster next egg
        }
    }
    
    getEggInterval() {
        const base = super.getEggInterval();
        return base * this.eggRateMod;
    }
    
    collectEgg() {
        const hadGolden = this.hasGoldenEgg;
        const result = super.collectEgg();
        if (result && hadGolden) {
            this.hasGoldenEgg = false;
            return { golden: true };
        }
        return result;
    }
    
    updateTrail() {
        this.trail.push({ x: this.x, y: this.y, time: Date.now() });
        this.trail = this.trail.filter(p => Date.now() - p.time < 2000);
        if (this.trail.length > 20) {
            this.trail.shift();
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // Ghost phasing effect
        let drawAlpha = this.alpha;
        if (this.type === 'ghost' && this.isPhasing) {
            drawAlpha = 0.3;
        }
        ctx.globalAlpha = drawAlpha;
        
        // Draw trail first (under chicken)
        if (this.type === 'rainbow') {
            this.drawRainbowTrail(ctx);
        }
        
        // Draw flame tail for rocket
        if (this.type === 'rocket' && this.isBoosting) {
            this.drawFlameTail(ctx);
        }
        
        // Draw typed body
        this.drawTypedBody(ctx);
        
        // Draw special effects on top
        this.drawSpecialEffects(ctx);
        
        ctx.restore();
        
        // Draw hunger indicator (not affected by alpha)
        this.drawHungerIndicator(ctx);
        
        // Draw egg indicator
        if (this.hasEgg) {
            this.drawEggIndicator(ctx);
        }
    }
    
    drawTypedBody(ctx) {
        const data = this.typeData;
        const sm = this.sizeMod;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10 * sm, 10 * sm, 4 * sm, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 12 * sm, 10 * sm, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pattern overlay
        if (data.pattern) {
            this.drawPattern(ctx, data.pattern);
        }
        
        // Wing
        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.ellipse(this.x - 5 * sm, this.y + 2, 8 * sm, 5 * sm, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.arc(this.x + 8 * sm, this.y - 8 * sm, 8 * sm, 0, Math.PI * 2);
        ctx.fill();
        
        // Horn for unicorn
        if (data.hasHorn) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(this.x + 6 * sm, this.y - 12 * sm);
            ctx.lineTo(this.x + 8 * sm, this.y - 22 * sm);
            ctx.lineTo(this.x + 10 * sm, this.y - 12 * sm);
            ctx.fill();
        }
        
        // Mask for sneaky
        if (data.facePattern === 'mask') {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(this.x + 4 * sm, this.y - 10 * sm, 8 * sm, 4 * sm);
        }
        
        // Eye
        this.drawEye(ctx, data.eyeType || 'normal');
        
        // Beak
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(this.x + 14 * sm, this.y - 8 * sm);
        ctx.lineTo(this.x + 20 * sm, this.y - 6 * sm);
        ctx.lineTo(this.x + 14 * sm, this.y - 4 * sm);
        ctx.fill();
        
        // Comb
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.x + 8 * sm, this.y - 16 * sm, 4 * sm, Math.PI, 0);
        ctx.fill();
        
        // Legs
        ctx.strokeStyle = data.legType === 'striped' ? data.accentColor : '#ffa500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 5 * sm, this.y + 8 * sm);
        ctx.lineTo(this.x - 5 * sm, this.y + 15 * sm);
        ctx.moveTo(this.x + 5 * sm, this.y + 8 * sm);
        ctx.lineTo(this.x + 5 * sm, this.y + 15 * sm);
        ctx.stroke();
    }
    
    drawPattern(ctx, pattern) {
        const data = this.typeData;
        ctx.fillStyle = this.accentColor;
        ctx.globalAlpha = 0.4;
        
        switch(pattern) {
            case 'clover':
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2 / 3) - Math.PI / 2;
                    ctx.beginPath();
                    ctx.arc(
                        this.x + Math.cos(angle) * 4,
                        this.y + Math.sin(angle) * 4,
                        3, 0, Math.PI * 2
                    );
                    ctx.fill();
                }
                break;
            case 'musicNotes':
                ctx.font = '8px sans-serif';
                ctx.fillText('♪', this.x - 8, this.y - 2);
                ctx.fillText('♫', this.x + 4, this.y + 4);
                break;
            case 'stars':
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x - 4, this.y - 4, 1.5, 0, Math.PI * 2);
                ctx.arc(this.x + 5, this.y + 3, 1, 0, Math.PI * 2);
                ctx.arc(this.x - 2, this.y + 5, 1, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'sunflower':
                for (let i = 0; i < 6; i++) {
                    const angle = i * Math.PI / 3;
                    ctx.beginPath();
                    ctx.ellipse(
                        this.x + Math.cos(angle) * 5,
                        this.y + Math.sin(angle) * 5,
                        2, 4, angle, 0, Math.PI * 2
                    );
                    ctx.fill();
                }
                ctx.fillStyle = '#8b4513';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'stripes':
                for (let i = -8; i <= 8; i += 4) {
                    ctx.fillRect(this.x + i - 1, this.y - 8, 2, 16);
                }
                break;
        }
        
        ctx.globalAlpha = this.alpha;
    }
    
    drawEye(ctx, eyeType) {
        const sm = this.sizeMod;
        const eyeX = this.x + 10 * sm;
        const eyeY = this.y - 10 * sm;
        
        ctx.fillStyle = '#000000';
        
        switch(eyeType) {
            case 'halfClosed':
                ctx.fillRect(eyeX - 3, eyeY, 4, 2);
                break;
            case 'normal':
            default:
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 2 * sm, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
    
    drawFlameTail(ctx) {
        const sm = this.sizeMod;
        const flicker = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(255, ${Math.floor(100 * flicker)}, 0, ${flicker})`;
        ctx.beginPath();
        ctx.moveTo(this.x - 12 * sm, this.y);
        ctx.quadraticCurveTo(
            this.x - 20 * sm,
            this.y + Math.sin(Date.now() / 50) * 3,
            this.x - 15 * sm,
            this.y + 8 * sm
        );
        ctx.quadraticCurveTo(
            this.x - 10 * sm,
            this.y + 3,
            this.x - 12 * sm,
            this.y
        );
        ctx.fill();
    }
    
    drawRainbowTrail(ctx) {
        const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
        
        this.trail.forEach((point, i) => {
            const alpha = (i / this.trail.length) * 0.6;
            const color = colors[i % colors.length];
            
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3 + i * 0.3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.globalAlpha = this.alpha;
    }
    
    drawSpecialEffects(ctx) {
        const sm = this.sizeMod;
        
        switch(this.type) {
            case 'sleepy':
                if (this.isNapping) {
                    this.drawZzz(ctx);
                }
                break;
            case 'tank':
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 18 * sm, 0, Math.PI * 2);
                ctx.stroke();
                break;
        }
        
        // Draw icon above chicken
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000000';
        ctx.fillText(this.typeData.icon, this.x, this.y - 35 * sm);
        ctx.shadowBlur = 0;
    }
    
    drawZzz(ctx) {
        const float = Math.sin(this.zzzTimer * 3) * 4;
        ctx.fillStyle = '#9e9e9e';
        ctx.font = `${12 + float * 0.3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('z', this.x + 15, this.y - 25 + float);
        ctx.font = `${10 + float * 0.2}px sans-serif`;
        ctx.fillText('z', this.x + 22, this.y - 32 + float * 1.2);
    }
    
    drawEggIndicator(ctx) {
        // Golden egg for Lucky
        const isGolden = this.hasGoldenEgg;
        
        ctx.fillStyle = isGolden ? '#ffd700' : '#ffffff';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 28 * this.sizeMod, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (isGolden) {
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Sparkle
            const sparkle = Math.sin(Date.now() / 200) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkle})`;
            ctx.beginPath();
            ctx.arc(this.x + 8, this.y - 32, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Glow pulse
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.strokeStyle = isGolden ? `rgba(255, 215, 0, ${pulse})` : `rgba(255, 255, 255, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 28 * this.sizeMod, 10, 0, Math.PI * 2);
        ctx.stroke();
    }
}
