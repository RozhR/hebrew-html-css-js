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
    timeLeft: 15,
    timerId: null
};


/* =========================================================
   УНИВЕРСАЛЬНОЕ ПЕРЕМЕШИВАНИЕ МАССИВА
   ========================================================= */

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
    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = "";

    data.forEach(card => {
        const cardEl = document.createElement("div");

        cardEl.className = "card";

        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    ${card.hebrew}
                </div>

                <div class="card-back">
                    ${card.russian}
                </div>
            </div>
        `;

        cardEl.addEventListener("click", () => {
            cardEl.classList.toggle("flipped");
        });

        container.appendChild(cardEl);
    });
}


/* =========================================================
   ПЕРЕМЕШИВАНИЕ КАРТОЧЕК
   ========================================================= */

function shuffleCards() {
    const container = document.querySelector(".card-container");

    if (!container) return;

    const cards = Array.from(container.children);

    cards.forEach(card => {
        card.classList.remove("flipped");
    });

    const shuffledCards = shuffleArray(cards);

    shuffledCards.forEach(card => {
        container.appendChild(card);
    });
}


/* =========================================================
   ПРОВЕРКА ДОСТУПА К УРОВНЮ
   ========================================================= */

function isLevelUnlocked(category, level) {
    if (level === 1) {
        return true;
    }

    const unlockedLevels = JSON.parse(
        localStorage.getItem("unlockedLevels") || "{}"
    );

    return unlockedLevels[category]?.includes(level) || false;
}

function unlockLevel(category, level) {
    const unlockedLevels = JSON.parse(
        localStorage.getItem("unlockedLevels") || "{}"
    );

    if (!unlockedLevels[category]) {
        unlockedLevels[category] = [1];
    }

    if (!unlockedLevels[category].includes(level)) {
        unlockedLevels[category].push(level);
    }

    localStorage.setItem(
        "unlockedLevels",
        JSON.stringify(unlockedLevels)
    );
}


/* =========================================================
   ЗАГРУЗКА УРОВНЯ
   ========================================================= */

function loadLevel(data) {
    const params = new URLSearchParams(window.location.search);
    const level = Number(params.get("level")) || 1;
    const category = document.body.dataset.category;

    const levelTitle = document.getElementById("levelTitle");
    const cardContainer = document.getElementById("cardContainer");

    if (!cardContainer) return;

    if (levelTitle) {
        levelTitle.innerText = `Уровень ${level}`;
    }

    if (!isLevelUnlocked(category, level)) {
        cardContainer.innerHTML = `
            <div class="locked-level">
                <h2>
                    🔒 Уровень заблокирован
                </h2>

                <p>
                    Для открытия уровня ${level}
                    необходимо пройти уровень
                    ${level - 1}
                    минимум на 85%.
                </p>
            </div>
        `;

        return;
    }

    const cardsData = data[level];

    if (cardsData) {
        generateCards("cardContainer", cardsData);
    } else {
        cardContainer.innerHTML = `
            <h2>
                Этот уровень пока не заполнен
            </h2>
        `;
    }
}


/* =========================================================
   НАЧАЛО ТЕСТА
   ========================================================= */

function startTest() {
    const mainContent = document.getElementById("mainContent");

    if (!mainContent) return;

    const title = document.getElementById("levelTitle");

    testState.currentLevelName = title
        ? title.innerText.trim()
        : "Неизвестный уровень";

    const params = new URLSearchParams(window.location.search);

    testState.currentLevel = Number(params.get("level")) || 1;
    testState.currentCategory = document.body.dataset.category || "verbs";

    const cards = Array.from(
        document.querySelectorAll(".card")
    );

    if (!cards.length) {
        alert("Нет карточек для тестирования");
        return;
    }

    testState.data = cards.map(card => ({
        hebrew: card
            .querySelector(".card-front")
            .innerText
            .trim(),

        russian: card
            .querySelector(".card-back")
            .innerText
            .trim()
    }));

    testState.savedPage = mainContent.innerHTML;

    testState.index = 0;
    testState.correctAnswers = 0;

    renderTestArea();
    generateQuestion();
}


/* =========================================================
   ПОВТОРНЫЙ ЗАПУСК ТЕСТА
   ========================================================= */

function restartTest() {
    const mainContent = document.getElementById("mainContent");

    if (!mainContent) return;

    testState.index = 0;
    testState.correctAnswers = 0;

    renderTestArea();
    generateQuestion();
}


/* =========================================================
   ОТРИСОВКА ОБЛАСТИ ТЕСТА
   ========================================================= */

function renderTestArea() {
    const mainContent = document.getElementById("mainContent");

    if (!mainContent) return;

    mainContent.innerHTML = `
        <div id="testArea" class="test-area">
            <div
                id="progressText"
                class="progress-text"
            ></div>

            <div
                id="progressBar"
                class="progress-bar"
            >
                <div
                    id="progressFill"
                    class="progress-fill"
                ></div>
            </div>

            <div
                id="timer"
                class="timer"
            >
                ⏳ 15
            </div>

            <div
                id="questionContainer"
                class="question-container"
            ></div>
        </div>
    `;
}


/* =========================================================
   ГЕНЕРАЦИЯ ВОПРОСА
   ========================================================= */

function generateQuestion() {
    if (testState.index >= testState.data.length) {
        clearInterval(testState.timerId);
        finishTest();
        return;
    }

    const question = testState.data[testState.index];

    testState.currentCorrect = question.russian;

    const progressText = document.getElementById("progressText");
    const progressFill = document.getElementById("progressFill");

    if (progressText) {
        progressText.innerText =
            `Вопрос ${testState.index + 1} из ${testState.data.length}`;
    }

    if (progressFill) {
        progressFill.style.width =
            `${(testState.index / testState.data.length) * 100}%`;
    }

    let answers = [
        question.russian
    ];

    while (
        answers.length < 4 &&
        answers.length < testState.data.length
        ) {
        const randomItem =
            testState.data[
                Math.floor(Math.random() * testState.data.length)
                ];

        const randomAnswer = randomItem.russian;

        if (!answers.includes(randomAnswer)) {
            answers.push(randomAnswer);
        }
    }

    answers = shuffleArray(answers);

    const questionContainer =
        document.getElementById("questionContainer");

    if (!questionContainer) return;

    questionContainer.innerHTML = `
        <h1 class="question">
            ${question.hebrew}
        </h1>

        <div class="answers-container">
            ${answers
        .map(answer => `
                    <button
                        class="styled-btn answer-btn"
                        data-answer="${answer}"
                    >
                        ${answer}
                    </button>
                `)
        .join("")}
        </div>

        <div
            id="result"
            class="result"
        ></div>
    `;

    const answerButtons =
        document.querySelectorAll(".answer-btn");

    answerButtons.forEach(button => {
        button.addEventListener("click", () => {
            checkAnswer(button.dataset.answer);
        });
    });

    animateQuestion();
    startTimer();
}


/* =========================================================
   АНИМАЦИЯ ВОПРОСА
   ========================================================= */

function animateQuestion() {
    const questionContainer =
        document.getElementById("questionContainer");

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
    testState.timeLeft = 15;

    const timer = document.getElementById("timer");

    if (!timer) return;

    timer.innerText = `⏳ ${testState.timeLeft}`;

    clearInterval(testState.timerId);

    testState.timerId = setInterval(() => {
        testState.timeLeft--;

        timer.innerText = `⏳ ${testState.timeLeft}`;

        if (testState.timeLeft <= 0) {
            clearInterval(testState.timerId);
            checkAnswer(null);
        }
    }, 1000);
}


/* =========================================================
   ПРОВЕРКА ОТВЕТА
   ========================================================= */

function checkAnswer(answer) {
    clearInterval(testState.timerId);

    const result = document.getElementById("result");

    if (!result) return;

    const answerButtons =
        document.querySelectorAll("#questionContainer button");

    answerButtons.forEach(button => {
        button.disabled = true;
    });

    if (answer === testState.currentCorrect) {
        testState.correctAnswers++;

        result.innerHTML = `
            <span class="correct">
                Верно!
            </span>
        `;
    } else {
        result.innerHTML = `
            <span class="wrong">
                Неверно!
            </span>

            <br>

            <small>
                Правильный ответ:
                ${testState.currentCorrect}
            </small>
        `;
    }

    result.innerHTML += `
        <br><br>

        <button
            class="styled-btn"
            id="nextQuestionBtn"
        >
            Продолжить ➜
        </button>
    `;

    const nextQuestionBtn =
        document.getElementById("nextQuestionBtn");

    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener(
            "click",
            nextQuestion
        );
    }
}


/* =========================================================
   СЛЕДУЮЩИЙ ВОПРОС
   ========================================================= */

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

    saveStatistics(
        percent,
        testState.correctAnswers,
        total
    );

    if (percent >= 85) {
        unlockLevel(
            testState.currentCategory,
            testState.currentLevel + 1
        );
    }

    const testArea = document.getElementById("testArea");

    if (!testArea) return;

    testArea.innerHTML = `
        <h2>
            Результат:
            ${percent}%
        </h2>

        <p>
            Верных ответов:
            ${testState.correctAnswers}/${total}
        </p>

        <button
            class="styled-btn"
            id="repeatTestBtn"
        >
            Повторить тест
        </button>

        <br><br>

        <button
            class="styled-btn"
            id="restorePageBtn"
        >
            Вернуться к изучению
        </button>
    `;

    const repeatTestBtn =
        document.getElementById("repeatTestBtn");

    const restorePageBtn =
        document.getElementById("restorePageBtn");

    if (repeatTestBtn) {
        repeatTestBtn.addEventListener(
            "click",
            restartTest
        );
    }

    if (restorePageBtn) {
        restorePageBtn.addEventListener(
            "click",
            restorePage
        );
    }
}


/* =========================================================
   ВОЗВРАТ К КАРТОЧКАМ
   ========================================================= */

function restorePage() {
    const mainContent = document.getElementById("mainContent");

    if (!mainContent) return;

    mainContent.innerHTML = testState.savedPage;

    generateCards(
        "cardContainer",
        testState.data
    );

    const testBtn = document.getElementById("testBtn");
    const shuffleBtn = document.getElementById("shuffleBtn");

    if (testBtn) {
        testBtn.addEventListener("click", startTest);
    }

    if (shuffleBtn) {
        shuffleBtn.addEventListener("click", shuffleCards);
    }
}


/* =========================================================
   СОХРАНЕНИЕ СТАТИСТИКИ
   ========================================================= */

function saveStatistics(percent, correct, total) {
    const stats = JSON.parse(
        localStorage.getItem("testStats") || "{}"
    );

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

    localStorage.setItem(
        "testStats",
        JSON.stringify(stats)
    );
}


/* =========================================================
   ЗАГРУЗКА СТАТИСТИКИ
   ========================================================= */

function loadStatistics() {
    const columns = {
        verbs: document.getElementById("verbsColumn"),
        adjectives: document.getElementById("adjectivesColumn"),
        adverbs: document.getElementById("adverbsColumn")
    };

    const categoryNames = {
        verbs: "Глаголы",
        adjectives: "Прилагательные",
        adverbs: "Наречия"
    };

    for (const category in columns) {
        if (columns[category]) {
            columns[category].innerHTML =
                `<h2>${categoryNames[category]}</h2>`;
        }
    }

    const stats = JSON.parse(
        localStorage.getItem("testStats") || "{}"
    );

    for (const category in stats) {
        const column = columns[category];

        if (!column) continue;

        const levels = stats[category];

        for (const level in levels) {
            const attempts = levels[level];

            attempts
                .slice()
                .reverse()
                .forEach(attempt => {
                    let color;

                    if (attempt.percent >= 85) {
                        color = "#48bb78";
                    } else if (attempt.percent >= 50) {
                        color = "#f6e05e";
                    } else {
                        color = "#f56565";
                    }

                    column.innerHTML += `
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
                                Дата:
                                ${attempt.date}
                            </div>
                        </div>
                    `;
                });
        }
    }
}


/* =========================================================
   ОЧИСТКА СТАТИСТИКИ
   ========================================================= */

function clearStatistics() {
    const confirmed = confirm(
        "Вы уверены, что хотите очистить всю статистику?"
    );

    if (!confirmed) return;

    localStorage.removeItem("testStats");

    loadStatistics();
}


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const testBtn = document.getElementById("testBtn");
    const shuffleBtn = document.getElementById("shuffleBtn");
    const clearStatisticsBtn =
        document.getElementById("clearStatisticsBtn");

    if (testBtn) {
        testBtn.addEventListener("click", startTest);
    }

    if (shuffleBtn) {
        shuffleBtn.addEventListener("click", shuffleCards);
    }

    if (clearStatisticsBtn) {
        clearStatisticsBtn.addEventListener(
            "click",
            clearStatistics
        );
    }
});