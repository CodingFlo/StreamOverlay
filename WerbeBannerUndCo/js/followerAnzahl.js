// Rolling text for TwitchFollowerAnzahl.html (text-only, two-layer animation per character)

let currentText = "";
const container = document.getElementById('image-text-display');
const ANIMATION_DURATION_MS = 300;
// Animationssteuerung ohne Warteschlange
let isAnimating = false;
let pendingNextText = null;
const imagePath = "../customSigns/"; // PNG-Zahlen & Doppelpunkt

function getPngNameForChar(ch) {
    if (/^[A-Z0-9]$/.test(ch)) return ch; //A-Z oder 0-9
    if (ch === ':') return 'doppelpunkt';
    if (ch === '-') return 'minus';
    return null;
}

function setLayerContent(layerEl, ch) {
    const pngName = getPngNameForChar(ch);
    const wantImg = !!pngName;
    const current = layerEl.firstElementChild;

    if (wantImg) {
        if (!current || current.tagName !== 'IMG') {
            const img = document.createElement('img');
            img.className = 'char-img';
            img.alt = ch;
            img.onerror = () => {
                const span = document.createElement('span');
                span.className = 'fallback-char';
                span.textContent = ch;
                layerEl.replaceChildren(span);
            };
            img.src = `${imagePath}${pngName}.png`;
            layerEl.replaceChildren(img);
        } else {
            current.alt = ch;
            current.onerror = () => {
                const span = document.createElement('span');
                span.className = 'fallback-char';
                span.textContent = ch;
                layerEl.replaceChildren(span);
            };
            current.src = `${imagePath}${pngName}.png`;
        }
    } else {
        if (!current || current.tagName === 'IMG') {
            const span = document.createElement('span');
            span.className = 'fallback-char';
            span.textContent = ch;
            layerEl.replaceChildren(span);
        } else {
            current.textContent = ch;
        }
    }
}

function createCharWrapper(char) {
    const charContainer = document.createElement('span');
    charContainer.className = 'char-wrapper';
    charContainer.dataset.char = char;

    const wrapper = document.createElement('div');
    wrapper.className = 'digit-wrapper';

    const top = document.createElement('div');
    top.className = 'digit-top';
    setLayerContent(top, char);

    const bottom = document.createElement('div');
    bottom.className = 'digit-bottom';
    setLayerContent(bottom, char);

    wrapper.appendChild(top);
    wrapper.appendChild(bottom);
    charContainer.appendChild(wrapper);
    return charContainer;
}

function fullRender(text) {
    container.innerHTML = '';
    text.split('').forEach(ch => container.appendChild(createCharWrapper(ch)));
    currentText = text;
}

function animateCharRoll(wrapper, oldChar, newChar) {
    if (!wrapper || oldChar === newChar) return Promise.resolve();

    const topLayer = wrapper.querySelector('.digit-top');
    const bottomLayer = wrapper.querySelector('.digit-bottom');
    if (!topLayer || !bottomLayer) return Promise.resolve();

    setLayerContent(topLayer, oldChar);
    setLayerContent(bottomLayer, newChar);
    void wrapper.offsetWidth; // reflow

    return new Promise(resolve => {
        wrapper.classList.remove('animate');
        void wrapper.offsetWidth;
        wrapper.classList.add('animate');
        const timeout = setTimeout(() => {
            setLayerContent(topLayer, newChar);
            setLayerContent(bottomLayer, newChar);
            wrapper.classList.remove('animate');
            clearTimeout(timeout);
            resolve();
        }, ANIMATION_DURATION_MS);
    });
}

