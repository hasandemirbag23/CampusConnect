export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPrice(price) {
  const value = Number(price) || 0;
  return `${new Intl.NumberFormat('tr-TR').format(value)} ₺`;
}

export function formatChatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Dun';
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays < 7) return date.toLocaleDateString('tr-TR', { weekday: 'long' });
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getPostContent(post) {
  return post?.content ?? post?.text ?? '';
}

export function getPostImages(post) {
  if (post?.imageURLs?.length) return post.imageURLs;
  if (post?.imageURL) return [post.imageURL];
  return [];
}

export function getChatPreview(chat) {
  const lm = chat?.lastMessage;
  if (!lm) return 'Sohbeti baslat...';
  if (typeof lm === 'string') return lm || 'Sohbeti baslat...';
  if (lm.text) return lm.text;
  if (lm.imageURL) return 'Fotograf';
  return 'Sohbeti baslat...';
}

export function getChatTimestamp(chat) {
  return chat?.updatedAt ?? chat?.lastMessageAt ?? chat?.lastMessage?.createdAt ?? null;
}

export { showAlert, showConfirm } from './alert';
export { getFirebaseErrorMessage } from './firebaseErrors';
