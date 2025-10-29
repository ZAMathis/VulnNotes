const express = require('express');
const app = express();
const port = 3000;
const db = require('./database');
const bodyParser = require('body-parser');
const fs = require('fs');

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
    db.all('SELECT * FROM notes', [], (err, rows) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }

        fs.readFile(__dirname + '/public/notes.html', 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('File read error');
                return;
            }
            let notesHTML = ''
            rows.forEach((note) => {
                notesHTML += `<div class="note"><h3>${note.title}</h3><p>${note.content}</p></div>`;
            });

            const html = data.replace('<!-- notes will be displayed here by the server -->', notesHTML);

            res.send(html);
        });
    });
});

/****** POST routes *******/

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    const sql = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;

    db.run(sql, function(err) {
        if (err) {
            console.log('Error registering user')
            res.status(500).redirect('/register');
            return;
        }
        console.log("User registered with ID: ", this.lastID);
        console.log('Registration successful! Redirecting to login page.');

        res.status(200).redirect('/login');
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.all(sql, function(err, rows) {
        if (err) {
            console.log('Error logging in')
            res.status(500).redirect('/login');
            return;
        }
        if (rows.length > 0) {
            console.log('Login successful');
            res.status(200).redirect('/notes');
        } else {
            console.log('Invalid credentials');
            res.status(401).redirect('/login');
        }
    });
});

app.post('/notes', (req, res) => {
    let { title, content } = req.body;

    console.log(title);
    console.log(content);

    const sql = `INSERT INTO notes (user_id, title, content) VALUES (1, '${title}', '${content}')`;

    console.log('SQL: ', sql);
    db.run(sql, function(err) {
        if (err) {
            console.log(err);
            res.status(500).send('Error saving note: ' + err.message);
            return;
        }
        res.redirect('/notes');
    });

});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});