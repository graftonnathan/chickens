import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        files: ['*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                HTMLCanvasElement: 'readonly',
                localStorage: 'readonly',
                performance: 'readonly',
                Date: 'readonly',

                // Node.js conditional export guard
                module: 'readonly',
                require: 'readonly',

                // Game globals (loaded via script tags)
                Collision: 'readonly',
                DepthManager: 'readonly',
                InputHandler: 'readonly',
                Renderer: 'readonly',
                Particle: 'readonly',
                WizardSparkle: 'readonly',
                MagicBurst: 'readonly',
                MagicRune: 'readonly',
                PawPrint: 'readonly',
                StarBurst: 'readonly',
                WoodParticle: 'readonly',
                ParticleSystem: 'readonly',
                WizardAnimator: 'readonly',
                WIZARD_ANIMATIONS: 'readonly',
                IDLE_FRAMES: 'readonly',
                WALK_FRAMES: 'readonly',
                TURN_FRAMES: 'readonly',
                PICKUP_FRAMES: 'readonly',
                CARRY_FRAMES: 'readonly',
                DEPOSIT_FRAMES: 'readonly',
                STARTLED_FRAMES: 'readonly',
                VICTORY_FRAMES: 'readonly',
                HAMMER_FRAMES: 'readonly',
                defaultLimb: 'readonly',
                Chicken: 'readonly',
                CHICKEN_TYPE_TEMPLATES: 'readonly',
                CHICKEN_TYPES: 'readonly',
                TypedChicken: 'readonly',
                ChickenManager: 'readonly',
                Coop: 'readonly',
                Hero: 'readonly',
                Raccoon: 'readonly',
                RaccoonSpawner: 'readonly',
                Spawner: 'readonly',
                FenceHole: 'readonly',
                FenceHoleManager: 'readonly',
                Tool: 'readonly',
                ToolManager: 'readonly',
                Egg: 'readonly',
                EggManager: 'readonly',
                BasketItem: 'readonly',
                HouseDepositZone: 'readonly',
                FoodBasketItem: 'readonly',
                HammerItem: 'readonly',
                Game: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'no-var': 'off',           // We use var for conditional requires
            'prefer-const': 'warn',
            'eqeqeq': ['error', 'always'],
            'no-implicit-globals': 'off' // All our classes are intentional globals
        }
    },
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Vitest globals
                vi: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly'
            }
        }
    },
    {
        files: ['vitest.config.js', 'playwright.config.js', 'eslint.config.js'],
        languageOptions: {
            sourceType: 'module'
        }
    }
];
