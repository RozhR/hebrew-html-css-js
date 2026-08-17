/* =========================================================
   КОНФИГУРАЦИЯ
   ========================================================= */

const CONFIG = {
    TEST_TIME: 15,
    PASS_PERCENT: 85,
    ANSWERS_COUNT: 4,
    STORAGE_KEYS: {
        STATS: "testStats",
        UNLOCKED_LEVELS: "unlockedLevels"
    }
};

/* =========================================================
   СОСТОЯНИЕ ТЕСТА
   ========================================================= */

const testState = {
    data: [],
    index: 0,
    correctAnswers: 0,
    currentCorrect: "",
    savedPage: "",
    currentLevelName: "",
    currentLevel: 1,
    currentCategory: "verbs",
    timeLeft: CONFIG.TEST_TIME,
    timerId: null
};

/* =========================================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ========================================================= */

function getElement(id) {
    return document.getElementById(id);
}

function getCurrentLevel() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("level")) || 1;
}

function getCurrentCategory() {
    return document.body.dataset.category || "verbs";
}

function getStorageData(key, fallback = {}) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
        console.error(`Ошибка чтения localStorage: ${key}`, error);
        return fallback;
    }
}

function setStorageData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Ошибка записи localStorage: ${key}`, error);
    }
}

function shuffleArray(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

/* =========================================================
   КАРТОЧКИ
   ========================================================= */

function generateCards(containerId, data) {
    const container = getElement(containerId);

    if (!container) return;

    container.innerHTML = "";

    data.forEach(({ hebrew, russian }) => {
        const card = document.createElement("div");

        card.className = "card";
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">${hebrew}</div>
                <div class="card-back">${russian}</div>
            </div>
        `;

        card.addEventListener("click", () => {
            card.classList.toggle("flipped");
        });

        container.appendChild(card);
    });
}

function shuffleCards() {
    const container = document.querySelector(".card-container");

    if (!container) return;

    const cards = Array.from(container.children);

    cards.forEach(card => card.classList.remove("flipped"));
    shuffleArray(cards).forEach(card => container.appendChild(card));
}

/* =========================================================
   ДОСТУП К УРОВНЯМ
   ========================================================= */

function isLevelUnlocked(category, level) {
    if (level === 1) return true;

    const unlockedLevels = getStorageData(CONFIG.STORAGE_KEYS.UNLOCKED_LEVELS);

    return unlockedLevels[category]?.includes(level) || false;
}

function unlockLevel(category, level) {
    const unlockedLevels = getStorageData(CONFIG.STORAGE_KEYS.UNLOCKED_LEVELS);

    if (!unlockedLevels[category]) {
        unlockedLevels[category] = [1];
    }

    if (!unlockedLevels[category].includes(level)) {
        unlockedLevels[category].push(level);
    }

    setStorageData(CONFIG.STORAGE_KEYS.UNLOCKED_LEVELS, unlockedLevels);
}

/* =========================================================
   ЗАГРУЗКА УРОВНЯ
   ========================================================= */

function loadLevel(data) {
    const level = getCurrentLevel();
    const category = getCurrentCategory();
    const levelTitle = getElement("levelTitle");
    const cardContainer = getElement("cardContainer");

    if (!cardContainer) return;

    if (levelTitle) {
        levelTitle.innerText = `Уровень ${level}`;
    }

    if (!isLevelUnlocked(category, level)) {
        renderLockedLevel(cardContainer, level);
        return;
    }

    const cardsData = data[level];

    if (!cardsData) {
        cardContainer.innerHTML = "<h2>Этот уровень пока не заполнен</h2>";
        return;
    }

    generateCards("cardContainer", cardsData);
}

function renderLockedLevel(container, level) {
    container.innerHTML = `
        <div class="locked-level">
            <h2>🔒 Уровень заблокирован</h2>
            <p>
                Для открытия уровня ${level} необходимо пройти уровень
                ${level - 1} минимум на ${CONFIG.PASS_PERCENT}%.
            </p>
        </div>
    `;
}

/* =========================================================
   ЗАПУСК ТЕСТА
   ========================================================= */

function startTest() {
    const mainContent = getElement("mainContent");

    if (!mainContent) return;

    const cards = Array.from(document.querySelectorAll(".card"));

    if (!cards.length) {
        alert("Нет карточек для тестирования");
        return;
    }

    initializeTestState(mainContent, cards);
    renderTestArea();
    generateQuestion();
}

function initializeTestState(mainContent, cards) {
    const title = getElement("levelTitle");

    testState.currentLevelName = title
        ? title.innerText.trim()
        : "Неизвестный уровень";

    testState.currentLevel = getCurrentLevel();
    testState.currentCategory = getCurrentCategory();

    testState.data = cards.map(card => ({
        hebrew: card.querySelector(".card-front")?.innerText.trim() || "",
        russian: card.querySelector(".card-back")?.innerText.trim() || ""
    }));

    testState.savedPage = mainContent.innerHTML;
    testState.index = 0;
    testState.correctAnswers = 0;
}

