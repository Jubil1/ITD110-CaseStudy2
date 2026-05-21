const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userRepo = require('../models/userRepo');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function register(req, res) {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: 'username, email, and password are required' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'username must be at least 3 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid email address' });
  }

  try {
    if (await userRepo.findByUsername(username)) {
      return res.status(409).json({ error: 'username already taken' });
    }
    if (await userRepo.findByEmail(email)) {
      return res.status(409).json({ error: 'email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const created = await userRepo.createUser({ username, email, passwordHash });
    const safeUser = userRepo.toPublic(created);
    const token = signToken(safeUser);

    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error('[auth.register]', err);
    res.status(500).json({ error: 'failed to register user' });
  }
}

async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const user = await userRepo.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const safeUser = userRepo.toPublic(user);
    const token = signToken(safeUser);

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('[auth.login]', err);
    res.status(500).json({ error: 'failed to log in' });
  }
}

async function me(req, res) {
  try {
    const user = await userRepo.findByUsername(req.user.username);
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json({ user: userRepo.toPublic(user) });
  } catch (err) {
    console.error('[auth.me]', err);
    res.status(500).json({ error: 'failed to load user' });
  }
}

module.exports = { register, login, me };
