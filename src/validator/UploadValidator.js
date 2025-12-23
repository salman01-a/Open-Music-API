import multer from 'multer';
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './src/handler/album/cover_fileupload'); 
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG and PNG files are allowed'), false);
    }
} 
const upload = multer({storage
    , fileFilter
    , limits: { fileSize: 512000 }
})

export default upload;