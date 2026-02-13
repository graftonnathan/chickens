/**
 * Particle System for visual effects — Illustrative Storybook Style
 *
 * All particle rendering uses radial gradients instead of shadowBlur for
 * performance. Shapes are organic (bezier curves, irregular polygons) with
 * warm ink-wash palette tones. Each particle keeps canvas operations ≤10.
 */

// ───────────────────────────────────────────────────────────────
// Helper: draw a 4-point star shape at origin
// ───────────────────────────────────────────────────────────────
function drawStar4(ctx, outerR, innerR) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

// ───────────────────────────────────────────────────────────────
// Helper: draw a multi-point star at origin
// ───────────────────────────────────────────────────────────────
function drawStarN(ctx, points, outerR, innerR) {
    const total = points * 2;
    ctx.beginPath();
    for (let i = 0; i < total; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

// ───────────────────────────────────────────────────────────────
// Helper: create a radial glow gradient (replaces shadowBlur)
// ───────────────────────────────────────────────────────────────
function radialGlow(ctx, x, y, radius, color, alpha) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, colorWithAlpha(color, alpha));
    grad.addColorStop(1, colorWithAlpha(color, 0));
    return grad;
}

// ───────────────────────────────────────────────────────────────
// Helper: apply alpha to a hex or rgb color string
// ───────────────────────────────────────────────────────────────
function colorWithAlpha(color, alpha) {
    // Handle hex colors
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
}

