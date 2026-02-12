// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Chickens: Wizard's Backyard
 *
 * These tests run against the real game served via `npx serve .`
 * and verify high-level UI/canvas behaviour in a real Chromium browser.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the game and wait for the page to be ready. */
async function loadGame(page) {
    await page.goto('/');
    // Wait for the canvas element to be present in the DOM
    await page.waitForSelector('#gameCanvas', { state: 'attached' });
}

/** Click the "Start Game" button and wait for the overlay to disappear. */
async function startGame(page) {
    await page.click('#startBtn');
    // The start screen should become hidden after clicking
    await page.waitForSelector('#startScreen.hidden', { state: 'attached' });
}

// ---------------------------------------------------------------------------
// 1. Game loads correctly
// ---------------------------------------------------------------------------

test.describe('Game Loading', () => {
    test('page title is correct', async ({ page }) => {
        await loadGame(page);
        await expect(page).toHaveTitle(/Chickens/);
    });

    test('canvas element exists with expected dimensions', async ({ page }) => {
        await loadGame(page);
        const canvas = page.locator('#gameCanvas');
        await expect(canvas).toBeAttached();
        await expect(canvas).toHaveAttribute('width', '800');
        await expect(canvas).toHaveAttribute('height', '600');
    });

    test('start screen is visible on load', async ({ page }) => {
        await loadGame(page);
        const startScreen = page.locator('#startScreen');
        await expect(startScreen).toBeVisible();
        // The overlay should NOT have the "hidden" class initially
        await expect(startScreen).not.toHaveClass(/hidden/);
    });

    test('start button is visible and clickable', async ({ page }) => {
        await loadGame(page);
        const startBtn = page.locator('#startBtn');
        await expect(startBtn).toBeVisible();
        await expect(startBtn).toHaveText('Start Game');
    });
});

// ---------------------------------------------------------------------------
// 2. Start button works
// ---------------------------------------------------------------------------

test.describe('Start Button', () => {
    test('clicking Start Game hides the start screen', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const startScreen = page.locator('#startScreen');
        await expect(startScreen).toHaveClass(/hidden/);
        await expect(startScreen).not.toBeVisible();
    });

    test('game over screen stays hidden after start', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const gameOverScreen = page.locator('#gameOverScreen');
        await expect(gameOverScreen).toHaveClass(/hidden/);
        await expect(gameOverScreen).not.toBeVisible();
    });

    test('pressing Space also starts the game', async ({ page }) => {
        await loadGame(page);
        await page.keyboard.press('Space');
        await page.waitForSelector('#startScreen.hidden', { state: 'attached' });

        const startScreen = page.locator('#startScreen');
        await expect(startScreen).not.toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// 3. Canvas renders
// ---------------------------------------------------------------------------

test.describe('Canvas Rendering', () => {
    test('canvas has non-empty pixel data after starting', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        // Give the game loop a couple of frames to render
        await page.waitForTimeout(500);

        // Check that the canvas has been drawn to (not all zeros)
        const hasContent = await page.evaluate(() => {
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            // Check if any pixel has non-zero data
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
                    return true;
                }
            }
            return false;
        });

        expect(hasContent).toBe(true);
    });

    test('canvas screenshot is not blank', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        // Wait for rendering
        await page.waitForTimeout(500);

        const canvas = page.locator('#gameCanvas');
        const screenshot = await canvas.screenshot();

        // A blank (empty) canvas would be very small or all one color
        // A rendered game will have a larger screenshot buffer
        expect(screenshot.byteLength).toBeGreaterThan(1000);
    });
});

// ---------------------------------------------------------------------------
// 4. HUD elements display
// ---------------------------------------------------------------------------

test.describe('HUD Elements', () => {
    test('score display shows initial value', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const score = page.locator('#score');
        await expect(score).toBeVisible();
        // Initial score should contain "0"
        await expect(score).toContainText('0');
    });

    test('lives display shows initial value', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const lives = page.locator('#lives');
        await expect(lives).toBeVisible();
    });

    test('bag display is visible', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const bag = page.locator('#bagDisplay');
        await expect(bag).toBeVisible();
    });

    test('time display shows initial value', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const time = page.locator('#time');
        await expect(time).toBeVisible();
        await expect(time).toContainText('0:0');
    });

    test('HUD labels are present', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const labels = page.locator('.hud-label');
        await expect(labels).toHaveCount(4);

        const texts = await labels.allTextContents();
        expect(texts).toContain('DEPOSITED');
        expect(texts).toContain('BAG');
        expect(texts).toContain('LIVES');
        expect(texts).toContain('TIME');
    });
});

