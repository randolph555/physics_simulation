// 物理参数
let GRAVITY = 0.2;
let FRICTION = 0.95;
let BOUNCE = 0.1;
let INITIAL_TILT = 0.2; // 初始倾斜角度

// 烟囱参数
const CHIMNEY_WIDTH = 60;
const CHIMNEY_HEIGHT = 400;
const BRICK_WIDTH = CHIMNEY_WIDTH;
const BRICK_HEIGHT = 20;

// 爆炸参数
let EXPLOSION_FORCE = 25;
let EXPLOSION_RADIUS = 120;

// 砖块类
class Brick {
    constructor(x, y, index) {
        this.x = x;
        this.y = y;
        this.index = index; // 砖块在烟囱中的位置索引
        this.width = BRICK_WIDTH;
        this.height = BRICK_HEIGHT;
        this.vx = 0; // 水平速度
        this.vy = 0; // 垂直速度
        this.angle = 0; // 旋转角度
        this.angularVelocity = 0; // 角速度
        this.active = true; // 是否还在烟囱结构中
        this.connected = true; // 是否与上方砖块连接
        this.color = `rgb(${Math.floor(Math.random() * 55 + 100)}, ${Math.floor(Math.random() * 55 + 50)}, ${Math.floor(Math.random() * 55 + 30)})`;
    }

    // 更新砖块位置
    update() {
        if (!this.active) {
            // 更新角度和角速度
            this.angle += this.angularVelocity;
            this.angularVelocity *= 0.99; // 角速度衰减
            
            // 受重力影响
            this.vy += GRAVITY;
            this.x += this.vx;
            this.y += this.vy;

            // 边界碰撞检测
            if (this.x <= 0 || this.x + this.width >= canvas.width) {
                this.vx = -this.vx * BOUNCE;
                this.x = this.x <= 0 ? 0 : canvas.width - this.width;
                this.angularVelocity *= 0.8; // 碰撞时减少角速度
            }

            if (this.y + this.height >= canvas.height) {
                this.vy = -this.vy * BOUNCE;
                this.y = canvas.height - this.height;
                this.vx *= FRICTION;
                this.angularVelocity *= 0.8; // 碰撞时减少角速度
            }
        }
    }

    // 绘制砖块
    draw(ctx) {
        if (this.y < canvas.height) {
            ctx.save();
            // 设置旋转中心为砖块中心
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
    }

    // 应用爆炸力
    applyExplosionForce(explodeX, explodeY) {
        if (!this.active) return;

        const dx = this.x + this.width/2 - explodeX;
        const dy = this.y + this.height/2 - explodeY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < EXPLOSION_RADIUS) {
            // 计算爆炸力方向和大小
            const force = (1 - distance / EXPLOSION_RADIUS) * EXPLOSION_FORCE;
            // 增加随机性，使砖块飞散更自然
            const randomFactor = 0.3;
            this.vx += (dx / distance) * force + (Math.random() - 0.5) * force * randomFactor;
            this.vy += (dy / distance) * force + (Math.random() - 0.5) * force * randomFactor;
            this.angularVelocity += (Math.random() - 0.5) * 0.2; // 增加随机角速度
            this.active = false; // 砖块脱离烟囱结构
            this.connected = false; // 断开连接
        }
    }
}

// 烟囱类
class Chimney {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.bricks = [];
        this.build();
        this.falling = false;
        this.collapseIndex = 0;
    }

    // 构建烟囱
    build() {
        const brickCount = Math.floor(CHIMNEY_HEIGHT / BRICK_HEIGHT);
        for (let i = 0; i < brickCount; i++) {
            const brick = new Brick(this.x, this.y - i * BRICK_HEIGHT, i);
            this.bricks.push(brick);
        }
    }

    // 更新烟囱状态
    update() {
        // 检查是否开始倒塌
        if (this.falling) {
            // 给烟囱一个初始倾斜
            if (this.collapseIndex === 0) {
                this.bricks[0].angle = INITIAL_TILT;
                this.collapseIndex++;
            }
            
            // 逐渐让砖块脱离结构，减慢倒塌速度
            if (this.collapseIndex < this.bricks.length && Math.random() < 0.1) {
                this.bricks[this.collapseIndex].active = false;
                this.collapseIndex++;
            }

            // 更新所有砖块
            this.bricks.forEach(brick => brick.update());
        }
    }

    // 绘制烟囱
    draw(ctx) {
        this.bricks.forEach(brick => brick.draw(ctx));
    }

    // 开始倒塌
    startFalling() {
        this.falling = true;
        this.collapseIndex = 0;
        // 给顶部砖块一个初始推力和角速度
        if (this.bricks.length > 0) {
            this.bricks[0].vx = 1.5;
            this.bricks[0].angularVelocity = 0.05;
        }
    }

    // 应用爆炸
    applyExplosion(explodeX, explodeY) {
        this.bricks.forEach(brick => brick.applyExplosionForce(explodeX, explodeY));
        this.falling = true;
    }
}

