const express = require('express');
const router = express.Router();
const BranchService = require('../services/branchService');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { branchSchema, branchUpdateSchema, paginationSchema } = require('../validators/schemas');
const validateUUID = require('../middleware/validateUUID');

// GET /api/v1/branches
router.get(
    '/',
    authenticate,
    validate(paginationSchema, 'query'),
    asyncHandler(async (req, res) => {
        const activeOnly = req.user.role === ROLES.CUSTOMER;
        const result = await BranchService.findAll({ ...req.query, activeOnly });
        res.json({ success: true, ...result });
    })
);

// GET /api/v1/branches/:id
router.get(
    '/:id',
    authenticate,
    validateUUID(),
    asyncHandler(async (req, res) => {
        const branch = await BranchService.findById(req.params.id);
        res.json({ success: true, data: branch });
    })
);

// POST /api/v1/branches
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(branchSchema),
    asyncHandler(async (req, res) => {
        const branch = await BranchService.create(req.body, req.user.id, req.ip);
        res.status(201).json({ success: true, data: branch });
    })
);

// PUT /api/v1/branches/:id
router.put(
    '/:id',
    authenticate,
    validateUUID(),
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER),
    validate(branchUpdateSchema),
    asyncHandler(async (req, res) => {
        const branch = await BranchService.update(req.params.id, req.body, req.user.id, req.ip);
        res.json({ success: true, data: branch });
    })
);

// DELETE /api/v1/branches/:id (deactivate)
router.delete(
    '/:id',
    authenticate,
    validateUUID(),
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
        const result = await BranchService.deactivate(req.params.id, req.user.id, req.ip);
        res.json({ success: true, ...result });
    })
);

module.exports = router;
