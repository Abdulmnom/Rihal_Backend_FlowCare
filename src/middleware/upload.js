const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { BadRequestError } = require('../utils/errors');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestError(`File type '${file.mimetype}' is not allowed`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
    },
});

module.exports = upload;
