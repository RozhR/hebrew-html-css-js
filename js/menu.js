function loadMenu() {
    const nav = document.querySelector(".navbar");

    if (!nav) return;

    const generateLevels = (page, category, count) => {
        let html = "";

        for (let i = 1; i <= count; i++) {
            const unlocked = isLevelUnlocked(category, i);

            html += unlocked
                ? `
                    <li>
                        <a href="${page}?level=${i}">
                            Уровень ${i}
                        </a>
                    </li>
                `
                : `
                    <li>
                        <a href="#" class="locked-link">
                            🔒 Уровень ${i}
                        </a>
                    </li>
                `;
        }

        return html;
    };

    nav.innerHTML = `
        <ul class="nav-list">
            <li>
                <a href="index.html">Главная</a>
            </li>

            <li class="dropdown">
                <a href="#">Глаголы ▾</a>
                <ul class="styled-dropdown dropdown-menu">
                    ${generateLevels("verbs.html", "verbs", 25)}
                </ul>
            </li>

            <li class="dropdown">
                <a href="#">Прилагательные ▾</a>
                <ul class="styled-dropdown dropdown-menu">
                    ${generateLevels("adjectives.html", "adjectives", 25)}
                </ul>
            </li>

            <li class="dropdown">
                <a href="#">Наречия ▾</a>
                <ul class="styled-dropdown dropdown-menu">
                    ${generateLevels("adverbs.html", "adverbs", 15)}
                </ul>
            </li>

            <li>
                <a href="grammar.html">Грамматика</a>
            </li>

            <li>
                <a href="stat.html">Статистика</a>
            </li>
        </ul>
    `;
}