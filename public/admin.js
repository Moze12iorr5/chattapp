const socket = io();

const banUserBtn = document.getElementById('banUserBtn');
const banUserInput = document.getElementById('banUserInput');
const bannedUsersList = document.getElementById('bannedUsersList');

// Ban a user by sending username to server
banUserBtn.addEventListener('click', () => {
  const username = banUserInput.value.trim();
  if (username) {
    socket.emit('ban user', username);
    banUserInput.value = '';
  }
});

// Listen for updated banned users list from server
socket.on('update banned users', (bannedUsers) => {
  bannedUsersList.innerHTML = '';
  bannedUsers.forEach((user) => {
    const li = document.createElement('li');
    li.textContent = user;
    bannedUsersList.appendChild(li);
  });
});
