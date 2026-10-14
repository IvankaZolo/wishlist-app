// Перевірка підключення файлу скрипта
console.log('script.js підключено');

// Оголошення тестових даних згідно з варіантом 7 (масив об'єктів бажань)
const wishes = [
    { title: 'Набір Lego Harry Potter', price: 3500, priority: 'високий' },
    { title: 'Книга з алгоритмів', price: 600, priority: 'середній' },
    { title: 'Бездротові навушники', price: 2400, priority: 'високий' },
    { title: 'Чохол для планшета', price: 450, priority: 'низький' }
];

// Функція для розрахунку загальної вартості циклом for та перевірки пріоритету умовою if
function processWishlist(items) {
    let totalSum = 0;

    console.log('\n- Огляд списку бажань -');

    for (let i = 0; i < items.length; i++) {
        totalSum += items[i].price;

        // Класифікація бажань за пріоритетом
        if (items[i].priority === 'високий') {
            console.log(`⭐ [Високий пріоритет] ${items[i].title} — ${items[i].price} грн`);
        } else {
            console.log(`• [${items[i].priority}] ${items[i].title} — ${items[i].price} грн`);
        }
    }

    console.log(`\nЗагальна сума всіх бажань у списку: ${totalSum} грн`);
    return totalSum;
}

// Виклик функції обробки масиву
processWishlist(wishes);

// Стрілкова функція для перевірки відповідності бюджету
const withinBudget = (price, budget) => price <= budget;

// Тестування стрілкової функції з виведенням результатів у консоль
console.log('\n- Перевірка бюджету (стрілкова функція) -');
const myBudget = 3000;
console.log(`Мій поточний бюджет: ${myBudget} грн`);

for (const item of wishes) {
    const isAffordable = withinBudget(item.price, myBudget);
    console.log(
        `Чи можу я купити "${item.title}" (${item.price} грн)? -> ${isAffordable ? 'Так, вкладається в бюджет' : 'Ні, перевищує бюджет'}`
    );
}