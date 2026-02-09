/**
 * Renderer - Handles all Canvas 2D drawing for flipped residential backyard
 * Coop is now at NORTH, House at SOUTH
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
        
        // Draw coop at NORTH (top)
        // Coop is drawn separately in game.js
        
        // Draw lawn with VERTICAL mowing stripes (N-S flow)
        this.drawLawn();
        
        // Draw fence around coop area (semi-circle barrier)
        this.drawCoopFence();
        
        // Draw house at SOUTH (bottom)
        this.drawHouse();
        
        // Draw backyard props scattered around
        this.drawProps();
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

    drawLawn() {
        // Base lawn color
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(0, 100, this.width, this.height - 100);
        
        // VERTICAL mowing stripes - reinforce N-S flow
        this.ctx.save();
        this.ctx.globalAlpha = 0.15;
        for (let x = 0; x < this.width; x += 50) {
            this.ctx.fillStyle = (x / 50) % 2 === 0 ? '#388E3C' : '#66BB6A';
            this.ctx.fillRect(x, 100, 50, this.height - 100);
        }
        this.ctx.restore();
        
        // Add some random grass variation
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.width;
            const y = 100 + Math.random() * (this.height - 100);
            this.ctx.fillStyle = Math.random() > 0.5 ? '#43A047' : '#66BB6A';
            this.ctx.fillRect(x, y, 2, 2);
        }
    }

    drawCoopFence() {
        // White picket fence semi-circle around coop at y=50
        const coopX = 400;
        const coopY = 50;
        const fenceRadius = 100;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        
        // Draw picket fence posts in semi-circle (bottom half, blocking south)
        const numPosts = 12;
        for (let i = 0; i <= numPosts; i++) {
            const angle = Math.PI + (i / numPosts) * Math.PI; // Bottom semi-circle
            const x = coopX + Math.cos(angle) * fenceRadius;
            const y = coopY + Math.sin(angle) * fenceRadius * 0.6; // Elliptical
            
            // Picket post
            this.ctx.fillRect(x - 3, y - 20, 6, 25);
            
            // Pointy top
            this.ctx.beginPath();
            this.ctx.moveTo(x - 3, y - 20);
            this.ctx.lineTo(x, y - 28);
            this.ctx.lineTo(x + 3, y - 20);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Horizontal rails
        this.ctx.strokeStyle = '#E0E0E0';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(coopX, coopY, fenceRadius - 5, Math.PI, 0);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(coopX, coopY, fenceRadius - 15, Math.PI, 0);
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Deposit zone indicator (subtle glow inside fence)
        const gradient = this.ctx.createRadialGradient(coopX, coopY, 20, coopX, coopY, 80);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(coopX, coopY, 80, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawHouse() {
        // House at SOUTH (y=550 area)
        const houseY = 520;
        const houseHeight = 80;
        
        // House wall (beige siding)
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.fillRect(250, houseY, 300, houseHeight);
        
        // Siding lines - horizontal
        this.ctx.strokeStyle = '#E8E8D0';
        this.ctx.lineWidth = 1;
        for (let y = houseY + 10; y < houseY + houseHeight; y += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(250, y);
            this.ctx.lineTo(550, y);
            this.ctx.stroke();
        }
        
        // Sliding glass door (at bottom, facing north toward coop)
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(350, houseY, 100, 50);
        
        // Door frame
        this.ctx.strokeStyle = '#8B7355';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(350, houseY, 100, 50);
        
        // Vertical door divider
        this.ctx.beginPath();
        this.ctx.moveTo(400, houseY);
        this.ctx.lineTo(400, houseY + 50);
        this.ctx.stroke();
        
        // Glass reflection lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(360, houseY + 10);
        this.ctx.lineTo(390, houseY + 40);
        this.ctx.moveTo(410, houseY + 10);
        this.ctx.lineTo(440, houseY + 40);
        this.ctx.stroke();
        
        // Door handle
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.beginPath();
        this.ctx.arc(395, houseY + 25, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // House trim
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(245, houseY - 5, 310, 5);
        
        // Steps leading down from door (toward coop)
        this.ctx.fillStyle = '#A0A0A0';
        this.ctx.fillRect(340, houseY + 50, 120, 8);
        this.ctx.fillStyle = '#909090';
        this.ctx.fillRect(330, houseY + 58, 140, 6);
    }

    drawProps() {
        // Garden gnome - placed in middle area
        this.drawGnome(150, 300);
        
        // Pink flamingo - middle right
        this.drawFlamingo(650, 350);
        
        // Grill - near house
        this.drawGrill(180, 480);
        
        // Flower pots - scattered
        this.drawFlowerPot(300, 250);
        this.drawFlowerPot(500, 280);
        
        // Tree - left side for shade
        this.drawTree(80, 200);
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
