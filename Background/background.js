const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
const MAX_SPEED = 0.25;

function getCSSVariable(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

const particleColor = getCSSVariable('--canvas-color');

class Particle {
    constructor() {
        // 80% Wahrscheinlichkeit für Randbereich, 20% für etwas näher zur Mitte
        const outerRatio = 0.8;
        const marginX = canvas.width * 0.2; // 20% Rand
        const marginY = canvas.height * 0.2;

        // X-Koordinate
        if (Math.random() < outerRatio) {
            this.x = Math.random() < 0.5
                ? Math.random() * marginX               // links außen
                : canvas.width - Math.random() * marginX; // rechts außen
        } else {
            this.x = marginX + Math.random() * (canvas.width - 2 * marginX); // leicht zentral
        }

        // Y-Koordinate
        if (Math.random() < outerRatio) {
            this.y = Math.random() < 0.5
                ? Math.random() * marginY               // oben außen
                : canvas.height - Math.random() * marginY; // unten außen
        } else {
            this.y = marginY + Math.random() * (canvas.height - 2 * marginY); // leicht zentral
        }

        this.size = Math.random() * 2.5 + 1;
        this.speedX = (Math.random() * MAX_SPEED * 2) - MAX_SPEED;
        this.speedY = (Math.random() * MAX_SPEED * 2) - MAX_SPEED;
        this.color = particleColor;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
}

function createParticles() {
    particles = [];
    const numberOfParticles = Math.floor((canvas.width * canvas.height) / 7500);
    for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
    }
}

function backgroundAnimation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
                const colorA = hexToRgb(particles[a].color);
                const colorB = hexToRgb(particles[b].color);
                const r = Math.round((colorA.r + colorB.r) / 2);
                const g = Math.round((colorA.g + colorB.g) / 2);
                const bAvg = Math.round((colorA.b + colorB.b) / 2);
                const alpha = 1 - distance / 120;

                ctx.beginPath();
                ctx.strokeStyle = `rgba(${r}, ${g}, ${bAvg}, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(backgroundAnimation);
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

// Initialisierung
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
backgroundAnimation();

// Canvas Fade-in
setTimeout(() => {
    canvas.classList.add('canvas-loaded');
}, 50);
