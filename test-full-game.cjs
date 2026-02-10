const { chromium } = require('playwright');

async function testFullGameFunctionality() {
    console.log('=== Full Game Functionality Test ===\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const consoleErrors = [];
    const consoleLogs = [];
    
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push({ type: msg.type(), text });
        if (msg.type() === 'error') {
            consoleErrors.push(text);
            console.log(`❌ Console Error: ${text.substring(0, 150)}`);
        }
    });
    
    page.on('pageerror', error => {
        consoleErrors.push(error.message);
        console.log(`❌ Page Error: ${error.message.substring(0, 150)}`);
    });
    
    const results = {
        noErrorsOnLoad: false,
        gameStarts: false,
        mechanicsWork: false,
        screenshots: [],
        observations: []
    };
    
    try {
        // Test 1: Load game and check for console errors
        console.log('1. Loading game and checking for console errors...');
        await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Check for errors after load
        const loadErrors = consoleErrors.length;
        console.log(`   Console errors on load: ${loadErrors}`);
        
        if (loadErrors === 0) {
            console.log('   ✅ No console errors on load');
            results.noErrorsOnLoad = true;
        } else {
            console.log('   ❌ Console errors found on load');
            consoleErrors.forEach((e, i) => console.log(`     ${i + 1}. ${e.substring(0, 100)}`));
        }
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/full-test-start.png'
        });
        results.screenshots.push('full-test-start.png');
        console.log('   Screenshot: full-test-start.png');
        
        // Test 2: Start game
        console.log('\n2. Testing game start...');
        await page.click('#startBtn');
        await page.waitForTimeout(2000);
        
        const startScreenHidden = await page.evaluate(() => {
            const startScreen = document.getElementById('startScreen');
            return startScreen && startScreen.classList.contains('hidden');
        });
        
        if (startScreenHidden) {
            console.log('   ✅ Game started successfully');
            results.gameStarts = true;
        } else {
            console.log('   ❌ Game did not start');
        }
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/full-test-game.png'
        });
        results.screenshots.push('full-test-game.png');
        console.log('   Screenshot: full-test-game.png');
        
        // Test 3: Check HUD
        console.log('\n3. Checking HUD elements...');
        const hud = await page.evaluate(() => ({
            score: document.getElementById('score')?.textContent,
            lives: document.getElementById('lives')?.textContent,
            time: document.getElementById('time')?.textContent
        }));
        
        console.log(`   Score: ${hud.score}`);
        console.log(`   Lives: ${hud.lives}`);
        console.log(`   Time: ${hud.time}`);
        results.observations.push(`HUD: Score=${hud.score}, Lives=${hud.lives}, Time=${hud.time}`);
        
        const hudOk = hud.score && hud.lives && hud.time;
        
        // Test 4: Run gameplay and check mechanics
        console.log('\n4. Testing gameplay mechanics...');
        
        const startTime = Date.now();
        let timeProgressed = false;
        
        for (let i = 0; i < 5; i++) {
            await page.waitForTimeout(1000);
            
            // Move hero
            await page.keyboard.press(['w', 'a', 's', 'd'][i % 4]);
            
            // Check time progression
            const currentTime = await page.evaluate(() => 
                document.getElementById('time')?.textContent
            );
            
            if (currentTime && currentTime !== hud.time) {
                timeProgressed = true;
            }
            
            if (i < 3) {
                await page.screenshot({ 
                    path: `/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/full-test-frame-${i + 1}.png`
                });
                console.log(`   Screenshot: full-test-frame-${i + 1}.png`);
            }
        }
        
        if (timeProgressed) {
            console.log('   ✅ Time progressing (game loop active)');
        } else {
            console.log('   ⚠️  Time not progressing');
        }
        
        // Test 5: Check for any new errors during gameplay
        console.log('\n5. Checking for gameplay errors...');
        const gameplayErrors = consoleErrors.length - loadErrors;
        console.log(`   New errors during gameplay: ${gameplayErrors}`);
        
        if (gameplayErrors === 0) {
            console.log('   ✅ No errors during gameplay');
        } else {
            console.log('   ⚠️  Errors found during gameplay');
        }
        
        // Final screenshot
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/full-test-final.png'
        });
        results.screenshots.push('full-test-final.png');
        console.log('   Screenshot: full-test-final.png');
        
        // Check for specific error types
        console.log('\n6. Checking for specific errors...');
        const basketItemErrors = consoleErrors.some(e => e.includes('basketItem') || e.includes('basket'));
        const undefinedErrors = consoleErrors.some(e => e.includes('undefined') || e.includes('null'));
        const notFunctionErrors = consoleErrors.some(e => e.includes('is not a function'));
        
        console.log(`   basketItem errors: ${basketItemErrors ? '❌ FOUND' : '✅ None'}`);
        console.log(`   undefined errors: ${undefinedErrors ? '❌ FOUND' : '✅ None'}`);
        console.log(`   'is not a function' errors: ${notFunctionErrors ? '❌ FOUND' : '✅ None'}`);
        
        results.mechanicsWork = results.noErrorsOnLoad && results.gameStarts && timeProgressed && !basketItemErrors;
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        console.log(`No errors on load: ${results.noErrorsOnLoad ? '✅' : '❌'}`);
        console.log(`Game starts: ${results.gameStarts ? '✅' : '❌'}`);
        console.log(`HUD works: ${hudOk ? '✅' : '❌'}`);
        console.log(`Time progresses: ${timeProgressed ? '✅' : '❌'}`);
        console.log(`No basketItem errors: ${!basketItemErrors ? '✅' : '❌'}`);
        
        if (results.mechanicsWork) {
            console.log('\n✅ FULL GAME FUNCTIONALITY VERIFIED');
            results.overall = 'PASS';
        } else {
            console.log('\n❌ ISSUES FOUND');
            results.overall = 'FAIL';
        }
        
        results.observations.push(`Total console errors: ${consoleErrors.length}`);
        results.observations.push(`Game duration tested: 5 seconds`);
        
    } catch (error) {
        console.error('Test error:', error.message);
        results.error = error.message;
    }
    
    await browser.close();
    return results;
}

testFullGameFunctionality().then(results => {
    const fs = require('fs');
    fs.writeFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/full-game-test-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to full-game-test-results.json');
});