/**
 * Game - Main game class with egg collection gameplay
 * Coop at NORTH with 12 chickens, House at SOUTH
 * Goal: Collect 100 eggs from chickens
 * Lose: All 12 chickens escape
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();
        this.particles = new ParticleSystem();
        
        // Game state
        this.state = 'menu'; // menu, playing, won, lost
        this.gameTime = 0;
        
        // Win/Lose conditions
        this.eggsCollected = 0;
        this.eggsToWin = 100;
        this.escapedChickens = 0;
        this.maxChickens = 12;
        
        // Entities
        this.hero = new Hero(400, 350);
        this.coop = new Coop(400, 80);
        
        // Chicken manager for 12 unique types
        this.chickenManager = new ChickenManager(this.coop);
        
        // Raccoon enemy
        this.raccoonSpawner = new RaccoonSpawner(this.coop);
        this.raccoons = [];
        
        // Tools at house (simplified - one at a time)
        this.toolManager = new ToolManager();
        
        // Fence holes
        this.fenceHoleManager = new FenceHoleManager();
        
        // Bonus texts
        this.bonusTexts = [];

        // Interaction prompt
        this.interactionPrompt = null;

        // Spell UI
        this.spellBarVisible = true;

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
            startBtn.addEventListener('click', () => this.start());
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.start());
        }
        
        document.addEventListener('keydown', (e) => {
            const isSpace = e.code === 'Space' || e.key === ' ' || e.keyCode === 32;
            const canStart = this.state === 'menu' || this.state === 'won' || this.state === 'lost';
            
            if (isSpace && canStart) {
                e.preventDefault();
                this.start();
            }
        });
    }
    
    start() {
        this.state = 'playing';
        this.gameTime = 0;
        this.eggsCollected = 0;
        this.escapedChickens = 0;
        this.bonusTexts = [];
        
        this.hero = new Hero(400, 350);
        this.coop = new Coop(400, 80);
        
        // Spawn 12 unique typed chickens
        this.chickenManager = new ChickenManager(this.coop);
        this.chickenManager.spawnChickens();
        
        this.raccoons = [];
        this.raccoonSpawner.reset();
        this.particles = new ParticleSystem();
        
        this.fenceHoleManager.reset();
        this.toolManager.reset();
        
        this.updateUI();
        this.hideOverlays();
    }
    
    gameWin() {
        this.state = 'won';
        
        document.getElementById('finalScore').textContent = this.eggsCollected;
        document.getElementById('highScore').textContent = this.eggsCollected;
        document.getElementById('finalTime').textContent = this.formatTime(this.gameTime);
        
        const title = document.querySelector('#gameOverScreen h1');
        if (title) title.textContent = '🏆 VICTORY! 🏆';
        
        const subtitle = document.querySelector('#gameOverScreen .tagline');
        if (subtitle) subtitle.textContent = `You collected ${this.eggsCollected} eggs in ${this.formatTime(this.gameTime)}!`;
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) restartBtn.textContent = 'Play Again';
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    gameOver() {
        this.state = 'lost';
        
        document.getElementById('finalScore').textContent = this.eggsCollected;
        document.getElementById('highScore').textContent = this.eggsCollected;
        document.getElementById('finalTime').textContent = this.formatTime(this.gameTime);
        
        const title = document.querySelector('#gameOverScreen h1');
        if (title) title.textContent = '💔 GAME OVER 💔';
        
        const subtitle = document.querySelector('#gameOverScreen .tagline');
        if (subtitle) subtitle.textContent = `All ${this.maxChickens} chickens escaped! You collected ${this.eggsCollected} eggs.`;
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) restartBtn.textContent = 'Try Again';
        
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
        this.hero.update(deltaTime, this.input, this.coop.chickens, this.particles);
        
        // Fence collision
        const fenceResult = this.coop.pushOutside(this.hero.x, this.hero.y, this.hero.radius, this.hero);
        if (!fenceResult.inCoop) {
            this.hero.x = fenceResult.x;
            this.hero.y = fenceResult.y;
        }
        
        // Update coop and chickens
        const escapedChickens = this.chickenManager.update(deltaTime, this.coop, this.gameTime);
        if (escapedChickens.length > 0) {
            this.escapedChickens += escapedChickens.length;
            // Particle effect for escape
            escapedChickens.forEach(chicken => {
                this.particles.spawn(chicken.x, 550, 'escape', 10);
            });
        }
        
        // Update tools
        this.toolManager.update(deltaTime);
        
        // Tool pickup
        const availableTools = this.toolManager.checkPickups(this.hero);
        for (const tool of availableTools) {
            if (this.hero.pickUpTool(tool)) {
                const toolName = tool.type === 'eggBasket' ? 'BASKET' : 
                                tool.type === 'hammer' ? 'HAMMER' : 'FOOD';
                this.addBonusText(this.hero.x, this.hero.y - 30, `+${toolName}`);
                break;
            }
        }
        
        // Check interactions inside coop
        if (fenceResult.inCoop) {
            const eggBasket = this.hero.getTool('eggBasket');
            const foodBasket = this.hero.getTool('foodBasket');
            
            // Egg collection - find nearby chickens with eggs
            if (eggBasket && eggBasket.canCollect()) {
                const chickens = this.chickenManager.getChickensWithEggs();
                let collected = 0;
                
                for (const chicken of chickens) {
                    const dist = Math.hypot(chicken.x - this.hero.x, chicken.y - this.hero.y);
                    if (dist < 50 && eggBasket.canCollect()) {
                        const result = chicken.collectEgg();
                        if (result) {
                            eggBasket.collectEgg();
                            collected++;
                            
                            // Check for golden egg
                            if (typeof result === 'object' && result.golden) {
                                this.addBonusText(chicken.x, chicken.y - 40, '✨ GOLD!');
                                this.score += 5; // Bonus points for golden egg
                            }
                            
                            this.particles.spawn(chicken.x, chicken.y, 'sparkle', 5);
                        }
                    }
                }
                
                if (collected > 0) {
                    this.addBonusText(this.hero.x, this.hero.y - 30, `+${collected} EGG${collected > 1 ? 'S' : ''}`);
                }
            }
            
            // Feeding - find nearby hungry chickens
            if (foodBasket && foodBasket.usesRemaining > 0) {
                const chickens = this.chickenManager.getHungryChickens();
                let fed = 0;
                
                for (const chicken of chickens) {
                    const dist = Math.hypot(chicken.x - this.hero.x, chicken.y - this.hero.y);
                    if (dist < 50 && foodBasket.usesRemaining > 0) {
                        chicken.feed();
                        foodBasket.use();
                        fed++;
                        this.addBonusText(chicken.x, chicken.y - 40, '❤');
                        this.particles.spawn(chicken.x, chicken.y, 'heart', 3);
                    }
                }
                
                if (foodBasket.isEmpty()) {
                    this.hero.dropTool('foodBasket');
                }
            }
        }
        
        // Egg deposit at house
        const eggBasket = this.hero.getTool('eggBasket');
        if (eggBasket && eggBasket.eggs > 0) {
            const atHouse = this.hero.y > 530 && Math.abs(this.hero.x - 400) < 100;
            if (atHouse) {
                const eggs = eggBasket.eggs;
                this.eggsCollected += eggs;
                this.addBonusText(this.hero.x, this.hero.y - 30, `+${eggs} EGGS!`);
                
                // Clear basket and drop it
                eggBasket.eggs = 0;
                eggBasket.reset();
                this.hero.dropTool('eggBasket');
                
                // Particle effect
                this.particles.spawn(this.hero.x, this.hero.y, 'deposit', 10);
            }
        }
        
        // Fence repair with hammer
        if (this.hero.hasTool('hammer') && !this.hero.isRepairing) {
            const nearestHole = this.fenceHoleManager.getNearestHole(this.hero.x, this.hero.y);
            if (nearestHole && nearestHole.canRepair(this.hero)) {
                this.hero.startRepair(nearestHole);
            }
        }
        
        if (this.hero.isRepairing) {
            const repairedHole = this.hero.updateRepair(deltaTime);
            if (repairedHole) {
                this.fenceHoleManager.removeHole(repairedHole);
                this.addBonusText(this.hero.x, this.hero.y - 50, '+REPAIR');
                const hammer = this.hero.getTool('hammer');
                if (hammer && hammer.isEmpty()) {
                    this.hero.dropTool('hammer');
                }
            }
        }
        
        // Update raccoons
        this.updateRaccoons(deltaTime);

        // Handle E key interactions
        this.handleInteractions();

        // Update bonus texts
        this.bonusTexts = this.bonusTexts.filter(text => {
            text.y -= 30 * deltaTime;
            text.life -= deltaTime;
            return text.life > 0;
        });

        // Update particles
        this.particles.update();

        // Check win/lose
        this.checkWinLose();

        // Update UI
        this.updateChickenCards();
        this.updateSpellBar();
        this.updateInteractionPrompt();
        this.updateUI();
    }

    handleInteractions() {
        if (!this.input.isInteractPressed()) return;

        const hero = this.hero;

        // 1. Try to catch escaped chickens
        const escapedChickens = this.chickenManager.chickens.filter(c => !c.inCoop && c.state === 'escaped');
        for (const chicken of escapedChickens) {
            if (chicken.canBeCaught(hero)) {
                chicken.returnToCoop(this.coop);
                this.addBonusText(chicken.x, chicken.y - 30, '🐔 CAUGHT!');
                this.particles.spawn(chicken.x, chicken.y, 'heart', 5);
                return;
            }
        }

        // 2. Try to pick up/drop tool
        if (hero.currentTool) {
            // Drop current tool
            const tool = hero.dropTool();
            if (tool) {
                tool.x = hero.x;
                tool.y = hero.y;
                this.addBonusText(hero.x, hero.y - 30, 'DROPPED');
            }
        } else {
            // Try to pick up a tool
            const availableTools = this.toolManager.checkPickups(hero);
            for (const tool of availableTools) {
                if (hero.pickUpTool(tool)) {
                    const toolName = tool.type === 'eggBasket' ? '🧺 BASKET' :
                                    tool.type === 'hammer' ? '🔨 HAMMER' : '🌾 FOOD';
                    this.addBonusText(hero.x, hero.y - 30, `+${toolName}`);
                    return;
                }
            }
        }

        // 3. Collect eggs with E if in coop with basket
        const fenceResult = this.coop.pushOutside(hero.x, hero.y, hero.radius, hero);
        if (fenceResult.inCoop || fenceResult.inGap) {
            const eggBasket = hero.getTool('eggBasket');
            if (eggBasket && eggBasket.canCollect()) {
                const chickens = this.chickenManager.getChickensWithEggs();
                let collected = 0;

                for (const chicken of chickens) {
                    const dist = Math.hypot(chicken.x - hero.x, chicken.y - hero.y);
                    if (dist < 50 && eggBasket.canCollect()) {
                        if (chicken.collectEgg()) {
                            eggBasket.collectEgg();
                            collected++;
                            this.particles.spawn(chicken.x, chicken.y, 'sparkle', 5);
                        }
                    }
                }

                if (collected > 0) {
                    this.addBonusText(hero.x, hero.y - 30, `+${collected} 🥚`);
                }
            }
        }
    }

    updateChickenCards() {
        const container = document.getElementById('chickenCards');
        if (!container || !this.chickenManager) return;

        // Clear existing cards
        container.innerHTML = '';

        // Create card for each chicken
        this.chickenManager.chickens.forEach((chicken, index) => {
            const card = document.createElement('div');
            card.className = 'chicken-card';

            // Add state classes
            if (!chicken.inCoop) card.classList.add('escaped');
            if (chicken.isEscaping) card.classList.add('escaping');

            // Type icon
            const typeIcon = chicken.chickenType === 'golden' ? '👑' :
                            chicken.chickenType === 'rare' ? '💎' : '🐔';

            // Hunger hearts
            const hearts = Math.ceil(chicken.hunger / 20);
            const hungerDisplay = '❤'.repeat(hearts) + '○'.repeat(5 - hearts);

            // Escape timer bar
            let timerHtml = '';
            if (chicken.hasEgg && !chicken.isEscaping) {
                const threshold = chicken.escapeThresholds[chicken.chickenType] || 45;
                const percent = (chicken.escapeTimer / threshold) * 100;
                const timerClass = percent > 50 ? 'safe' : percent > 25 ? 'warning' : 'danger';
                timerHtml = `<div class="chicken-card-timer"><div class="fill ${timerClass}" style="width: ${percent}%"></div></div>`;
            }

            // Status icon
            let statusIcon = '●'; // idle
            if (chicken.isEscaping) statusIcon = '🏃';
            else if (!chicken.inCoop) statusIcon = '❌';
            else if (chicken.hasEgg) statusIcon = '🥚';
            else if (chicken.hunger < 30) statusIcon = '🍽️';

            card.innerHTML = `
                <div class="chicken-card-header">
                    <span class="chicken-card-id">#${index + 1}</span>
                    <span class="chicken-card-type">${typeIcon}</span>
                </div>
                <div class="chicken-card-body">
                    <div class="chicken-card-portrait">${typeIcon}</div>
                    <div class="chicken-card-stats">
                        <div class="chicken-card-hunger">${hungerDisplay}</div>
                        <div class="chicken-card-eggs">🥚 ${chicken.eggsLaid}</div>
                    </div>
                </div>
                ${timerHtml}
                <div class="chicken-card-status">${statusIcon}</div>
            `;

            container.appendChild(card);
        });
    }

    updateSpellBar() {
        const spellBar = document.getElementById('spellBar');
        if (!spellBar) return;

        const slots = spellBar.querySelectorAll('.spell-slot');
        slots.forEach((slot, index) => {
            const cooldown = this.hero.getSpellCooldown(index);
            const cooldownEl = slot.querySelector('.spell-cooldown');

            if (cooldown > 0) {
                slot.classList.remove('ready');
                slot.classList.add('on-cooldown');
                cooldownEl.textContent = `${cooldown.toFixed(1)}s`;
            } else {
                slot.classList.add('ready');
                slot.classList.remove('on-cooldown');
                cooldownEl.textContent = 'READY';
            }
        });
    }

    updateInteractionPrompt() {
        const prompt = document.getElementById('interactionPrompt');
        if (!prompt) return;

        let showPrompt = false;
        let actionText = 'INTERACT';

        // Check for catchable chickens
        const escapedChickens = this.chickenManager.chickens.filter(c => !c.inCoop && c.state === 'escaped');
        for (const chicken of escapedChickens) {
            if (chicken.canBeCaught(this.hero)) {
                showPrompt = true;
                actionText = 'CATCH CHICKEN';
                break;
            }
        }

        // Check for tools
        if (!showPrompt && !this.hero.currentTool) {
            const availableTools = this.toolManager.checkPickups(this.hero);
            if (availableTools.length > 0) {
                showPrompt = true;
                actionText = 'PICK UP TOOL';
            }
        }

        // Check for droppable tool
        if (!showPrompt && this.hero.currentTool) {
            showPrompt = true;
            actionText = 'DROP TOOL';
        }

        // Check for egg collection in coop
        if (!showPrompt) {
            const fenceResult = this.coop.pushOutside(this.hero.x, this.hero.y, this.hero.radius, this.hero);
            if (fenceResult.inCoop || fenceResult.inGap) {
                const eggBasket = this.hero.getTool('eggBasket');
                if (eggBasket && eggBasket.canCollect()) {
                    const chickens = this.chickenManager.getChickensWithEggs();
                    for (const chicken of chickens) {
                        const dist = Math.hypot(chicken.x - this.hero.x, chicken.y - this.hero.y);
                        if (dist < 50) {
                            showPrompt = true;
                            actionText = 'COLLECT EGG';
                            break;
                        }
                    }
                }
            }
        }

        if (showPrompt) {
            prompt.classList.remove('hidden');
            prompt.querySelector('.action').textContent = actionText;
        } else {
            prompt.classList.add('hidden');
        }
    }
    
    checkWinLose() {
        // Win condition: 100 eggs collected
        if (this.eggsCollected >= this.eggsToWin) {
            this.gameWin();
            return;
        }
        
        // Lose condition: all chickens escaped
        const remainingChickens = this.coop.chickens.length;
        if (remainingChickens === 0 && this.escapedChickens >= this.maxChickens) {
            this.gameOver();
        }
    }
    
    updateRaccoons(deltaTime) {
        // Spawn new raccoon
        if (this.raccoonSpawner.update(deltaTime, this.raccoons)) {
            this.raccoons.push(this.raccoonSpawner.spawnRaccoon(this.fenceHoleManager, this.particles));
        }
        
        // Update raccoons
        this.raccoons = this.raccoons.filter(raccoon => {
            raccoon.update(deltaTime, this.particles);
            
            // Check if hero intercepted raccoon
            if (raccoon.state === 'moving' && 
                Collision.circleCircle(this.hero.getBounds(), raccoon.getBounds())) {
                raccoon.intercept(this.particles);
                this.addBonusText(raccoon.x, raccoon.y, '+50');
                
                setTimeout(() => {
                    this.raccoons = this.raccoons.filter(r => r !== raccoon);
                }, 1000);
                return true;
            }
            
            // Check if raccoon reached coop
            if (raccoon.state === 'moving' && raccoon.checkReachedTarget()) {
                // Spook the coop!
                this.coop.spook();
                this.addBonusText(this.coop.x, this.coop.y, 'SPOOKED!');
                this.particles.spawn(this.coop.x, this.coop.y, 'escape', 15);
                return false;
            }
            
            // Remove if escaped
            if (raccoon.state === 'fleeing' && 
                Collision.outsideBounds(raccoon.getBounds(), { left: -50, right: 850, top: -50, bottom: 650 })) {
                return false;
            }
            
            return true;
        });
    }
    
    addBonusText(x, y, text) {
        this.bonusTexts.push({ x, y, text, life: 1.0 });
    }
    
    draw() {
        this.renderer.clear();
        
        // Draw spawn warning
        if (this.state === 'playing' && this.raccoonSpawner.warningActive) {
            this.drawSpawnWarning();
        }
        
        // Draw tools at house
        this.toolManager.draw(this.ctx);
        
        // Draw fence holes
        this.fenceHoleManager.draw(this.ctx);
        
        // Draw coop and typed chickens
        this.coop.draw(this.ctx);
        if (this.chickenManager) {
            this.chickenManager.draw(this.ctx);
        }
        
        // Draw raccoons
        this.raccoons.forEach(r => r.draw(this.ctx));
        
        // Draw hero
        this.hero.draw(this.ctx);
        
        // Draw deposit hint
        if (this.state === 'playing') {
            this.coop.drawDepositHint(this.ctx, this.hero);
        }
        
        // Draw particles
        this.particles.draw(this.ctx);
        
        // Draw bonus texts
        this.drawBonusTexts();
    }
    
    drawSpawnWarning() {
        const progress = this.raccoonSpawner.getWarningProgress();
        const alpha = 0.3 + progress * 0.5;
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        
        const positions = [
            {x: 400, y: 20},
            {x: 790, y: 300},
            {x: 10, y: 300}
        ];
        
        this.ctx.save();
        positions.forEach(pos => {
            this.ctx.globalAlpha = alpha * pulse;
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            
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
            this.ctx.fillStyle = text.text.includes('SPOOKED') ? '#ff4444' : 
                                text.text.includes('EGGS') ? '#ffd700' : '#ffffff';
            this.ctx.font = 'bold 18px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#000000';
            this.ctx.fillText(text.text, text.x, text.y);
        });
        this.ctx.restore();
    }
    
    updateUI() {
        // Update score display
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = `🥚 ${this.eggsCollected}/${this.eggsToWin}`;
        }

        // Update chicken count using chickenManager
        const inCoop = this.chickenManager ? this.chickenManager.getInCoopCount() : 0;
        const livesEl = document.getElementById('lives');
        if (livesEl) {
            if (this.escapedChickens > 0) {
                livesEl.textContent = `🐔 ${inCoop}/${this.maxChickens} 💨${this.escapedChickens}`;
                livesEl.style.color = this.escapedChickens > 6 ? '#f44336' : '#ff9800';
            } else {
                livesEl.textContent = `🐔 ${inCoop}/${this.maxChickens}`;
                livesEl.style.color = '#ffffff';
            }
        }

        // Update time
        const timeEl = document.getElementById('time');
        if (timeEl) {
            timeEl.textContent = this.formatTime(this.gameTime);
        }

        // Update bag display (tool carrying)
        const bagDisplay = document.getElementById('bagDisplay');
        if (bagDisplay) {
            let slotText = '';

            // Show current tool
            if (this.hero.currentTool) {
                const tool = this.hero.currentTool;
                if (tool.type === 'eggBasket') {
                    slotText = `🧺 ${tool.eggs}/${tool.maxEggs}`;
                } else if (tool.type === 'foodBasket') {
                    slotText = `🌾 ${tool.usesRemaining}/${tool.maxUses}`;
                } else if (tool.type === 'hammer') {
                    slotText = `🔨 ${tool.usesRemaining}/${tool.maxUses}`;
                }
            } else {
                slotText = '○ (empty)';
            }

            bagDisplay.textContent = slotText;
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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

// Start game
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
