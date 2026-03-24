// api/send-to-telegram.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { nickname, message, imageUrl, platform } = req.body;

    if (!nickname || !message) {
      return res.status(400).json({ error: 'Nickname and message required' });
    }

    const formattedText = `[${nickname}] ${message}${imageUrl ? '\n\n📷 ' + imageUrl : ''}`;

    // 1. Сохраняем в Supabase
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
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (token && chatId) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedText
        })
      });
    }

    res.status(200).json({ success: true, id: dbData.id });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
