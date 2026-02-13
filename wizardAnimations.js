/**
 * wizardAnimations.js - Pose data for all wizard animation states
 * Includes idle, walk, turn, pickup, carry, deposit, startled, victory
 * Enhanced with robeSway, hatTilt, crystalGlow properties for illustrative rendering
 */

// Default limb pose
const defaultLimb = { angle: 0, x: 0, y: 0 };

// Idle animation - Breathing loop (20 frames, 2 seconds)
// Enhanced with eye blink timing, crystal glow pulse, and subtle robe/hat motion
const IDLE_FRAMES = [
    { // Frame 0: Base
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: 0, x: -12, y: -5 }, armR: { angle: 0, x: 12, y: -5 },
        hatRotation: 0, hatY: 0, robeFlare: 0, beardSway: 0, staffAngle: 0,
        robeSway: 0, hatTilt: 0, crystalGlow: 0.85
    },
    { // Frame 5: Inhale
        bodyY: -1, bodyScaleY: 1.02, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: -0.05, x: -12, y: -6 }, armR: { angle: 0.05, x: 12, y: -6 },
        hatRotation: 0.02, hatY: -1, robeFlare: 2, beardSway: 0.02, staffAngle: 0,
        robeSway: 0.5, hatTilt: 0.02, crystalGlow: 0.9
    },
    { // Frame 10: Peak inhale
        bodyY: -2, bodyScaleY: 1.03, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: -0.1, x: -12, y: -7 }, armR: { angle: 0.1, x: 12, y: -7 },
        hatRotation: 0.03, hatY: -2, robeFlare: 4, beardSway: 0.04, staffAngle: 0,
        robeSway: 1.0, hatTilt: 0.04, crystalGlow: 1.0
    },
    { // Frame 15: Exhale
        bodyY: -1, bodyScaleY: 1.01, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: -0.05, x: -12, y: -6 }, armR: { angle: 0.05, x: 12, y: -6 },
        hatRotation: 0.01, hatY: -1, robeFlare: 2, beardSway: 0.02, staffAngle: 0,
        robeSway: 0.5, hatTilt: 0.02, crystalGlow: 0.9
    },
    { // Frame 19: Return to base
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: 0, x: -12, y: -5 }, armR: { angle: 0, x: 12, y: -5 },
        hatRotation: 0, hatY: 0, robeFlare: 0, beardSway: 0, staffAngle: 0,
        robeSway: 0, hatTilt: 0, crystalGlow: 0.85
    }
];

