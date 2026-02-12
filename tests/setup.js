/**
 * Global test setup — runs before every test file.
 * Sets up minimal DOM elements that game classes expect.
 */
import { vi } from 'vitest';

// Create DOM elements that Game constructor expects
function setupDOM() {
    document.body.innerHTML = `
        <div class="game-container">
            <div id="chickenCards" class="chicken-cards-container"></div>
            <canvas id="gameCanvas" width="800" height="600"></canvas>
            <span id="score">0/50</span>
            <span id="bagDisplay">○○</span>
            <span id="lives">3</span>
            <span id="time">0:00</span>
            <div id="spellBar" class="spell-bar">
                <div class="spell-slot" data-slot="0"><span class="spell-cooldown"></span></div>
                <div class="spell-slot" data-slot="1"><span class="spell-cooldown"></span></div>
                <div class="spell-slot" data-slot="2"><span class="spell-cooldown"></span></div>
            </div>
            <div id="interactionPrompt" class="interaction-prompt hidden">
                <span class="action">INTERACT</span>
            </div>
            <div id="startScreen" class="overlay"><button id="startBtn"></button></div>
            <div id="gameOverScreen" class="overlay hidden">
                <span id="finalScore">0</span>
                <span id="highScore">0</span>
                <span id="finalTime">0:00</span>
                <button id="restartBtn"></button>
            </div>
        </div>
    `;
}

// Stub canvas getContext since jsdom does not implement Canvas 2D natively
const mockCtx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    rect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(800 * 600 * 4) })),
    putImageData: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    shadowColor: 'rgba(0,0,0,0)',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    lineCap: 'butt',
    lineJoin: 'miter'
};

// Override HTMLCanvasElement.prototype.getContext so any <canvas> returns our mock
HTMLCanvasElement.prototype.getContext = vi.fn(function () {
    mockCtx.canvas = this;
    return mockCtx;
});

// Stub requestAnimationFrame (game loop uses it)
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Run DOM setup
setupDOM();
