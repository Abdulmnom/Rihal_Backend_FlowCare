const express = require('express');
const router = express.Router();
const StaffServiceTypeService = require('../services/staffServiceTypeService');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { staffServiceTypeSchema } = require('../validators/schemas');
const validateUUID = require('../middleware/validateUUID');

// POST /api/v1/staff-service-types (assign)
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER),
    validate(staffServiceTypeSchema),
    asyncHandler(async (req, res) => {
        const assignment = await StaffServiceTypeService.assign(req.body, req.user.id, req.ip);
        res.status(201).json({ success: true, data: assignment });
    })
);

// DELETE /api/v1/staff-service-types/:id (unassign)
router.delete(
    '/:id',
    authenticate,
    validateUUID(),
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER),
    asyncHandler(async (req, res) => {
        const result = await StaffServiceTypeService.unassign(req.params.id, req.user.id, req.ip);
        res.json({ success: true, ...result });
    })
);

// GET /api/v1/staff-service-types/staff/:staffId
router.get(
    '/staff/:staffId',
    authenticate,
    validateUUID('staffId'),
    asyncHandler(async (req, res) => {
        const data = await StaffServiceTypeService.findByStaff(req.params.staffId);
        res.json({ success: true, data });
    })
);

// GET /api/v1/staff-service-types/service-type/:serviceTypeId
router.get(
    '/service-type/:serviceTypeId',
    authenticate,
    validateUUID('serviceTypeId'),
    asyncHandler(async (req, res) => {
        const data = await StaffServiceTypeService.findByServiceType(req.params.serviceTypeId);
        res.json({ success: true, data });
    })
);

module.exports = router;
