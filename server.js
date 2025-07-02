const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('En användare anslöt');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('En användare kopplade från');
  });
});

http.listen(port, () => {
  console.log(`Servern körs på http://localhost:${port}`);
});
