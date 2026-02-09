/**
 * Game - Main game class with carrying mechanic
 * Coop at NORTH, House at SOUTH
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();
        this.particles = new ParticleSystem();
        
        // Game state
        this.state = 'menu'; // menu, playing, gameOver, win
        this.score = 0;
        this.depositedCount = 0; // Total chickens deposited
        this.winTarget = 50; // Need to deposit 50 chickens to win
        this.lives = 3;
        this.gameTime = 0;
        this.highScore = this.loadHighScore();
        
        // Entities - Coop on ground at NORTH, House roof at SOUTH
        this.hero = new Hero(400, 350); // Start in middle area (within fences)
        this.coop = new Coop(400, 80); // Garden shed on ground below north fence
        this.spawner = new Spawner(this.coop);
        this.chickens = [];
        
        // Raccoon enemy
        this.raccoonSpawner = new RaccoonSpawner(this.coop);
        this.raccoons = [];
        
        // Egg collection mechanic
        this.basketItem = new BasketItem();
        this.houseDepositZone = new HouseDepositZone();
        
        // Fence destruction and repair mechanic
        this.fenceHoleManager = new FenceHoleManager();
        this.hammerItem = new HammerItem();
        
        // Bonus text animations
        this.bonusTexts = [];
        
        // Bind UI
        this.bindUI();
        
        // Start loop
        this.lastTime = performance.now();
        this.loop();
    }

    bindUI() {
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.start();
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.start();
            });
        }
        
        // Space key to start/restart game
        document.addEventListener('keydown', (e) => {
            const isSpace = e.code === 'Space' || e.key === ' ' || e.keyCode === 32;
            const canStart = this.state === 'menu' || this.state === 'gameOver' || this.state === 'win';
            
            if (isSpace && canStart) {
                e.preventDefault();
                e.stopPropagation();
                this.start();
            }
        });
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.depositedCount = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.chickens = [];
        this.raccoons = [];
        this.bonusTexts = [];
        this.hero = new Hero(400, 350); // Start in yard (within fence bounds)
        this.spawner.reset();
        this.raccoonSpawner.reset();
        this.particles = new ParticleSystem();
        
        // Reset egg collection
        this.basketItem.respawn();
        this.coop.eggManager.reset();
        
        // Reset fence holes and hammer
        this.fenceHoleManager.reset();
        this.hammerItem.respawn();
        
        this.updateUI();
        this.hideOverlays();
    }

    gameOver() {
        this.state = 'gameOver';
        this.saveHighScore();
        
        document.getElementById('finalScore').textContent = this.depositedCount;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('finalTime').textContent = this.formatTime(this.gameTime);
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    gameWin() {
        this.state = 'win';
        this.saveHighScore();
        
        // Update win screen text
        const gameOverTitle = document.querySelector('#gameOverScreen h1');
        if (gameOverTitle) gameOverTitle.textContent = 'YOU WIN!';
        
        document.getElementById('finalScore').textContent = this.depositedCount;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('finalTime').textContent = this.formatTime(this.gameTime);
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) restartBtn.textContent = 'Play Again';
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    hideOverlays() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        this.gameTime += deltaTime;
        
        // Update hero
        this.hero.update(deltaTime, this.input, this.chickens, this.particles);
        
        // Update basket item (glow animation)
        this.basketItem.update(deltaTime);
        
        // Basket pickup at house
        if (this.basketItem.checkPickup(this.hero)) {
            if (this.hero.pickUpBasket()) {
                this.basketItem.collect();
                this.addBonusText(this.hero.x, this.hero.y - 30, '+BASKET');
            }
        }
        
        // Update hammer item
        this.hammerItem.update(deltaTime);
        
        // Hammer pickup at house
        if (this.hammerItem.checkPickup(this.hero)) {
            if (this.hero.pickUpHammer()) {
                this.hammerItem.collect();
                this.addBonusText(this.hero.x, this.hero.y - 30, '+HAMMER');
            }
        }
        
        // Check for auto-repair when near hole with hammer
        if (this.hero.hasHammer() && !this.hero.isRepairing) {
            const nearestHole = this.fenceHoleManager.getNearestHole(this.hero.x, this.hero.y);
            if (nearestHole && nearestHole.canRepair(this.hero)) {
                this.hero.startRepair(nearestHole);
            }
        }
        
        // Update repair progress
        if (this.hero.isRepairing) {
            const repairedHole = this.hero.updateRepair(deltaTime);
            if (repairedHole) {
                // Repair complete
                this.fenceHoleManager.removeHole(repairedHole);
                this.score += 20; // +20 points for repair
                this.addBonusText(this.hero.x, this.hero.y - 50, '+20 REPAIR');
                
                // Respawn hammer for next use
                this.hammerItem.respawn();
                this.hero.dropHammer();
            }
        }
        
        // Fence collision - prevent hero from entering coop enclosure (except with basket through gap)
        const fenceResult = this.coop.pushOutside(this.hero.x, this.hero.y, this.hero.radius, this.hero);
        if (!fenceResult.inGap) {
            this.hero.x = fenceResult.x;
            this.hero.y = fenceResult.y;
        }
        
        // Egg collection when inside coop with basket
        if (fenceResult.inCoop) {
            const collectedEggs = this.coop.checkEggCollection(this.hero);
            if (collectedEggs.length > 0) {
                this.addBonusText(this.hero.x, this.hero.y - 30, `+${collectedEggs.length} EGG${collectedEggs.length > 1 ? 'S' : ''}`);
            }
        }
        
        // Check for deposit at coop (through gap) - chickens only
        this.checkDeposit();
        
        // Egg delivery at house
        if (this.hero.hasBasket() && this.hero.eggsInBasket > 0) {
            if (this.houseDepositZone.isInZone(this.hero)) {
                const eggs = this.hero.depositEggs();
                const points = eggs * 5; // 5 points per egg
                this.score += points;
                this.addBonusText(this.hero.x, this.hero.y - 30, `+${points} PTS`);
                
                // Basket respawns for next run
                this.basketItem.respawn();
                
                // Drop basket from hero (free up slot)
                this.hero.dropBasket();
            }
        }
        
        // Update coop (egg spawning)
        this.coop.update(deltaTime);
        
        // Update spawner
        if (this.spawner.update(deltaTime, this.chickens)) {
            this.chickens.push(this.spawner.spawnChicken());
        }
        
        // Update chickens (with fence hole awareness)
        this.updateChickens(deltaTime);
        
        // Update raccoons (with fence hole creation)
        this.updateRaccoons(deltaTime);
        
        // Update bonus texts
        this.bonusTexts = this.bonusTexts.filter(text => {
            text.y -= 30 * deltaTime;
            text.life -= deltaTime;
            return text.life > 0;
        });
        
        // Update particles
        this.particles.update();
        
        // Check win condition
        if (this.depositedCount >= this.winTarget) {
            this.gameWin();
        }
        
        this.updateUI();
    }
    
    checkDeposit() {
        // If hero is in deposit zone (at fence gap) and carrying chickens
        if (this.coop.isAtDepositZone(this.hero)) {
            const deposited = this.hero.depositChickens();
            if (deposited > 0) {
                this.depositedCount += deposited;
                this.score += deposited * 20; // 20 points per deposited chicken
                this.addBonusText(this.hero.x, this.hero.y - 30, `+${deposited * 20}`);
                
                // Deposit particles
                for (let i = 0; i < deposited; i++) {
                    this.particles.spawnMagicBurst(this.coop.x + (Math.random() - 0.5) * 40, this.coop.y + 20);
                }
            }
        }
    }
    
    updateChickens(deltaTime) {
        this.chickens = this.chickens.filter(chicken => {
            const result = chicken.update(deltaTime, this.fenceHoleManager);
            
            // Check if hero can pick up chicken
            if (this.hero.canPickUp('chicken') && 
                Collision.circleCircle(this.hero.getBounds(), chicken.getBounds())) {
                if (this.hero.tryPickup(chicken)) {
                    // Pickup particles
                    this.particles.spawn(chicken.x, chicken.y, 'catch', 8);
                    return false; // Remove picked up chicken
                }
            }
            
            // Check escape result
            if (result === 'escaped_through_hole') {
                this.lives--;
                this.particles.spawn(chicken.x, chicken.y, 'escape', 10);
                if (this.lives <= 0) {
                    this.gameOver();
                }
                return false;
            } else if (result === 'escaped_south') {
                this.lives--;
                this.particles.spawn(chicken.x, chicken.y, 'escape', 10);
                if (this.lives <= 0) {
                    this.gameOver();
                }
                return false;
            }
            
            return true;
        });
    }
    
    updateRaccoons(deltaTime) {
        // Spawn new raccoon (with fence punch)
        if (this.raccoonSpawner.update(deltaTime, this.raccoons)) {
            this.raccoons.push(this.raccoonSpawner.spawnRaccoon(this.fenceHoleManager, this.particles));
        }
        
        // Update existing raccoons
        this.raccoons = this.raccoons.filter(raccoon => {
            raccoon.update(deltaTime, this.particles);
            
            // Check if hero intercepted raccoon
            if (raccoon.state === 'moving' && 
                Collision.circleCircle(this.hero.getBounds(), raccoon.getBounds())) {
                // Intercepted!
                raccoon.intercept(this.particles);
                this.score += 50;
                this.addBonusText(raccoon.x, raccoon.y, '+50');
                
                // Remove after fleeing
                setTimeout(() => {
                    this.raccoons = this.raccoons.filter(r => r !== raccoon);
                }, 1000);
                return true;
            }
            
            // Check if raccoon reached the coop
            if (raccoon.state === 'moving' && raccoon.checkReachedTarget()) {
                // Raccoon reached coop - lose ALL carried chickens!
                const stolen = this.hero.deposit(); // Actually steals carried chickens
                this.lives--;
                this.particles.spawn(raccoon.x, raccoon.y, 'escape', 15);
                
                if (stolen > 0) {
                    this.addBonusText(raccoon.x, raccoon.y, `-${stolen} STOLEN!`);
                }
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                return false;
            }
            
            // Remove if escaped (fled off screen)
            if (raccoon.state === 'fleeing' && 
                Collision.outsideBounds(raccoon.getBounds(), {
                    left: -50, right: 850, top: -50, bottom: 650
                })) {
                return false;
            }
            
            return true;
        });
    }
    
    addBonusText(x, y, text) {
        this.bonusTexts.push({
            x: x,
            y: y,
            text: text,
            life: 1.0
        });
    }

    draw() {
        this.renderer.clear();
        
        // Draw spawn warning if active
        if (this.state === 'playing' && this.raccoonSpawner.warningActive) {
            this.drawSpawnWarning();
        }
        
        // Draw basket at house (if not collected)
        this.basketItem.draw(this.ctx);
        
        // Draw hammer at house (if not collected)
        this.hammerItem.draw(this.ctx);
        
        // Draw fence holes
        this.fenceHoleManager.draw(this.ctx);
        
        // Draw coop at NORTH
        this.coop.draw(this.ctx);
        
        // Draw paw print trails
        this.particles.particles.filter(p => p instanceof PawPrint).forEach(p => p.draw(this.ctx));
        
        // Draw raccoons
        this.raccoons.forEach(raccoon => raccoon.draw(this.ctx));
        
        // Draw chickens
        this.chickens.forEach(chicken => chicken.draw(this.ctx));
        
        // Draw hero (with carried chickens)
        this.hero.draw(this.ctx);
        
        // Draw deposit hint when at gap with chickens
        if (this.state === 'playing') {
            this.coop.drawDepositHint(this.ctx, this.hero);
        }
        
        // Draw house delivery hint when carrying eggs
        if (this.state === 'playing') {
            this.houseDepositZone.drawHint(this.ctx, this.hero);
        }
        
        // Draw other particles
        this.particles.particles.filter(p => !(p instanceof PawPrint)).forEach(p => p.draw(this.ctx));
        
        // Draw bonus texts
        this.drawBonusTexts();
    }
    
    drawSpawnWarning() {
        const progress = this.raccoonSpawner.getWarningProgress();
        const alpha = 0.3 + progress * 0.5;
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        
        // Show warning at all three possible spawn sides (outside fences)
        const warningPositions = [
            {x: 400, y: 20, label: 'N'},   // North (above fence)
            {x: 790, y: 300, label: 'E'},  // East (outside fence)
            {x: 10, y: 300, label: 'W'}    // West (outside fence)
        ];
        
        this.ctx.save();
        
        warningPositions.forEach(pos => {
            this.ctx.globalAlpha = alpha * pulse;
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Warning text
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('!', pos.x, pos.y + 5);
        });
        
        this.ctx.restore();
    }
    
    drawBonusTexts() {
        this.ctx.save();
        this.bonusTexts.forEach(text => {
            this.ctx.globalAlpha = text.life;
            this.ctx.fillStyle = text.text.includes('STOLEN') ? '#ff4444' : '#ffd700';
            this.ctx.font = 'bold 18px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = text.text.includes('STOLEN') ? '#ff0000' : '#ff8c00';
            this.ctx.fillText(text.text, text.x, text.y);
        });
        this.ctx.restore();
    }

    updateUI() {
        document.getElementById('score').textContent = this.depositedCount + '/' + this.winTarget;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('time').textContent = this.formatTime(this.gameTime);
        
        // Update bag indicator - show shared slots (chickens, basket, or hammer)
        const bagDisplay = document.getElementById('bagDisplay');
        if (bagDisplay) {
            let slotText = '';
            for (let i = 0; i < 2; i++) {
                if (this.hero.carrySlots[i] === 'chicken') {
                    slotText += '🐔';
                } else if (this.hero.carrySlots[i] === 'basket') {
                    slotText += '🧺';
                } else if (this.hero.carrySlots[i] === 'hammer') {
                    slotText += '🔨';
                } else {
                    slotText += '○';
                }
            }
            // Add egg counter if carrying basket
            if (this.hero.hasBasket()) {
                slotText += ` 🥚${this.hero.eggsInBasket}/${this.hero.maxEggs}`;
            }
            bagDisplay.textContent = slotText;
        }
        
        // Update hole warning if holes exist
        const holeCount = this.fenceHoleManager.getHoleCount();
        if (holeCount > 0) {
            // Could add a hole warning element to HTML, for now just log
            const holeWarning = document.getElementById('holeWarning');
            if (holeWarning) {
                holeWarning.textContent = `HOLES: ${holeCount}/6`;
                // Color based on urgency
                if (holeCount >= 5) {
                    holeWarning.style.color = '#f44336'; // Red alert
                } else if (holeCount >= 3) {
                    holeWarning.style.color = '#ff5722'; // Orange-red
                } else {
                    holeWarning.style.color = '#ff9800'; // Orange
                }
                holeWarning.style.display = 'block';
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem('chickens_highscore');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore() {
        if (this.depositedCount > this.highScore) {
            this.highScore = this.depositedCount;
            try {
                localStorage.setItem('chickens_highscore', this.highScore.toString());
            } catch (e) {}
        }
    }

    loop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(() => this.loop());
    }
}

// Start game when loaded
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
