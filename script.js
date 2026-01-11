document.addEventListener('DOMContentLoaded', () => {
    // Shared Elements
    const langToggle = document.getElementById('langToggle');
    const themeToggle = document.getElementById('themeToggle');
    
    // Main Page Elements
    const drawButton = document.getElementById('drawButton');
    const resultsTray = document.getElementById('resultsTray');
    const mixingBallsContainer = document.getElementById('mixingBalls');
    const outputChute = document.querySelector('.output-chute');
    const magicSpellInput = document.getElementById('magicSpell');
    const analysisReport = document.getElementById('analysisReport');
    const ballStatsContainer = document.getElementById('ballStats');
    const similarityReport = document.getElementById('similarityReport');
    const simulationResults = document.getElementById('simulationResults');

    let lottoAllData = null;

    // Audio
    const sounds = {
        button: new Audio('sounds/button.wav'),
        mixing: new Audio('sounds/mixing.wav'),
        pop: new Audio('sounds/pop.wav'),
        complete: new Audio('sounds/complete.wav')
    };
    if(sounds.mixing) sounds.mixing.loop = true;

    // --- Initialization ---
    init();

    async function init() {
        setLanguage(localStorage.getItem('lotto_lang') || 'ko');
        setTheme(localStorage.getItem('lotto_theme') || 'dark');
        
        if (mixingBallsContainer) addInitialBalls();

        try {
            const res = await fetch('data_all.json');
            lottoAllData = await res.json();
            console.log("Data All loaded:", lottoAllData.history.length);
            
            // If on stats page, trigger stats logic
            if (document.getElementById('freqChart')) {
                renderStatsPage(lottoAllData);
            }
        } catch (e) {
            console.error("Data load failed", e);
        }
    }

    // --- Events ---
    if (drawButton) drawButton.addEventListener('click', startLottery);
    if (langToggle) langToggle.addEventListener('click', () => setLanguage(localStorage.getItem('lotto_lang') === 'ko' ? 'en' : 'ko'));
    if (themeToggle) themeToggle.addEventListener('click', () => setTheme(localStorage.getItem('lotto_theme') === 'dark' ? 'light' : 'dark'));

    // --- Functions ---
    async function startLottery() {
        if (drawButton.disabled) return;
        drawButton.disabled = true;
        resultsTray.innerHTML = '';
        if(ballStatsContainer) ballStatsContainer.innerHTML = '';
        if(analysisReport) analysisReport.style.display = 'none';
        
        playSound('button');
        const seed = magicSpellInput ? magicSpellInput.value.trim() : null;
        const numbers = generateLottoNumbers(seed);

        document.querySelector('.glass-dome').classList.add('shake');
        startMixingAnimation();
        playSound('mixing');

        for (let i = 0; i < numbers.length; i++) {
            await wait(1000 + Math.random() * 500); 
            await animateBallDraw(numbers[i]);
        }

        document.querySelector('.glass-dome').classList.remove('shake');
        stopMixingAnimation();
        stopSound('mixing');
        playSound('complete');
        drawButton.disabled = false;
        addInitialBalls();

        if (lottoAllData) displayAnalysis(numbers);
    }

    function generateLottoNumbers(seed) {
        let rng = Math.random;
        if (seed) {
            let hash = 0;
            for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            let state = Math.abs(hash);
            rng = () => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; };
        }
        const nums = new Set();
        while (nums.size < 6) nums.add(Math.floor(rng() * 45) + 1);
        return Array.from(nums).sort((a,b) => a-b);
    }

    function displayAnalysis(currentNumbers) {
        analysisReport.style.display = 'block';
        
        // 1. Ball Frequencies
        ballStatsContainer.innerHTML = '';
        currentNumbers.forEach(n => {
            const freq = lottoAllData.stats.data[n-1];
            const div = document.createElement('div');
            div.style.textAlign = 'center'; div.style.width = '40px'; div.style.fontSize = '0.7rem';
            div.innerHTML = `<span style="color:${getBallColor(n)}">${n}</span><br>(${freq}회)`;
            ballStatsContainer.appendChild(div);
        });

        // 2. Similarity Top 3
        similarityReport.innerHTML = '';
        const matches = lottoAllData.history.map(h => {
            const hNums = [h.num1, h.num2, h.num3, h.num4, h.num5, h.num6];
            const intersect = currentNumbers.filter(x => hNums.includes(x));
            return { draw_no: h.draw_no, count: intersect.length, nums: intersect };
        }).sort((a, b) => b.count - a.count).slice(0, 3);

        matches.forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${m.draw_no}회</strong>: ${m.count}개 일치 (${m.nums.join(', ') || '없음'})`;
            similarityReport.appendChild(li);
        });

        // 3. 100 Game Simulation vs Latest (1205)
        const latest = lottoAllData.history[0];
        const winNums = [latest.num1, latest.num2, latest.num3, latest.num4, latest.num5, latest.num6];
        let totalPrize = 0;
        let counts = { 1:0, 2:0, 3:0, 4:0, 5:0 };
        const base4 = currentNumbers.slice(0, 4);

        for (let i = 0; i < 100; i++) {
            let combo = [...base4];
            while(combo.length < 6) {
                let r = Math.floor(Math.random()*45)+1;
                if(!combo.includes(r)) combo.push(r);
            }
            const match = combo.filter(x => winNums.includes(x)).length;
            if(match === 6) { totalPrize += 2000000000; counts[1]++; }
            else if(match === 5 && combo.includes(latest.bonus)) { totalPrize += 50000000; counts[2]++; }
            else if(match === 5) { totalPrize += 1500000; counts[3]++; }
            else if(match === 4) { totalPrize += 50000; counts[4]++; }
            else if(match === 3) { totalPrize += 5000; counts[5]++; }
        }

        simulationResults.innerHTML = `
            <p>💰 총 당첨금: <strong>${totalPrize.toLocaleString()}원</strong></p>
            <p style="font-size: 0.8rem; margin-top:5px;">4등: ${counts[4]}회 / 5등: ${counts[5]}회 (최신 ${latest.draw_no}회 대조)</p>
        `;
        analysisReport.scrollIntoView({ behavior: 'smooth' });
    }

    // Helper: Stats Page Rendering
    function renderStatsPage(data) {
        const tbody = document.querySelector('#recentDrawsTable tbody');
        if (tbody) {
            tbody.innerHTML = '';
            data.history.slice(0, 15).forEach(draw => {
                const tr = document.createElement('tr');
                const balls = [draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6].map(n => 
                    `<span class="ball-small ${getColorClass(n)}">${n}</span>`).join('');
                tr.innerHTML = `<td>${draw.draw_no}</td><td colspan="6">${balls}</td><td><span class="ball-small ${getColorClass(draw.bonus)}">${draw.bonus}</span></td>`;
                tbody.appendChild(tr);
            });
        }

        const ctx = document.getElementById('freqChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.stats.labels,
                    datasets: [{
                        data: data.stats.data,
                        backgroundColor: data.stats.labels.map(n => getBallColor(parseInt(n)))
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
        
        const commentary = document.getElementById('statsCommentary');
        if (commentary) {
            const stats = [...data.stats.data];
            const maxIdx = stats.indexOf(Math.max(...stats));
            commentary.innerHTML = `<p>역대 가장 많이 나온 번호는 <strong>${maxIdx+1}번</strong>입니다. 최근 10회차 데이터를 분석한 결과...</p>`;
        }
    }

    // --- UI Helpers ---
    function addInitialBalls() {
        mixingBallsContainer.innerHTML = '';
        for (let i = 1; i <= 45; i++) {
            const b = document.createElement('div');
            b.className = 'mixing-ball'; b.textContent = i;
            b.style.background = getBallColor(i);
            b.style.left = Math.random()*210+'px'; b.style.top = Math.random()*210+'px';
            mixingBallsContainer.appendChild(b);
        }
    }
    async function animateBallDraw(num) {
        const p = document.createElement('div'); p.className = 'ball ball-placeholder'; resultsTray.appendChild(p);
        const b = document.createElement('div'); b.className = 'ball active-ball ' + getColorClass(num); b.textContent = num;
        const chute = outputChute.getBoundingClientRect();
        b.style.left = (chute.left + chute.width/2 - 20) + 'px'; b.style.top = chute.top + 'px';
        document.body.appendChild(b);
        playSound('pop'); await wait(100);
        const rect = p.getBoundingClientRect();
        b.style.left = rect.left + 'px'; b.style.top = rect.top + 'px'; b.style.transform = 'scale(1)';
        await wait(600); b.remove(); p.className = 'ball ' + getColorClass(num); p.textContent = num;
    }
    function setLanguage(l) { localStorage.setItem('lotto_lang', l); document.querySelectorAll(`[data-${l}]`).forEach(e => e.innerText = e.getAttribute(`data-${l}`)); }
    function setTheme(t) { localStorage.setItem('lotto_theme', t); document.documentElement.setAttribute('data-theme', t); }
    function getColorClass(n) { return n<=10?'yellow':n<=20?'blue':n<=30?'red':n<=40?'gray':'green'; }
    function getBallColor(n) { return n<=10?'#fcee0a':n<=20?'#00f3ff':n<=30?'#ff00aa':n<=40?'#b0b0b0':'#0aff0a'; }
    function playSound(n) { try { sounds[n].currentTime=0; sounds[n].play(); } catch(e){} }
    function stopSound(n) { try { sounds[n].pause(); sounds[n].currentTime=0; } catch(e){} }
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    let mixInt;
    function startMixingAnimation() {
        mixInt = setInterval(() => {
            Array.from(mixingBallsContainer.children).forEach(b => {
                b.style.left = Math.random()*220+'px'; b.style.top = Math.random()*220+'px';
            });
        }, 100);
    }
    function stopMixingAnimation() { clearInterval(mixInt); mixingBallsContainer.innerHTML = ''; }
});
