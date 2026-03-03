const db = require('../database/connection');
const { AUDIT_ACTIONS } = require('../config/constants');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const AuditService = require('./auditService');

class SlotService {
    static async create(data, userId, ipAddress) {
        // Verify branch and service type exist
        const branch = await db('branches').where({ id: data.branch_id, is_active: true }).first();
        if (!branch) throw new NotFoundError('Active Branch');

        const serviceType = await db('service_types').where({ id: data.service_type_id, is_active: true }).first();
        if (!serviceType) throw new NotFoundError('Active Service Type');

        const [slot] = await db('slots').insert(data).returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.SLOT_CREATED,
            entityType: 'slot',
            entityId: slot.id,
            newValues: data,
            ipAddress,
        });

        return slot;
    }

    static async findAll({
        page = 1,
        limit = 20,
        sortBy = 'slot_date',
        sortOrder = 'asc',
        branchId,
        serviceTypeId,
        date,
        dateFrom,
        dateTo,
        available,
    }) {
        const query = db('slots')
            .join('branches', 'slots.branch_id', 'branches.id')
            .join('service_types', 'slots.service_type_id', 'service_types.id')
            .select(
                'slots.*',
                'branches.name as branch_name',
                'service_types.name as service_type_name',
                'service_types.duration_minutes'
            )
            .where('slots.deleted_at', null)
            .where('slots.is_active', true);

        if (branchId) query.where('slots.branch_id', branchId);
        if (serviceTypeId) query.where('slots.service_type_id', serviceTypeId);
        if (date) query.where('slots.slot_date', date);
        if (dateFrom) query.where('slots.slot_date', '>=', dateFrom);
        if (dateTo) query.where('slots.slot_date', '<=', dateTo);
        if (available === true || available === 'true') {
            query.whereRaw('slots.current_bookings < slots.max_bookings');
        }

        const countResult = await query.clone().clearSelect().clearOrder().count('slots.id as total').first();
        const total = parseInt(countResult.total);
        const offset = (page - 1) * limit;

        const data = await query.orderBy(`slots.${sortBy}`, sortOrder).limit(limit).offset(offset);

        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    static async findById(id) {
        const slot = await db('slots')
            .join('branches', 'slots.branch_id', 'branches.id')
            .join('service_types', 'slots.service_type_id', 'service_types.id')
            .select(
                'slots.*',
                'branches.name as branch_name',
                'service_types.name as service_type_name',
                'service_types.duration_minutes'
            )
            .where('slots.id', id)
            .where('slots.deleted_at', null)
            .first();

        if (!slot) throw new NotFoundError('Slot');
        return slot;
    }

    static async update(id, data, userId, ipAddress) {
        const existing = await db('slots').where({ id, deleted_at: null }).first();
        if (!existing) throw new NotFoundError('Slot');

        // Prevent reducing max_bookings below current_bookings
        if (data.max_bookings !== undefined && data.max_bookings < existing.current_bookings) {
            throw new BadRequestError(
                `Cannot reduce max_bookings below current_bookings (${existing.current_bookings}). Cancel excess appointments first.`
            );
        }

        const [updated] = await db('slots')
            .where({ id })
            .update({ ...data, updated_at: db.fn.now() })
            .returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.SLOT_UPDATED,
            entityType: 'slot',
            entityId: id,
            oldValues: existing,
            newValues: data,
            ipAddress,
        });

        return updated;
    }

    /**
     * Soft delete a slot.
     */
    static async softDelete(id, userId, ipAddress) {
        const existing = await db('slots').where({ id, deleted_at: null }).first();
        if (!existing) throw new NotFoundError('Slot');

        await db('slots')
            .where({ id })
            .update({ deleted_at: db.fn.now(), is_active: false, updated_at: db.fn.now() });

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.SLOT_DELETED,
            entityType: 'slot',
            entityId: id,
            oldValues: { is_active: true, deleted_at: null },
            newValues: { is_active: false, deleted_at: 'now' },
            ipAddress,
        });

        return { message: 'Slot soft-deleted successfully' };
    }
}

module.exports = SlotService;
