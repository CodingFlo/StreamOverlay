const canvas = document.getElementById('transition-canvas');
const ctx = canvas.getContext('2d');

const audio = new Audio('Sound.m4a');
audio.volume = audio.volume * 0.8

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
const BUILD = 1000;
const HOLD = 500;
const RELEASE = 1000;
const TOTAL = BUILD + HOLD + RELEASE;

// Partikel
const PARTICLE_COUNT = 400;
let particles = [];

// Particle-Klasse
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

// Funktion zum asynchronen Erstellen von Partikeln
function createParticlesAsync(count, callback) {
    let created = 0;
    const batch = 50; // Erzeuge in kleinen Portionen
    function step() {
        const end = Math.min(created + batch, count);
        for (let i = created; i < end; i++) {
            particles.push(new Particle());
        }
        created = end;
        if (created < count) {
            setTimeout(step, 0); // nächste Portion
        } else {
            callback();
        }
    }
    step();
}
let startTime;
function animate(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;

    ctx.clearRect(0, 0, width, height);

    const maxRadius = Math.sqrt(width * width + height * height) / 2;
    let innerRadius = 0;

    // --- Vorhut-Kreis (weiß angepasst) ---
    ctx.save();
    let leadRadius = 0;
    const leadOffset = 50; // Vorlauf in ms
    const END_OFFSET = 50; // maximal über den Hauptkreis hinaus
    const LEAD_COLOR = '#a94141ff'; // zarte Farbe passend zum Rot

    if (elapsed < BUILD) {
        leadRadius = ((elapsed + leadOffset) / BUILD) * maxRadius;
    } else if (elapsed < BUILD + HOLD) {
        leadRadius = maxRadius;
    } else if (elapsed < TOTAL) {
        const t = (elapsed - BUILD - HOLD) / RELEASE;
        leadRadius = maxRadius + t * END_OFFSET; // nur wachsen, nicht schrumpfen
    }

    ctx.beginPath();
    ctx.arc(width / 2, height / 2, leadRadius, 0, Math.PI * 2);

    if (elapsed < BUILD + HOLD) {
        ctx.fillStyle = LEAD_COLOR;
        ctx.fill();
    } else {
        ctx.strokeStyle = LEAD_COLOR;
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    ctx.restore();
    // --- Ende Vorhut-Kreis ---

    ctx.save();
    // Clip-Kreis (roter Hauptkreis, unverändert)
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

    // Linien zwischen sichtbaren Partikeln
    const maxDistSq = 10000;
    particles.forEach((p1, i) => {
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < maxDistSq) {
                const alpha = 1 - distSq / maxDistSq;
                ctx.strokeStyle = `rgba(${LINE_COLOR},${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    });

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

    // --- Neuer Rand-Kreis am Ende ---
    if (elapsed >= BUILD + HOLD) {
        const t = (elapsed - BUILD - HOLD) / RELEASE;
        const borderRadius = innerRadius + 10; // 10px größer als transparenter Kreis
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, borderRadius, 0, Math.PI * 2);
        ctx.strokeStyle = LEAD_COLOR; // halbtransparente weiße Border
        ctx.lineWidth = 50;
        ctx.stroke();
    }
    // --- Ende neuer Rand-Kreis ---

    if (elapsed < TOTAL) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, width, height);
}

// Starte Animation mit 50ms Verzögerung, in der die Partikel erstellt werden
createParticlesAsync(PARTICLE_COUNT, () => {
    setTimeout(() => {
        requestAnimationFrame(animate);
    }, 450);
    audio.play()
});

