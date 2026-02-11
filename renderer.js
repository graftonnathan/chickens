/**
 * Renderer - Handles all Canvas 2D drawing for enclosed backyard
 * Coop on ground, N/E/W fences, house roof on south
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear() {
        // Draw sky
        this.drawSky();
        
        // Draw N/E/W fences
        this.drawNorthFence();
        this.drawEastFence();
        this.drawWestFence();
        
        // Draw lawn
        this.drawLawn();
        
        // Draw house siding below roof (visible portion)
        this.drawHouseSiding();
        
        // Draw backyard props scattered around
        this.drawProps();
    }

    clearWithRoof() {
        // Original clear for compatibility - draws everything including roof
        this.clear();
        this.drawHouseRoof();
    }

    drawSky() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#B0E0E6');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, 200);
        
        // Draw some clouds
        this.drawCloud(150, 50, 35);
        this.drawCloud(550, 40, 40);
        this.drawCloud(350, 70, 30);
    }
    
    drawCloud(x, y, size) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.9, 0, Math.PI * 2);
        this.ctx.arc(x - size * 0.8, y, size * 0.9, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.5, size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawNorthFence() {
        // North fence - horizontal at top
        const fenceY = 40;
        const fenceHeight = 40;
        const picketWidth = 8;
        const picketGap = 4;
        
        this.ctx.fillStyle = '#ffffff';
        
        // Horizontal rails
        this.ctx.fillRect(0, fenceY + 10, this.width, 6);
        this.ctx.fillRect(0, fenceY + 25, this.width, 6);
        
        // Vertical pickets with pointed tops
        for (let px = 0; px < this.width; px += picketWidth + picketGap) {
            // Picket body
            this.ctx.fillRect(px, fenceY, picketWidth, fenceHeight);
            
            // Pointed top
            this.ctx.beginPath();
            this.ctx.moveTo(px, fenceY);
            this.ctx.lineTo(px + picketWidth / 2, fenceY - 8);
            this.ctx.lineTo(px + picketWidth, fenceY);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Shadow/outline
            this.ctx.strokeStyle = '#e0e0e0';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(px, fenceY, picketWidth, fenceHeight);
        }
        
        // Shadow on south side
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(0, fenceY + fenceHeight, this.width, 5);
    }

    drawEastFence() {
        // East fence - vertical on right side
        const fenceX = 780; // was 760 - adjusted for slimmer fence
        const fenceY = 40;
        const fenceHeight = 520; // From top fence to house
        const fenceWidth = 20; // was 40 - SLIMMED
        const picketWidth = 5; // was 8
        const picketGap = 3;   // was 4

        this.ctx.fillStyle = '#ffffff';

        // Vertical rails - closer together
        this.ctx.fillRect(fenceX + 4, fenceY, 4, fenceHeight);   // was +10, 6
        this.ctx.fillRect(fenceX + 13, fenceY, 4, fenceHeight);  // was +25, 6

        // Horizontal pickets
        for (let py = fenceY; py < fenceY + fenceHeight; py += picketWidth + picketGap) {
            this.ctx.fillRect(fenceX, py, fenceWidth, picketWidth);

            // Pointed top (pointing right - outward) - scaled proportionally
            this.ctx.beginPath();
            this.ctx.moveTo(fenceX + fenceWidth, py);
            this.ctx.lineTo(fenceX + fenceWidth + 5, py + picketWidth / 2); // was +8
            this.ctx.lineTo(fenceX + fenceWidth, py + picketWidth);
            this.ctx.closePath();
            this.ctx.fill();

            // Outline
            this.ctx.strokeStyle = '#e0e0e0';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(fenceX, py, fenceWidth, picketWidth);
        }

        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(fenceX - 3, fenceY, 3, fenceHeight);
    }

    drawWestFence() {
        // West fence - vertical on left side
        const fenceX = 0;
        const fenceY = 40;
        const fenceHeight = 520;
        const fenceWidth = 20; // was 40 - SLIMMED
        const picketWidth = 5; // was 8
        const picketGap = 3;   // was 4

        this.ctx.fillStyle = '#ffffff';

        // Vertical rails - closer together
        this.ctx.fillRect(fenceX + 3, fenceY, 4, fenceHeight);   // was +10, 6
        this.ctx.fillRect(fenceX + 12, fenceY, 4, fenceHeight);  // was +25, 6

        // Horizontal pickets
        for (let py = fenceY; py < fenceY + fenceHeight; py += picketWidth + picketGap) {
            this.ctx.fillRect(fenceX, py, fenceWidth, picketWidth);

            // Pointed top (pointing left - outward) - scaled proportionally
            this.ctx.beginPath();
            this.ctx.moveTo(fenceX, py);
            this.ctx.lineTo(fenceX - 5, py + picketWidth / 2); // was -8
            this.ctx.lineTo(fenceX, py + picketWidth);
            this.ctx.closePath();
            this.ctx.fill();

            // Outline
            this.ctx.strokeStyle = '#e0e0e0';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(fenceX, py, fenceWidth, picketWidth);
        }

        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(fenceX + fenceWidth, fenceY, 3, fenceHeight);
    }

    drawLawn() {
        // Base lawn color - expanded for slimmer fences (20px instead of 40px)
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(20, 80, 760, 420);  // was 40, 720 - now 20, 760

        // Vertical mowing stripes
        this.ctx.save();
        this.ctx.globalAlpha = 0.15;
        for (let x = 20; x < 780; x += 50) {  // was 40, 760
            this.ctx.fillStyle = (x / 50) % 2 === 0 ? '#388E3C' : '#66BB6A';
            this.ctx.fillRect(x, 80, 50, 420);
        }
        this.ctx.restore();

        // Add some random grass variation
        for (let i = 0; i < 100; i++) {
            const x = 20 + Math.random() * 760;  // was 40, 720
            const y = 80 + Math.random() * 420;
            this.ctx.fillStyle = Math.random() > 0.5 ? '#43A047' : '#66BB6A';
            this.ctx.fillRect(x, y, 2, 2);
        }
    }

    drawHouseSiding() {
        // House siding below roof (extends off-screen)
        const sidingColor = '#f5f5f5';
        const sidingLines = '#e0e0e0';

        this.ctx.fillStyle = sidingColor;
        this.ctx.fillRect(0, 600, 800, 100);

        // Siding lines
        this.ctx.strokeStyle = sidingLines;
        this.ctx.lineWidth = 1;
        for (let y = 610; y < 700; y += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(800, y);
            this.ctx.stroke();
        }
    }

    drawHouseRoof() {
        // House roof - triangle peak on south wall
        const roofColor = '#8b4513';
        const roofDark = '#5d4037';

        // Roof triangle
        this.ctx.fillStyle = roofColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 600);
        this.ctx.lineTo(400, 500);
        this.ctx.lineTo(800, 600);
        this.ctx.closePath();
        this.ctx.fill();

        // Roof outline
        this.ctx.strokeStyle = roofDark;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Roof shingles texture
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const y = 500 + i * 16;
            const leftX = (i * 16) * (400 / 100);
            const rightX = 800 - (i * 16) * (400 / 100);
            this.ctx.beginPath();
            this.ctx.moveTo(leftX, y);
            this.ctx.lineTo(rightX, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw roof overlay for Y-sorted rendering
     * Only draws roof portions above the given Y threshold at the given X
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position to draw roof at
     * @param {number} yThreshold - Only draw roof above this Y
     */
    drawRoofOverlayAtX(ctx, x, yThreshold) {
        const roofPeakX = 400;
        const roofPeakY = 500;
        const roofBaseY = 600;
        const roofSlope = 0.25;

        // Calculate roof Y at this X
        const roofY = roofPeakY + Math.abs(x - roofPeakX) * roofSlope;

        // If entity is below the roof line, don't draw roof here
        if (yThreshold >= roofY) return;

        // Draw only the roof portion above the entity
        const roofColor = '#8b4513';
        const roofDark = '#5d4037';

        ctx.save();

        // Create clipping region for the roof above the threshold
        ctx.beginPath();
        // Start from left edge at roof base
        ctx.moveTo(Math.max(0, x - 50), roofBaseY);
        // Go up the left slope to peak
        ctx.lineTo(roofPeakX, roofPeakY);
        // Down the right slope to base
        ctx.lineTo(Math.min(800, x + 50), roofBaseY);
        ctx.closePath();

        // Clip to only draw above yThreshold
        ctx.clip();

        // Fill the roof triangle
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(400, 500);
        ctx.lineTo(800, 600);
        ctx.closePath();
        ctx.fill();

        // Roof outline
        ctx.strokeStyle = roofDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Roof shingles
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const y = 500 + i * 16;
            const leftX = (i * 16) * 4;
            const rightX = 800 - leftX;
            ctx.beginPath();
            ctx.moveTo(leftX, y);
            ctx.lineTo(rightX, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Draw the complete roof overlay
     * Used when no entities are behind the roof
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawRoofOverlay(ctx) {
        this.drawHouseRoof();
    }

    drawProps() {
        // Garden gnome - placed in middle area
        this.drawGnome(150, 200);
        
        // Pink flamingo - middle right
        this.drawFlamingo(650, 250);
        
        // Grill - near house
        this.drawGrill(180, 480);
        
        // Flower pots - scattered
        this.drawFlowerPot(300, 150);
        this.drawFlowerPot(500, 180);
        
        // Tree - left side for shade
        this.drawTree(100, 150);
    }
    
    drawGnome(x, y) {
        // Body
        this.ctx.fillStyle = '#4169E1';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 12, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Head
        this.ctx.fillStyle = '#FFDBAC';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Hat (pointed red)
        this.ctx.fillStyle = '#DC143C';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 10, y - 18);
        this.ctx.lineTo(x, y - 35);
        this.ctx.lineTo(x + 10, y - 18);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Beard
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 6, y - 12);
        this.ctx.lineTo(x, y - 5);
        this.ctx.lineTo(x + 6, y - 12);
        this.ctx.fill();
        
        // Boots
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x - 8, y + 12, 6, 8);
        this.ctx.fillRect(x + 2, y + 12, 6, 8);
    }
    
    drawFlamingo(x, y) {
        // Legs
        this.ctx.strokeStyle = '#FF69B4';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y + 25);
        this.ctx.stroke();
        
        // Body
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - 10, 12, 8, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Neck
        this.ctx.beginPath();
        this.ctx.moveTo(x + 8, y - 12);
        this.ctx.quadraticCurveTo(x + 20, y - 20, x + 15, y - 32);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#FF69B4';
        this.ctx.stroke();
        
        // Head
        this.ctx.beginPath();
        this.ctx.arc(x + 15, y - 34, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Beak
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 19, y - 34);
        this.ctx.lineTo(x + 26, y - 32);
        this.ctx.lineTo(x + 19, y - 30);
        this.ctx.fill();
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(x + 20, y - 32, 1, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawGrill(x, y) {
        // Grill body
        this.ctx.fillStyle = '#2C2C2C';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 20, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Lid
        this.ctx.fillStyle = '#1C1C1C';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 18, Math.PI, 0);
        this.ctx.fill();
        
        // Legs
        this.ctx.strokeStyle = '#2C2C2C';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 15, y + 10);
        this.ctx.lineTo(x - 20, y + 25);
        this.ctx.moveTo(x + 15, y + 10);
        this.ctx.lineTo(x + 20, y + 25);
        this.ctx.stroke();
        
        // Handle
        this.ctx.strokeStyle = '#C0C0C0';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 5, y - 15);
        this.ctx.lineTo(x + 5, y - 15);
        this.ctx.stroke();
    }
    
    drawFlowerPot(x, y) {
        // Pot
        this.ctx.fillStyle = '#D2691E';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 10, y);
        this.ctx.lineTo(x + 10, y);
        this.ctx.lineTo(x + 8, y + 15);
        this.ctx.lineTo(x - 8, y + 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Flowers
        this.ctx.fillStyle = '#FF1493';
        this.ctx.beginPath();
        this.ctx.arc(x - 5, y - 5, 4, 0, Math.PI * 2);
        this.ctx.arc(x + 5, y - 3, 4, 0, Math.PI * 2);
        this.ctx.arc(x, y - 10, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Green stems/leaves
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 5, y);
        this.ctx.lineTo(x - 5, y - 5);
        this.ctx.moveTo(x + 5, y);
        this.ctx.lineTo(x + 5, y - 3);
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y - 10);
        this.ctx.stroke();
    }
    
    drawTree(x, y) {
        // Trunk
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 8, y, 16, 60);
        
        // Leaves (three layers)
        const greens = ['#228B22', '#2E7D32', '#1B5E20'];
        const sizes = [35, 28, 20];
        const offsets = [0, -15, -28];
        
        greens.forEach((green, i) => {
            this.ctx.fillStyle = green;
            this.ctx.beginPath();
            this.ctx.arc(x + offsets[i], y - 10, sizes[i], 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // Draw chicken carried by hero
    drawCarriedChicken(ctx, x, y, offsetIndex) {
        const offsetX = offsetIndex === 0 ? -12 : 12;
        const offsetY = -25;
        
        ctx.save();
        ctx.translate(x + offsetX, y + offsetY);
        ctx.scale(0.6, 0.6); // Smaller when carried
        
        // Body
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.beginPath();
        ctx.arc(8, -8, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(14, -8);
        ctx.lineTo(18, -6);
        ctx.lineTo(14, -4);
        ctx.fill();
        
        // Comb
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(8, -14, 4, Math.PI, 0);
        ctx.fill();
        
        ctx.restore();
    }
}
