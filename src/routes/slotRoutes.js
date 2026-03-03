const express = require('express');
const router = express.Router();
const SlotService = require('../services/slotService');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorize, branchScope } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { slotSchema, slotUpdateSchema, slotQuerySchema } = require('../validators/schemas');
const validateUUID = require('../middleware/validateUUID');

// GET /api/v1/slots
router.get(
    '/',
    authenticate,
    validate(slotQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const filters = { ...req.query };
        // Staff/managers only see their branch's slots
        if (req.user.role === ROLES.BRANCH_MANAGER || req.user.role === ROLES.STAFF) {
            filters.branchId = req.user.branch_id;
        }
        const result = await SlotService.findAll(filters);
        res.json({ success: true, ...result });
    })
);

// GET /api/v1/slots/:id
router.get(
    '/:id',
    authenticate,
    validateUUID(),
    asyncHandler(async (req, res) => {
        const slot = await SlotService.findById(req.params.id);
        res.json({ success: true, data: slot });
    })
);

// POST /api/v1/slots
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER),
    validate(slotSchema),
    branchScope,
    asyncHandler(async (req, res) => {
        // Branch managers can only create slots for their branch
        if (req.user.role === ROLES.BRANCH_MANAGER) {
            req.body.branch_id = req.user.branch_id;
        }
        const slot = await SlotService.create(req.body, req.user.id, req.ip);
        res.status(201).json({ success: true, data: slot });
    })
);

// PUT /api/v1/slots/:id
router.put(
    '/:id',
    authenticate,
    validateUUID(),
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER),
    validate(slotUpdateSchema),
    asyncHandler(async (req, res) => {
        const slot = await SlotService.update(req.params.id, req.body, req.user.id, req.ip);
        res.json({ success: true, data: slot });
    })
);

// DELETE /api/v1/slots/:id (soft delete)
router.delete(
    '/:id',
    authenticate,
    validateUUID(),
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER),
    asyncHandler(async (req, res) => {
        const result = await SlotService.softDelete(req.params.id, req.user.id, req.ip);
        res.json({ success: true, ...result });
    })
);

module.exports = router;
