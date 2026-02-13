/**
 * Raccoon class - Enemy that enters the coop, spooks chickens, grabs one,
 * and drags it toward a fence hole. Wizard must intercept before escape.
 *
 * State machine:
 *   spawning → approaching → entering_coop → inside_coop →
 *   exiting_coop → dragging → escaped
 *   (wizard intercept at 'approaching' or 'dragging' → fleeing)
 */
class Raccoon {
    constructor(x, y, coop) {
        this.x = x;
        this.y = y;
        this.coop = coop;
        this.radius = 18;
        this.speed = 130;

        // State: 'spawning','approaching','entering_coop','inside_coop',
        //        'exiting_coop','dragging','fleeing','escaped'
        this.state = 'spawning';
        this.spawnTimer = 0;
        this.spawnDelay = 0.5;

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
        this.punchDuration = 0.5;

        // Coop door target (south side of coop)
        this.doorX = coop.x;
        this.doorY = coop.visualBottom + 5; // Just outside front door

        // Inside-coop timer
        this.insideTimer = 0;
        this.insideDuration = 1.5; // seconds inside before grabbing chicken

        // Entering animation timer
        this.enterTimer = 0;
        this.enterDuration = 0.8;

        // Grabbed chicken reference
        this.grabbedChicken = null;

        // Escape target (fence hole position, set when exiting)
        this.escapeTargetX = null;
        this.escapeTargetY = null;

        // Spooked chicken count (for game to handle)
        this.spookedCount = 0;
        this.hasSpookedChickens = false;

        // Escape hole flag (set by game when entering dragging state)
        this._escapeHoleSet = false;

        // Direction facing (for drawing)
        this.facingLeft = false;

        this.setDirectionToward(this.doorX, this.doorY);
    }

    /**
     * Static method to spawn raccoon with fence punch
     */
    static spawnWithPunch(coop, fenceHoleManager, particleSystem) {
        const sides = ['east', 'west'];
        const side = sides[Math.floor(Math.random() * sides.length)];

        let spawnX, spawnY;
        switch (side) {
            case 'east':
                spawnX = 760;
                spawnY = 100 + Math.random() * 400;
                break;
            case 'west':
                spawnX = 40;
                spawnY = 100 + Math.random() * 400;
                break;
        }

        const raccoon = new Raccoon(spawnX, spawnY, coop);
        raccoon.spawnSide = side;
        raccoon.facingLeft = (side === 'east'); // face toward center

        // Punch fence and create hole
        raccoon.punchFence(fenceHoleManager, particleSystem);

        return raccoon;
    }

