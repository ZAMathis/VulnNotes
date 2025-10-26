const express = require('express');
const app = express();
const port = 3000;
const db = require('./database');
const bodyParser = require('body-parser');

app.get('/', (req, res) => {
  res.send(`<h1>yoooo</h1>`);
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

app.use(bodyParser.json());

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const sql = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;

    db.run(sql, function(err) {
        if (err) {
            res.status(500).send('Error registering user');
            return;
        }
        res.status(201).send(`User registered with ID: ${this.lastID}`);
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});