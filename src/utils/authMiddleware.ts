import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied, token missing' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role' });
    }
    next();
  };
};

export const requirePremium = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const users = await db.query(`SELECT subscription_tier FROM users WHERE id = '${req.user.id}'`);
    if (users.length === 0 || users[0].subscription_tier !== 'premium') {
      return res.status(403).json({ error: 'Premium subscription required for this feature' });
    }
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyClientAccess = (requiredBit: number) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const targetUserId = req.params.id || req.params.user_id || req.body.user_id;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID not found in request' });
    }

    // Users can always access their own data
    if (req.user.role === 'user' && req.user.id === targetUserId) {
      return next();
    }

    // Coaches need to have a relation with the user and the required permission bit
    if (req.user.role === 'coach') {
      try {
        const relations = await db.query(`
          SELECT permissions, status 
          FROM coach_client_relations 
          WHERE coach_id = '${req.user.id}' AND client_id = '${targetUserId}'
        `);

        if (relations.length === 0 || relations[0].status !== 'active') {
          return res.status(403).json({ error: 'No active relationship with this client' });
        }

        const permissions = relations[0].permissions;
        if ((permissions & requiredBit) !== 0) {
          return next();
        } else {
          return res.status(403).json({ error: 'Insufficient permissions for this client' });
        }
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }

    // Default deny for other cases (e.g., user trying to access another user's data)
    return res.status(403).json({ error: 'Access denied' });
  };
};
