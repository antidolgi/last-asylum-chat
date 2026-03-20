// js/supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ ЗАМЕНИТЕ НА СВОИ ЗНАЧЕНИЯ ИЗ SUPABASE
const SUPABASE_URL = 'https://cxhpxwjhguoumavqvhxg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hwazGN8JO8tR9KH-pbOCbg_O7zaqGKp';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Функция для подписки на новые сообщения (real-time)
export function subscribeToMessages(callback) {
  return supabase
    .channel('public:messages')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages' 
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
}