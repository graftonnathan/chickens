import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hero } from '../../hero.js';
import { Chicken, CHICKEN_TYPE_TEMPLATES } from '../../chicken.js';
import { Coop } from '../../coop.js';
import { Collision } from '../../collision.js';
import { Egg, EggManager } from '../../egg.js';
import { BasketItem, HouseDepositZone } from '../../basket.js';

// Globals required by constructors
import { WizardAnimator } from '../../wizardAnimator.js';
import { WIZARD_ANIMATIONS } from '../../wizardAnimations.js';

beforeEach(() => {
    global.WizardAnimator = WizardAnimator;
    global.WIZARD_ANIMATIONS = WIZARD_ANIMATIONS;
    global.Collision = Collision;
    global.Chicken = Chicken;
    global.CHICKEN_TYPE_TEMPLATES = CHICKEN_TYPE_TEMPLATES;
});

describe('Hero–Coop Integration', () => {
    let hero;
    let coop;

    beforeEach(() => {
        hero = new Hero(400, 300);
        coop = new Coop(400, 80);
    });

    // Helper: free up N window slots by removing chickens from the coop
    function freeCoopSlots(coopObj, count) {
        for (let i = 0; i < count && coopObj.chickens.length > 0; i++) {
            const removed = coopObj.chickens.pop();
            coopObj.releaseWindowAssignment(removed.id);
        }
    }

    // ── Depositing chickens at the coop ──────────────────────────
    describe('depositing chickens at the coop', () => {
        it('hero deposits a wild chicken into coop via returnChicken', () => {
            // Free up a window so returnChicken can succeed
            freeCoopSlots(coop, 1);

            // Pick up a wild chicken
            const wildChicken = new Chicken(100, 200, 400, 'common');
            hero.pickUpChicken(wildChicken);

            expect(hero.isCarrying()).toBe(true);

            // Deposit into coop
            const result = hero.depositChicken(coop);
            expect(result).toBe(true);
            expect(hero.carrying.chickens).toHaveLength(0);
            expect(wildChicken.state).toBe('in_coop');
            expect(wildChicken.inCoop).toBe(true);
        });

        it('depositAllChickens deposits both carried chickens', () => {
            // Free 2 slots
            freeCoopSlots(coop, 2);

            const c1 = new Chicken(100, 200, 400, 'common');
            const c2 = new Chicken(101, 210, 400, 'fast');
            hero.pickUpChicken(c1);
            hero.pickUpChicken(c2);

            const count = hero.depositAllChickens(coop);

            expect(count).toBe(2);
            expect(hero.carrying.chickens).toHaveLength(0);
            expect(c1.inCoop).toBe(true);
            expect(c2.inCoop).toBe(true);
        });

        it('cannot deposit when not carrying any chickens', () => {
            expect(hero.depositChicken(coop)).toBe(false);
        });

        it('depositAllChickens returns 0 when carrying nothing', () => {
            expect(hero.depositAllChickens(coop)).toBe(0);
        });
    });

    // ── Score changes when depositing (coop chicken count) ───────
    describe('coop chicken count changes on deposit', () => {
        it('coop chicken array grows when depositing', () => {
            freeCoopSlots(coop, 1);
            const initialCount = coop.chickens.length;

            const wildChicken = new Chicken(200, 300, 400, 'common');
            hero.pickUpChicken(wildChicken);
            hero.depositChicken(coop);

            // returnChicken pushes to coop.chickens
            expect(coop.chickens.length).toBe(initialCount + 1);
        });

        it('coop tracks in-coop count correctly after deposit', () => {
            freeCoopSlots(coop, 1);

            const wildChicken = new Chicken(200, 300, 400, 'common');
            hero.pickUpChicken(wildChicken);
            hero.depositChicken(coop);

            const inCoopCount = coop.getInCoopCount();
            expect(inCoopCount).toBeGreaterThan(0);
        });

        it('deposited chicken gets a window assignment', () => {
            freeCoopSlots(coop, 1);

            const wildChicken = new Chicken(200, 300, 400, 'common');
            hero.pickUpChicken(wildChicken);
            hero.depositChicken(coop);

            // Chicken should have a window assignment
            expect(wildChicken.assignedWindow).toBeGreaterThanOrEqual(0);
        });
    });

    // ── Coop barrier collision ────────────────────────────────────
    describe('coop barrier collision', () => {
        it('coop has rectangular barrier bounds defined', () => {
            expect(coop.barrierLeft).toBeDefined();
            expect(coop.barrierRight).toBeDefined();
            expect(coop.barrierTop).toBeDefined();
            expect(coop.barrierBottom).toBeDefined();
        });

        it('hero position inside barrier bounds is detectable', () => {
            // Place hero inside the coop barrier area
            hero.x = coop.x;
            hero.y = coop.y + 20;

            const insideBarrier =
                hero.x > coop.barrierLeft &&
                hero.x < coop.barrierRight &&
                hero.y > coop.barrierTop &&
                hero.y < coop.barrierBottom;

            expect(insideBarrier).toBe(true);
        });

        it('hero position outside barrier bounds is not inside', () => {
            hero.x = 100;
            hero.y = 500;

            const insideBarrier =
                hero.x > coop.barrierLeft &&
                hero.x < coop.barrierRight &&
                hero.y > coop.barrierTop &&
                hero.y < coop.barrierBottom;

            expect(insideBarrier).toBe(false);
        });

        it('coop door opening has correct dimensions', () => {
            expect(coop.doorWidth).toBe(30);
            expect(coop.doorLeft).toBe(coop.x - 15);
            expect(coop.doorRight).toBe(coop.x + 15);
        });
    });

    // ── Deposit channel system ────────────────────────────────────
    describe('deposit channel system', () => {
        it('startDeposit initiates channel when carrying', () => {
            const wildChicken = new Chicken(200, 300, 400, 'common');
            hero.pickUpChicken(wildChicken);

            hero.startDeposit(coop);

            expect(hero.isDepositing).toBe(true);
            expect(hero.depositTarget).toBe(coop);
            expect(hero.depositTimer).toBe(0);
        });

        it('startDeposit does nothing when not carrying', () => {
            hero.startDeposit(coop);

            expect(hero.isDepositing).toBe(false);
        });

        it('deposit progress increases with time', () => {
            const wildChicken = new Chicken(200, 300, 400, 'common');
            hero.pickUpChicken(wildChicken);
            hero.startDeposit(coop);

            // Simulate partial time
            hero.depositTimer = 0.75;
            const progress = hero.getDepositProgress();

            expect(progress).toBe(0.5); // 0.75 / 1.5
        });

        it('deposit completes after depositDuration', () => {
            // Free a slot so the deposit succeeds
            freeCoopSlots(coop, 1);

            const wildChicken = new Chicken(200, 300, 400, 'common');
            hero.pickUpChicken(wildChicken);
            hero.startDeposit(coop);

            // Simulate time passing (hero not moving)
            hero.isMoving = false;
            const result = hero.updateDeposit(hero.depositDuration + 0.1);

            expect(result).not.toBeNull();
            expect(hero.carrying.chickens).toHaveLength(0);
        });

        it('deposit cancels when hero moves', () => {
            const wildChicken = new Chicken(200, 300, 400, 'common');
            hero.pickUpChicken(wildChicken);
            hero.startDeposit(coop);

            hero.isMoving = true;
            const result = hero.updateDeposit(0.5);

            expect(result).toBeNull();
            expect(hero.isDepositing).toBe(false);
        });

        it('isChanneling returns true during deposit', () => {
            const wildChicken = new Chicken(200, 300, 400, 'common');
            hero.pickUpChicken(wildChicken);
            hero.startDeposit(coop);

            expect(hero.isChanneling()).toBe(true);
        });
    });

    // ── Egg collection with basket ────────────────────────────────
    describe('egg collection', () => {
        it('egg detects collision with nearby hero', () => {
            const egg = new Egg(hero.x + 5, hero.y + 5);
            expect(egg.checkCollection(hero)).toBe(true);
        });

        it('egg does not detect collision when hero is far', () => {
            const egg = new Egg(hero.x + 200, hero.y + 200);
            expect(egg.checkCollection(hero)).toBe(false);
        });

        it('EggManager spawns eggs inside coop area', () => {
            const eggManager = new EggManager(coop);
            eggManager.spawnEgg();

            expect(eggManager.eggs).toHaveLength(1);
            // Egg should be near coop center
            const egg = eggManager.eggs[0];
            const distFromCoop = Math.hypot(egg.x - coop.x, egg.y - coop.y);
            expect(distFromCoop).toBeLessThanOrEqual(35);
        });

        it('EggManager respects maxEggs limit', () => {
            const eggManager = new EggManager(coop);

            // Spawn up to max
            for (let i = 0; i < 5; i++) {
                eggManager.spawnEgg();
            }

            // maxEggs is 3, but spawnEgg doesn't check limit (update does)
            // Direct spawn bypasses the limit check
            expect(eggManager.eggs.length).toBe(5);

            // Via update, it won't spawn beyond max
            const eggManager2 = new EggManager(coop);
            eggManager2.eggs = [new Egg(0, 0), new Egg(1, 1), new Egg(2, 2)];
            eggManager2.spawnTimer = eggManager2.spawnInterval + 1; // Force timer
            eggManager2.update(0.016);
            // Should not add a 4th egg since at max
            expect(eggManager2.eggs).toHaveLength(3);
        });

        it('chicken collectEgg resets state to in_coop', () => {
            const chicken = new Chicken(1, 100, 100, 'common');
            chicken.state = 'egg_waiting';
            chicken.hasEgg = true;
            chicken.escapeTimerStart = Date.now() / 1000;

            const result = chicken.collectEgg();

            expect(result).toBe(true);
            expect(chicken.hasEgg).toBe(false);
            expect(chicken.state).toBe('in_coop');
        });
    });

    // ── Hero coop entry/exit ──────────────────────────────────────
    describe('hero coop entry and exit', () => {
        it('enterCoop sets inCoop flag', () => {
            hero.enterCoop();
            expect(hero.inCoop).toBe(true);
        });

        it('exitCoop clears inCoop flag', () => {
            hero.enterCoop();
            hero.exitCoop();
            expect(hero.inCoop).toBe(false);
        });
    });
});
