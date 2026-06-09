import { Request, Response } from 'express';
import * as db from '../utils/db';

export const createCheckin = async (req: Request, res: Response) => {
  try {
    const { user_id, weight_kg, waist_cm, hips_cm, chest_cm, arm_girth_cm, thigh_girth_cm, fat_percentage } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const val = (v: any) => (v !== undefined && v !== null) ? v : 'NULL';
    
    await db.query(`
      INSERT INTO client_measurements (user_id, weight_kg, waist_cm, hips_cm, chest_cm, arm_girth_cm, thigh_girth_cm, fat_percentage)
      VALUES (
        '${user_id}', 
        ${val(weight_kg)}, 
        ${val(waist_cm)}, 
        ${val(hips_cm)}, 
        ${val(chest_cm)}, 
        ${val(arm_girth_cm)}, 
        ${val(thigh_girth_cm)}, 
        ${val(fat_percentage)}
      )
    `);
    
    res.status(201).json({ message: 'Checkin recorded' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCheckinsByUserId = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const checkins = await db.query(`SELECT * FROM client_measurements WHERE user_id = '${user_id}' ORDER BY recorded_at DESC`);
    res.json(checkins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
