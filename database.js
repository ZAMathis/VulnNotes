const sqlite = require('sqlite3');

const db = new sqlite.Database('notes.db');

const createTableUsers = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT
  )
`;

const createTableNotes = `
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT,
    content TEXT,
    is_private INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

db.serialize(() => {
    db.run(createTableUsers);
    db.run(createTableNotes);
});

/*
might need a helper function for later queries

const fetch = async (db, sql, params) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject (err);
            resolve(rows);
        });
    });
};
*/

module.exports = db;