// ═══════════════════════════════════════════════════════════════
//  1. BASE PARTICLE — generic type-driven particles
// ═══════════════════════════════════════════════════════════════
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        this.decay = 0.02;
        this.age = 0;
        this.prevX = x;
        this.prevY = y;

        if (type === 'catch') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.color = '#ffd700';
            this.size = Math.random() * 4 + 2;
            this.baseSize = this.size;
            // 40 % become feather-shaped, 60 % sparkle
            this.isFeather = Math.random() < 0.4;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.15;
        } else if (type === 'escape') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = -Math.random() * 3 - 1;
            this.color = '#a08060';
            this.size = Math.random() * 3 + 1;
            this.baseSize = this.size;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        } else if (type === 'sparkle') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.color = '#00ffff';
            this.size = Math.random() * 3 + 1;
            this.baseSize = this.size;
            this.decay = 0.03;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        } else if (type === 'freeze_burst') {
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.color = '#3498db';
            this.size = Math.random() * 5 + 3;
            this.baseSize = this.size;
            this.decay = 0.02;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.12;
        } else if (type === 'attract_burst') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.color = '#9b59b6';
            this.size = Math.random() * 4 + 2;
            this.baseSize = this.size;
            this.decay = 0.025;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.15;
        } else if (type === 'speed_burst') {
            this.vx = (Math.random() - 0.5) * 5;
            this.vy = (Math.random() - 0.5) * 5;
            this.color = '#f1c40f';
            this.size = Math.random() * 4 + 2;
            this.baseSize = this.size;
            this.decay = 0.025;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.15;
        } else if (type === 'heart') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = -Math.random() * 2 - 1;
            this.color = '#e74c3c';
            this.size = Math.random() * 4 + 3;
            this.baseSize = this.size;
            this.decay = 0.02;
            this.rotation = 0;
            this.rotationSpeed = 0;
        } else if (type === 'deposit') {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = -Math.random() * 3 - 1;
            this.color = '#ffd700';
            this.size = Math.random() * 3 + 2;
            this.baseSize = this.size;
            this.decay = 0.03;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.15;
        } else if (type === 'poof') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = -Math.random() * 4 - 1;
            this.color = '#cccccc';
            this.size = Math.random() * 5 + 3;
            this.baseSize = this.size;
            this.decay = 0.04;
            this.rotation = 0;
            this.rotationSpeed = 0;
        }
    }

    update() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.age += this.decay;

        // Subtle size scaling: grow slightly then shrink
        const lifePct = 1.0 - this.life; // 0→1 over lifetime
        const scale = lifePct < 0.2 ? 0.6 + lifePct * 2.0 : 1.0 - (lifePct - 0.2) * 0.5;
        this.size = this.baseSize * Math.max(0.2, scale);

        if (this.type === 'escape') {
            this.vy += 0.1; // gravity
            // Dust clouds grow
            this.size = this.baseSize * (1.0 + (1.0 - this.life) * 0.8);
        }

        if (this.rotation !== undefined) {
            this.rotation += this.rotationSpeed || 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        if (this.rotation) ctx.rotate(this.rotation);

        const s = this.size;

        if (this.type === 'catch' && this.isFeather) {
            // Feather-shaped tear-drop
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(s * 0.6, -s * 0.3, 0, s);
            ctx.quadraticCurveTo(-s * 0.6, -s * 0.3, 0, -s);
            ctx.fill();
            // Spine line
            ctx.strokeStyle = '#c9960a';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(0, s);
            ctx.stroke();
        } else if (this.type === 'freeze_burst') {
            // Snowflake: 6 arms
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI) / 3;
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
                // Small branches
                const bx = Math.cos(a) * s * 0.6;
                const by = Math.sin(a) * s * 0.6;
                const pa = a + 0.5;
                const pb = a - 0.5;
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(pa) * s * 0.25, by + Math.sin(pa) * s * 0.25);
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(pb) * s * 0.25, by + Math.sin(pb) * s * 0.25);
            }
            ctx.stroke();
        } else if (this.type === 'speed_burst') {
            // Lightning bolt zigzag
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-s * 0.3, -s);
            ctx.lineTo(s * 0.2, -s * 0.2);
            ctx.lineTo(-s * 0.15, 0);
            ctx.lineTo(s * 0.3, s);
            ctx.stroke();
        } else if (this.type === 'attract_burst') {
            // Spiral wisp — elongated ellipse
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.3, s, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'escape') {
            // Dust cloud — soft expanding circle with gradient
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
            grad.addColorStop(0, colorWithAlpha(this.color, 0.6));
            grad.addColorStop(1, colorWithAlpha(this.color, 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'heart') {
            // Heart shape using bezier arcs
            ctx.fillStyle = this.color;
            const hs = s * 0.5;
            ctx.beginPath();
            ctx.moveTo(0, hs * 0.6);
            ctx.bezierCurveTo(-hs, -hs * 0.2, -hs * 0.6, -hs, 0, -hs * 0.4);
            ctx.bezierCurveTo(hs * 0.6, -hs, hs, -hs * 0.2, 0, hs * 0.6);
            ctx.fill();
        } else if (this.type === 'poof') {
            // Soft expanding poof circle
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
            grad.addColorStop(0, colorWithAlpha(this.color, 0.5));
            grad.addColorStop(1, colorWithAlpha(this.color, 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Default: soft gradient circle (sparkle, catch-sparkle, deposit)
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, this.color);
            grad.addColorStop(1, colorWithAlpha(this.color, 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
//  2. WIZARD SPARKLE — 4-point star with glow & twinkle
// ═══════════════════════════════════════════════════════════════
class WizardSparkle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y + (Math.random() - 0.5) * 20;
        this.prevX = this.x;
        this.prevY = this.y;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1 - 0.5;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = Math.random() * 3 + 1;
        this.hue = Math.random() * 60 + 180; // Cyan to blue range
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.15;
        // Occasional warm gold sparkle
        this.isGold = Math.random() < 0.25;
        // Twinkle phase offset
        this.twinklePhase = Math.random() * Math.PI * 2;
    }

    update() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy *= 0.98;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        // Twinkling intensity: alpha oscillates
        const twinkle = 0.5 + 0.5 * Math.sin(this.twinklePhase + (1.0 - this.life) * 12);
        const alpha = this.life * 0.8 * twinkle;
        if (alpha < 0.01) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Trail ghost at lower alpha
        const dx = this.x - this.prevX;
        const dy = this.y - this.prevY;
        if (dx * dx + dy * dy > 0.5) {
            ctx.globalAlpha = alpha * 0.3;
            ctx.translate(this.prevX, this.prevY);
            ctx.rotate(this.rotation - this.rotationSpeed);
            const coreColor = this.isGold ? '#ffd700' : `hsl(${this.hue}, 100%, 70%)`;
            ctx.fillStyle = coreColor;
            drawStar4(ctx, this.size * 0.6, this.size * 0.2);
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = alpha;
        }

        // Main star
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const s = this.size;

        // Glow (radial gradient behind)
        const glowColor = this.isGold ? '#ffd700' : `hsl(${this.hue}, 100%, 50%)`;
        const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.5);
        glowGrad.addColorStop(0, colorWithAlpha(glowColor, 0.4));
        glowGrad.addColorStop(1, colorWithAlpha(glowColor, 0));
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, s * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 4-point star with gradient: white core → gold/cyan edge
        const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        starGrad.addColorStop(0, '#ffffff');
        if (this.isGold) {
            starGrad.addColorStop(0.5, '#ffd700');
            starGrad.addColorStop(1, 'rgba(255,215,0,0)');
        } else {
            starGrad.addColorStop(0.5, `hsl(${this.hue}, 100%, 70%)`);
            starGrad.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);
        }
        ctx.fillStyle = starGrad;
        drawStar4(ctx, s, s * 0.3);
        ctx.fill();

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
//  3. MAGIC BURST — Expanding ring + inner sparkles + glow
// ═══════════════════════════════════════════════════════════════
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
        // Ring particle vs inner sparkle
        this.isRing = Math.random() < 0.2;
        this.ringRadius = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
        if (this.isRing) {
            this.ringRadius += 2.5;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.life;

        if (this.isRing) {
            // Expanding ring that fades
            const ringColor = `hsl(${this.hue}, 100%, 60%)`;
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = Math.max(0.5, 2.5 * this.life);
            ctx.beginPath();
            ctx.arc(0, 0, this.ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner glow
            const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.ringRadius);
            glowGrad.addColorStop(0, `hsla(${this.hue}, 100%, 80%, ${0.2 * this.life})`);
            glowGrad.addColorStop(1, `hsla(${this.hue}, 100%, 60%, 0)`);
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.ringRadius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.rotate(this.rotation);

            // Soft glow behind
            const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
            glowGrad.addColorStop(0, `hsla(${this.hue}, 100%, 70%, 0.5)`);
            glowGrad.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Diamond sparkle shape
            const s = this.size;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, `hsl(${this.hue}, 100%, 60%)`);
            grad.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.7, 0);
            ctx.lineTo(0, s);
            ctx.lineTo(-s * 0.7, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
//  4. MAGIC RUNE — Recognizable bezier-drawn spell symbols
// ═══════════════════════════════════════════════════════════════
class MagicRune {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 40;
        this.y = y + (Math.random() - 0.5) * 40;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -1 - Math.random() * 0.5;
        this.life = 1.0;
        this.decay = 0.015;
        this.size = 12 + Math.random() * 8;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.runeType = Math.floor(Math.random() * 8);
        this.floatPhase = Math.random() * Math.PI * 2;
        this.age = 0;
    }

    update() {
        this.age += this.decay;
        // Float animation — gentle sine drift
        this.x += this.vx + Math.sin(this.floatPhase + this.age * 5) * 0.3;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
    }

    draw(ctx) {
        // Fade in → hold → fade out lifecycle
        let alpha;
        if (this.age < 0.15) {
            alpha = (this.age / 0.15) * 0.8; // fade in
        } else if (this.life < 0.3) {
            alpha = (this.life / 0.3) * 0.8; // fade out
        } else {
            alpha = 0.8; // hold
        }

        // Pulse brightness
        const pulse = 0.8 + 0.2 * Math.sin(this.age * 20);
        alpha *= pulse;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = alpha;

        const s = this.size;

        // Glow aura ring
        const glowGrad = ctx.createRadialGradient(0, 0, s * 0.3, 0, 0, s * 0.8);
        glowGrad.addColorStop(0, 'rgba(255,215,0,0.3)');
        glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Rune stroke
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();

        switch (this.runeType) {
            case 0: // Snowflake ❄ (freeze)
                for (let i = 0; i < 6; i++) {
                    const a = (i * Math.PI) / 3;
                    ctx.moveTo(0, 0);
                    const ex = Math.cos(a) * s * 0.5;
                    const ey = Math.sin(a) * s * 0.5;
                    ctx.lineTo(ex, ey);
                    // Small V branches at 60 %
                    const bx = Math.cos(a) * s * 0.3;
                    const by = Math.sin(a) * s * 0.3;
                    ctx.moveTo(bx, by);
                    ctx.lineTo(
                        bx + Math.cos(a + 0.6) * s * 0.15,
                        by + Math.sin(a + 0.6) * s * 0.15
                    );
                    ctx.moveTo(bx, by);
                    ctx.lineTo(
                        bx + Math.cos(a - 0.6) * s * 0.15,
                        by + Math.sin(a - 0.6) * s * 0.15
                    );
                }
                break;

            case 1: // Spiral (attract)
                for (let t = 0; t < 12; t++) {
                    const angle = t * 0.55;
                    const r = (t / 12) * s * 0.5;
                    const sx = Math.cos(angle) * r;
                    const sy = Math.sin(angle) * r;
                    if (t === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                break;

            case 2: // Lightning ⚡ (speed)
                ctx.moveTo(-s * 0.15, -s * 0.5);
                ctx.lineTo(s * 0.1, -s * 0.1);
                ctx.lineTo(-s * 0.05, 0);
                ctx.lineTo(s * 0.2, s * 0.5);
                break;

            case 3: // Pentagram star
                for (let i = 0; i < 5; i++) {
                    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    const px = Math.cos(a) * s * 0.5;
                    const py = Math.sin(a) * s * 0.5;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;

            case 4: // Crescent moon
                ctx.arc(0, 0, s * 0.4, -Math.PI * 0.7, Math.PI * 0.7);
                ctx.arc(s * 0.15, 0, s * 0.3, Math.PI * 0.6, -Math.PI * 0.6, true);
                break;

            case 5: // Infinity loop
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(s * 0.3, -s * 0.35, s * 0.5, -s * 0.35, s * 0.5, 0);
                ctx.bezierCurveTo(s * 0.5, s * 0.35, s * 0.3, s * 0.35, 0, 0);
                ctx.bezierCurveTo(-s * 0.3, -s * 0.35, -s * 0.5, -s * 0.35, -s * 0.5, 0);
                ctx.bezierCurveTo(-s * 0.5, s * 0.35, -s * 0.3, s * 0.35, 0, 0);
                break;

            case 6: // Circle with cross (classic rune)
                ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
                ctx.moveTo(0, -s * 0.4);
                ctx.lineTo(0, s * 0.4);
                ctx.moveTo(-s * 0.4, 0);
                ctx.lineTo(s * 0.4, 0);
                break;

            case 7: // Triangle with eye
                ctx.moveTo(0, -s * 0.5);
                ctx.lineTo(s * 0.45, s * 0.35);
                ctx.lineTo(-s * 0.45, s * 0.35);
                ctx.closePath();
                // Eye in center
                ctx.moveTo(s * 0.1, 0);
                ctx.arc(0, 0, s * 0.1, 0, Math.PI * 2);
                break;
        }

        ctx.stroke();

        // Thin glow outline ring
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
//  5. PAW PRINT — Actual paw print with pad + toes + dirt color
// ═══════════════════════════════════════════════════════════════
class PawPrint {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.rotation = Math.atan2(vy, vx) + Math.PI / 2;
        this.life = 1.0;
        this.decay = 0.008;
        this.size = 6;
        // Dirt color variation
        const browns = ['#3d3226', '#4a3828', '#3e2f1e', '#45362a'];
        this.color = browns[Math.floor(Math.random() * browns.length)];
        // Slight toe size variation
        this.toeVariation = [
            0.9 + Math.random() * 0.3,
            0.9 + Math.random() * 0.3,
            0.9 + Math.random() * 0.3,
            0.9 + Math.random() * 0.3,
        ];
    }

    update() {
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Darker when fresh, fading over time
        const darkFactor = 0.3 + this.life * 0.4;
        ctx.globalAlpha = darkFactor;
        ctx.fillStyle = this.color;

        // Main pad — bean shape (ellipse)
        ctx.beginPath();
        ctx.ellipse(0, 2, 3.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4 toe beans with variation
        const toePositions = [
            { x: -4.5, y: -3 },
            { x: -1.5, y: -5 },
            { x: 1.5, y: -5 },
            { x: 4.5, y: -3 },
        ];
        for (let i = 0; i < 4; i++) {
            const tp = toePositions[i];
            const r = 1.5 * this.toeVariation[i];
            ctx.beginPath();
            ctx.ellipse(tp.x, tp.y, r, r * 1.1, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Subtle pad texture — slightly darker center
        ctx.globalAlpha = darkFactor * 0.3;
        ctx.fillStyle = '#1a1008';
        ctx.beginPath();
        ctx.ellipse(0, 2.5, 1.8, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
//  6. STAR BURST — Multi-pointed stars with confetti motion
// ═══════════════════════════════════════════════════════════════
class StarBurst {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = 0.03;
        this.size = 8 + Math.random() * 6;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        // Multiple warm colors
        const colors = ['#ffd700', '#ffffff', '#ffcc44', '#ffaa22', '#ffe680'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        // Number of star points (variety)
        this.points = Math.random() < 0.5 ? 5 : 6;
        // Confetti drift
        this.driftPhase = Math.random() * Math.PI * 2;
        this.driftAmp = 0.3 + Math.random() * 0.5;
    }

    update() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += this.vx;
        this.y += this.vy;
        // Confetti-like floating: slight sine drift
        this.x += Math.sin(this.driftPhase + (1.0 - this.life) * 8) * this.driftAmp;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();

        // Trail sparkle at previous position
        const dx = this.x - this.prevX;
        const dy = this.y - this.prevY;
        if (dx * dx + dy * dy > 1) {
            ctx.globalAlpha = this.life * 0.25;
            ctx.translate(this.prevX, this.prevY);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        // Main star
        ctx.translate(this.x, this.y);
        // Scale animation: slight pulse
        const scalePulse = 1.0 + 0.15 * Math.sin((1.0 - this.life) * 15);
        ctx.scale(scalePulse, scalePulse);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life;

        // Glow
        const outer = this.size;
        const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outer * 1.5);
        glowGrad.addColorStop(0, colorWithAlpha(this.color, 0.35));
        glowGrad.addColorStop(1, colorWithAlpha(this.color, 0));
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, outer * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Star shape with gradient fill
        const inner = outer * 0.4;
        const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outer);
        starGrad.addColorStop(0, '#ffffff');
        starGrad.addColorStop(0.4, this.color);
        starGrad.addColorStop(1, colorWithAlpha(this.color, 0.3));
        ctx.fillStyle = starGrad;
        drawStarN(ctx, this.points, outer, inner);
        ctx.fill();

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
//  7. WOOD PARTICLE — Irregular splinter shapes + sawdust
// ═══════════════════════════════════════════════════════════════
class WoodParticle {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.01;
        this.size = 3 + Math.random() * 4;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
        // Wood color variation
        const woodColors = ['#8b4513', '#a0522d', '#cd853f', '#8b5a2b', '#d2a679', '#6b3410'];
        this.color = woodColors[Math.floor(Math.random() * woodColors.length)];
        this.gravity = 0.3;
        // Splinter type: 0 = chip, 1 = shard, 2 = sawdust
        const r = Math.random();
        if (r < 0.15) {
            this.splinterType = 2; // sawdust — tiny
            this.size = 1 + Math.random() * 1.5;
            this.color = '#d2a679'; // lighter
            this.decay = 0.03 + Math.random() * 0.02;
        } else if (r < 0.5) {
            this.splinterType = 1; // shard — irregular polygon
        } else {
            this.splinterType = 0; // chip — elongated
        }
        // Random irregular shape vertices (for shard type)
        if (this.splinterType === 1) {
            const pts = 4 + Math.floor(Math.random() * 3);
            this.vertices = [];
            for (let i = 0; i < pts; i++) {
                const a = (i / pts) * Math.PI * 2;
                const r2 = this.size * (0.5 + Math.random() * 0.5);
                this.vertices.push({
                    x: Math.cos(a) * r2,
                    y: Math.sin(a) * r2 * (0.3 + Math.random() * 0.4),
                });
            }
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.98;
        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;

        if (this.splinterType === 2) {
            // Sawdust: tiny soft dot
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.splinterType === 1 && this.vertices) {
            // Irregular shard polygon
            ctx.beginPath();
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            for (let i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();
            // Dark grain line
            ctx.strokeStyle = '#5D3A1A';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.3, 0);
            ctx.lineTo(this.size * 0.3, 0);
            ctx.stroke();
        } else {
            // Elongated chip (tapered rectangle)
            const s = this.size;
            ctx.beginPath();
            ctx.moveTo(-s * 0.5, -s * 0.15);
            ctx.lineTo(s * 0.5, -s * 0.1);
            ctx.lineTo(s * 0.4, s * 0.12);
            ctx.lineTo(-s * 0.5, s * 0.18);
            ctx.closePath();
            ctx.fill();
            // Wood grain line
            ctx.strokeStyle = '#5D3A1A';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(-s * 0.4, 0);
            ctx.lineTo(s * 0.4, 0);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
//  8. FEATHER PARTICLE — Chicken feathers with flutter motion
// ═══════════════════════════════════════════════════════════════
class FeatherParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 2 - 0.5;
        this.life = 1.0;
        this.decay = 0.012 + Math.random() * 0.008;
        this.size = 4 + Math.random() * 4;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.color = color || '#FFFAF0';
        this.flutterPhase = Math.random() * Math.PI * 2;
        this.gravity = 0.03;
    }

    update() {
        // Flutter drift: sine wave horizontal + slow fall
        this.x += this.vx + Math.sin(this.flutterPhase + (1.0 - this.life) * 6) * 0.8;
        this.y += this.vy;
        this.vy += this.gravity; // gentle gravity
        this.vx *= 0.99;
        this.rotation += this.rotationSpeed + Math.cos(this.flutterPhase + (1.0 - this.life) * 6) * 0.05;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life * 0.9;

        const s = this.size;

        // Feather shape: two bezier curves forming a leaf/feather
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.5, -s * 0.3, s * 0.15, s * 0.8);
        ctx.quadraticCurveTo(0, s, 0, s);
        ctx.quadraticCurveTo(0, s, -s * 0.15, s * 0.8);
        ctx.quadraticCurveTo(-s * 0.5, -s * 0.3, 0, -s);
        ctx.fill();

        // Central spine
        ctx.strokeStyle = colorWithAlpha(this.color, 0.5);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(0, s * 0.8);
        ctx.stroke();

        // A few barb lines
        for (let i = 0; i < 3; i++) {
            const t = 0.2 + i * 0.25;
            const py = -s + t * s * 1.8;
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(s * 0.3 * (1 - t), py + s * 0.1);
            ctx.moveTo(0, py);
            ctx.lineTo(-s * 0.3 * (1 - t), py + s * 0.1);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
//  9. DUST PUFF — Ground impact / chicken running dust
// ═══════════════════════════════════════════════════════════════
class DustPuff {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 8;
        this.y = y + (Math.random() - 0.5) * 4;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = -Math.random() * 1 - 0.3;
        this.life = 1.0;
        this.decay = 0.04 + Math.random() * 0.03; // Quick fade
        this.size = 3 + Math.random() * 5;
        this.baseSize = this.size;
        // Brown/tan translucent
        const tans = ['#c4a77d', '#b89b72', '#a08060', '#c9b896'];
        this.color = tans[Math.floor(Math.random() * tans.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy *= 0.95;
        this.vx *= 0.95;
        this.life -= this.decay;
        // Expanding soft circle
        this.size = this.baseSize * (1.0 + (1.0 - this.life) * 1.5);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.life * 0.5;

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        grad.addColorStop(0, colorWithAlpha(this.color, 0.5));
        grad.addColorStop(0.6, colorWithAlpha(this.color, 0.2));
        grad.addColorStop(1, colorWithAlpha(this.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
// 10. HEART PARTICLE — Depositing chickens safely
// ═══════════════════════════════════════════════════════════════
class HeartParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 16;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = -1.5 - Math.random() * 1;
        this.life = 1.0;
        this.decay = 0.018 + Math.random() * 0.01;
        this.size = 5 + Math.random() * 4;
        this.driftPhase = Math.random() * Math.PI * 2;
        // Pink/red gradient colors
        this.isRed = Math.random() < 0.4;
    }

    update() {
        this.x += this.vx + Math.sin(this.driftPhase + (1.0 - this.life) * 4) * 0.4;
        this.y += this.vy;
        this.vy *= 0.99;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.life * 0.85;

        const s = this.size;

        // Soft glow behind heart
        const glowColor = this.isRed ? '#e74c3c' : '#ff69b4';
        const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.5);
        glowGrad.addColorStop(0, colorWithAlpha(glowColor, 0.25));
        glowGrad.addColorStop(1, colorWithAlpha(glowColor, 0));
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Heart shape via two bezier arcs
        const fillColor = this.isRed ? '#e74c3c' : '#ff69b4';
        const grad = ctx.createRadialGradient(0, -s * 0.15, s * 0.1, 0, 0, s);
        grad.addColorStop(0, '#ffb0c0');
        grad.addColorStop(0.6, fillColor);
        grad.addColorStop(1, colorWithAlpha(fillColor, 0.4));
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(-s * 0.8, -s * 0.1, -s * 0.5, -s * 0.75, 0, -s * 0.3);
        ctx.bezierCurveTo(s * 0.5, -s * 0.75, s * 0.8, -s * 0.1, 0, s * 0.4);
        ctx.fill();

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE SYSTEM — public API preserved
// ═══════════════════════════════════════════════════════════════
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

    spawnPawPrint(x, y, vx, vy) {
        this.particles.push(new PawPrint(x, y, vx, vy));
    }

    spawnStarBurst(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new StarBurst(x, y));
        }
    }

    spawnWoodParticle(x, y, angle, speed) {
        this.particles.push(new WoodParticle(x, y, angle, speed));
    }

    spawnFeather(x, y, color) {
        this.particles.push(new FeatherParticle(x, y, color));
    }

    spawnDustPuff(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new DustPuff(x, y));
        }
    }

    spawnHeart(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new HeartParticle(x, y));
        }
    }

    update() {
        this.particles = this.particles.filter((p) => {
            p.update();
            return p.life > 0;
        });
    }

    draw(ctx) {
        this.particles.forEach((p) => p.draw(ctx));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Particle,
        WizardSparkle,
        MagicBurst,
        MagicRune,
        PawPrint,
        StarBurst,
        WoodParticle,
        FeatherParticle,
        DustPuff,
        HeartParticle,
        ParticleSystem,
    };
}
