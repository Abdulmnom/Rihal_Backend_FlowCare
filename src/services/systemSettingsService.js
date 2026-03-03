const db = require('../database/connection');
const { AUDIT_ACTIONS } = require('../config/constants');
const { NotFoundError } = require('../utils/errors');
const AuditService = require('./auditService');

class SystemSettingsService {
    static async findAll() {
        return db('system_settings').orderBy('key', 'asc');
    }

    static async findByKey(key) {
        const setting = await db('system_settings').where({ key }).first();
        if (!setting) throw new NotFoundError('System Setting');
        return setting;
    }

    static async update(key, { value, description }, userId, ipAddress) {
        const existing = await db('system_settings').where({ key }).first();
        if (!existing) throw new NotFoundError('System Setting');

        const updateData = { value, updated_at: db.fn.now() };
        if (description !== undefined) updateData.description = description;

        const [updated] = await db('system_settings')
            .where({ key })
            .update(updateData)
            .returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.SETTINGS_UPDATED,
            entityType: 'system_settings',
            entityId: existing.id,
            oldValues: { key, value: existing.value },
            newValues: { key, value },
            ipAddress,
        });

        return updated;
    }
}

module.exports = SystemSettingsService;
