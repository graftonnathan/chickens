const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_DIR = '/home/molten/.openclaw/workspace/PROJECTS/chickens';

async function debugSpaceKey() {
    console.log('Debugging Space Key Fix...\n');
    
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
    
    await new Promise(resolve => server.listen(9991, resolve));
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => console.log('Console:', msg.text()));
    
    try {
        await page.goto('http://localhost:9991/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Check if keydown listener exists by checking event listeners
        const hasListener = await page.evaluate(() => {
            // Get all keydown listeners
            const listeners = window.getEventListeners ? window.getEventListeners(window) : null;
            return {
                hasListenersAPI: !!window.getEventListeners,
                listeners: listeners
            };
        });
        console.log('Event listeners check:', hasListener);
        
        // Try pressing Space multiple times
        for (let i = 0; i < 3; i++) {
            console.log(`\n--- Attempt ${i + 1} ---`);
            await page.keyboard.press('Space');
            await page.waitForTimeout(1000);
            
            const state = await page.evaluate(() => {
                const startScreen = document.getElementById('startScreen');
                return {
                    hidden: startScreen && startScreen.classList.contains('hidden')
                };
            });
            console.log(`Start screen hidden: ${state.hidden}`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
    server.close();
}

debugSpaceKey();