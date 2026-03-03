const db = require('../database/connection');
const { AUDIT_ACTIONS } = require('../config/constants');
const { NotFoundError } = require('../utils/errors');
const AuditService = require('./auditService');

class ServiceTypeService {
    static async create(data, userId, ipAddress) {
        const [serviceType] = await db('service_types').insert(data).returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.SERVICE_TYPE_CREATED,
            entityType: 'service_type',
            entityId: serviceType.id,
            newValues: data,
            ipAddress,
        });

        return serviceType;
    }

    static async findAll({ page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', activeOnly = false }) {
        const query = db('service_types');
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
        const serviceType = await db('service_types').where({ id }).first();
        if (!serviceType) throw new NotFoundError('Service Type');
        return serviceType;
    }

    static async update(id, data, userId, ipAddress) {
        const existing = await db('service_types').where({ id }).first();
        if (!existing) throw new NotFoundError('Service Type');

        const [updated] = await db('service_types')
            .where({ id })
            .update({ ...data, updated_at: db.fn.now() })
            .returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.SERVICE_TYPE_UPDATED,
            entityType: 'service_type',
            entityId: id,
            oldValues: existing,
            newValues: data,
            ipAddress,
        });

        return updated;
    }
}

module.exports = ServiceTypeService;
