// Import statements
const express = require('express');
const http = require("http");
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./database');

// Express setup
const app = express();
const PORT = 3000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//null barible
let room_list = [];
let tempName = '';
let tempRoom = '';

// Set view engine and middleware
app.set('view engine', 'ejs');-
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Disable `secure` in development (unless using HTTPS)
}));

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Socket.io connection event (Move this outside the route handler)
io.on('connection', (socket) => {
    console.log("A user connected", socket.id);
    socket.on("rq_room", () => {
        console.log('user is reqquesting room');
        socket.emit("rq_room", room_list);
    });

    socket.on('rqName', () => {
        socket.emit('rqName', tempName);
        console.log(`user ${tempName} is reqquesting name`);
    });

    socket.on("joinRoom", ({ room, username }) => {
        socket.join(room);
        tempRoom = room;
        console.log(`User : ${username} is joining room : ${room}`);
        io.to(room).emit("user-connected", username);
    
        socket.on("disconnect", () => {
            socket.to(room).emit("user-disconnected", username);
            console.log(`User : ${username} is leaving room : ${room}`);
        });
    });

    socket.on("newroom", (newroom) => {
        console.log(room_list);
        if (room_list.includes(newroom)) {
            console.log('room already exists');
        }else{
            room_list.push(newroom);
            io.emit("room_list", room_list);
            console.log(room_list);        }
    });

    socket.on('message', ({ message, room, username }) => {
        let roomId = room;
        io.to(room).emit('message', { message, username });
    })


    // WebRTC Signaling

    socket.on('offer', ({ offer, room, username }) => {
        io.to(room).emit('offer', { offer:offer, room:room, username:username });
    })

    socket.on('answer', ({ answer, room, username }) => {
        io.to(room).emit('answer', { answer:answer, room:room, username:username });
    })

    socket.on('new-ice-candidate', ({ candidate, room, username }) => {
        io.to(room).emit('new-ice-candidate', { candidate:candidate, room:room, username:username });
    });

});




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

//room page
app.get('/room', requireLogin, (req, res) => {
    res.render('room',{ username: req.session.user.username , room: tempRoom });
    console.log(`user ${tempName} join room ${tempRoom}`);
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});