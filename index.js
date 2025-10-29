const express = require('express');
const app = express();
const port = 3000;
const db = require('./database');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

/****** GET routes *******/

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
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

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/notes', (req, res) => {
    res.sendFile(__dirname + '/public/notes.html');
});

/****** POST routes *******/

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    const sql = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;

    db.run(sql, function(err) {
        if (err) {
            res.status(500).send('Error registering user');
            return;
        }
        res.status(201).send(`User registered with ID: ${this.lastID}`);
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.all(sql, function(err, rows) {
        if (err) {
            res.status(500).send('Error logging in');
            return;
        }
        if (rows.length > 0) {
            res.status(200).send('Login successful');
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});