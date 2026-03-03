const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { createUserSchema, updateUserSchema, paginationSchema } = require('../validators/schemas');
const validateUUID = require('../middleware/validateUUID');

// GET /api/v1/users
router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER),
    validate(paginationSchema, 'query'),
    asyncHandler(async (req, res) => {
        const filters = { ...req.query };
        // Branch managers can only see users from their branch
        if (req.user.role === ROLES.BRANCH_MANAGER) {
            filters.branchId = req.user.branch_id;
        }
        const result = await UserService.findAll(filters);
        res.json({ success: true, ...result });
    })
);

// GET /api/v1/users/profile
router.get(
    '/profile',
    authenticate,
    asyncHandler(async (req, res) => {
        const user = await UserService.getProfile(req.user.id);
        res.json({ success: true, data: user });
    })
);

// GET /api/v1/users/:id
router.get(
    '/:id',
    authenticate,
    validateUUID(),
    asyncHandler(async (req, res) => {
        // Customers & staff can only view their own profile
        if (
            (req.user.role === ROLES.CUSTOMER || req.user.role === ROLES.STAFF) &&
            req.params.id !== req.user.id
        ) {
            return res.status(403).json({ success: false, message: 'You can only view your own profile' });
        }
        const user = await UserService.findById(req.params.id);
        res.json({ success: true, data: user });
    })
);

// POST /api/v1/users
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER),
    validate(createUserSchema),
    asyncHandler(async (req, res) => {
        // Branch managers can only create staff in their branch
        if (req.user.role === ROLES.BRANCH_MANAGER) {
            req.body.branch_id = req.user.branch_id;
            if (req.body.role !== ROLES.STAFF) {
                return res.status(403).json({ success: false, message: 'Branch managers can only create staff users' });
            }
        }
        const user = await UserService.create(req.body, req.user.id, req.ip);
        res.status(201).json({ success: true, data: user });
    })
);

// PUT /api/v1/users/:id
router.put(
    '/:id',
    authenticate,
    validateUUID(),
    validate(updateUserSchema),
    asyncHandler(async (req, res) => {
        // Self-update: customers & staff can only update their own profile (limited fields)
        if (
            (req.user.role === ROLES.CUSTOMER || req.user.role === ROLES.STAFF) &&
            req.params.id !== req.user.id
        ) {
            return res.status(403).json({ success: false, message: 'You can only update your own profile' });
        }

        // Non-admins cannot change role or branch
        if (req.user.role !== ROLES.ADMIN) {
            delete req.body.role;
            delete req.body.is_active;
            if (req.user.role !== ROLES.BRANCH_MANAGER) {
                delete req.body.branch_id;
            }
        }

        const user = await UserService.update(req.params.id, req.body, req.user.id, req.ip);
        res.json({ success: true, data: user });
    })
);

// DELETE /api/v1/users/:id (deactivate)
router.delete(
    '/:id',
    authenticate,
    validateUUID(),
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER),
    asyncHandler(async (req, res) => {
        const result = await UserService.deactivate(req.params.id, req.user.id, req.ip);
        res.json({ success: true, ...result });
    })
);

module.exports = router;
