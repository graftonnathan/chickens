const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_DIR = '/home/molten/.openclaw/workspace/PROJECTS/chickens';

async function verifyFix() {
    console.log('Verifying Space Key Fix...\n');
    
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
    
    await new Promise(resolve => server.listen(9992, resolve));
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:9992/', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);
        
        // Check initial state
        const initial = await page.evaluate(() => {
            const startScreen = document.getElementById('startScreen');
            return {
                startScreenVisible: startScreen && !startScreen.classList.contains('hidden'),
                startScreenClass: startScreen ? startScreen.className : 'not found'
            };
        });
        console.log('Initial state:');
        console.log(`  Start screen visible: ${initial.startScreenVisible}`);
        
        // Take screenshot before
        await page.screenshot({ path: path.join(PROJECT_DIR, 'screenshots/verify-before-space.png') });
        
        // Press Space
        console.log('\nPressing Space key...');
        await page.keyboard.press('Space');
        await page.waitForTimeout(1500); // Wait longer for game to start
        
        // Check after
        const after = await page.evaluate(() => {
            const startScreen = document.getElementById('startScreen');
            const gameOverScreen = document.getElementById('gameOverScreen');
            return {
                startScreenHidden: startScreen && startScreen.classList.contains('hidden'),
                gameOverHidden: gameOverScreen && gameOverScreen.classList.contains('hidden'),
                score: document.getElementById('score') ? document.getElementById('score').textContent : 'N/A'
            };
        });
        
        console.log('\nAfter Space key:');
        console.log(`  Start screen hidden: ${after.startScreenHidden}`);
        console.log(`  Game over screen hidden: ${after.gameOverHidden}`);
        console.log(`  Score display: ${after.score}`);
        
        // Take screenshot after
        await page.screenshot({ path: path.join(PROJECT_DIR, 'screenshots/verify-after-space.png') });
        
        const success = after.startScreenHidden;
        
        console.log('\n=== RESULT ===');
        if (success) {
            console.log('✅ SUCCESS: Space key starts the game!');
            console.log('   Start screen is now hidden.');
        } else {
            console.log('❌ FAIL: Space key not working');
            console.log('   Start screen still visible.');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
    server.close();
}

verifyFix();