// Walk animation - 8-frame cycle
// Enhanced with robe sway alternation and crystal glow bounce
const WALK_FRAMES = [
    { // Frame 0: Contact
        bodyY: 2, bodyScaleY: 0.98, bodyRotation: 0.02,
        legL: { angle: 0.3, x: -8, y: 0 }, legR: { angle: -0.1, x: 5, y: 0 },
        armL: { angle: -0.3, x: -12, y: -3 }, armR: { angle: 0.3, x: 12, y: -3 },
        hatRotation: 0.05, hatY: 1, robeFlare: 0, beardSway: 0.1, staffAngle: -0.1,
        robeSway: -2.0, hatTilt: 0.06, crystalGlow: 0.9
    },
    { // Frame 1: Down (squash)
        bodyY: 4, bodyScaleY: 0.95, bodyRotation: 0,
        legL: { angle: 0.1, x: -5, y: 0 }, legR: { angle: -0.3, x: 3, y: 0 },
        armL: { angle: -0.1, x: -12, y: -5 }, armR: { angle: 0.1, x: 12, y: -5 },
        hatRotation: 0.08, hatY: 2, robeFlare: 5, beardSway: 0.15, staffAngle: 0,
        robeSway: -1.0, hatTilt: 0.08, crystalGlow: 0.8
    },
    { // Frame 2: Pass
        bodyY: 2, bodyScaleY: 0.98, bodyRotation: -0.02,
        legL: { angle: -0.1, x: -2, y: 0 }, legR: { angle: -0.1, x: 2, y: 0 },
        armL: { angle: 0.1, x: -10, y: -5 }, armR: { angle: -0.1, x: 10, y: -5 },
        hatRotation: 0.05, hatY: 1, robeFlare: 10, beardSway: 0.05, staffAngle: 0.1,
        robeSway: 1.0, hatTilt: 0.04, crystalGlow: 0.95
    },
    { // Frame 3: Up (stretch)
        bodyY: -2, bodyScaleY: 1.02, bodyRotation: -0.02,
        legL: { angle: -0.3, x: 3, y: 0 }, legR: { angle: 0.3, x: 8, y: 0 },
        armL: { angle: 0.3, x: -12, y: -8 }, armR: { angle: -0.3, x: 12, y: -8 },
        hatRotation: -0.05, hatY: -1, robeFlare: 15, beardSway: -0.1, staffAngle: 0.15,
        robeSway: 2.5, hatTilt: -0.04, crystalGlow: 1.1
    },
    { // Frame 4: Contact (mirror)
        bodyY: 2, bodyScaleY: 0.98, bodyRotation: -0.02,
        legL: { angle: -0.1, x: 5, y: 0 }, legR: { angle: 0.3, x: -8, y: 0 },
        armL: { angle: 0.3, x: -12, y: -3 }, armR: { angle: -0.3, x: 12, y: -3 },
        hatRotation: -0.05, hatY: 1, robeFlare: 0, beardSway: -0.1, staffAngle: 0.1,
        robeSway: 2.0, hatTilt: -0.06, crystalGlow: 0.9
    },
    { // Frame 5: Down (squash, mirror)
        bodyY: 4, bodyScaleY: 0.95, bodyRotation: 0,
        legL: { angle: -0.3, x: 3, y: 0 }, legR: { angle: 0.1, x: -5, y: 0 },
        armL: { angle: 0.1, x: -12, y: -5 }, armR: { angle: -0.1, x: 12, y: -5 },
        hatRotation: -0.08, hatY: 2, robeFlare: 5, beardSway: -0.15, staffAngle: 0,
        robeSway: 1.0, hatTilt: -0.08, crystalGlow: 0.8
    },
    { // Frame 6: Pass (mirror)
        bodyY: 2, bodyScaleY: 0.98, bodyRotation: 0.02,
        legL: { angle: -0.1, x: 2, y: 0 }, legR: { angle: -0.1, x: -2, y: 0 },
        armL: { angle: -0.1, x: -10, y: -5 }, armR: { angle: 0.1, x: 10, y: -5 },
        hatRotation: -0.05, hatY: 1, robeFlare: 10, beardSway: -0.05, staffAngle: -0.1,
        robeSway: -1.0, hatTilt: -0.04, crystalGlow: 0.95
    },
    { // Frame 7: Up (stretch, mirror)
        bodyY: -2, bodyScaleY: 1.02, bodyRotation: 0.02,
        legL: { angle: 0.3, x: -8, y: 0 }, legR: { angle: -0.3, x: 3, y: 0 },
        armL: { angle: -0.3, x: -12, y: -8 }, armR: { angle: 0.3, x: 12, y: -8 },
        hatRotation: 0.05, hatY: -1, robeFlare: 15, beardSway: 0.1, staffAngle: -0.15,
        robeSway: -2.5, hatTilt: 0.04, crystalGlow: 1.1
    }
];

// Turn animation - 4 frames
const TURN_FRAMES = [
    { // Anticipation
        bodyY: 0, bodyScaleY: 0.95, bodyRotation: -0.3,
        legL: { angle: -0.1, x: -5, y: 0 }, legR: { angle: 0.1, x: 5, y: 0 },
        armL: { angle: -0.2, x: -12, y: -5 }, armR: { angle: 0.2, x: 12, y: -5 },
        hatRotation: -0.1, hatY: 0, robeFlare: 10, beardSway: -0.2, staffAngle: -0.3
    },
    { // Snap
        bodyY: 0, bodyScaleY: 1.02, bodyRotation: 0.3,
        legL: { angle: 0.1, x: -5, y: 0 }, legR: { angle: -0.1, x: 5, y: 0 },
        armL: { angle: 0.3, x: -12, y: -5 }, armR: { angle: -0.3, x: 12, y: -5 },
        hatRotation: 0.2, hatY: 0, robeFlare: 20, beardSway: 0.3, staffAngle: 0.3
    },
    { // Settle
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0.05,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: 0.1, x: -12, y: -5 }, armR: { angle: -0.1, x: 12, y: -5 },
        hatRotation: 0.05, hatY: 0, robeFlare: 5, beardSway: 0.1, staffAngle: 0
    },
    { // Rest
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: 0, x: -12, y: -5 }, armR: { angle: 0, x: 12, y: -5 },
        hatRotation: 0, hatY: 0, robeFlare: 0, beardSway: 0, staffAngle: 0
    }
];