// 获取画布和上下文
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// 创建烟囱实例
const chimney = new Chimney(canvas.width / 2 - CHIMNEY_WIDTH / 2, canvas.height - 50);

// 动画循环
let animationId;
let simulationStarted = false;

function animate() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制地面
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // 更新和绘制烟囱
    chimney.update();
    chimney.draw(ctx);

    // 继续动画循环
    animationId = requestAnimationFrame(animate);
}

// 开始模拟
document.getElementById('startBtn').addEventListener('click', function() {
    if (!simulationStarted) {
        simulationStarted = true;
        chimney.startFalling();
        this.disabled = true;
        document.getElementById('explodeBtn').disabled = false;
    }
});

// 引爆
document.getElementById('explodeBtn').addEventListener('click', function() {
    if (simulationStarted) {
        // 在烟囱中部引爆
        const explodeX = canvas.width / 2;
        const explodeY = canvas.height - CHIMNEY_HEIGHT / 2;
        chimney.applyExplosion(explodeX, explodeY);
        this.disabled = true;
        
        // 绘制爆炸效果
        drawExplosion(explodeX, explodeY);
    }
});

// 重置模拟
document.getElementById('resetBtn').addEventListener('click', function() {
    // 取消动画
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // 重新创建烟囱
    chimney.bricks = [];
    chimney.build();
    chimney.falling = false;
    
    // 重置按钮状态
    simulationStarted = false;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('explodeBtn').disabled = true;
    
    // 重新开始动画
    animate();
});

// 绘制爆炸效果
function drawExplosion(x, y) {
    // 创建径向渐变
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, EXPLOSION_RADIUS);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    // 绘制爆炸
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, EXPLOSION_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // 几帧后清除爆炸效果
    setTimeout(() => {
        ctx.clearRect(x - EXPLOSION_RADIUS, y - EXPLOSION_RADIUS, EXPLOSION_RADIUS * 2, EXPLOSION_RADIUS * 2);
        chimney.draw(ctx);
    }, 200);
}

// 参数控制面板事件监听器
document.getElementById('gravitySlider').addEventListener('input', function() {
    GRAVITY = parseFloat(this.value);
    document.getElementById('gravityValue').textContent = GRAVITY.toFixed(2);
});

document.getElementById('frictionSlider').addEventListener('input', function() {
    FRICTION = parseFloat(this.value);
    document.getElementById('frictionValue').textContent = FRICTION.toFixed(2);
});

document.getElementById('bounceSlider').addEventListener('input', function() {
    BOUNCE = parseFloat(this.value);
    document.getElementById('bounceValue').textContent = BOUNCE.toFixed(2);
});

document.getElementById('tiltSlider').addEventListener('input', function() {
    INITIAL_TILT = parseFloat(this.value);
    document.getElementById('tiltValue').textContent = INITIAL_TILT.toFixed(2);
});

document.getElementById('explosionForceSlider').addEventListener('input', function() {
    EXPLOSION_FORCE = parseFloat(this.value);
    document.getElementById('explosionForceValue').textContent = EXPLOSION_FORCE.toFixed(0);
});

document.getElementById('explosionRadiusSlider').addEventListener('input', function() {
    EXPLOSION_RADIUS = parseFloat(this.value);
    document.getElementById('explosionRadiusValue').textContent = EXPLOSION_RADIUS.toFixed(0);
});

// 初始化按钮状态
document.getElementById('explodeBtn').disabled = true;

// 初始化参数显示值
document.getElementById('gravityValue').textContent = GRAVITY.toFixed(2);
document.getElementById('frictionValue').textContent = FRICTION.toFixed(2);
document.getElementById('bounceValue').textContent = BOUNCE.toFixed(2);
document.getElementById('tiltValue').textContent = INITIAL_TILT.toFixed(2);
document.getElementById('explosionForceValue').textContent = EXPLOSION_FORCE.toFixed(0);
document.getElementById('explosionRadiusValue').textContent = EXPLOSION_RADIUS.toFixed(0);

// 开始动画
animate();