function restartTest() {
    if (!getElement("mainContent")) return;

    testState.index = 0;
    testState.correctAnswers = 0;

    renderTestArea();
    generateQuestion();
}

/* =========================================================
   ОБЛАСТЬ ТЕСТА
   ========================================================= */

function renderTestArea() {
    const mainContent = getElement("mainContent");

    if (!mainContent) return;

    mainContent.innerHTML = `
        <div id="testArea" class="test-area">
            <div id="progressText" class="progress-text"></div>

            <div id="progressBar" class="progress-bar">
                <div id="progressFill" class="progress-fill"></div>
            </div>

            <div id="timer" class="timer">⏳ ${CONFIG.TEST_TIME}</div>
            <div id="questionContainer" class="question-container"></div>
        </div>
    `;
}

/* =========================================================
   ГЕНЕРАЦИЯ ВОПРОСА
   ========================================================= */

function generateQuestion() {
    if (testState.index >= testState.data.length) {
        stopTimer();
        finishTest();
        return;
    }

    const question = testState.data[testState.index];

    testState.currentCorrect = question.russian;

    updateTestProgress();

    const answers = createAnswerOptions(question.russian);

    renderQuestion(question.hebrew, answers);
    animateQuestion();
    startTimer();
}

function updateTestProgress() {
    const progressText = getElement("progressText");
    const progressFill = getElement("progressFill");

    if (progressText) {
        progressText.innerText =
            `Вопрос ${testState.index + 1} из ${testState.data.length}`;
    }

    if (progressFill) {
        const progress = (testState.index / testState.data.length) * 100;
        progressFill.style.width = `${progress}%`;
    }
}

function createAnswerOptions(correctAnswer) {
    const answers = [correctAnswer];

    while (
        answers.length < CONFIG.ANSWERS_COUNT &&
        answers.length < testState.data.length
        ) {
        const randomIndex = Math.floor(Math.random() * testState.data.length);
        const randomAnswer = testState.data[randomIndex].russian;

        if (!answers.includes(randomAnswer)) {
            answers.push(randomAnswer);
        }
    }

    return shuffleArray(answers);
}

function renderQuestion(hebrew, answers) {
    const questionContainer = getElement("questionContainer");

    if (!questionContainer) return;

    questionContainer.innerHTML = `
        <h1 class="question">${hebrew}</h1>
        <div class="answers-container"></div>
        <div id="result" class="result"></div>
    `;

    const answersContainer = questionContainer.querySelector(".answers-container");

    if (!answersContainer) return;

    answers.forEach(answer => {
        const button = document.createElement("button");

        button.className = "styled-btn answer-btn";
        button.type = "button";
        button.innerText = answer;

        button.addEventListener("click", () => {
            checkAnswer(answer);
        });

        answersContainer.appendChild(button);
    });
}

function animateQuestion() {
    const questionContainer = getElement("questionContainer");

    if (!questionContainer) return;

    questionContainer.style.opacity = "0";
    questionContainer.style.transform = "translateY(20px)";

    setTimeout(() => {
        questionContainer.style.opacity = "1";
        questionContainer.style.transform = "translateY(0)";
    }, 30);
}

/* =========================================================
   ТАЙМЕР
   ========================================================= */

function startTimer() {
    const timer = getElement("timer");

    if (!timer) return;

    testState.timeLeft = CONFIG.TEST_TIME;

    updateTimer(timer);
    stopTimer();

    testState.timerId = setInterval(() => {
        testState.timeLeft--;

        updateTimer(timer);

        if (testState.timeLeft <= 0) {
            stopTimer();
            checkAnswer(null);
        }
    }, 1000);
}

function updateTimer(timer) {
    timer.innerText = `⏳ ${testState.timeLeft}`;
}

function stopTimer() {
    clearInterval(testState.timerId);
    testState.timerId = null;
}

/* =========================================================
   ПРОВЕРКА ОТВЕТА
   ========================================================= */

function checkAnswer(answer) {
    stopTimer();
    disableAnswerButtons();

    const isCorrect = answer === testState.currentCorrect;

    if (isCorrect) {
        testState.correctAnswers++;
    }

    renderAnswerResult(isCorrect);
}

function disableAnswerButtons() {
    const buttons = document.querySelectorAll(
        "#questionContainer .answer-btn"
    );

    buttons.forEach(button => {
        button.disabled = true;
    });
}

function renderAnswerResult(isCorrect) {
    const result = getElement("result");

    if (!result) return;

    result.innerHTML = isCorrect
        ? '<span class="correct">Верно!</span>'
        : `
            <span class="wrong">Неверно!</span>
            <br>
            <small>Правильный ответ: ${testState.currentCorrect}</small>
        `;

    const nextButton = document.createElement("button");

    nextButton.className = "styled-btn";
    nextButton.id = "nextQuestionBtn";
    nextButton.type = "button";
    nextButton.innerText = "Продолжить ➜";

    nextButton.addEventListener("click", nextQuestion);

    result.append(
        document.createElement("br"),
        document.createElement("br"),
        nextButton
    );
}

