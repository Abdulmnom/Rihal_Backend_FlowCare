const db = require('../database/connection');
const { AUDIT_ACTIONS } = require('../config/constants');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const AuditService = require('./auditService');

class StaffServiceTypeService {
    /**
     * Assign a staff member to a service type.
     */
    static async assign({ staff_id, service_type_id }, userId, ipAddress) {
        // Validate staff exists and has staff role
        const staff = await db('users').where({ id: staff_id }).first();
        if (!staff) throw new NotFoundError('Staff User');
        if (staff.role !== 'staff' && staff.role !== 'branch_manager') {
            throw new BadRequestError('Only staff or branch_manager users can be assigned to service types');
        }

        // Validate service type exists
        const serviceType = await db('service_types').where({ id: service_type_id }).first();
        if (!serviceType) throw new NotFoundError('Service Type');

        const [assignment] = await db('staff_service_types')
            .insert({ staff_id, service_type_id })
            .returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.STAFF_ASSIGNED,
            entityType: 'staff_service_type',
            entityId: assignment.id,
            newValues: { staff_id, service_type_id, staff_name: staff.full_name, service_type_name: serviceType.name },
            ipAddress,
        });

        return assignment;
    }

    /**
     * Remove a staff assignment.
     */
    static async unassign(id, userId, ipAddress) {
        const existing = await db('staff_service_types').where({ id }).first();
        if (!existing) throw new NotFoundError('Staff Assignment');

        await db('staff_service_types').where({ id }).del();

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.STAFF_UNASSIGNED,
            entityType: 'staff_service_type',
            entityId: id,
            oldValues: existing,
            ipAddress,
        });

        return { message: 'Staff unassigned successfully' };
    }

    /**
     * Get all service types assigned to a staff member.
     */
    static async findByStaff(staffId) {
        return db('staff_service_types')
            .join('service_types', 'staff_service_types.service_type_id', 'service_types.id')
            .select('staff_service_types.id', 'service_types.id as service_type_id', 'service_types.name', 'service_types.duration_minutes')
            .where('staff_service_types.staff_id', staffId);
    }

    /**
     * Get all staff assigned to a service type.
     */
    static async findByServiceType(serviceTypeId) {
        return db('staff_service_types')
            .join('users', 'staff_service_types.staff_id', 'users.id')
            .select('staff_service_types.id', 'users.id as staff_id', 'users.full_name', 'users.email', 'users.branch_id')
            .where('staff_service_types.service_type_id', serviceTypeId);
    }
}

module.exports = StaffServiceTypeService;
