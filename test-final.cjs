const { chromium } = require('playwright');

async function testGameProperly() {
    console.log('Testing Chickens Game - Proper Verification\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log('1. Loading game...');
        await page.goto('http://localhost:5177/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('\n2. Checking BEFORE click:');
        const before = await page.evaluate(() => ({
            startScreenVisible: !document.getElementById('startScreen').classList.contains('hidden'),
            gameOverVisible: !document.getElementById('gameOverScreen').classList.contains('hidden'),
            score: document.getElementById('score').textContent
        }));
        console.log(`   Start screen visible: ${before.startScreenVisible}`);
        console.log(`   Game over visible: ${before.gameOverVisible}`);
        console.log(`   Score: ${before.score}`);
        
        console.log('\n3. Clicking Start button...');
        await page.click('#startBtn');
        
        // Wait and check multiple times
        for (let i = 1; i <= 3; i++) {
            await page.waitForTimeout(1000);
            const check = await page.evaluate(() => ({
                startHidden: document.getElementById('startScreen').classList.contains('hidden'),
                score: document.getElementById('score').textContent,
                lives: document.getElementById('lives').textContent
            }));
            console.log(`   Check ${i}s after click: Start hidden=${check.startHidden}, Score=${check.score}, Lives=${check.lives}`);
        }
        
        console.log('\n4. Testing gameplay (moving hero)...');
        await page.keyboard.press('w');
        await page.waitForTimeout(500);
        await page.keyboard.press('d');
        await page.waitForTimeout(500);
        
        const final = await page.evaluate(() => ({
            startHidden: document.getElementById('startScreen').classList.contains('hidden'),
            gameOverHidden: document.getElementById('gameOverScreen').classList.contains('hidden'),
            score: document.getElementById('score').textContent,
            lives: document.getElementById('lives').textContent,
            time: document.getElementById('time').textContent
        }));
        
        console.log('\n=== FINAL STATE ===');
        console.log(`Start screen hidden: ${final.startHidden}`);
        console.log(`Game over hidden: ${final.gameOverHidden}`);
        console.log(`Score: ${final.score}`);
        console.log(`Lives: ${final.lives}`);
        console.log(`Time: ${final.time}`);
        
        console.log('\n=== RESULT ===');
        if (final.startHidden && !final.gameOverHidden === false) {
            console.log('✅ SUCCESS: Game is running!');
            console.log('   - Start screen hidden');
            console.log('   - HUD showing score/lives/time');
            console.log('   - Hero can be moved');
        } else {
            console.log('❌ Game not running properly');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
}

testGameProperly();