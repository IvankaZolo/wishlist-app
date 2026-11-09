// Лабораторна робота №10: Клієнтське програмування з фреймворком Vue 3
// Обґрунтування: обрано Vue 3 через декларативну модель, компонентний підхід та легку інтеграцію через CDN.

console.log('script.js підключено з Vue 3');

// 1. Окремий компонент WishItem (вимога Варіанта 7)
// Props: name, price, priority (а також id та purchased)
const WishItem = {
    props: {
        id: { type: Number, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        priority: { type: String, default: 'середній' },
        purchased: { type: Boolean, default: false }
    },
    emits: ['toggle'],
    template: `
        <article 
            class="wish-item" 
            :class="{ 
                'priority-high': priority === 'високий', 
                'wish-item--purchased': purchased 
            }"
            :data-priority="priority"
        >
            <div class="wish-item__content">
                <h3>{{ name }}</h3>
                <p class="wish-item__price">
                    <span class="price-value">{{ price }} грн</span>
                </p>
                <p class="wish-item__priority">
                    Пріоритет: <strong>{{ priority }}</strong>
                </p>
                
                <!-- Інтерактивна дія варіанта 7: чекбокс «придбано» -->
                <label class="wish-item__checkbox-label">
                    <input 
                        type="checkbox" 
                        :checked="purchased" 
                        @change="$emit('toggle', id)"
                    >
                    <span>{{ purchased ? 'Придбано ✓' : 'Відзначити як придбане' }}</span>
                </label>
            </div>
        </article>
    `
};

// 2. Створення Vue-додатка
const { createApp } = Vue;

const app = createApp({
    components: {
        WishItem
    },
    data() {
        return {
            wishes: [
                { id: 1, title: 'Набір Lego Harry Potter', price: 3500, priority: 'високий', purchased: false },
                { id: 2, title: 'Книга з алгоритмів', price: 600, priority: 'середній', purchased: false },
                { id: 3, title: 'Бездротові навушники', price: 2400, priority: 'високий', purchased: false },
                { id: 4, title: 'Чохол для планшета', price: 450, priority: 'низький', purchased: false }
            ]
        };
    },
    methods: {
        // Зміна стану придбання (Крок 6)
        togglePurchased(id) {
            const item = this.wishes.find(w => w.id === id);
            if (item) {
                item.purchased = !item.purchased;
            }
            this.updateSummary();
        },

        // Розрахунок блоку «Підсумок»
        updateSummary() {
            const totalPriceEl = document.querySelector('#total-price');
            const totalCountEl = document.querySelector('#total-count');

            // Рахуємо речі, які ще заплановано (не відзначені як придбані)
            const remaining = this.wishes.filter(w => !w.purchased);
            const total = remaining.reduce((sum, w) => sum + w.price, 0);

            if (totalPriceEl) totalPriceEl.textContent = `${total} грн`;
            if (totalCountEl) totalCountEl.textContent = remaining.length;
        }
    },
    mounted() {
        // Оновлюємо підсумок одразу при завантаженні сторінки
        this.updateSummary();
    }
});

// Монтуємо застосунок у контейнер списку
const vm = app.mount('#wishlist-cards');

// Додавання нових бажань через форму у реактивний стан Vue
const wishForm = document.querySelector('#wish-form');
if (wishForm) {
    wishForm.addEventListener('submit', event => {
        event.preventDefault();
        const nameInput = document.querySelector('#item-name');
        const priceInput = document.querySelector('#item-price');
        const prioritySelect = document.querySelector('#item-priority');

        const title = nameInput.value.trim();
        const price = Number(priceInput.value);
        const priority = prioritySelect.value;

        if (!title || price <= 0) return;

        vm.wishes.push({
            id: Date.now(),
            title: title,
            price: price,
            priority: priority,
            purchased: false
        });

        vm.updateSummary();
        wishForm.reset();
    });
}