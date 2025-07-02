const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http);
const multer = require('multer');

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Simple banned users list (by username)
const bannedUsers = new Set();

// Admin password (change this before deploy!)
const ADMIN_PASSWORD = 'supersecret';

// Serve main pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/faq', (req, res) => res.sendFile(path.join(__dirname, 'public', 'faq.html')));
app.get('/rules', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rules.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Contact form endpoint
app.post('/contact', (req, res) => {
  const { email, message } = req.body;
  if (!email || !message) return res.status(400).send('Both fields are required.');

  console.log(`📩 New message from ${email}: ${message}`);
  res.send('Thank you! Your message has been sent.');
});

// Image upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  // Return relative path for frontend to show image
  res.json({ imageUrl: '/uploads/' + req.file.filename });
});

// Admin login endpoint (simple)
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

// Socket.io logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (username) => {
    if (bannedUsers.has(username)) {
      socket.emit('banned');
      socket.disconnect();
      return;
    }
    socket.username = username;
  });

  socket.on('chat message', (msg) => {
    if (!socket.username || bannedUsers.has(socket.username)) return;

    io.emit('chat message', { user: socket.username, text: msg });
  });

  socket.on('image upload', (imageUrl) => {
    if (!socket.username || bannedUsers.has(socket.username)) return;

    io.emit('image upload', { user: socket.username, url: imageUrl });
  });

  socket.on('ban user', (username) => {
    // Basic admin check: only allow if socket.username === 'admin'
    if (socket.username === 'admin') {
      bannedUsers.add(username);
      io.emit('user banned', username);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