// Pickup animation - 6 frames
const PICKUP_FRAMES = [
    { // Anticipation: Crouch
        bodyY: 8, bodyScaleY: 0.9, bodyRotation: 0,
        legL: { angle: 0.2, x: -5, y: 0 }, legR: { angle: -0.2, x: 5, y: 0 },
        armL: { angle: 0.5, x: -10, y: 5 }, armR: { angle: 0.5, x: 10, y: 5 },
        hatRotation: 0.15, hatY: 2, robeFlare: 5, beardSway: 0.1, staffAngle: 0.3
    },
    { // Reach
        bodyY: 5, bodyScaleY: 0.95, bodyRotation: 0,
        legL: { angle: 0.1, x: -5, y: 0 }, legR: { angle: -0.1, x: 5, y: 0 },
        armL: { angle: -0.3, x: -8, y: 10 }, armR: { angle: -0.3, x: 8, y: 10 },
        hatRotation: 0.1, hatY: 1, robeFlare: 8, beardSway: 0.05, staffAngle: 0.2
    },
    { // Grab
        bodyY: 5, bodyScaleY: 0.95, bodyRotation: 0,
        legL: { angle: 0.1, x: -5, y: 0 }, legR: { angle: -0.1, x: 5, y: 0 },
        armL: { angle: -0.5, x: -5, y: 8 }, armR: { angle: -0.5, x: 5, y: 8 },
        hatRotation: 0.05, hatY: 0, robeFlare: 10, beardSway: 0, staffAngle: 0.1
    },
    { // Lift
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: -0.8, x: -8, y: 0 }, armR: { angle: -0.8, x: 8, y: 0 },
        hatRotation: -0.05, hatY: -1, robeFlare: 8, beardSway: -0.05, staffAngle: 0
    },
    { // Settle
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: -0.5, x: -12, y: -5 }, armR: { angle: -0.5, x: 12, y: -5 },
        hatRotation: 0, hatY: 0, robeFlare: 5, beardSway: 0, staffAngle: -0.1
    },
    { // Hold (carry pose)
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: -0.3, x: -15, y: -8 }, armR: { angle: -0.3, x: 15, y: -8 },
        hatRotation: 0, hatY: 0, robeFlare: 3, beardSway: 0, staffAngle: -0.1
    }
];

