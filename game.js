class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        this.gameState = 'playing';
        this.camera = { x: 0, y: 0 };
        this.world = {
            width: 3000,
            height: 3000
        };
        
        this.player = null;
        this.foods = [];
        this.powerUps = [];
        this.aiSnakes = [];
        this.particles = [];
        
        this.score = 0;
        this.leaderboard = [];
        
        this.input = {
            direction: { x: 0, y: 0 },
            boosting: false
        };
        
        this.setupEventListeners();
        this.init();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    setupEventListeners() {
        this.setupTouchControls();
        this.setupRestartButton();
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouching = false;
        let touchCount = 0;
        
        const handleTouchStart = (e) => {
            e.preventDefault();
            touchCount = e.touches.length;
            
            if (touchCount === 1) {
                isTouching = true;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            } else if (touchCount === 2) {
                this.input.boosting = true;
            }
        };
        
        const handleTouchMove = (e) => {
            e.preventDefault();
            touchCount = e.touches.length;
            
            if (touchCount === 1 && isTouching) {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                
                const deltaX = touchX - touchStartX;
                const deltaY = touchY - touchStartY;
                
                const maxDistance = 100;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance > 5) {
                    const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
                    const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));
                    
                    this.input.direction.x = normalizedX;
                    this.input.direction.y = normalizedY;
                }
            } else if (touchCount === 2) {
                this.input.boosting = true;
                this.input.direction.x = 0;
                this.input.direction.y = 0;
            }
        };
        
        const handleTouchEnd = (e) => {
            e.preventDefault();
            touchCount = e.touches.length;
            
            if (touchCount === 0) {
                isTouching = false;
                this.input.direction.x = 0;
                this.input.direction.y = 0;
                this.input.boosting = false;
            } else if (touchCount === 1) {
                this.input.boosting = false;
                isTouching = true;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        };
        
        this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        
        // Mouse controls for desktop
        this.canvas.addEventListener('mousedown', (e) => {
            isTouching = true;
            touchStartX = e.clientX;
            touchStartY = e.clientY;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isTouching) {
                const deltaX = e.clientX - touchStartX;
                const deltaY = e.clientY - touchStartY;
                
                const maxDistance = 100;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance > 5) {
                    const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
                    const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));
                    
                    this.input.direction.x = normalizedX;
                    this.input.direction.y = normalizedY;
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isTouching = false;
            this.input.direction.x = 0;
            this.input.direction.y = 0;
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    this.input.direction.y = -1;
                    break;
                case 'ArrowDown':
                case 's':
                    this.input.direction.y = 1;
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.input.direction.x = -1;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.input.direction.x = 1;
                    break;
                case ' ':
                case 'Shift':
                    this.input.boosting = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'w':
                case 's':
                    this.input.direction.y = 0;
                    break;
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'a':
                case 'd':
                    this.input.direction.x = 0;
                    break;
                case ' ':
                case 'Shift':
                    this.input.boosting = false;
                    break;
            }
        });
    }
    
    setupRestartButton() {
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    init() {
        this.player = new Snake(this.world.width / 2, this.world.height / 2, '#4CAF50', true);
        this.generateFood(150);
        this.generateAISnakes(20);
        this.gameLoop();
    }
    
    generateFood(count) {
        const foodTypes = ['small', 'small', 'small', 'normal', 'normal', 'large', 'super'];
        for (let i = 0; i < count; i++) {
            const type = foodTypes[Math.floor(Math.random() * foodTypes.length)];
            this.foods.push(new Food(
                Math.random() * this.world.width,
                Math.random() * this.world.height,
                type
            ));
        }
        
        // Add some rainbow food
        for (let i = 0; i < 3; i++) {
            this.foods.push(new Food(
                Math.random() * this.world.width,
                Math.random() * this.world.height,
                'rainbow'
            ));
        }
    }
    
    generateAISnakes(count) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C777', '#FF8C94', '#C39BD3', '#76D7C4', '#F9E79F', '#AED6F1'];
        for (let i = 0; i < count; i++) {
            this.aiSnakes.push(new AISnake(
                Math.random() * this.world.width,
                Math.random() * this.world.height,
                colors[i % colors.length]
            ));
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.player.update(this.input, this.world);
        
        // Update AI snakes with performance optimization
        const activeAISnakes = this.aiSnakes.filter(ai => ai.alive);
        for (let i = 0; i < activeAISnakes.length; i++) {
            activeAISnakes[i].update(this.world, this.foods, activeAISnakes, this.player);
        }
        
        this.checkCollisions();
        this.updateCamera();
        this.updateUI();
        
        // Limit particles to prevent performance issues
        if (this.particles.length > 100) {
            this.particles = this.particles.slice(-100);
        }
        this.updateParticles();
        
        if (this.foods.length < 100) {
            this.generateFood(50);
        }
    }
    
    checkCollisions() {
        if (!this.player.alive) return;
        
        this.foods = this.foods.filter(food => {
            const dist = Math.hypot(food.x - this.player.segments[0].x, food.y - this.player.segments[0].y);
            if (dist < this.player.radius + food.radius) {
                this.player.growthCounter += food.growthAmount;
                this.score += food.value;
                this.createParticles(food.x, food.y, food.color);
                return false;
            }
            return true;
        });
        
        for (let ai of this.aiSnakes) {
            if (!ai.alive) continue;
            
            this.foods = this.foods.filter(food => {
                const dist = Math.hypot(food.x - ai.segments[0].x, food.y - ai.segments[0].y);
                if (dist < ai.radius + food.radius) {
                    ai.growthCounter += food.growthAmount;
                    return false;
                }
                return true;
            });
        }
        
        if (this.player.checkSelfCollision() || this.checkSnakeCollisions(this.player)) {
            this.gameOver();
        }
        
        this.aiSnakes.forEach(ai => {
            if (ai.checkSelfCollision() || this.checkSnakeCollisions(ai)) {
                ai.alive = false;
            }
        });
    }
    
    checkSnakeCollisions(snake) {
        const head = snake.segments[0];
        
        for (let other of [this.player, ...this.aiSnakes]) {
            if (other === snake || !other.alive) continue;
            
            for (let i = 1; i < other.segments.length; i++) {
                const segment = other.segments[i];
                const dist = Math.hypot(head.x - segment.x, head.y - segment.y);
                if (dist < snake.radius + other.radius) {
                    return true;
                }
            }
        }
        
        if (head.x < snake.radius || head.x > this.world.width - snake.radius ||
            head.y < snake.radius || head.y > this.world.height - snake.radius) {
            return true;
        }
        
        return false;
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
    }
    
    updateCamera() {
        const targetX = this.player.segments[0].x - this.canvas.width / 2;
        const targetY = this.player.segments[0].y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.world.width - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.world.height - this.canvas.height));
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('length').textContent = this.player.segments.length;
        
        this.updateLeaderboard();
        
        const boostBtn = document.getElementById('boostBtn');
        if (this.player.boostEnergy <= 0) {
            boostBtn.classList.add('disabled');
        } else {
            boostBtn.classList.remove('disabled');
        }
    }
    
    updateLeaderboard() {
        const allSnakes = [
            { name: 'You', length: this.player.segments.length, alive: this.player.alive },
            ...this.aiSnakes.map((ai, i) => ({
                name: `Bot ${i + 1}`,
                length: ai.segments.length,
                alive: ai.alive
            }))
        ];
        
        this.leaderboard = allSnakes
            .filter(snake => snake.alive)
            .sort((a, b) => b.length - a.length)
            .slice(0, 5);
        
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = this.leaderboard
            .map(snake => `<li>${snake.name}: ${snake.length}</li>`)
            .join('');
    }
    
    render() {
        this.ctx.fillStyle = '#2a2a3e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.renderGrid();
        this.renderFood();
        this.renderSnakes();
        this.renderParticles();
        
        this.ctx.restore();
        
        // Add FPS counter for performance monitoring
        if (!this.fps) {
            this.fps = 0;
            this.frameCount = 0;
            this.lastTime = performance.now();
        }
        
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
        
        // Display FPS (optional - can be removed)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 10);
    }
    
    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = startX + this.canvas.width + gridSize;
        const endY = startY + this.canvas.height + gridSize;
        
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.world.width, this.world.height);
    }
    
    renderFood() {
        // Only render food that's visible in viewport for performance
        const visibleFood = this.foods.filter(food => {
            return food.x > this.camera.x - 50 && 
                   food.x < this.camera.x + this.canvas.width + 50 &&
                   food.y > this.camera.y - 50 && 
                   food.y < this.camera.y + this.canvas.height + 50;
        });
        
        visibleFood.forEach(food => food.render(this.ctx));
    }
    
    renderSnakes() {
        // Only render visible snakes for performance
        const visibleSnakes = this.aiSnakes.filter(ai => {
            if (!ai.alive) return false;
            const head = ai.segments[0];
            return head.x > this.camera.x - 100 && 
                   head.x < this.camera.x + this.canvas.width + 100 &&
                   head.y > this.camera.y - 100 && 
                   head.y < this.camera.y + this.canvas.height + 100;
        });
        
        visibleSnakes.forEach(ai => ai.render(this.ctx));
        
        if (this.player.alive) {
            this.player.render(this.ctx);
        }
    }
    
    renderParticles() {
        this.particles.forEach(particle => particle.render(this.ctx));
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.player.alive = false;
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLength').textContent = this.player.segments.length;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    restart() {
        this.gameState = 'playing';
        this.score = 0;
        this.player = new Snake(this.world.width / 2, this.world.height / 2, '#4CAF50', true);
        this.foods = [];
        this.aiSnakes = [];
        this.particles = [];
        
        this.generateFood(150);
        this.generateAISnakes(20);
        
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Snake {
    constructor(x, y, color, isPlayer = false) {
        this.segments = [
            { x, y },
            { x: x - 10, y },
            { x: x - 20, y }
        ];
        this.color = color;
        this.radius = 8;
        this.speed = isPlayer ? 3 : 2;
        this.direction = { x: 1, y: 0 };
        this.alive = true;
        this.isPlayer = isPlayer;
        this.boostEnergy = 100;
        this.growthCounter = 0;
    }
    
    update(input, world) {
        if (!this.alive) return;
        
        let currentSpeed = this.speed;
        if (this.isPlayer && input.boosting && this.boostEnergy > 0) {
            currentSpeed *= 2;
            this.boostEnergy = Math.max(0, this.boostEnergy - 1);
        } else if (this.isPlayer && this.boostEnergy < 100) {
            this.boostEnergy = Math.min(100, this.boostEnergy + 0.5);
        }
        
        if (this.isPlayer) {
            if (input.direction.x !== 0 || input.direction.y !== 0) {
                const magnitude = Math.sqrt(input.direction.x ** 2 + input.direction.y ** 2);
                this.direction.x = (input.direction.x / magnitude) * currentSpeed;
                this.direction.y = (input.direction.y / magnitude) * currentSpeed;
            }
        }
        
        const head = { ...this.segments[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        this.segments.unshift(head);
        
        if (this.growthCounter > 0) {
            this.growthCounter--;
        } else {
            this.segments.pop();
        }
    }
    
    grow() {
        this.growthCounter += 3;
        this.radius = Math.min(12, this.radius + 0.1);
    }
    
    checkSelfCollision() {
        const head = this.segments[0];
        for (let i = 4; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const dist = Math.hypot(head.x - segment.x, head.y - segment.y);
            if (dist < this.radius * 2) {
                return true;
            }
        }
        return false;
    }
    
    render(ctx) {
        // Draw snake body with gradient effect
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i];
            const segmentRadius = this.radius * (1 - i / this.segments.length * 0.3);
            
            // Create gradient for each segment
            const gradient = ctx.createRadialGradient(
                segment.x, segment.y, 0,
                segment.x, segment.y, segmentRadius
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.7, this.color);
            gradient.addColorStop(1, this.adjustColor(this.colo