    punchFence(fenceHoleManager, particleSystem) {
        this.hasPunched = true;
        this.punchTimer = this.punchDuration;

        if (fenceHoleManager) {
            fenceHoleManager.createHole(this.x, this.y, this.spawnSide);
        }

        if (particleSystem) {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
                const speed = 50 + Math.random() * 50;
                particleSystem.spawnWoodParticle(this.x, this.y, angle, speed);
            }
        }
    }

    setDirectionToward(tx, ty) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        }
        // Update facing direction
        if (dx < 0) this.facingLeft = true;
        else if (dx > 0) this.facingLeft = false;
    }

    update(deltaTime, particleSystem) {
        this.time += deltaTime;

        // Handle punch animation (blocks all other updates)
        if (this.hasPunched && this.punchTimer > 0) {
            this.punchTimer -= deltaTime;
            if (this.punchTimer <= 0) {
                this.hasPunched = false;
            }
            return;
        }

        switch (this.state) {
            case 'spawning':
                this.updateSpawning(deltaTime);
                break;
            case 'approaching':
                this.updateApproaching(deltaTime, particleSystem);
                break;
            case 'entering_coop':
                this.updateEnteringCoop(deltaTime);
                break;
            case 'inside_coop':
                this.updateInsideCoop(deltaTime);
                break;
            case 'exiting_coop':
                this.updateExitingCoop(deltaTime);
                break;
            case 'dragging':
                this.updateDragging(deltaTime, particleSystem);
                break;
            case 'fleeing':
                this.updateFleeing(deltaTime);
                break;
        }
    }

    updateSpawning(deltaTime) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnDelay) {
            this.state = 'approaching';
            this.setDirectionToward(this.doorX, this.doorY);
        }
    }

    updateApproaching(deltaTime, particleSystem) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Paw print trail
        if (particleSystem) {
            this.trailTimer += deltaTime;
            if (this.trailTimer > 0.15) {
                this.trailTimer = 0;
                particleSystem.spawnPawPrint(this.x, this.y, this.vx, this.vy);
            }
        }

        // Check if reached front door
        const dx = this.doorX - this.x;
        const dy = this.doorY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20) {
            this.state = 'entering_coop';
            this.enterTimer = 0;
        }
    }

    updateEnteringCoop(deltaTime) {
        this.enterTimer += deltaTime;

        // Slide into the coop door
        const progress = Math.min(1, this.enterTimer / this.enterDuration);
        this.y = this.doorY - progress * 40; // Move northward into coop

        if (progress >= 1) {
            // Now inside the coop
            this.state = 'inside_coop';
            this.insideTimer = 0;

            // Spook random number of chickens (0-6)
            this.spookedCount = Math.floor(Math.random() * 7);
            this.hasSpookedChickens = true; // Signal for game to handle
        }
    }

    updateInsideCoop(deltaTime) {
        // Hidden inside the coop, grabbing a chicken
        this.insideTimer += deltaTime;

        if (this.insideTimer >= this.insideDuration) {
            // Time to exit with chicken
            this.state = 'exiting_coop';
            this.enterTimer = 0; // Reuse for exit animation
        }
    }

    updateExitingCoop(deltaTime) {
        this.enterTimer += deltaTime;

        // Slide out of the coop door
        const progress = Math.min(1, this.enterTimer / this.enterDuration);
        this.y = (this.doorY - 40) + progress * 45; // Move southward out of coop

        if (progress >= 1) {
            // Now outside with chicken, head for fence hole
            this.state = 'dragging';
            this.x = this.doorX;
            this.y = this.doorY + 5;

            // Find nearest fence hole to escape through
            this.findEscapeTarget();
        }
    }

    findEscapeTarget() {
        // Default escape targets: back to spawn side edge
        if (this.spawnSide === 'east') {
            this.escapeTargetX = 810;
            this.escapeTargetY = this.y;
        } else {
            this.escapeTargetX = -10;
            this.escapeTargetY = this.y;
        }

        this.setDirectionToward(this.escapeTargetX, this.escapeTargetY);
    }

    /**
     * Set escape target to a specific fence hole position
     */
    setEscapeHole(hole) {
        if (hole) {
            this.escapeTargetX = hole.x;
            this.escapeTargetY = hole.y;
            this.setDirectionToward(this.escapeTargetX, this.escapeTargetY);
        }
    }

    updateDragging(deltaTime, particleSystem) {
        this.x += this.vx * 0.7 * deltaTime; // Slower when dragging
        this.y += this.vy * 0.7 * deltaTime;

        // Paw print trail
        if (particleSystem) {
            this.trailTimer += deltaTime;
            if (this.trailTimer > 0.2) {
                this.trailTimer = 0;
                particleSystem.spawnPawPrint(this.x, this.y, this.vx, this.vy);
            }
        }

        // Update grabbed chicken position to follow raccoon
        if (this.grabbedChicken) {
            this.grabbedChicken.x = this.x - (this.facingLeft ? -15 : 15);
            this.grabbedChicken.y = this.y + 5;
        }

        // Check if reached escape target (edge of screen or fence hole)
        const dx = this.escapeTargetX - this.x;
        const dy = this.escapeTargetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 25) {
            this.state = 'escaped';
        }
    }

    updateFleeing(deltaTime) {
        this.x += this.vx * 2 * deltaTime;
        this.y += this.vy * 2 * deltaTime;
    }

    /**
     * Intercept raccoon - wizard stops it
     * During 'approaching': just flees, no chicken grabbed yet
     * During 'dragging': drops chicken, flees
     */
    intercept(particleSystem) {
        if (this.state !== 'approaching' && this.state !== 'dragging') return null;

        const droppedChicken = this.grabbedChicken;

        if (this.grabbedChicken) {
            // Drop the chicken at current position
            this.grabbedChicken.x = this.x;
            this.grabbedChicken.y = this.y + 10;
            this.grabbedChicken = null;
        }

        this.state = 'fleeing';
        // Reverse direction to flee
        this.vx = -this.vx;
        this.vy = -this.vy;

        if (particleSystem) {
            particleSystem.spawnStarBurst(this.x, this.y);
        }

        return droppedChicken;
    }

    /**
     * Check if raccoon reached coop door (legacy compat)
     */
    checkReachedTarget() {
        return this.state === 'entering_coop' || this.state === 'inside_coop';
    }

    getBounds() {
        return { x: this.x, y: this.y, radius: this.radius };
    }

    /**
     * Whether raccoon is visible in the game world (not hidden inside coop)
     */
    isVisible() {
        return this.state !== 'inside_coop';
    }

    draw(ctx) {
        // Don't draw when inside coop
        if (!this.isVisible()) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Punch pose animation
        if (this.hasPunched && this.punchTimer > 0) {
            this.drawPunchPose(ctx);
            ctx.restore();
            return;
        }

        // Spawning animation (scale up)
        if (this.state === 'spawning') {
            const progress = this.spawnTimer / this.spawnDelay;
            const scale = Math.min(1, progress * 1.5);
            ctx.scale(scale, scale);
            ctx.globalAlpha = Math.min(1, progress * 2);
        }

        // Fleeing animation
        if (this.state === 'fleeing') {
            ctx.globalAlpha = 0.7;
        }

        // Entering/exiting coop - partial visibility
        if (this.state === 'entering_coop' || this.state === 'exiting_coop') {
            ctx.globalAlpha = 0.8;
        }

        // Mirror if facing left
        if (this.facingLeft) {
            ctx.scale(-1, 1);
        }

        // State-dependent posture
        const isSneaking = this.state === 'approaching';
        const isDragging = this.state === 'dragging';
        const isFleeing = this.state === 'fleeing';
        const isSpooked = this.state === 'fleeing'; // fleeing = spooked/panicked

        // Squash/stretch with movement
        let bodyScaleX = 1.0;
        let bodyScaleY = 1.0;
        if (isSneaking) {
            bodyScaleX = 1.08;
            bodyScaleY = 0.88; // low crouch
        } else if (isFleeing) {
            bodyScaleX = 1.12;
            bodyScaleY = 0.92; // elongated sprint
        } else if (isDragging) {
            bodyScaleX = 1.04;
            bodyScaleY = 0.96;
        }

        // Waddle while moving
        let waddle = 0;
        if (isSneaking || isDragging || isFleeing) {
            const waddleSpeed = isFleeing ? 14 : (isSneaking ? 5 : 8);
            waddle = Math.sin(this.time * waddleSpeed + this.waddleOffset) * (isFleeing ? 0.12 : 0.1);
            ctx.rotate(waddle);
        }

        // Vertical offset for sneaking crouch
        const crouchOffset = isSneaking ? 3 : 0;

        // === SHADOW ===
        const shadowWidth = isSneaking ? 12 : (isDragging ? 15 : 14);
        const shadowHeight = isSneaking ? 4 : 5;
        const shadowGrad = ctx.createRadialGradient(0, 16 + crouchOffset, 1, 0, 16 + crouchOffset, shadowWidth);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(0, 16 + crouchOffset, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        // === TAIL (drawn behind body) ===
        this.drawTail(ctx, crouchOffset, isSneaking, isSpooked, bodyScaleX, bodyScaleY);

        // === HIND LEGS ===
        this.drawLegs(ctx, crouchOffset, waddle, isSneaking, isFleeing, isDragging, bodyScaleX, bodyScaleY);

        // === BODY ===
        ctx.save();
        ctx.translate(0, crouchOffset);
        ctx.scale(bodyScaleX, bodyScaleY);
        this.drawBody(ctx);
        ctx.restore();

        // === HEAD & FACE ===
        const headBob = (isSneaking || isDragging || isFleeing) ?
            Math.sin(this.time * (isFleeing ? 12 : 6) + this.waddleOffset) * 1.5 : 0;
        this.drawHead(ctx, crouchOffset, headBob, isSneaking, isDragging, isSpooked, isFleeing);

        // === FRONT PAWS (over body when stealing/at_coop) ===
        if (this.state === 'entering_coop' || this.state === 'exiting_coop') {
            this.drawReachingPaws(ctx, crouchOffset);
        }

        // Draw chicken in mouth/paws when dragging
        if (this.state === 'dragging' && this.grabbedChicken) {
            this.drawChickenInMouth(ctx);
        }

        ctx.restore();
    }

    /**
     * Draw fluffy layered body with fur texture
     */
    drawBody(ctx) {
        // Body base gradient: gray-brown with lighter highlight
        const bodyGrad = ctx.createRadialGradient(-3, -2, 2, 0, 0, 17);
        bodyGrad.addColorStop(0, '#7a6b5d'); // lighter center
        bodyGrad.addColorStop(0.6, '#696969'); // base gray
        bodyGrad.addColorStop(1, '#504840'); // darker edge
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        // Organic body shape using bezier curves - slightly hunched
        ctx.moveTo(-14, -4);
        ctx.bezierCurveTo(-16, -10, -10, -14, 0, -13);
        ctx.bezierCurveTo(10, -14, 16, -10, 14, -4);
        ctx.bezierCurveTo(16, 4, 12, 12, 4, 13);
        ctx.bezierCurveTo(0, 14, -4, 14, -6, 13);
        ctx.bezierCurveTo(-14, 10, -16, 4, -14, -4);
        ctx.fill();

        // Lighter belly with soft gradient
        const bellyGrad = ctx.createRadialGradient(0, 4, 1, 0, 4, 9);
        bellyGrad.addColorStop(0, '#a9a9a9');
        bellyGrad.addColorStop(0.7, '#8B8178');
        bellyGrad.addColorStop(1, 'rgba(139,125,120,0)');
        ctx.fillStyle = bellyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 4, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top-right highlight (light source)
        const highlightGrad = ctx.createRadialGradient(5, -8, 1, 5, -8, 8);
        highlightGrad.addColorStop(0, 'rgba(200,190,180,0.35)');
        highlightGrad.addColorStop(1, 'rgba(200,190,180,0)');
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.ellipse(5, -8, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Fur texture strokes on edges
        ctx.strokeStyle = '#504840';
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';
        const furAngles = [
            { x: -14, y: -2, angle: -2.8, len: 3 },
            { x: -13, y: 4, angle: -2.5, len: 3.5 },
            { x: -11, y: 9, angle: -2.0, len: 3 },
            { x: 13, y: -2, angle: 0.3, len: 3 },
            { x: 12, y: 5, angle: 0.5, len: 3.5 },
            { x: 10, y: 10, angle: 0.8, len: 3 },
            { x: -6, y: -12, angle: -1.8, len: 2.5 },
            { x: 2, y: -13, angle: -1.5, len: 2.5 },
            { x: 8, y: -12, angle: -1.2, len: 2.5 },
            { x: -8, y: 12, angle: 2.2, len: 2 },
            { x: 3, y: 13, angle: 1.8, len: 2 },
        ];
        for (const fur of furAngles) {
            ctx.beginPath();
            ctx.moveTo(fur.x, fur.y);
            const sway = Math.sin(this.time * 2 + fur.x) * 0.5;
            ctx.quadraticCurveTo(
                fur.x + Math.cos(fur.angle + sway) * fur.len * 0.6,
                fur.y + Math.sin(fur.angle + sway) * fur.len * 0.6,
                fur.x + Math.cos(fur.angle + sway) * fur.len,
                fur.y + Math.sin(fur.angle + sway) * fur.len
            );
            ctx.stroke();
        }

        // Lighter fur highlights
        ctx.strokeStyle = 'rgba(180,170,160,0.4)';
        ctx.lineWidth = 0.6;
        const lightFur = [
            { x: 5, y: -10, angle: -1.2, len: 2 },
            { x: 8, y: -6, angle: -0.8, len: 2.5 },
            { x: -4, y: -11, angle: -1.8, len: 2 },
        ];
        for (const fur of lightFur) {
            ctx.beginPath();
            ctx.moveTo(fur.x, fur.y);
            ctx.quadraticCurveTo(
                fur.x + Math.cos(fur.angle) * fur.len * 0.5,
                fur.y + Math.sin(fur.angle) * fur.len * 0.5,
                fur.x + Math.cos(fur.angle) * fur.len,
                fur.y + Math.sin(fur.angle) * fur.len
            );
            ctx.stroke();
        }

        // Soft outline
        ctx.strokeStyle = 'rgba(60,50,40,0.5)';
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-14, -4);
        ctx.bezierCurveTo(-16, -10, -10, -14, 0, -13);
        ctx.bezierCurveTo(10, -14, 16, -10, 14, -4);
        ctx.bezierCurveTo(16, 4, 12, 12, 4, 13);
        ctx.bezierCurveTo(0, 14, -4, 14, -6, 13);
        ctx.bezierCurveTo(-14, 10, -16, 4, -14, -4);
        ctx.stroke();
    }

    /**
     * Draw banded raccoon tail with bezier curve and sway animation
     */
    drawTail(ctx, crouchOffset, isSneaking, isSpooked, scaleX, scaleY) {
        ctx.save();
        ctx.translate(0, crouchOffset);

        const tailSway = Math.sin(this.time * 3) * 4;
        const tailLift = isSneaking ? 4 : (isSpooked ? -8 : 0);
        const tailPuff = isSpooked ? 1.4 : 1.0;

        // Tail path points
        const tx0 = -12 * scaleX;
        const ty0 = 2 * scaleY;
        const tx1 = -22 * scaleX;
        const ty1 = (tailLift - 4 + tailSway * 0.5) * scaleY;
        const tx2 = -30 * scaleX;
        const ty2 = (tailLift - 10 + tailSway) * scaleY;
        const tipX = -34 * scaleX;
        const tipY = (tailLift - 14 + tailSway * 1.2) * scaleY;

        // Draw tail shape - thick curved path
        const bandCount = 6;
        const tailWidth = 5 * tailPuff;

        // Draw bands along the tail curve
        for (let i = 0; i < bandCount; i++) {
            const t1 = i / bandCount;
            const t2 = (i + 1) / bandCount;

            // Cubic bezier interpolation for positions along tail
            const p1 = this._bezierPoint(t1, tx0, ty0, tx1, ty1, tx2, ty2, tipX, tipY);
            const p2 = this._bezierPoint(t2, tx0, ty0, tx1, ty1, tx2, ty2, tipX, tipY);
            const midT = (t1 + t2) / 2;
            const pMid = this._bezierPoint(midT, tx0, ty0, tx1, ty1, tx2, ty2, tipX, tipY);

            // Width tapers toward tip
            const w1 = tailWidth * (1 - t1 * 0.5);
            const w2 = tailWidth * (1 - t2 * 0.5);

            // Alternating dark/light bands
            const isDark = i % 2 === 0;
            ctx.fillStyle = isDark ? '#3a3a3a' : '#8B8178';

            // Compute perpendicular offset for thickness
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            ctx.beginPath();
            ctx.moveTo(p1.x + nx * w1, p1.y + ny * w1);
            ctx.quadraticCurveTo(pMid.x + nx * ((w1 + w2) / 2), pMid.y + ny * ((w1 + w2) / 2),
                p2.x + nx * w2, p2.y + ny * w2);
            ctx.lineTo(p2.x - nx * w2, p2.y - ny * w2);
            ctx.quadraticCurveTo(pMid.x - nx * ((w1 + w2) / 2), pMid.y - ny * ((w1 + w2) / 2),
                p1.x - nx * w1, p1.y - ny * w1);
            ctx.closePath();
            ctx.fill();
        }

        // Fluffy tip cluster
        const tipPuff = tailPuff * 1.3;
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(tipX, tipY, 3.5 * tipPuff, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#504840';
        ctx.beginPath();
        ctx.arc(tipX - 1, tipY - 1, 2 * tipPuff, 0, Math.PI * 2);
        ctx.fill();

        // Tail outline
        ctx.strokeStyle = 'rgba(50,40,30,0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(tx0, ty0 - tailWidth);
        ctx.bezierCurveTo(tx1, ty1 - tailWidth * 0.8, tx2, ty2 - tailWidth * 0.6, tipX, tipY - tailWidth * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx0, ty0 + tailWidth);
        ctx.bezierCurveTo(tx1, ty1 + tailWidth * 0.8, tx2, ty2 + tailWidth * 0.6, tipX, tipY + tailWidth * 0.4);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Helper: cubic bezier interpolation
     */
    _bezierPoint(t, x0, y0, x1, y1, x2, y2, x3, y3) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        return {
            x: mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3,
            y: mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3
        };
    }

    /**
     * Draw legs with walking animation
     */
    drawLegs(ctx, crouchOffset, waddle, isSneaking, isFleeing, isDragging, scaleX, scaleY) {
        ctx.save();
        ctx.translate(0, crouchOffset);

        const legSpeed = isFleeing ? 16 : (isSneaking ? 5 : 8);
        const isMoving = isSneaking || isDragging || isFleeing;
        const legCycle = isMoving ? Math.sin(this.time * legSpeed + this.waddleOffset) : 0;
        const legCycle2 = isMoving ? Math.sin(this.time * legSpeed + this.waddleOffset + Math.PI) : 0;

        const legY = 10 * scaleY;
        const legLength = isSneaking ? 5 : 7;

        // Hind left leg
        ctx.strokeStyle = '#504840';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-6 * scaleX, legY);
        ctx.lineTo(-6 * scaleX + legCycle * 3, legY + legLength);
        ctx.stroke();

        // Hind right leg
        ctx.beginPath();
        ctx.moveTo(4 * scaleX, legY);
        ctx.lineTo(4 * scaleX + legCycle2 * 3, legY + legLength);
        ctx.stroke();

        // Dark paw pads
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(-6 * scaleX + legCycle * 3, legY + legLength + 1, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4 * scaleX + legCycle2 * 3, legY + legLength + 1, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tiny toe dots on paws
        ctx.fillStyle = '#1a1a1a';
        for (let t = -1; t <= 1; t++) {
            ctx.beginPath();
            ctx.arc(-6 * scaleX + legCycle * 3 + t * 1.5, legY + legLength + 2.5, 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(4 * scaleX + legCycle2 * 3 + t * 1.5, legY + legLength + 2.5, 0.7, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Draw raccoon head with mask, expressive eyes, ears, nose, whiskers
     */
    drawHead(ctx, crouchOffset, headBob, isSneaking, isDragging, isSpooked, isFleeing) {
        ctx.save();
        const headX = 12;
        const headY = -8 + crouchOffset + headBob;
        ctx.translate(headX, headY);

        // Ear flatten when sneaking
        const earHeight = isSneaking ? 6 : 9;

        // === EARS (behind head) ===
        // Left ear
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.moveTo(-7, -4);
        ctx.bezierCurveTo(-9, -4 - earHeight, -5, -4 - earHeight - 2, -3, -5);
        ctx.closePath();
        ctx.fill();
        // Inner ear pink
        ctx.fillStyle = '#ffb6c1';
        ctx.beginPath();
        ctx.moveTo(-6, -5);
        ctx.bezierCurveTo(-7.5, -4 - earHeight * 0.7, -4.5, -4 - earHeight * 0.7, -4, -5.5);
        ctx.closePath();
        ctx.fill();

        // Right ear
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.moveTo(3, -5);
        ctx.bezierCurveTo(4, -4 - earHeight - 2, 8, -4 - earHeight, 7, -4);
        ctx.closePath();
        ctx.fill();
        // Inner ear pink
        ctx.fillStyle = '#ffb6c1';
        ctx.beginPath();
        ctx.moveTo(4, -5.5);
        ctx.bezierCurveTo(4.5, -4 - earHeight * 0.7, 6.5, -4 - earHeight * 0.7, 6, -5);
        ctx.closePath();
        ctx.fill();

        // === HEAD BASE ===
        const headGrad = ctx.createRadialGradient(1, -1, 2, 0, 0, 10);
        headGrad.addColorStop(0, '#7a6b5d');
        headGrad.addColorStop(0.7, '#696969');
        headGrad.addColorStop(1, '#5a5050');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // White face patches above mask
        ctx.fillStyle = '#d4cfc8';
        ctx.beginPath();
        ctx.ellipse(-3, -4, 4, 2.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(3, -4, 4, 2.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // White muzzle/chin below mask
        ctx.fillStyle = '#d8d3cc';
        ctx.beginPath();
        ctx.ellipse(2, 4, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // === RACCOON MASK (characteristic shape with bezier) ===
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        // Left mask patch
        ctx.moveTo(-8, -2);
        ctx.bezierCurveTo(-8, -5, -5, -6, -2, -4);
        ctx.bezierCurveTo(-1, -2, -1, 1, -3, 1);
        ctx.bezierCurveTo(-6, 2, -8, 0, -8, -2);
        ctx.fill();
        ctx.beginPath();
        // Right mask patch
        ctx.moveTo(8, -2);
        ctx.bezierCurveTo(8, -5, 5, -6, 2, -4);
        ctx.bezierCurveTo(1, -2, 1, 1, 3, 1);
        ctx.bezierCurveTo(6, 2, 8, 0, 8, -2);
        ctx.fill();
        // Bridge connecting mask patches
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.ellipse(0, -3, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // === EYES (state-dependent) ===
        this.drawEyes(ctx, isSneaking, isDragging, isSpooked, isFleeing);

        // === NOSE (rounded triangle) ===
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(8, 1);
        ctx.bezierCurveTo(9.5, -0.5, 10.5, 0.5, 10, 2);
        ctx.bezierCurveTo(9.5, 3, 8.5, 3, 8, 2);
        ctx.bezierCurveTo(7.5, 1.5, 7.5, 1, 8, 1);
        ctx.fill();
        // Nose highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(8.8, 1, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // === WHISKERS ===
        ctx.strokeStyle = 'rgba(200,190,180,0.6)';
        ctx.lineWidth = 0.5;
        ctx.lineCap = 'round';
        const whiskerSway = Math.sin(this.time * 2) * 0.5;
        // Right-side whiskers
        ctx.beginPath();
        ctx.moveTo(8, 2);
        ctx.quadraticCurveTo(14, 0 + whiskerSway, 17, -1 + whiskerSway);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, 2.5);
        ctx.quadraticCurveTo(14, 3 + whiskerSway, 17, 3.5 + whiskerSway);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, 3);
        ctx.quadraticCurveTo(13, 5 + whiskerSway, 16, 7 + whiskerSway);
        ctx.stroke();

        // === MOUTH (state-dependent) ===
        ctx.strokeStyle = 'rgba(40,30,20,0.5)';
        ctx.lineWidth = 0.8;
        if (isDragging) {
            // Grin with chicken
            ctx.beginPath();
            ctx.moveTo(6, 4);
            ctx.quadraticCurveTo(8, 6, 10, 4.5);
            ctx.stroke();
        } else if (isSpooked || isFleeing) {
            // Grimace
            ctx.beginPath();
            ctx.moveTo(6, 5);
            ctx.quadraticCurveTo(8, 4, 10, 5);
            ctx.stroke();
        }

        // Head outline
        ctx.strokeStyle = 'rgba(60,50,40,0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 9, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw expressive eyes based on raccoon state
     */
    drawEyes(ctx, isSneaking, isDragging, isSpooked, isFleeing) {
        const leftEyeX = -4;
        const rightEyeX = 4;
        const eyeY = -1;

        // Pupil direction shift based on movement
        const pupilShiftX = 0.5; // looking forward (right since facing right)
        const pupilShiftY = isSneaking ? 0.5 : 0; // looking down when sneaking

        if (isSneaking) {
            // Narrow/squinting eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(leftEyeX, eyeY, 2.5, 1.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(rightEyeX, eyeY, 2.5, 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(leftEyeX + pupilShiftX, eyeY + pupilShiftY, 1, 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(rightEyeX + pupilShiftX, eyeY + pupilShiftY, 1, 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (isDragging) {
            // Mischievous eyes - one squinting
            // Left eye: normal
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(leftEyeX, eyeY, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(leftEyeX + pupilShiftX, eyeY, 1.1, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(leftEyeX + pupilShiftX + 0.5, eyeY - 0.6, 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Right eye: squinting (mischievous)
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(rightEyeX, eyeY, 2.5, 1.2, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(rightEyeX + pupilShiftX, eyeY, 1, 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Raised eyebrow on right
            ctx.strokeStyle = '#3a3a3a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(rightEyeX - 2, eyeY - 3.5);
            ctx.quadraticCurveTo(rightEyeX, eyeY - 5, rightEyeX + 2.5, eyeY - 3);
            ctx.stroke();
        } else if (isSpooked || isFleeing) {
            // Wide/surprised eyes - larger with small pupils
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(leftEyeX, eyeY, 3, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(rightEyeX, eyeY, 3, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tiny pupils (fear)
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(leftEyeX, eyeY, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightEyeX, eyeY, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Highlights
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(leftEyeX + 0.8, eyeY - 0.8, 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightEyeX + 0.8, eyeY - 0.8, 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Default eyes (normal)
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(leftEyeX, eyeY, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(rightEyeX, eyeY, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(leftEyeX + pupilShiftX, eyeY, 1.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightEyeX + pupilShiftX, eyeY, 1.1, 0, Math.PI * 2);
            ctx.fill();

            // Highlights
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(leftEyeX + pupilShiftX + 0.5, eyeY - 0.5, 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightEyeX + pupilShiftX + 0.5, eyeY - 0.5, 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw reaching paws when entering/exiting coop
     */
    drawReachingPaws(ctx, crouchOffset) {
        const reach = Math.sin(this.time * 4) * 3;
        ctx.fillStyle = '#2a2a2a';
        // Left reaching paw
        ctx.beginPath();
        ctx.ellipse(14, -4 + crouchOffset + reach, 3.5, 2.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Right reaching paw
        ctx.beginPath();
        ctx.ellipse(16, 2 + crouchOffset - reach, 3.5, 2.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Finger/toe details
        ctx.fillStyle = '#1a1a1a';
        for (let p = 0; p < 3; p++) {
            ctx.beginPath();
            ctx.arc(15.5 + p * 1.2, -5 + crouchOffset + reach, 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(17.5 + p * 1.2, 1 + crouchOffset - reach, 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawChickenInMouth(ctx) {
        // Small chicken held in raccoon's paws/mouth
        ctx.save();
        const bobble = Math.sin(this.time * 6) * 2;

        // Chicken body (small, limp, with feather detail)
        const chickenColor = this.grabbedChicken.attributes ?
            this.grabbedChicken.attributes.color : '#ffffff';

        // Feather shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(19, 4 + bobble, 6.5, 4.5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Chicken body
        ctx.fillStyle = chickenColor;
        ctx.beginPath();
        ctx.ellipse(18, 2 + bobble, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Feather detail on chicken
        const featherShade = 'rgba(0,0,0,0.08)';
        ctx.fillStyle = featherShade;
        ctx.beginPath();
        ctx.ellipse(16, 3 + bobble, 3, 2.5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(20, 1.5 + bobble, 3, 2, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Chicken head
        ctx.fillStyle = chickenColor;
        ctx.beginPath();
        ctx.arc(22, -1 + bobble, 3, 0, Math.PI * 2);
        ctx.fill();

        // Little comb
        ctx.fillStyle = '#cc3333';
        ctx.beginPath();
        ctx.arc(22, -3.5 + bobble, 1.5, 0, Math.PI, true);
        ctx.fill();

        // Eye (closed/dazed)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(23, -1.5 + bobble);
        ctx.lineTo(24.5, -1.5 + bobble);
        ctx.stroke();

        // Beak
        ctx.fillStyle = '#FFA000';
        ctx.beginPath();
        ctx.moveTo(24.5, -1 + bobble);
        ctx.bezierCurveTo(25.5, -1.5 + bobble, 27, 0 + bobble, 25, 1 + bobble);
        ctx.lineTo(24.5, 0 + bobble);
        ctx.closePath();
        ctx.fill();

        // Legs dangling
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        const dangle = Math.sin(this.time * 4) * 1.5;
        ctx.beginPath();
        ctx.moveTo(16, 5 + bobble);
        ctx.quadraticCurveTo(15, 8 + bobble + dangle, 13, 11 + bobble + dangle);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(19, 5 + bobble);
        ctx.quadraticCurveTo(20, 8 + bobble - dangle, 22, 11 + bobble - dangle);
        ctx.stroke();

        // Raccoon's paws gripping chicken
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(14, 2 + bobble * 0.5, 3, 2.5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(22, 3 + bobble * 0.5, 2.5, 2, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawPunchPose(ctx) {
        const punchProgress = 1 - (this.punchTimer / this.punchDuration);
        const pawOffset = Math.sin(punchProgress * Math.PI) * 15;

        // Shadow (larger when standing)
        const shadowGrad = ctx.createRadialGradient(0, 15, 1, 0, 15, 16);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(0, 15, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (standing on hind legs - gradient fur)
        const bodyGrad = ctx.createLinearGradient(-10, -30, 10, 5);
        bodyGrad.addColorStop(0, '#696969');
        bodyGrad.addColorStop(0.5, '#7a6b5d');
        bodyGrad.addColorStop(1, '#504840');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(-9, 5);
        ctx.bezierCurveTo(-12, -5, -12, -20, -8, -28);
        ctx.bezierCurveTo(-5, -32, 5, -32, 8, -28);
        ctx.bezierCurveTo(12, -20, 12, -5, 9, 5);
        ctx.bezierCurveTo(6, 8, -6, 8, -9, 5);
        ctx.fill();

        // Belly
        const bellyGrad = ctx.createRadialGradient(0, -8, 2, 0, -8, 10);
        bellyGrad.addColorStop(0, '#a9a9a9');
        bellyGrad.addColorStop(0.6, '#8B8178');
        bellyGrad.addColorStop(1, 'rgba(139,125,120,0)');
        ctx.fillStyle = bellyGrad;
        ctx.beginPath();
        ctx.ellipse(0, -8, 7, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fur strokes on body edge
        ctx.strokeStyle = '#504840';
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';
        const punchFur = [
            { x: -10, y: -15, angle: -2.8, len: 2.5 },
            { x: -11, y: -5, angle: -2.5, len: 3 },
            { x: 10, y: -15, angle: 0.3, len: 2.5 },
            { x: 11, y: -5, angle: 0.5, len: 3 },
        ];
        for (const fur of punchFur) {
            ctx.beginPath();
            ctx.moveTo(fur.x, fur.y);
            ctx.lineTo(fur.x + Math.cos(fur.angle) * fur.len, fur.y + Math.sin(fur.angle) * fur.len);
            ctx.stroke();
        }

        // Body outline
        ctx.strokeStyle = 'rgba(60,50,40,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-9, 5);
        ctx.bezierCurveTo(-12, -5, -12, -20, -8, -28);
        ctx.bezierCurveTo(-5, -32, 5, -32, 8, -28);
        ctx.bezierCurveTo(12, -20, 12, -5, 9, 5);
        ctx.stroke();

        // Hind legs/feet
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(-6, 8, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, 8, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail curled behind (visible on left side)
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.bezierCurveTo(-16, -2, -20, -10, -18, -16);
        ctx.bezierCurveTo(-16, -20, -12, -18, -14, -14);
        ctx.bezierCurveTo(-16, -10, -14, -4, -9, 0);
        ctx.fill();
        // Tail bands
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(-16, -8, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-18, -14, 2, 0, Math.PI * 2);
        ctx.fill();

        // Raised paw (animates punch)
        const punchArmGrad = ctx.createLinearGradient(10, -20, 25, -10);
        punchArmGrad.addColorStop(0, '#696969');
        punchArmGrad.addColorStop(1, '#504840');
        ctx.fillStyle = punchArmGrad;
        ctx.beginPath();
        ctx.ellipse(15, -18 + pawOffset, 5, 8, 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Paw
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(18, -22 + pawOffset, 4, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Other arm at side
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.ellipse(-12, -12, 4, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(-13, -7, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        const headGrad = ctx.createRadialGradient(1, -34, 2, 0, -33, 10);
        headGrad.addColorStop(0, '#7a6b5d');
        headGrad.addColorStop(0.7, '#696969');
        headGrad.addColorStop(1, '#5a5050');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(0, -33, 10, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears (alert/angry - perked up)
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.moveTo(-6, -38);
        ctx.bezierCurveTo(-8, -48, -4, -49, -2, -39);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffb6c1';
        ctx.beginPath();
        ctx.moveTo(-5, -39);
        ctx.bezierCurveTo(-6.5, -45, -4, -46, -3, -39.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.moveTo(3, -39);
        ctx.bezierCurveTo(4, -49, 8, -48, 6, -38);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffb6c1';
        ctx.beginPath();
        ctx.moveTo(3.5, -39.5);
        ctx.bezierCurveTo(4.5, -46, 7, -45, 5.5, -39);
        ctx.closePath();
        ctx.fill();

        // White face patches
        ctx.fillStyle = '#d4cfc8';
        ctx.beginPath();
        ctx.ellipse(-3, -37, 3.5, 2, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(3, -37, 3.5, 2, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // White muzzle
        ctx.fillStyle = '#d8d3cc';
        ctx.beginPath();
        ctx.ellipse(2, -29, 4.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mask (angry)
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(-8, -35);
        ctx.bezierCurveTo(-8, -38, -5, -39, -2, -37);
        ctx.bezierCurveTo(-1, -35, -1, -33, -3, -32);
        ctx.bezierCurveTo(-6, -31, -8, -33, -8, -35);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -35);
        ctx.bezierCurveTo(8, -38, 5, -39, 2, -37);
        ctx.bezierCurveTo(1, -35, 1, -33, 3, -32);
        ctx.bezierCurveTo(6, -31, 8, -33, 8, -35);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, -36, 2.5, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyes (red-tinged)
        ctx.fillStyle = '#ffdddd';
        ctx.beginPath();
        ctx.ellipse(-4, -34, 2.5, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, -34, 2.5, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        ctx.arc(-4, -34, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -34, 1, 0, Math.PI * 2);
        ctx.fill();

        // Slanted angry eyebrows
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-7, -38);
        ctx.lineTo(-2, -36.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2, -36.5);
        ctx.lineTo(7, -38);
        ctx.stroke();

        // Nose
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(7, -31);
        ctx.bezierCurveTo(8.5, -32, 9.5, -31, 9, -29.5);
        ctx.bezierCurveTo(8.5, -28.5, 7.5, -28.5, 7, -29.5);
        ctx.closePath();
        ctx.fill();

        // Snarling mouth
        ctx.strokeStyle = 'rgba(40,30,20,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(5, -28);
        ctx.quadraticCurveTo(7, -26.5, 9, -28);
        ctx.stroke();

        // Whiskers
        ctx.strokeStyle = 'rgba(200,190,180,0.5)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(7, -30);
        ctx.lineTo(14, -31);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(7, -29);
        ctx.lineTo(14, -28);
        ctx.stroke();

        // Head outline
        ctx.strokeStyle = 'rgba(60,50,40,0.3)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, -33, 10, 9, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Punch impact effect at peak
        if (punchProgress > 0.4 && punchProgress < 0.6) {
            // Impact star burst
            ctx.strokeStyle = '#ff5722';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            const impactX = 20;
            const impactY = -10;
            const burstSize = 12 + pawOffset * 0.3;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const innerR = burstSize * 0.4;
                const outerR = burstSize;
                ctx.beginPath();
                ctx.moveTo(impactX + Math.cos(angle) * innerR, impactY + Math.sin(angle) * innerR);
                ctx.lineTo(impactX + Math.cos(angle) * outerR, impactY + Math.sin(angle) * outerR);
                ctx.stroke();
            }
            // Inner flash
            ctx.fillStyle = 'rgba(255,200,50,0.4)';
            ctx.beginPath();
            ctx.arc(impactX, impactY, burstSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * RaccoonSpawner - Manages raccoon spawning from east and west sides only
 */
class RaccoonSpawner {
    constructor(coop) {
        this.coop = coop;
        this.spawnTimer = 0;
        this.baseSpawnRate = 12;
        this.currentSpawnRate = this.baseSpawnRate;
        this.minSpawnRate = 4;
        this.spawnAcceleration = 0.96;
        this.nextSpawnTime = this.currentSpawnRate;
    }

    update(deltaTime, raccoons) {
        this.spawnTimer += deltaTime;

        // Spawn raccoon when timer expires and no active raccoon
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
        return Raccoon.spawnWithPunch(this.coop, fenceHoleManager, particleSystem);
    }

    reset() {
        this.spawnTimer = 0;
        this.currentSpawnRate = this.baseSpawnRate;
        this.nextSpawnTime = this.currentSpawnRate;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Raccoon, RaccoonSpawner };
}