function nextQuestion() {
    testState.index++;
    generateQuestion();
}

/* =========================================================
   ЗАВЕРШЕНИЕ ТЕСТА
   ========================================================= */

function finishTest() {
    const total = testState.data.length;

    if (!total) return;

    const percent = Math.round(
        (testState.correctAnswers / total) * 100
    );

    saveStatistics(percent, testState.correctAnswers, total);
    unlockNextLevelIfPassed(percent);
    renderTestResult(percent, total);
}

function unlockNextLevelIfPassed(percent) {
    if (percent < CONFIG.PASS_PERCENT) return;

    unlockLevel(
        testState.currentCategory,
        testState.currentLevel + 1
    );
}

function renderTestResult(percent, total) {
    const testArea = getElement("testArea");

    if (!testArea) return;

    testArea.innerHTML = `
        <h2>Результат: ${percent}%</h2>

        <p>
            Верных ответов:
            ${testState.correctAnswers}/${total}
        </p>

        <button
            class="styled-btn"
            id="repeatTestBtn"
            type="button"
        >
            Повторить тест
        </button>

        <br><br>

        <button
            class="styled-btn"
            id="restorePageBtn"
            type="button"
        >
            Вернуться к изучению
        </button>
    `;

    getElement("repeatTestBtn")?.addEventListener("click", restartTest);
    getElement("restorePageBtn")?.addEventListener("click", restorePage);
}

/* =========================================================
   ВОЗВРАТ К КАРТОЧКАМ
   ========================================================= */

function restorePage() {
    const mainContent = getElement("mainContent");

    if (!mainContent) return;

    mainContent.innerHTML = testState.savedPage;

    generateCards("cardContainer", testState.data);
    bindStudyPageEvents();
}

/* =========================================================
   СТАТИСТИКА
   ========================================================= */

function saveStatistics(percent, correct, total) {
    const stats = getStorageData(CONFIG.STORAGE_KEYS.STATS);
    const category = testState.currentCategory;
    const level = testState.currentLevel;

    if (!stats[category]) {
        stats[category] = {};
    }

    if (!stats[category][level]) {
        stats[category][level] = [];
    }

    stats[category][level].push({
        percent,
        correct,
        total,
        date: new Date().toLocaleString()
    });

    setStorageData(CONFIG.STORAGE_KEYS.STATS, stats);
}

function loadStatistics() {
    const columns = getStatisticsColumns();

    resetStatisticsColumns(columns);

    const stats = getStorageData(CONFIG.STORAGE_KEYS.STATS);

    Object.entries(stats).forEach(([category, levels]) => {
        const column = columns[category];

        if (!column) return;

        Object.entries(levels).forEach(([level, attempts]) => {
            attempts
                .slice()
                .reverse()
                .forEach(attempt => {
                    renderStatisticsCard(column, level, attempt);
                });
        });
    });
}

function getStatisticsColumns() {
    return {
        verbs: getElement("verbsColumn"),
        adjectives: getElement("adjectivesColumn"),
        adverbs: getElement("adverbsColumn")
    };
}

function resetStatisticsColumns(columns) {
    const categoryNames = {
        verbs: "Глаголы",
        adjectives: "Прилагательные",
        adverbs: "Наречия"
    };

    Object.entries(columns).forEach(([category, column]) => {
        if (!column) return;

        column.innerHTML = `<h2>${categoryNames[category]}</h2>`;
    });
}

function renderStatisticsCard(column, level, attempt) {
    const color = getStatisticsColor(attempt.percent);

    column.insertAdjacentHTML(
        "beforeend",
        `
            <div class="stat-card">
                <div class="level-name">
                    Уровень ${level}
                </div>

                <div class="percent">
                    ${attempt.percent}%
                    (${attempt.correct}/${attempt.total})
                </div>

                <div class="stat-progress">
                    <div
                        class="stat-progress-fill"
                        style="
                            width: ${attempt.percent}%;
                            background: ${color};
                        "
                    ></div>
                </div>

                <div class="details">
                    Дата: ${attempt.date}
                </div>
            </div>
        `
    );
}

function getStatisticsColor(percent) {
    if (percent >= CONFIG.PASS_PERCENT) {
        return "#48bb78";
    }

    if (percent >= 50) {
        return "#f6e05e";
    }

    return "#f56565";
}

function clearStatistics() {
    const confirmed = confirm(
        "Вы уверены, что хотите очистить всю статистику?"
    );

    if (!confirmed) return;

    localStorage.removeItem(CONFIG.STORAGE_KEYS.STATS);
    loadStatistics();
}

/* =========================================================
   ОБРАБОТЧИКИ СОБЫТИЙ
   ========================================================= */

function bindStudyPageEvents() {
    getElement("testBtn")?.addEventListener("click", startTest);
    getElement("shuffleBtn")?.addEventListener("click", shuffleCards);
}

function bindStatisticsEvents() {
    getElement("clearStatisticsBtn")?.addEventListener(
        "click",
        clearStatistics
    );
}

/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    bindStudyPageEvents();
    bindStatisticsEvents();
});