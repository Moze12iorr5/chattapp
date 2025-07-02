const socket = io();

const banInput = document.getElementById('banInput');
const banBtn = document.getElementById('banBtn');
const bannedList = document.getElementById('bannedList');

let bannedUsers = [];

banBtn.addEventListener('click', () => {
  const username = banInput.value.trim();
  if (!username) return alert('Enter a username to ban');

  socket.emit('ban user', username);
  banInput.value = '';
});

socket.on('user banned', (username) => {
  if (!bannedUsers.includes(username)) {
    bannedUsers.push(username);
    const li = document.createElement('li');
    li.textContent = username;
    bannedList.appendChild(li);
  }
});
