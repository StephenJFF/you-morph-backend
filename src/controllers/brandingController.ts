import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../utils/db';

export const getBrandingByOwnerId = async (req: Request, res: Response) => {
  try {
    const { owner_id } = req.params;
    const configs = await db.query(`SELECT * FROM branding_configs WHERE owner_id = '${owner_id}'`);
    if (configs.length === 0) {
      return res.status(404).json({ error: 'Branding config not found' });
    }
    res.json(configs[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const upsertBranding = async (req: Request, res: Response) => {
  try {
    const { owner_id, company_name, logo_url, primary_color, secondary_color, custom_font, welcome_message, custom_domain } = req.body;
    
    if (!owner_id) {
      return res.status(400).json({ error: 'owner_id is required' });
    }

    // Check if exists
    const existing = await db.query(`SELECT id FROM branding_configs WHERE owner_id = '${owner_id}'`);
    
    if (existing.length > 0) {
      const id = existing[0].id;
      const updates = [];
      if (company_name) updates.push(`company_name = '${company_name}'`);
      if (logo_url) updates.push(`logo_url = '${logo_url}'`);
      if (primary_color) updates.push(`primary_color = '${primary_color}'`);
      if (secondary_color) updates.push(`secondary_color = '${secondary_color}'`);
      if (custom_font) updates.push(`custom_font = '${custom_font}'`);
      if (welcome_message) updates.push(`welcome_message = '${welcome_message}'`);
      if (custom_domain) updates.push(`custom_domain = '${custom_domain}'`);
      
      if (updates.length > 0) {
        await db.query(`UPDATE branding_configs SET ${updates.join(', ')} WHERE id = '${id}'`);
      }
      res.json({ message: 'Branding updated', id });
    } else {
      const id = uuidv4();
      const val = (v: any) => v ? `'${v}'` : 'NULL';
      await db.query(`
        INSERT INTO branding_configs (id, owner_id, company_name, logo_url, primary_color, secondary_color, custom_font, welcome_message, custom_domain)
        VALUES ('${id}', '${owner_id}', ${val(company_name)}, ${val(logo_url)}, ${val(primary_color)}, ${val(secondary_color)}, ${val(custom_font)}, ${val(welcome_message)}, ${val(custom_domain)})
      `);
      res.status(201).json({ message: 'Branding created', id });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
