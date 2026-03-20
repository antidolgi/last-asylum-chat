// js/utils.js

// Форматирование времени
export function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  // Если сегодня — показываем время
  if (diff < 24 * 60 * 60 * 1000 && date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  // Если в этом году — дата + время
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' + 
           date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  // Иначе полная дата
  return date.toLocaleDateString('ru-RU');
}

// Обрезка текста
export function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}