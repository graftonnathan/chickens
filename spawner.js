/**
 * Spawner - Controls chicken spawning
 */
class Spawner {
    constructor(coop) {
        this.coop = coop;
        this.spawnTimer = 0;
        this.spawnRate = 2000; // ms between spawns initially
        this.initialSpawnRate = 2000;
        this.minSpawnRate = 500;
        this.difficultyTimer = 0;
        this.difficultyInterval = 30000; // Increase difficulty every 30 seconds
        this.maxChickens = 15;
    }

    update(deltaTime, chickens) {
        this.spawnTimer += deltaTime * 1000;
        this.difficultyTimer += deltaTime * 1000;
        
        // Spawn chicken if timer ready and under max
        if (this.spawnTimer >= this.spawnRate && chickens.length < this.maxChickens) {
            this.spawnTimer = 0;
            return true;
        }
        
        // Increase difficulty
        if (this.difficultyTimer >= this.difficultyInterval) {
            this.difficultyTimer = 0;
            this.increaseDifficulty();
        }
        
        return false;
    }

    increaseDifficulty() {
        // Decrease spawn rate (faster spawns)
        this.spawnRate = Math.max(this.minSpawnRate, this.spawnRate * 0.9);
        
        // Increase max chickens
        this.maxChickens = Math.min(25, this.maxChickens + 2);
        
        console.log(`Difficulty increased! Spawn rate: ${this.spawnRate.toFixed(0)}ms, Max chickens: ${this.maxChickens}`);
    }

    spawnChicken() {
        const pos = this.coop.getSpawnPosition();
        return new Chicken(pos.x, pos.y);
    }

    reset() {
        this.spawnTimer = 0;
        this.spawnRate = this.initialSpawnRate;
        this.difficultyTimer = 0;
        this.maxChickens = 15;
    }
}
