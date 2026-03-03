const db = require('../database/connection');
const { AUDIT_ACTIONS } = require('../config/constants');
const { NotFoundError, ConflictError } = require('../utils/errors');
const AuditService = require('./auditService');

class BranchService {
    static async create(data, userId, ipAddress) {
        const [branch] = await db('branches').insert(data).returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.BRANCH_CREATED,
            entityType: 'branch',
            entityId: branch.id,
            newValues: data,
            ipAddress,
        });

        return branch;
    }

    static async findAll({ page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', activeOnly = false }) {
        const query = db('branches');
        if (activeOnly) query.where('is_active', true);

        const countResult = await query.clone().count('id as total').first();
        const total = parseInt(countResult.total);
        const offset = (page - 1) * limit;

        const data = await query.orderBy(sortBy, sortOrder).limit(limit).offset(offset);

        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    static async findById(id) {
        const branch = await db('branches').where({ id }).first();
        if (!branch) throw new NotFoundError('Branch');
        return branch;
    }

    static async update(id, data, userId, ipAddress) {
        const existing = await db('branches').where({ id }).first();
        if (!existing) throw new NotFoundError('Branch');

        const [updated] = await db('branches')
            .where({ id })
            .update({ ...data, updated_at: db.fn.now() })
            .returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.BRANCH_UPDATED,
            entityType: 'branch',
            entityId: id,
            oldValues: existing,
            newValues: data,
            ipAddress,
        });

        return updated;
    }

    static async deactivate(id, userId, ipAddress) {
        const existing = await db('branches').where({ id }).first();
        if (!existing) throw new NotFoundError('Branch');

        await db('branches').where({ id }).update({ is_active: false, updated_at: db.fn.now() });

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.BRANCH_DEACTIVATED,
            entityType: 'branch',
            entityId: id,
            oldValues: { is_active: true },
            newValues: { is_active: false },
            ipAddress,
        });

        return { message: 'Branch deactivated successfully' };
    }
}

module.exports = BranchService;
