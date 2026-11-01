// Підтвердження підключення скрипта
console.log('script.js підключено');

// Ендпоінт публічного API для Варіанта 7
const API_URL = 'https://jsonplaceholder.typicode.com/todos?userId=2';

// Масив об'єктів бажань
let wishes = [];

// Вибір основних вузлів сторінки
const listContainer = document.querySelector('#wishlist-cards');
const wishForm = document.querySelector('#wish-form');
const priceInput = document.querySelector('#item-price');
const nameInput = document.querySelector('#item-name');
const prioritySelect = document.querySelector('#item-priority');
const btnRefresh = document.querySelector('#btn-refresh');
const statusMessage = document.querySelector('#status-message');

// Програмне видалення статичних прикладів карток з HTML (демонстрація .remove())
const staticCards = document.querySelectorAll('.wish-item');
staticCards.forEach(card => card.remove());

// Функція динамічного створення карток у DOM
function renderWishlist(items) {
    listContainer.innerHTML = '';

    items.forEach((wish, index) => {
        const card = document.createElement('article');
        card.classList.add('wish-item');
        card.dataset.priority = wish.priority;
        card.dataset.index = index;

        // Початкова підсвітка високого пріоритету
        if (wish.priority === 'високий') {
            card.classList.add('priority-high');
        }

        const titleEl = document.createElement('h3');
        titleEl.textContent = wish.title;

        const priceEl = document.createElement('p');
        priceEl.classList.add('wish-item__price');
        
        const priceValue = document.createElement('span');
        priceValue.classList.add('price-value');
        priceValue.textContent = `${wish.price} грн`;
        priceEl.append(priceValue);

        // Селектор пріоритету всередині картки
        const priorityContainer = document.createElement('p');
        priorityContainer.classList.add('wish-item__priority');
        priorityContainer.textContent = 'Пріоритет: ';

        const inlineSelect = document.createElement('select');
        inlineSelect.classList.add('priority-inline-select');

        const priorities = ['високий', 'середній', 'низький'];
        priorities.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            if (p === wish.priority) opt.selected = true;
            inlineSelect.append(opt);
        });

        priorityContainer.append(inlineSelect);

        card.append(titleEl, priceEl, priorityContainer);
        listContainer.append(card);
    });
}

// Функція оновлення блоку підсумку
function updateSummary(items) {
    const totalPriceEl = document.querySelector('#total-price');
    const totalCountEl = document.querySelector('#total-count');

    let total = 0;
    for (const item of items) {
        total += item.price;
    }

    if (totalPriceEl) totalPriceEl.textContent = `${total} грн`;
    if (totalCountEl) totalCountEl.textContent = items.length;
}

// Функції керування статусом завантаження та повідомленнями про помилки
function showStatus(text, type = 'loading') {
    statusMessage.textContent = text;
    statusMessage.style.display = 'block';
    statusMessage.className = `status-message status-message--${type}`;
}

function hideStatus() {
    statusMessage.style.display = 'none';
    statusMessage.textContent = '';
}

// Асинхронна функція завантаження даних із сервера (Fetch API)
async function loadWishesFromAPI() {
    showStatus('Завантаження списку бажань із сервера...', 'loading');
    if (btnRefresh) btnRefresh.disabled = true;

    try {
        const response = await fetch(API_URL);

        // Перевірка HTTP-статусу відповіді
        if (!response.ok) {
            throw new Error(`Сервер відповів зі статусом: ${response.status}`);
        }

        const data = await response.json();
        console.log('Дані успішно отримані з API:', data);

        // Адаптація отриманих todos під структуру карток нашого варіанта
        wishes = data.slice(0, 6).map((item, idx) => ({
            title: item.title,
            price: (item.id * 120) + 300, // розрахункова орієнтовна ціна
            priority: item.completed ? 'низький' : (idx % 2 === 0 ? 'високий' : 'середній')
        }));

        // Приховуємо статус завантаження та рендеримо отримані картки
        hideStatus();
        renderWishlist(wishes);
        updateSummary(wishes);

    } catch (error) {
        // Вимога варіанта: зрозуміле повідомлення про помилку мережі/офлайн
        console.error('Помилка при завантаженні даних:', error);
        showStatus('Список бажань недоступний офлайн', 'error');
    } finally {
        if (btnRefresh) btnRefresh.disabled = false;
    }
}

// Початкове завантаження списку при відкритті сторінки
loadWishesFromAPI();

// Повторне завантаження за кліком на кнопку «Оновити з сервера»
btnRefresh.addEventListener('click', () => {
    loadWishesFromAPI();
});

// Додаткова валідація ціни на льоту через подію input
priceInput.addEventListener('input', () => {
    const val = Number(priceInput.value);
    if (priceInput.value !== '' && val <= 0) {
        priceInput.setCustomValidity('Ціна має бути більшою за нуль');
    } else {
        priceInput.setCustomValidity('');
    }
});

// Обробка додавання нового бажання через форму (submit)
wishForm.addEventListener('submit', event => {
    event.preventDefault();

    const newTitle = nameInput.value.trim();
    const newPrice = Number(priceInput.value);
    const newPriority = prioritySelect.value;

    if (!newTitle || newPrice <= 0) return;

    const newWish = {
        title: newTitle,
        price: newPrice,
        priority: newPriority
    };

    wishes.unshift(newWish); // додаємо нове бажання на початок списку

    renderWishlist(wishes);
    updateSummary(wishes);
    wishForm.reset();
});

// Делегування події change на контейнері для зміни пріоритету
listContainer.addEventListener('change', event => {
    if (event.target.classList.contains('priority-inline-select')) {
        const select = event.target;
        const card = select.closest('.wish-item');
        const newPriority = select.value;
        const itemIndex = card.dataset.index;

        if (itemIndex !== undefined && wishes[itemIndex]) {
            wishes[itemIndex].priority = newPriority;
        }

        card.dataset.priority = newPriority;
        if (newPriority === 'високий') {
            card.classList.add('priority-high');
        } else {
            card.classList.remove('priority-high');
        }
    }
});