// Carry animation - Modified walk with more weight (8 frames)
const CARRY_FRAMES = [
    { // Frame 0: Contact
        bodyY: 3, bodyScaleY: 0.97, bodyRotation: 0.02,
        legL: { angle: 0.3, x: -8, y: 0 }, legR: { angle: -0.1, x: 5, y: 0 },
        armL: { angle: -0.3, x: -15, y: -8 }, armR: { angle: -0.3, x: 15, y: -8 },
        hatRotation: 0.05, hatY: 1, robeFlare: 3, beardSway: 0.1, staffAngle: -0.1
    },
    { // Frame 1: Down (deep squash)
        bodyY: 6, bodyScaleY: 0.93, bodyRotation: 0,
        legL: { angle: 0.1, x: -5, y: 0 }, legR: { angle: -0.3, x: 3, y: 0 },
        armL: { angle: -0.3, x: -15, y: -8 }, armR: { angle: -0.3, x: 15, y: -8 },
        hatRotation: 0.08, hatY: 2, robeFlare: 8, beardSway: 0.15, staffAngle: 0
    },
    { // Frame 2: Pass
        bodyY: 3, bodyScaleY: 0.97, bodyRotation: -0.02,
        legL: { angle: -0.1, x: -2, y: 0 }, legR: { angle: -0.1, x: 2, y: 0 },
        armL: { angle: -0.3, x: -15, y: -8 }, armR: { angle: -0.3, x: 15, y: -8 },
        hatRotation: 0.05, hatY: 1, robeFlare: 12, beardSway: 0.05, staffAngle: 0.1
    },
    { // Frame 3: Up (high stretch)
        bodyY: -3, bodyScaleY: 1.03, bodyRotation: -0.02,
        legL: { angle: -0.3, x: 3, y: 0 }, legR: { angle: 0.3, x: 8, y: 0 },
        armL: { angle: -0.3, x: -15, y: -8 }, armR: { angle: -0.3, x: 15, y: -8 },
        hatRotation: -0.05, hatY: -1, robeFlare: 18, beardSway: -0.1, staffAngle: 0.15
    },
    { // Frame 4: Contact (mirror)
        bodyY: 3, bodyScaleY: 0.97, bodyRotation: -0.02,
        legL: { angle: -0.1, x: 5, y: 0 }, legR: { angle: 0.3, x: -8, y: 0 },
        armL: { angle: -0.3, x: -15, y: -8 }, armR: { angle: -0.3, x: 15, y: -8 },
        hatRotation: -0.05, hatY: 1, robeFlare: 3, beardSway: -0.1, staffAngle: 0.1
    },
    { // Frame 5: Down (squash, mirror)
        bodyY: 6, bodyScaleY: 0.93, bodyRotation: 0,
        legL: { angle: -0.3, x: 3, y: 0 }, legR: { angle: 0.1, x: -5, y: 0 },
        armL: { angle: -0.3, x: -15, y: -8 }, armR: { angle: -0.3, x: 15, y: -8 },
        hatRotation: -0.08, hatY: 2, robeFlare: 8, beardSway: -0.15, staffAngle: 0
    },
    { // Frame 6: Pass (mirror)
        bodyY: 3, bodyScaleY: 0.97, bodyRotation: 0.02,
        legL: { angle: -0.1, x: 2, y: 0 }, legR: { angle: -0.1, x: -2, y: 0 },
        armL: { angle: -0.3, x: -15, y: -8 }, armR: { angle: -0.3, x: 15, y: -8 },
        hatRotation: -0.05, hatY: 1, robeFlare: 12, beardSway: -0.05, staffAngle: -0.1
    },
    { // Frame 7: Up (stretch, mirror)
        bodyY: -3, bodyScaleY: 1.03, bodyRotation: 0.02,
        legL: { angle: 0.3, x: -8, y: 0 }, legR: { angle: -0.3, x: 3, y: 0 },
        armL: { angle: -0.3, x: -15, y: -8 }, armR: { angle: -0.3, x: 15, y: -8 },
        hatRotation: 0.05, hatY: -1, robeFlare: 18, beardSway: 0.1, staffAngle: -0.15
    }
];

// Deposit animation - 5 frames
const DEPOSIT_FRAMES = [
    { // Approach (careful)
        bodyY: 1, bodyScaleY: 0.99, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: -0.5, x: -15, y: -5 }, armR: { angle: -0.5, x: 15, y: -5 },
        hatRotation: 0, hatY: 0, robeFlare: 3, beardSway: 0, staffAngle: -0.1
    },
    { // Lower
        bodyY: 6, bodyScaleY: 0.92, bodyRotation: 0,
        legL: { angle: 0.1, x: -5, y: 0 }, legR: { angle: -0.1, x: 5, y: 0 },
        armL: { angle: -0.3, x: -10, y: 5 }, armR: { angle: -0.3, x: 10, y: 5 },
        hatRotation: 0.05, hatY: 1, robeFlare: 8, beardSway: 0.05, staffAngle: 0
    },
    { // Release
        bodyY: 6, bodyScaleY: 0.92, bodyRotation: 0,
        legL: { angle: 0.1, x: -5, y: 0 }, legR: { angle: -0.1, x: 5, y: 0 },
        armL: { angle: 0, x: -8, y: 8 }, armR: { angle: 0, x: 8, y: 8 },
        hatRotation: 0.05, hatY: 1, robeFlare: 10, beardSway: 0.05, staffAngle: 0
    },
    { // Push
        bodyY: 4, bodyScaleY: 0.95, bodyRotation: 0,
        legL: { angle: 0.05, x: -5, y: 0 }, legR: { angle: -0.05, x: 5, y: 0 },
        armL: { angle: 0.3, x: -5, y: 5 }, armR: { angle: 0.3, x: 5, y: 5 },
        hatRotation: 0.02, hatY: 0, robeFlare: 8, beardSway: 0.02, staffAngle: 0.1
    },
    { // Return
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: 0, x: -12, y: -5 }, armR: { angle: 0, x: 12, y: -5 },
        hatRotation: 0, hatY: 0, robeFlare: 0, beardSway: 0, staffAngle: 0
    }
];

