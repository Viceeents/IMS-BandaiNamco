import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('name email role');
    if (!user) return res.status(401).json({ message: 'Account is no longer available.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Session is invalid or expired.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'Admin') return res.status(403).json({ message: 'Administrator access required.' });
  return next();
}
