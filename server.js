const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

const wishes = [
    { id: 1, title: 'Набір Lego Harry Potter', price: 3500, priority: 'високий', url: 'https://www.lego.com', purchased: false },
    { id: 2, title: 'Книга з алгоритмів', price: 600, priority: 'середній', url: '', purchased: false },
    { id: 3, title: 'Бездротові навушники', price: 2400, priority: 'високий', url: '', purchased: false },
    { id: 4, title: 'Чохол для планшета', price: 450, priority: 'низький', url: '', purchased: false },
    { id: 5, title: 'Теплий плед', price: 950, priority: 'середній', url: '', purchased: false },
    { id: 6, title: 'Механічна клавіатура', price: 2800, priority: 'високий', url: '', purchased: false }
];

// Роздача статичних файлів застосунку (index.html, css/style.css, script.js)
app.use(express.static(path.join(__dirname)));

// Ендпоінт списку всіх бажань (GET /api/wishes)
app.get('/api/wishes', (req, res) => {
    res.status(200).json(wishes);
});

// Ендпоінт деталей конкретного бажання за id (GET /api/wishes/:id)
app.get('/api/wishes/:id', (req, res) => {
    const wish = wishes.find(item => String(item.id) === req.params.id);

    if (!wish) {
        return res.status(404).json({ error: `Бажання з ID ${req.params.id} не знайдено` });
    }

    res.status(200).json(wish);
});

// Обробка неіснуючих API-маршрутів із кодом 404
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API ендпоінт не знайдено' });
});

// Запуск сервера на порту 3000
app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
    console.log(`API списку бажань: http://localhost:${PORT}/api/wishes`);
});