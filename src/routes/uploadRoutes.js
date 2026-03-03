const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');
const { BadRequestError } = require('../utils/errors');

// POST /api/v1/uploads/id-document
router.post(
    '/id-document',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.CUSTOMER),
    upload.single('file'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new BadRequestError('No file uploaded');
        }

        res.status(201).json({
            success: true,
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: `/uploads/${req.file.filename}`,
            },
        });
    })
);

// POST /api/v1/uploads/attachment
router.post(
    '/attachment',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.CUSTOMER),
    upload.single('file'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new BadRequestError('No file uploaded');
        }

        res.status(201).json({
            success: true,
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: `/uploads/${req.file.filename}`,
            },
        });
    })
);

module.exports = router;
