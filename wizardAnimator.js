/**
 * wizardAnimator.js - Whimsical wizard animation controller
 * Handles state machine, pose interpolation, and smooth transitions
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
            victory: { frameTime: 0.1, loop: false }
        };
        
        // Current pose cache
        this.currentPose = this.getPoseFromFrame('idle', 0);
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
            staffAngle: this.lerpAngle(pose1.staffAngle, pose2.staffAngle, t)
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
    draw(ctx, state, time, facingDirection) {
        // Update animation state
        this.update(0.016, state); // Assume ~60fps for draw updates
        
        const pose = this.currentPose;
        
        // Save context for wizard drawing
        ctx.save();
        
        // Apply facing direction
        if (facingDirection === 'left') {
            ctx.scale(-1, 1);
        }
        
        // Draw wizard body with pose
        this.drawBody(ctx, pose);
        
        ctx.restore();
    }
    
    drawBody(ctx, pose) {
        const bodyY = pose.bodyY || 0;
        const bodyScaleY = pose.bodyScaleY || 1;
        
        // Body shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 22, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Robe body
        ctx.fillStyle = '#2d1b4e';
        ctx.beginPath();
        ctx.ellipse(0, bodyY, 14, 18 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Robe flare
        const flare = pose.robeFlare || 0;
        ctx.fillStyle = '#3d2b5e';
        ctx.beginPath();
        ctx.moveTo(-12, bodyY + 10);
        ctx.quadraticCurveTo(0, 22 + flare, 12, bodyY + 10);
        ctx.lineTo(8, bodyY);
        ctx.lineTo(-8, bodyY);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, bodyY - 15, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(-4, bodyY - 18, 3, 3);
        ctx.fillRect(1, bodyY - 18, 3, 3);
        
        // Beard with sway
        const beardSway = pose.beardSway || 0;
        ctx.save();
        ctx.translate(0, bodyY - 10);
        ctx.rotate(beardSway);
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.quadraticCurveTo(0, 15, 6, 0);
        ctx.quadraticCurveTo(0, 10, -6, 0);
        ctx.fill();
        ctx.restore();
        
        // Hat
        const hatY = (pose.hatY || 0) + bodyY - 20;
        const hatRotation = pose.hatRotation || 0;
        ctx.save();
        ctx.translate(0, hatY);
        ctx.rotate(hatRotation);
        
        // Hat base
        ctx.fillStyle = '#2d1b4e';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat cone
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.quadraticCurveTo(-5, -25, 0, -35);
        ctx.quadraticCurveTo(5, -25, 12, 0);
        ctx.closePath();
        ctx.fill();
        
        // Hat band
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-12, -2, 24, 4);
        
        ctx.restore();
        
        // Staff
        const staffAngle = pose.staffAngle || 0;
        ctx.save();
        ctx.translate(12, bodyY - 5);
        ctx.rotate(staffAngle);
        
        // Staff shaft
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -35);
        ctx.stroke();
        
        // Crystal
        const pulse = 0.7 + Math.sin(time * 4) * 0.3;
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, -38, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, -38, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Draw legs
        this.drawLeg(ctx, pose.legL, -6, bodyY + 15);
        this.drawLeg(ctx, pose.legR, 6, bodyY + 15);
        
        // Draw arms
        this.drawArm(ctx, pose.armL, -12, bodyY - 5, true);
        this.drawArm(ctx, pose.armR, 12, bodyY - 5, false);
    }
    
    drawLeg(ctx, leg, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(leg?.angle || 0);
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(-3, 0, 6, 12);
        
        ctx.restore();
    }
    
    drawArm(ctx, arm, x, y, isLeft) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(arm?.angle || 0);
        
        ctx.fillStyle = '#2d1b4e';
        ctx.fillRect(-2, 0, 4, 10);
        
        // Hand
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, 12, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
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
