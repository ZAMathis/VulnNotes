const express = require('express');
const app = express();
const port = 3000;
const db = require('./database');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/test-route', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }
        res.json(rows);
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});