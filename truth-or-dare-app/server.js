const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const truths = [
  "What's your biggest fear?",
  "Have you ever lied to a friend?",
  "What's your most embarrassing moment?",
  "What's a secret you've never told anyone?",
  "Who do you have a crush on?"
];

const dares = [
  "Do 10 jumping jacks.",
  "Sing a song loudly.",
  "Dance for 30 seconds.",
  "Do your best impression of a celebrity.",
  "Talk in a silly voice for the next 5 minutes."
];

io.on('connection', socket => {
  console.log('a user connected');

  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  socket.on('request prompt', ({ user, type }) => {
    let prompt;
    if(type === 'truth') {
      prompt = truths[Math.floor(Math.random() * truths.length)];
    } else if(type === 'dare') {
      prompt = dares[Math.floor(Math.random() * dares.length)];
    }
    io.emit('prompt', { user, type, prompt });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
