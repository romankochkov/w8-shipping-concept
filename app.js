const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('vehicles.db');
const path = require('path');
const http = require('http');


const app = express();

app.use(express.static(path.join(__dirname, 'assets')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    db.all('SELECT * FROM vehicles', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('index', { vehicles: rows });
    });
});

const updateData = (data) => {
    Object.keys(data).forEach(key => {
        const [field, id] = key.split('-');

        if (id) {
            const query = `
          UPDATE vehicles
          SET ${field} = ?
          WHERE id = ?
        `;

            const fieldValue = data[key];

            db.run(query, [fieldValue, id], (err) => {
                if (err) {
                    console.error(err.message);
                }
            });
        }
    });
};

app.post('/', (req, res) => {
    updateData(req.body);

    res.redirect('/');
});

app.post('/pay', (req, res) => {
    const { id } = req.body; // Получаем id из тела запроса
    const ids = JSON.parse(id); // Преобразуем строку в массив

    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'Неправильный формат данных' });
    }

    // SQL запрос для обновления поля paid = 1 для каждого id
    const updateQuery = 'UPDATE vehicles SET paid = 1 WHERE id = ?';

    db.serialize(() => {
        ids.forEach((vehicleId) => {
            db.run(updateQuery, vehicleId, function (err) {
                if (err) {
                    console.error('Ошибка при обновлении:', err.message);
                } else {
                    console.log(`Запись с ID ${vehicleId} успешно обновлена.`);
                }
            });
        });
    });

    res.redirect('/');
});

app.post('/lot', (req, res) => {
    if ((req.body.search).filter(id => id.trim() !== '').length > 0) {
        db.all(`SELECT * FROM vehicles WHERE lot IN (${((req.body.search).filter(id => id.trim() !== '')).map(() => '?').join(',')})`, (req.body.search).filter(id => id.trim() !== ''), (err, rows) => {
            if (err) {
                throw err;
            }
            res.render('index', { vehicles: rows });
        });
    } else {
        res.redirect('/');
    }
});

app.post('/vin', (req, res) => {
    if ((req.body.search).filter(id => id.trim() !== '').length > 0) {
        db.all(`SELECT * FROM vehicles WHERE vin IN (${((req.body.search).filter(id => id.trim() !== '')).map(() => '?').join(',')})`, (req.body.search).filter(id => id.trim() !== ''), (err, rows) => {
            if (err) {
                throw err;
            }
            res.render('index', { vehicles: rows });
        });
    } else {
        res.redirect('/');
    }
});

app.get('/check', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/check.pdf'));
});


const port = 80;

let server = http.createServer(app);

server.listen(port, () => {
    console.log(`[${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}] > The server is running on port ${port}`.toUpperCase());
});