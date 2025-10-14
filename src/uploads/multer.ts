import multer, { diskStorage } from 'multer';
import path from 'path';

export const uploadImage = multer({
  storage: diskStorage({
    destination: 'uploads',
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '.jpg');
      const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) return cb(new Error('Solo imágenes'));
    cb(null, true);
  },
});
