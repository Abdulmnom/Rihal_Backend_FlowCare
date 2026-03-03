const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, changePasswordSchema } = require('../validators/schemas');

// POST /api/v1/auth/register
router.post(
    '/register',
    validate(registerSchema),
    asyncHandler(async (req, res) => {
        const result = await AuthService.register(req.body, req.ip);
        res.status(201).json({ success: true, data: result });
    })
);

// POST /api/v1/auth/login
router.post(
    '/login',
    validate(loginSchema),
    asyncHandler(async (req, res) => {
        const result = await AuthService.login(req.body, req.ip, req.get('user-agent'));
        res.json({ success: true, data: result });
    })
);

// POST /api/v1/auth/refresh
router.post(
    '/refresh',
    asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }
        const result = await AuthService.refreshToken(refreshToken);
        res.json({ success: true, data: result });
    })
);

// PUT /api/v1/auth/change-password
router.put(
    '/change-password',
    authenticate,
    validate(changePasswordSchema),
    asyncHandler(async (req, res) => {
        const result = await AuthService.changePassword(req.user.id, req.body, req.ip);
        res.json({ success: true, data: result });
    })
);

// GET /api/v1/auth/me
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req, res) => {
        res.json({ success: true, data: req.user });
    })
);

module.exports = router;
