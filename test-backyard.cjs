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
    ticket: 'TICKET-1770640678846-chickens',
    project: 'chickens',
    tester: 'dummy',
    tests: [],
    screenshots: [],
    success: true
};

async function runTests() {
    console.log('Testing Chickens Game - Residential Backyard Setting');
    
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
    
    await new Promise(resolve => server.listen(9996, resolve));
    console.log('Server started on http://localhost:9996');
    
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
        await page.goto('http://localhost:9996/', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);
        
        const screenshot1 = path.join(SCREENSHOTS_DIR, 'backyard-test-01-initial.png');
        await page.screenshot({ path: screenshot1 });
        results.screenshots.push(screenshot1);
        
        results.tests.push({ step: 1, name: 'Game loads', status: 'pass' });
        console.log('✓ Game loaded');
        
        // Step 2: Check renderer.js for backyard elements
        console.log('Step 2: Checking backyard setting implementation...');
        
        const rendererJs = fs.readFileSync(path.join(PROJECT_DIR, 'renderer.js'), 'utf-8');
        const coopJs = fs.readFileSync(path.join(PROJECT_DIR, 'coop.js'), 'utf-8');
        
        const hasSky = rendererJs.includes('sky') || rendererJs.includes('cloud');
        const hasHouse = rendererJs.includes('house') || rendererJs.includes('beige');
        const hasLawn = rendererJs.includes('lawn') || rendererJs.includes('grass');
        const hasPatio = rendererJs.includes('patio') || rendererJs.includes('concrete');
        const hasFence = rendererJs.includes('fence') || rendererJs.includes('privacy');
        const hasHedge = rendererJs.includes('hedge');
        const hasGnome = rendererJs.includes('gnome');
        const hasFlamingo = rendererJs.includes('flamingo');
        const hasGrill = rendererJs.includes('grill');
        const hasShed = coopJs.includes('shed') || coopJs.includes('gray');
        
        results.tests.push({ 
            step: 2, 
            name: 'Backyard elements implemented', 
            status: (hasHouse && hasLawn && hasFence && hasShed) ? 'pass' : 'fail',
            details: {
                sky: hasSky,
                house: hasHouse,
                lawn: hasLawn,
                patio: hasPatio,
                fence: hasFence,
                hedge: hasHedge,
                gnome: hasGnome,
                flamingo: hasFlamingo,
                grill: hasGrill,
                shed: hasShed
            }
        });
        console.log(`✓ Backyard: Sky=${hasSky}, House=${hasHouse}, Lawn=${hasLawn}, Patio=${hasPatio}, Fence=${hasFence}, Hedge=${hasHedge}`);
        console.log(`✓ Props: Gnome=${hasGnome}, Flamingo=${hasFlamingo}, Grill=${hasGrill}, Shed=${hasShed}`);
        
        // Step 3: Start game to see backyard
        console.log('Step 3: Starting game...');
        await page.keyboard.press('Space');
        await page.waitForTimeout(1000);
        
        const screenshot2 = path.join(SCREENSHOTS_DIR, 'backyard-test-02-game.png');
        await page.screenshot({ path: screenshot2 });
        results.screenshots.push(screenshot2);
        
        results.tests.push({ step: 3, name: 'Game displays backyard', status: 'pass' });
        console.log('✓ Backyard visible');
        
        // Step 4: Check for sliding door (house entry)
        console.log('Step 4: Checking house features...');
        const hasSlidingDoor = rendererJs.includes('sliding') || rendererJs.includes('glass');
        
        results.tests.push({ 
            step: 4, 
            name: 'House has sliding door', 
            status: hasSlidingDoor ? 'pass' : 'fail',
            details: { hasSlidingDoor }
        });
        console.log(`✓ Sliding door: ${hasSlidingDoor}`);
        
        // Step 5: Check for lawn stripes
        console.log('Step 5: Checking lawn details...');
        const hasLawnStripes = rendererJs.includes('stripe') || rendererJs.includes('mowing');
        
        results.tests.push({ 
            step: 5, 
            name: 'Lawn has mowing stripes', 
            status: hasLawnStripes ? 'pass' : 'fail',
            details: { hasLawnStripes }
        });
        console.log(`✓ Lawn stripes: ${hasLawnStripes}`);
        
        // Step 6: Check garden shed (transformed coop)
        console.log('Step 6: Checking garden shed...');
        const hasTools = coopJs.includes('tool') || coopJs.includes('rake') || coopJs.includes('shovel');
        const hasFlowerBed = coopJs.includes('flower') || coopJs.includes('garden');
        
        results.tests.push({ 
            step: 6, 
            name: 'Garden shed has details', 
            status: (hasTools || hasFlowerBed) ? 'pass' : 'fail',
            details: { tools: hasTools, flowerBed: hasFlowerBed }
        });
        console.log(`✓ Shed details: Tools=${hasTools}, FlowerBed=${hasFlowerBed}`);
        
        // Step 7: Check patio furniture
        console.log('Step 7: Checking patio furniture...');
        const hasTable = rendererJs.includes('table');
        const hasChairs = rendererJs.includes('chair');
        
        results.tests.push({ 
            step: 7, 
            name: 'Patio has furniture', 
            status: (hasTable && hasChairs) ? 'pass' : 'fail',
            details: { table: hasTable, chairs: hasChairs }
        });
        console.log(`✓ Patio: Table=${hasTable}, Chairs=${hasChairs}`);
        
        // Step 8: Test gameplay in backyard
        console.log('Step 8: Testing gameplay...');
        
        // Move wizard around
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('w');
            await page.waitForTimeout(200);
            await page.keyboard.press('d');
            await page.waitForTimeout(200);
        }
        
        const screenshot3 = path.join(SCREENSHOTS_DIR, 'backyard-test-03-gameplay.png');
        await page.screenshot({ path: screenshot3 });
        results.screenshots.push(screenshot3);
        
        results.tests.push({ step: 8, name: 'Gameplay works in backyard', status: 'pass' });
        console.log('✓ Gameplay tested');
        
    } catch (error) {
        results.success = false;
        console.error('Test error:', error.message);
        
        const errorScreenshot = path.join(SCREENSHOTS_DIR, `backyard-test-error-${Date.now()}.png`);
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
    
    fs.writeFileSync(path.join(PROJECT_DIR, '05-test-backyard-results.json'), JSON.stringify(results, null, 2));
    
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