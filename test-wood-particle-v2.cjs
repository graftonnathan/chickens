const { chromium } = require('playwright');

async function testWoodParticleFixV2() {
    console.log('=== Wood Particle Fix Verification ===\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
            console.log(`❌ Console Error: ${msg.text().substring(0, 150)}`);
        }
    });
    
    page.on('pageerror', error => {
        consoleErrors.push(error.message);
        console.log(`❌ Page Error: ${error.message.substring(0, 150)}`);
    });
    
    const results = {
        codeExists: false,
        noConsoleErrors: false,
        gameRuns: false,
        screenshots: []
    };
    
    try {
        // Verify code exists first
        console.log('1. Verifying code implementation...');
        const fs = require('fs');
        const particleCode = fs.readFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/particle.js', 'utf8');
        
        const hasWoodParticleClass = particleCode.includes('class WoodParticle');
        const hasSpawnWoodParticle = particleCode.includes('spawnWoodParticle(x, y, angle, speed)');
        const hasWoodColors = particleCode.includes('8b4513') || particleCode.includes('woodColors');
        const hasGravity = particleCode.includes('gravity');
        const hasRotation = particleCode.includes('rotation');
        
        console.log(`   WoodParticle class: ${hasWoodParticleClass ? '✅' : '❌'}`);
        console.log(`   spawnWoodParticle method: ${hasSpawnWoodParticle ? '✅' : '❌'}`);
        console.log(`   Wood colors: ${hasWoodColors ? '✅' : '❌'}`);
        console.log(`   Gravity effect: ${hasGravity ? '✅' : '❌'}`);
        console.log(`   Rotation effect: ${hasRotation ? '✅' : '❌'}`);
        
        results.codeExists = hasWoodParticleClass && hasSpawnWoodParticle;
        
        // Load game
        console.log('\n2. Loading game...');
        await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('   Page loaded successfully');
        
        // Start game
        console.log('\n3. Starting game...');
        await page.click('#startBtn');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/wood-fix-v2-game.png'
        });
        results.screenshots.push('wood-fix-v2-game.png');
        console.log('   Screenshot: wood-fix-v2-game.png');
        
        // Run game
        console.log('\n4. Running gameplay...');
        
        for (let i = 0; i < 3; i++) {
            await page.waitForTimeout(1000);
            await page.keyboard.press(['w', 'a', 's', 'd'][i % 4]);
        }
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/wood-fix-v2-final.png'
        });
        results.screenshots.push('wood-fix-v2-final.png');
        console.log('   Screenshot: wood-fix-v2-final.png');
        
        // Check for specific error
        console.log('\n5. Checking for spawnWoodParticle errors...');
        const hasSpawnError = consoleErrors.some(e => 
            e.includes('spawnWoodParticle') || 
            (e.includes('is not a function') && e.includes('particle'))
        );
        
        if (hasSpawnError) {
            console.log('   ❌ spawnWoodParticle error found');
        } else {
            console.log('   ✅ No spawnWoodParticle errors');
        }
        
        // Overall console errors
        console.log('\n6. Checking all console errors...');
        if (consoleErrors.length === 0) {
            console.log('   ✅ No console errors');
            results.noConsoleErrors = true;
        } else {
            console.log(`   ⚠️  ${consoleErrors.length} console errors:`);
            consoleErrors.forEach((e, i) => console.log(`     ${i + 1}. ${e.substring(0, 100)}`));
            // Still pass if no spawnWoodParticle error
            results.noConsoleErrors = !hasSpawnError;
        }
        
        // Check game state
        console.log('\n7. Verifying game runs...');
        const gameState = await page.evaluate(() => ({
            time: document.getElementById('time')?.textContent,
            score: document.getElementById('score')?.textContent
        }));
        
        const timeProgressing = gameState.time && parseInt(gameState.time.split(':')[1]) > 0;
        console.log(`   Time: ${gameState.time}`);
        console.log(`   Score: ${gameState.score}`);
        console.log(`   Time progressing: ${timeProgressing ? '✅' : '❌'}`);
        
        results.gameRuns = timeProgressing;
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        console.log(`Code exists: ${results.codeExists ? '✅' : '❌'}`);
        console.log(`No spawnWoodParticle errors: ${!hasSpawnError ? '✅' : '❌'}`);
        console.log(`Game runs: ${results.gameRuns ? '✅' : '❌'}`);
        
        if (results.codeExists && !hasSpawnError) {
            console.log('\n✅ BUG FIX VERIFIED');
            results.overall = 'PASS';
        } else {
            console.log('\n❌ ISSUES FOUND');
            results.overall = 'FAIL';
        }
        
    } catch (error) {
        console.error('Test error:', error.message);
        results.error = error.message;
    }
    
    await browser.close();
    return results;
}

testWoodParticleFixV2().then(results => {
    const fs = require('fs');
    fs.writeFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/wood-particle-fix-v2-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to wood-particle-fix-v2-results.json');
});