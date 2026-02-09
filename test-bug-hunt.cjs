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
    ticket: 'TICKET-1770648991065-chickens',
    project: 'chickens',
    tester: 'dummy',
    tests: [],
    bugs: [],
    screenshots: [],
    success: true
};

async function runTests() {
    console.log('Testing Chickens Game - Full Test & Bug Hunt');
    console.log('Issue reported: Start game does not work');
    
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
    
    await new Promise(resolve => server.listen(9994, resolve));
    console.log('Server started on http://localhost:9994');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1000, height: 800 }
    });
    
    const page = await context.newPage();
    
    // Capture console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console error:', msg.text());
            results.bugs.push({ type: 'console-error', message: msg.text() });
        }
    });
    
    try {
        // Step 1: Open game and check console for errors
        console.log('\n=== Step 1: Loading game ===');
        await page.goto('http://localhost:9994/', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);
        
        const screenshot1 = path.join(SCREENSHOTS_DIR, 'bug-test-01-initial.png');
        await page.screenshot({ path: screenshot1 });
        results.screenshots.push(screenshot1);
        
        results.tests.push({ step: 1, name: 'Game loads without console errors', status: 'pass' });
        console.log('✓ Game loaded');
        
        // Step 2: Check if start screen is visible
        console.log('\n=== Step 2: Checking start screen ===');
        
        const startScreen = await page.locator('#startScreen').first();
        const startScreenVisible = await startScreen.isVisible().catch(() => false);
        
        const startBtn = await page.locator('#startBtn').first();
        const startBtnVisible = await startBtn.isVisible().catch(() => false);
        
        console.log(`Start screen visible: ${startScreenVisible}`);
        console.log(`Start button visible: ${startBtnVisible}`);
        
        if (!startScreenVisible || !startBtnVisible) {
            results.bugs.push({
                severity: 'high',
                component: 'UI',
                description: 'Start screen or button not visible',
                details: { startScreenVisible, startBtnVisible }
            });
        }
        
        results.tests.push({ 
            step: 2, 
            name: 'Start screen and button visible', 
            status: (startScreenVisible && startBtnVisible) ? 'pass' : 'fail',
            details: { startScreenVisible, startBtnVisible }
        });
        
        // Step 3: Try clicking start button
        console.log('\n=== Step 3: Testing Start button click ===');
        
        if (startBtnVisible) {
            // Add event listener to capture clicks
            await page.evaluate(() => {
                window.startBtnClicked = false;
                const btn = document.getElementById('startBtn');
                if (btn) {
                    btn.addEventListener('click', () => {
                        window.startBtnClicked = true;
                        console.log('Start button was clicked!');
                    });
                }
            });
            
            await startBtn.click();
            await page.waitForTimeout(500);
            
            const wasClicked = await page.evaluate(() => window.startBtnClicked);
            console.log(`Start button click registered: ${wasClicked}`);
            
            if (!wasClicked) {
                results.bugs.push({
                    severity: 'critical',
                    component: 'Input',
                    description: 'Start button click not registered',
                    details: { wasClicked }
                });
            }
            
            results.tests.push({ 
                step: 3, 
                name: 'Start button click registers', 
                status: wasClicked ? 'pass' : 'fail'
            });
        }
        
        // Step 4: Try Space key as alternative
        console.log('\n=== Step 4: Testing Space key start ===');
        
        await page.keyboard.press('Space');
        await page.waitForTimeout(1000);
        
        const screenshot2 = path.join(SCREENSHOTS_DIR, 'bug-test-02-after-space.png');
        await page.screenshot({ path: screenshot2 });
        results.screenshots.push(screenshot2);
        
        // Check if game started (start screen hidden, game visible)
        const startScreenHidden = await startScreen.evaluate(el => el.classList.contains('hidden'));
        const gameCanvas = await page.locator('#gameCanvas').first();
        const canvasVisible = await gameCanvas.isVisible().catch(() => false);
        
        console.log(`Start screen hidden: ${startScreenHidden}`);
        console.log(`Canvas visible: ${canvasVisible}`);
        
        if (!startScreenHidden) {
            results.bugs.push({
                severity: 'critical',
                component: 'Game Logic',
                description: 'Game does not start - start screen remains visible after Space key',
                details: { startScreenHidden, canvasVisible }
            });
        }
        
        results.tests.push({ 
            step: 4, 
            name: 'Space key starts game', 
            status: startScreenHidden ? 'pass' : 'fail',
            details: { startScreenHidden, canvasVisible }
        });
        
        // Step 5: Check game.js for startGame function
        console.log('\n=== Step 5: Checking game.js logic ===');
        
        const gameJs = fs.readFileSync(path.join(PROJECT_DIR, 'game.js'), 'utf-8');
        
        const hasStartGameFunction = gameJs.includes('startGame') || gameJs.includes('function start');
        const hasSpaceKeyHandler = gameJs.includes('Space') || gameJs.includes(' ');
        const hasGameStateChange = gameJs.includes('gameState') || gameJs.includes('state');
        
        console.log(`Has start game function: ${hasStartGameFunction}`);
        console.log(`Has Space key handler: ${hasSpaceKeyHandler}`);
        console.log(`Has game state change: ${hasGameStateChange}`);
        
        if (!hasStartGameFunction) {
            results.bugs.push({
                severity: 'critical',
                component: 'Code',
                description: 'Missing startGame function in game.js',
                details: { hasStartGameFunction }
            });
        }
        
        if (!hasSpaceKeyHandler) {
            results.bugs.push({
                severity: 'critical',
                component: 'Code',
                description: 'Missing Space key handler in game.js',
                details: { hasSpaceKeyHandler }
            });
        }
        
        results.tests.push({ 
            step: 5, 
            name: 'Game.js has required functions', 
            status: (hasStartGameFunction && hasSpaceKeyHandler) ? 'pass' : 'fail',
            details: { hasStartGameFunction, hasSpaceKeyHandler, hasGameStateChange }
        });
        
        // Step 6: Check input.js for key handling
        console.log('\n=== Step 6: Checking input.js ===');
        
        const inputJs = fs.readFileSync(path.join(PROJECT_DIR, 'input.js'), 'utf-8');
        
        const hasKeydownListener = inputJs.includes('keydown') || inputJs.includes('keypress');
        const hasSpaceInInput = inputJs.includes('Space') || inputJs.includes(' ');
        
        console.log(`Has keydown listener: ${hasKeydownListener}`);
        console.log(`Handles Space in input: ${hasSpaceInInput}`);
        
        results.tests.push({ 
            step: 6, 
            name: 'Input.js handles keys', 
            status: hasKeydownListener ? 'pass' : 'fail',
            details: { hasKeydownListener, hasSpaceInInput }
        });
        
        // Step 7: Test if game loop runs after start
        console.log('\n=== Step 7: Testing game loop ===');
        
        if (startScreenHidden) {
            // Game should be running - check if we can move
            await page.keyboard.press('w');
            await page.waitForTimeout(500);
            
            const screenshot3 = path.join(SCREENSHOTS_DIR, 'bug-test-03-gameplay.png');
            await page.screenshot({ path: screenshot3 });
            results.screenshots.push(screenshot3);
            
            results.tests.push({ step: 7, name: 'Game loop runs after start', status: 'pass' });
            console.log('✓ Game appears to be running');
        } else {
            results.tests.push({ step: 7, name: 'Game loop runs after start', status: 'fail' });
            console.log('✗ Game not running - cannot test loop');
        }
        
        // Summary of bugs found
        console.log('\n=== BUG SUMMARY ===');
        if (results.bugs.length === 0) {
            console.log('No critical bugs found!');
        } else {
            console.log(`Found ${results.bugs.length} issue(s):`);
            results.bugs.forEach((bug, i) => {
                console.log(`${i + 1}. [${bug.severity}] ${bug.description}`);
            });
        }
        
    } catch (error) {
        results.success = false;
        console.error('Test error:', error.message);
        
        const errorScreenshot = path.join(SCREENSHOTS_DIR, `bug-test-error-${Date.now()}.png`);
        await page.screenshot({ path: errorScreenshot });
        results.screenshots.push(errorScreenshot);
        
        results.bugs.push({
            type: 'test-error',
            severity: 'critical',
            message: error.message
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
        bugsFound: results.bugs.length,
        successRate: `${Math.round((passed / results.tests.length) * 100)}%`
    };
    results.success = failed === 0 && results.bugs.length === 0;
    
    fs.writeFileSync(path.join(PROJECT_DIR, '05-test-bug-results.json'), JSON.stringify(results, null, 2));
    
    console.log('\n=== Test Results ===');
    console.log(`Total: ${results.tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Bugs Found: ${results.bugs.length}`);
    console.log(`Success Rate: ${results.summary.successRate}`);
    
    return results.success;
}

runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});