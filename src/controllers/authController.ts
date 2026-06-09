import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../utils/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check if email already exists in users or coaches
    const existingUser = await db.query(`SELECT id FROM users WHERE email = '${email}'`);
    const existingCoach = await db.query(`SELECT id FROM coaches WHERE email = '${email}'`);

    if (existingUser.length > 0 || existingCoach.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    if (role === 'coach') {
      await db.query(`INSERT INTO coaches (id, name, email) VALUES ('${id}', '${name}', '${email}')`);
    } else {
      await db.query(`INSERT INTO users (id, name, email) VALUES ('${id}', '${name}', '${email}')`);
    }

    await db.query(`INSERT INTO auth (user_id, password_hash, role) VALUES ('${id}', '${passwordHash}', '${role}')`);

    const token = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ id, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email in both tables
    let user = await db.query(`SELECT id FROM users WHERE email = '${email}'`);
    let role = 'user';

    if (user.length === 0) {
      user = await db.query(`SELECT id FROM coaches WHERE email = '${email}'`);
      role = 'coach';
    }

    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userId = user[0].id;
    const auth = await db.query(`SELECT password_hash, role FROM auth WHERE user_id = '${userId}'`);

    if (auth.length === 0) {
      return res.status(401).json({ error: 'Authentication not set up for this user' });
    }

    const isMatch = await bcrypt.compare(password, auth[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: userId, role: auth[0].role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ id: userId, role: auth[0].role, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
