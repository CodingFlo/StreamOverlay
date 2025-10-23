document.addEventListener('DOMContentLoaded', () => {
    const digitElementsLayer1 = [
        { wrapper: document.querySelector('#min-tens-top-1').closest('.digit-wrapper'), top: document.getElementById('min-tens-top-1'), bottom: document.getElementById('min-tens-bottom-1') },
        { wrapper: document.querySelector('#min-ones-top-1').closest('.digit-wrapper'), top: document.getElementById('min-ones-top-1'), bottom: document.getElementById('min-ones-bottom-1') },
        { wrapper: document.querySelector('#sec-tens-top-1').closest('.digit-wrapper'), top: document.getElementById('sec-tens-top-1'), bottom: document.getElementById('sec-tens-bottom-1') },
        { wrapper: document.querySelector('#sec-ones-top-1').closest('.digit-wrapper'), top: document.getElementById('sec-ones-top-1'), bottom: document.getElementById('sec-ones-bottom-1') }
    ];

    const timersWrapper = document.getElementById('timers-wrapper');

    // Starte bei 0 Sekunden für einen Aufwärts-Timer
    let initialTotalSeconds = 0;
    let currentTimerInterval = null;
    let currentSecondsElapsed = initialTotalSeconds; // Umbenannt, da wir hochzählen

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

    function updateTimerDisplay(targetDigitElements, secondsElapsed) {
        const totalSeconds = secondsElapsed; // Umbenannt für Klarheit
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const newMinTens = Math.floor(minutes / 10) % 10; // Stelle sicher, dass es nur 2 Ziffern sind (mod 10)
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

    // Funktion zum Starten des AUFWÄRTS zählenden Timers
    function startAndDisplayTimer(layerElements, initialSeconds = 0) {
        currentSecondsElapsed = initialSeconds; // Setze den Startwert
        initializeLayer(layerElements, Math.floor(currentSecondsElapsed / 60), currentSecondsElapsed % 60);
        updateTimerDisplay(layerElements, currentSecondsElapsed);

        if (currentTimerInterval) {
            clearInterval(currentTimerInterval);
        }

        currentTimerInterval = setInterval(() => {
            currentSecondsElapsed++; // AUFWÄRTS ZÄHLEN
            updateTimerDisplay(layerElements, currentSecondsElapsed);

            // Optional: Logik für maximalen Wert (derzeit unbegrenzt)
            // if (currentSecondsElapsed >= 99 * 60 + 59) { /* ... */ }

        }, 1000);
        console.log(`Timer gestartet (aufwärts zählend ab ${initialSeconds} Sekunden).`);
    }


    function stopTimer() {
        if (currentTimerInterval) {
            clearInterval(currentTimerInterval);
            currentTimerInterval = null;
            console.log("Timer gestoppt.");
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

    timersWrapper.classList.remove('hidden'); // Direkt anzeigen
    // startTextImage ist entfernt

    // 🚀 STARTE DEN TIMER SOFORT UND AUFWÄRTS ZÄHLEND (Start bei 0)
    startAndDisplayTimer(digitElementsLayer1, initialTotalSeconds);
    showTimerWrapper();
    console.log('[Frontend Timer] Initialer Zustand: Timer gestartet und angezeigt.');
});