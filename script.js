// Варіант 7: Список бажань (wishlist). Сховище: "wishes", keyPath: "id"

console.log('script.js підключено: ініціалізація сховищ даних');

// (Кроки 1-3)
const STORAGE_KEY = 'wishlist_items';
const MIGRATION_KEY = 'wishlist_migrated';

const INITIAL_WISHES = [
    { id: 1, title: 'Набір Lego Harry Potter', price: 3500, priority: 'високий', purchased: false },
    { id: 2, title: 'Книга з алгоритмів', price: 600, priority: 'середній', purchased: false },
    { id: 3, title: 'Бездротові навушники', price: 2400, priority: 'високий', purchased: false },
    { id: 4, title: 'Чохол для планшета', price: 450, priority: 'низький', purchased: false },
    { id: 5, title: 'Теплий плед', price: 950, priority: 'середній', purchased: false },
    { id: 6, title: 'Механічна клавіатура', price: 2800, priority: 'високий', purchased: false }
];

// Крок 2. Читання та запис у localStorage з безпечною обробкою JSON у try/catch
function saveToLocalStorage(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        console.error('Помилка запису в localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Помилка зчитування з localStorage:', e);
        return null;
    }
}

// АСИНХРОННА БАЗА ДАНИХ INDEXEDDB (Кроки 5-7)
const DB_NAME = 'WishlistDB';
const DB_VERSION = 1;
const STORE_NAME = 'wishes';

// Крок 6. Відкриття IndexedDB з обробником onupgradeneeded
function openDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            return reject(new Error('IndexedDB не підтримується цим браузером'));
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Крок 5: створення сховища "wishes" із первинним ключем "id"
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                console.log(`Object store "${STORE_NAME}" успішно створено`);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Крок 7. CRUD-операції в IndexedDB через транзакції
async function getAllWishesFromDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function putWishToDB(item) {
    const db = await openDB();
    const plainItem = JSON.parse(JSON.stringify(item));
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(plainItem);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function deleteWishFromDB(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id); // видалення за первинним ключем
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Крок 8. Одноразова міграція даних із localStorage в IndexedDB
async function runMigrationIfNeeded() {
    let localData = loadFromLocalStorage();
    
    // Якщо localStorage ще чистий — заповнюємо його початковими даними для демонстрації Кроку 4
    if (!localData || localData.length === 0) {
        saveToLocalStorage(INITIAL_WISHES);
        localData = INITIAL_WISHES;
    }

    const isMigrated = localStorage.getItem(MIGRATION_KEY);
    const dbItems = await getAllWishesFromDB();

    // Якщо сховище IndexedDB порожнє та міграція ще не виконувалась
    if (!isMigrated || dbItems.length === 0) {
        console.log('Виконується одноразова міграція з localStorage в IndexedDB...');
        for (const item of localData) {
            await putWishToDB(item);
        }
        localStorage.setItem(MIGRATION_KEY, 'true');
        console.log('Міграцію успішно завершено!');
    }
}

// 3. VUE-КОМПОНЕНТ ТА ІНТЕРФЕЙС (Кроки 4, 9, 11)
const WishItem = {
    props: {
        id: { type: Number, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        priority: { type: String, default: 'середній' },
        purchased: { type: Boolean, default: false }
    },
    emits: ['toggle', 'delete'],
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
                
                <div class="wish-item__actions">
                    <!-- Чекбокс оновлення статусу (put) -->
                    <label class="wish-item__checkbox-label">
                        <input 
                            type="checkbox" 
                            :checked="purchased" 
                            @change="$emit('toggle', id)"
                        >
                        <span>{{ purchased ? 'Придбано ✓' : 'Відзначити як придбане' }}</span>
                    </label>

                    <!-- Кнопка видалення картки (delete) -->
                    <button 
                        type="button" 
                        class="wish-item__delete-btn" 
                        title="Видалити зі списку"
                        @click="$emit('delete', id)"
                    >
                        &times;
                    </button>
                </div>
            </div>
        </article>
    `
};

const { createApp } = Vue;

const app = createApp({
    components: {
        WishItem
    },
    data() {
        return {
            wishes: []
        };
    },
    methods: {
        // Оновлення статусу в IndexedDB (put)
        async togglePurchased(id) {
            const item = this.wishes.find(w => w.id === id);
            if (item) {
                item.purchased = !item.purchased;
                try {
                    await putWishToDB(item);
                    saveToLocalStorage(this.wishes); // дублюємо для синхронізації
                } catch (err) {
                    console.error('Помилка оновлення статусу в IndexedDB:', err);
                }
            }
            this.updateSummary();
        },

        // Видалення товару зі списку та бази (delete)
        async deleteWish(id) {
            try {
                await deleteWishFromDB(id);
                this.wishes = this.wishes.filter(w => w.id !== id);
                saveToLocalStorage(this.wishes);
                this.updateSummary();
                console.log(`Елемент #${id} видалено з IndexedDB`);
            } catch (err) {
                console.error('Помилка видалення з IndexedDB:', err);
            }
        },

        // Розрахунок підсумкової суми (тільки не придбані товари)
        updateSummary() {
            const totalPriceEl = document.querySelector('#total-price');
            const totalCountEl = document.querySelector('#total-count');

            const remaining = this.wishes.filter(w => !w.purchased);
            const total = remaining.reduce((sum, w) => sum + w.price, 0);

            if (totalPriceEl) totalPriceEl.textContent = `${total} грн`;
            if (totalCountEl) totalCountEl.textContent = remaining.length;
        },

        // Завантаження даних застосунку при старті
        async loadInitialData() {
            try {
                // Крок 8: перевіряємо й проводимо міграцію
                await runMigrationIfNeeded();

                // Крок 9: рендер із результату getAllWishesFromDB()
                this.wishes = await getAllWishesFromDB();
                this.updateSummary();
            } catch (err) {
                // Крок 11: обробка помилки доступу до бази
                console.error('Збій доступу до IndexedDB:', err);
                const statusMessage = document.querySelector('#status-message');
                if (statusMessage) {
                    statusMessage.textContent = 'Помилка доступу до локальної бази даних IndexedDB';
                    statusMessage.className = 'status-message status-message--error';
                    statusMessage.style.display = 'block';
                }
                // Резервний варіант (fallback): читаємо з localStorage
                this.wishes = loadFromLocalStorage() || INITIAL_WISHES;
                this.updateSummary();
            }
        }
    },
    mounted() {
        this.loadInitialData();
    }
});

const vm = app.mount('#wishlist-cards');

// Додавання нового бажання через форму (операція put у сховище)
const wishForm = document.querySelector('#wish-form');
if (wishForm) {
    wishForm.addEventListener('submit', async event => {
        event.preventDefault();
        const nameInput = document.querySelector('#item-name');
        const priceInput = document.querySelector('#item-price');
        const prioritySelect = document.querySelector('#item-priority');

        const title = nameInput.value.trim();
        const price = Number(priceInput.value);
        const priority = prioritySelect.value;

        if (!title || price <= 0) return;

        const newWish = {
            id: Date.now(),
            title: title,
            price: price,
            priority: priority,
            purchased: false
        };

        try {
            await putWishToDB(newWish);
            vm.wishes.unshift(newWish);
            saveToLocalStorage(vm.wishes);
            vm.updateSummary();
            wishForm.reset();
        } catch (err) {
            console.error('Помилка додавання запису в IndexedDB:', err);
        }
    });
}