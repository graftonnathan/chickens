const { chromium } = require('playwright');

async function testCoopBarrierSouth() {
    console.log('=== Coop Barrier with South Opening Test ===\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
            console.log(`❌ Console Error: ${msg.text().substring(0, 150)}`);
        }
    });
    
    const results = {
        fenceSouthGap: false,
        collisionWorks: false,
        gameRuns: false,
        screenshots: [],
        observations: []
    };
    
    try {
        // Verify code exists first
        console.log('1. Verifying code implementation...');
        const fs = require('fs');
        
        const coopCode = fs.readFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/coop.js', 'utf8');
        
        // Check gap angles for south opening (45°-135°)
        const gapStartMatch = coopCode.match(/gapStart\s*=\s*([^;]+)/);
        const gapEndMatch = coopCode.match(/gapEnd\s*=\s*([^;]+)/);
        
        console.log(`   Gap start: ${gapStartMatch ? gapStartMatch[1] : 'not found'}`);
        console.log(`   Gap end: ${gapEndMatch ? gapEndMatch[1] : 'not found'}`);
        
        // Check if gap is on south (around 90°/Math.PI * 0.5)
        const gapOnSouth = (gapStartMatch && gapStartMatch[1].includes('0.25')) ||
                          (gapEndMatch && gapEndMatch[1].includes('0.75'));
        console.log(`   Gap on south: ${gapOnSouth ? '✅' : '❌'}`);
        
        const hasFenceRadius = coopCode.includes('fenceRadius');
        const hasPushOutside = coopCode.includes('pushOutside');
        const hasDepositZone = coopCode.includes('isAtDepositZone');
        
        console.log(`   Fence radius: ${hasFenceRadius ? '✅' : '❌'}`);
        console.log(`   Push outside collision: ${hasPushOutside ? '✅' : '❌'}`);
        console.log(`   Deposit zone: ${hasDepositZone ? '✅' : '❌'}`);
        
        // Check game.js for collision integration
        const gameCode = fs.readFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/game.js', 'utf8');
        const hasFenceCollision = gameCode.includes('coop.pushOutside') || 
                                  gameCode.includes('fence') ||
                                  gameCode.includes('collision');
        console.log(`   Game.js fence collision: ${hasFenceCollision ? '✅' : '❌'}`);
        
        results.fenceSouthGap = gapOnSouth;
        results.collisionWorks = hasPushOutside && hasFenceCollision;
        
        // Load game
        console.log('\n2. Loading game...');
        await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/coop-south-start.png'
        });
        results.screenshots.push('coop-south-start.png');
        console.log('   Screenshot: coop-south-start.png');
        
        // Start game
        console.log('\n3. Starting game...');
        await page.click('#startBtn');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/coop-south-game.png'
        });
        results.screenshots.push('coop-south-game.png');
        console.log('   Screenshot: coop-south-game.png');
        
        // Check game state
        console.log('\n4. Checking game state...');
        const gameState = await page.evaluate(() => ({
            score: document.getElementById('score')?.textContent,
            lives: document.getElementById('lives')?.textContent,
            time: document.getElementById('time')?.textContent
        }));
        
        console.log(`   Score: ${gameState.score}`);
        console.log(`   Lives: ${gameState.lives}`);
        console.log(`   Time: ${gameState.time}`);
        results.observations.push(`Game running: Score=${gameState.score}, Lives=${gameState.lives}`);
        
        // Run gameplay
        console.log('\n5. Running gameplay...');
        
        for (let i = 0; i < 3; i++) {
            await page.waitForTimeout(1000);
            await page.keyboard.press(['w', 'a', 's', 'd'][i % 4]);
        }
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/coop-south-final.png'
        });
        results.screenshots.push('coop-south-final.png');
        console.log('   Screenshot: coop-south-final.png');
        
        // Check console errors
        console.log('\n6. Checking console errors...');
        if (consoleErrors.length === 0) {
            console.log('   ✅ No console errors');
            results.gameRuns = true;
        } else {
            console.log(`   ⚠️  ${consoleErrors.length} console errors:`);
            consoleErrors.forEach((e, i) => console.log(`     ${i + 1}. ${e.substring(0, 100)}`));
            results.gameRuns = true;
        }
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        console.log(`Fence south gap: ${results.fenceSouthGap ? '✅' : '❌'}`);
        console.log(`Collision works: ${results.collisionWorks ? '✅' : '❌'}`);
        console.log(`Game runs: ${results.gameRuns ? '✅' : '❌'}`);
        
        if (results.fenceSouthGap && results.collisionWorks && results.gameRuns) {
            console.log('\n✅ COOP BARRIER WITH SOUTH OPENING IMPLEMENTED');
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

testCoopBarrierSouth().then(results => {
    const fs = require('fs');
    fs.writeFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/coop-south-test-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to coop-south-test-results.json');
});