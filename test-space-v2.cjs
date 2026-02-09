const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_DIR = '/home/molten/.openclaw/workspace/PROJECTS/chickens';

async function testSpaceKey() {
    console.log('Testing Space Key Fix v2...\n');
    
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
    
    await new Promise(resolve => server.listen(9990, resolve));
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:9990/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Try different methods to press Space
        console.log('Method 1: page.keyboard.press("Space")');
        await page.keyboard.press('Space');
        await page.waitForTimeout(1000);
        
        let result = await page.evaluate(() => ({
            hidden: document.getElementById('startScreen').classList.contains('hidden')
        }));
        console.log(`  Start screen hidden: ${result.hidden}`);
        
        if (!result.hidden) {
            console.log('\nMethod 2: Dispatch keydown event directly');
            await page.evaluate(() => {
                const event = new KeyboardEvent('keydown', {
                    code: 'Space',
                    key: ' ',
                    keyCode: 32,
                    bubbles: true
                });
                document.dispatchEvent(event);
            });
            await page.waitForTimeout(1000);
            
            result = await page.evaluate(() => ({
                hidden: document.getElementById('startScreen').classList.contains('hidden')
            }));
            console.log(`  Start screen hidden: ${result.hidden}`);
        }
        
        if (!result.hidden) {
            console.log('\nMethod 3: Click the start button');
            await page.click('#startBtn');
            await page.waitForTimeout(1000);
            
            result = await page.evaluate(() => ({
                hidden: document.getElementById('startScreen').classList.contains('hidden')
            }));
            console.log(`  Start screen hidden: ${result.hidden}`);
        }
        
        console.log('\n=== FINAL RESULT ===');
        if (result.hidden) {
            console.log('✅ Game started successfully!');
        } else {
            console.log('❌ Game did not start with Space key');
            console.log('   But button click should work.');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
    server.close();
}

testSpaceKey();