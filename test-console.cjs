const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_DIR = '/home/molten/.openclaw/workspace/PROJECTS/chickens';

async function testWithConsole() {
    console.log('Testing with Browser Console Monitoring...\n');
    
    const consoleErrors = [];
    const consoleLogs = [];
    
    const server = http.createServer((req, res) => {
        const filePath = path.join(PROJECT_DIR, req.url === '/' ? 'index.html' : req.url);
        try {
            const content = fs.readFileSync(filePath);
            res.writeHead(200);
            res.end(content);
        } catch (e) {
            res.writeHead(404);
            res.end('Not found');
        }
    });
    
    await new Promise(resolve => server.listen(9987, resolve));
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push({ type: msg.type(), text });
        if (msg.type() === 'error') {
            consoleErrors.push(text);
            console.log(`❌ ERROR: ${text.substring(0, 200)}`);
        }
    });
    
    page.on('pageerror', error => {
        consoleErrors.push(error.message);
        console.log(`❌ PAGE ERROR: ${error.message}`);
    });
    
    try {
        console.log('1. Loading game...');
        await page.goto('http://localhost:9987/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        console.log('\n2. Checking initial state...');
        const initial = await page.evaluate(() => ({
            startScreenVisible: !document.getElementById('startScreen').classList.contains('hidden'),
            buttonExists: !!document.getElementById('startBtn')
        }));
        console.log(`   Start screen visible: ${initial.startScreenVisible}`);
        console.log(`   Start button exists: ${initial.buttonExists}`);
        
        if (!initial.buttonExists) {
            console.log('❌ CRITICAL: Start button not found!');
            return;
        }
        
        console.log('\n3. Clicking Start button...');
        await page.click('#startBtn');
        await page.waitForTimeout(2000);
        
        const afterClick = await page.evaluate(() => ({
            startScreenHidden: document.getElementById('startScreen').classList.contains('hidden'),
            gameState: window.game ? window.game.state : 'no game'
        }));
        console.log(`   Start screen hidden: ${afterClick.startScreenHidden}`);
        console.log(`   Game state: ${afterClick.gameState}`);
        
        console.log('\n=== RESULTS ===');
        if (consoleErrors.length === 0) {
            console.log('✅ No JavaScript errors in console');
        } else {
            console.log(`❌ ${consoleErrors.length} JavaScript errors found`);
            consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
        }
        
        if (afterClick.startScreenHidden) {
            console.log('✅ Game started successfully');
        } else {
            console.log('❌ Game did NOT start');
        }
        
    } catch (error) {
        console.error('Test error:', error.message);
    }
    
    await browser.close();
    server.close();
}

testWithConsole();