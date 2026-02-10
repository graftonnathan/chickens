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

        this.hero = new Hero(400, 500); // Start near house
        this.coop = new Coop(400, 80);

        // Spawn wild chickens in the field (not in coop)
        this.wildChickens = this.spawnWildChickens();

        this.raccoons = [];
        this.raccoonSpawner.reset();
        this.particles = new ParticleSystem();

        this.fenceHoleManager.reset();
        this.toolManager.reset();

        this.updateUI();
        this.hideOverlays();
    }

    spawnWildChickens() {
        const chickens = [];
        const types = Object.keys(CHICKEN_TYPE_TEMPLATES);

        for (let i = 0; i < this.maxChickens; i++) {
            // Spawn chickens in the field (between house and coop)
            const x = 100 + Math.random() * 600;
            const y = 250 + Math.random() * 200;

            const chicken = new Chicken(i, x, y, types[i % types.length]);
            chickens.push(chicken);
        }

        return chickens;
    }

    checkProximityInteractions() {
        const hero = this.hero;

        // 1. Auto-pickup wild chickens
        if (!hero.carrying.isCarrying) {
            for (const chicken of this.wildChickens) {
                if (chicken.state === 'wild') {
                    const dist = Math.hypot(chicken.x - hero.x, chicken.y - hero.y);
                    if (dist < hero.ranges.pickupRadius) {
                        const pickedUp = hero.pickUpChicken(chicken);
                        if (pickedUp) {
                            this.addBonusText(chicken.x, chicken.y - 30, '+PICKED UP');
                            this.particles.spawn(chicken.x, chicken.y, 'sparkle', 8);
                            // Remove from wild chickens
                            const idx = this.wildChickens.indexOf(chicken);
                            if (idx > -1) this.wildChickens.splice(idx, 1);
                        }
                        break; // Only pick up one at a time
                    }
                }
            }
        }

        // 2. Auto-deposit to coop
        if (hero.carrying.isCarrying && hero.carrying.chicken) {
            const distToCoop = Math.hypot(hero.x - this.coop.x, hero.y - this.coop.y);
            if (distToCoop < hero.ranges.depositRadius && this.coop.chickens.length < this.coop.maxChickens) {
                const chicken = hero.carrying.chicken;  // Cache before deposit clears it
                const deposited = hero.depositChicken(this.coop);
                if (deposited && chicken) {  // Use cached reference with null guard
                    this.addBonusText(chicken.x, chicken.y - 30, '+DEPOSITED');
                    this.particles.spawn(chicken.x, chicken.y, 'poof', 10);
                }
            }
        }
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

        // Update wild chickens (wandering)
        this.wildChickens.forEach(chicken => chicken.update(deltaTime, null, this.gameTime));

        // Update coop chickens (with lifecycle)
        const escapedChickens = this.coop.update(deltaTime, this.gameTime);
        if (escapedChickens.length > 0) {
            this.escapedChickens += escapedChickens.length;
            // Add escaped chickens back to wild list
            escapedChickens.forEach(chicken => {
                this.wildChickens.push(chicken);
                this.particles.spawn(chicken.x, chicken.y, 'escape', 10);
            });
        }

        // Automatic proximity interactions (pickup/deposit)
        this.checkProximityInteractions();

        // Update tools
        this.toolManager.update(deltaTime);

        // Tool pickup (manual with E)
        if (this.input.isInteractPressed()) {
            if (!this.hero.currentTool) {
                const availableTools = this.toolManager.checkPickups(this.hero);
                for (const tool of availableTools) {
                    if (this.hero.pickUpTool(tool)) {
                        const toolName = tool.type === 'eggBasket' ? '🧺 BASKET' :
                                        tool.type === 'hammer' ? '🔨 HAMMER' : '🌾 FOOD';
                        this.addBonusText(this.hero.x, this.hero.y - 30, `+${toolName}`);
                        break;
                    }
                }
            } else {
                // Drop tool
                const tool = this.hero.dropTool();
                if (tool) {
                    tool.x = this.hero.x;
                    tool.y = this.hero.y;
                    this.addBonusText(this.hero.x, this.hero.y - 30, 'DROPPED');
                }
            }
        }

        // E key interactions inside coop
        if (this.input.isInteractPressed()) {
            const eggBasket = this.hero.getTool('eggBasket');
            const foodBasket = this.hero.getTool('foodBasket');

            // Egg collection - find nearby chickens with eggs
            if (eggBasket && eggBasket.canCollect()) {
                let collected = 0;

                for (const chicken of this.coop.chickens) {
                    if (chicken.hasEgg) {
                        const dist = Math.hypot(chicken.x - this.hero.x, chicken.y - this.hero.y);
                        if (dist < 50 && eggBasket.canCollect()) {
                            const result = chicken.collectEgg();
                            if (result) {
                                eggBasket.collectEgg();
                                collected++;
                                this.particles.spawn(chicken.x, chicken.y, 'sparkle', 5);
                            }
                        }
                    }
                }

                if (collected > 0) {
                    this.addBonusText(this.hero.x, this.hero.y - 30, `+${collected} 🥚`);
                }
            }

            // Feeding - find nearby hungry chickens
            if (foodBasket && foodBasket.usesRemaining > 0) {
                let fed = 0;

                for (const chicken of this.coop.chickens) {
                    if (chicken.hunger < 80) {
                        const dist = Math.hypot(chicken.x - this.hero.x, chicken.y - this.hero.y);
                        if (dist < 50 && foodBasket.usesRemaining > 0) {
                            chicken.feed();
                            foodBasket.use();
                            fed++;
                            this.addBonusText(chicken.x, chicken.y - 40, '❤');
                            this.particles.spawn(chicken.x, chicken.y, 'heart', 3);
                        }
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
        if (!container) return;

        // Clear existing cards
        container.innerHTML = '';

        // Combine coop and wild chickens for display
        const allChickens = [...this.coop.chickens, ...this.wildChickens];

        // Create card for each chicken
        allChickens.forEach((chicken, index) => {
            const card = document.createElement('div');
            card.className = 'chicken-card';

            // Add state classes
            if (chicken.state === 'wild') card.classList.add('state-wild');
            if (chicken.state === 'escaping') card.classList.add('escaping');
            if (chicken.state === 'egg_waiting') card.classList.add('state-egg');

            // Type icon
            const typeIcon = chicken.attributes ? chicken.attributes.icon : '🐔';
            const typeLabel = chicken.attributes ? chicken.attributes.label : 'Common';

            // Hunger hearts
            const hearts = Math.ceil(chicken.hunger / 20);
            const hungerDisplay = '❤'.repeat(hearts) + '○'.repeat(5 - hearts);

            // Residency timer (if in coop building up time)
            let residencyHtml = '';
            if (chicken.state === 'in_coop' && chicken.coopResidency.entryTime) {
                const now = this.gameTime || Date.now() / 1000;
                const elapsed = now - chicken.coopResidency.entryTime;
                const required = chicken.attributes.minCoopTime;
                const percent = Math.min(100, (elapsed / required) * 100);
                residencyHtml = `<div class="chicken-card-progress"><div class="fill" style="width: ${percent}%"></div></div>`;
            }

            // Escape timer bar
            let timerHtml = '';
            if (chicken.state === 'egg_waiting' && chicken.escapeTimerStart) {
                const now = Date.now() / 1000;
                const elapsed = now - chicken.escapeTimerStart;
                const remaining = Math.max(0, chicken.attributes.escapeTimer - elapsed);
                const percent = (remaining / chicken.attributes.escapeTimer) * 100;
                const timerClass = percent > 50 ? 'safe' : percent > 25 ? 'warning' : 'danger';
                timerHtml = `<div class="chicken-card-timer"><div class="fill ${timerClass}" style="width: ${percent}%"></div></div>`;
            }

            // Status icon
            const stateIcons = {
                'wild': '🌿',
                'carried': '👋',
                'in_coop': '🏠',
                'eligible_to_lay': '⏳',
                'laying': '🥚',
                'egg_waiting': '⚠️',
                'escaping': '🏃'
            };
            const statusIcon = stateIcons[chicken.state] || '●';

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
                ${residencyHtml}
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

        // Check for tools
        if (!this.hero.currentTool) {
            const availableTools = this.toolManager.checkPickups(this.hero);
            if (availableTools.length > 0) {
                showPrompt = true;
                actionText = 'PICK UP TOOL';
            }
        } else {
            // Can drop tool
            showPrompt = true;
            actionText = 'DROP TOOL';
        }

        // Check for egg collection in coop
        if (!showPrompt) {
            const fenceResult = this.coop.pushOutside(this.hero.x, this.hero.y, this.hero.radius, this.hero);
            if (fenceResult.inCoop || fenceResult.inGap) {
                const eggBasket = this.hero.getTool('eggBasket');
                if (eggBasket && eggBasket.canCollect()) {
                    for (const chicken of this.coop.chickens) {
                        if (chicken.hasEgg) {
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

        // Lose condition: all chickens have escaped from coop
        const chickensInCoop = this.coop.chickens.length;
        if (chickensInCoop === 0 && this.wildChickens.length === this.maxChickens) {
            // All chickens are wild (escaped from coop at some point)
            // Check if they've all escaped to the house
            // For now, just check if coop is empty and all are wild
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

        // Draw coop
        this.coop.draw(this.ctx);

        // Draw coop chickens
        this.coop.chickens.forEach(chicken => chicken.draw(this.ctx));

        // Draw wild chickens
        if (this.wildChickens) {
            this.wildChickens.forEach(chicken => chicken.draw(this.ctx));
        }

        // Draw raccoons
        this.raccoons.forEach(r => r.draw(this.ctx));

        // Draw hero
        this.hero.draw(this.ctx);

        // Draw proximity hints
        this.drawProximityHints();

        // Draw deposit hint
        if (this.state === 'playing') {
            this.coop.drawDepositHint(this.ctx, this.hero);
        }

        // Draw particles
        this.particles.draw(this.ctx);

        // Draw bonus texts
        this.drawBonusTexts();
    }

    drawProximityHints() {
        if (this.state !== 'playing') return;

        const hero = this.hero;

        // Pickup hint - when near wild chicken and not carrying
        if (!hero.carrying.isCarrying) {
            for (const chicken of this.wildChickens) {
                if (chicken.state === 'wild') {
                    const dist = Math.hypot(chicken.x - hero.x, chicken.y - hero.y);
                    if (dist < hero.ranges.pickupRadius) {
                        // Draw proximity ring
                        this.ctx.save();
                        this.ctx.strokeStyle = '#3498db';
                        this.ctx.lineWidth = 2;
                        this.ctx.setLineDash([5, 5]);
                        this.ctx.beginPath();
                        this.ctx.arc(chicken.x, chicken.y, 25, 0, Math.PI * 2);
                        this.ctx.stroke();

                        // Draw hint text
                        this.ctx.fillStyle = '#3498db';
                        this.ctx.font = 'bold 10px sans-serif';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('PICK UP', chicken.x, chicken.y - 30);
                        this.ctx.restore();
                        break;
                    }
                }
            }
        }

        // Deposit hint - when carrying and near coop
        if (hero.carrying.isCarrying) {
            const distToCoop = Math.hypot(hero.x - this.coop.x, hero.y - this.coop.y);
            if (distToCoop < hero.ranges.depositRadius) {
                this.ctx.save();
                this.ctx.strokeStyle = '#2ecc71';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(this.coop.x, this.coop.y, this.coop.fenceRadius + 10, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.fillStyle = '#2ecc71';
                this.ctx.font = 'bold 12px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('DEPOSIT', this.coop.x, this.coop.y - this.coop.fenceRadius - 15);
                this.ctx.restore();
            }
        }
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

        // Update chicken count
        const inCoop = this.coop ? this.coop.chickens.length : 0;
        const wildCount = this.wildChickens ? this.wildChickens.length : 0;
        const livesEl = document.getElementById('lives');
        if (livesEl) {
            livesEl.textContent = `🐔 ${inCoop} coop / ${wildCount} wild`;
            livesEl.style.color = '#ffffff';
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
