// api/upload-image.js
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    // Простая обработка FormData через stream
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    
    // Конвертируем в base64 для Cloudinary
    const base64Image = buffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64Image}`;
    
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'last-asylum-chat',
      transformation: [
        { width: 1200, crop: 'limit' }, // Ограничение размера
        { quality: 'auto' } // Авто-оптимизация
      ]
    });
    
    res.status(200).json({ url: result.secure_url });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}