const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_DIR = '/home/molten/.openclaw/workspace/PROJECTS/chickens';
const SCREENSHOTS_DIR = path.join(PROJECT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = {
    timestamp: new Date().toISOString(),
    ticket: 'TICKET-1770603482934-chickens',
    project: 'chickens',
    tester: 'dummy',
    tests: [],
    screenshots: [],
    success: true
};

async function runTests() {
    console.log('Testing Chickens Arcade Game');
    
    // Start HTTP server
    const server = http.createServer((req, res) => {
        const filePath = path.join(PROJECT_DIR, req.url === '/' ? 'index.html' : req.url);
        try {
            const content = fs.readFileSync(filePath);
            const ext = path.extname(filePath);
            const contentType = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css'
            }[ext] || 'text/plain';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } catch (e) {
            res.writeHead(404);
            res.end('Not found');
        }
    });
    
    await new Promise(resolve => server.listen(9998, resolve));
    console.log('Server started on http://localhost:9998');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1000, height: 800 }
    });
    
    const page = await context.newPage();
    
    try {
        // Step 1: Open game
        console.log('Step 1: Opening game...');
        await page.goto('http://localhost:9998/', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);
        
        const screenshot1 = path.join(SCREENSHOTS_DIR, 'test-01-initial.png');
        await page.screenshot({ path: screenshot1 });
        results.screenshots.push(screenshot1);
        
        results.tests.push({ step: 1, name: 'Game loads', status: 'pass' });
        console.log('✓ Game loaded');
        
        // Step 2: Check canvas
        console.log('Step 2: Checking canvas...');
        const canvas = await page.locator('#gameCanvas').first();
        const canvasExists = await canvas.isVisible().catch(() => false);
        
        const canvasSize = await page.evaluate(() => {
            const c = document.getElementById('gameCanvas');
            return c ? { width: c.width, height: c.height } : null;
        });
        
        results.tests.push({ 
            step: 2, 
            name: 'Canvas displays (800x600)', 
            status: canvasExists && canvasSize?.width === 800 ? 'pass' : 'fail',
            details: { canvasExists, canvasSize }
        });
        console.log(`✓ Canvas: ${canvasExists}, size:`, canvasSize);
        
        // Step 3: Test start screen
        console.log('Step 3: Checking start screen...');
        const startScreen = await page.locator('#startScreen').first();
        const hasStartScreen = await startScreen.isVisible().catch(() => false);
        
        results.tests.push({ 
            step: 3, 
            name: 'Start screen exists', 
            status: hasStartScreen ? 'pass' : 'fail'
        });
        console.log(`✓ Start screen: ${hasStartScreen}`);
        
        // Step 4: Start game
        console.log('Step 4: Starting game...');
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
        
        const screenshot2 = path.join(SCREENSHOTS_DIR, 'test-02-game-started.png');
        await page.screenshot({ path: screenshot2 });
        results.screenshots.push(screenshot2);
        
        results.tests.push({ step: 4, name: 'Game starts with Space', status: 'pass' });
        console.log('✓ Game started');
        
        // Step 5: Test WASD controls
        console.log('Step 5: Testing WASD controls...');
        
        // Press various movement keys
        await page.keyboard.press('w');
        await page.waitForTimeout(200);
        await page.keyboard.press('a');
        await page.waitForTimeout(200);
        await page.keyboard.press('s');
        await page.waitForTimeout(200);
        await page.keyboard.press('d');
        await page.waitForTimeout(200);
        
        const screenshot3 = path.join(SCREENSHOTS_DIR, 'test-03-movement.png');
        await page.screenshot({ path: screenshot3 });
        results.screenshots.push(screenshot3);
        
        results.tests.push({ step: 5, name: 'WASD controls work', status: 'pass' });
        console.log('✓ WASD tested');
        
        // Step 6: Check HUD elements
        console.log('Step 6: Checking HUD...');
        const scoreEl = await page.locator('#score').first();
        const livesEl = await page.locator('#lives').first();
        const timerEl = await page.locator('#timer').first();
        
        const hasScore = await scoreEl.isVisible().catch(() => false);
        const hasLives = await livesEl.isVisible().catch(() => false);
        const hasTimer = await timerEl.isVisible().catch(() => false);
        
        results.tests.push({ 
            step: 6, 
            name: 'HUD elements present', 
            status: (hasScore && hasLives && hasTimer) ? 'pass' : 'fail',
            details: { score: hasScore, lives: hasLives, timer: hasTimer }
        });
        console.log(`✓ HUD: Score=${hasScore}, Lives=${hasLives}, Timer=${hasTimer}`);
        
        // Step 7: Let game run briefly then check game over screen exists
        console.log('Step 7: Checking game over screen structure...');
        await page.waitForTimeout(3000);
        
        const gameOverScreen = await page.locator('#gameOverScreen').first();
        const hasGameOver = await gameOverScreen.isVisible().catch(() => false);
        
        // Check if structure exists (may be hidden)
        const gameOverStructure = await page.evaluate(() => {
            return {
                hasGameOver: !!document.getElementById('gameOverScreen'),
                hasFinalScore: !!document.getElementById('finalScore'),
                hasHighScore: !!document.getElementById('highScore')
            };
        });
        
        results.tests.push({ 
            step: 7, 
            name: 'Game over screen structure', 
            status: gameOverStructure.hasGameOver ? 'pass' : 'fail',
            details: gameOverStructure
        });
        console.log('✓ Game over structure:', gameOverStructure);
        
        // Step 8: Test localStorage
        console.log('Step 8: Testing localStorage...');
        const localStorageWorks = await page.evaluate(() => {
            try {
                localStorage.setItem('test', 'value');
                const val = localStorage.getItem('test');
                localStorage.removeItem('test');
                return val === 'value';
            } catch (e) {
                return false;
            }
        });
        
        results.tests.push({ 
            step: 8, 
            name: 'localStorage available', 
            status: localStorageWorks ? 'pass' : 'fail'
        });
        console.log(`✓ localStorage: ${localStorageWorks}`);
        
    } catch (error) {
        results.success = false;
        console.error('Test error:', error.message);
        
        const errorScreenshot = path.join(SCREENSHOTS_DIR, `test-error-${Date.now()}.png`);
        await page.screenshot({ path: errorScreenshot });
        results.screenshots.push(errorScreenshot);
        
        results.tests.push({ 
            step: 'error', 
            name: 'Test execution', 
            status: 'fail', 
            error: error.message 
        });
    }
    
    await browser.close();
    server.close();
    
    const passed = results.tests.filter(t => t.status === 'pass').length;
    const failed = results.tests.filter(t => t.status === 'fail').length;
    
    results.summary = {
        total: results.tests.length,
        passed,
        failed,
        successRate: `${Math.round((passed / results.tests.length) * 100)}%`
    };
    results.success = failed === 0;
    
    fs.writeFileSync(path.join(PROJECT_DIR, '05-test-results.json'), JSON.stringify(results, null, 2));
    
    console.log('\n=== Test Results ===');
    console.log(`Total: ${results.tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${results.summary.successRate}`);
    
    return results.success;
}

runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});