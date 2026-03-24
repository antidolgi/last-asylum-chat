// api/send-to-telegram.js
import { createClient } from '@supabase/supabase-js';

// Создаём клиент Supabase для сервера
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ Только для сервера!
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nickname, message, imageUrl, platform } = req.body;

    if (!nickname || !message) {
      return res.status(400).json({ error: 'Nickname and message required' });
    }

    const formattedText = `[${nickname}${platform ? `@${platform}` : ''}] ${message}`;

    // 1. Сохраняем в базу Supabase
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

    if (dbError) {
      console.error('Supabase error:', dbError);
      throw dbError;
    }

    // 2. Отправляем в Telegram
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (token && chatId) {
      let telegramText = formattedText;
      if (imageUrl) {
        telegramText += `\n\n📷 Скриншот: ${imageUrl}`;
      }

      const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramText,
          parse_mode: 'HTML'
        })
      });

      if (!telegramResponse.ok) {
        const errorData = await telegramResponse.json();
        console.error('Telegram API error:', errorData);
      }
    }

    res.status(200).json({ success: true, id: dbData.id });

  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
