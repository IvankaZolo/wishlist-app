console.log('script.js підключено: ініціалізація SPA-роутера та сховищ');

// ==========================================
// 1. КОНСТАНТИ ТА РОБОТА З LOCALSTORAGE
// ==========================================
const STORAGE_KEY = 'wishlist_items';
const MIGRATION_KEY = 'wishlist_migrated';
const SAVINGS_KEY = 'wishlist_savings';

const INITIAL_WISHES = [
    { id: 1, title: 'Набір Lego Harry Potter', price: 3500, priority: 'високий', url: 'https://www.lego.com', purchased: false },
    { id: 2, title: 'Книга з алгоритмів', price: 600, priority: 'середній', url: '', purchased: false },
    { id: 3, title: 'Бездротові навушники', price: 2400, priority: 'високий', url: '', purchased: false },
    { id: 4, title: 'Чохол для планшета', price: 450, priority: 'низький', url: '', purchased: false },
    { id: 5, title: 'Теплий плед', price: 950, priority: 'середній', url: '', purchased: false },
    { id: 6, title: 'Механічна клавіатура', price: 2800, priority: 'високий', url: '', purchased: false }
];

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

// ==========================================
// 2. АСИНХРОННА БАЗА ДАНИХ INDEXEDDB
// ==========================================
const DB_NAME = 'WishlistDB';
const DB_VERSION = 1;
const STORE_NAME = 'wishes';

function openDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            return reject(new Error('IndexedDB не підтримується цим браузером'));
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

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
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function runMigrationIfNeeded() {
    let localData = loadFromLocalStorage();
    if (!localData || localData.length === 0) {
        saveToLocalStorage(INITIAL_WISHES);
        localData = INITIAL_WISHES;
    }

    const isMigrated = localStorage.getItem(MIGRATION_KEY);
    const dbItems = await getAllWishesFromDB();

    if (!isMigrated || dbItems.length === 0) {
        for (const item of localData) {
            await putWishToDB(item);
        }
        localStorage.setItem(MIGRATION_KEY, 'true');
    }
}

// ==========================================
// 3. VUE-КОМПОНЕНТ КАРТКИ БАЖАННЯ
// ==========================================
const WishItem = {
    props: {
        id: { type: Number, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        priority: { type: String, default: 'середній' },
        purchased: { type: Boolean, default: false },
        progress: { type: Number, default: 0 },
        saved: { type: Number, default: 0 }
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
                <!-- Клік по назві веде на сторінку деталей #/wishes/:id -->
                <h3>
                    <a :href="'#/wishes/' + id" data-link class="wish-item__title-link">
                        {{ name }}
                    </a>
                </h3>
                <p class="wish-item__price">
                    <span class="price-value">{{ price }} грн</span>
                </p>
                <p class="wish-item__priority">
                    Пріоритет: <strong>{{ priority }}</strong>
                </p>

                <div class="wish-progress">
                    <div class="wish-progress__info">
                        <span>Накопичено: {{ saved }} / {{ price }} грн</span>
                        <span :class="{ 'wish-progress__badge--ready': progress >= 100 && !purchased }">
                            {{ purchased ? 'Куплено' : (progress >= 100 ? 'Вистачає! ✓' : progress + '%') }}
                        </span>
                    </div>
                    <div class="wish-progress__track">
                        <div 
                            class="wish-progress__fill" 
                            :class="{ 'wish-progress__fill--ready': progress >= 100 }"
                            :style="{ width: progress + '%' }"
                        ></div>
                    </div>
                </div>
                
                <div class="wish-item__actions">
                    <label class="wish-item__checkbox-label">
                        <input 
                            type="checkbox" 
                            :checked="purchased" 
                            @change="$emit('toggle', id)"
                        >
                        <span>{{ purchased ? 'Придбано ✓' : 'Відзначити як придбане' }}</span>
                    </label>

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
            wishes: [],
            savings: Number(localStorage.getItem(SAVINGS_KEY)) || 0,
            currentView: 'home',
            routeParams: {},
            newWishForm: {
                title: '',
                price: '',
                priority: 'середній',
                url: ''
            }
        };
    },
    computed: {
        wishesWithProgress() {
            const currentSavings = Math.max(0, Number(this.savings) || 0);

            return this.wishes.map(item => {
                if (item.purchased) {
                    return {
                        ...item,
                        savedForItem: item.price,
                        progressPercent: 100
                    };
                }

                const savedForItem = Math.min(currentSavings, item.price);
                const percent = item.price > 0
                    ? Math.min(100, Math.round((currentSavings / item.price) * 100))
                    : 0;

                return {
                    ...item,
                    savedForItem,
                    progressPercent: percent
                };
            });
        },
        // Дані для маршруту #/purchased
        purchasedWishes() {
            return this.wishesWithProgress.filter(item => item.purchased);
        },
        // Пошук конкретного бажання для маршруту #/wishes/:id
        selectedWish() {
            const targetId = Number(this.routeParams.id);
            return this.wishesWithProgress.find(item => item.id === targetId) || null;
        }
    },
    methods: {
        setSavings(newAmount) {
            const cleanValue = Math.max(0, Number(newAmount) || 0);
            this.savings = cleanValue;
            localStorage.setItem(SAVINGS_KEY, String(cleanValue));
        },

        async addNewWish() {
            const title = this.newWishForm.title;
            const price = Number(this.newWishForm.price);
            if (!title || price <= 0) return;

            const newWish = {
                id: Date.now(),
                title: title,
                price: price,
                priority: this.newWishForm.priority,
                url: this.newWishForm.url || '',
                purchased: false
            };

            try {
                await putWishToDB(newWish);
                this.wishes.unshift(newWish);
                saveToLocalStorage(this.wishes);
                this.updateSummary();
                this.newWishForm = { title: '', price: '', priority: 'середній', url: '' };
            } catch (err) {
                console.error('Помилка додавання запису в IndexedDB:', err);
            }
        },

        async togglePurchased(id) {
            const item = this.wishes.find(w => w.id === id);
            if (item) {
                item.purchased = !item.purchased;
                try {
                    await putWishToDB(item);
                    saveToLocalStorage(this.wishes);
                } catch (err) {
                    console.error('Помилка оновлення статусу в IndexedDB:', err);
                }
            }
            this.updateSummary();
        },

        async deleteWish(id) {
            try {
                await deleteWishFromDB(id);
                this.wishes = this.wishes.filter(w => w.id !== id);
                saveToLocalStorage(this.wishes);
                this.updateSummary();
            } catch (err) {
                console.error('Помилка видалення з IndexedDB:', err);
            }
        },

        updateSummary() {
            const totalPriceEl = document.querySelector('#total-price');
            const totalCountEl = document.querySelector('#total-count');

            const remaining = this.wishes.filter(w => !w.purchased);
            const total = remaining.reduce((sum, w) => sum + w.price, 0);

            if (totalPriceEl) totalPriceEl.textContent = `${total} грн`;
            if (totalCountEl) totalCountEl.textContent = remaining.length;
        },

        async loadInitialData() {
            try {
                await runMigrationIfNeeded();
                this.wishes = await getAllWishesFromDB();
                this.updateSummary();
            } catch (err) {
                console.error('Збій доступу до IndexedDB:', err);
                this.wishes = loadFromLocalStorage() || INITIAL_WISHES;
                this.updateSummary();
            }
        }
    },
    mounted() {
        this.loadInitialData();
    }
});

