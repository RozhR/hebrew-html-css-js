/* =================== КАРТОЧКИ =================== */
function generateCards(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    data.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-front">${card.hebrew}</div>
                <div class="card-back">${card.russian}</div>
            </div>
        `;
        container.appendChild(cardEl);
    });

    // Добавляем обработчик переворота карточек
    container.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", () => card.classList.toggle("flipped"));
    });
}

/* =================== ПЕРЕМЕШИВАНИЕ КАРТОЧЕК =================== */
function shuffleCards() {
    const container = document.querySelector(".card-container");
    if (!container) return;

    const cards = Array.from(container.children);
    cards.forEach(card => card.classList.remove("flipped"));

    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    cards.forEach(card => container.appendChild(card));
}

/* =================== ТЕСТИРОВАНИЕ =================== */
let testData = [];
let testIndex = 0;
let correctAnswers = 0;
let currentCorrect = "";
let savedPage = "";
let currentLevelName = "";
let currentCategory = "verbs";
let timeLeft = 15;
let timerId = null;

function startTest() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    const title = document.getElementById("levelTitle");
    currentLevelName = title ? title.innerText.trim() : "Неизвестный уровень";

    const cards = Array.from(document.querySelectorAll(".card"));
    if (!cards.length) {
        alert("Бэацлаха хаверим!");
        return;
    }

    testData = cards.map(card => ({
        hebrew: card.querySelector(".card-front").innerText.trim(),
        russian: card.querySelector(".card-back").innerText.trim()
    }));

    currentCategory = document.body.dataset.category || "verbs";
    savedPage = mainContent.innerHTML;  // сохраняем только контент, а не весь body
    testIndex = 0;
    correctAnswers = 0;

    // Генерируем тест внутри mainContent
    mainContent.innerHTML = `
        <div id="testArea" class="test-area">
            <div id="progressText" class="progress-text"></div>
            <div id="progressBar" class="progress-bar">
                <div id="progressFill" class="progress-fill"></div>
            </div>
            <div id="timer" class="timer">⏳ 15</div>
            <div id="questionContainer" class="question-container"></div>
        </div>
    `;

    generateQuestion();
}

function animateQuestion() {
    const q = document.getElementById("questionContainer");
    q.style.opacity = "0";
    q.style.transform = "translateY(20px)";
    setTimeout(() => {
        q.style.opacity = "1";
        q.style.transform = "translateY(0)";
    }, 30);
}

function startTimer() {
    timeLeft = 15;
    document.getElementById("timer").innerText = `⏳ ${timeLeft}`;
    clearInterval(timerId);

    timerId = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").innerText = `⏳ ${timeLeft}`;

        if (timeLeft <= 0) {
            clearInterval(timerId);
            checkAnswer(null);
        }
    }, 1000);
}

function generateQuestion() {
    if (testIndex >= testData.length) {
        clearInterval(timerId);
        finishTest();
        return;
    }

    const q = testData[testIndex];
    currentCorrect = q.russian;

    document.getElementById("progressText").innerText =
        `Вопрос ${testIndex + 1} из ${testData.length}`;
    document.getElementById("progressFill").style.width =
        `${(testIndex / testData.length) * 100}%`;

    let answers = [q.russian];
    while (answers.length < 4) {
        const r = testData[Math.floor(Math.random() * testData.length)].russian;
        if (!answers.includes(r)) answers.push(r);
    }
    answers.sort(() => Math.random() - 0.5);

    document.getElementById("questionContainer").innerHTML = `
    <h1 class="question">${q.hebrew}</h1>
    <div class="answers-container">
        ${answers.map(a => `
            <button class="styled-btn" onclick="checkAnswer('${a}')">${a}</button>
        `).join("")}
    </div>
    <div id="result" class="result"></div>
`;

    animateQuestion();
    startTimer();
}

function checkAnswer(answer) {
    clearInterval(timerId);

    const result = document.getElementById("result");
    const ansButtons = document.querySelectorAll("#questionContainer button");
    ansButtons.forEach(b => b.disabled = true);

    if (answer === currentCorrect) {
        correctAnswers++;
        result.innerHTML = `<span class="correct">Верно!</span>`;
    } else {
        result.innerHTML = `
            <span class="wrong">Неверно!</span><br>
            <small>Правильный ответ: ${currentCorrect}</small>
        `;
    }

    result.innerHTML += `
        <br><br>
        <button class="styled-btn" onclick="nextQuestion()">Продолжить ➜</button>
    `;
}

function nextQuestion() {
    testIndex++;
    generateQuestion();
}

function finishTest() {
    const total = testData.length;
    const percent = Math.round((correctAnswers / total) * 100);
    saveStatistics(percent, correctAnswers, total);

    document.getElementById("testArea").innerHTML = `
        <h2>Результат: ${percent}%</h2>
        <p>Верных ответов: ${correctAnswers}/${total}</p>
        <button class="styled-btn" onclick="startTest()">Повторить тест</button>
        <br><br>
        <button class="styled-btn" onclick="restorePage()">Вернуться к изучению</button>
    `;
}

function restorePage() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;
    mainContent.innerHTML = savedPage;

    // Нужно заново привязать кнопку тестирования
    const testBtn = mainContent.querySelector(".functions button:nth-child(2)");
    if (testBtn) testBtn.addEventListener("click", startTest);

    // И перегенерировать карточки (если требуется)
    generateCards('cardContainer', testData);
}

/* =================== СТАТИСТИКА =================== */
function saveStatistics(percent, correct, total) {
    let stats = JSON.parse(localStorage.getItem("testStats") || "{}");

    if (!stats[currentLevelName]) stats[currentLevelName] = [];

    stats[currentLevelName].push({
        percent,
        correct,
        total,
        category: currentCategory,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("testStats", JSON.stringify(stats));
}

function loadStatistics() {
    const columns = {
        verbs: document.getElementById("verbsColumn"),
        adjectives: document.getElementById("adjectivesColumn"),
        adverbs: document.getElementById("adverbsColumn")
    };

    for (const col in columns) {
        if (columns[col]) {
            columns[col].innerHTML = `<h2>${
                col === 'verbs' ? 'Глаголы' :
                    col === 'adjectives' ? 'Прилагательные' : 'Наречия'
            }</h2>`;
        }
    }

    const stats = JSON.parse(localStorage.getItem("testStats") || "{}");

    for (const levelName in stats) {
        const attempts = stats[levelName];
        attempts.slice().reverse().forEach(a => {
            const column = columns[a.category] || columns.verbs;
            let color = a.percent >= 80 ? "#48bb78" : a.percent >= 50 ? "#f6e05e" : "#f56565";

            column.innerHTML += `
    <div class="stat-card">
        <div class="level-name">${levelName}</div>
        <div class="percent">${a.percent}% (${a.correct}/${a.total})</div>
        <div class="stat-progress">
            <div class="stat-progress-fill"
                 style="width:${a.percent}%; background:${color};">
            </div>
        </div>
        <div class="details">Дата: ${a.date}</div>
    </div>
`;
        });
    }
}

function clearStatistics() {
    if (confirm("Вы уверены, что хотите очистить всю статистику?")) {
        localStorage.removeItem("testStats");
        loadStatistics();
    }
}

/* =================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =================== */
document.addEventListener("DOMContentLoaded", () => {
    // Привязываем кнопку теста, если есть
    const testBtn = document.querySelector(".functions button:nth-child(2)");
    if (testBtn) testBtn.addEventListener("click", startTest);
});
