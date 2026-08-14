function loadMenu() {
    const nav = document.querySelector(".navbar");
    if (!nav) return;

    // Функция для генерации уровней
    const generateLevels = (prefix, count) => {
        let html = '';
        for (let i = 1; i <= count; i++) {
            html += `<li><a href="${prefix}${i}.html">Уровень ${i}</a></li>`;
        }
        return html;
    };

    nav.innerHTML = `
        <ul class="nav-list">
            <li><a href="Index.html">Главная</a></li>

            <li class="dropdown">
                <a href="javascript:void(0)">Глаголы ▾</a>
                <ul class="styled-dropdown dropdown-menu">
                    ${generateLevels('verbs_level', 21)}
                </ul>
            </li>

            <li class="dropdown">
                <a href="javascript:void(0)">Прилагательные ▾</a>
                <ul class="styled-dropdown dropdown-menu">
                    ${generateLevels('adjectives', 21)}
                </ul>
            </li>

            <li><a href="adverbs.html">Наречия</a></li>
            <li><a href="grammar.html">Грамматика</a></li>
            <li><a href="Stat.html">Статистика</a></li>
        </ul>
    `;
}