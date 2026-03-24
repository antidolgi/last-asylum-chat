// api/send-to-telegram.js — МИНИМАЛЬНЫЙ ТЕСТ
export default async function handler(req, res) {
  console.log('Request received:', req.method, req.url);
  
  if (req.method === 'POST') {
    return res.status(200).json({ 
      success: true, 
      message: 'API works!',
      body: req.body 
    });
  }
  
  return res.status(405).json({ error: 'Only POST allowed' });
}
