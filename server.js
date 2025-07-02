const express = require('express');
const http = require('http');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Storage config for multer - save uploaded images to /uploads
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.urlencoded({ extended: true }));

// Simple in-memory ban list (IP or username)
const bannedUsers = new Set();

// Simple admin authentication (very basic, replace with real auth in production)
const ADMIN_PASSWORD = 'GhjyJkuuu??0uifggd';

// Routes for pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/about.html'));
});

app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/faq.html'));
});

app.get('/rules', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/rules.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/contact.html'));
});

// Admin page - simple password check via query param (replace with real auth)
app.get('/admin', (req, res) => {
  const password = req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).send('Forbidden: Incorrect admin password');
  }
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Image upload endpoint
app.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  // Return filename so client can build the URL to access image
  res.json({ filename: req.file.filename });
});

// For contact form submissions
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact form message:', { name, email, message });
  // Here you can save this to DB or send email, etc.
  res.send('Message received! Thanks for contacting us.');
});

// Socket.io connection and logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // You can add IP or username to bannedUsers to disconnect or ignore messages
  socket.on('chat message', (msg) => {
    if (bannedUsers.has(msg.user)) {
      socket.emit('banned', 'You are banned from chatting.');
      return;
    }

    // Broadcast message to all clients
    io.emit('chat message', msg);
  });

  // Handle image messages if you want (example):
  socket.on('image message', (data) => {
    if (bannedUsers.has(data.user)) {
      socket.emit('banned', 'You are banned from chatting.');
      return;
    }
    io.emit('image message', data); // broadcast image message
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
