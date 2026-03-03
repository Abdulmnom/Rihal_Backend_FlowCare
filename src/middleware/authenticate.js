const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError } = require('../utils/errors');
const db = require('../database/connection');

/**
 * Authenticate middleware — verifies JWT access token.
 * Attaches user object to req.user on success.
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Access token is required');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret);

        // Fetch user from DB to ensure they still exist and are active
        const user = await db('users')
            .where({ id: decoded.id, is_active: true })
            .first();

        if (!user) {
            throw new UnauthorizedError('User not found or deactivated');
        }

        // Attach user to request (exclude password)
        const { password_hash, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new UnauthorizedError('Invalid access token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Access token has expired'));
        }
        next(error);
    }
};

module.exports = authenticate;
