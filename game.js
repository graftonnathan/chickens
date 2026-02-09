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
        
        // Bind UI
        this.bindUI();
        
        // Start loop
        this.lastTime = performance.now();
        this.loop();
    }

    bindUI() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.start();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.start();
        });
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.chickens = [];
        this.hero = new Hero(400, 480); // Bottom of backyard
        this.spawner.reset();
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
        
        // Update particles
        this.particles.update();
        
        this.updateUI();
    }

    draw() {
        this.renderer.clear();
        
        // Draw coop
        this.coop.draw(this.ctx);
        
        // Draw chickens
        this.chickens.forEach(chicken => chicken.draw(this.ctx));
        
        // Draw hero
        this.hero.draw(this.ctx);
        
        // Draw particles
        this.particles.draw(this.ctx);
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
