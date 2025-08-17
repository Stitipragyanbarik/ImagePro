import multer from "multer";


import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");

// Ensure the 'uploads' directory exists (needed for background removal)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage for most operations (compression, conversion)
const memoryStorage = multer.memoryStorage();

// Use disk storage only for background removal (needs file path)
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Default upload uses memory storage
const upload = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Special upload for background removal (needs disk storage)
export const uploadToDisk = multer({
    storage: diskStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

export default upload;
