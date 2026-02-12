/**
 * wizardAnimator.js - Whimsical wizard animation controller
 * Handles state machine, pose interpolation, and smooth transitions
 * Enhanced with illustrative storybook-style rendering
 */

class WizardAnimator {
    constructor() {
        this.currentState = 'idle';
        this.currentFrame = 0;
        this.animTimer = 0;
        this.frameDuration = 0.1;
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.previousPose = null;
        
        // Animation configurations
        this.stateConfig = {
            idle: { frameTime: 0.1, loop: true },
            walk: { frameTime: 0.08, loop: true },
            turn: { frameTime: 0.05, loop: false },
            pickup: { frameTime: 0.15, loop: false },
            carry: { frameTime: 0.09, loop: true },
            deposit: { frameTime: 0.15, loop: false },
            startled: { frameTime: 0.05, loop: false },
            victory: { frameTime: 0.1, loop: false },
            hammer: { frameTime: 0.12, loop: true }
        };
        
        // Current pose cache
        this.currentPose = this.getPoseFromFrame('idle', 0);

        // Eye blink timer
        this.blinkTimer = 0;
        this.blinkInterval = 3.5; // seconds between blinks
        this.blinkDuration = 0.15; // seconds for blink
        this.isBlinking = false;

        // Sparkle particles for staff crystal
        this.sparkles = [];
        for (let i = 0; i < 4; i++) {
            this.sparkles.push({
                angle: (Math.PI * 2 / 4) * i,
                dist: 6 + Math.random() * 4,
                speed: 1.5 + Math.random() * 1.0,
                size: 1 + Math.random() * 1.5,
                alpha: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    update(deltaTime, newState) {
        // Handle state transition
        if (newState !== this.currentState) {
            this.transitionTo(newState);
        }
        
        const config = this.stateConfig[this.currentState];
        
        // Update animation timer
        this.animTimer += deltaTime;
        
        if (this.animTimer >= config.frameTime) {
            this.animTimer = 0;
            this.currentFrame++;
            
            const frames = WIZARD_ANIMATIONS[this.currentState];
            if (this.currentFrame >= frames.length) {
                if (config.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = frames.length - 1;
                    // Stay on last frame for non-looping animations
                }
            }
        }
        
        // Update transition
        if (this.isTransitioning) {
            this.transitionProgress += deltaTime / 0.15; // 150ms transition
            if (this.transitionProgress >= 1) {
                this.isTransitioning = false;
                this.transitionProgress = 0;
                this.previousPose = null;
            }
        }

        // Update blink timer
        this.blinkTimer += deltaTime;
        if (this.blinkTimer >= this.blinkInterval) {
            this.isBlinking = true;
            if (this.blinkTimer >= this.blinkInterval + this.blinkDuration) {
                this.isBlinking = false;
                this.blinkTimer = 0;
                this.blinkInterval = 2.5 + Math.random() * 3.0; // Vary interval
            }
        }
        
        // Update current pose
        this.currentPose = this.getCurrentPose();
    }
    
    transitionTo(newState) {
        this.previousPose = { ...this.currentPose };
        this.currentState = newState;
        this.currentFrame = 0;
        this.animTimer = 0;
        this.isTransitioning = true;
        this.transitionProgress = 0;
    }
    
    getCurrentPose() {
        const frames = WIZARD_ANIMATIONS[this.currentState];
        const frame1 = frames[this.currentFrame];
        const frame2 = frames[(this.currentFrame + 1) % frames.length];
        const t = this.animTimer / this.stateConfig[this.currentState].frameTime;
        
        let targetPose = this.interpolatePose(frame1, frame2, this.easeInOutQuad(t));
        
        // Blend with previous pose during transition
        if (this.isTransitioning && this.previousPose) {
            return this.interpolatePose(this.previousPose, targetPose, this.transitionProgress);
        }
        
        return targetPose;
    }
    
    getPoseFromFrame(state, frameIndex) {
        const frames = WIZARD_ANIMATIONS[state];
        return frames[frameIndex % frames.length];
    }
    
    interpolatePose(pose1, pose2, t) {
        return {
            bodyY: this.lerp(pose1.bodyY, pose2.bodyY, t),
            bodyScaleY: this.lerp(pose1.bodyScaleY, pose2.bodyScaleY, t),
            bodyRotation: this.lerpAngle(pose1.bodyRotation, pose2.bodyRotation, t),
            legL: this.interpolateLimb(pose1.legL, pose2.legL, t),
            legR: this.interpolateLimb(pose1.legR, pose2.legR, t),
            armL: this.interpolateLimb(pose1.armL, pose2.armL, t),
            armR: this.interpolateLimb(pose1.armR, pose2.armR, t),
            hatRotation: this.lerpAngle(pose1.hatRotation, pose2.hatRotation, t),
            hatY: this.lerp(pose1.hatY, pose2.hatY, t),
            robeFlare: this.lerp(pose1.robeFlare, pose2.robeFlare, t),
            beardSway: this.lerpAngle(pose1.beardSway, pose2.beardSway, t),
            staffAngle: this.lerpAngle(pose1.staffAngle, pose2.staffAngle, t),
            // New optional properties with safe defaults
            robeSway: this.lerp(pose1.robeSway || 0, pose2.robeSway || 0, t),
            hatTilt: this.lerp(pose1.hatTilt || 0, pose2.hatTilt || 0, t),
            crystalGlow: this.lerp(
                pose1.crystalGlow !== undefined ? pose1.crystalGlow : 1.0,
                pose2.crystalGlow !== undefined ? pose2.crystalGlow : 1.0,
                t
            )
        };
    }
    
    interpolateLimb(limb1, limb2, t) {
        return {
            angle: this.lerpAngle(limb1.angle, limb2.angle, t),
            x: this.lerp(limb1.x, limb2.x, t),
            y: this.lerp(limb1.y, limb2.y, t)
        };
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    lerpAngle(a, b, t) {
        const diff = b - a;
        const adjusted = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
        return a + adjusted * t;
    }
    
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    // Draw the wizard with current pose
    // Note: facing direction flip is handled by the caller (Hero.draw)
    draw(ctx, state, time, facingDirection, handContents) {
        // Update animation state
        this.update(0.016, state); // Assume ~60fps for draw updates
        
        const pose = this.currentPose;
        
        // Store hand contents for arm rendering
        this._handContents = handContents || { left: null, right: null };
        this._time = time;
        
        // Draw wizard body with pose (no flip here — Hero.draw() handles ctx.scale)
        this.drawBody(ctx, pose, time);
    }
    
    // ==================== ILLUSTRATIVE DRAWING ====================

    drawBody(ctx, pose, time) {
        const bodyY = pose.bodyY || 0;
        const bodyScaleY = pose.bodyScaleY || 1;
        const robeSway = pose.robeSway || 0;
        const crystalGlow = pose.crystalGlow !== undefined ? pose.crystalGlow : 1.0;

        // 1. Cast shadow on ground
        this.drawShadow(ctx, bodyY);

        // 2. Draw legs/boots (behind robe)
        this.drawLeg(ctx, pose.legL, -6, bodyY + 15);
        this.drawLeg(ctx, pose.legR, 6, bodyY + 15);

        // 3. Draw robe/body
        this.drawRobe(ctx, bodyY, bodyScaleY, pose.robeFlare || 0, robeSway, time);

        // 4. Draw back arm (left arm, behind body) with carried item
        this.drawArm(ctx, pose.armL, -12, bodyY - 5, true, this._handContents.left);

        // 5. Draw beard (behind head, in front of robe)
        this.drawBeard(ctx, bodyY, pose.beardSway || 0, time);

        // 6. Draw head and face
        this.drawHead(ctx, bodyY, time);

        // 7. Draw hat
        this.drawHat(ctx, bodyY, pose.hatRotation || 0, pose.hatY || 0, pose.hatTilt || 0, time);

        // 8. Draw front arm (right arm) and staff
        this.drawStaff(ctx, bodyY, pose.staffAngle || 0, crystalGlow, time);
        this.drawArm(ctx, pose.armR, 12, bodyY - 5, false, this._handContents.right);
    }

    // ---- Shadow ----
    drawShadow(ctx, bodyY) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(2, 24 + bodyY * 0.3, 16, 5, 0.05, 0, Math.PI * 2);
        ctx.fill();
        // Inner darker shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(1, 24 + bodyY * 0.3, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ---- Robe ----
    drawRobe(ctx, bodyY, bodyScaleY, robeFlare, robeSway, time) {
        ctx.save();

        // Robe shape using bezier curves for organic flowing form
        const robeTop = bodyY - 10;
        const robeBottom = bodyY + 18;
        const robeWidth = 14;
        const flare = robeFlare || 0;
        const sway = robeSway;

        // Create gradient fill — royal blue base
        const grad = ctx.createLinearGradient(0, robeTop, 0, robeBottom);
        grad.addColorStop(0, '#4169e1');     // Royal blue top
        grad.addColorStop(0.4, '#3758c7');
        grad.addColorStop(0.7, '#2a4eb3');   // Darker lower
        grad.addColorStop(1.0, '#1e3a8a');   // Shadow at hem

        // Main robe shape
        ctx.beginPath();
        // Left shoulder
        ctx.moveTo(-8, robeTop);
        // Top curve across shoulders
        ctx.quadraticCurveTo(0, robeTop - 3, 8, robeTop);
        // Right side flowing down
        ctx.bezierCurveTo(
            robeWidth + 1, robeTop + 8,
            robeWidth + 2 + flare * 0.15, robeBottom - 6,
            robeWidth + flare * 0.2 + sway, robeBottom
        );
        // Bottom wavy hem
        ctx.bezierCurveTo(
            8 + flare * 0.1 + sway, robeBottom + 2 + Math.sin(time * 3) * 0.5,
            3 + sway * 0.5, robeBottom + 1 - Math.sin(time * 2.5) * 0.5,
            0 + sway * 0.3, robeBottom + 1.5
        );
        ctx.bezierCurveTo(
            -3 + sway * 0.2, robeBottom + 1 + Math.sin(time * 2.8) * 0.5,
            -8 - flare * 0.1, robeBottom + 2 - Math.sin(time * 3.2) * 0.5,
            -robeWidth - flare * 0.2, robeBottom
        );
        // Left side flowing up
        ctx.bezierCurveTo(
            -robeWidth - 2 - flare * 0.15, robeBottom - 6,
            -robeWidth - 1, robeTop + 8,
            -8, robeTop
        );
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Soft outline
        ctx.strokeStyle = '#1a3370';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Highlight rim on right (light from top-right)
        ctx.beginPath();
        ctx.moveTo(8, robeTop);
        ctx.bezierCurveTo(
            robeWidth, robeTop + 6,
            robeWidth + 1, robeTop + 14,
            robeWidth + flare * 0.1, robeBottom - 4
        );
        ctx.strokeStyle = 'rgba(107, 140, 245, 0.4)'; // #6b8cf5 highlight
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Fold lines (darker curves following body)
        ctx.strokeStyle = 'rgba(26, 51, 112, 0.25)';
        ctx.lineWidth = 0.8;
        // Left fold
        ctx.beginPath();
        ctx.moveTo(-4, robeTop + 6);
        ctx.quadraticCurveTo(-5, bodyY + 5, -6 - flare * 0.05, robeBottom - 2);
        ctx.stroke();
        // Center fold
        ctx.beginPath();
        ctx.moveTo(1, robeTop + 4);
        ctx.quadraticCurveTo(0, bodyY + 8, 0 + sway * 0.2, robeBottom - 1);
        ctx.stroke();
        // Right fold
        ctx.beginPath();
        ctx.moveTo(5, robeTop + 6);
        ctx.quadraticCurveTo(6, bodyY + 5, 7 + flare * 0.05, robeBottom - 2);
        ctx.stroke();

        // Star/moon pattern on robe (tiny gold decorations)
        ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
        // Small star dots
        this.drawTinyStar(ctx, -3, bodyY + 2, 1.5);
        this.drawTinyStar(ctx, 5, bodyY - 3, 1.2);
        this.drawTinyStar(ctx, -6, bodyY + 10, 1.0);
        // Tiny crescent moon
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(2, bodyY + 8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3758c7';
        ctx.beginPath();
        ctx.arc(3, bodyY + 7.5, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Helper: draw tiny 4-point star
    drawTinyStar(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.3, -size * 0.3);
        ctx.lineTo(size, 0);
        ctx.lineTo(size * 0.3, size * 0.3);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.3, size * 0.3);
        ctx.lineTo(-size, 0);
        ctx.lineTo(-size * 0.3, -size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // ---- Head & Face ----
    drawHead(ctx, bodyY, time) {
        ctx.save();
        const headX = 0;
        const headY = bodyY - 16;
        const headW = 11; // slightly wider ellipse
        const headH = 10;

        // Head shape — slightly elongated
        ctx.beginPath();
        ctx.ellipse(headX, headY, headW, headH, 0, 0, Math.PI * 2);
        // Skin gradient
        const skinGrad = ctx.createRadialGradient(headX + 2, headY - 2, 2, headX, headY, headH);
        skinGrad.addColorStop(0, '#fde0d0');   // Highlight
        skinGrad.addColorStop(0.6, '#fdbcb4'); // Base skin
        skinGrad.addColorStop(1.0, '#e8a098'); // Shadow edge
        ctx.fillStyle = skinGrad;
        ctx.fill();
        // Soft outline
        ctx.strokeStyle = '#d4948c';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Rosy cheeks
        ctx.fillStyle = 'rgba(255, 150, 150, 0.25)';
        ctx.beginPath();
        ctx.arc(headX - 6, headY + 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + 6, headY + 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeY = headY - 1;
        const eyeSpacing = 4;
        const blinkAmount = this.isBlinking ? 0.15 : 1.0;

        // Left eye
        this.drawEye(ctx, headX - eyeSpacing, eyeY, blinkAmount, time);
        // Right eye
        this.drawEye(ctx, headX + eyeSpacing, eyeY, blinkAmount, time);

        // Eyebrows
        ctx.strokeStyle = '#8b6f5e';
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        // Left eyebrow
        ctx.beginPath();
        ctx.moveTo(headX - eyeSpacing - 2.5, eyeY - 4);
        ctx.quadraticCurveTo(headX - eyeSpacing, eyeY - 5.5, headX - eyeSpacing + 2.5, eyeY - 4.5);
        ctx.stroke();
        // Right eyebrow
        ctx.beginPath();
        ctx.moveTo(headX + eyeSpacing - 2.5, eyeY - 4.5);
        ctx.quadraticCurveTo(headX + eyeSpacing, eyeY - 5.5, headX + eyeSpacing + 2.5, eyeY - 4);
        ctx.stroke();

        // Nose — small rounded bump
        ctx.fillStyle = '#e8a098';
        ctx.beginPath();
        ctx.ellipse(headX, headY + 2.5, 1.5, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth — friendly smile
        ctx.strokeStyle = '#c47d73';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(headX, headY + 5, 3, 0.15, Math.PI - 0.15, false);
        ctx.stroke();

        ctx.restore();
    }

    drawEye(ctx, x, y, openAmount, time) {
        ctx.save();
        ctx.translate(x, y);

        if (openAmount < 0.3) {
            // Closed eye — just a line
            ctx.strokeStyle = '#4a3530';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-2.5, 0);
            ctx.quadraticCurveTo(0, 0.5, 2.5, 0);
            ctx.stroke();
        } else {
            // Sclera (white)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, 2.8, 2.2 * openAmount, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#4a3530';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // Iris
            ctx.fillStyle = '#4a6741'; // Warm green-brown
            ctx.beginPath();
            ctx.arc(0.3, 0.2, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Pupil
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(0.3, 0.2, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(-0.5, -0.6, 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Eyelid curve (skin-colored arc at top)
            ctx.strokeStyle = '#e8a098';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, 2.8, -Math.PI * 0.85, -Math.PI * 0.15, false);
            ctx.stroke();
        }

        ctx.restore();
    }

    // ---- Beard ----
    drawBeard(ctx, bodyY, beardSwayAngle, time) {
        ctx.save();
        ctx.translate(0, bodyY - 10);
        ctx.rotate(beardSwayAngle);

        // Multi-strand beard with gradient
        const strandOffsets = [
            { xOff: -1, sway: 0.8, len: 14, width: 5, color: '#e8e8e8' },
            { xOff: 0, sway: 1.0, len: 16, width: 6, color: '#f0f0f0' },
            { xOff: 1, sway: 1.2, len: 13, width: 5, color: '#e0e0e0' },
        ];

        strandOffsets.forEach(strand => {
            const swayOffset = Math.sin(time * 2 + strand.xOff) * 1.5 * strand.sway;
            ctx.fillStyle = strand.color;
            ctx.beginPath();
            ctx.moveTo(-strand.width + strand.xOff, 0);
            ctx.bezierCurveTo(
                -strand.width + strand.xOff - 1, strand.len * 0.4,
                -strand.width * 0.3 + swayOffset, strand.len * 0.8,
                swayOffset, strand.len
            );
            ctx.bezierCurveTo(
                strand.width * 0.3 + swayOffset, strand.len * 0.8,
                strand.width + strand.xOff + 1, strand.len * 0.4,
                strand.width + strand.xOff, 0
            );
            ctx.closePath();
            ctx.fill();
        });

        // Strand detail lines
        ctx.strokeStyle = 'rgba(180, 180, 180, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = -2; i <= 2; i++) {
            const sw = Math.sin(time * 2.2 + i * 0.5) * 1.2;
            ctx.beginPath();
            ctx.moveTo(i * 1.5, 1);
            ctx.quadraticCurveTo(i * 1.2 + sw * 0.5, 8, i * 0.8 + sw, 13);
            ctx.stroke();
        }

        // Lighter tips gradient overlay
        const tipGrad = ctx.createLinearGradient(0, 8, 0, 16);
        tipGrad.addColorStop(0, 'rgba(255,255,255,0)');
        tipGrad.addColorStop(1, 'rgba(255,255,255,0.2)');
        ctx.fillStyle = tipGrad;
        ctx.beginPath();
        ctx.ellipse(0, 12, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ---- Hat ----
    drawHat(ctx, bodyY, hatRotation, hatYOffset, hatTilt, time) {
        const hatY = hatYOffset + bodyY - 22;
        ctx.save();
        ctx.translate(0, hatY);
        ctx.rotate(hatRotation);

        // Hat gradient — indigo base
        const hatGrad = ctx.createLinearGradient(0, 0, 0, -38);
        hatGrad.addColorStop(0, '#4b0082');   // Indigo base
        hatGrad.addColorStop(0.5, '#5a1a9e');
        hatGrad.addColorStop(1.0, '#6a2cb5'); // Lighter at tip

        // Hat brim — curved ellipse
        ctx.fillStyle = '#3d006e';
        ctx.beginPath();
        ctx.ellipse(0, 2, 19, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Brim highlight
        ctx.strokeStyle = 'rgba(130, 80, 180, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 1, 18, 4, 0, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Hat cone — organic droopy shape with bezier curves
        const droopX = 5 + (hatTilt || 0) * 3;  // Droop to the right
        const droopY = -32;
        ctx.beginPath();
        ctx.moveTo(-13, 0);
        // Left side of hat
        ctx.bezierCurveTo(-11, -12, -7, -22, -2 + droopX * 0.3, droopY);
        // Tip curves to the right (droopy)
        ctx.bezierCurveTo(droopX * 0.6, droopY - 4, droopX, droopY - 2, droopX + 2, droopY + 3);
        // Right side coming back down
        ctx.bezierCurveTo(droopX - 2, droopY + 6, 10, -14, 13, 0);
        ctx.closePath();
        ctx.fillStyle = hatGrad;
        ctx.fill();
        // Hat outline
        ctx.strokeStyle = '#2d004d';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Fabric fold lines on hat
        ctx.strokeStyle = 'rgba(75, 0, 130, 0.3)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-6, -5);
        ctx.quadraticCurveTo(-3, -15, 1 + droopX * 0.2, -24);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, -5);
        ctx.quadraticCurveTo(5, -14, droopX * 0.4 + 2, -22);
        ctx.stroke();

        // Gold band with gem
        ctx.fillStyle = '#daa520';
        ctx.beginPath();
        ctx.moveTo(-14, -1);
        ctx.quadraticCurveTo(0, -3, 14, -1);
        ctx.quadraticCurveTo(0, 1, -14, -1);
        ctx.closePath();
        ctx.fill();
        // Band highlight
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-12, -1.5);
        ctx.quadraticCurveTo(0, -3, 12, -1.5);
        ctx.stroke();

        // Center gem on band
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(2.5, -1.5);
        ctx.lineTo(0, 1);
        ctx.lineTo(-2.5, -1.5);
        ctx.closePath();
        ctx.fill();
        // Gem highlight
        ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(-0.5, -2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Stars/moons on hat
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        this.drawTinyStar(ctx, -5, -12, 1.2);
        this.drawTinyStar(ctx, 4, -18, 1.0);
        // Tiny crescent
        ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(-2, -22, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hatGrad;
        ctx.beginPath();
        ctx.arc(-1.2, -22.5, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Dangling star at droopy tip
        const tipBob = Math.sin(time * 3) * 1.5;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        this.drawTinyStar(ctx, droopX + 2, droopY + 5 + tipBob, 1.8);

        ctx.restore();
    }

    // ---- Staff ----
    drawStaff(ctx, bodyY, staffAngle, crystalGlow, time) {
        ctx.save();
        ctx.translate(12, bodyY - 5);
        ctx.rotate(staffAngle);

        // Staff shaft — curved organic with wood texture
        const shaftGrad = ctx.createLinearGradient(-2, 0, 2, 0);
        shaftGrad.addColorStop(0, '#6b3410');
        shaftGrad.addColorStop(0.3, '#8b4513');
        shaftGrad.addColorStop(0.7, '#a0622e');
        shaftGrad.addColorStop(1.0, '#7a3d12');

        ctx.strokeStyle = shaftGrad;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.bezierCurveTo(-1, -8, 1, -20, 0, -35);
        ctx.stroke();

        // Wood grain lines
        ctx.strokeStyle = 'rgba(93, 58, 26, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-0.5, 0);
        ctx.bezierCurveTo(-1, -10, 0.5, -22, -0.3, -33);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0.8, -2);
        ctx.bezierCurveTo(0.3, -12, 1, -24, 0.5, -30);
        ctx.stroke();

        // Knot on shaft
        ctx.fillStyle = '#5d3a1a';
        ctx.beginPath();
        ctx.ellipse(0.5, -15, 1.5, 1, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Crystal mount (small metal fitting)
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(-3, -34);
        ctx.lineTo(3, -34);
        ctx.lineTo(2, -36);
        ctx.lineTo(-2, -36);
        ctx.closePath();
        ctx.fill();

        // Crystal gem — multi-layered hexagonal/diamond shape
        const crystalY = -40;
        const glowIntensity = crystalGlow * (0.7 + Math.sin(time * 4) * 0.3);

        // Outer glow
        const outerGlow = ctx.createRadialGradient(0, crystalY, 0, 0, crystalY, 12);
        outerGlow.addColorStop(0, `rgba(0, 255, 255, ${0.3 * glowIntensity})`);
        outerGlow.addColorStop(0.5, `rgba(0, 200, 255, ${0.15 * glowIntensity})`);
        outerGlow.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(0, crystalY, 12, 0, Math.PI * 2);
        ctx.fill();

        // Middle translucent layer
        ctx.fillStyle = `rgba(100, 220, 255, ${0.35 * glowIntensity})`;
        ctx.beginPath();
        ctx.moveTo(0, crystalY - 6);
        ctx.lineTo(4, crystalY - 2);
        ctx.lineTo(4, crystalY + 2);
        ctx.lineTo(0, crystalY + 6);
        ctx.lineTo(-4, crystalY + 2);
        ctx.lineTo(-4, crystalY - 2);
        ctx.closePath();
        ctx.fill();

        // Inner bright core
        const coreGrad = ctx.createRadialGradient(0, crystalY, 0, 0, crystalY, 4);
        coreGrad.addColorStop(0, `rgba(200, 255, 255, ${0.9 * glowIntensity})`);
        coreGrad.addColorStop(0.5, `rgba(0, 255, 255, ${0.7 * glowIntensity})`);
        coreGrad.addColorStop(1, `rgba(0, 200, 230, ${0.4 * glowIntensity})`);
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.moveTo(0, crystalY - 4);
        ctx.lineTo(3, crystalY - 1);
        ctx.lineTo(3, crystalY + 1);
        ctx.lineTo(0, crystalY + 4);
        ctx.lineTo(-3, crystalY + 1);
        ctx.lineTo(-3, crystalY - 1);
        ctx.closePath();
        ctx.fill();

        // Crystal highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * glowIntensity})`;
        ctx.beginPath();
        ctx.ellipse(-1, crystalY - 2, 1.2, 0.8, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting sparkle particles
        this.sparkles.forEach(sp => {
            const angle = sp.angle + time * sp.speed;
            const sx = Math.cos(angle) * sp.dist;
            const sy = Math.sin(angle) * sp.dist * 0.6 + crystalY;
            const sparkleAlpha = sp.alpha * glowIntensity * (0.5 + Math.sin(time * 8 + sp.angle) * 0.5);
            ctx.fillStyle = `rgba(200, 255, 255, ${sparkleAlpha})`;
            ctx.beginPath();
            ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    // ---- Legs with Boots ----
    drawLeg(ctx, leg, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(leg?.angle || 0);
        
        // Leg (hidden mostly by robe)
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-3, 10);
        ctx.quadraticCurveTo(-3, 12, -1, 12);
        ctx.lineTo(1, 12);
        ctx.quadraticCurveTo(3, 12, 3, 10);
        ctx.lineTo(3, 0);
        ctx.closePath();
        ctx.fill();

        // Boot
        ctx.fillStyle = '#3d2b1a';
        ctx.beginPath();
        ctx.moveTo(-4, 9);
        ctx.lineTo(-4, 13);
        ctx.quadraticCurveTo(-4, 15, -2, 15);
        ctx.lineTo(5, 15);
        ctx.quadraticCurveTo(7, 15, 7, 13);
        ctx.lineTo(4, 9);
        ctx.closePath();
        ctx.fill();
        // Boot outline
        ctx.strokeStyle = '#2a1a0e';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Boot sole
        ctx.fillStyle = '#1a0e05';
        ctx.fillRect(-4, 14, 11, 1.5);

        // Boot buckle
        ctx.fillStyle = '#daa520';
        ctx.fillRect(-1, 10, 3, 2);
        // Buckle prong
        ctx.fillStyle = '#c09010';
        ctx.fillRect(0, 10.3, 1, 1.4);

        ctx.restore();
    }
    
    // ---- Arms with Hands ----
    drawArm(ctx, arm, x, y, isLeft, handContent) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(arm?.angle || 0);
        
        // Sleeve (robe-colored, tapered)
        const sleeveGrad = ctx.createLinearGradient(0, 0, 0, 10);
        sleeveGrad.addColorStop(0, '#4169e1');
        sleeveGrad.addColorStop(1, '#3050b0');
        ctx.fillStyle = sleeveGrad;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-2, 10);
        ctx.quadraticCurveTo(0, 11, 2, 10);
        ctx.lineTo(3, 0);
        ctx.closePath();
        ctx.fill();
        // Sleeve outline
        ctx.strokeStyle = '#1a3370';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Sleeve cuff
        ctx.fillStyle = '#6b8cf5';
        ctx.beginPath();
        ctx.ellipse(0, 10, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw carried item or empty hand
        if (handContent) {
            if (handContent.type === 'chicken') {
                this.drawMiniChicken(ctx, 0, 13, handContent.item, isLeft);
            } else if (handContent.type === 'tool') {
                this.drawMiniTool(ctx, 0, 13, handContent.item, isLeft);
            }
        } else {
            // Empty hand
            ctx.fillStyle = '#fdbcb4';
            ctx.beginPath();
            ctx.arc(0, 13, 3, 0, Math.PI * 2);
            ctx.fill();
            // Skin outline
            ctx.strokeStyle = '#d4948c';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            // Thumb
            ctx.fillStyle = '#fdbcb4';
            ctx.beginPath();
            ctx.arc(isLeft ? 2.5 : -2.5, 12, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    // ---- Mini Chicken (carried in hand) ----
    // Draws a ~65% scale illustrative chicken at the hand position
    drawMiniChicken(ctx, hx, hy, chicken, isLeft) {
        const time = this._time || 0;
        const scale = 0.85;
        // Get chicken color from attributes
        const bodyColor = (chicken && chicken.attributes) ? chicken.attributes.color : '#ffffff';
        const darkColor = this._darkenColorSimple(bodyColor, 0.2);
        const lightColor = this._lightenColorSimple(bodyColor, 0.2);

        ctx.save();
        ctx.translate(hx, hy + 2); // Slightly below hand
        ctx.scale(scale, scale);

        // Bobbing animation
        const bob = Math.sin(time * 4) * 1.5;

        // -- Shadow under chicken --
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // -- Tail feathers (behind body) --
        ctx.save();
        ctx.translate(-8, -2 + bob);
        ctx.rotate(-0.25);
        const tailColors = [darkColor, bodyColor, darkColor];
        const tailAngles = [-0.25, 0, 0.25];
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(tailAngles[i]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-3, -6, -6, -10, -2 + i, -13);
            ctx.bezierCurveTo(-1 + i * 0.5, -9, 1, -5, 0, 0);
            ctx.fillStyle = tailColors[i];
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        // -- Dangling legs --
        const legColor = '#e8a020';
        const legDark = '#c08010';
        const dangle = Math.sin(time * 4) * 1.2;
        for (let side = -1; side <= 1; side += 2) {
            const lx = side * 3;
            const ly = 6 + bob;
            ctx.strokeStyle = legColor;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.quadraticCurveTo(lx + dangle * side, ly + 4, lx + dangle * side * 0.5, ly + 8);
            ctx.stroke();
            // Toes
            const footX = lx + dangle * side * 0.5;
            const footY = ly + 8;
            ctx.strokeStyle = legDark;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(footX, footY);
            ctx.lineTo(footX - 1.5, footY + 2);
            ctx.moveTo(footX, footY);
            ctx.lineTo(footX + 0.5, footY + 2);
            ctx.moveTo(footX, footY);
            ctx.lineTo(footX + 2, footY + 1.5);
            ctx.stroke();
        }

        // -- Feathered body (main ellipse) --
        ctx.beginPath();
        ctx.ellipse(0, bob, 10, 8, 0, 0, Math.PI * 2);
        const bodyGrad = ctx.createRadialGradient(2, bob + 2, 1, 0, bob, 10);
        bodyGrad.addColorStop(0, lightColor);
        bodyGrad.addColorStop(0.7, bodyColor);
        bodyGrad.addColorStop(1, darkColor);
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // -- Breast feathers (lighter overlapping ellipses) --
        ctx.fillStyle = lightColor;
        ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.4;
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.ellipse(2 + i * 1.5, bob + 2 + i, 3, 2, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = Math.min(1, (ctx.globalAlpha || 0.4) / 0.4);

        // -- Wing (tucked against body) --
        ctx.save();
        ctx.translate(-5, bob);
        ctx.rotate(-0.1);
        const wingShades = [darkColor, bodyColor, lightColor];
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, -1 + i * 1.5);
            ctx.bezierCurveTo(-4, -3 + i * 2, -7, 0 + i * 2, -5, 3 + i * 1.5);
            ctx.bezierCurveTo(-3, 2 + i, -1, 0 + i * 0.8, 0, -1 + i * 1.5);
            ctx.fillStyle = wingShades[i];
            ctx.fill();
        }
        ctx.restore();

        // -- Neck + Head --
        const headX = 2;
        const headY = -7 + bob;

        // Neck
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(0, bob - 4);
        ctx.quadraticCurveTo(1, bob - 6, headX, headY + 4);
        ctx.quadraticCurveTo(3, bob - 6, 2, bob - 3);
        ctx.fill();

        // Head circle
        const headGrad = ctx.createRadialGradient(headX + 1, headY - 1, 1, headX, headY, 5);
        headGrad.addColorStop(0, lightColor);
        headGrad.addColorStop(1, bodyColor);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(headX, headY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Comb (3 bumps)
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(headX - 2, headY - 8, 2, Math.PI, 0);
        ctx.arc(headX, headY - 9, 2.2, Math.PI, 0);
        ctx.arc(headX + 2, headY - 8, 2, Math.PI, 0);
        ctx.closePath();
        ctx.fill();

        // Wattle
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.ellipse(headX + 4, headY + 2, 1, 2, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#f0a030';
        ctx.beginPath();
        ctx.moveTo(headX + 4, headY - 1);
        ctx.lineTo(headX + 8, headY);
        ctx.lineTo(headX + 4, headY + 1);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(headX + 2, headY - 1, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(headX + 2.3, headY - 0.8, 0.9, 0, Math.PI * 2);
        ctx.fill();
        // Eye highlight
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(headX + 1.8, headY - 1.5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ---- Mini Tool (carried in hand) ----
    drawMiniTool(ctx, hx, hy, tool, isLeft) {
        if (!tool) return;
        ctx.save();
        ctx.translate(hx, hy + 1);

        switch (tool.type) {
            case 'eggBasket':
                this._drawMiniEggBasket(ctx, tool);
                break;
            case 'foodBasket':
                this._drawMiniFoodBasket(ctx, tool);
                break;
            case 'hammer':
                this._drawMiniHammer(ctx, isLeft);
                break;
        }

        ctx.restore();
    }

    _drawMiniEggBasket(ctx, tool) {
        // Small basket
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(0, 3, 7, 0, Math.PI, false);
        ctx.fill();
        // Weave lines
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.6;
        for (let i = -5; i <= 5; i += 3) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 6);
            ctx.stroke();
        }
        // Handle
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -2, 5, Math.PI, 0, false);
        ctx.stroke();
        // Egg count
        const eggs = tool.eggs || 0;
        if (eggs > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(eggs.toString(), 0, 5);
        }
    }

    _drawMiniFoodBasket(ctx, tool) {
        // Small orange basket
        ctx.fillStyle = '#d2691e';
        ctx.beginPath();
        ctx.arc(0, 3, 7, 0, Math.PI, false);
        ctx.fill();
        // Handle
        ctx.strokeStyle = '#d2691e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -2, 5, Math.PI, 0, false);
        ctx.stroke();
        // Grain dots
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-2, 0, 1.5, 0, Math.PI * 2);
        ctx.arc(1, -1, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawMiniHammer(ctx, isLeft) {
        // Hammer handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-1.5, -1, 3, 12);
        // Hammer head
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(-6, -5, 12, 6);
        // Head highlight
        ctx.fillStyle = '#b0b0b0';
        ctx.fillRect(-5, -4, 10, 2);
    }

    // ---- Color utilities for mini chicken ----
    _darkenColorSimple(hex, amount) {
        try {
            const num = parseInt(hex.replace('#', ''), 16);
            const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
            const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
            const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
            return `rgb(${r},${g},${b})`;
        } catch (e) {
            return '#888888';
        }
    }

    _lightenColorSimple(hex, amount) {
        try {
            const num = parseInt(hex.replace('#', ''), 16);
            const r = Math.min(255, Math.floor(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
            const g = Math.min(255, Math.floor(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
            const b = Math.min(255, Math.floor((num & 0xff) + (255 - (num & 0xff)) * amount));
            return `rgb(${r},${g},${b})`;
        } catch (e) {
            return '#cccccc';
        }
    }
}

// Utility functions
function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
    const diff = b - a;
    const adjusted = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
    return a + adjusted * t;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WizardAnimator };
}
