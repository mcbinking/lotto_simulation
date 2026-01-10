document.addEventListener('DOMContentLoaded', () => {
    const drawButton = document.getElementById('drawButton');
    const resultsTray = document.getElementById('resultsTray');
    const glassDome = document.querySelector('.glass-dome');
    const mixingBallsContainer = document.getElementById('mixingBalls');
    const outputChute = document.querySelector('.output-chute');
    
    // Toggles
    const langToggle = document.getElementById('langToggle');
    const themeToggle = document.getElementById('themeToggle');

    // Audio Objects
    const sounds = {
        button: new Audio('sounds/button.wav'),
        mixing: new Audio('sounds/mixing.wav'),
        pop: new Audio('sounds/pop.wav'),
        complete: new Audio('sounds/complete.wav')
    };
    sounds.mixing.loop = true;

    // --- Initialization ---
    init();

    function init() {
        // Load settings
        const storedLang = localStorage.getItem('lotto_lang') || 'ko';
        const storedTheme = localStorage.getItem('lotto_theme') || 'dark';
        
        setLanguage(storedLang);
        setTheme(storedTheme);
        
        // Add initial 45 balls only if container exists
        if (mixingBallsContainer) {
            addInitialBalls();
        }
    }

    // --- Event Listeners ---
    if (drawButton) {
        drawButton.addEventListener('click', startLottery);
    }
    
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const current = localStorage.getItem('lotto_lang') || 'ko';
            const next = current === 'ko' ? 'en' : 'ko';
            setLanguage(next);
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = localStorage.getItem('lotto_theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            setTheme(next);
        });
    }

    // --- Core Logic ---

    async function startLottery() {
        if (drawButton.disabled) return;
        
        // Stop Pulse
        drawButton.classList.remove('pulse-active');
        
        // Play Button Sound
        playSound('button');

        // Reset state
        drawButton.disabled = true;
        resultsTray.innerHTML = '';
        mixingBallsContainer.innerHTML = ''; // Clear initial balls
        
        // Generate numbers
        const numbers = generateLottoNumbers();
        
        // Start Mixing
        glassDome.classList.add('shake');
        startMixingAnimation();
        playSound('mixing');

        // Draw balls sequentially
        for (let i = 0; i < numbers.length; i++) {
            await wait(1000 + Math.random() * 500); 
            await animateBallDraw(numbers[i]);
        }

        // Cleanup
        await wait(500);
        glassDome.classList.remove('shake');
        stopMixingAnimation();
        stopSound('mixing');
        
        playSound('complete');
        drawButton.disabled = false;
        
        // Restore initial balls after a delay? Or leave empty?
        // User asked for "before pressing", implied state reset.
        // Let's refill after done.
        addInitialBalls();
    }

    function addInitialBalls() {
        mixingBallsContainer.innerHTML = '';
        for (let i = 1; i <= 45; i++) {
            const ball = document.createElement('div');
            ball.classList.add('mixing-ball'); // Re-use styling
            ball.textContent = i;
            
            // Set Color
            let color = getBallColor(i);
            ball.style.background = color;
            ball.style.color = 'white';
            ball.style.textShadow = '1px 1px 2px black';
            
            // Random Position
            ball.style.left = Math.random() * 210 + 'px';
            ball.style.top = Math.random() * 210 + 'px';
            
            mixingBallsContainer.appendChild(ball);
        }
    }

    function generateLottoNumbers() {
        const numbers = new Set();
        while (numbers.size < 6) {
            numbers.add(Math.floor(Math.random() * 45) + 1);
        }
        return Array.from(numbers);
    }

    async function animateBallDraw(number) {
        // Placeholder in tray
        const placeholder = document.createElement('div');
        placeholder.classList.add('ball', 'ball-placeholder');
        resultsTray.appendChild(placeholder);

        // Coordinates
        const chuteRect = outputChute.getBoundingClientRect();
        const placeholderRect = placeholder.getBoundingClientRect();
        const containerRect = document.querySelector('.container').getBoundingClientRect();
        
        // Center Target
        const centerX = containerRect.left + containerRect.width / 2 - 20; 
        const centerY = containerRect.top + 150; 

        // Flying Ball
        const ball = document.createElement('div');
        ball.classList.add('ball', 'active-ball');
        ball.classList.add(getColorClass(number));
        ball.textContent = number;
        
        // Start at Chute
        ball.style.left = `${chuteRect.left + chuteRect.width/2 - 20}px`;
        ball.style.top = `${chuteRect.top}px`;
        ball.style.transform = 'scale(0.5)';
        document.body.appendChild(ball);

        playSound('pop');

        // Move to Center
        ball.offsetHeight; // force reflow
        ball.style.left = `${centerX}px`;
        ball.style.top = `${centerY}px`;
        ball.style.transform = 'scale(2.5)';
        
        await wait(500); 
        
        // Blink
        ball.classList.add('blink-anim');
        await wait(600);
        ball.classList.remove('blink-anim');

        // Move to Tray
        ball.style.left = `${placeholderRect.left}px`;
        ball.style.top = `${placeholderRect.top}px`;
        ball.style.transform = 'scale(1)';

        await wait(500);

        // Dock
        ball.remove();
        placeholder.classList.remove('ball-placeholder');
        placeholder.classList.add(getColorClass(number));
        placeholder.textContent = number;
        placeholder.style.visibility = 'visible';
    }

    // --- Helpers ---

    function setLanguage(lang) {
        localStorage.setItem('lotto_lang', lang);
        
        // Update all data-lang elements
        document.querySelectorAll(`[data-${lang}]`).forEach(el => {
            el.innerText = el.getAttribute(`data-${lang}`);
        });

        // Update Toggle Text
        if (langToggle) {
            langToggle.innerText = lang === 'ko' ? 'ENG' : 'KOR';
        }
    }

    function setTheme(theme) {
        localStorage.setItem('lotto_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        
        if (themeToggle) {
            themeToggle.innerText = theme === 'dark' ? '🌞' : '🌙';
        }
    }

    function getColorClass(number) {
        if (number <= 10) return 'yellow';
        if (number <= 20) return 'blue';
        if (number <= 30) return 'red';
        if (number <= 40) return 'gray';
        return 'green';
    }

    function getBallColor(number) {
        // Hex codes matching CSS variables
        if (number <= 10) return '#fcee0a'; // Yellow
        if (number <= 20) return '#00f3ff'; // Cyan
        if (number <= 30) return '#ff00aa'; // Pink
        if (number <= 40) return '#b0b0b0'; // Gray
        return '#0aff0a'; // Green
    }

    function playSound(name) {
        if (sounds[name]) {
            sounds[name].currentTime = 0;
            sounds[name].play().catch(() => {});
        }
    }

    function stopSound(name) {
        if (sounds[name]) {
            sounds[name].pause();
            sounds[name].currentTime = 0;
        }
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Animation variables
    let mixingInterval;
    
    function startMixingAnimation() {
        // Create dynamic mixing balls
        for (let i = 0; i < 15; i++) {
            const ball = document.createElement('div');
            ball.classList.add('mixing-ball');
            
            const randomNum = Math.floor(Math.random() * 45) + 1;
            ball.textContent = randomNum;
            ball.style.background = getBallColor(randomNum);
            ball.style.color = 'white';
            ball.style.textShadow = '1px 1px 2px black';
            
            ball.style.left = Math.random() * 200 + 'px';
            ball.style.top = Math.random() * 200 + 'px';
            mixingBallsContainer.appendChild(ball);
        }

        // Animate
        mixingInterval = setInterval(() => {
            const balls = mixingBallsContainer.children;
            for (let ball of balls) {
                ball.style.left = Math.random() * 220 + 'px';
                ball.style.top = Math.random() * 220 + 'px';
                ball.style.transform = `rotate(${Math.random() * 360}deg)`;
            }
        }, 100);
    }

    function stopMixingAnimation() {
        clearInterval(mixingInterval);
        mixingBallsContainer.innerHTML = '';
    }
});
