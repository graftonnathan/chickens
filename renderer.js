/**
 * Renderer - Handles all Canvas 2D drawing for residential backyard
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
        
        // Draw house at the top (back of yard)
        this.drawHouse();
        
        // Draw lawn with mowing stripes
        this.drawLawn();
        
        // Draw patio area
        this.drawPatio();
        
        // Draw privacy fence borders
        this.drawPrivacyFence();
        
        // Draw front hedge
        this.drawFrontHedge();
        
        // Draw backyard props
        this.drawProps();
    }

    drawSky() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 150);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#B0E0E6');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, 150);
        
        // Draw some clouds
        this.drawCloud(100, 40, 30);
        this.drawCloud(600, 60, 40);
        this.drawCloud(450, 30, 25);
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

    drawHouse() {
        const houseY = 100;
        const houseHeight = 80;
        
        // House wall (beige siding)
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.fillRect(250, houseY, 300, houseHeight);
        
        // Siding lines
        this.ctx.strokeStyle = '#E8E8D0';
        this.ctx.lineWidth = 1;
        for (let y = houseY + 10; y < houseY + houseHeight; y += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(250, y);
            this.ctx.lineTo(550, y);
            this.ctx.stroke();
        }
        
        // Sliding glass door (chicken spawn point)
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(350, houseY + 20, 100, 60);
        
        // Door frame
        this.ctx.strokeStyle = '#8B7355';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(350, houseY + 20, 100, 60);
        
        // Vertical door divider
        this.ctx.beginPath();
        this.ctx.moveTo(400, houseY + 20);
        this.ctx.lineTo(400, houseY + 80);
        this.ctx.stroke();
        
        // Glass reflection lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(360, houseY + 30);
        this.ctx.lineTo(390, houseY + 70);
        this.ctx.moveTo(410, houseY + 30);
        this.ctx.lineTo(440, houseY + 70);
        this.ctx.stroke();
        
        // Door handle
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.beginPath();
        this.ctx.arc(395, houseY + 50, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // House trim
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(245, houseY - 5, 310, 5);
        
        // Steps from door
        this.ctx.fillStyle = '#A0A0A0';
        this.ctx.fillRect(340, houseY + 80, 120, 10);
        this.ctx.fillStyle = '#909090';
        this.ctx.fillRect(330, houseY + 90, 140, 8);
    }

    drawLawn() {
        // Base lawn color
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(0, 180, this.width, this.height - 180);
        
        // Mowing stripes - vertical lines with alternating brightness
        this.ctx.save();
        this.ctx.globalAlpha = 0.15;
        for (let x = 0; x < this.width; x += 40) {
            this.ctx.fillStyle = (x / 40) % 2 === 0 ? '#388E3C' : '#66BB6A';
            this.ctx.fillRect(x, 180, 40, this.height - 180);
        }
        this.ctx.restore();
        
        // Add some random grass variation
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.width;
            const y = 180 + Math.random() * (this.height - 180);
            this.ctx.fillStyle = Math.random() > 0.5 ? '#43A047' : '#66BB6A';
            this.ctx.fillRect(x, y, 2, 2);
        }
    }

    drawPatio() {
        // Concrete patio near the house
        const patioY = 200;
        const patioHeight = 100;
        
        this.ctx.fillStyle = '#B0B0B0';
        this.ctx.fillRect(100, patioY, 600, patioHeight);
        
        // Patio tile pattern
        this.ctx.strokeStyle = '#A0A0A0';
        this.ctx.lineWidth = 1;
        
        // Horizontal lines
        for (let y = patioY; y <= patioY + patioHeight; y += 25) {
            this.ctx.beginPath();
            this.ctx.moveTo(100, y);
            this.ctx.lineTo(700, y);
            this.ctx.stroke();
        }
        
        // Vertical lines (offset for brick pattern)
        for (let x = 100; x <= 700; x += 50) {
            const offset = ((x - 100) / 50) % 2 === 0 ? 0 : 12.5;
            for (let y = patioY + offset; y < patioY + patioHeight; y += 25) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x, y + 12.5);
                this.ctx.stroke();
            }
        }
        
        // Patio furniture - Table and chairs
        this.drawPatioFurniture(600, 250);
    }
    
    drawPatioFurniture(x, y) {
        // Table
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Table legs
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15);
            this.ctx.lineTo(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25 + 15);
            this.ctx.stroke();
        }
        
        // Chairs
        const chairOffsets = [
            {x: -35, y: 0, angle: 0},
            {x: 35, y: 0, angle: Math.PI},
            {x: 0, y: -35, angle: Math.PI / 2}
        ];
        
        chairOffsets.forEach(chair => {
            this.ctx.save();
            this.ctx.translate(x + chair.x, y + chair.y);
            this.ctx.rotate(chair.angle);
            
            // Chair seat
            this.ctx.fillStyle = '#A0522D';
            this.ctx.fillRect(-8, -12, 16, 24);
            
            // Chair back
            this.ctx.fillRect(-8, -25, 16, 13);
            
            this.ctx.restore();
        });
    }

    drawPrivacyFence() {
        // Wood privacy fence on sides and back
        const fenceColor = '#8B7355';
        const postColor = '#6B5344';
        
        // Left fence
        this.drawFenceSection(0, 150, 20, this.height - 150, true);
        
        // Right fence
        this.drawFenceSection(this.width - 20, 150, 20, this.height - 150, true);
        
        // Back fence (bottom)
        this.drawFenceSection(0, this.height - 20, this.width, 20, false);
    }
    
    drawFenceSection(x, y, width, height, isVertical) {
        // Fence posts
        this.ctx.fillStyle = '#6B5344';
        if (isVertical) {
            for (let py = y; py < y + height; py += 60) {
                this.ctx.fillRect(x - 2, py, width + 4, 8);
            }
        } else {
            for (let px = x; px < x + width; px += 80) {
                this.ctx.fillRect(px, y - 2, 8, height + 4);
            }
        }
        
        // Fence boards
        this.ctx.fillStyle = '#8B7355';
        if (isVertical) {
            // Vertical boards
            for (let i = 0; i < 3; i++) {
                const bx = x + 2 + i * 6;
                this.ctx.fillRect(bx, y, 5, height);
            }
            // Top and bottom rails
            this.ctx.fillStyle = '#6B5344';
            this.ctx.fillRect(x, y + 20, width, 4);
            this.ctx.fillRect(x, y + height - 30, width, 4);
        } else {
            // Horizontal boards
            for (let i = 0; i < 3; i++) {
                const by = y + i * 6;
                this.ctx.fillRect(x, by, width, 5);
            }
        }
    }

    drawFrontHedge() {
        // Front hedge along the bottom (decorative, not a barrier)
        const hedgeY = this.height - 25;
        
        this.ctx.fillStyle = '#2E7D32';
        
        // Draw hedge as rounded bushes
        const bushWidth = 60;
        for (let x = 0; x < this.width + bushWidth; x += bushWidth - 10) {
            this.ctx.beginPath();
            this.ctx.arc(x, hedgeY + 15, 25, Math.PI, 0);
            this.ctx.arc(x + 20, hedgeY + 10, 30, Math.PI, 0);
            this.ctx.arc(x + 40, hedgeY + 15, 25, Math.PI, 0);
            this.ctx.fill();
        }
        
        // Hedge highlight
        this.ctx.fillStyle = '#4CAF50';
        for (let x = 0; x < this.width + bushWidth; x += bushWidth - 10) {
            this.ctx.beginPath();
            this.ctx.arc(x + 5, hedgeY + 10, 15, Math.PI, 0);
            this.ctx.arc(x + 25, hedgeY + 5, 18, Math.PI, 0);
            this.ctx.fill();
        }
    }

    drawProps() {
        // Garden gnome
        this.drawGnome(120, 450);
        
        // Pink flamingo
        this.drawFlamingo(720, 480);
        
        // Grill
        this.drawGrill(180, 300);
        
        // Flower pots
        this.drawFlowerPot(280, 220);
        this.drawFlowerPot(520, 220);
        
        // Tree (for shade)
        this.drawTree(60, 320);
    }
    
    drawGnome(x, y) {
        // Body
        this.ctx.fillStyle = '#4169E1'; // Blue coat
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
        this.ctx.quadraticCurveTo(x + 20, y - 20, x + 15, y - 30);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#FF69B4';
        this.ctx.stroke();
        
        // Head
        this.ctx.beginPath();
        this.ctx.arc(x + 15, y - 32, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Beak
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 19, y - 32);
        this.ctx.lineTo(x + 26, y - 30);
        this.ctx.lineTo(x + 19, y - 28);
        this.ctx.fill();
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(x + 20, y - 30, 1, 0, Math.PI * 2);
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
}
