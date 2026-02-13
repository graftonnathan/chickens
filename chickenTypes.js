/**
 * chickenTypes.js - 12 unique chicken personalities with special powers
 * Illustrative hand-drawn storybook style rendering
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
        special: 'rainbowTrail',
        // Visual enhancement flags
        hasSparkle: true,
        featherPattern: 'iridescent',
        combStyle: 'horn',
        eyeStyle: 'bright',
        wingTipColors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#9400d3'],
        drawExtra(ctx, x, y, state, animTimer) {
            // Iridescent wing shimmer — cycle hue on wing tips
            const t = animTimer || 0;
            const colors = this.wingTipColors;
            for (let i = 0; i < 3; i++) {
                const ci = Math.floor((t * 3 + i) % colors.length);
                ctx.fillStyle = colors[ci];
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.ellipse(x - 8 + i * 2, y + i * 2.5, 3, 1.5, -0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            // Sparkle particles
            for (let i = 0; i < 3; i++) {
                const sx = x + Math.sin(t * 4 + i * 2) * 12;
                const sy = y - 5 + Math.cos(t * 3 + i * 1.5) * 8;
                const sparkAlpha = Math.sin(t * 5 + i) * 0.4 + 0.4;
                ctx.fillStyle = `rgba(255,255,255,${sparkAlpha})`;
                ctx.beginPath();
                ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
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
        special: 'speedBurst',
        featherPattern: 'swept',
        eyeStyle: 'determined',
        combStyle: 'swept',
        drawExtra(ctx, x, y, state, animTimer) {
            // Swept-back speed lines on head when boosting
            const t = animTimer || 0;
            ctx.strokeStyle = 'rgba(255,136,0,0.5)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const ly = y - 10 + i * 3;
                const len = 6 + Math.sin(t * 8 + i) * 2;
                ctx.beginPath();
                ctx.moveTo(x - 6 - i, ly);
                ctx.lineTo(x - 6 - i - len, ly);
                ctx.stroke();
            }
            // Orange-tipped tail feathers glow
            ctx.fillStyle = 'rgba(255,136,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(x - 12, y - 2, 4, 3, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
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
        special: 'powerNap',
        featherPattern: 'fluffy',
        eyeStyle: 'droopy',
        hasNightcap: true,
        postureSlump: 0.15,
        drawExtra(ctx, x, y, state, animTimer) {
            // Nightcap
            const t = animTimer || 0;
            ctx.fillStyle = '#6a5acd';
            ctx.beginPath();
            ctx.moveTo(x - 2, y - 14);
            ctx.quadraticCurveTo(x + 8, y - 28, x + 12, y - 22);
            ctx.quadraticCurveTo(x + 6, y - 18, x + 4, y - 12);
            ctx.closePath();
            ctx.fill();
            // Pompom
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + 12, y - 22, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Droopy body — wider, flatter posture already handled by sizeMod
        }
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
        special: 'slipThrough',
        eyeStyle: 'narrow',
        featherPattern: 'dark',
        shadowScale: 1.3,
        crouchAmount: 0.12,
        drawExtra(ctx, x, y, state, animTimer) {
            // Bandit mask across eyes
            const t = animTimer || 0;
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(x + 4, y - 10, 7, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Shifty pupil animation — pupils dart left-right
            const shift = Math.sin(t * 6) * 2;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + 5 + shift * 0.5, y - 10, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Darker, larger shadow
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.ellipse(x, y + 13, 15, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
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
        special: 'goldenEgg',
        hasSparkle: true,
        hasGlow: true,
        featherPattern: 'golden',
        drawExtra(ctx, x, y, state, animTimer) {
            const t = animTimer || 0;
            // Glowing outline
            const glowAlpha = Math.sin(t * 3) * 0.15 + 0.25;
            ctx.strokeStyle = `rgba(255,215,0,${glowAlpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(x, y, 15, 13, 0, 0, Math.PI * 2);
            ctx.stroke();
            // Clover on breast
            ctx.fillStyle = 'rgba(0,180,0,0.35)';
            for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI * 2 / 3) - Math.PI / 2;
                ctx.beginPath();
                ctx.arc(x + 3 + Math.cos(angle) * 3, y + 2 + Math.sin(angle) * 3, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            // Sparkle particles
            for (let i = 0; i < 2; i++) {
                const sx = x + Math.sin(t * 4 + i * 3) * 14;
                const sy = y - 3 + Math.cos(t * 3 + i * 2) * 10;
                const sparkAlpha = Math.sin(t * 6 + i) * 0.4 + 0.3;
                ctx.fillStyle = `rgba(255,215,0,${sparkAlpha})`;
                ctx.beginPath();
                ctx.arc(sx, sy, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
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
        special: 'speedAura',
        featherPattern: 'musical',
        hasBeret: true,
        drawExtra(ctx, x, y, state, animTimer) {
            const t = animTimer || 0;
            // Beret-style head tuft
            ctx.fillStyle = '#4a2080';
            ctx.beginPath();
            ctx.ellipse(x + 1, y - 16, 6, 3, -0.2, 0, Math.PI * 2);
            ctx.fill();
            // Floating note particles
            for (let i = 0; i < 2; i++) {
                const noteY = y - 20 - Math.sin(t * 2 + i * Math.PI) * 6;
                const noteX = x + 8 + i * 6 + Math.cos(t * 1.5 + i) * 3;
                const noteAlpha = 0.3 + Math.sin(t * 3 + i) * 0.2;
                ctx.fillStyle = `rgba(186,85,211,${noteAlpha})`;
                ctx.font = '7px sans-serif';
                ctx.fillText(i % 2 === 0 ? '♪' : '♫', noteX, noteY);
            }
            // Musical note shapes in wing feathers
            ctx.fillStyle = 'rgba(186,85,211,0.25)';
            ctx.font = '6px sans-serif';
            ctx.fillText('♪', x - 10, y + 2);
        }
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
        special: 'blockRaccoon',
        featherPattern: 'armored',
        combStyle: 'helmet',
        legThickness: 1.5,
        drawExtra(ctx, x, y, state, animTimer) {
            const sm = 1.3;
            // Armor-plate hexagonal pattern on body
            ctx.strokeStyle = 'rgba(74,74,74,0.3)';
            ctx.lineWidth = 0.6;
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 2; j++) {
                    const hx = x - 6 + i * 5;
                    const hy = y - 3 + j * 6 + (i % 2) * 3;
                    ctx.beginPath();
                    for (let k = 0; k < 6; k++) {
                        const angle = k * Math.PI / 3;
                        const px = hx + Math.cos(angle) * 2.5;
                        const py = hy + Math.sin(angle) * 2.5;
                        if (k === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            }
            // Helmet-shaped comb (override)
            ctx.fillStyle = '#556270';
            ctx.beginPath();
            ctx.moveTo(x + 3, y - 14 * sm);
            ctx.quadraticCurveTo(x + 8, y - 20 * sm, x + 13, y - 14 * sm);
            ctx.quadraticCurveTo(x + 11, y - 12 * sm, x + 5, y - 12 * sm);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#3d4a56';
            ctx.lineWidth = 0.6;
            ctx.stroke();
        }
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
        special: 'nocturnal',
        featherPattern: 'starry',
        hasEarTufts: true,
        hasGlowingEyes: true,
        drawExtra(ctx, x, y, state, animTimer) {
            const t = animTimer || 0;
            // Star speckle on body
            ctx.fillStyle = '#ffffff';
            const starPositions = [[-4, -4], [5, 3], [-2, 5], [7, -2], [-6, 2]];
            for (const [sx, sy] of starPositions) {
                const twinkle = Math.sin(t * 4 + sx + sy) * 0.3 + 0.7;
                ctx.globalAlpha = twinkle * 0.6;
                ctx.beginPath();
                ctx.arc(x + sx, y + sy, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            // Crescent moon on wing
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(x - 6, y + 1, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#191970';
            ctx.beginPath();
            ctx.arc(x - 5, y + 0.5, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Owl-like ear tufts
            ctx.fillStyle = '#191970';
            ctx.beginPath();
            ctx.moveTo(x - 1, y - 14);
            ctx.lineTo(x - 3, y - 20);
            ctx.lineTo(x + 1, y - 15);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + 5, y - 14);
            ctx.lineTo(x + 7, y - 20);
            ctx.lineTo(x + 9, y - 15);
            ctx.fill();
            // Glowing eye effect
            const eyeGlow = Math.sin(t * 2) * 0.2 + 0.5;
            ctx.fillStyle = `rgba(200,200,255,${eyeGlow})`;
            ctx.beginPath();
            ctx.arc(x + 5, y - 10, 3, 0, Math.PI * 2);
            ctx.fill();
        }
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
        special: 'outdoorLover',
        featherPattern: 'warm',
        combStyle: 'sunflower',
        hasWarmGlow: true,
        drawExtra(ctx, x, y, state, animTimer) {
            const t = animTimer || 0;
            // Sunflower-petal comb (8 petals)
            ctx.fillStyle = '#ffa500';
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI / 4) + Math.sin(t) * 0.05;
                const px = x + 2 + Math.cos(angle) * 5;
                const py = y - 15 + Math.sin(angle) * 5;
                ctx.beginPath();
                ctx.ellipse(px, py, 1.5, 3, angle, 0, Math.PI * 2);
                ctx.fill();
            }
            // Center seed
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.arc(x + 2, y - 15, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Warm glow aura
            const glowAlpha = Math.sin(t * 2) * 0.08 + 0.12;
            ctx.fillStyle = `rgba(255,235,59,${glowAlpha})`;
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fill();
            // Happy curved beak (slight upward curve already in base)
            // Orange-tipped wing feathers
            ctx.fillStyle = 'rgba(255,165,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(x - 12, y + 1, 3, 2, -0.4, 0, Math.PI * 2);
            ctx.fill();
        }
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
        special: 'foodBoost',
        featherPattern: 'round',
        bodyRoundness: 1.15,
        hasBib: true,
        drawExtra(ctx, x, y, state, animTimer) {
            const t = animTimer || 0;
            // Bib-shaped breast marking
            ctx.fillStyle = 'rgba(255,235,200,0.4)';
            ctx.beginPath();
            ctx.moveTo(x - 3, y - 4);
            ctx.quadraticCurveTo(x, y + 6, x + 5, y - 4);
            ctx.quadraticCurveTo(x + 1, y - 2, x - 3, y - 4);
            ctx.fill();
            // Crumb particles near beak
            ctx.fillStyle = '#c0a060';
            for (let i = 0; i < 3; i++) {
                const cx2 = x + 14 + Math.sin(t * 2 + i * 2) * 3;
                const cy2 = y - 5 + Math.cos(t * 1.5 + i * 3) * 3 + i * 2;
                const crumbAlpha = Math.sin(t * 3 + i) * 0.3 + 0.3;
                ctx.globalAlpha = crumbAlpha;
                ctx.beginPath();
                ctx.arc(cx2, cy2, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
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
        special: 'jumper',
        featherPattern: 'striped',
        hasRuffle: true,
        eyeStyle: 'big',
        drawExtra(ctx, x, y, state, animTimer) {
            const t = animTimer || 0;
            // Ruffle collar around neck
            ctx.strokeStyle = '#00ced1';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI / 4);
                const rx = x + 2 + Math.cos(angle) * 6;
                const ry = y - 6 + Math.sin(angle) * 3;
                ctx.beginPath();
                ctx.ellipse(rx, ry, 2.5, 1.5, angle * 0.5, 0, Math.PI * 2);
                ctx.stroke();
            }
            // Alternating pink/cyan feather stripes
            ctx.globalAlpha = 0.25;
            for (let i = -6; i <= 6; i += 3) {
                ctx.fillStyle = i % 6 === 0 ? '#ff1493' : '#00ced1';
                ctx.fillRect(x + i - 0.5, y - 6, 1.5, 12);
            }
            ctx.globalAlpha = 1.0;
        }
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
        special: 'phaseThrough',
        featherPattern: 'wispy',
        hideLegs: true,
        floatOffset: 3,
        drawExtra(ctx, x, y, state, animTimer) {
            const t = animTimer || 0;
            // Wispy feather edges — fade to transparent tendrils
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const angle = -0.5 + i * 0.3;
                const ex = x + Math.cos(angle) * 12;
                const ey = y + 5 + Math.sin(angle) * 5;
                const waveY = Math.sin(t * 3 + i) * 2;
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.quadraticCurveTo(ex - 2, ey + 4 + waveY, ex - 4, ey + 8 + waveY);
                ctx.stroke();
            }
            ctx.globalAlpha = 0.7;
            // Eerie eye glow
            const eyeGlow = Math.sin(t * 2) * 0.15 + 0.3;
            ctx.fillStyle = `rgba(200,200,255,${eyeGlow})`;
            ctx.beginPath();
            ctx.arc(x + 5, y - 10, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

/**
 * TypedChicken - Chicken with unique personality and special powers
 * Illustrative hand-drawn storybook style rendering
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
        switch (this.type) {
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
            chickens.forEach((c) => {
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
        this.trail = this.trail.filter((p) => Date.now() - p.time < 2000);
        if (this.trail.length > 20) {
            this.trail.shift();
        }
    }

    // --- Color utility helpers (mirrors base Chicken) ---
    _darkenColor(hex, amount) {
        const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.floor(255 * amount));
        const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.floor(255 * amount));
        const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.floor(255 * amount));
        return `rgb(${r},${g},${b})`;
    }

    _lightenColor(hex, amount) {
        const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.floor(255 * amount));
        const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.floor(255 * amount));
        const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.floor(255 * amount));
        return `rgb(${r},${g},${b})`;
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

        // Draw typed body (illustrative overhaul)
        this.drawTypedBody(ctx);

        // Draw type-specific extra visual effects
        if (this.typeData.drawExtra) {
            this.typeData.drawExtra(ctx, this.x, this.y, this.state, this.animTimer);
        }

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
        const sp = this._getStateParams();
        const cx = this.x;
        const cy = this.y;
        const darkColor = this._darkenColor(this.bodyColor, 0.2);
        const lightColor = this._lightenColor(this.bodyColor, 0.2);

        // Ghost float offset
        const floatY = data.floatOffset ? Math.sin(this.animTimer * 2.5) * data.floatOffset : 0;
        const baseY = cy - floatY;

        // Posture slump (sleepy, sneaky crouch)
        const slump = data.postureSlump || data.crouchAmount || 0;

        // 1) Shadow
        const shadowScale = data.shadowScale || 1.0;
        const shadowStretch = sp.isMoving ? 1.15 : 1.0;
        ctx.fillStyle = data.hideLegs ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.13)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12 * sm, 13 * sm * shadowStretch * shadowScale, 4 * sm, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2) Tail feathers — behind body
        this._drawTypedTail(ctx, cx, baseY, sm, sp, darkColor);

        // 3) Legs/Feet (skip for ghost)
        if (!data.hideLegs) {
            this._drawTypedLegs(ctx, cx, baseY, sm, sp, data);
        }

        // 4) Body — layered feather body
        this._drawTypedFeatheredBody(ctx, cx, baseY, sm, sp, darkColor, lightColor, data, slump);

        // 5) Wing
        this._drawTypedWing(ctx, cx, baseY, sm, sp, darkColor, lightColor);

        // 6) Head
        this._drawTypedHead(ctx, cx, baseY, sm, sp, darkColor, lightColor, data);
    }

    _drawTypedTail(ctx, cx, cy, sm, sp, darkColor) {
        ctx.save();
        ctx.translate(cx - 10 * sm, cy - 2 * sm);
        ctx.rotate(-0.3 + sp.tailSway);

        const featherColors = [darkColor, this.bodyColor, darkColor, this.bodyColor];
        const angles = [-0.35, -0.15, 0.05, 0.25];
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate(angles[i]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-4 * sm, -8 * sm, -8 * sm, -14 * sm, (-3 + i * 1.5) * sm, -18 * sm);
            ctx.bezierCurveTo((-1 + i) * sm, -14 * sm, 1 * sm, -7 * sm, 0, 0);
            ctx.fillStyle = featherColors[i];
            ctx.fill();
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
        }

        // Accent-colored tail tips
        ctx.fillStyle = this.accentColor;
        ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.4;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc((-2 + i * 1.5) * sm, -16 * sm, 1.5 * sm, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = Math.min(1, (ctx.globalAlpha || 0.4) / 0.4);

        ctx.restore();
    }

    _drawTypedLegs(ctx, cx, cy, sm, sp, data) {
        const legColor = '#e8a020';
        const legDark = '#c08010';
        const thick = data.legThickness || 1.0;
        const leftPhase = Math.sin(sp.legPhase) * 4;
        const rightPhase = Math.sin(sp.legPhase + Math.PI) * 4;

        if (sp.isCarried) {
            this._drawTypedDanglingLeg(ctx, cx - 4 * sm, cy + 8 * sm, legColor, legDark, thick);
            this._drawTypedDanglingLeg(ctx, cx + 4 * sm, cy + 8 * sm, legColor, legDark, thick);
            return;
        }

        this._drawTypedLeg(ctx, cx - 4 * sm, cy + 7 * sm, leftPhase, legColor, legDark, thick);
        this._drawTypedLeg(ctx, cx + 4 * sm, cy + 7 * sm, rightPhase, legColor, legDark, thick);
    }

    _drawTypedLeg(ctx, lx, ly, phase, color, darkColor, thick) {
        // Upper leg
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5 * thick;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + phase * 0.3, ly + 5);
        ctx.stroke();

        // Lower leg
        ctx.lineWidth = 1.5 * thick;
        ctx.beginPath();
        ctx.moveTo(lx + phase * 0.3, ly + 5);
        ctx.lineTo(lx + phase * 0.6, ly + 10);
        ctx.stroke();

        // 3-toed foot
        const footX = lx + phase * 0.6;
        const footY = ly + 10;
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1 * thick;
        ctx.beginPath();
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX - 2.5, footY + 3);
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + 0.5, footY + 3.5);
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + 3, footY + 2.5);
        ctx.stroke();
    }

    _drawTypedDanglingLeg(ctx, lx, ly, color, darkColor, thick) {
        const dangle = Math.sin(this.animTimer * 4) * 1.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * thick;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(lx + dangle, ly + 5, lx + dangle * 0.5, ly + 10);
        ctx.stroke();

        const footX = lx + dangle * 0.5;
        const footY = ly + 10;
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1 * thick;
        ctx.beginPath();
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX - 2, footY + 2);
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + 0.5, footY + 2.5);
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + 2.5, footY + 2);
        ctx.stroke();
    }

    _drawTypedFeatheredBody(ctx, cx, cy, sm, sp, darkColor, lightColor, data, slump) {
        const sx = sp.bodyScaleX;
        const sy = sp.bodyScaleY;
        const roundness = data.bodyRoundness || 1.0;

        // Main body ellipse
        ctx.beginPath();
        ctx.ellipse(cx, cy + 1 * sm + slump * 10, 12 * sm * sx, 10 * sm * sy * roundness, 0, 0, Math.PI * 2);
        // Gradient fill
        const grad = ctx.createRadialGradient(cx + 3 * sm, cy + 4 * sm, 2, cx, cy, 12 * sm);
        grad.addColorStop(0, lightColor);
        grad.addColorStop(0.7, this.bodyColor);
        grad.addColorStop(1, darkColor);
        ctx.fillStyle = grad;
        ctx.fill();
        // Ink outline
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Breast feathers
        ctx.fillStyle = lightColor;
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = prevAlpha * 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(
                cx + (2 + i * 2) * sm,
                cy + (3 + i * 1.5) * sm,
                4 * sm * sx,
                3 * sm * sy,
                0.2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.globalAlpha = prevAlpha;

        // Feather texture strokes on body edge
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 0.6;
        for (let i = 0; i < 5; i++) {
            const angle = -0.8 + i * 0.4;
            const edgeX = cx + Math.cos(angle) * 11 * sm * sx;
            const edgeY = cy + Math.sin(angle) * 9 * sm * sy;
            ctx.beginPath();
            ctx.moveTo(edgeX, edgeY);
            ctx.quadraticCurveTo(edgeX - 2 * sm, edgeY + 2 * sm, edgeX - 3 * sm, edgeY + 4 * sm);
            ctx.stroke();
        }
    }

    _drawTypedWing(ctx, cx, cy, sm, sp, darkColor, lightColor) {
        ctx.save();
        ctx.translate(cx - 6 * sm, cy + 1 * sm);
        ctx.rotate(sp.wingAngle);

        const featherShades = [darkColor, this.bodyColor, lightColor, this.accentColor];
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, (-2 + i * 2) * sm);
            ctx.bezierCurveTo(
                -6 * sm, (-4 + i * 2.5) * sm,
                -10 * sm, (-1 + i * 3) * sm,
                -7 * sm, (3 + i * 2) * sm
            );
            ctx.bezierCurveTo(
                -4 * sm, (2 + i * 1.5) * sm,
                -1 * sm, (0 + i * 1) * sm,
                0, (-2 + i * 2) * sm
            );
            ctx.fillStyle = featherShades[i];
            ctx.fill();
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 0.4;
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawTypedHead(ctx, cx, cy, sm, sp, darkColor, lightColor, data) {
        const headX = cx + 2 * sm;
        const headY = cy - 9 * sm + sp.headBob;

        // Neck
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5 * sm);
        ctx.quadraticCurveTo(cx + 2 * sm, cy - 7 * sm, headX, headY + 5 * sm);
        ctx.quadraticCurveTo(cx + 4 * sm, cy - 7 * sm, cx + 3 * sm, cy - 4 * sm);
        ctx.fill();

        // Head circle with gradient
        const headGrad = ctx.createRadialGradient(headX + 2 * sm, headY - 1, 1, headX, headY, 7 * sm);
        headGrad.addColorStop(0, lightColor);
        headGrad.addColorStop(1, this.bodyColor);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(headX, headY, 6.5 * sm, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Comb (type can override via drawExtra)
        if (data.combStyle !== 'helmet' && data.combStyle !== 'sunflower' && data.combStyle !== 'horn') {
            this._drawTypedComb(ctx, headX, headY, sm, data);
        }

        // Horn for rainbow
        if (data.hasHorn) {
            this._drawHorn(ctx, headX, headY, sm);
        }

        // Wattle
        this._drawTypedWattle(ctx, headX, headY, sm, sp);

        // Beak
        this._drawTypedBeak(ctx, headX, headY, sm, sp);

        // Eye (type-specific)
        this._drawTypedEye(ctx, headX, headY, sm, sp, data);
    }

    _drawTypedComb(ctx, headX, headY, sm, data) {
        // Swept comb for rocket
        if (data.combStyle === 'swept') {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.moveTo(headX - 2 * sm, headY - 10 * sm);
            ctx.quadraticCurveTo(headX - 6 * sm, headY - 16 * sm, headX - 1 * sm, headY - 14 * sm);
            ctx.quadraticCurveTo(headX + 2 * sm, headY - 11 * sm, headX - 2 * sm, headY - 10 * sm);
            ctx.fill();
            return;
        }

        // Default 3-bump comb
        const combGrad = ctx.createLinearGradient(headX - 4 * sm, headY - 14 * sm, headX + 4 * sm, headY - 10 * sm);
        combGrad.addColorStop(0, '#e74c3c');
        combGrad.addColorStop(1, '#c0392b');
        ctx.fillStyle = combGrad;
        ctx.beginPath();
        ctx.arc(headX - 3 * sm, headY - 11 * sm, 2.5 * sm, Math.PI, 0);
        ctx.arc(headX, headY - 12 * sm, 3 * sm, Math.PI, 0);
        ctx.arc(headX + 3 * sm, headY - 11 * sm, 2.5 * sm, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#a93226';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    _drawHorn(ctx, headX, headY, sm) {
        // Spiral unicorn horn
        const hornGrad = ctx.createLinearGradient(headX, headY - 12 * sm, headX, headY - 24 * sm);
        hornGrad.addColorStop(0, '#ffd700');
        hornGrad.addColorStop(1, '#ffe88a');
        ctx.fillStyle = hornGrad;
        ctx.beginPath();
        ctx.moveTo(headX - 2 * sm, headY - 12 * sm);
        ctx.lineTo(headX, headY - 24 * sm);
        ctx.lineTo(headX + 2 * sm, headY - 12 * sm);
        ctx.closePath();
        ctx.fill();
        // Spiral lines
        ctx.strokeStyle = 'rgba(200,170,0,0.5)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
            const t = i / 4;
            const hy = headY - 12 * sm - t * 12 * sm;
            const hw = (1 - t) * 2 * sm;
            ctx.beginPath();
            ctx.moveTo(headX - hw, hy);
            ctx.lineTo(headX + hw, hy);
            ctx.stroke();
        }
    }

    _drawTypedWattle(ctx, headX, headY, sm, sp) {
        const wattleGrad = ctx.createLinearGradient(headX + 5 * sm, headY + 1 * sm, headX + 7 * sm, headY + 5 * sm);
        wattleGrad.addColorStop(0, '#e74c3c');
        wattleGrad.addColorStop(1, '#c0392b');
        ctx.fillStyle = wattleGrad;
        ctx.beginPath();
        ctx.ellipse(headX + 5 * sm, headY + 3 * sm, 1.5 * sm, 2.5 * sm, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(headX + 7 * sm, headY + 2.5 * sm, 1.2 * sm, 2 * sm, 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawTypedBeak(ctx, headX, headY, sm, sp) {
        const beakGrad = ctx.createLinearGradient(headX + 5 * sm, headY - 3 * sm, headX + 12 * sm, headY);
        beakGrad.addColorStop(0, '#f0a030');
        beakGrad.addColorStop(1, '#e08020');

        // Upper mandible
        ctx.fillStyle = beakGrad;
        ctx.beginPath();
        ctx.moveTo(headX + 5 * sm, headY - 2 * sm);
        ctx.quadraticCurveTo(headX + 10 * sm, headY - 3 * sm, headX + 12 * sm, headY - 1 * sm - sp.beakOpen * 0.3);
        ctx.quadraticCurveTo(headX + 9 * sm, headY - 0.5 * sm, headX + 5 * sm, headY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c07018';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Lower mandible
        ctx.fillStyle = '#d89030';
        ctx.beginPath();
        ctx.moveTo(headX + 5 * sm, headY);
        ctx.quadraticCurveTo(headX + 9 * sm, headY + 0.5 * sm + sp.beakOpen * 0.4, headX + 11 * sm, headY + 1 * sm + sp.beakOpen * 0.5);
        ctx.quadraticCurveTo(headX + 8 * sm, headY + 1 * sm, headX + 5 * sm, headY);
        ctx.closePath();
        ctx.fill();
    }

    _drawTypedEye(ctx, headX, headY, sm, sp, data) {
        const eyeX = headX + 3 * sm;
        const eyeY = headY - 1 * sm;
        const r = 2 * sm * sp.eyeScale;

        // Half-closed for sleepy
        if (data.eyeType === 'halfClosed' || data.eyeStyle === 'droopy') {
            // Droopy eyelid
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(eyeX, eyeY, r * 1.1, r * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2c1810';
            ctx.beginPath();
            ctx.ellipse(eyeX + 0.3, eyeY + 0.3, r * 0.5, r * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Eyelid
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.ellipse(eyeX, eyeY - r * 0.3, r * 1.2, r * 0.5, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            return;
        }

        // Narrow for sneaky
        if (data.eyeStyle === 'narrow') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(eyeX, eyeY, r * 1.1, r * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(eyeX + 0.3, eyeY, r * 0.5, r * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeX + 0.6, eyeY - r * 0.2, r * 0.15, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        // Big eye for circus
        if (data.eyeStyle === 'big') {
            const bigR = r * 1.4;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, bigR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2c1810';
            ctx.beginPath();
            ctx.arc(eyeX + 0.3, eyeY, bigR * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(eyeX + 0.5, eyeY, bigR * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeX + 1, eyeY - bigR * 0.3, bigR * 0.2, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        // Bright eyes for rainbow/lucky
        if (data.eyeStyle === 'bright') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(eyeX, eyeY, r * 1.2, r * 1.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4488cc';
            ctx.beginPath();
            ctx.arc(eyeX + 0.3, eyeY, r * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(eyeX + 0.5, eyeY, r * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeX + 0.8, eyeY - r * 0.4, r * 0.25, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        // Determined for rocket
        if (data.eyeStyle === 'determined') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(eyeX, eyeY, r * 1.1, r, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#440000';
            ctx.beginPath();
            ctx.arc(eyeX + 0.4, eyeY, r * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(eyeX + 0.5, eyeY, r * 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Angled eyebrow
            ctx.strokeStyle = this._darkenColor(this.bodyColor, 0.2);
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(eyeX - r, eyeY - r * 0.8);
            ctx.lineTo(eyeX + r, eyeY - r * 1.2);
            ctx.stroke();
            return;
        }

        // Default eye — iris, pupil, highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, r * 1.1, r, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2c1810';
        ctx.beginPath();
        ctx.arc(eyeX + 0.3, eyeY, r * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(eyeX + 0.5, eyeY, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX + 0.8, eyeY - r * 0.4, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFlameTail(ctx) {
        const sm = this.sizeMod;
        const flicker = Math.sin(Date.now() / 100) * 0.3 + 0.7;

        // Multi-layered flame
        // Outer flame
        ctx.fillStyle = `rgba(255, ${Math.floor(60 * flicker)}, 0, ${flicker * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(this.x - 12 * sm, this.y);
        ctx.bezierCurveTo(
            this.x - 24 * sm, this.y + Math.sin(Date.now() / 50) * 4,
            this.x - 22 * sm, this.y + 6 * sm,
            this.x - 15 * sm, this.y + 8 * sm
        );
        ctx.bezierCurveTo(this.x - 10 * sm, this.y + 4, this.x - 12 * sm, this.y + 1, this.x - 12 * sm, this.y);
        ctx.fill();

        // Inner flame (brighter)
        ctx.fillStyle = `rgba(255, ${Math.floor(180 * flicker)}, 0, ${flicker})`;
        ctx.beginPath();
        ctx.moveTo(this.x - 12 * sm, this.y);
        ctx.quadraticCurveTo(
            this.x - 18 * sm,
            this.y + Math.sin(Date.now() / 50) * 2,
            this.x - 14 * sm,
            this.y + 6 * sm
        );
        ctx.quadraticCurveTo(this.x - 10 * sm, this.y + 2, this.x - 12 * sm, this.y);
        ctx.fill();

        // Core (white-hot)
        ctx.fillStyle = `rgba(255, 255, 200, ${flicker * 0.7})`;
        ctx.beginPath();
        ctx.ellipse(this.x - 13 * sm, this.y + 1, 2 * sm, 3 * sm, 0, 0, Math.PI * 2);
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

        switch (this.type) {
            case 'sleepy':
                if (this.isNapping) {
                    this.drawZzz(ctx);
                }
                break;
            case 'tank':
                // Shield aura
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 18 * sm, 0, Math.PI * 2);
                ctx.stroke();
                // Inner shimmer
                const shimmer = Math.sin(this.animTimer * 3) * 0.1 + 0.15;
                ctx.fillStyle = `rgba(100, 200, 255, ${shimmer})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 16 * sm, 0, Math.PI * 2);
                ctx.fill();
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
        ctx.font = `${8 + float * 0.15}px sans-serif`;
        ctx.fillText('z', this.x + 27, this.y - 38 + float * 1.4);
    }

    drawEggIndicator(ctx) {
        const sm = this.sizeMod;
        const eggY = this.y - 28 * sm;

        // Golden egg for Lucky
        const isGolden = this.hasGoldenEgg;

        ctx.save();
        const wobble = this.state === 'laying' ? Math.sin(this.animTimer * 8) * 0.08 : 0;
        ctx.translate(this.x, eggY);
        ctx.rotate(wobble);

        if (isGolden) {
            // Golden egg with gradient
            const goldGrad = ctx.createLinearGradient(0, -8, 0, 8);
            goldGrad.addColorStop(0, '#ffe88a');
            goldGrad.addColorStop(0.5, '#ffd700');
            goldGrad.addColorStop(1, '#cc9900');
            ctx.fillStyle = goldGrad;
        } else {
            // Normal egg with gradient
            const eggGrad = ctx.createLinearGradient(0, -8, 0, 8);
            eggGrad.addColorStop(0, '#ffffff');
            eggGrad.addColorStop(1, '#f5e6c8');
            ctx.fillStyle = eggGrad;
        }

        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shadow curve on bottom-left
        ctx.fillStyle = isGolden ? 'rgba(160,120,0,0.25)' : 'rgba(180,150,100,0.2)';
        ctx.beginPath();
        ctx.ellipse(-2, 3, 4, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Highlight spot on top-right
        ctx.fillStyle = isGolden ? 'rgba(255,255,200,0.6)' : 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(2, -3, 2, 2.5, -0.3, 0, Math.PI * 2);
        ctx.fill();

        if (isGolden) {
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Sparkle
            const sparkle = Math.sin(Date.now() / 200) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkle})`;
            ctx.beginPath();
            ctx.arc(8, -4, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Glow pulse
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.strokeStyle = isGolden
            ? `rgba(255, 215, 0, ${pulse})`
            : `rgba(255, 255, 255, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, eggY, 10, 0, Math.PI * 2);
        ctx.stroke();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHICKEN_TYPES, TypedChicken };
}
