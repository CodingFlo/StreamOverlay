const DEBUG_TIMER = false;

document.addEventListener('DOMContentLoaded', () => {
    const digitElementsLayer1 = [
        { wrapper: document.querySelector('#min-tens-top-1').closest('.digit-wrapper'), top: document.getElementById('min-tens-top-1'), bottom: document.getElementById('min-tens-bottom-1') },
        { wrapper: document.querySelector('#min-ones-top-1').closest('.digit-wrapper'), top: document.getElementById('min-ones-top-1'), bottom: document.getElementById('min-ones-bottom-1') },
        { wrapper: document.querySelector('#sec-tens-top-1').closest('.digit-wrapper'), top: document.getElementById('sec-tens-top-1'), bottom: document.getElementById('sec-tens-bottom-1') },
        { wrapper: document.querySelector('#sec-ones-top-1').closest('.digit-wrapper'), top: document.getElementById('sec-ones-top-1'), bottom: document.getElementById('sec-ones-bottom-1') }
    ];

    const timersWrapper = document.getElementById('timers-wrapper');
    const endText = document.getElementById('end-text');
    const startTextImage = document.getElementById('start-text');

    let initialTotalSeconds = 5 * 60;
    let currentTimerInterval = null;
    let currentSecondsRemaining = initialTotalSeconds;

    // --- WebSocket Initialisierung ---
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('[Frontend Timer] WebSocket-Verbindung zum Backend hergestellt.');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('[Frontend Timer] Nachricht vom Backend erhalten:', message);

        if (DEBUG_TIMER || message.type === 'streamStatusUpdate') {
            const isOnline = message.data.isOnline;
            if (DEBUG_TIMER || isOnline) {
                console.log('[Frontend Timer] Stream ist ONLINE. Starte Timer.');
                // Wichtig: showTimerWrapper wird jetzt IM hideStartText-Callback aufgerufen
                hideStartText(true, () => {
                    hideEndText(false);  // Sicherstellen, dass Endtext ausgeblendet ist
                    if (!currentTimerInterval) {
                        startAndDisplayTimer(digitElementsLayer1, initialTotalSeconds);
                    }
                    showTimerWrapper(); // Dies wird aufgerufen, wenn hideStartText fertig ist
                });
            } else {
                console.log('[Frontend Timer] Stream ist OFFLINE. Stoppe Timer und zeige Start-Text an.');
                stopTimer(); // Stoppt den laufenden Timer
                hideTimerWrapper(); // Timer-Wrapper ausblenden
                hideEndText(false);  // Sicherstellen, dass Endtext ausgeblendet ist
                showStartText(); // Start-Text anzeigen
            }
        }
    };

    ws.onclose = () => {
        console.warn('[Frontend Timer] WebSocket-Verbindung geschlossen. Versuche, in 5 Sekunden erneut zu verbinden...');
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    };

    ws.onerror = (error) => {
        console.error('[Frontend Timer] WebSocket-Fehler:', error);
    };

    // --- Timer-Logik ---

    function getCurrentDigitValue(imgElement) {
        const imgSrc = imgElement.src;
        const match = imgSrc.match(/Timer_(\d)/);
        return match ? parseInt(match[1]) : 0;
    }

    function animateDigitRoll(obj, newVal) {
        if (!obj || !obj.top || !obj.bottom || !obj.wrapper) {
            console.error('animateDigitRoll: Eines der Ziffern-Objekte oder seine Eigenschaften ist null/undefined.', obj);
            return;
        }

        const currentVal = getCurrentDigitValue(obj.top);

        if (currentVal === newVal) {
            obj.wrapper.classList.remove('animate');
            obj.top.src = `timerNumbers/Timer_${newVal}.png`;
            obj.bottom.src = `timerNumbers/Timer_${newVal}.png`;
            return;
        }

        obj.wrapper.classList.remove('animate');
        obj.top.src = `timerNumbers/Timer_${currentVal}.png`;
        obj.bottom.src = `timerNumbers/Timer_${newVal}.png`;
        void obj.wrapper.offsetWidth; // Reflow erzwingen

        requestAnimationFrame(() => {
            void obj.wrapper.offsetWidth; // Weiteren Reflow erzwingen
            obj.wrapper.classList.add('animate');

            const handleAnimationEnd = function () {
                obj.top.src = `timerNumbers/Timer_${newVal}.png`;
                obj.wrapper.classList.remove('animate');
                void obj.wrapper.offsetWidth; // Reflow nach Reset
                obj.wrapper.removeEventListener('animationend', handleAnimationEnd);
            };

            if (obj.wrapper) {
                obj.wrapper.addEventListener('animationend', handleAnimationEnd, { once: true });
            } else {
                console.error('animateDigitRoll: obj.wrapper ist null, kann keinen animationend Listener hinzufügen.');
            }
        });
    }

    function updateTimerDisplay(targetDigitElements, secondsRemaining) {
        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;

        const newMinTens = Math.floor(minutes / 10);
        const newMinOnes = minutes % 10;
        const newSecTens = Math.floor(seconds / 10);
        const newSecOnes = seconds % 10;

        animateDigitRoll(targetDigitElements[0], newMinTens);
        animateDigitRoll(targetDigitElements[1], newMinOnes);
        animateDigitRoll(targetDigitElements[2], newSecTens);
        animateDigitRoll(targetDigitElements[3], newSecOnes);
    }

    function initializeLayer(layerElements, initialMinutes, initialSeconds) {
        const initialMinTens = Math.floor(initialMinutes / 10);
        const initialMinOnes = initialMinutes % 10;
        const initialSecTens = Math.floor(initialSeconds / 10);
        const initialSecOnes = initialSeconds % 10;

        layerElements.forEach((obj, index) => {
            if (!obj || !obj.top || !obj.bottom || !obj.wrapper) {
                console.error(`initializeLayer: Element am Index ${index} oder seine Eigenschaften ist null/undefined.`, obj);
                return;
            }
            obj.wrapper.classList.remove('animate'); // Sicherstellen, dass keine Animation läuft
            void obj.wrapper.offsetWidth; // Reflow
            obj.top.src = `timerNumbers/Timer_${[initialMinTens, initialMinOnes, initialSecTens, initialSecOnes][index]}.png`;
            obj.bottom.src = `timerNumbers/Timer_${[initialMinTens, initialMinOnes, initialSecTens, initialSecOnes][index]}.png`;
            void obj.wrapper.offsetWidth; // Reflow
        });
    }

    function startAndDisplayTimer(layerElements, totalSeconds) {
        currentSecondsRemaining = totalSeconds;
        initializeLayer(layerElements, Math.floor(currentSecondsRemaining / 60), currentSecondsRemaining % 60);
        updateTimerDisplay(layerElements, currentSecondsRemaining);

        if (currentTimerInterval) {
            clearInterval(currentTimerInterval);
        }

        currentTimerInterval = setInterval(() => {
            if (currentSecondsRemaining <= 0) {
                clearInterval(currentTimerInterval);
                currentTimerInterval = null;
                console.log(`Timer beendet!`);
                hideTimerAndShowEndText();
            } else {
                currentSecondsRemaining--;
                updateTimerDisplay(layerElements, currentSecondsRemaining);
            }
        }, 1000);
    }

    function stopTimer() {
        if (currentTimerInterval) {
            clearInterval(currentTimerInterval);
            currentTimerInterval = null;
            console.log("Timer gestoppt.");
        }
    }

    // Funktion zum Anzeigen des Start-Text-Bildes
    function showStartText() {
        startTextImage.classList.remove('hidden');
        startTextImage.classList.remove('animate-out');
        startTextImage.classList.add('animate-in');

        startTextImage.addEventListener('animationend', function handler() {
            startTextImage.classList.remove('animate-in');
            startTextImage.removeEventListener('animationend', handler);
        }, { once: true });
        console.log('[Frontend Timer] Start-Text-Bild angezeigt.');
    }

    // Funktion zum Ausblenden des Start-Text-Bildes
    // Jetzt mit optionalem Callback, der nach der Animation ausgeführt wird
    function hideStartText(animated = true, callback = () => { }) {
        if (!startTextImage.classList.contains('hidden')) {
            if (animated) {
                startTextImage.classList.add('animate-out');
                startTextImage.classList.remove('animate-in');

                startTextImage.addEventListener('animationend', function handler() {
                    startTextImage.classList.add('hidden');
                    startTextImage.classList.remove('animate-out');
                    startTextImage.removeEventListener('animationend', handler);
                    callback(); // Führt den Callback nach Abschluss der Animation aus
                }, { once: true });
            } else {
                startTextImage.classList.add('hidden');
                startTextImage.classList.remove('animate-in', 'animate-out');
                callback(); // Führt den Callback sofort aus, wenn nicht animiert
            }
            console.log('[Frontend Timer] Start-Text-Bild ausgeblendet.');
        } else {
            // Wenn Start-Text bereits hidden ist, führe Callback sofort aus
            callback();
        }
    }

    // Timer-Wrapper anzeigen
    function showTimerWrapper() {
        timersWrapper.classList.remove('hidden');
        timersWrapper.classList.remove('animate-out');
        timersWrapper.classList.add('animate-in');
        timersWrapper.addEventListener('animationend', function handler() {
            timersWrapper.classList.remove('animate-in');
            timersWrapper.removeEventListener('animationend', handler);
        }, { once: true });
        console.log('[Frontend Timer] Timer-Wrapper angezeigt.');
    }

    // Timer-Wrapper ausblenden
    function hideTimerWrapper() {
        if (!timersWrapper.classList.contains('hidden')) {
            timersWrapper.classList.add('animate-out');
            timersWrapper.addEventListener('animationend', function handler() {
                timersWrapper.classList.add('hidden');
                timersWrapper.classList.remove('animate-out');
                timersWrapper.removeEventListener('animationend', handler);
            }, { once: true });
            console.log('[Frontend Timer] Timer-Wrapper ausgeblendet.');
        }
    }

    // Timer ausblenden und Endtext anzeigen
    function hideTimerAndShowEndText() {
        if (!timersWrapper.classList.contains('hidden')) {
            timersWrapper.classList.add('animate-out');
            timersWrapper.addEventListener('animationend', function handler() {
                timersWrapper.classList.add('hidden');
                timersWrapper.classList.remove('animate-out');
                timersWrapper.removeEventListener('animationend', handler);
                showEndText();
            }, { once: true });
        } else {
            showEndText();
        }
        hideStartText(false); // Sicherstellen, dass Start-Text ausgeblendet ist (ohne Animation)
        console.log('[Frontend Timer] Timer wird ausgeblendet und Endtext angezeigt.');
    }

    // Funktion zum Anzeigen des Endtextes
    function showEndText() {
        endText.classList.remove('hidden');
        endText.classList.remove('animate-out');
        endText.classList.add('animate-in');
        endText.addEventListener('animationend', function handler() {
            endText.classList.remove('animate-in');
            endText.removeEventListener('animationend', handler);
        }, { once: true });
        console.log('[Frontend Timer] End-Text angezeigt.');
    }

    // Funktion zum Verstecken des Endtextes
    function hideEndText(animated = true) {
        if (!endText.classList.contains('hidden')) {
            if (animated) {
                endText.classList.add('animate-out');
                endText.addEventListener('animationend', function handler() {
                    endText.classList.add('hidden');
                    endText.classList.remove('animate-out');
                    endText.removeEventListener('animationend', handler);
                }, { once: true });
            } else {
                endText.classList.add('hidden');
                endText.classList.remove('animate-in', 'animate-out');
            }
            console.log('[Frontend Timer] End-Text ausgeblendet.');
        }
    }

    // Beim Laden der Seite den Start-Text anzeigen und Timer/Endtext verstecken
    timersWrapper.classList.add('hidden');
    endText.classList.add('hidden');

    startTextImage.classList.remove('hidden');
    startTextImage.classList.add('animate-in');
    startTextImage.addEventListener('animationend', function handler() {
        startTextImage.classList.remove('animate-in');
        startTextImage.removeEventListener('animationend', handler);
    }, { once: true });
    console.log('[Frontend Timer] Initialer Zustand: Start-Text-Bild angezeigt.');
});