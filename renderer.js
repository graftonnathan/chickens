/**
 * Renderer - Handles all Canvas 2D drawing for enclosed backyard
 * Coop on ground, N/E/W fences, house roof on south
 *
 * Phase 1: Offscreen canvas caching + texture toolkit
 * Phase 2: Illustrative storybook-style background & environment
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // --- Phase 1: Caching infrastructure ---
        /** @type {HTMLCanvasElement|null} */
        this._bgCache = null;
        /** @type {HTMLCanvasElement|null} */
        this._roofCache = null;
        /** @type {HTMLCanvasElement|null} */
        this._grassTile = null;
        this._cachedWidth = 0;
        this._cachedHeight = 0;

        // Deterministic seed for pseudo-random decoration placement
        this._seed = 42;
    }

    // =========================================================================
    //  Phase 1 — Caching Infrastructure
    // =========================================================================

    /**
     * Create an offscreen canvas of the given size
     * @param {number} w
     * @param {number} h
     * @returns {HTMLCanvasElement}
     */
    _createOffscreen(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    /**
     * Invalidate all cached canvases (call on resize)
     */
    invalidateCache() {
        this._bgCache = null;
        this._roofCache = null;
        this._grassTile = null;
        this._cachedWidth = 0;
        this._cachedHeight = 0;
    }

    /**
     * Check if cache needs rebuilding (dimensions changed)
     * @returns {boolean}
     */
    _isCacheValid() {
        return (
            this._bgCache !== null &&
            this._cachedWidth === this.canvas.width &&
            this._cachedHeight === this.canvas.height
        );
    }

    /**
     * Build (or rebuild) all background caches
     */
    _ensureCache() {
        if (this._isCacheValid()) return;

        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this._cachedWidth = this.width;
        this._cachedHeight = this.height;

        // --- Grass tile (64x64) ---
        this._grassTile = this._createOffscreen(64, 64);
        this._renderGrassTile(this._grassTile.getContext('2d'));

        // --- Full background cache ---
        this._bgCache = this._createOffscreen(this.width, this.height);
        const bgCtx = this._bgCache.getContext('2d');
        this._renderSky(bgCtx);
        this._renderLawn(bgCtx);
        this._renderNorthFence(bgCtx);
        this._renderEastFence(bgCtx);
        this._renderWestFence(bgCtx);
        this._renderHouseSiding(bgCtx);
        this._renderGroundDetails(bgCtx);
        this._renderProps(bgCtx);

        // --- Roof cache ---
        this._roofCache = this._createOffscreen(this.width, this.height);
        const roofCtx = this._roofCache.getContext('2d');
        this._renderHouseRoof(roofCtx);
    }

    // =========================================================================
    //  Phase 1 — Texture Toolkit Utilities
    // =========================================================================

    /**
     * Seeded pseudo-random number generator (mulberry32)
     * @param {number} seed
     * @returns {function(): number} Returns values in [0,1)
     */
    _seededRandom(seed) {
        let s = seed | 0;
        return function () {
            s = (s + 0x6d2b79f5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Fill a rectangular region with noise stipple dots
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {string[]} colors - Array of dot colors
     * @param {number} count - Number of dots
     * @param {number} [dotSize=1] - Pixel size of each dot
     * @param {number} [seed=0]
     */
    _stippleRect(ctx, x, y, w, h, colors, count, dotSize = 1, seed = 0) {
        const rand = this._seededRandom(seed);
        for (let i = 0; i < count; i++) {
            ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
            ctx.fillRect(
                x + rand() * w,
                y + rand() * h,
                dotSize,
                dotSize
            );
        }
    }

    /**
     * Draw wood grain lines on a rectangular area
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {boolean} [vertical=true] - Grain direction
     * @param {number} [seed=0]
     */
    _woodGrain(ctx, x, y, w, h, vertical = true, seed = 0) {
        const rand = this._seededRandom(seed);
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 0.5;

        const lineCount = vertical ? Math.floor(w / 3) : Math.floor(h / 3);
        for (let i = 0; i < lineCount; i++) {
            if (rand() > 0.4) continue; // sparse lines
            ctx.beginPath();
            if (vertical) {
                const lx = x + rand() * w;
                ctx.moveTo(lx, y);
                ctx.quadraticCurveTo(
                    lx + (rand() - 0.5) * 3,
                    y + h * 0.5,
                    lx + (rand() - 0.5) * 2,
                    y + h
                );
            } else {
                const ly = y + rand() * h;
                ctx.moveTo(x, ly);
                ctx.quadraticCurveTo(
                    x + w * 0.5,
                    ly + (rand() - 0.5) * 3,
                    x + w,
                    ly + (rand() - 0.5) * 2
                );
            }
            ctx.stroke();
        }

        // Occasional knots
        if (rand() < 0.15) {
            const kx = x + rand() * w;
            const ky = y + rand() * h;
            ctx.fillStyle = '#3E2723';
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.ellipse(kx, ky, 2, 3, rand() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Create a multi-stop linear gradient
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {Array<[number, string]>} stops - Array of [position, color]
     * @returns {CanvasGradient}
     */
    _multiGradient(ctx, x0, y0, x1, y1, stops) {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        for (const [pos, color] of stops) {
            g.addColorStop(pos, color);
        }
        return g;
    }

    /**
     * Draw an organic/wobble line using quadratic bezier curves
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} [wobble=3] - Maximum wobble offset
     * @param {number} [segments=4] - Number of curve segments
     * @param {number} [seed=0]
     */
    _wobbleLine(ctx, x0, y0, x1, y1, wobble = 3, segments = 4, seed = 0) {
        const rand = this._seededRandom(seed);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const mx = x0 + (x1 - x0) * (t - 0.5 / segments);
            const my = y0 + (y1 - y0) * (t - 0.5 / segments);
            const ex = x0 + (x1 - x0) * t;
            const ey = y0 + (y1 - y0) * t;
            ctx.quadraticCurveTo(
                mx + (rand() - 0.5) * wobble,
                my + (rand() - 0.5) * wobble,
                ex + (i < segments ? (rand() - 0.5) * wobble * 0.5 : 0),
                ey + (i < segments ? (rand() - 0.5) * wobble * 0.5 : 0)
            );
        }
    }

    /**
     * Draw an organic ellipse with slight bezier wobble
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} cx
     * @param {number} cy
     * @param {number} rx
     * @param {number} ry
     * @param {number} [wobble=2]
     * @param {number} [seed=0]
     */
    _organicEllipse(ctx, cx, cy, rx, ry, wobble = 2, seed = 0) {
        const rand = this._seededRandom(seed);
        const points = 8;
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const nextAngle = ((i + 1) / points) * Math.PI * 2;
            const px = cx + Math.cos(angle) * (rx + (rand() - 0.5) * wobble);
            const py = cy + Math.sin(angle) * (ry + (rand() - 0.5) * wobble);
            const npx = cx + Math.cos(nextAngle) * (rx + (rand() - 0.5) * wobble);
            const npy = cy + Math.sin(nextAngle) * (ry + (rand() - 0.5) * wobble);
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                const cpx = (px + npx) / 2 + (rand() - 0.5) * wobble;
                const cpy = (py + npy) / 2 + (rand() - 0.5) * wobble;
                ctx.quadraticCurveTo(cpx, cpy, px, py);
            }
        }
        ctx.closePath();
    }

    // =========================================================================
    //  Public API (called from game.js — signatures preserved)
    // =========================================================================

    clear() {
        this._ensureCache();
        // Blit cached background in a single drawImage call
        this.ctx.drawImage(this._bgCache, 0, 0);
    }

    clearWithRoof() {
        // Original clear for compatibility - draws everything including roof
        this.clear();
        this.drawHouseRoof();
    }

    // =========================================================================
    //  Phase 2 — Sky Rendering
    // =========================================================================

    drawSky() {
        this._renderSky(this.ctx);
    }

    /**
     * Render the sky to a given context (used for caching)
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderSky(ctx) {
        // Warm multi-stop gradient: deep blue zenith → powder blue → peach horizon
        const gradient = this._multiGradient(ctx, 0, 0, 0, 200, [
            [0, '#5B9BD5'],      // zenith — rich sky blue
            [0.4, '#87CEEB'],    // mid sky
            [0.75, '#B0E0E6'],   // powder blue
            [0.92, '#E8D8C8'],   // warm peach-tint at horizon
            [1, '#F5E6D3'],      // faint warm amber at horizon line
        ]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, 200);

        // Subtle sun glow — top-right radial
        const sunGlow = ctx.createRadialGradient(
            this.width - 80, 30, 10,
            this.width - 80, 30, 160
        );
        sunGlow.addColorStop(0, 'rgba(255,240,200,0.25)');
        sunGlow.addColorStop(0.4, 'rgba(255,240,200,0.10)');
        sunGlow.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, this.width, 200);

        // Draw layered clouds
        this._renderCloud(ctx, 120, 55, 40, 101);
        this._renderCloud(ctx, 500, 38, 50, 202);
        this._renderCloud(ctx, 340, 80, 32, 303);
    }

    drawCloud(x, y, size) {
        this._renderCloud(this.ctx, x, y, size, 0);
    }

    /**
     * Render a single layered cloud with soft edges
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} size
     * @param {number} seed
     */
    _renderCloud(ctx, x, y, size, seed) {
        const rand = this._seededRandom(seed);

        ctx.save();

        // Shadow layer underneath
        ctx.fillStyle = 'rgba(180,200,220,0.15)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + size * 0.35, size * 1.2, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base large cloud layer — low alpha, broad shape
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 1.1, size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Middle puffs — 5-6 overlapping ellipses
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        const puffCount = 5 + Math.floor(rand() * 2);
        for (let i = 0; i < puffCount; i++) {
            const px = x + (rand() - 0.5) * size * 1.4;
            const py = y + (rand() - 0.5) * size * 0.4;
            const pr = size * (0.3 + rand() * 0.35);
            ctx.beginPath();
            ctx.ellipse(px, py, pr, pr * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highlight layer — smaller bright spots
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 3; i++) {
            const hx = x + (rand() - 0.4) * size * 0.8;
            const hy = y - size * 0.1 + rand() * size * 0.2;
            const hr = size * (0.2 + rand() * 0.2);
            ctx.beginPath();
            ctx.ellipse(hx, hy, hr, hr * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Top-right bright highlight (sunlit edge)
        ctx.fillStyle = 'rgba(255,252,240,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.3, y - size * 0.15, size * 0.25, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // =========================================================================
    //  Phase 2 — Grass/Ground Rendering
    // =========================================================================

    drawLawn() {
        this._renderLawn(this.ctx);
    }

    /**
     * Pre-render a 64x64 grass texture tile
     * @param {CanvasRenderingContext2D} tCtx
     */
    _renderGrassTile(tCtx) {
        // Base green fill
        tCtx.fillStyle = '#4CAF50';
        tCtx.fillRect(0, 0, 64, 64);

        // Stipple dots for organic texture
        this._stippleRect(
            tCtx, 0, 0, 64, 64,
            ['#43A047', '#66BB6A', '#388E3C', '#81C784'],
            200, 1, 7777
        );

        // Small grass blade strokes
        const rand = this._seededRandom(8888);
        tCtx.lineWidth = 1;
        for (let i = 0; i < 30; i++) {
            const bx = rand() * 64;
            const by = rand() * 64;
            const angle = -Math.PI / 2 + (rand() - 0.5) * 0.6;
            const len = 3 + rand() * 4;
            tCtx.strokeStyle = rand() > 0.5 ? '#2E7D32' : '#66BB6A';
            tCtx.beginPath();
            tCtx.moveTo(bx, by);
            tCtx.lineTo(bx + Math.cos(angle) * len, by + Math.sin(angle) * len);
            tCtx.stroke();
        }
    }

    /**
     * Render lawn/ground to a given context
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderLawn(ctx) {
        const lawnX = 20;
        const lawnY = 80;
        const lawnW = 760;
        const lawnH = 520;

        // --- Base gradient fill (lighter center, darker edges) ---
        const baseGrad = ctx.createRadialGradient(
            lawnX + lawnW / 2, lawnY + lawnH / 2, 50,
            lawnX + lawnW / 2, lawnY + lawnH / 2, lawnW * 0.6
        );
        baseGrad.addColorStop(0, '#5CBF60');   // lighter center
        baseGrad.addColorStop(0.6, '#4CAF50'); // base green
        baseGrad.addColorStop(1, '#388E3C');   // darker edges
        ctx.fillStyle = baseGrad;
        ctx.fillRect(lawnX, lawnY, lawnW, lawnH);

        // --- Tile the pre-rendered grass texture ---
        if (this._grassTile) {
            ctx.save();
            ctx.globalAlpha = 0.35;
            const pattern = ctx.createPattern(this._grassTile, 'repeat');
            ctx.fillStyle = pattern;
            ctx.fillRect(lawnX, lawnY, lawnW, lawnH);
            ctx.restore();
        }

        // --- Sinusoidal mowing stripes ---
        ctx.save();
        ctx.globalAlpha = 0.08;
        for (let x = lawnX; x < lawnX + lawnW; x += 50) {
            const stripeIndex = Math.floor((x - lawnX) / 50);
            ctx.fillStyle = stripeIndex % 2 === 0 ? '#2E7D32' : '#81C784';
            // Simple rectangular stripes with slight wave implied by pattern
            ctx.fillRect(x, lawnY, 50, lawnH);
        }
        ctx.restore();

        // --- Scattered environmental details ---
        this._renderLawnDetails(ctx, lawnX, lawnY, lawnW, lawnH);

        // --- Edge vignette darkening ---
        ctx.save();
        const vignette = ctx.createRadialGradient(
            lawnX + lawnW / 2, lawnY + lawnH / 2, lawnW * 0.3,
            lawnX + lawnW / 2, lawnY + lawnH / 2, lawnW * 0.65
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.12)');
        ctx.fillStyle = vignette;
        ctx.fillRect(lawnX, lawnY, lawnW, lawnH);
        ctx.restore();
    }

    /**
     * Scatter small flowers, pebbles, dirt patches, clovers
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} lx
     * @param {number} ly
     * @param {number} lw
     * @param {number} lh
     */
    _renderLawnDetails(ctx, lx, ly, lw, lh) {
        const rand = this._seededRandom(5555);

        ctx.save();

        // --- Tiny flowers (15 total) ---
        const flowerColors = ['#FF6B6B', '#FFD93D', '#FF69B4', '#E8A0BF', '#FFF176'];
        for (let i = 0; i < 15; i++) {
            const fx = lx + 20 + rand() * (lw - 40);
            const fy = ly + 20 + rand() * (lh - 40);
            const fc = flowerColors[Math.floor(rand() * flowerColors.length)];
            // 3-petal mini flower
            ctx.fillStyle = fc;
            ctx.globalAlpha = 0.7;
            for (let p = 0; p < 3; p++) {
                const angle = (p / 3) * Math.PI * 2;
                ctx.beginPath();
                ctx.ellipse(
                    fx + Math.cos(angle) * 2,
                    fy + Math.sin(angle) * 2,
                    2, 1.5,
                    angle, 0, Math.PI * 2
                );
                ctx.fill();
            }
            // Center dot
            ctx.fillStyle = '#FFEB3B';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(fx, fy, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- Small pebbles (12 total) ---
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 12; i++) {
            const px = lx + 15 + rand() * (lw - 30);
            const py = ly + 15 + rand() * (lh - 30);
            const pr = 1.5 + rand() * 2;
            // Stone body
            ctx.fillStyle = rand() > 0.5 ? '#9E9E9E' : '#BDBDBD';
            ctx.beginPath();
            ctx.ellipse(px, py, pr, pr * 0.7, rand() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
            // Highlight dot
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(px - pr * 0.2, py - pr * 0.2, pr * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- Dirt patches (5 total) ---
        ctx.globalAlpha = 0.12;
        for (let i = 0; i < 5; i++) {
            const dx = lx + 30 + rand() * (lw - 60);
            const dy = ly + 30 + rand() * (lh - 60);
            ctx.fillStyle = '#795548';
            ctx.beginPath();
            ctx.ellipse(dx, dy, 8 + rand() * 12, 4 + rand() * 6, rand() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- Clover patches (8 total) ---
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 8; i++) {
            const cx = lx + 25 + rand() * (lw - 50);
            const cy = ly + 25 + rand() * (lh - 50);
            ctx.fillStyle = '#2E7D32';
            // 3 circles in triangle formation
            for (let j = 0; j < 3; j++) {
                const angle = (j / 3) * Math.PI * 2 - Math.PI / 2;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(angle) * 2.5, cy + Math.sin(angle) * 2.5, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // =========================================================================
    //  Phase 2 — Ground Details Layer (drawn after grass, before entities)
    // =========================================================================

    /**
     * Render ground details — tufts at edges, shadow under coop area, worn path
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderGroundDetails(ctx) {
        const rand = this._seededRandom(6666);

        ctx.save();

        // --- Small grass tufts along fence edges ---
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.6;

        // North edge tufts
        for (let i = 0; i < 25; i++) {
            const tx = 25 + rand() * 750;
            const ty = 82;
            for (let b = 0; b < 3; b++) {
                const angle = -Math.PI / 2 + (rand() - 0.5) * 0.8;
                const len = 4 + rand() * 5;
                ctx.beginPath();
                ctx.moveTo(tx + b * 2, ty);
                ctx.lineTo(tx + b * 2 + Math.cos(angle) * len, ty + Math.sin(angle) * len);
                ctx.stroke();
            }
        }

        // East edge tufts
        for (let i = 0; i < 20; i++) {
            const tx = 775;
            const ty = 85 + rand() * 505;
            for (let b = 0; b < 3; b++) {
                const angle = Math.PI + (rand() - 0.5) * 0.8;
                const len = 3 + rand() * 4;
                ctx.beginPath();
                ctx.moveTo(tx, ty + b * 2);
                ctx.lineTo(tx + Math.cos(angle) * len, ty + b * 2 + Math.sin(angle) * len);
                ctx.stroke();
            }
        }

        // West edge tufts
        for (let i = 0; i < 20; i++) {
            const tx = 25;
            const ty = 85 + rand() * 505;
            for (let b = 0; b < 3; b++) {
                const angle = (rand() - 0.5) * 0.8;
                const len = 3 + rand() * 4;
                ctx.beginPath();
                ctx.moveTo(tx, ty + b * 2);
                ctx.lineTo(tx + Math.cos(angle) * len, ty + b * 2 + Math.sin(angle) * len);
                ctx.stroke();
            }
        }

        // --- Subtle shadow under coop area (top-right quadrant) ---
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(650, 150, 80, 30, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // --- Worn path near house entrance (bottom center) ---
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.ellipse(400, 560, 60, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(400, 530, 35, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // =========================================================================
    //  Phase 2 — Fence Rendering (Wood Grain, Weathering, Organic)
    // =========================================================================

    drawNorthFence() {
        this._renderNorthFence(this.ctx);
    }

    /**
     * Render north fence with wood grain and weathering
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderNorthFence(ctx) {
        const fenceY = 40;
        const fenceHeight = 40;
        const picketWidth = 8;
        const picketGap = 4;
        const rand = this._seededRandom(1111);

        ctx.save();

        // --- Horizontal rails with 3D beveling ---
        const railY1 = fenceY + 10;
        const railY2 = fenceY + 25;
        for (const ry of [railY1, railY2]) {
            // Rail body
            ctx.fillStyle = '#F0EDE8';
            ctx.fillRect(0, ry, this.width, 6);
            // Light top edge
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(0, ry, this.width, 1);
            // Dark bottom edge
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(0, ry + 5, this.width, 1);
            // Grain on rail
            this._woodGrain(ctx, 0, ry, this.width, 6, false, 9900 + ry);
        }

        // --- Vertical pickets ---
        let picketSeed = 1000;
        for (let px = 0; px < this.width; px += picketWidth + picketGap) {
            picketSeed++;
            const pRand = this._seededRandom(picketSeed);

            // Slight color variation per picket
            const tint = Math.floor(pRand() * 20);
            const r = 240 + Math.floor(pRand() * 15);
            const g = 236 + Math.floor(pRand() * 12);
            const b = 228 + Math.floor(pRand() * 10);
            ctx.fillStyle = `rgb(${r},${g},${b})`;

            // Picket body
            ctx.fillRect(px, fenceY, picketWidth, fenceHeight);

            // Pointed top — organic bezier shape
            ctx.beginPath();
            ctx.moveTo(px, fenceY);
            ctx.quadraticCurveTo(
                px + picketWidth * 0.3, fenceY - 6 - pRand() * 3,
                px + picketWidth / 2, fenceY - 8 - pRand() * 2
            );
            ctx.quadraticCurveTo(
                px + picketWidth * 0.7, fenceY - 6 - pRand() * 3,
                px + picketWidth, fenceY
            );
            ctx.closePath();
            ctx.fill();

            // Wood grain on picket
            this._woodGrain(ctx, px, fenceY - 8, picketWidth, fenceHeight + 8, true, picketSeed + 500);

            // Shadow on right side of picket (light from top-right)
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(px, fenceY, 2, fenceHeight);

            // Grass staining on bottom 20%
            if (pRand() > 0.4) {
                ctx.fillStyle = 'rgba(76,175,80,0.08)';
                ctx.fillRect(px, fenceY + fenceHeight * 0.8, picketWidth, fenceHeight * 0.2);
            }

            // Hairline crack on ~10% of pickets
            if (pRand() < 0.1) {
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.5;
                const crackX = px + pRand() * picketWidth;
                ctx.beginPath();
                ctx.moveTo(crackX, fenceY + pRand() * fenceHeight * 0.5);
                ctx.lineTo(crackX + (pRand() - 0.5) * 2, fenceY + fenceHeight * (0.5 + pRand() * 0.5));
                ctx.stroke();
            }

            // Nail dots where rails meet pickets
            ctx.fillStyle = 'rgba(80,80,80,0.4)';
            for (const ry of [railY1 + 3, railY2 + 3]) {
                ctx.beginPath();
                ctx.arc(px + picketWidth / 2, ry, 1, 0, Math.PI * 2);
                ctx.fill();
            }

            // Soft outline
            ctx.strokeStyle = 'rgba(180,170,160,0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(px, fenceY, picketWidth, fenceHeight);
        }

        // Shadow on south side
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, fenceY + fenceHeight, this.width, 6);
        // Gradient fade on shadow
        const shadowGrad = ctx.createLinearGradient(0, fenceY + fenceHeight, 0, fenceY + fenceHeight + 6);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.08)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, fenceY + fenceHeight, this.width, 6);

        ctx.restore();
    }

    drawEastFence() {
        this._renderEastFence(this.ctx);
    }

    /**
     * Render east fence with wood grain and weathering
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderEastFence(ctx) {
        const fenceX = 780;
        const fenceY = 40;
        const fenceHeight = 520;
        const fenceWidth = 20;
        const picketWidth = 5;
        const picketGap = 3;
        const rand = this._seededRandom(2222);

        ctx.save();

        // --- Vertical rails with beveling ---
        const railX1 = fenceX + 4;
        const railX2 = fenceX + 13;
        for (const rx of [railX1, railX2]) {
            ctx.fillStyle = '#F0EDE8';
            ctx.fillRect(rx, fenceY, 4, fenceHeight);
            // Light left edge
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(rx, fenceY, 1, fenceHeight);
            // Dark right edge
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.fillRect(rx + 3, fenceY, 1, fenceHeight);
            this._woodGrain(ctx, rx, fenceY, 4, fenceHeight, true, 8800 + rx);
        }

        // --- Horizontal pickets ---
        let picketSeed = 2000;
        for (let py = fenceY; py < fenceY + fenceHeight; py += picketWidth + picketGap) {
            picketSeed++;
            const pRand = this._seededRandom(picketSeed);

            const r = 240 + Math.floor(pRand() * 15);
            const g = 236 + Math.floor(pRand() * 12);
            const b = 228 + Math.floor(pRand() * 10);
            ctx.fillStyle = `rgb(${r},${g},${b})`;

            ctx.fillRect(fenceX, py, fenceWidth, picketWidth);

            // Pointed tip (pointing right) — organic
            ctx.beginPath();
            ctx.moveTo(fenceX + fenceWidth, py);
            ctx.quadraticCurveTo(
                fenceX + fenceWidth + 4 + pRand() * 2, py + picketWidth * 0.3,
                fenceX + fenceWidth + 5 + pRand(), py + picketWidth / 2
            );
            ctx.quadraticCurveTo(
                fenceX + fenceWidth + 4 + pRand() * 2, py + picketWidth * 0.7,
                fenceX + fenceWidth, py + picketWidth
            );
            ctx.closePath();
            ctx.fill();

            // Wood grain
            this._woodGrain(ctx, fenceX, py, fenceWidth + 5, picketWidth, false, picketSeed + 500);

            // Bottom shadow on picket
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(fenceX, py + picketWidth - 1, fenceWidth, 1);

            // Nail dots
            ctx.fillStyle = 'rgba(80,80,80,0.4)';
            for (const rx of [railX1 + 2, railX2 + 2]) {
                ctx.beginPath();
                ctx.arc(rx, py + picketWidth / 2, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }

            // Outline
            ctx.strokeStyle = 'rgba(180,170,160,0.25)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(fenceX, py, fenceWidth, picketWidth);
        }

        // Shadow on west side (inside yard)
        const shadowGrad = ctx.createLinearGradient(fenceX - 5, 0, fenceX, 0);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0.07)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(fenceX - 5, fenceY, 5, fenceHeight);

        ctx.restore();
    }

    drawWestFence() {
        this._renderWestFence(this.ctx);
    }

    /**
     * Render west fence with wood grain and weathering
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderWestFence(ctx) {
        const fenceX = 0;
        const fenceY = 40;
        const fenceHeight = 520;
        const fenceWidth = 20;
        const picketWidth = 5;
        const picketGap = 3;
        const rand = this._seededRandom(3333);

        ctx.save();

        // --- Vertical rails ---
        const railX1 = fenceX + 3;
        const railX2 = fenceX + 12;
        for (const rx of [railX1, railX2]) {
            ctx.fillStyle = '#F0EDE8';
            ctx.fillRect(rx, fenceY, 4, fenceHeight);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(rx, fenceY, 1, fenceHeight);
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.fillRect(rx + 3, fenceY, 1, fenceHeight);
            this._woodGrain(ctx, rx, fenceY, 4, fenceHeight, true, 7700 + rx);
        }

        // --- Horizontal pickets ---
        let picketSeed = 3000;
        for (let py = fenceY; py < fenceY + fenceHeight; py += picketWidth + picketGap) {
            picketSeed++;
            const pRand = this._seededRandom(picketSeed);

            const r = 240 + Math.floor(pRand() * 15);
            const g = 236 + Math.floor(pRand() * 12);
            const b = 228 + Math.floor(pRand() * 10);
            ctx.fillStyle = `rgb(${r},${g},${b})`;

            ctx.fillRect(fenceX, py, fenceWidth, picketWidth);

            // Pointed tip (pointing left) — organic
            ctx.beginPath();
            ctx.moveTo(fenceX, py);
            ctx.quadraticCurveTo(
                fenceX - 4 - pRand() * 2, py + picketWidth * 0.3,
                fenceX - 5 - pRand(), py + picketWidth / 2
            );
            ctx.quadraticCurveTo(
                fenceX - 4 - pRand() * 2, py + picketWidth * 0.7,
                fenceX, py + picketWidth
            );
            ctx.closePath();
            ctx.fill();

            // Wood grain
            this._woodGrain(ctx, fenceX - 5, py, fenceWidth + 5, picketWidth, false, picketSeed + 500);

            // Top shadow
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(fenceX, py + picketWidth - 1, fenceWidth, 1);

            // Nail dots
            ctx.fillStyle = 'rgba(80,80,80,0.4)';
            for (const rx of [railX1 + 2, railX2 + 2]) {
                ctx.beginPath();
                ctx.arc(rx, py + picketWidth / 2, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }

            // Outline
            ctx.strokeStyle = 'rgba(180,170,160,0.25)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(fenceX, py, fenceWidth, picketWidth);
        }

        // Shadow on east side (inside yard)
        const shadowGrad = ctx.createLinearGradient(fenceX + fenceWidth, 0, fenceX + fenceWidth + 5, 0);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.07)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(fenceX + fenceWidth, fenceY, 5, fenceHeight);

        ctx.restore();
    }

    // =========================================================================
    //  Phase 2 — House Siding & Roof
    // =========================================================================

    drawHouseSiding() {
        this._renderHouseSiding(this.ctx);
    }

    /**
     * Render clapboard siding below roof
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderHouseSiding(ctx) {
        ctx.save();

        // Base fill
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 600, 800, 100);

        // Clapboard siding — alternating tones with shadow/highlight per board
        const boardHeight = 10;
        for (let y = 600; y < 700; y += boardHeight) {
            const boardIndex = Math.floor((y - 600) / boardHeight);
            // Alternate slightly different off-white tones
            ctx.fillStyle = boardIndex % 2 === 0 ? '#F5F2EE' : '#EDE9E4';
            ctx.fillRect(0, y, 800, boardHeight);

            // Highlight at top of board
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(0, y, 800, 1);

            // Shadow at bottom of board
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.fillRect(0, y + boardHeight - 1, 800, 1);
        }

        // Occasional imperfection / knot
        const rand = this._seededRandom(4444);
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#8D6E63';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(100 + rand() * 600, 610 + rand() * 80, 2 + rand() * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawHouseRoof() {
        this._ensureCache();
        // Blit cached roof
        if (this._roofCache) {
            this.ctx.drawImage(this._roofCache, 0, 0);
        }
    }

    /**
     * Render house roof with shingle detail to a given context
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderHouseRoof(ctx) {
        const roofColor = '#8b4513';
        const roofDark = '#5d4037';

        ctx.save();

        // Roof triangle clip
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(400, 500);
        ctx.lineTo(800, 600);
        ctx.closePath();
        ctx.clip();

        // Base fill with gradient (lighter on sunlit right side)
        const roofGrad = this._multiGradient(ctx, 0, 500, 800, 600, [
            [0, '#7B3B15'],
            [0.3, '#8B4513'],
            [0.7, '#9B5523'],
            [1, '#A06030'],
        ]);
        ctx.fillStyle = roofGrad;
        ctx.fill();

        // --- Staggered shingle pattern ---
        const rand = this._seededRandom(4567);
        const shingleW = 20;
        const shingleH = 12;
        const roofPeakY = 500;
        const roofBaseY = 600;

        for (let row = 0; row < 9; row++) {
            const y = roofPeakY + 8 + row * shingleH;
            if (y > roofBaseY) break;
            const offset = row % 2 === 0 ? 0 : shingleW / 2; // brick-like stagger

            for (let x = -shingleW + offset; x < 800 + shingleW; x += shingleW) {
                // Determine if this shingle is within the roof triangle
                const roofLeftX = ((y - roofPeakY) / (roofBaseY - roofPeakY)) * 400;
                const roofRightX = 800 - roofLeftX;
                if (x + shingleW < roofLeftX - shingleW || x > roofRightX + shingleW) continue;

                // Color variation per shingle
                const toneShift = Math.floor(rand() * 30) - 15;
                const sr = 139 + toneShift;
                const sg = 69 + Math.floor(toneShift * 0.5);
                const sb = 19 + Math.floor(toneShift * 0.3);
                ctx.fillStyle = `rgb(${sr},${sg},${sb})`;

                // Rounded rectangle shingle
                const sRad = 1.5;
                ctx.beginPath();
                ctx.moveTo(x + sRad, y);
                ctx.lineTo(x + shingleW - sRad, y);
                ctx.quadraticCurveTo(x + shingleW, y, x + shingleW, y + sRad);
                ctx.lineTo(x + shingleW, y + shingleH - sRad);
                ctx.quadraticCurveTo(x + shingleW, y + shingleH, x + shingleW - sRad, y + shingleH);
                ctx.lineTo(x + sRad, y + shingleH);
                ctx.quadraticCurveTo(x, y + shingleH, x, y + shingleH - sRad);
                ctx.lineTo(x, y + sRad);
                ctx.quadraticCurveTo(x, y, x + sRad, y);
                ctx.closePath();
                ctx.fill();

                // Shadow at bottom edge of shingle
                ctx.fillStyle = 'rgba(0,0,0,0.12)';
                ctx.fillRect(x, y + shingleH - 2, shingleW, 2);
            }
        }

        // Ridge cap along the peak — darker thicker line
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(400, 500);
        ctx.lineTo(800, 600);
        ctx.stroke();

        ctx.restore();

        // Roof outline (outside clip)
        ctx.strokeStyle = roofDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(400, 500);
        ctx.lineTo(800, 600);
        ctx.closePath();
        ctx.stroke();

        // Roof overhang shadow on siding below
        const overhangShadow = ctx.createLinearGradient(0, 598, 0, 608);
        overhangShadow.addColorStop(0, 'rgba(0,0,0,0.15)');
        overhangShadow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = overhangShadow;
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(400, 500);
        ctx.lineTo(800, 600);
        ctx.lineTo(800, 610);
        ctx.lineTo(400, 510);
        ctx.lineTo(0, 610);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw roof overlay for Y-sorted rendering
     * Only draws roof portions above the given Y threshold at the given X
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position to draw roof at
     * @param {number} yThreshold - Only draw roof above this Y
     */
    drawRoofOverlayAtX(ctx, x, yThreshold) {
        const roofPeakX = 400;
        const roofPeakY = 500;
        const roofBaseY = 600;
        const roofSlope = 0.25;

        // Calculate roof Y at this X
        const roofY = roofPeakY + Math.abs(x - roofPeakX) * roofSlope;

        // If entity is below the roof line, don't draw roof here
        if (yThreshold >= roofY) return;

        // Use cached roof if available
        if (this._roofCache) {
            ctx.save();
            // Clip to the area near this X
            ctx.beginPath();
            ctx.moveTo(Math.max(0, x - 50), roofBaseY);
            ctx.lineTo(roofPeakX, roofPeakY);
            ctx.lineTo(Math.min(800, x + 50), roofBaseY);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(this._roofCache, 0, 0);
            ctx.restore();
            return;
        }

        // Fallback: draw directly (matches original behavior)
        const roofColor = '#8b4513';
        const roofDark = '#5d4037';

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(Math.max(0, x - 50), roofBaseY);
        ctx.lineTo(roofPeakX, roofPeakY);
        ctx.lineTo(Math.min(800, x + 50), roofBaseY);
        ctx.closePath();
        ctx.clip();

        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(400, 500);
        ctx.lineTo(800, 600);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = roofDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const y = 500 + i * 16;
            const leftX = (i * 16) * 4;
            const rightX = 800 - leftX;
            ctx.beginPath();
            ctx.moveTo(leftX, y);
            ctx.lineTo(rightX, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Draw the complete roof overlay
     * Used when no entities are behind the roof
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawRoofOverlay(ctx) {
        this.drawHouseRoof();
    }

    // =========================================================================
    //  Phase 2 — Props (Illustrative Style)
    // =========================================================================

    drawProps() {
        this._renderProps(this.ctx);
    }

    /**
     * Render all backyard props to a given context
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderProps(ctx) {
        this._renderGnome(ctx, 150, 200);
        this._renderFlamingo(ctx, 650, 250);
        this._renderGrill(ctx, 180, 480);
        this._renderFlowerPot(ctx, 300, 150);
        this._renderFlowerPot(ctx, 500, 180);
        this._renderTree(ctx, 100, 150);
    }

    drawGnome(x, y) {
        this._renderGnome(this.ctx, x, y);
    }

    /**
     * Render garden gnome — enhanced with face details, gradient robe, wavy beard
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     */
    _renderGnome(ctx, x, y) {
        ctx.save();

        // Shadow on ground
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(x + 3, y + 18, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body — gradient robe
        const robeGrad = ctx.createLinearGradient(x - 12, y - 15, x + 12, y + 15);
        robeGrad.addColorStop(0, '#4A7ADB');
        robeGrad.addColorStop(0.5, '#4169E1');
        robeGrad.addColorStop(1, '#3457B5');
        ctx.fillStyle = robeGrad;
        ctx.beginPath();
        ctx.ellipse(x, y, 12, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Robe fold lines
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 10);
        ctx.quadraticCurveTo(x - 4, y, x - 2, y + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, y - 8);
        ctx.quadraticCurveTo(x + 5, y + 2, x + 3, y + 12);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#FFDBAC';
        ctx.beginPath();
        ctx.arc(x, y - 15, 8, 0, Math.PI * 2);
        ctx.fill();

        // Rosy cheeks
        ctx.fillStyle = 'rgba(255,150,150,0.3)';
        ctx.beginPath();
        ctx.arc(x - 5, y - 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 5, y - 12, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (dot style)
        ctx.fillStyle = '#2C2C2C';
        ctx.beginPath();
        ctx.arc(x - 3, y - 16, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 3, y - 16, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#8B6040';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y - 12, 3, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Nose
        ctx.fillStyle = '#EDBB89';
        ctx.beginPath();
        ctx.arc(x, y - 13, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Hat (pointed red with slight bend)
        const hatGrad = ctx.createLinearGradient(x - 10, y - 18, x + 10, y - 35);
        hatGrad.addColorStop(0, '#E0162B');
        hatGrad.addColorStop(1, '#DC143C');
        ctx.fillStyle = hatGrad;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 18);
        ctx.quadraticCurveTo(x - 2, y - 28, x + 2, y - 37);
        ctx.quadraticCurveTo(x + 6, y - 30, x + 10, y - 18);
        ctx.closePath();
        ctx.fill();

        // Beard — wavy bottom edge
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 12);
        ctx.quadraticCurveTo(x - 4, y - 3, x - 2, y - 2);
        ctx.quadraticCurveTo(x, y - 5, x + 2, y - 2);
        ctx.quadraticCurveTo(x + 4, y - 3, x + 6, y - 12);
        ctx.closePath();
        ctx.fill();

        // Boots
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.ellipse(x - 5, y + 16, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 5, y + 16, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawFlamingo(x, y) {
        this._renderFlamingo(this.ctx, x, y);
    }

    /**
     * Render lawn flamingo — enhanced with feather texture
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     */
    _renderFlamingo(ctx, x, y) {
        ctx.save();

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 27, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 1, y + 25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 3, y + 25);
        ctx.stroke();

        // Body — gradient with feather texture
        const bodyGrad = ctx.createRadialGradient(x + 3, y - 12, 2, x, y - 10, 14);
        bodyGrad.addColorStop(0, '#FFB6D9');
        bodyGrad.addColorStop(1, '#FF69B4');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(x, y - 10, 12, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Feather texture — overlapping small ellipses
        ctx.fillStyle = 'rgba(255,182,217,0.4)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(x - 6 + i * 3, y - 10 + (i % 2) * 2, 4, 2.5, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Neck — curved
        ctx.beginPath();
        ctx.moveTo(x + 8, y - 12);
        ctx.bezierCurveTo(x + 18, y - 18, x + 22, y - 25, x + 15, y - 32);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#FF69B4';
        ctx.stroke();

        // Head
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(x + 15, y - 34, 5, 0, Math.PI * 2);
        ctx.fill();

        // Eye with pupil
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + 17, y - 35, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + 17.5, y - 35, 1, 0, Math.PI * 2);
        ctx.fill();

        // Beak — two-tone
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x + 19, y - 34);
        ctx.lineTo(x + 26, y - 32);
        ctx.lineTo(x + 19, y - 30);
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(x + 22, y - 33);
        ctx.lineTo(x + 26, y - 32);
        ctx.lineTo(x + 22, y - 31);
        ctx.fill();

        ctx.restore();
    }

    drawGrill(x, y) {
        this._renderGrill(this.ctx, x, y);
    }

    /**
     * Render grill — enhanced with metallic sheen and grate
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     */
    _renderGrill(ctx, x, y) {
        ctx.save();

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 27, 22, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#2C2C2C';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 15, y + 10);
        ctx.lineTo(x - 20, y + 25);
        ctx.moveTo(x + 15, y + 10);
        ctx.lineTo(x + 20, y + 25);
        ctx.stroke();

        // Grill body — gradient for metallic look
        const bodyGrad = ctx.createRadialGradient(x + 5, y - 5, 3, x, y, 20);
        bodyGrad.addColorStop(0, '#404040');
        bodyGrad.addColorStop(1, '#1C1C1C');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(x, y, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lid — metallic sheen gradient
        const lidGrad = ctx.createLinearGradient(x - 18, y - 15, x + 18, y);
        lidGrad.addColorStop(0, '#3A3A3A');
        lidGrad.addColorStop(0.3, '#505050');
        lidGrad.addColorStop(0.5, '#3A3A3A');
        lidGrad.addColorStop(1, '#1C1C1C');
        ctx.fillStyle = lidGrad;
        ctx.beginPath();
        ctx.arc(x, y, 18, Math.PI, 0);
        ctx.fill();

        // Grate lines on top
        ctx.strokeStyle = 'rgba(100,100,100,0.5)';
        ctx.lineWidth = 1;
        for (let gx = x - 14; gx <= x + 14; gx += 5) {
            ctx.beginPath();
            ctx.moveTo(gx, y - 2);
            ctx.lineTo(gx, y + 2);
            ctx.stroke();
        }

        // Handle
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 15);
        ctx.quadraticCurveTo(x, y - 18, x + 5, y - 15);
        ctx.stroke();

        ctx.restore();
    }

    drawFlowerPot(x, y) {
        this._renderFlowerPot(this.ctx, x, y);
    }

    /**
     * Render flower pot — enhanced with terra cotta texture and petal shapes
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     */
    _renderFlowerPot(ctx, x, y) {
        ctx.save();

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(x + 1, y + 17, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pot — terra cotta gradient
        const potGrad = ctx.createLinearGradient(x - 10, y, x + 10, y + 15);
        potGrad.addColorStop(0, '#E07B4A');
        potGrad.addColorStop(0.5, '#D2691E');
        potGrad.addColorStop(1, '#B8551A');
        ctx.fillStyle = potGrad;
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x + 10, y);
        ctx.lineTo(x + 8, y + 15);
        ctx.lineTo(x - 8, y + 15);
        ctx.closePath();
        ctx.fill();

        // Pot rim
        ctx.fillStyle = '#D48A5E';
        ctx.fillRect(x - 11, y - 2, 22, 3);

        // Horizontal line for texture
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - 9, y + 7);
        ctx.lineTo(x + 9, y + 7);
        ctx.stroke();

        // Dirt visible at top
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.ellipse(x, y, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Green stems
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 2);
        ctx.quadraticCurveTo(x - 6, y - 8, x - 5, y - 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, y - 2);
        ctx.quadraticCurveTo(x + 6, y - 6, x + 5, y - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - 2);
        ctx.quadraticCurveTo(x + 1, y - 10, x, y - 16);
        ctx.stroke();

        // Leaf shapes
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.ellipse(x - 5, y - 8, 3, 1.5, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 5, y - 7, 3, 1.5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Petal flowers (individual petals instead of solid circles)
        const flowerPositions = [
            { fx: x - 5, fy: y - 13, color: '#FF1493' },
            { fx: x + 5, fy: y - 11, color: '#FF6B9D' },
            { fx: x, fy: y - 17, color: '#FF1493' },
        ];
        for (const f of flowerPositions) {
            // 5 petals
            for (let p = 0; p < 5; p++) {
                const angle = (p / 5) * Math.PI * 2;
                ctx.fillStyle = f.color;
                ctx.beginPath();
                ctx.ellipse(
                    f.fx + Math.cos(angle) * 2.5,
                    f.fy + Math.sin(angle) * 2.5,
                    2, 1.5,
                    angle, 0, Math.PI * 2
                );
                ctx.fill();
            }
            // Center dot
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.arc(f.fx, f.fy, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawTree(x, y) {
        this._renderTree(this.ctx, x, y);
    }

    /**
     * Render tree — enhanced with bark texture, dappled canopy, ground shadow
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     */
    _renderTree(ctx, x, y) {
        ctx.save();

        // Dappled ground shadow beneath tree
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(x + 5, y + 62, 30, 10, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Trunk with bark gradient
        const trunkGrad = ctx.createLinearGradient(x - 8, y, x + 8, y);
        trunkGrad.addColorStop(0, '#6D4C2E');
        trunkGrad.addColorStop(0.3, '#8B5E3C');
        trunkGrad.addColorStop(0.7, '#8B4513');
        trunkGrad.addColorStop(1, '#5D3A1A');
        ctx.fillStyle = trunkGrad;
        ctx.fillRect(x - 8, y, 16, 60);

        // Bark texture — vertical hatching lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.5;
        const rand = this._seededRandom(9999);
        for (let i = 0; i < 8; i++) {
            const lx = x - 7 + rand() * 14;
            ctx.beginPath();
            ctx.moveTo(lx, y + rand() * 10);
            ctx.lineTo(lx + (rand() - 0.5) * 2, y + 30 + rand() * 30);
            ctx.stroke();
        }

        // Shadow on left side of trunk
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x - 8, y, 5, 60);

        // Leaf canopy — 15-20 overlapping circles in 3 green shades
        const greens = ['#228B22', '#2E7D32', '#1B5E20', '#388E3C', '#43A047'];
        const canopyRand = this._seededRandom(7777);
        for (let i = 0; i < 18; i++) {
            const lx = x + (canopyRand() - 0.5) * 50;
            const ly = y - 15 + (canopyRand() - 0.5) * 35;
            const lr = 8 + canopyRand() * 14;
            ctx.fillStyle = greens[Math.floor(canopyRand() * greens.length)];
            ctx.globalAlpha = 0.6 + canopyRand() * 0.4;
            ctx.beginPath();
            ctx.arc(lx, ly, lr, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highlight spots on sunlit side (top-right)
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#81C784';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
                x + 5 + canopyRand() * 15,
                y - 20 + canopyRand() * 20,
                3 + canopyRand() * 5,
                0, Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();
    }

    // Draw chicken carried by hero
    drawCarriedChicken(ctx, x, y, offsetIndex) {
        const offsetX = offsetIndex === 0 ? -12 : 12;
        const offsetY = -25;

        ctx.save();
        ctx.translate(x + offsetX, y + offsetY);
        ctx.scale(0.6, 0.6); // Smaller when carried

        // Body
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(8, -8, 7, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(14, -8);
        ctx.lineTo(18, -6);
        ctx.lineTo(14, -4);
        ctx.fill();

        // Comb
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(8, -14, 4, Math.PI, 0);
        ctx.fill();

        ctx.restore();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Renderer };
}
