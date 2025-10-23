const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const PARTICLE_COUNT_FACTOR = 0.0003; // Partikel pro Pixel
const MAX_DISTANCE = 125; // Max Distanz für Linien
const FLOW_SPEED = 0.9; // Strömungsgeschwindigkeit
const FLOW_VARIANCE = 0.4; // leichte Wellenbewegung
const FADE_SPEED = 0.02; // Geschwindigkeit des Ein-/Ausblendens

function getCSSVariable(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#ff0000';
}

const particleColor = getCSSVariable('--canvas-color');

class Particle {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.offset = Math.random() * Math.PI * 2;
        this.speedX = FLOW_SPEED + Math.random() * 0.2;
        this.speedY = Math.sin(this.y * 0.01 + this.offset) * FLOW_VARIANCE;
        this.fade = Math.random(); // initiale Transparenz
        this.targetFade = 1; // Ziel für weiches Einblenden
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Vertikale Bounds
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Strömung → rechts raus
        if (this.x > canvas.width) {
            this.targetFade = 0; // fade out
            if (this.fade <= 0) this.reset();
        }

        // Weiches Ein-/Ausblenden
        if (this.fade < this.targetFade) this.fade += FADE_SPEED;
        if (this.fade > this.targetFade) this.fade -= FADE_SPEED;
    }

    reset() {
        // Respawn links
        this.x = 0;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.offset = Math.random() * Math.PI * 2;
        this.speedX = FLOW_SPEED + Math.random() * 0.2;
        this.speedY = Math.sin(this.y * 0.01 + this.offset) * FLOW_VARIANCE;
        this.fade = 0;
        this.targetFade = 1; // fade in
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = this.fade;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
}

function createParticles() {
    particles = [];
    const count = Math.floor(canvas.width * canvas.height * PARTICLE_COUNT_FACTOR);
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MAX_DISTANCE) {
                const alpha = Math.min(particles[i].fade, particles[j].fade) * (1 - dist / MAX_DISTANCE);
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255,0,0,${alpha})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    drawConnections();

    requestAnimationFrame(animate);
}

// Init
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animate();
