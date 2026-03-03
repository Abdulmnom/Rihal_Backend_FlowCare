const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');
const config = require('../config');
const { AUDIT_ACTIONS } = require('../config/constants');
const { UnauthorizedError, BadRequestError, ConflictError } = require('../utils/errors');
const AuditService = require('./auditService');

class AuthService {
    /**
     * Register a new customer.
     */
    static async register({ full_name, email, phone, password }, ipAddress) {
        const existing = await db('users').where({ email }).first();
        if (existing) {
            throw new ConflictError('A user with this email already exists');
        }

        const password_hash = await bcrypt.hash(password, 12);

        const [user] = await db('users')
            .insert({
                full_name,
                email,
                phone,
                password_hash,
                role: 'customer',
            })
            .returning('*');

        const { password_hash: _, ...userWithoutPassword } = user;

        await AuditService.log({
            userId: user.id,
            action: AUDIT_ACTIONS.USER_CREATED,
            entityType: 'user',
            entityId: user.id,
            newValues: { full_name, email, role: 'customer' },
            ipAddress,
        });

        const tokens = AuthService._generateTokens(user);

        return { user: userWithoutPassword, ...tokens };
    }

    /**
     * Login with email/password.
     */
    static async login({ email, password }, ipAddress, userAgent) {
        const user = await db('users').where({ email }).first();

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            // Log failed attempt
            await AuditService.log({
                userId: user?.id || null,
                action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
                entityType: 'user',
                entityId: user?.id || null,
                newValues: { email },
                ipAddress,
                userAgent,
            });
            throw new UnauthorizedError('Invalid email or password');
        }

        if (!user.is_active) {
            throw new UnauthorizedError('Account has been deactivated');
        }

        const { password_hash: _, ...userWithoutPassword } = user;

        await AuditService.log({
            userId: user.id,
            action: AUDIT_ACTIONS.AUTH_LOGIN,
            entityType: 'user',
            entityId: user.id,
            ipAddress,
            userAgent,
        });

        const tokens = AuthService._generateTokens(user);

        return { user: userWithoutPassword, ...tokens };
    }

    /**
     * Refresh access token.
     */
    static async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
            const user = await db('users').where({ id: decoded.id, is_active: true }).first();

            if (!user) {
                throw new UnauthorizedError('User not found or deactivated');
            }

            const accessToken = jwt.sign(
                { id: user.id, role: user.role, branch_id: user.branch_id },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            return { accessToken };
        } catch (error) {
            if (error instanceof UnauthorizedError) throw error;
            throw new UnauthorizedError('Invalid or expired refresh token');
        }
    }

    /**
     * Change password.
     */
    static async changePassword(userId, { current_password, new_password }, ipAddress) {
        const user = await db('users').where({ id: userId }).first();

        if (!user) {
            throw new BadRequestError('User not found');
        }

        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            throw new BadRequestError('Current password is incorrect');
        }

        const password_hash = await bcrypt.hash(new_password, 12);
        await db('users').where({ id: userId }).update({ password_hash, updated_at: db.fn.now() });

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.AUTH_PASSWORD_CHANGED,
            entityType: 'user',
            entityId: userId,
            ipAddress,
        });

        return { message: 'Password changed successfully' };
    }

    /**
     * Generate access + refresh tokens.
     */
    static _generateTokens(user) {
        const accessToken = jwt.sign(
            { id: user.id, role: user.role, branch_id: user.branch_id },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiresIn }
        );

        return { accessToken, refreshToken };
    }
}

module.exports = AuthService;
