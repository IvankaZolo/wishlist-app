// Підтвердження підключення скрипта
console.log('script.js підключено');

// Масив об'єктів бажань
const wishes = [
    { title: 'Набір Lego Harry Potter', price: 3500, priority: 'високий' },
    { title: 'Книга з алгоритмів', price: 600, priority: 'середній' },
    { title: 'Бездротові навушники', price: 2400, priority: 'високий' },
    { title: 'Чохол для планшета', price: 450, priority: 'низький' }
];

// Вибір контейнера карток
const listContainer = document.querySelector('#wishlist-cards');

// Програмне видалення статичних прикладів карток з HTML (демонстрація .remove())
const staticCards = document.querySelectorAll('.wish-item');
staticCards.forEach(card => card.remove());

// Функція динамічного створення та виведення карток у DOM
function renderWishlist(items) {
    // Очищення вмісту перед генерацією
    listContainer.innerHTML = '';

    items.forEach(wish => {
        // Створення елемента article
        const card = document.createElement('article');
        card.classList.add('wish-item');

        // Встановлення data-атрибута згідно з варіантом 7
        card.dataset.priority = wish.priority;

        // Додавання класу за умовою для високого пріоритету
        if (wish.priority === 'високий') {
            card.classList.add('priority-high');
        }

        // Створення заголовка для назви бажання
        const titleEl = document.createElement('h3');
        titleEl.textContent = wish.title;

        // Створення абзацу для ціни
        const priceEl = document.createElement('p');
        priceEl.classList.add('wish-item__price');
        
        const priceValue = document.createElement('span');
        priceValue.classList.add('price-value');
        priceValue.textContent = `${wish.price} грн`;
        priceEl.append(priceValue);

        // Створення інформації про пріоритет
        const priorityEl = document.createElement('p');
        priorityEl.classList.add('wish-item__priority');
        priorityEl.textContent = `Пріоритет: ${wish.priority}`;

        // Додавання всіх дочірніх вузлів у картку
        card.append(titleEl, priceEl, priorityEl);

        // Додавання готової картки до контейнера сітки
        listContainer.append(card);
    });
}

// Функція оновлення підсумкового блоку
function updateSummary(items) {
    const totalPriceEl = document.querySelector('#total-price');
    const totalCountEl = document.querySelector('#total-count');

    let total = 0;
    for (const item of items) {
        total += item.price;
    }

    if (totalPriceEl) {
        totalPriceEl.textContent = `${total} грн`;
    }
    if (totalCountEl) {
        totalCountEl.textContent = items.length;
    }
}

// Виклик рендеру та оновлення підсумку
renderWishlist(wishes);
updateSummary(wishes);