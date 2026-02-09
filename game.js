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
        
        // Entities - FLIPPED: coop at NORTH, house at SOUTH
        this.hero = new Hero(400, 450); // Start in middle-bottom area
        this.coop = new Coop(400, 50); // Garden shed at NORTH
        this.spawner = new Spawner(this.coop);
        this.chickens = [];
        
        // Raccoon enemy
        this.raccoonSpawner = new RaccoonSpawner(this.coop);
        this.raccoons = [];
        
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
        this.hero = new Hero(400, 450); // Start in yard
        this.spawner.reset();
        this.raccoonSpawner.reset();
        this.particles = new ParticleSystem();
        
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
        
        // Check for deposit at coop
        this.checkDeposit();
        
        // Update spawner
        if (this.spawner.update(deltaTime, this.chickens)) {
            this.chickens.push(this.spawner.spawnChicken());
        }
        
        // Update chickens
        this.updateChickens(deltaTime);
        
        // Update raccoons
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
        // If hero is in deposit zone and carrying chickens
        if (this.coop.isInDepositZone(this.hero.x, this.hero.y)) {
            const deposited = this.hero.deposit();
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
            chicken.update(deltaTime);
            
            // Check if hero can pick up chicken
            if (this.hero.canCarry() && 
                Collision.circleCircle(this.hero.getBounds(), chicken.getBounds())) {
                if (this.hero.tryPickup(chicken)) {
                    // Pickup particles
                    this.particles.spawn(chicken.x, chicken.y, 'catch', 8);
                    return false; // Remove picked up chicken
                }
            }
            
            // Check if chicken reached the HOUSE (south) - ESCAPE
            if (chicken.y > 550) {
                this.lives--;
                this.particles.spawn(chicken.x, chicken.y, 'escape', 10);
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                return false; // Remove escaped chicken
            }
            
            return true;
        });
    }
    
    updateRaccoons(deltaTime) {
        // Spawn new raccoon
        if (this.raccoonSpawner.update(deltaTime, this.raccoons)) {
            this.raccoons.push(this.raccoonSpawner.spawnRaccoon());
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
        
        // Draw other particles
        this.particles.particles.filter(p => !(p instanceof PawPrint)).forEach(p => p.draw(this.ctx));
        
        // Draw bonus texts
        this.drawBonusTexts();
    }
    
    drawSpawnWarning() {
        const progress = this.raccoonSpawner.getWarningProgress();
        const alpha = 0.3 + progress * 0.5;
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        
        // Show warning at all three possible spawn sides
        const warningPositions = [
            {x: 400, y: 30, label: 'N'},   // North
            {x: 770, y: 300, label: 'E'},  // East
            {x: 30, y: 300, label: 'W'}    // West
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
        
        // Update bag indicator
        const bagDisplay = document.getElementById('bagDisplay');
        if (bagDisplay) {
            const count = this.hero.getCarryCount();
            bagDisplay.textContent = '🐔'.repeat(count) + '○'.repeat(2 - count);
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
