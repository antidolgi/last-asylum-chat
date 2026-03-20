// api/upload-image.js
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Инициализация Supabase для серверной части
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ Только для сервера!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Парсим multipart/form-data вручную (простой способ)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    
    // Извлекаем файл из FormData (упрощённо)
    // В реальном проекте лучше использовать busboy или multiparty
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) throw new Error('No boundary found');

    const body = buffer.toString('binary');
    const fileMatch = body.match(/Content-Disposition:.*filename="[^"]+"\r\n\r\n([\s\S]*?)--/);
    
    if (!fileMatch || !fileMatch[1]) {
      return res.status(400).json({ error: 'No file found in request' });
    }

    const fileBuffer = Buffer.from(fileMatch[1].trim(), 'binary');
    const fileName = `${uuidv4()}.jpg`;
    const filePath = `screenshots/${fileName}`;

    // Загружаем в Supabase Storage
    const { data, error } = await supabase.storage
      .from('alliance-chat')
      .upload(filePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    // Получаем публичную ссылку
    const { data: { publicUrl } } = supabase.storage
      .from('alliance-chat')
      .getPublicUrl(filePath);

    res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
}