// ---------------------------------------------------------------------------
// 5. Keyboard input works
// ---------------------------------------------------------------------------

test.describe('Keyboard Input', () => {
    test('WASD keys do not cause errors', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        // Collect any console errors
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));

        // Press movement keys
        await page.keyboard.press('KeyW');
        await page.waitForTimeout(100);
        await page.keyboard.press('KeyA');
        await page.waitForTimeout(100);
        await page.keyboard.press('KeyS');
        await page.waitForTimeout(100);
        await page.keyboard.press('KeyD');
        await page.waitForTimeout(100);

        // No errors should have been thrown
        expect(errors).toHaveLength(0);
    });

    test('arrow keys do not cause errors', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(100);

        expect(errors).toHaveLength(0);
    });

    test('spell keys (1, 2, 3) do not cause errors', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.keyboard.press('Digit1');
        await page.waitForTimeout(100);
        await page.keyboard.press('Digit2');
        await page.waitForTimeout(100);
        await page.keyboard.press('Digit3');
        await page.waitForTimeout(100);

        expect(errors).toHaveLength(0);
    });

    test('interact key (E) does not cause errors', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.keyboard.press('KeyE');
        await page.waitForTimeout(100);

        expect(errors).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// 6. Spell bar visible
// ---------------------------------------------------------------------------

test.describe('Spell Bar', () => {
    test('spell bar is visible', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const spellBar = page.locator('#spellBar');
        await expect(spellBar).toBeVisible();
    });

    test('spell bar has 3 spell slots', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const spellSlots = page.locator('.spell-slot');
        await expect(spellSlots).toHaveCount(3);
    });

    test('spell slots show correct hotkeys', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const hotkeys = page.locator('.spell-hotkey');
        const texts = await hotkeys.allTextContents();
        expect(texts).toEqual(['1', '2', '3']);
    });

    test('spell slots show spell names', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const names = page.locator('.spell-name');
        const texts = await names.allTextContents();
        expect(texts).toEqual(['Freeze', 'Attract', 'Speed']);
    });

    test('spell slots show icons', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const icons = page.locator('.spell-icon');
        const texts = await icons.allTextContents();
        expect(texts).toEqual(['❄️', '🧲', '⚡']);
    });
});

// ---------------------------------------------------------------------------
// 7. Game over screen (TODO — hard to trigger quickly in E2E)
// ---------------------------------------------------------------------------

test.describe('Game Over Screen', () => {
    test('game over screen is hidden during gameplay', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        const gameOverScreen = page.locator('#gameOverScreen');
        await expect(gameOverScreen).not.toBeVisible();
    });

    test('game over screen has restart button', async ({ page }) => {
        await loadGame(page);

        // Verify the restart button exists in the DOM (even if hidden)
        const restartBtn = page.locator('#restartBtn');
        await expect(restartBtn).toBeAttached();
        await expect(restartBtn).toHaveText('Play Again');
    });

    test('game over screen has score elements', async ({ page }) => {
        await loadGame(page);

        // Verify score elements exist in the DOM
        await expect(page.locator('#finalScore')).toBeAttached();
        await expect(page.locator('#highScore')).toBeAttached();
        await expect(page.locator('#finalTime')).toBeAttached();
    });

    // TODO: Triggering an actual game over state requires either:
    //   - Waiting for all 12 chickens to escape (too slow for E2E)
    //   - Injecting game state via page.evaluate() (fragile)
    // For now we verify the DOM structure exists and is ready.
    test.skip('shows game over screen when all chickens escape', async ({ page }) => {
        await loadGame(page);
        await startGame(page);

        // Would need to trigger game.lose() or wait for natural game over
        // This is intentionally skipped — see TODO above
    });
});

// ---------------------------------------------------------------------------
// 8. Controls hint
// ---------------------------------------------------------------------------

test.describe('Controls Hint', () => {
    test('controls hint is visible', async ({ page }) => {
        await loadGame(page);

        const hint = page.locator('.controls-hint');
        await expect(hint).toBeVisible();
        await expect(hint).toContainText('WASD');
    });
});

// ---------------------------------------------------------------------------
// 9. No console errors on load
// ---------------------------------------------------------------------------

test.describe('Error-Free Loading', () => {
    test('no JavaScript errors on page load', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await loadGame(page);
        await page.waitForTimeout(1000);

        expect(errors).toHaveLength(0);
    });

    test('no JavaScript errors after starting game', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await loadGame(page);
        await startGame(page);
        await page.waitForTimeout(2000);

        expect(errors).toHaveLength(0);
    });
});
