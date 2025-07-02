const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup with multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// In-memory banned users list (can be saved to a file/db for persistence)
const bannedUsers = new Set();

// Routes for pages
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/about', (req, res) => res.sendFile(__dirname + '/public/about.html'));
app.get('/faq', (req, res) => res.sendFile(__dirname + '/public/faq.html'));
app.get('/rules', (req, res) => res.sendFile(__dirname + '/public/rules.html'));
app.get('/contact', (req, res) => res.sendFile(__dirname + '/public/contact.html'));

// Contact form POST
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  if(!name || !email || !message) {
    return res.status(400).send('All fields required');
  }

  // Setup nodemailer transport (use your email credentials)
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or another SMTP service
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password' // consider environment variables for security
    }
  });

  const mailOptions = {
    from: email,
    to: 'your-email@gmail.com', // your email to receive reports
    subject: `OmeStarChat Contact from ${name}`,
    text: message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if(error) {
      console.log(error);
      return res.status(500).send('Error sending message');
    }
    res.send('Message sent! Thank you.');
  });
});

// Upload image via socket.io
io.on('connection', (socket) => {
  socket.on('join', (username) => {
    if (bannedUsers.has(username)) {
      socket.emit('banned');
      socket.disconnect();
      return;
    }
    socket.username = username;
    console.log(`${username} connected`);
  });

  socket.on('chat message', (msg) => {
    if(bannedUsers.has(socket.username)) return; // block banned users from chatting
    io.emit('chat message', { user: socket.username, text: msg });
  });

  socket.on('image upload', (data) => {
    if(bannedUsers.has(socket.username)) return;

    // data: { image: base64 string, filename: string }
    const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
    const ext = path.extname(data.filename) || '.png';
    const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    const filePath = path.join(__dirname, 'uploads', fileName);

    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if(err) {
        console.log('Error saving image:', err);
        return;
      }
      // Broadcast image URL to all
      io.emit('chat image', { user: socket.username, url: '/uploads/' + fileName });
    });
  });

  socket.on('ban user', (usernameToBan) => {
    // Only allow banning if this user is admin (add your own logic)
    // Here we accept ban commands from socket with username 'admin' only
    if(socket.username === 'admin') {
      bannedUsers.add(usernameToBan);
      io.emit('user banned', usernameToBan);
      console.log(`User banned: ${usernameToBan}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.username} disconnected`);
  });
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
