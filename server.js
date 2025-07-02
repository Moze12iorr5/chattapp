const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// === Config ===
const ADMIN_PASSWORD = 'aAssdddyyui9=+(?s'; // Change this!
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// === Multer (Image Upload) ===
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// === Routes ===
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/admin', (req, res) => res.sendFile(__dirname + '/public/admin.html'));

app.get('/rules', (req, res) => res.send('<h2>Chat Rules</h2><ul><li>Be respectful</li><li>No spam</li><li>No offensive content</li></ul>'));
app.get('/faq', (req, res) => res.send('<h2>FAQ</h2><p>Q: Is this chat anonymous?<br>A: Yes</p>'));
app.get('/about', (req, res) => res.send('<h2>About OmeStarChat</h2><p>A simple anonymous chat platform.</p>'));
app.get('/contact', (req, res) => res.send('<h2>Contact</h2><p>Email: admin@example.com</p>'));

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// === Data ===
let connectedUsers = {}; // socket.id -> username
let bannedUsers = new Set();

// === Socket.io ===
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('chat message', (msg) => {
    if (bannedUsers.has(msg.user)) return;
    io.emit('chat message', msg);
  });

  socket.on('image upload', (data) => {
    if (bannedUsers.has(data.user)) return;
    io.emit('image upload', data);
  });

  socket.on('username', (username) => {
    if (!username) return;
    connectedUsers[socket.id] = username;
    updateUserList();
  });

  socket.on('admin login', (password) => {
    if (password === ADMIN_PASSWORD) {
      const users = Object.values(connectedUsers).map(name => ({ username: name }));
      socket.emit('admin auth result', { success: true, users });
    } else {
      socket.emit('admin auth result', { success: false });
    }
  });

  socket.on('ban user', (usernameToBan) => {
    bannedUsers.add(usernameToBan);
    console.log('User banned:', usernameToBan);
    io.emit('chat message', { user: 'SYSTEM', text: `${usernameToBan} was banned.` });
  });

  socket.on('system message', (msg) => {
    io.emit('chat message', { user: 'SYSTEM', text: msg });
  });

  socket.on('disconnect', () => {
    delete connectedUsers[socket.id];
    updateUserList();
  });

  function updateUserList() {
    const users = Object.values(connectedUsers).map(name => ({ username: name }));
    io.emit('user list update', users);
  }
});

// === Start Server ===
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
