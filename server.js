//import somethings
const express = require('express');
const http = require("http");
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const db = require('./database');
const { Server } = require("socket.io");

//express setup
const app = express();
const PORT = 3000;

const room_list = [];

//socket setup
const server = http.createServer(app);
const io = new Server(server);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true
}));

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Home Route
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login', { message: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.send('Database error');
        if (!user) return res.render('login', { message: 'User not found' });

        bcrypt.compare(password, user.password, (err, match) => {
            if (match) {
                req.session.user = user;
                res.redirect('/dashboard');
            } else {
                res.render('login', { message: 'Invalid credentials' });
            }
        });
    });
});

// Register Page
app.get('/register', (req, res) => {
    res.render('register', { message: null });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.send('Error hashing password');

        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
            if (err) return res.render('register', { message: 'User already exists' });
            res.redirect('/login');
        });
    });
});

// Dashboard Page
app.get('/dashboard', requireLogin, (req, res) => {
    res.render('dashboard', { username: req.session.user.username });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});