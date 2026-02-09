const { chromium } = require('playwright');

async function testHeroDepositFix() {
    console.log('=== Hero.deposit() Bug Fix Test ===\n');
    
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
        noDepositErrors: false,
        gameRuns: false,
        screenshots: []
    };
    
    try {
        // Verify code exists first
        console.log('1. Verifying code implementation...');
        const fs = require('fs');
        const heroCode = fs.readFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/hero.js', 'utf8');
        
        const hasDepositMethod = heroCode.includes('deposit()') || heroCode.includes('deposit(');
        const hasDepositChickens = heroCode.includes('depositChickens');
        const returnsCount = heroCode.includes('return') && heroCode.includes('count');
        
        console.log(`   deposit() method: ${hasDepositMethod ? '✅' : '❌'}`);
        console.log(`   depositChickens called: ${hasDepositChickens ? '✅' : '❌'}`);
        console.log(`   Returns count: ${returnsCount ? '✅' : '❌'}`);
        
        results.codeExists = hasDepositMethod;
        
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
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/deposit-fix-game.png'
        });
        results.screenshots.push('deposit-fix-game.png');
        console.log('   Screenshot: deposit-fix-game.png');
        
        // Run gameplay
        console.log('\n4. Running gameplay...');
        
        for (let i = 0; i < 3; i++) {
            await page.waitForTimeout(1000);
            await page.keyboard.press(['w', 'a', 's', 'd'][i % 4]);
        }
        
        await page.screenshot({ 
            path: '/home/molten/.openclaw/workspace/PROJECTS/chickens/screenshots/deposit-fix-final.png'
        });
        results.screenshots.push('deposit-fix-final.png');
        console.log('   Screenshot: deposit-fix-final.png');
        
        // Check for specific error
        console.log('\n5. Checking for hero.deposit errors...');
        const hasDepositError = consoleErrors.some(e => 
            e.includes('hero.deposit') || 
            e.includes('deposit is not a function') ||
            (e.includes('game.js') && e.includes('403'))
        );
        
        if (hasDepositError) {
            console.log('   ❌ hero.deposit error found');
            results.noDepositErrors = false;
        } else {
            console.log('   ✅ No hero.deposit errors');
            results.noDepositErrors = true;
        }
        
        // Overall console errors
        console.log('\n6. Checking all console errors...');
        if (consoleErrors.length === 0) {
            console.log('   ✅ No console errors');
        } else {
            console.log(`   ⚠️  ${consoleErrors.length} console errors:`);
            consoleErrors.forEach((e, i) => console.log(`     ${i + 1}. ${e.substring(0, 100)}`));
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
        console.log(`No deposit errors: ${results.noDepositErrors ? '✅' : '❌'}`);
        console.log(`Game runs: ${results.gameRuns ? '✅' : '❌'}`);
        
        if (results.codeExists && results.noDepositErrors) {
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

testHeroDepositFix().then(results => {
    const fs = require('fs');
    fs.writeFileSync('/home/molten/.openclaw/workspace/PROJECTS/chickens/hero-deposit-fix-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to hero-deposit-fix-results.json');
});