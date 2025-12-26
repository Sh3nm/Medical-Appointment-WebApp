import { diskStorage } from 'multer';
import { extname } from 'path';

const storageDestination = './uploads'; 

export const multerOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  
  storage: diskStorage({
    destination: storageDestination,
    
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = extname(file.originalname);
      const filename = `${uniqueSuffix}${extension}`;
      callback(null, filename);
    },
  }),
  
  fileFilter: (req, file, callback) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
      callback(null, true);
    } else {
      callback(new Error('Jenis file tidak diizinkan. Hanya JPEG, PNG, atau PDF yang diizinkan.'), false);
    }
  },
};