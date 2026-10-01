import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

function resolveEnvPath(): string {
  const searchPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env')
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return path.resolve(process.cwd(), '.env');
}

function parseEnv(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return vars;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      vars[key] = val;
    }
  }
  return vars;
}

export const adminController = {
  login(req: Request, res: Response): void {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || '1369';

    if (password === adminPassword) {
      res.json({
        success: true,
        message: 'Super Admin authenticated successfully!',
        token: 'admin-token-' + Date.now()
      });
    } else {
      res.status(401).json({ error: 'Invalid Admin Password.' });
    }
  },

  getEnv(req: Request, res: Response): void {
    const envPath = resolveEnvPath();
    const variables = parseEnv(envPath);
    const rawContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    res.json({
      success: true,
      envPath,
      variables,
      rawContent
    });
  },

  saveEnv(req: Request, res: Response): void {
    const { variables, rawContent } = req.body;
    const envPath = resolveEnvPath();

    try {
      // Backup existing file
      if (fs.existsSync(envPath)) {
        const backupPath = `${envPath}.backup_${Date.now()}`;
        fs.copyFileSync(envPath, backupPath);
      }

      if (typeof rawContent === 'string' && rawContent.trim().length > 0) {
        fs.writeFileSync(envPath, rawContent, 'utf-8');
      } else if (variables && typeof variables === 'object') {
        const existing = parseEnv(envPath);
        const merged = { ...existing, ...variables };
        const lines = Object.entries(merged).map(([k, v]) => {
          const val = String(v);
          if (val.includes(' ') || val.includes('#') || val === '') {
            return `${k}="${val}"`;
          }
          return `${k}=${val}`;
        });
        fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf-8');
      }

      res.json({
        success: true,
        message: 'Super Admin: .env configuration updated successfully!'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to write .env file: ' + err.message });
    }
  }
};
