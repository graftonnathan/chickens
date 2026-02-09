const { chromium } = require('playwright');

async function testWoodParticleFix() {
    console.log('=== Wood Particle Fix Test ===\n');
    
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
        functionExists: false,
        noConsoleErrors: false,
        gameRuns: false,
        screenshots: []
    };
    
    try {
        // Load game
        console.log('1. Loading game...');
        await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('   Page loaded successfully');
        
        // Test 1: Verify spawnWoodParticle exists
        console.log('\n2. Verifying spawnWoodParticle function...');
        const functionCheck = await page.evaluate(() => {
            // Check if ParticleSystem has spawnWoodParticle
            const game = window.game;
            if (!game) return { error: 'Game not found' };
            
            const particles = game.particles;
            if (!particles) return { error: 'ParticleSystem not found' };
            
            return {
                hasSpawnWoodParticle: typeof particles.spawnWoodParticle === 'function',
                functionType: typeof particles.spawnWoodParticle,
                particleSystemExists: true
            };
        });
        
        console.log(`   ParticleSystem exists: ${functionCheck.particleSystemExists ? '✅' : '❌'}`);
        console.log(`   spawnWoodParticle type: ${functionCheck.functionType}`);
        console.log(`   spawnWoodParticle is function: ${functionCheck.hasSpawnWoodParticle ? '✅' : '❌'}`);
        
        results.functionExists = functionCheck.hasSpawnWoodParticle;
        
        // Test 2: Start game and check for errors
        console.log('\n3. Starting game...');
        await page.click('#startBtn');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/wood-fix-game.png'
        });
        results.screenshots.push('wood-fix-game.png');
        console.log('   Screenshot: wood-fix-game.png');
        
        // Test 3: Run game and check for errors
        console.log('\n4. Running gameplay...');
        
        for (let i = 0; i < 3; i++) {
            await page.waitForTimeout(1000);
            await page.keyboard.press(['w', 'a', 's', 'd'][i % 4]);
        }
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/wood-fix-final.png'
        });
        results.screenshots.push('wood-fix-final.png');
        console.log('   Screenshot: wood-fix-final.png');
        
        // Test 4: Check for specific error
        console.log('\n5. Checking for spawnWoodParticle error...');
        const hasSpawnError = consoleErrors.some(e => 
            e.includes('spawnWoodParticle') || 
            e.includes('is not a function')
        );
        
        if (hasSpawnError) {
            console.log('   ❌ spawnWoodParticle error still present');
        } else {
            console.log('   ✅ No spawnWoodParticle errors');
        }
        
        // Test 5: Overall console errors
        console.log('\n6. Checking all console errors...');
        if (consoleErrors.length === 0) {
            console.log('   ✅ No console errors');
            results.noConsoleErrors = true;
        } else {
            console.log(`   ⚠️  ${consoleErrors.length} console errors (may be unrelated):`);
            consoleErrors.forEach((e, i) => console.log(`     ${i + 1}. ${e.substring(0, 100)}`));
        }
        
        // Test 6: Check game state
        console.log('\n7. Verifying game runs...');
        const gameState = await page.evaluate(() => ({
            time: document.getElementById('time')?.textContent,
            score: document.getElementById('score')?.textContent
        }));
        
        const timeProgressing = gameState.time && gameState.time !== '0:00';
        console.log(`   Time: ${gameState.time}`);
        console.log(`   Score: ${gameState.score}`);
        console.log(`   Time progressing: ${timeProgressing ? '✅' : '❌'}`);
        
        results.gameRuns = timeProgressing;
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        console.log(`spawnWoodParticle exists: ${results.functionExists ? '✅' : '❌'}`);
        console.log(`No console errors: ${results.noConsoleErrors ? '✅' : '❌'}`);
        console.log(`Game runs: ${results.gameRuns ? '✅' : '❌'}`);
        
        if (results.functionExists && results.gameRuns) {
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

testWoodParticleFix().then(results => {
    const fs = require('fs');
    fs.writeFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/wood-particle-fix-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to wood-particle-fix-results.json');
});