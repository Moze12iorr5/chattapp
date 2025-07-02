const socket = io();

let username = '';
while (!username) {
  username = prompt('Enter your username:').trim();
}

const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const messages = document.getElementById('messages');
const imageInput = document.getElementById('imageInput');

sendBtn.addEventListener('click', () => {
  if (input.value.trim() !== '') {
    socket.emit('chat message', { user: username, text: input.value.trim() });
    input.value = '';
  }
});

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

socket.on('chat message', (msg) => {
  const li = document.createElement('li');
  li.textContent = `${msg.user}: ${msg.text}`;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('image message', (msg) => {
  const li = document.createElement('li');
  li.innerHTML = `${msg.user}: <br><img src="${msg.imageUrl}" alt="User image" style="max-width:200px; max-height:200px;">`;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('banned', () => {
  alert('You have been banned from chatting.');
  input.disabled = true;
  sendBtn.disabled = true;
  imageInput.disabled = true;
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  fetch('/upload-image', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
      socket.emit('image message', { user: username, imageUrl: data.imageUrl });
      imageInput.value = '';
    })
    .catch(() => alert('Failed to upload image.'));
});