// Startled animation - 4 frames
const STARTLED_FRAMES = [
    { // Jump back
        bodyY: -10, bodyScaleY: 1.05, bodyRotation: -0.2,
        legL: { angle: -0.5, x: -8, y: 0 }, legR: { angle: 0.3, x: 5, y: 0 },
        armL: { angle: -1.0, x: -15, y: -10 }, armR: { angle: -0.5, x: 10, y: 0 },
        hatRotation: 0.3, hatY: -5, robeFlare: 15, beardSway: 0.3, staffAngle: -0.5,
        crystalGlow: 1.5
    },
    { // Peak
        bodyY: -12, bodyScaleY: 1.08, bodyRotation: -0.15,
        legL: { angle: -0.3, x: -6, y: 0 }, legR: { angle: 0.2, x: 4, y: 0 },
        armL: { angle: -1.1, x: -12, y: -12 }, armR: { angle: -0.6, x: 8, y: -5 },
        hatRotation: 0.35, hatY: -8, robeFlare: 20, beardSway: 0.35, staffAngle: -0.6,
        crystalGlow: 1.3
    },
    { // Settle
        bodyY: -5, bodyScaleY: 1.02, bodyRotation: -0.05,
        legL: { angle: -0.1, x: -5, y: 0 }, legR: { angle: 0.1, x: 5, y: 0 },
        armL: { angle: -0.5, x: -12, y: -5 }, armR: { angle: -0.2, x: 10, y: -2 },
        hatRotation: 0.1, hatY: -3, robeFlare: 10, beardSway: 0.1, staffAngle: -0.2
    },
    { // Rest
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: 0, x: -12, y: -5 }, armR: { angle: 0, x: 12, y: -5 },
        hatRotation: 0, hatY: 0, robeFlare: 0, beardSway: 0, staffAngle: 0
    }
];

// Victory animation - 4 frames
const VICTORY_FRAMES = [
    { // Raise
        bodyY: -2, bodyScaleY: 1.02, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: -2.0, x: -10, y: -20 }, armR: { angle: -2.0, x: 10, y: -20 },
        hatRotation: -0.1, hatY: -2, robeFlare: 5, beardSway: -0.1, staffAngle: -0.2,
        crystalGlow: 1.2
    },
    { // Hold high
        bodyY: -4, bodyScaleY: 1.05, bodyRotation: 0,
        legL: { angle: -0.1, x: -5, y: 0 }, legR: { angle: 0.1, x: 5, y: 0 },
        armL: { angle: -2.2, x: -8, y: -25 }, armR: { angle: -2.2, x: 8, y: -25 },
        hatRotation: -0.15, hatY: -3, robeFlare: 8, beardSway: -0.15, staffAngle: -0.3,
        crystalGlow: 1.4
    },
    { // Hold (stay high)
        bodyY: -4, bodyScaleY: 1.05, bodyRotation: 0,
        legL: { angle: -0.05, x: -5, y: 0 }, legR: { angle: 0.05, x: 5, y: 0 },
        armL: { angle: -2.2, x: -8, y: -25 }, armR: { angle: -2.2, x: 8, y: -25 },
        hatRotation: -0.15, hatY: -3, robeFlare: 8, beardSway: -0.15, staffAngle: -0.3,
        crystalGlow: 1.4
    },
    { // Return
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: 0,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: 0, x: 5, y: 0 },
        armL: { angle: 0, x: -12, y: -5 }, armR: { angle: 0, x: 12, y: -5 },
        hatRotation: 0, hatY: 0, robeFlare: 0, beardSway: 0, staffAngle: 0
    }
];

