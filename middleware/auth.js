import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  console.log('[Auth Debug] Cookies received:', req.cookies);
  console.log('[Auth Debug] Headers:', req.headers.cookie);
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'No autorizado. Token faltante.' });

  try {
    if (!process.env.JWT_SECRET) {
      console.error('[Auth Error] FATAL: JWT_SECRET no está configurado en .env');
      return res.status(500).json({ error: 'Error interno del servidor (JWT no configurado).' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};
