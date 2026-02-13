/*
    current vulnerabilities:
    - SQL Injection in /login, /register, /profile/:id, and /notes POST route
    - XSS in /notes GET route (note titles and content are not sanitized)

    currently working on:
    - IDOR in /profile/:id GET route (users can access other users' profiles by changing the ID in the URL, being able to view private notes)
*/

const express = require('express');
const app = express();
const port = 3000;
const db = require('./database');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'weaksecret',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false} // obviously this would be true
}))
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
        // console.log(req.session);
        res.json(rows);
    });
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/login', (req, res) => {
    const error = req.query.error;

    fs.readFile(__dirname + '/public/login.html', 'utf-8', (err, data) => {
        if (err) {
            res.status(500).send('File read error');
            return;
        }
        
        let errorHTML = '';

        if (error === 'not_logged_in') {
            errorHTML = '<h1>You must be logged in to create notes!</h1>';
        }

        const html = data.replace('<!--DNR: FOR LOGIN ERROR MESSAGE-->', errorHTML);
        res.send(html)
    });
});

app.get('/notes', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login?error=not_logged_in');
        return;
    }

    const sql = 'SELECT notes.*, users.username FROM notes JOIN users ON notes.user_id = users.id WHERE notes.is_private = 0';

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }

        fs.readFile(__dirname + '/public/notes.html', 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('File read error');
                return;
            }
            let notesHTML = '';
            rows.forEach((note) => {
                notesHTML += `
                <div class="note-item">
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <small>- ${note.username}</small>
                </div>`;
            });

            const html = data.replace('<!-- notes will be displayed here by the server -->', notesHTML);

            res.send(html);
        });
    });
});

app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        res.status(401).redirect('/login');
        return;
    }
    res.redirect(`/profile/${req.session.userId}`);
});

app.get('/profile/:id', (req, res) => {
    const userId = req.params.id;


    const userSql = `SELECT * FROM users WHERE id = '${userId}'`;

    db.get(userSql, (err, user) => {
        if (err || !user) {
            res.status(404).send('User not found');
            return;
        }

        const notesSql = `SELECT * FROM notes WHERE user_id = ${userId}`;

        db.all(notesSql, [], (err, notes) => {
            if (err) {
                res.status(500).send('Database error');
                return;
            }

            fs.readFile(__dirname + '/public/profile.html', 'utf8', (err, data) => {
                if (err) {
                    res.status(500).send('File read error');
                    return;
                }

                let userNotesHTML = '';
                notes.forEach((note) => {
                    const isPrivate = note.is_private ? '(Private)' : '(Public)';

                    userNotesHTML += `
                    <div class="note-item">
                    <h3>${note.title}</h3>
                    <p>${note.content}</p>
                    <small>- ${user.username}, ${isPrivate}</small>
                    </div>`;
                });

                const html = data
                    .replace('<!-- USERNAME -->', user.username)
                    .replace('<!-- PRIVATE NOTES HERE -->', userNotesHTML);

                res.send(html);

            });
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
            // console.log(rows);

            req.session.userId = rows[0].id;
            res.status(200).redirect('/notes');
        } else {
            console.log('Invalid credentials');
            res.status(401).redirect('/login');
        }
    });
});

app.post('/notes', (req, res) => {
    let { title, content, is_private } = req.body;

    const userId = req.session.userId;

    const isPrivate = is_private ? 1 : 0;

    console.log(title);
    console.log(content);

    const sql = `INSERT INTO notes (user_id, title, content, is_private) VALUES (${userId}, '${title}', '${content}', ${isPrivate})`;

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