document.addEventListener('DOMContentLoaded', () => {
    const drawButton = document.getElementById('drawButton');
    const resultsTray = document.getElementById('resultsTray');
    const glassDome = document.querySelector('.glass-dome');
    const mixingBallsContainer = document.getElementById('mixingBalls');
    const outputChute = document.querySelector('.output-chute');

    // Audio Objects
    const sounds = {
        button: new Audio('sounds/button.mp3'),
        mixing: new Audio('sounds/mixing.mp3'),
        pop: new Audio('sounds/pop.mp3'),
        complete: new Audio('sounds/complete.mp3')
    };

    // Configure loop for mixing sound
    sounds.mixing.loop = true;

    drawButton.addEventListener('click', startLottery);

    async function startLottery() {
        if (drawButton.disabled) return;
        
        // Play Button Sound
        playSound('button');

        // 1. Reset state
        drawButton.disabled = true;
        resultsTray.innerHTML = '';
        mixingBallsContainer.innerHTML = '';
        
        // 2. Generate 6 unique numbers
        const numbers = generateLottoNumbers();
        
        // 3. Start Mixing Animation
        glassDome.classList.add('shake');
        startMixingAnimation();
        playSound('mixing');

        // 4. Draw balls sequentially
        for (let i = 0; i < numbers.length; i++) {
            // Wait random time between 1s and 2s
            await wait(1000 + Math.random() * 500); 
            
            await animateBallDraw(numbers[i]);
        }

        // 5. Cleanup
        await wait(500);
        glassDome.classList.remove('shake');
        stopMixingAnimation();
        stopSound('mixing');
        
        playSound('complete');
        drawButton.disabled = false;
    }

    function playSound(name) {
        if (sounds[name]) {
            sounds[name].currentTime = 0;
            sounds[name].play().catch(e => console.log("Audio play failed (user interaction needed?):", e));
        }
    }

    function stopSound(name) {
        if (sounds[name]) {
            sounds[name].pause();
            sounds[name].currentTime = 0;
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
        // 1. Prepare Tray Slot (Placeholder)
        const placeholder = document.createElement('div');
        placeholder.classList.add('ball', 'ball-placeholder'); // Invisible but takes space
        resultsTray.appendChild(placeholder);

        // 2. Get Coordinates
        const chuteRect = outputChute.getBoundingClientRect();
        const placeholderRect = placeholder.getBoundingClientRect();
        
        // Center of the screen (or container) for the "Big Focus" moment
        // Let's use the center of the container
        const containerRect = document.querySelector('.container').getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2 - 20; // -20 for half ball size
        const centerY = containerRect.top + 150; // A bit down from top

        // 3. Create Flying Ball at Chute
        const ball = document.createElement('div');
        ball.classList.add('ball', 'active-ball');
        ball.classList.add(getColorClass(number));
        ball.textContent = number;
        
        // Initial Position: Chute
        ball.style.left = `${chuteRect.left + chuteRect.width/2 - 20}px`; // Center of chute
        ball.style.top = `${chuteRect.top}px`;
        ball.style.transform = 'scale(0.5)';
        document.body.appendChild(ball);

        // Play Pop Sound
        playSound('pop');

        // 4. Phase 1: Move to Center, Scale Up, Blink
        // Force reflow
        ball.offsetHeight;
        
        ball.style.left = `${centerX}px`;
        ball.style.top = `${centerY}px`;
        ball.style.transform = 'scale(2.5)'; // Big
        
        await wait(500); // Wait for move to center
        
        // Start Blinking
        ball.classList.add('blink-anim');
        await wait(600); // Blink for a bit
        ball.classList.remove('blink-anim');

        // 5. Phase 2: Move to Tray Slot (Shrink)
        ball.style.left = `${placeholderRect.left}px`;
        ball.style.top = `${placeholderRect.top}px`;
        ball.style.transform = 'scale(1)';

        await wait(500); // Wait for move to tray

        // 6. Finalize
        ball.remove();
        placeholder.classList.remove('ball-placeholder');
        placeholder.classList.add(getColorClass(number)); // Apply color
        placeholder.textContent = number;
        // Make it visible and styled as a normal result ball
        placeholder.style.visibility = 'visible';
    }

    function getColorClass(number) {
        if (number <= 10) return 'yellow';
        if (number <= 20) return 'blue';
        if (number <= 30) return 'red';
        if (number <= 40) return 'gray';
        return 'green';
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let mixingInterval;
    function startMixingAnimation() {
        // Create mixing balls with random numbers
        for (let i = 0; i < 15; i++) {
            const ball = document.createElement('div');
            ball.classList.add('mixing-ball');
            
            // Random Number for visuals
            const randomNum = Math.floor(Math.random() * 45) + 1;
            ball.textContent = randomNum;
            // ball.style.color = 'black'; // text color
            
            // Random Color (Visual only, doesn't match number strictly for mixing chaos?) 
            // Actually let's match logic for better realism
            const colorClass = getColorClass(randomNum);
            // We need to map class to hex/color because mixing balls use inline style or we can just add class
            // Let's just add the class but we need to override position relative to static?
            // Mixing balls are absolute.
            
            // Let's just manually set background based on number to keep it simple
            let color = '#fbc400';
            if (randomNum > 10) color = '#69c8f2';
            if (randomNum > 20) color = '#ff7272';
            if (randomNum > 30) color = '#aaaaaa';
            if (randomNum > 40) color = '#b0d840';
            
            ball.style.background = color;
            ball.style.left = Math.random() * 200 + 'px';
            ball.style.top = Math.random() * 200 + 'px';
            mixingBallsContainer.appendChild(ball);
        }

        // Move them around randomly
        mixingInterval = setInterval(() => {
            const balls = mixingBallsContainer.children;
            for (let ball of balls) {
                ball.style.left = Math.random() * 220 + 'px';
                ball.style.top = Math.random() * 220 + 'px';
                // Rotate too
                ball.style.transform = `rotate(${Math.random() * 360}deg)`;
            }
        }, 100);
    }

    function stopMixingAnimation() {
        clearInterval(mixingInterval);
        mixingBallsContainer.innerHTML = '';
    }
});