import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../utils/db';
import { AuthRequest } from '../utils/authMiddleware';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await db.query('SELECT * FROM users');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const users = await db.query(`SELECT * FROM users WHERE id = '${id}'`);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, gender, height_cm, wrist_cm, shoulder_cm, ankle_cm, target_weight_kg } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const id = uuidv4();
    const val = (v: any) => (v !== undefined && v !== null) ? v : 'NULL';
    
    await db.query(`
      INSERT INTO users (id, name, email, gender, height_cm, wrist_cm, shoulder_cm, ankle_cm, target_weight_kg)
      VALUES ('${id}', '${name}', '${email}', ${gender ? `'${gender}'` : 'NULL'}, ${val(height_cm)}, ${val(wrist_cm)}, ${val(shoulder_cm)}, ${val(ankle_cm)}, ${val(target_weight_kg)})
    `);
    
    res.status(201).json({ id, name, email, gender, height_cm, wrist_cm, shoulder_cm, ankle_cm, target_weight_kg });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, gender, height_cm, wrist_cm, shoulder_cm, ankle_cm, target_weight_kg } = req.body;
    
    // Build update string
    const updates = [];
    if (name) updates.push(`name = '${name}'`);
    if (email) updates.push(`email = '${email}'`);
    if (gender) updates.push(`gender = '${gender}'`);
    if (height_cm) updates.push(`height_cm = ${height_cm}`);
    if (wrist_cm) updates.push(`wrist_cm = ${wrist_cm}`);
    if (shoulder_cm) updates.push(`shoulder_cm = ${shoulder_cm}`);
    if (ankle_cm) updates.push(`ankle_cm = ${ankle_cm}`);
    if (target_weight_kg) updates.push(`target_weight_kg = ${target_weight_kg}`);
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = '${id}'`);
    res.json({ message: 'User updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM users WHERE id = '${id}'`);
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.id;
    const invitations = await db.query(`
      SELECT r.id, r.status, r.created_at, c.name as coach_name, c.email as coach_email
      FROM coach_client_relations r
      JOIN coaches c ON r.coach_id = c.id
      WHERE r.client_id = '${user_id}' AND r.status = 'pending'
    `);
    res.json(invitations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const respondToInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { invitationId } = req.params;
    const { status } = req.body; // 'active' or 'terminated'

    if (!['active', 'terminated'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or terminated' });
    }

    // Ensure the invitation belongs to this user
    const invitation = await db.query(`SELECT id FROM coach_client_relations WHERE id = '${invitationId}' AND client_id = '${user_id}'`);
    if (invitation.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    await db.query(`UPDATE coach_client_relations SET status = '${status}' WHERE id = '${invitationId}'`);
    
    res.json({ message: `Invitation ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