// Hammer/Repair animation - 6 frame swing cycle
const HAMMER_FRAMES = [
    { // Frame 0: Wind up - arm raised back
        bodyY: 0, bodyScaleY: 0.98, bodyRotation: -0.1,
        legL: { angle: 0.1, x: -5, y: 0 }, legR: { angle: -0.2, x: 5, y: 0 },
        armL: { angle: -0.3, x: -12, y: -5 }, 
        armR: { angle: -1.8, x: 20, y: -15 }, // Arm raised high with hammer
        hatRotation: -0.1, hatY: 0, robeFlare: 5, beardSway: -0.1, staffAngle: 0
    },
    { // Frame 1: Swing start - arm forward
        bodyY: 2, bodyScaleY: 0.97, bodyRotation: 0.05,
        legL: { angle: 0.05, x: -5, y: 0 }, legR: { angle: -0.15, x: 5, y: 0 },
        armL: { angle: -0.2, x: -12, y: -5 },
        armR: { angle: -0.5, x: 18, y: -8 }, // Arm coming down
        hatRotation: 0.05, hatY: 1, robeFlare: 8, beardSway: 0.05, staffAngle: 0
    },
    { // Frame 2: Impact - arm down
        bodyY: 4, bodyScaleY: 0.95, bodyRotation: 0.15,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: -0.1, x: 5, y: 0 },
        armL: { angle: -0.1, x: -12, y: -5 },
        armR: { angle: 0.8, x: 12, y: 5 }, // Arm extended forward/down
        hatRotation: 0.15, hatY: 2, robeFlare: 12, beardSway: 0.15, staffAngle: 0
    },
    { // Frame 3: Follow through - arm continues down
        bodyY: 3, bodyScaleY: 0.96, bodyRotation: 0.1,
        legL: { angle: 0, x: -5, y: 0 }, legR: { angle: -0.05, x: 5, y: 0 },
        armL: { angle: -0.15, x: -12, y: -5 },
        armR: { angle: 0.5, x: 15, y: 0 }, // Arm rising slightly
        hatRotation: 0.1, hatY: 1, robeFlare: 10, beardSway: 0.1, staffAngle: 0
    },
    { // Frame 4: Recovery - arm coming back up
        bodyY: 1, bodyScaleY: 0.98, bodyRotation: 0,
        legL: { angle: 0.05, x: -5, y: 0 }, legR: { angle: -0.1, x: 5, y: 0 },
        armL: { angle: -0.2, x: -12, y: -5 },
        armR: { angle: -0.5, x: 16, y: -8 }, // Arm mid-rise
        hatRotation: 0.05, hatY: 0, robeFlare: 7, beardSway: 0.05, staffAngle: 0
    },
    { // Frame 5: Return to ready - arm up
        bodyY: 0, bodyScaleY: 1.0, bodyRotation: -0.05,
        legL: { angle: 0.1, x: -5, y: 0 }, legR: { angle: -0.15, x: 5, y: 0 },
        armL: { angle: -0.3, x: -12, y: -5 },
        armR: { angle: -1.2, x: 18, y: -12 }, // Arm raised for next swing
        hatRotation: -0.05, hatY: 0, robeFlare: 5, beardSway: -0.05, staffAngle: 0
    }
];

// Master animation collection
const WIZARD_ANIMATIONS = {
    idle: IDLE_FRAMES,
    walk: WALK_FRAMES,
    turn: TURN_FRAMES,
    pickup: PICKUP_FRAMES,
    carry: CARRY_FRAMES,
    deposit: DEPOSIT_FRAMES,
    startled: STARTLED_FRAMES,
    victory: VICTORY_FRAMES,
    hammer: HAMMER_FRAMES,
    cast: HAMMER_FRAMES  // Alias for compatibility
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { defaultLimb, IDLE_FRAMES, WALK_FRAMES, TURN_FRAMES, PICKUP_FRAMES, CARRY_FRAMES, DEPOSIT_FRAMES, STARTLED_FRAMES, VICTORY_FRAMES, HAMMER_FRAMES, WIZARD_ANIMATIONS };
}
