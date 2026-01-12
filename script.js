document.addEventListener('DOMContentLoaded', () => {
    // Main Page Elements
    const drawButton = document.getElementById('drawButton');
    const resultsTray = document.getElementById('resultsTray');
    const glassDome = document.querySelector('.glass-dome');
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
        // Force Dark Mode through attribute
        document.documentElement.setAttribute('data-theme', 'dark');
        
        if (mixingBallsContainer) addInitialBalls();

        try {
            const res = await fetch('data_all.json');
            lottoAllData = await res.json();
            
            // If on stats page, trigger stats logic
            if (document.getElementById('freqChart')) {
                renderStatsPage(lottoAllData);
            }
        } catch (e) {
            console.error("데이터 로딩 실패", e);
        }
    }

    // --- Events ---
    if (drawButton) drawButton.addEventListener('click', startLottery);

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
        
        // 1. 번호별 당첨 빈도
        ballStatsContainer.innerHTML = '';
        currentNumbers.forEach(n => {
            const freq = lottoAllData.stats.data[n-1];
            const div = document.createElement('div');
            div.style.textAlign = 'center'; div.style.width = '40px'; div.style.fontSize = '0.7rem';
            div.innerHTML = `<span style="color:${getBallColor(n)}">${n}</span><br>(${freq}회)`;
            ballStatsContainer.appendChild(div);
        });

        // 2. 유사 번호 Top 3
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

        // 3. 100 Game Simulation vs Latest
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

        // 4. 10-Year Backtest (매주 1회 구매 시뮬레이션)
        const tenYearsHistory = lottoAllData.history.slice(0, 520);
        let backtestPrize = 0;
        let btCounts = { 1:0, 2:0, 3:0, 4:0, 5:0 };

        tenYearsHistory.forEach(h => {
            const hNums = [h.num1, h.num2, h.num3, h.num4, h.num5, h.num6];
            const match = currentNumbers.filter(x => hNums.includes(x)).length;
            if(match === 6) { backtestPrize += 2000000000; btCounts[1]++; }
            else if(match === 5 && currentNumbers.includes(h.bonus)) { backtestPrize += 50000000; btCounts[2]++; }
            else if(match === 5) { backtestPrize += 1500000; btCounts[3]++; }
            else if(match === 4) { backtestPrize += 50000; btCounts[4]++; }
            else if(match === 3) { backtestPrize += 5000; btCounts[5]++; }
        });

        const backtestResults = document.getElementById('backtestResults');
        if (backtestResults) {
            backtestResults.innerHTML = `
                <p>💰 10년 총 당첨금: <strong style="font-size: 1.1rem;">${backtestPrize.toLocaleString()}원</strong></p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px; font-size: 0.85rem;">
                    <div>3등 이상: ${btCounts[1] + btCounts[2] + btCounts[3]}회</div>
                    <div>4등(5만원): ${btCounts[4]}회</div>
                    <div>5등(5천원): ${btCounts[5]}회</div>
                    <div>구매 비용: 520,000원</div>
                </div>
                <p style="margin-top: 10px; font-size: 0.8rem; opacity: 0.8;">
                    * 지난 10년(520주) 동안 매주 이 번호 세트로 1게임씩 구매했다고 가정한 결과입니다.
                </p>
            `;
        }
        
        analysisReport.scrollIntoView({ behavior: 'smooth' });
    }

    function renderStatsPage(data) {
        const tbody = document.querySelector('#recentDrawsTable tbody');
        if (tbody) {
            tbody.innerHTML = '';
            data.history.slice(0, 15).forEach(draw => {
                const tr = document.createElement('tr');
                const balls = [draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6].map(n => 
                    `<span class="ball-small ${getColorClass(n)}">${n}</span>`).join('');
                tr.innerHTML = `<td>${draw.draw_no}회</td><td colspan="6">${balls}</td><td><span class="ball-small ${getColorClass(draw.bonus)}">${draw.bonus}</span></td>`;
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
            const stats = data.stats.data;
            let indexedStats = stats.map((val, idx) => ({ num: idx + 1, count: val }));
            indexedStats.sort((a, b) => b.count - a.count);
            const top5 = indexedStats.slice(0, 5);
            const bottom5 = indexedStats.slice(-5).reverse();

            // Recent Trend (last 15)
            let oddCount = 0;
            let rangeCounts = { 1:0, 10:0, 20:0, 30:0, 40:0 };
            const recent15 = data.history.slice(0, 15);
            recent15.forEach(draw => {
                [draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6].forEach(n => {
                    if(n % 2 !== 0) oddCount++;
                    const range = Math.floor((n-1)/10)*10 || 1;
                    if(rangeCounts.hasOwnProperty(range)) rangeCounts[range]++;
                    else rangeCounts[1]++;
                });
            });
            const oddP = ((oddCount / 90) * 100).toFixed(1);
            const mostActiveRange = Object.keys(rangeCounts).reduce((a, b) => rangeCounts[a] > rangeCounts[b] ? a : b);

            commentary.innerHTML = `
                <div style="font-size: 0.95rem; line-height: 1.8;">
                    <p>전체 <b>${data.history.length}회차</b>의 데이터를 정밀 분석한 결과입니다.</p>
                    <p style="margin-top:10px;">📊 <b>역대 빈출 번호:</b> 가장 많이 등장한 상위 5개 번호는 ${top5.map(i => `<b style="color:var(--primary-pink)">${i.num}번</b>(${i.count}회)`).join(', ')} 입니다.</p>
                    <p>❄️ <b>역대 저출 번호:</b> 반면 당첨 횟수가 가장 적은 하위 5개 번호는 ${bottom5.map(i => `<b style="color:var(--primary-cyan)">${i.num}번</b>(${i.count}회)`).join(', ')}로 나타났습니다.</p>
                    <p style="margin-top:10px;">📉 <b>최근 15회차 트렌드:</b> 최근 당첨 번호의 <b>홀짝 비율은 ${oddP}% : ${(100-oddP).toFixed(1)}%</b>로 ${oddP > 55 ? '홀수가 강세' : (oddP < 45 ? '짝수가 더 자주 출현' : '균형 잡힌 상태')}를 보이고 있습니다.</p>
                    <p>🎯 <b>번호대별 분포:</b> 최근 데이터에서는 <b>${mostActiveRange === '1' ? '1~10번' : mostActiveRange + '번'}대</b> 숫자들이 가장 활발하게 출현하고 있습니다.</p>
                    <p style="margin-top:15px; border-top: 1px solid #444; padding-top:10px; font-style: italic; color: #888;">
                        💡 <b>수학적 조언:</b> 과거의 당첨 데이터가 미래의 결과를 보장하지는 않으나, 극단적인 조합을 피하는 지표로 활용될 수 있습니다.
                    </p>
                </div>`;
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
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    function getColorClass(n) { return n<=10?'yellow':n<=20?'blue':n<=30?'red':n<=40?'gray':'green'; }
    function getBallColor(n) { return n<=10?'#fcee0a':n<=20?'#00f3ff':n<=30?'#ff00aa':n<=40?'#b0b0b0':'#0aff0a'; }
    function playSound(n) { try { sounds[n].currentTime=0; sounds[n].play(); } catch(e){} }
    function stopSound(n) { try { sounds[n].pause(); sounds[n].currentTime=0; } catch(e){} }
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