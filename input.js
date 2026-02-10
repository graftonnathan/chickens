/**
 * Input Handler - Manages keyboard input
 */
class InputHandler {
    constructor() {
        this.keys = {};
        this.justPressed = {}; // For one-shot key detection
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            // Defensive check: e.key may be undefined in some browser contexts
            const rawKey = e.key || e.code || '';
            const key = rawKey.toLowerCase();
            if (!key) return; // Skip if no valid key

            if (!this.keys[key]) {
                this.justPressed[key] = true;
            }
            this.keys[key] = true;

            // Also handle shift key variations
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || key === 'shift') {
                this.keys['shift'] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const rawKey = e.key || e.code || '';
            const key = rawKey.toLowerCase();
            if (!key) return;

            this.keys[key] = false;

            // Also handle shift key variations
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || key === 'shift') {
                this.keys['shift'] = false;
            }
        });
    }

    getMovementVector() {
        let dx = 0;
        let dy = 0;

        // WASD
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        return { dx, dy };
    }

    isPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }

    isJustPressed(key) {
        const k = key.toLowerCase();
        if (this.justPressed[k]) {
            this.justPressed[k] = false;
            return true;
        }
        return false;
    }

    // Sprint key
    isSprinting() {
        return this.keys['shift'];
    }

    // Interaction key
    isInteractPressed() {
        return this.isJustPressed('e');
    }

    // Spell keys
    getSpellPressed() {
        if (this.isJustPressed('1')) return 1;
        if (this.isJustPressed('2')) return 2;
        if (this.isJustPressed('3')) return 3;
        return null;
    }

    clearJustPressed() {
        this.justPressed = {};
    }
}
