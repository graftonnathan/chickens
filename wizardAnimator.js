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
