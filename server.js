const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Routes for pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

// Track banned usernames
const bannedUsers = new Set();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('chat message', (msg) => {
    if (!msg.user || bannedUsers.has(msg.user) || msg.user.toLowerCase() === 'admin') {
      return; // ignore banned users or admin username in chat
    }
    io.emit('chat message', msg);
  });

  socket.on('image upload', (data) => {
    if (!data.user || bannedUsers.has(data.user) || data.user.toLowerCase() === 'admin') {
      return;
    }
    io.emit('image upload', data);
  });

  // Admin commands
  socket.on('admin ban user', (username) => {
    if (username.toLowerCase() === 'admin') return; // can't ban admin
    bannedUsers.add(username);
    io.emit('update banned users', Array.from(bannedUsers));
    console.log(`User banned: ${username}`);
  });

  socket.on('admin unban user', (username) => {
    bannedUsers.delete(username);
    io.emit('update banned users', Array.from(bannedUsers));
    console.log(`User unbanned: ${username}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
