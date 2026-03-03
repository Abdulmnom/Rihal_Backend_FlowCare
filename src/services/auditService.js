const db = require('../database/connection');

/**
 * AuditService — append-only audit log writer.
 */
class AuditService {
    /**
     * Log an auditable action.
     * @param {Object} params
     * @param {string} params.userId - Who performed the action
     * @param {string} params.action - Action constant (e.g. APPOINTMENT_BOOKED)
     * @param {string} params.entityType - Table name (e.g. 'appointment')
     * @param {string} [params.entityId] - PK of the affected row
     * @param {Object} [params.oldValues] - State before change
     * @param {Object} [params.newValues] - State after change
     * @param {string} [params.ipAddress] - Client IP
     * @param {string} [params.userAgent] - Client user-agent
     * @param {Object} [trx] - Knex transaction object (optional)
     */
    static async log({ userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent }, trx = null) {
        const query = (trx || db)('audit_logs').insert({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            old_values: oldValues ? JSON.stringify(oldValues) : null,
            new_values: newValues ? JSON.stringify(newValues) : null,
            ip_address: ipAddress,
            user_agent: userAgent,
        });

        return query;
    }

    /**
     * Query audit logs with filters and pagination.
     */
    static async find({ userId, action, entityType, entityId, dateFrom, dateTo, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' }) {
        const query = db('audit_logs')
            .leftJoin('users', 'audit_logs.user_id', 'users.id')
            .select(
                'audit_logs.*',
                'users.full_name as user_name',
                'users.email as user_email'
            );

        if (userId) query.where('audit_logs.user_id', userId);
        if (action) query.where('audit_logs.action', action);
        if (entityType) query.where('audit_logs.entity_type', entityType);
        if (entityId) query.where('audit_logs.entity_id', entityId);
        if (dateFrom) query.where('audit_logs.created_at', '>=', dateFrom);
        if (dateTo) query.where('audit_logs.created_at', '<=', dateTo);

        const countQuery = query.clone().clearSelect().clearOrder().count('audit_logs.id as total').first();
        const total = (await countQuery).total;

        const offset = (page - 1) * limit;
        const data = await query.orderBy(`audit_logs.${sortBy}`, sortOrder).limit(limit).offset(offset);

        return {
            data,
            pagination: {
                page,
                limit,
                total: parseInt(total),
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

module.exports = AuditService;
