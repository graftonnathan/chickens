import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputHandler } from '../../input.js';

/**
 * Helper to dispatch a keyboard event on the window.
 * @param {'keydown'|'keyup'} type
 * @param {string} key - e.key value
 * @param {object} extras - additional KeyboardEvent props (e.g. code)
 */
function fireKey(type, key, extras = {}) {
    const event = new KeyboardEvent(type, {
        key,
        bubbles: true,
        ...extras
    });
    window.dispatchEvent(event);
}

describe('InputHandler', () => {
    let input;

    beforeEach(() => {
        input = new InputHandler();
    });

    // ── key tracking (keydown / keyup) ──────────────────────────────
    describe('key tracking', () => {
        it('tracks a key as pressed after keydown', () => {
            fireKey('keydown', 'w');
            expect(input.isPressed('w')).toBe(true);
        });

        it('tracks a key as released after keyup', () => {
            fireKey('keydown', 'w');
            fireKey('keyup', 'w');
            expect(input.isPressed('w')).toBe(false);
        });

        it('normalizes keys to lowercase', () => {
            fireKey('keydown', 'W');
            expect(input.isPressed('w')).toBe(true);
        });

        it('tracks multiple keys simultaneously', () => {
            fireKey('keydown', 'w');
            fireKey('keydown', 'a');
            expect(input.isPressed('w')).toBe(true);
            expect(input.isPressed('a')).toBe(true);
        });

        it('returns false for keys never pressed', () => {
            expect(input.isPressed('z')).toBe(false);
        });

        it('handles key with undefined e.key by falling back to e.code', () => {
            // Simulate edge case where e.key is undefined
            const event = new KeyboardEvent('keydown', {
                code: 'KeyX',
                bubbles: true
            });
            // Override key to be empty string to simulate undefined/empty
            Object.defineProperty(event, 'key', { value: '' });
            Object.defineProperty(event, 'code', { value: 'KeyX' });
            window.dispatchEvent(event);
            expect(input.isPressed('keyx')).toBe(true);
        });
    });

    // ── justPressed (one-shot detection) ────────────────────────────
    describe('justPressed', () => {
        it('returns true on first check after keydown', () => {
            fireKey('keydown', 'e');
            expect(input.isJustPressed('e')).toBe(true);
        });

        it('returns false on second check (consumed)', () => {
            fireKey('keydown', 'e');
            input.isJustPressed('e'); // consume
            expect(input.isJustPressed('e')).toBe(false);
        });

        it('does not re-trigger if key is held down (repeat keydown)', () => {
            fireKey('keydown', 'e');
            input.isJustPressed('e'); // consume
            // Holding down triggers another keydown while still pressed
            fireKey('keydown', 'e');
            expect(input.isJustPressed('e')).toBe(false);
        });

        it('triggers again after key is released and re-pressed', () => {
            fireKey('keydown', 'e');
            input.isJustPressed('e'); // consume
            fireKey('keyup', 'e');
            fireKey('keydown', 'e');
            expect(input.isJustPressed('e')).toBe(true);
        });

        it('normalizes key to lowercase', () => {
            fireKey('keydown', 'E');
            expect(input.isJustPressed('E')).toBe(true);
        });
    });

    // ── clearJustPressed ────────────────────────────────────────────
    describe('clearJustPressed', () => {
        it('clears all pending justPressed flags', () => {
            fireKey('keydown', 'e');
            fireKey('keydown', '1');
            input.clearJustPressed();
            expect(input.isJustPressed('e')).toBe(false);
            expect(input.isJustPressed('1')).toBe(false);
        });
    });

    // ── getMovementVector ───────────────────────────────────────────
    describe('getMovementVector', () => {
        it('returns zero vector when no keys pressed', () => {
            const { dx, dy } = input.getMovementVector();
            expect(dx).toBe(0);
            expect(dy).toBe(0);
        });

        it('returns up vector for W key', () => {
            fireKey('keydown', 'w');
            const { dx, dy } = input.getMovementVector();
            expect(dx).toBe(0);
            expect(dy).toBe(-1);
        });

        it('returns down vector for S key', () => {
            fireKey('keydown', 's');
            const { dx, dy } = input.getMovementVector();
            expect(dx).toBe(0);
            expect(dy).toBe(1);
        });

        it('returns left vector for A key', () => {
            fireKey('keydown', 'a');
            const { dx, dy } = input.getMovementVector();
            expect(dx).toBe(-1);
            expect(dy).toBe(0);
        });

        it('returns right vector for D key', () => {
            fireKey('keydown', 'd');
            const { dx, dy } = input.getMovementVector();
            expect(dx).toBe(1);
            expect(dy).toBe(0);
        });

        it('supports ArrowUp key', () => {
            fireKey('keydown', 'ArrowUp');
            const { dy } = input.getMovementVector();
            expect(dy).toBe(-1);
        });

        it('supports ArrowDown key', () => {
            fireKey('keydown', 'ArrowDown');
            const { dy } = input.getMovementVector();
            expect(dy).toBe(1);
        });

        it('supports ArrowLeft key', () => {
            fireKey('keydown', 'ArrowLeft');
            const { dx } = input.getMovementVector();
            expect(dx).toBe(-1);
        });

        it('supports ArrowRight key', () => {
            fireKey('keydown', 'ArrowRight');
            const { dx } = input.getMovementVector();
            expect(dx).toBe(1);
        });

        it('normalizes diagonal movement to unit length', () => {
            fireKey('keydown', 'w');
            fireKey('keydown', 'd');
            const { dx, dy } = input.getMovementVector();
            const length = Math.sqrt(dx * dx + dy * dy);
            expect(length).toBeCloseTo(1, 5);
        });

        it('diagonal up-right has correct components', () => {
            fireKey('keydown', 'w');
            fireKey('keydown', 'd');
            const { dx, dy } = input.getMovementVector();
            expect(dx).toBeGreaterThan(0);
            expect(dy).toBeLessThan(0);
            expect(dx).toBeCloseTo(1 / Math.SQRT2, 5);
            expect(dy).toBeCloseTo(-1 / Math.SQRT2, 5);
        });

        it('opposite keys cancel out', () => {
            fireKey('keydown', 'w');
            fireKey('keydown', 's');
            const { dy } = input.getMovementVector();
            expect(dy).toBe(0);
        });
    });

    // ── isSprinting ─────────────────────────────────────────────────
    describe('isSprinting', () => {
        it('returns false when shift not pressed', () => {
            expect(input.isSprinting()).toBeFalsy();
        });

        it('returns true when Shift key is pressed', () => {
            fireKey('keydown', 'Shift', { code: 'ShiftLeft' });
            expect(input.isSprinting()).toBe(true);
        });

        it('returns false after Shift is released', () => {
            fireKey('keydown', 'Shift', { code: 'ShiftLeft' });
            fireKey('keyup', 'Shift', { code: 'ShiftLeft' });
            expect(input.isSprinting()).toBe(false);
        });

        it('recognizes ShiftRight as sprint', () => {
            fireKey('keydown', 'Shift', { code: 'ShiftRight' });
            expect(input.isSprinting()).toBe(true);
        });
    });

    // ── isInteractPressed ───────────────────────────────────────────
    describe('isInteractPressed', () => {
        it('returns true when E is just pressed', () => {
            fireKey('keydown', 'e');
            expect(input.isInteractPressed()).toBe(true);
        });

        it('returns false on second call (one-shot)', () => {
            fireKey('keydown', 'e');
            input.isInteractPressed(); // consume
            expect(input.isInteractPressed()).toBe(false);
        });
    });

    // ── getSpellPressed ─────────────────────────────────────────────
    describe('getSpellPressed', () => {
        it('returns null when no spell key pressed', () => {
            expect(input.getSpellPressed()).toBeNull();
        });

        it('returns 1 when "1" key is pressed', () => {
            fireKey('keydown', '1');
            expect(input.getSpellPressed()).toBe(1);
        });

        it('returns 2 when "2" key is pressed', () => {
            fireKey('keydown', '2');
            expect(input.getSpellPressed()).toBe(2);
        });

        it('returns 3 when "3" key is pressed', () => {
            fireKey('keydown', '3');
            expect(input.getSpellPressed()).toBe(3);
        });

        it('consumes the justPressed flag (one-shot)', () => {
            fireKey('keydown', '1');
            input.getSpellPressed(); // consume
            expect(input.getSpellPressed()).toBeNull();
        });

        it('returns lowest number when multiple spell keys pressed', () => {
            fireKey('keydown', '2');
            fireKey('keydown', '3');
            // getSpellPressed checks 1 first, then 2, then 3
            expect(input.getSpellPressed()).toBe(2);
        });
    });
});
