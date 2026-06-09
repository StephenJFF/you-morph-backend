import { Response } from 'express';
import * as db from '../utils/db';
import { AuthRequest } from '../utils/authMiddleware';

export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.query(`UPDATE users SET subscription_tier = 'premium' WHERE id = '${user_id}'`);
    
    res.json({ message: 'Successfully upgraded to premium', subscription_tier: 'premium' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
