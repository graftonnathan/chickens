/**
 * Creates a mock Canvas 2D rendering context with all standard methods stubbed.
 * Every method is a no-op vi.fn() so tests can assert calls without real rendering.
 */
function createMockCanvas(width = 800, height = 600) {
    const gradientMock = {
        addColorStop: vi.fn()
    };

    const patternMock = {};

    const ctx = {
        // State
        save: vi.fn(),
        restore: vi.fn(),

        // Transform
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        transform: vi.fn(),

        // Compositing
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',

        // Drawing styles
        fillStyle: '#000',
        strokeStyle: '#000',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        shadowColor: 'rgba(0,0,0,0)',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',

        // Rectangles
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        clearRect: vi.fn(),

        // Paths
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
        roundRect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),

        // Text
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),

        // Gradients / Patterns
        createLinearGradient: vi.fn(() => gradientMock),
        createRadialGradient: vi.fn(() => gradientMock),
        createPattern: vi.fn(() => patternMock),

        // Pixel manipulation
        getImageData: vi.fn(() => ({
            data: new Uint8ClampedArray(width * height * 4)
        })),
        putImageData: vi.fn(),
        createImageData: vi.fn(),

        // Drawing images
        drawImage: vi.fn(),

        // Canvas reference
        canvas: {
            width,
            height,
            getContext: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({
                top: 0, left: 0, width, height, right: width, bottom: height
            }))
        }
    };

    // Make canvas.getContext return itself
    ctx.canvas.getContext = vi.fn(() => ctx);

    return { canvas: ctx.canvas, ctx };
}

module.exports = { createMockCanvas };
