// Підтвердження підключення скрипта
console.log('script.js підключено');

// Масив об'єктів бажань
const wishes = [
    { title: 'Набір Lego Harry Potter', price: 3500, priority: 'високий' },
    { title: 'Книга з алгоритмів', price: 600, priority: 'середній' },
    { title: 'Бездротові навушники', price: 2400, priority: 'високий' },
    { title: 'Чохол для планшета', price: 450, priority: 'низький' }
];

// Вибір основних вузлів сторінки
const listContainer = document.querySelector('#wishlist-cards');
const wishForm = document.querySelector('#wish-form');
const priceInput = document.querySelector('#item-price');
const nameInput = document.querySelector('#item-name');
const prioritySelect = document.querySelector('#item-priority');

// Програмне видалення статичних прикладів карток з HTML
const staticCards = document.querySelectorAll('.wish-item');
staticCards.forEach(card => card.remove());

// Функція динамічного створення карток
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

        // Селектор пріоритету всередині картки для другої події
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

// Первинний рендер списку
renderWishlist(wishes);
updateSummary(wishes);

// Додаткова валідація ціни "на льоту" через подію input
priceInput.addEventListener('input', () => {
    const val = Number(priceInput.value);
    if (priceInput.value !== '' && val <= 0) {
        priceInput.setCustomValidity('Ціна має бути більшою за нуль');
    } else {
        priceInput.setCustomValidity('');
    }
});

// Обробка форми на подію submit (без перезавантаження сторінки)
wishForm.addEventListener('submit', event => {
    event.preventDefault(); // Запобігаємо стандартному перезавантаженню

    const newTitle = nameInput.value.trim();
    const newPrice = Number(priceInput.value);
    const newPriority = prioritySelect.value;

    if (!newTitle || newPrice <= 0) {
        return;
    }

    // Створення нового об'єкта та додавання до масиву
    const newWish = {
        title: newTitle,
        price: newPrice,
        priority: newPriority
    };
    wishes.push(newWish);

    // Оновлення інтерфейсу сторінки
    renderWishlist(wishes);
    updateSummary(wishes);

    // Очищення форми
    wishForm.reset();
});

// Друга подія варіанта: зміна пріоритету через делегування change на контейнері
listContainer.addEventListener('change', event => {
    // Перевіряємо, чи подія сталася саме на нашому селекті всередині картки
    if (event.target.classList.contains('priority-inline-select')) {
        const select = event.target;
        const card = select.closest('.wish-item');
        const newPriority = select.value;
        const itemIndex = card.dataset.index;

        // Оновлюємо дані в масиві
        if (itemIndex !== undefined && wishes[itemIndex]) {
            wishes[itemIndex].priority = newPriority;
        }

        // Оновлюємо атрибут та клас елемента без повного перемальовування
        card.dataset.priority = newPriority;
        if (newPriority === 'високий') {
            card.classList.add('priority-high');
        } else {
            card.classList.remove('priority-high');
        }

        console.log(`Пріоритет картки "${wishes[itemIndex].title}" змінено на: ${newPriority}`);
    }
});