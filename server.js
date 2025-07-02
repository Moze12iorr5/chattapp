const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files from 'public'
app.use(express.static('public'));

// To parse JSON bodies for contact form submissions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// In-memory banned users list (for demo, store in DB in real app)
const bannedUsers = new Set();

// Routes for static pages (if you want, serve html files directly)
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/rules', (req, res) => res.sendFile(__dirname + '/public/rules.html'));
app.get('/faq', (req, res) => res.sendFile(__dirname + '/public/faq.html'));
app.get('/about', (req, res) => res.sendFile(__dirname + '/public/about.html'));
app.get('/contact', (req, res) => res.sendFile(__dirname + '/public/contact.html'));
app.get('/admin.html', (req, res) => res.sendFile(__dirname + '/public/admin.html'));

// Contact form endpoint (just logs for now)
app.post('/contact', (req, res) => {
  console.log('Contact message:', req.body);
  res.json({ status: 'Message received' });
});

// Upload image endpoint (for chat)
app.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.json({ imageUrl: '/uploads/' + req.file.filename });
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io chat logic
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle chat message { user, text }
  socket.on('chat message', (msg) => {
    if (bannedUsers.has(msg.user)) {
      socket.emit('banned');
      return;
    }
    io.emit('chat message', msg);
  });

  // Handle image message { user, imageUrl }
  socket.on('image message', (msg) => {
    if (bannedUsers.has(msg.user)) {
      socket.emit('banned');
      return;
    }
    io.emit('image message', msg);
  });

  // Admin banning users
  socket.on('ban user', (username) => {
    console.log('Banning user:', username);
    bannedUsers.add(username);
    io.emit('user banned', username);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
