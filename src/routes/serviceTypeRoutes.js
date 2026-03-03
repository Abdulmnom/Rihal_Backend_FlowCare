const express = require('express');
const router = express.Router();
const ServiceTypeService = require('../services/serviceTypeService');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { serviceTypeSchema, serviceTypeUpdateSchema, paginationSchema } = require('../validators/schemas');
const validateUUID = require('../middleware/validateUUID');

// GET /api/v1/service-types
router.get(
    '/',
    authenticate,
    validate(paginationSchema, 'query'),
    asyncHandler(async (req, res) => {
        const activeOnly = req.user.role === ROLES.CUSTOMER;
        const result = await ServiceTypeService.findAll({ ...req.query, activeOnly });
        res.json({ success: true, ...result });
    })
);

// GET /api/v1/service-types/:id
router.get(
    '/:id',
    authenticate,
    validateUUID(),
    asyncHandler(async (req, res) => {
        const serviceType = await ServiceTypeService.findById(req.params.id);
        res.json({ success: true, data: serviceType });
    })
);

// POST /api/v1/service-types
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(serviceTypeSchema),
    asyncHandler(async (req, res) => {
        const serviceType = await ServiceTypeService.create(req.body, req.user.id, req.ip);
        res.status(201).json({ success: true, data: serviceType });
    })
);

// PUT /api/v1/service-types/:id
router.put(
    '/:id',
    authenticate,
    validateUUID(),
    authorize(ROLES.ADMIN),
    validate(serviceTypeUpdateSchema),
    asyncHandler(async (req, res) => {
        const serviceType = await ServiceTypeService.update(req.params.id, req.body, req.user.id, req.ip);
        res.json({ success: true, data: serviceType });
    })
);

module.exports = router;
