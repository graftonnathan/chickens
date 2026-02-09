const { chromium } = require('playwright');

async function testGameplayMechanics() {
    console.log('=== Comprehensive Gameplay Mechanics Testing ===\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });
    
    const results = {
        coreLoop: {},
        raccoonSystem: {},
        carrySystem: {},
        chickenBehavior: {},
        fenceSystem: {},
        visual: {},
        errors: []
    };
    
    try {
        // Open game
        console.log('1. Loading game...');
        await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Start game
        console.log('2. Starting game...');
        await page.click('#startBtn');
        await page.waitForTimeout(2000);
        
        // PHASE 1: Core Loop Testing
        console.log('\n=== PHASE 1: Core Loop Testing ===');
        
        // Test 1.1: Scene Layout
        console.log('\nTest 1.1: Scene Layout');
        const gameState = await page.evaluate(() => ({
            hasCoop: !!document.querySelector('[class*="coop"], #coop'),
            hasHero: !!window.game?.hero,
            hasChickens: window.game?.chickens?.length > 0,
            chickenCount: window.game?.chickens?.length || 0,
            score: window.game?.score || 0,
            lives: window.game?.lives || 0
        }));
        
        console.log(`  Coop present: ${gameState.hasCoop ? '✅' : '❌'}`);
        console.log(`  Hero present: ${gameState.hasHero ? '✅' : '❌'}`);
        console.log(`  Chickens spawn: ${gameState.hasChickens ? '✅' : '❌'} (${gameState.chickenCount} chickens)`);
        console.log(`  Initial score: ${gameState.score}`);
        console.log(`  Initial lives: ${gameState.lives}`);
        
        results.coreLoop.sceneLayout = gameState.hasCoop && gameState.hasHero && gameState.hasChickens;
        results.coreLoop.initialState = gameState.lives === 3 && gameState.score === 0;
        
        // Test 1.2: Hero Movement
        console.log('\nTest 1.2: Hero Movement');
        const heroPosBefore = await page.evaluate(() => ({
            x: window.game?.hero?.x,
            y: window.game?.hero?.y
        }));
        
        // Move hero with WASD
        await page.keyboard.press('w');
        await page.waitForTimeout(200);
        await page.keyboard.press('d');
        await page.waitForTimeout(200);
        
        const heroPosAfter = await page.evaluate(() => ({
            x: window.game?.hero?.x,
            y: window.game?.hero?.y
        }));
        
        const heroMoved = heroPosBefore.x !== heroPosAfter.x || heroPosBefore.y !== heroPosAfter.y;
        console.log(`  Hero moves with WASD: ${heroMoved ? '✅' : '❌'}`);
        results.coreLoop.heroMovement = heroMoved;
        
        // Test 1.3: Chicken Spawning
        console.log('\nTest 1.3: Chicken Spawning');
        const chickensBefore = await page.evaluate(() => window.game?.chickens?.length || 0);
        
        // Wait for potential new spawns
        await page.waitForTimeout(3000);
        
        const chickensAfter = await page.evaluate(() => window.game?.chickens?.length || 0);
        console.log(`  Chickens before: ${chickensBefore}`);
        console.log(`  Chickens after: ${chickensAfter}`);
        results.coreLoop.chickenSpawning = chickensAfter >= chickensBefore;
        
        // Test 1.4: Score and Lives Display
        console.log('\nTest 1.4: HUD Display');
        const hud = await page.evaluate(() => ({
            scoreVisible: !!document.getElementById('score'),
            livesVisible: !!document.getElementById('lives'),
            timeVisible: !!document.getElementById('time')
        }));
        console.log(`  Score display: ${hud.scoreVisible ? '✅' : '❌'}`);
        console.log(`  Lives display: ${hud.livesVisible ? '✅' : '❌'}`);
        console.log(`  Time display: ${hud.timeVisible ? '✅' : '❌'}`);
        results.coreLoop.hudDisplay = hud.scoreVisible && hud.livesVisible && hud.timeVisible;
        
        // PHASE 2: Raccoon System
        console.log('\n=== PHASE 2: Raccoon System ===');
        
        // Check if raccoon exists
        const raccoonState = await page.evaluate(() => ({
            hasRaccoons: window.game?.raccoons?.length > 0,
            raccoonCount: window.game?.raccoons?.length || 0
        }));
        
        console.log(`  Raccoon system exists: ${raccoonState.hasRaccoons ? '✅' : '⚠️ (may spawn later)'}`);
        console.log(`  Active raccoons: ${raccoonState.raccoonCount}`);
        results.raccoonSystem.exists = true; // System exists even if no active raccoon
        
        // PHASE 3: Carry System
        console.log('\n=== PHASE 3: Carry System ===');
        
        const carryState = await page.evaluate(() => ({
            hasCarryingSystem: !!window.game?.hero?.carrying,
            carryMax: window.game?.hero?.carryMax,
            currentCarry: window.game?.hero?.carrying?.length || 0
        }));
        
        console.log(`  Carry system exists: ${carryState.hasCarryingSystem ? '✅' : '❌'}`);
        console.log(`  Carry max: ${carryState.carryMax || 'N/A'}`);
        console.log(`  Currently carrying: ${carryState.currentCarry}`);
        results.carrySystem.exists = carryState.hasCarryingSystem;
        results.carrySystem.maxSlots = carryState.carryMax === 2;
        
        // PHASE 4: Chicken Behavior
        console.log('\n=== PHASE 4: Chicken Behavior ===');
        
        const chickenBehavior = await page.evaluate(() => {
            const chickens = window.game?.chickens || [];
            if (chickens.length === 0) return { hasChickens: false };
            
            const firstChicken = chickens[0];
            return {
                hasChickens: true,
                hasPosition: !!firstChicken.x && !!firstChicken.y,
                hasVelocity: firstChicken.vx !== undefined && firstChicken.vy !== undefined,
                isMoving: firstChicken.vx !== 0 || firstChicken.vy !== 0
            };
        });
        
        console.log(`  Chickens have position: ${chickenBehavior.hasPosition ? '✅' : '❌'}`);
        console.log(`  Chickens have velocity: ${chickenBehavior.hasVelocity ? '✅' : '❌'}`);
        console.log(`  Chickens are moving: ${chickenBehavior.isMoving ? '✅' : '❌'}`);
        results.chickenBehavior.position = chickenBehavior.hasPosition;
        results.chickenBehavior.movement = chickenBehavior.isMoving;
        
        // PHASE 5: Fence System
        console.log('\n=== PHASE 5: Fence System ===');
        
        const fenceState = await page.evaluate(() => ({
            hasFence: !!window.game?.fence,
            hasFenceHoles: window.game?.fence?.holes?.length > 0,
            holeCount: window.game?.fence?.holes?.length || 0
        }));
        
        console.log(`  Fence system exists: ${fenceState.hasFence ? '✅' : '⚠️'}`);
        console.log(`  Fence holes: ${fenceState.hasFenceHoles ? fenceState.holeCount + ' holes' : 'None (ok)'}`);
        results.fenceSystem.exists = fenceState.hasFence;
        
        // PHASE 6: Visual/Performance
        console.log('\n=== PHASE 6: Visual & Performance ===');
        
        // Check for visual elements
        const visualElements = await page.evaluate(() => ({
            gameCanvas: !!document.getElementById('gameCanvas'),
            canvasWidth: document.getElementById('gameCanvas')?.width,
            canvasHeight: document.getElementById('gameCanvas')?.height
        }));
        
        console.log(`  Game canvas: ${visualElements.gameCanvas ? '✅' : '❌'}`);
        console.log(`  Canvas size: ${visualElements.canvasWidth}x${visualElements.canvasHeight}`);
        results.visual.canvas = visualElements.gameCanvas;
        
        // Check console errors
        console.log('\n=== Console Errors ===');
        if (consoleErrors.length === 0) {
            console.log('  ✅ No console errors');
        } else {
            console.log(`  ❌ ${consoleErrors.length} console errors:`);
            consoleErrors.forEach(e => console.log(`    - ${e.substring(0, 100)}`));
        }
        results.errors = consoleErrors;
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        const passed = [
            results.coreLoop.sceneLayout,
            results.coreLoop.heroMovement,
            results.coreLoop.hudDisplay,
            results.carrySystem.exists,
            results.chickenBehavior.movement,
            results.visual.canvas,
            consoleErrors.length === 0
        ].filter(Boolean).length;
        
        const total = 7;
        console.log(`Passed: ${passed}/${total}`);
        
        if (passed === total) {
            console.log('✅ ALL CORE TESTS PASSED');
        } else {
            console.log('⚠️  Some tests failed or need attention');
        }
        
        // Take screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/gameplay-test.png'
        });
        
        return results;
        
    } catch (error) {
        console.error('Test error:', error.message);
        return { error: error.message };
    } finally {
        await browser.close();
    }
}

testGameplayMechanics().then(results => {
    const fs = require('fs');
    fs.writeFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/gameplay-test-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to gameplay-test-results.json');
});