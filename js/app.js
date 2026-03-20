// js/app.js
import { supabase, subscribeToMessages } from './supabase-client.js';
import { formatTime, truncateText } from './utils.js';

const chatMessages = document.getElementById('chatMessages');
const nicknameInput = document.getElementById('nickname');
const messageInput = document.getElementById('message');
const imageInput = document.getElementById('imageInput');
const sendBtn = document.getElementById('sendBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const imagePreview = document.getElementById('imagePreview');
const fileName = document.getElementById('fileName');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');

let selectedImage = null;
let subscription = null;

// Валидация ввода
function validateInput() {
  const nick = nicknameInput.value.trim();
  const msg = messageInput.value.trim();
  sendBtn.disabled = !nick || !msg;
}

nicknameInput.addEventListener('input', validateInput);
messageInput.addEventListener('input', validateInput);

// Предпросмотр изображения
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedImage = file;
    fileName.textContent = file.name;
    imagePreview.style.display = 'block';
  } else {
    selectedImage = null;
    imagePreview.style.display = 'none';
  }
});

// Отправка сообщения
sendBtn.addEventListener('click', async () => {
  const nickname = nicknameInput.value.trim();
  const message = messageInput.value.trim();
  
  if (!nickname || !message) return;
  
  sendBtn.disabled = true;
  sendBtn.textContent = '⏳';
  
  try {
    let imageUrl = null;
    
    // Загрузка изображения если есть
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
    }
    
    // Отправка на сервер
    const response = await fetch('/api/send-to-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname,
        message,
        imageUrl,
        platform: 'website'
      })
    });
    
    if (!response.ok) throw new Error('Ошибка отправки');
    
    // Очистка формы
    messageInput.value = '';
    imageInput.value = '';
    selectedImage = null;
    imagePreview.style.display = 'none';
    validateInput();
    
  } catch (error) {
    console.error('Ошибка:', error);
    addSystemMessage('⚠️ Не удалось отправить сообщение. Попробуйте ещё раз.');
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = '➤';
  }
});

// Загрузка изображения в Cloudinary
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) throw new Error('Ошибка загрузки изображения');
  const data = await response.json();
  return data.url;
}

// Добавление сообщения в чат
function addMessage(data) {
  const msgEl = document.createElement('div');
  msgEl.className = 'message';
  
  const time = formatTime(data.created_at || new Date());
  const nick = data.nickname || 'Аноним';
  const text = truncateText(data.message, 500);
  
  let imageHtml = '';
  if (data.image_url) {
    imageHtml = `<img src="${data.image_url}" class="image" alt="Screenshot" onclick="openModal('${data.image_url}')" />`;
  }
  
  msgEl.innerHTML = `
    <div class="meta">
      <span class="nickname">${escapeHtml(nick)}</span>
      <span class="timestamp">${time}</span>
      ${data.platform ? `<span style="color:var(--primary);">[${data.platform}]</span>` : ''}
    </div>
    <div class="content">${escapeHtml(text)}</div>
    ${imageHtml}
  `;
  
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Системное сообщение
function addSystemMessage(text) {
  const msgEl = document.createElement('div');
  msgEl.className = 'message';
  msgEl.style.borderLeftColor = 'var(--accent)';
  msgEl.innerHTML = `<div class="content" style="color:var(--accent); font-style:italic;">${text}</div>`;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Экранирование HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Загрузка истории сообщений
async function loadHistory() {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (error) throw error;
    
    chatMessages.innerHTML = '';
    data.forEach(addMessage);
    
  } catch (error) {
    console.error('Ошибка загрузки истории:', error);
    addSystemMessage('⚠️ Не удалось загрузить историю сообщений');
  }
}

// Подписка на новые сообщения в реальном времени
function setupRealtime() {
  subscription = subscribeToMessages((newMessage) => {
    // Не дублировать своё сообщение
    if (newMessage.temp_id && newMessage.temp_id === window.lastSentId) {
      return;
    }
    addMessage(newMessage);
  });
  
  // Обновление статуса
  statusDot.classList.add('connected');
  statusText.textContent = '● Онлайн • Синхронизация активна';
}

// Модальное окно для изображения
window.openModal = function(url) {
  modalImage.src = url;
  imageModal.style.display = 'flex';
};

window.closeModal = function() {
  imageModal.style.display = 'none';
  modalImage.src = '';
};

// Закрытие модального окна по клику вне картинки
imageModal.addEventListener('click', (e) => {
  if (e.target === imageModal) closeModal();
});

// Инициализация
async function init() {
  await loadHistory();
  setupRealtime();
  
  // Сохранение ника в localStorage
  const savedNick = localStorage.getItem('alliance_nick');
  if (savedNick) nicknameInput.value = savedNick;
  
  nicknameInput.addEventListener('change', () => {
    localStorage.setItem('alliance_nick', nicknameInput.value.trim());
  });
  
  validateInput();
}

// Запуск
init();

// Очистка при закрытии
window.addEventListener('beforeunload', () => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
});