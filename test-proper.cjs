const { chromium } = require('playwright');

async function testGame() {
    console.log('Testing Chickens Game on proper server...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
            console.log(`❌ ${msg.text().substring(0, 150)}`);
        }
    });
    
    try {
        console.log('1. Loading game...');
        await page.goto('http://localhost:5177/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('\n2. Checking initial state...');
        const initial = await page.evaluate(() => ({
            startScreenVisible: !document.getElementById('startScreen').classList.contains('hidden'),
            startBtnVisible: !!document.getElementById('startBtn'),
            gameExists: !!window.game
        }));
        console.log(`   Start screen visible: ${initial.startScreenVisible}`);
        console.log(`   Start button visible: ${initial.startBtnVisible}`);
        console.log(`   Game object exists: ${initial.gameExists}`);
        
        if (errors.length > 0) {
            console.log(`\n   ⚠️  ${errors.length} console errors during load`);
        }
        
        console.log('\n3. Clicking Start button...');
        await page.click('#startBtn');
        await page.waitForTimeout(2000);
        
        const after = await page.evaluate(() => ({
            startScreenHidden: document.getElementById('startScreen').classList.contains('hidden'),
            gameState: window.game ? window.game.state : 'no game'
        }));
        console.log(`   Start screen hidden: ${after.startScreenHidden}`);
        console.log(`   Game state: ${after.gameState}`);
        
        console.log('\n=== FINAL RESULT ===');
        if (errors.length === 0) {
            console.log('✅ No JavaScript errors');
        } else {
            console.log(`❌ ${errors.length} JavaScript errors`);
        }
        
        if (after.startScreenHidden && after.gameState === 'playing') {
            console.log('✅ Game started successfully!');
        } else {
            console.log('❌ Game did NOT start');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

testGame();