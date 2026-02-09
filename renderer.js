/**
 * Renderer - Handles all Canvas 2D drawing
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear() {
        // Grass background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#4a7c36');
        gradient.addColorStop(1, '#3d6630');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw fence border
        this.drawFence();
        
        // Draw grass tufts for decoration
        this.drawGrassTufts();
    }

    drawFence() {
        const fenceWidth = 20;
        this.ctx.strokeStyle = '#5c2e0b';
        this.ctx.lineWidth = 4;
        
        // Top fence
        this.ctx.beginPath();
        for (let x = 0; x <= this.width; x += 30) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x + 15, fenceWidth);
        }
        this.ctx.stroke();
        
        // Bottom fence
        this.ctx.beginPath();
        for (let x = 0; x <= this.width; x += 30) {
            this.ctx.moveTo(x, this.height);
            this.ctx.lineTo(x + 15, this.height - fenceWidth);
        }
        this.ctx.stroke();
        
        // Left fence
        this.ctx.beginPath();
        for (let y = 0; y <= this.height; y += 30) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(fenceWidth, y + 15);
        }
        this.ctx.stroke();
        
        // Right fence
        this.ctx.beginPath();
        for (let y = 0; y <= this.height; y += 30) {
            this.ctx.moveTo(this.width, y);
            this.ctx.lineTo(this.width - fenceWidth, y + 15);
        }
        this.ctx.stroke();
    }

    drawGrassTufts() {
        this.ctx.fillStyle = '#3d6630';
        const tufts = [
            {x: 100, y: 100}, {x: 700, y: 150}, {x: 150, y: 500},
            {x: 650, y: 450}, {x: 300, y: 100}, {x: 500, y: 550}
        ];
        
        tufts.forEach(tuft => {
            for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI / 3) - Math.PI / 2;
                const len = 10 + Math.random() * 5;
                this.ctx.beginPath();
                this.ctx.moveTo(tuft.x, tuft.y);
                this.ctx.lineTo(
                    tuft.x + Math.cos(angle) * len,
                    tuft.y + Math.sin(angle) * len
                );
                this.ctx.stroke();
            }
        });
    }
}
