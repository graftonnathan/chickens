/**
 * ChickenManager - Spawns and manages all 12 unique chicken types
 */
class ChickenManager {
    constructor(coop) {
        this.coop = coop;
        this.types = Object.keys(CHICKEN_TYPES);
        this.chickens = [];
    }
    
    spawnChickens() {
        this.chickens = [];
        
        // Spawn all 12 types in a circle around coop center
        this.types.forEach((type, index) => {
            const angle = (index / 12) * Math.PI * 2;
            const dist = 15 + Math.random() * 15;
            
            const x = this.coop.x + Math.cos(angle) * dist;
            const y = this.coop.y + Math.sin(angle) * dist;
            
            const chicken = new TypedChicken(index, x, y, type);
            this.chickens.push(chicken);
        });
        
        return this.chickens;
    }
    
    getChickenByType(type) {
        return this.chickens.find(c => c.type === type);
    }
    
    getSpecialChicken() {
        return this.getChickenByType('rainbow');
    }
    
    getAllChickens() {
        return this.chickens;
    }
    
    getInCoopCount() {
        return this.chickens.filter(c => c.inCoop).length;
    }
    
    getEscapedCount() {
        return this.chickens.filter(c => !c.inCoop && c.y > 550).length;
    }
    
    update(deltaTime, coop, gameTime) {
        const escaped = [];
        
        this.chickens.forEach(chicken => {
            const result = chicken.update(deltaTime, coop, gameTime);
            if (result === 'escaped') {
                escaped.push(chicken);
            }
        });
        
        return escaped;
    }
    
    draw(ctx) {
        this.chickens.forEach(chicken => chicken.draw(ctx));
    }
    
    getChickensWithEggs() {
        return this.chickens.filter(c => c.inCoop && c.hasEgg);
    }
    
    getHungryChickens() {
        return this.chickens.filter(c => c.inCoop && c.hunger < 50);
    }
    
    // For Tank chicken blocking
    getTankChickens() {
        return this.chickens.filter(c => c.type === 'tank' && c.inCoop);
    }
    
    reset() {
        this.spawnChickens();
    }
}
