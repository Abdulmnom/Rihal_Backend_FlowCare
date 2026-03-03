const express = require('express');
const router = express.Router();
const SystemSettingsService = require('../services/systemSettingsService');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { systemSettingSchema } = require('../validators/schemas');

// GET /api/v1/settings
router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
        const data = await SystemSettingsService.findAll();
        res.json({ success: true, data });
    })
);

// GET /api/v1/settings/:key
router.get(
    '/:key',
    authenticate,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
        const setting = await SystemSettingsService.findByKey(req.params.key);
        res.json({ success: true, data: setting });
    })
);

// PUT /api/v1/settings/:key
router.put(
    '/:key',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(systemSettingSchema),
    asyncHandler(async (req, res) => {
        const setting = await SystemSettingsService.update(req.params.key, req.body, req.user.id, req.ip);
        res.json({ success: true, data: setting });
    })
);

module.exports = router;
