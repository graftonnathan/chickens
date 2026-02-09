/**
 * Game - Main game class
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();
        this.particles = new ParticleSystem();
        
        // Game state
        this.state = 'menu'; // menu, playing, gameOver
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.highScore = this.loadHighScore();
        
        // Entities - positioned for backyard setting
        this.hero = new Hero(400, 480); // Start at bottom of yard
        this.coop = new Coop(720, 520); // Garden shed in bottom right corner
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
        
        // Space key to start/restart game - use document and check both code and key
        document.addEventListener('keydown', (e) => {
            const isSpace = e.code === 'Space' || e.key === ' ' || e.keyCode === 32;
            const canStart = this.state === 'menu' || this.state === 'gameOver';
            
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
        this.lives = 3;
        this.gameTime = 0;
        this.chickens = [];
        this.raccoons = [];
        this.bonusTexts = [];
        this.hero = new Hero(400, 480); // Bottom of backyard
        this.spawner.reset();
        this.raccoonSpawner.reset();
        this.particles = new ParticleSystem();
        
        this.updateUI();
        this.hideOverlays();
    }

    gameOver() {
        this.state = 'gameOver';
        this.saveHighScore();
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('finalTime').textContent = this.formatTime(this.gameTime);
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    hideOverlays() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        this.gameTime += deltaTime;
        
        // Update hero (pass chickens for proximity glow and particles for trail)
        this.hero.update(deltaTime, this.input, this.chickens, this.particles);
        
        // Update spawner
        if (this.spawner.update(deltaTime, this.chickens)) {
            this.chickens.push(this.spawner.spawnChicken());
        }
        
        // Update chickens
        this.chickens = this.chickens.filter(chicken => {
            chicken.update(deltaTime);
            
            // Check if caught
            if (Collision.circleCircle(this.hero.getBounds(), chicken.getBounds())) {
                this.score += 10;
                this.particles.spawnMagicBurst(chicken.x, chicken.y);
                this.updateUI();
                return false; // Remove caught chicken
            }
            
            // Check if escaped (backyard boundaries with fences)
            if (Collision.outsideBounds(chicken.getBounds(), {
                left: 25, right: 775, top: 180, bottom: 575
            })) {
                this.lives--;
                this.particles.spawn(chicken.x, chicken.y, 'escape', 10);
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                return false; // Remove escaped chicken
            }
            
            return true;
        });
        
        // Update raccoon spawner and raccoons
        this.updateRaccoons(deltaTime);
        
        // Update bonus texts
        this.bonusTexts = this.bonusTexts.filter(text => {
            text.y -= 30 * deltaTime;
            text.life -= deltaTime;
            return text.life > 0;
        });
        
        // Update particles
        this.particles.update();
        
        this.updateUI();
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
                this.updateUI();
                
                // Remove after fleeing
                setTimeout(() => {
                    this.raccoons = this.raccoons.filter(r => r !== raccoon);
                }, 1000);
                return true; // Keep for flee animation
            }
            
            // Check if raccoon reached the coop
            if (raccoon.state === 'moving' && raccoon.checkReachedTarget()) {
                // Raccoon reached coop - lose a life!
                this.lives--;
                this.particles.spawn(raccoon.x, raccoon.y, 'escape', 15);
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                return false; // Remove raccoon
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
        
        // Draw coop
        this.coop.draw(this.ctx);
        
        // Draw paw print trail particles first (so they're under raccoon)
        this.particles.particles.filter(p => p instanceof PawPrint).forEach(p => p.draw(this.ctx));
        
        // Draw raccoons
        this.raccoons.forEach(raccoon => raccoon.draw(this.ctx));
        
        // Draw chickens
        this.chickens.forEach(chicken => chicken.draw(this.ctx));
        
        // Draw hero
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
        
        // Red warning overlay at spawn area
        this.ctx.save();
        this.ctx.globalAlpha = alpha * pulse;
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(400, 575, 40 + progress * 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Warning text
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('!', 400, 580);
        this.ctx.restore();
    }
    
    drawBonusTexts() {
        this.ctx.save();
        this.bonusTexts.forEach(text => {
            this.ctx.globalAlpha = text.life;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#ff8c00';
            this.ctx.fillText(text.text, text.x, text.y);
        });
        this.ctx.restore();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('time').textContent = this.formatTime(this.gameTime);
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
        if (this.score > this.highScore) {
            this.highScore = this.score;
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
