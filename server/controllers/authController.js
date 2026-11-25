import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function issueToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  return res.json({ token: issueToken(user), user: publicUser(user) });
}

export async function register(req, res) {
  const { name, email, password, role = 'Staff' } = req.body;
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }
  const user = await User.create({ name, email, password, role });
  return res.status(201).json({ user: publicUser(user) });
}