// Монтуємо Vue в єдиний контейнер сторінки <main id="app"> (Крок 2)
const vm = app.mount('#app');

// ==========================================
// 4. КЛІЄНТСЬКИЙ HASH-РОУТЕР (Кроки 3-9)
// ==========================================

// Крок 5: View-функції для кожного маршруту варіанта 7
function renderHome() {
    vm.currentView = 'home';
    vm.routeParams = {};
}

function renderWishDetail(params) {
    vm.currentView = 'detail';
    vm.routeParams = params;
}

function renderPurchased() {
    vm.currentView = 'purchased';
    vm.routeParams = {};
}

function renderNotFound() {
    vm.currentView = 'not-found';
    vm.routeParams = {};
}

// Крок 3: Таблиця маршрутів для варіанта 7 (/, /wishes/:id, /purchased)
const routes = [
    { path: '/', view: renderHome },
    { path: '/wishes/:id', view: renderWishDetail },
    { path: '/purchased', view: renderPurchased }
];

// Крок 4: Зіставлення шляху з патерном та витягування параметра :id
function matchRoute(path) {
    const pathParts = path.split('/').filter(Boolean);

    for (const route of routes) {
        const routeParts = route.path.split('/').filter(Boolean);
        if (routeParts.length !== pathParts.length) continue;

        const params = {};
        const isMatch = routeParts.every((part, i) => {
            if (part.startsWith(':')) {
                params[part.slice(1)] = pathParts[i];
                return true;
            }
            return part === pathParts[i];
        });

        if (isMatch) {
            return { view: route.view, params };
        }
    }

    return null; // маршрут не знайдено — повертаємо null для сторінки 404
}

// Крок 7: Обробка зміни хеша та підсвічування активного пункту меню
function handleRouteChange() {
    const path = location.hash.slice(1) || '/';
    const matched = matchRoute(path);

    if (matched) {
        matched.view(matched.params);
    } else {
        renderNotFound();
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('nav-link--active', link.dataset.route === path);
    });
}

// Крок 6: Перехоплення кліків за внутрішніми посиланнями [data-link]
document.addEventListener('click', event => {
    const link = event.target.closest('a[data-link]');
    if (!link) return;

    event.preventDefault();
    const href = link.getAttribute('href');
    location.hash = href.startsWith('#') ? href : '#' + href;
});

window.addEventListener('hashchange', handleRouteChange);
handleRouteChange(); // ініціалізація маршруту при першому відкритті

// ==========================================
// 5. КЕРУВАННЯ НАКОПИЧЕННЯМИ В САЙДБАРІ
// ==========================================
const savingsInput = document.querySelector('#savings-input');
const quickSaveButtons = document.querySelectorAll('.btn-quick-save');

if (savingsInput) {
    savingsInput.value = vm.savings > 0 ? vm.savings : '';
    savingsInput.addEventListener('input', event => {
        vm.setSavings(event.target.value);
    });
}

quickSaveButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.dataset.reset) {
            vm.setSavings(0);
            if (savingsInput) savingsInput.value = '';
        } else {
            const addAmount = Number(btn.dataset.add) || 0;
            const updated = vm.savings + addAmount;
            vm.setSavings(updated);
            if (savingsInput) savingsInput.value = updated;
        }
    });
});