import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'smart-agriculture-ai-uploads')
  : 'uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const upload = multer({ dest: uploadDir });