async function runUpdate(next) {
    // Debug
    console.log(`[Run] Starte Update von '${currentText}' nach '${next}'`);

    if (next.length !== currentText.length || container.children.length !== currentText.length) {
        const animations = [];
        const minLen = Math.min(currentText.length, next.length);

        // Bestehende Positionen
        for (let i = 0; i < minLen; i++) {
            const oldCh = currentText[i];
            const newCh = next[i];
            if (oldCh === newCh) continue;
            const charContainer = container.children[i];
            const wrapper = charContainer && charContainer.querySelector('.digit-wrapper');
            if (wrapper) animations.push(animateCharRoll(wrapper, oldCh, newCh));
        }

        if (next.length > currentText.length) {
            // Debug
            console.log(`[Run] Verarbeite Einfügungen...`);
            // Einfügungen
            for (let i = minLen; i < next.length; i++) {
                const ch = next[i];
                const newNode = createCharWrapper('');
                const refNode = container.children[i] || null;
                container.insertBefore(newNode, refNode);
                const wrapper = newNode.querySelector('.digit-wrapper');
                animations.push(animateCharRoll(wrapper, '', ch));
            }
        } else if (next.length < currentText.length) {
            // Debug
            console.log(`[Run] Verarbeite Löschungen...`);
            // Löschungen
            for (let i = minLen; i < currentText.length; i++) {
                const oldCh = currentText[i];
                const node = container.children[i];
                if (!node) continue;
                const wrapper = node.querySelector('.digit-wrapper');
                if (!wrapper) continue;
                const p = animateCharRoll(wrapper, oldCh, '')
                    .then(() => {
                        if (node.parentNode === container) container.removeChild(node);
                    });
                animations.push(p);
            }
        }

        // Debug
        console.log(`[Run] Warte auf alle Animationen (Promise.all)...`);
        await Promise.all(animations);
        // Debug
        console.log(`[Run] Alle Animationen abgeschlossen.`);

        currentText = next;
        return;
    }

    // Debug
    console.log(`[Run] Länge gleich. Verarbeite nur Rollen.`);

    // Gleiche Länge
    const animations = [];
    for (let i = 0; i < next.length; i++) {
        const oldCh = currentText[i];
        const newCh = next[i];
        if (oldCh === newCh) continue;
        const charContainer = container.children[i];
        const wrapper = charContainer && charContainer.querySelector('.digit-wrapper');
        if (wrapper) animations.push(animateCharRoll(wrapper, oldCh, newCh));
    }

    // Debug
    console.log(`[Run] Warte auf alle Rollen (Promise.all)...`);
    await Promise.all(animations);
    // Debug
    console.log(`[Run] Alle Rollen abgeschlossen.`);

    currentText = next;
}

async function updateTextDisplay(newText) {
    const next = String(newText);
    // Debug
    console.log(`[API] Aufruf mit: '${next}'. Current: '${currentText}'. Animating: ${isAnimating}`);

    if (next === currentText) {
        // Debug
        console.log(`[API] Text ist bereits aktuell. Beendet.`);
        return;
    }

    if (isAnimating) {
        pendingNextText = next; // nur merken, nicht abbrechen
        // Debug
        console.log(`[API] Animation läuft. Text in Pending gespeichert: '${pendingNextText}'`);
        return;
    }

    isAnimating = true;
    // Debug
    console.log(`[API] isAnimating = true. Starte runUpdate...`);

    try {
        await runUpdate(next);
        // Debug
        console.log(`[API] runUpdate erfolgreich abgeschlossen.`);

    } catch (error) {
        console.error('[followerAnzahl] updateTextDisplay error:', error);
    } finally {
        isAnimating = false;
        // Debug
        console.log(`[API] isAnimating = false. Prüfe Pending...`);

        if (pendingNextText && pendingNextText !== currentText) {
            const pending = pendingNextText;
            pendingNextText = null;
            // Debug
            console.log(`[API] Pending gefunden: '${pending}'. Starte Rekursion.`);
            updateTextDisplay(pending);
        } else {
            pendingNextText = null;
            // Debug
            console.log(`[API] Pending leer oder gleich current. Ende.`);
        }
    }
}

// initial render
fullRender(currentText);

// expose API
window.updateTextDisplay = updateTextDisplay;

// demo
// setTimeout(() => updateTextDisplay('TWITCH-FOLLOWER: 88'), 1000);
// setTimeout(() => updateTextDisplay('TWITCH-FOLLOWER: 90'), 2000);
// setTimeout(() => updateTextDisplay('TWITCH-FOLLOWER: 90'), 3000);
// setTimeout(() => updateTextDisplay('TWITCH-FOLLOWET: 90'), 4000);
// setTimeout(() => updateTextDisplay('TWITCH-FOLLOWER1: 92'), 5000);
// setTimeout(() => updateTextDisplay('TWITCH-FOLLOWER: 92'), 5002);
// setTimeout(() => updateTextDisplay(''), 6000);


// Hier Websocket erstellen mit dem typ livestats der dann die Follower-Anzahl nimmt und updateTextDisplay ausführt mit der Followeranzahl
// --- WebSocket Initialisierung ---
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
    console.log('[Frontend Timer] WebSocket-Verbindung zum Backend hergestellt.');

    ws.send(JSON.stringify({
        action: 'identify', // Eine Aktion, damit der Server weiß, was zu tun ist
        clientType: 'liveStats' // Der spezifische Typ dieses Clients
    }));
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('[FOLLOWER COUNTER] Nachricht vom Backend erhalten:', message);

    updateTextDisplay('TWITCH-FOLLOWER: ' + message.data.totalFollowers)
};

ws.onclose = () => {
    console.warn('[FOLLOWER COUNTER] WebSocket-Verbindung geschlossen. Versuche, in 5 Sekunden erneut zu verbinden...');
    setTimeout(() => {
        window.location.reload();
    }, 5000);
};

ws.onerror = (error) => {
    console.error('[FOLLOWER COUNTER] WebSocket-Fehler:', error);
};