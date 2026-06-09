import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../utils/db';
import { AuthRequest } from '../utils/authMiddleware';

export const getAllCoaches = async (req: Request, res: Response) => {
  try {
    const coaches = await db.query('SELECT * FROM coaches');
    res.json(coaches);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCoach = async (req: Request, res: Response) => {
  try {
    const { org_id, name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO coaches (id, org_id, name, email)
      VALUES ('${id}', ${org_id ? `'${org_id}'` : 'NULL'}, '${name}', '${email}')
    `);
    
    res.status(201).json({ id, org_id, name, email });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const inviteClient = async (req: AuthRequest, res: Response) => {
  try {
    const coach_id = req.user?.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Client email is required' });
    }

    // Find user by email
    const users = await db.query(`SELECT id FROM users WHERE email = '${email}'`);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const client_id = users[0].id;
    const relation_id = uuidv4();

    await db.query(`
      INSERT INTO coach_client_relations (id, coach_id, client_id, status)
      VALUES ('${relation_id}', '${coach_id}', '${client_id}', 'pending')
    `);

    res.status(201).json({ id: relation_id, coach_id, client_id, status: 'pending' });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Invitation or relation already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateClientPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const coach_id = req.user?.id;
    const { clientId } = req.params;
    const { permissions } = req.body;

    if (permissions === undefined) {
      return res.status(400).json({ error: 'Permissions bitmask is required' });
    }

    await db.query(`
      UPDATE coach_client_relations 
      SET permissions = ${permissions} 
      WHERE coach_id = '${coach_id}' AND client_id = '${clientId}'
    `);

    res.json({ message: 'Permissions updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCoachClients = async (req: AuthRequest, res: Response) => {
  try {
    const coach_id = req.user?.id;
    const clients = await db.query(`
      SELECT u.*, r.status, r.permissions, r.id as relation_id
      FROM users u
      JOIN coach_client_relations r ON u.id = r.client_id
      WHERE r.coach_id = '${coach_id}'
    `);
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
