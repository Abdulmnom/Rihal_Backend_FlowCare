const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const { AUDIT_ACTIONS } = require('../config/constants');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const AuditService = require('./auditService');

class UserService {
    static async create(data, creatorId, ipAddress) {
        const existing = await db('users').where({ email: data.email }).first();
        if (existing) throw new ConflictError('A user with this email already exists');

        const password_hash = await bcrypt.hash(data.password, 12);
        const { password, ...userData } = data;

        const [user] = await db('users')
            .insert({ ...userData, password_hash })
            .returning('*');

        const { password_hash: _, ...userWithoutPassword } = user;

        await AuditService.log({
            userId: creatorId,
            action: AUDIT_ACTIONS.USER_CREATED,
            entityType: 'user',
            entityId: user.id,
            newValues: { full_name: data.full_name, email: data.email, role: data.role },
            ipAddress,
        });

        return userWithoutPassword;
    }

    static async findAll({ page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', branchId = null, role = null }) {
        const query = db('users')
            .leftJoin('branches', 'users.branch_id', 'branches.id')
            .select(
                'users.id',
                'users.full_name',
                'users.email',
                'users.phone',
                'users.role',
                'users.branch_id',
                'users.is_active',
                'users.created_at',
                'users.updated_at',
                'branches.name as branch_name'
            );

        if (branchId) query.where('users.branch_id', branchId);
        if (role) query.where('users.role', role);

        const countResult = await query.clone().clearSelect().clearOrder().count('users.id as total').first();
        const total = parseInt(countResult.total);
        const offset = (page - 1) * limit;

        const data = await query.orderBy(`users.${sortBy}`, sortOrder).limit(limit).offset(offset);

        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    static async findById(id) {
        const user = await db('users')
            .leftJoin('branches', 'users.branch_id', 'branches.id')
            .select(
                'users.id',
                'users.full_name',
                'users.email',
                'users.phone',
                'users.role',
                'users.branch_id',
                'users.is_active',
                'users.created_at',
                'users.updated_at',
                'branches.name as branch_name'
            )
            .where('users.id', id)
            .first();

        if (!user) throw new NotFoundError('User');
        return user;
    }

    static async update(id, data, updaterId, ipAddress) {
        const existing = await db('users').where({ id }).first();
        if (!existing) throw new NotFoundError('User');

        const oldRole = existing.role;

        const [updated] = await db('users')
            .where({ id })
            .update({ ...data, updated_at: db.fn.now() })
            .returning('*');

        const { password_hash: _, ...userWithoutPassword } = updated;

        // Log role change separately
        if (data.role && data.role !== oldRole) {
            await AuditService.log({
                userId: updaterId,
                action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
                entityType: 'user',
                entityId: id,
                oldValues: { role: oldRole },
                newValues: { role: data.role },
                ipAddress,
            });
        }

        await AuditService.log({
            userId: updaterId,
            action: AUDIT_ACTIONS.USER_UPDATED,
            entityType: 'user',
            entityId: id,
            oldValues: { full_name: existing.full_name, phone: existing.phone },
            newValues: data,
            ipAddress,
        });

        return userWithoutPassword;
    }

    static async deactivate(id, updaterId, ipAddress) {
        const existing = await db('users').where({ id }).first();
        if (!existing) throw new NotFoundError('User');

        await db('users').where({ id }).update({ is_active: false, updated_at: db.fn.now() });

        await AuditService.log({
            userId: updaterId,
            action: AUDIT_ACTIONS.USER_DEACTIVATED,
            entityType: 'user',
            entityId: id,
            oldValues: { is_active: true },
            newValues: { is_active: false },
            ipAddress,
        });

        return { message: 'User deactivated successfully' };
    }

    static async getProfile(userId) {
        return UserService.findById(userId);
    }
}

module.exports = UserService;
