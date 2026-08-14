function loadMenu() {
    const nav = document.querySelector(".navbar");

    if (!nav) return;

    const generateLevels = (page, category, count) => {
        let html = "";

        for (let i = 1; i <= count; i++) {
            const unlocked = isLevelUnlocked(category, i);

            if (unlocked) {
                html += `
                <li>
                    <a href="${page}?level=${i}">
                        Уровень ${i}
                    </a>
                </li>
            `;
            } else {
                html += `
                <li>
                    <a
                        href="javascript:void(0)"
                        class="locked-link"
                    >
                        🔒 Уровень ${i}
                    </a>
                </li>
            `;
            }
        }

        return html;
    };

    nav.innerHTML = `
        <ul class="nav-list">

            <li>
                <a href="index.html">
                    Главная
                </a>
            </li>

            <li class="dropdown">
                <a href="javascript:void(0)">
                    Глаголы ▾
                </a>

                <ul class="styled-dropdown dropdown-menu">
                    ${generateLevels("verbs.html", "verbs",21)}
                </ul>
            </li>

            <li class="dropdown">
                <a href="javascript:void(0)">
                    Прилагательные ▾
                </a>

                <ul class="styled-dropdown dropdown-menu">
                    ${generateLevels("adjectives.html", "adjectives", 21)}
                </ul>
            </li>

            <li class="dropdown">
                <a href="javascript:void(0)">
                    Наречия ▾
                </a>
                <ul class="styled-dropdown dropdown-menu">
                    ${generateLevels("adverbs.html", "adverbs", 21)}
                </ul>
            </li>

            <li>
                <a href="grammar.html">
                    Грамматика
                </a>
            </li>

            <li>
                <a href="stat.html">
                    Статистика
                </a>
            </li>

        </ul>
    `;
}