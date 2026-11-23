console.log('script.js підключено: увімкнено захист від XSS та валідацію URL');

const STORAGE_KEY = 'wishlist_items';
const SAVINGS_KEY = 'wishlist_savings';
const API_URL = '/api/wishes';

// Перевірка схеми URL для захисту від XSS через javascript: у атрибуті href
function sanitizeUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
        return '';
    } catch (e) {
        return '';
    }
}

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
            statusMessage: '',
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
        purchasedWishes() {
            return this.wishesWithProgress.filter(item => item.purchased);
        },
        selectedWish() {
            const targetId = Number(this.routeParams.id);
            return this.wishesWithProgress.find(item => item.id === targetId) || null;
        },
        // Безпечне посилання для атрибута href на сторінці деталей
        safeSelectedWishUrl() {
            return this.selectedWish ? sanitizeUrl(this.selectedWish.url) : '';
        }
    },
    methods: {
        setSavings(newAmount) {
            const cleanValue = Math.max(0, Number(newAmount) || 0);
            this.savings = cleanValue;
            localStorage.setItem(SAVINGS_KEY, String(cleanValue));
        },

        async syncWithServer(isSilent = false) {
            try {
                if (!isSilent) {
                    this.statusMessage = 'Завантаження даних із локального сервера...';
                }

                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`Помилка HTTP: ${response.status}`);
                }

                const serverWishes = await response.json();

                for (const item of serverWishes) {
                    const exists = this.wishes.some(w => w.id === item.id);
                    if (!exists) {
                        await putWishToDB({
                            ...item,
                            url: sanitizeUrl(item.url)
                        });
                    }
                }

                this.wishes = await getAllWishesFromDB();
                saveToLocalStorage(this.wishes);
                this.updateSummary();

                if (!isSilent) {
                    this.statusMessage = `Синхронізовано з сервером (${API_URL}): отримано ${serverWishes.length} записів.`;
                    setTimeout(() => { this.statusMessage = ''; }, 4000);
                }
            } catch (err) {
                console.error('Помилка запиту до локального сервера:', err);
                this.statusMessage = 'Не вдалося звернутися до сервера. Використано локальні дані.';
                if (this.wishes.length === 0) {
                    this.wishes = loadFromLocalStorage() || [];
                }
                this.updateSummary();
            }
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
                url: sanitizeUrl(this.newWishForm.url),
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
                const dbItems = await getAllWishesFromDB();
                if (dbItems.length > 0) {
                    this.wishes = dbItems;
                    this.updateSummary();
                } else {
                    await this.syncWithServer(true);
                }
            } catch (err) {
                console.error('Збій доступу до IndexedDB:', err);
                await this.syncWithServer(true);
            }
        }
    },
    mounted() {
        this.loadInitialData();
    }
});

const vm = app.mount('#app');

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

const routes = [
    { path: '/', view: renderHome },
    { path: '/wishes/:id', view: renderWishDetail },
    { path: '/purchased', view: renderPurchased }
];

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

    return null;
}

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

document.addEventListener('click', event => {
    const link = event.target.closest('a[data-link]');
    if (!link) return;

    event.preventDefault();
    const href = link.getAttribute('href');
    location.hash = href.startsWith('#') ? href : '#' + href;
});

window.addEventListener('hashchange', handleRouteChange);
handleRouteChange();

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