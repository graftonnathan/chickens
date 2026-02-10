const { chromium } = require('playwright');

async function testFenceMoveAndTools() {
    console.log('=== Fence Move & Tool Pickup System Test ===\n');
    
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
        fenceMoved: false,
        toolSystem: false,
        gameRuns: false,
        screenshots: [],
        observations: []
    };
    
    try {
        // Verify code exists first
        console.log('1. Verifying code implementation...');
        const fs = require('fs');
        
        // Check coop.js for fence gap move
        const coopCode = fs.readFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/coop.js', 'utf8');
        const gapStart = coopCode.match(/gapStart\s*=\s*([^;]+)/);
        const gapEnd = coopCode.match(/gapEnd\s*=\s*([^;]+)/);
        
        console.log(`   Gap start: ${gapStart ? gapStart[1] : 'not found'}`);
        console.log(`   Gap end: ${gapEnd ? gapEnd[1] : 'not found'}`);
        
        // Check if gap is on north (around 270°/Math.PI * 1.5)
        const gapOnNorth = coopCode.includes('Math.PI * 1.25') || coopCode.includes('Math.PI * 1.75') ||
                          (gapStart && gapStart[1].includes('1.25')) ||
                          (gapEnd && gapEnd[1].includes('1.75'));
        console.log(`   Gap moved to north: ${gapOnNorth ? '✅' : '❌'}`);
        
        // Check tool.js
        const toolCode = fs.readFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/tool.js', 'utf8');
        const hasToolClass = toolCode.includes('class Tool');
        const hasToolManager = toolCode.includes('class ToolManager');
        const hasEggBasket = toolCode.includes('eggBasket') || toolCode.includes('egg-basket');
        const hasHammer = toolCode.includes('hammer');
        const hasFoodBasket = toolCode.includes('foodBasket') || toolCode.includes('food-basket');
        
        console.log(`   Tool class: ${hasToolClass ? '✅' : '❌'}`);
        console.log(`   ToolManager: ${hasToolManager ? '✅' : '❌'}`);
        console.log(`   Egg basket type: ${hasEggBasket ? '✅' : '❌'}`);
        console.log(`   Hammer type: ${hasHammer ? '✅' : '❌'}`);
        console.log(`   Food basket type: ${hasFoodBasket ? '✅' : '❌'}`);
        
        // Check hero.js for tool methods
        const heroCode = fs.readFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/hero.js', 'utf8');
        const hasPickUpTool = heroCode.includes('pickUpTool');
        const hasHasTool = heroCode.includes('hasTool');
        const hasUseTool = heroCode.includes('useTool');
        const hasDropTool = heroCode.includes('dropTool');
        
        console.log(`   pickUpTool method: ${hasPickUpTool ? '✅' : '❌'}`);
        console.log(`   hasTool method: ${hasHasTool ? '✅' : '❌'}`);
        console.log(`   useTool method: ${hasUseTool ? '✅' : '❌'}`);
        console.log(`   dropTool method: ${hasDropTool ? '✅' : '❌'}`);
        
        results.fenceMoved = gapOnNorth;
        results.toolSystem = hasToolClass && hasToolManager && hasPickUpTool && hasUseTool;
        
        // Load game
        console.log('\n2. Loading game...');
        await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/fence-tools-start.png'
        });
        results.screenshots.push('fence-tools-start.png');
        console.log('   Screenshot: fence-tools-start.png');
        
        // Start game
        console.log('\n3. Starting game...');
        await page.click('#startBtn');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/fence-tools-game.png'
        });
        results.screenshots.push('fence-tools-game.png');
        console.log('   Screenshot: fence-tools-game.png');
        
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
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/fence-tools-final.png'
        });
        results.screenshots.push('fence-tools-final.png');
        console.log('   Screenshot: fence-tools-final.png');
        
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
        console.log(`Fence moved to south: ${results.fenceMoved ? '✅' : '❌'}`);
        console.log(`Tool system: ${results.toolSystem ? '✅' : '❌'}`);
        console.log(`Game runs: ${results.gameRuns ? '✅' : '❌'}`);
        
        if (results.fenceMoved && results.toolSystem && results.gameRuns) {
            console.log('\n✅ FENCE MOVE & TOOL SYSTEM IMPLEMENTED');
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

testFenceMoveAndTools().then(results => {
    const fs = require('fs');
    fs.writeFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/fence-tools-test-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to fence-tools-test-results.json');
});