const express = require('express');
const router = express.Router();
const AuditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { auditLogQuerySchema } = require('../validators/schemas');

// GET /api/v1/audit-logs (admin only)
router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(auditLogQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const result = await AuditService.find({
            userId: req.query.user_id,
            action: req.query.action,
            entityType: req.query.entity_type,
            entityId: req.query.entity_id,
            dateFrom: req.query.date_from,
            dateTo: req.query.date_to,
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sort_by,
            sortOrder: req.query.sort_order,
        });
        res.json({ success: true, ...result });
    })
);

module.exports = router;
