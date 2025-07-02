const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const multer = require('multer');

const bannedIPs = new Set();

const upload = multer({ dest: 'public/uploads/' });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('image'), (req, res) => {
  if (bannedIPs.has(req.ip)) {
    return res.status(403).send('You are banned');
  }
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.json({ filename: req.file.filename });
});

io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  if (bannedIPs.has(ip)) {
    socket.disconnect();
    return;
  }

  socket.on('chat message', (msg) => {
    if (bannedIPs.has(ip)) return;
    io.emit('chat message', msg);
  });

  socket.on('ban user', (ipToBan) => {
    // Limit who can ban in real app!
    bannedIPs.add(ipToBan);
    io.emit('user banned', ipToBan);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
