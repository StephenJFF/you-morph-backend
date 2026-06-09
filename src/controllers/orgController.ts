import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../utils/db';

export const getAllOrgs = async (req: Request, res: Response) => {
  try {
    const orgs = await db.query('SELECT * FROM organizations');
    res.json(orgs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrgById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgs = await db.query(`SELECT * FROM organizations WHERE id = '${id}'`);
    if (orgs.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(orgs[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrg = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO organizations (id, name)
      VALUES ('${id}', '${name}')
    `);
    
    res.status(201).json({ id, name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrg = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    await db.query(`UPDATE organizations SET name = '${name}' WHERE id = '${id}'`);
    res.json({ message: 'Organization updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteOrg = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM organizations WHERE id = '${id}'`);
    res.json({ message: 'Organization deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
