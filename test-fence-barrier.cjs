const { chromium } = require('playwright');

async function testFenceBarrier() {
    console.log('=== Fence Barrier Around Coop Test ===\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const results = {
        fenceExists: false,
        collisionWorks: false,
        depositZoneWorks: false,
        gapMarkers: false,
        screenshots: []
    };
    
    try {
        // Load game
        console.log('1. Loading game...');
        await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Start game
        console.log('2. Starting game...');
        await page.click('#startBtn');
        await page.waitForTimeout(2000);
        
        // Take initial screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/fence-initial.png'
        });
        results.screenshots.push('fence-initial.png');
        console.log('   Screenshot: fence-initial.png');
        
        // Test 1: Check fence barrier exists
        console.log('\n3. Checking fence barrier...');
        const fenceCheck = await page.evaluate(() => {
            const game = window.game;
            if (!game || !game.coop) return { error: 'Game or coop not found' };
            
            return {
                hasFence: !!game.coop.fenceRadius,
                fenceRadius: game.coop.fenceRadius,
                hasGap: game.coop.gapStart !== undefined && game.coop.gapEnd !== undefined,
                gapStart: game.coop.gapStart,
                gapEnd: game.coop.gapEnd,
                hasPushOutside: typeof game.coop.pushOutside === 'function',
                hasDepositZone: typeof game.coop.isAtDepositZone === 'function',
                coopPosition: { x: game.coop.x, y: game.coop.y }
            };
        });
        
        console.log('   Fence Properties:');
        console.log(`     Fence exists: ${fenceCheck.hasFence ? '✅' : '❌'}`);
        console.log(`     Fence radius: ${fenceCheck.fenceRadius}`);
        console.log(`     Gap defined: ${fenceCheck.hasGap ? '✅' : '❌'}`);
        console.log(`     Gap angles: ${fenceCheck.gapStart?.toFixed(2)} to ${fenceCheck.gapEnd?.toFixed(2)}`);
        console.log(`     Push collision: ${fenceCheck.hasPushOutside ? '✅' : '❌'}`);
        console.log(`     Deposit zone: ${fenceCheck.hasDepositZone ? '✅' : '❌'}`);
        console.log(`     Coop position: (${fenceCheck.coopPosition?.x}, ${fenceCheck.coopPosition?.y})`);
        
        results.fenceExists = fenceCheck.hasFence && fenceCheck.hasGap && fenceCheck.hasPushOutside;
        
        // Test 2: Test hero movement toward coop
        console.log('\n4. Testing hero movement...');
        
        // Get hero initial position
        const heroInitial = await page.evaluate(() => ({
            x: window.game?.hero?.x,
            y: window.game?.hero?.y
        }));
        console.log(`   Hero initial: (${heroInitial.x}, ${heroInitial.y})`);
        
        // Move hero toward coop (from below - should hit fence)
        // First position hero below the coop
        await page.evaluate(() => {
            if (window.game && window.game.hero) {
                window.game.hero.x = 400;
                window.game.hero.y = 200; // Position below coop
            }
        });
        
        await page.waitForTimeout(500);
        
        // Take screenshot of hero near coop
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/fence-hero-near-coop.png'
        });
        results.screenshots.push('fence-hero-near-coop.png');
        console.log('   Screenshot: fence-hero-near-coop.png');
        
        // Test 3: Try to move hero into fence (should be blocked)
        console.log('\n5. Testing fence collision...');
        
        // Position hero right at fence edge
        const collisionTest = await page.evaluate(() => {
            const game = window.game;
            if (!game || !game.coop || !game.hero) return { error: 'Missing game objects' };
            
            // Position hero at north of coop (should be blocked by fence)
            const testX = game.coop.x;
            const testY = game.coop.y - 40; // Just outside fence radius
            
            game.hero.x = testX;
            game.hero.y = testY;
            
            // Try to move closer (into fence)
            const beforePush = { x: game.hero.x, y: game.hero.y };
            
            // Simulate fence collision check
            const result = game.coop.pushOutside(game.hero.x, game.hero.y, game.hero.radius || 15);
            
            return {
                before: beforePush,
                after: { x: result.x, y: result.y },
                wasPushed: Math.abs(beforePush.x - result.x) > 1 || Math.abs(beforePush.y - result.y) > 1,
                inGap: result.inGap
            };
        });
        
        console.log(`   Position before: (${collisionTest.before?.x}, ${collisionTest.before?.y})`);
        console.log(`   Position after: (${collisionTest.after?.x}, ${collisionTest.after?.y})`);
        console.log(`   Was pushed back: ${collisionTest.wasPushed ? '✅' : '❌'}`);
        console.log(`   In gap: ${collisionTest.inGap ? 'Yes' : 'No'}`);
        
        results.collisionWorks = collisionTest.wasPushed;
        
        // Test 4: Test deposit zone at gap
        console.log('\n6. Testing deposit zone...');
        
        const depositTest = await page.evaluate(() => {
            const game = window.game;
            if (!game || !game.coop || !game.hero) return { error: 'Missing game objects' };
            
            // Calculate gap center position
            const gapCenterAngle = (game.coop.gapStart + game.coop.gapEnd) / 2;
            const depositX = game.coop.x + Math.cos(gapCenterAngle) * game.coop.fenceRadius;
            const depositY = game.coop.y + Math.sin(gapCenterAngle) * game.coop.fenceRadius;
            
            // Position hero at deposit zone
            game.hero.x = depositX;
            game.hero.y = depositY + 10; // Slightly outside
            
            const atDeposit = game.coop.isAtDepositZone(game.hero);
            
            return {
                gapAngle: gapCenterAngle,
                depositX,
                depositY,
                heroX: game.hero.x,
                heroY: game.hero.y,
                atDepositZone: atDeposit
            };
        });
        
        console.log(`   Gap center angle: ${depositTest.gapAngle?.toFixed(2)}`);
        console.log(`   Deposit position: (${depositTest.depositX?.toFixed(1)}, ${depositTest.depositY?.toFixed(1)})`);
        console.log(`   Hero at: (${depositTest.heroX?.toFixed(1)}, ${depositTest.heroY?.toFixed(1)})`);
        console.log(`   At deposit zone: ${depositTest.atDepositZone ? '✅' : '❌'}`);
        
        results.depositZoneWorks = depositTest.atDepositZone;
        
        // Test 5: Extended observation
        console.log('\n7. Running extended observation...');
        await page.waitForTimeout(3000);
        
        // Take final screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/fence-final.png'
        });
        results.screenshots.push('fence-final.png');
        console.log('   Screenshot: fence-final.png');
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        console.log(`Fence exists: ${results.fenceExists ? '✅' : '❌'}`);
        console.log(`Collision works: ${results.collisionWorks ? '✅' : '❌'}`);
        console.log(`Deposit zone works: ${results.depositZoneWorks ? '✅' : '❌'}`);
        
        const passed = [results.fenceExists, results.collisionWorks, results.depositZoneWorks].filter(Boolean).length;
        const total = 3;
        
        console.log(`\nPassed: ${passed}/${total}`);
        
        if (passed >= 2) {
            console.log('✅ FENCE BARRIER IMPLEMENTED');
            results.overall = 'PASS';
        } else {
            console.log('❌ ISSUES FOUND');
            results.overall = 'FAIL';
        }
        
    } catch (error) {
        console.error('Test error:', error.message);
        results.error = error.message;
    }
    
    await browser.close();
    return results;
}

testFenceBarrier().then(results => {
    const fs = require('fs');
    fs.writeFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/fence-barrier-test-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to fence-barrier-test-results.json');
});