// api/send-to-telegram.js
import { supabase } from '../js/supabase-client.js'; // Для локальной разработки
// В production используем process.env

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { nickname, message, imageUrl, platform } = req.body;
  
  if (!nickname || !message) {
    return res.status(400).json({ error: 'Nickname and message required' });
  }
  
  const formattedText = `[${nickname}${platform ? `@${platform}` : ''}] ${message}`;
  
  try {
    // 1. Сохраняем в базу
    const { data: dbData, error: dbError } = await supabase
      .from('messages')
      .insert([{
        nickname,
        message,
        image_url: imageUrl,
        platform: platform || 'website',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    // 2. Отправляем в Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      let telegramText = formattedText;
      if (imageUrl) {
        telegramText += `\n\n📷 Скриншот: ${imageUrl}`;
      }
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramText,
          parse_mode: 'HTML'
        })
      });
    }
    
    // 3. TODO: Отправка в VK (аналогично)
    
    res.status(200).json({ success: true, id: dbData.id });
    
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
