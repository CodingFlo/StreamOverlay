const canvas = document.getElementById('transition-canvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
}
resize();
window.addEventListener('resize', resize);

// Farben aus :root
const BASE_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--base-color').trim();
const PARTICLE_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--particle-color').trim();
const LINE_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim();

// Übergang-Timing
const TOTAL = 3000;
const BUILD = 1000;
const HOLD = 500;
const RELEASE = 1000;

// Partikel
const PARTICLE_COUNT = 400;
let particles = [];

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = (Math.random() - 0.5) * 0.2;
        this.alpha = 0.3 + Math.random() * 0.7;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }
    draw() {
        ctx.fillStyle = `${PARTICLE_COLOR}`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
}
createParticles();

// Animation
let startTime;
function animate(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    ctx.clearRect(0, 0, width, height);

    const maxRadius = Math.sqrt(width * width + height * height) / 2;
    let innerRadius = 0;

    ctx.save();
    // Clip-Kreis
    if (elapsed < BUILD) {
        const radius = (elapsed / BUILD) * maxRadius;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
        ctx.clip();
    } else if (elapsed < BUILD + HOLD) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, maxRadius, 0, Math.PI * 2);
        ctx.clip();
    } else if (elapsed < TOTAL) {
        const t = (elapsed - BUILD - HOLD) / RELEASE;
        innerRadius = t * maxRadius;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, maxRadius, 0, Math.PI * 2);
        ctx.arc(width / 2, height / 2, innerRadius, 0, Math.PI * 2, true);
        ctx.clip('evenodd');
    }

    // Basisfläche
    ctx.fillStyle = BASE_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Linien zwischen Partikeln
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const alpha = 1 - dist / 100;
                ctx.strokeStyle = `rgba(${LINE_COLOR},${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    // Partikel zeichnen
    particles.forEach(p => {
        p.update();
        if (elapsed < TOTAL && elapsed >= BUILD + HOLD) {
            if (Math.hypot(p.x - width / 2, p.y - height / 2) >= innerRadius) p.draw();
        } else {
            p.draw();
        }
    });

    ctx.restore();

    if (elapsed < TOTAL) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, width, height);
}

requestAnimationFrame(animate);
