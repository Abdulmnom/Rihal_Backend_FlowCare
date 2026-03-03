const db = require('../database/connection');
const { APPOINTMENT_STATUS, AUDIT_ACTIONS } = require('../config/constants');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const AuditService = require('./auditService');

class AppointmentService {
    /**
     * Book an appointment — uses pessimistic locking to prevent double booking.
     */
    static async book({ slot_id, staff_id, id_document_url, attachment_url }, customerId, ipAddress) {
        return db.transaction(async (trx) => {
            // Lock the slot row
            const slot = await trx('slots')
                .where({ id: slot_id, is_active: true, deleted_at: null })
                .forUpdate()
                .first();

            if (!slot) {
                throw new NotFoundError('Available Slot');
            }

            // Check capacity
            if (slot.current_bookings >= slot.max_bookings) {
                throw new ConflictError('This slot is fully booked');
            }

            // Check if customer already has an active booking for this slot
            const existingBooking = await trx('appointments')
                .where({ customer_id: customerId, slot_id, status: APPOINTMENT_STATUS.BOOKED })
                .first();

            if (existingBooking) {
                throw new ConflictError('You already have an active booking for this slot');
            }

            // Validate staff assignment if provided
            if (staff_id) {
                const staffAssignment = await trx('staff_service_types')
                    .where({ staff_id, service_type_id: slot.service_type_id })
                    .first();

                if (!staffAssignment) {
                    throw new BadRequestError('Selected staff is not assigned to this service type');
                }
            }

            // Create appointment
            const [appointment] = await trx('appointments')
                .insert({
                    customer_id: customerId,
                    slot_id,
                    staff_id: staff_id || null,
                    status: APPOINTMENT_STATUS.BOOKED,
                    id_document_url: id_document_url || null,
                    attachment_url: attachment_url || null,
                })
                .returning('*');

            // Increment slot booking count
            await trx('slots')
                .where({ id: slot_id })
                .increment('current_bookings', 1)
                .update({ updated_at: trx.fn.now() });

            // Audit log
            await AuditService.log(
                {
                    userId: customerId,
                    action: AUDIT_ACTIONS.APPOINTMENT_BOOKED,
                    entityType: 'appointment',
                    entityId: appointment.id,
                    newValues: { slot_id, staff_id, customer_id: customerId },
                    ipAddress,
                },
                trx
            );

            return appointment;
        });
    }

    /**
     * Cancel an appointment.
     */
    static async cancel(appointmentId, userId, { cancellation_reason }, ipAddress) {
        return db.transaction(async (trx) => {
            const appointment = await trx('appointments')
                .where({ id: appointmentId })
                .forUpdate()
                .first();

            if (!appointment) throw new NotFoundError('Appointment');

            if (appointment.status !== APPOINTMENT_STATUS.BOOKED) {
                throw new BadRequestError(`Cannot cancel an appointment with status '${appointment.status}'`);
            }

            // Update appointment status
            const [updated] = await trx('appointments')
                .where({ id: appointmentId })
                .update({
                    status: APPOINTMENT_STATUS.CANCELLED,
                    cancellation_reason: cancellation_reason || null,
                    cancelled_at: trx.fn.now(),
                    updated_at: trx.fn.now(),
                })
                .returning('*');

            // Decrement slot booking count
            await trx('slots')
                .where({ id: appointment.slot_id })
                .decrement('current_bookings', 1)
                .update({ updated_at: trx.fn.now() });

            // Audit
            await AuditService.log(
                {
                    userId,
                    action: AUDIT_ACTIONS.APPOINTMENT_CANCELLED,
                    entityType: 'appointment',
                    entityId: appointmentId,
                    oldValues: { status: APPOINTMENT_STATUS.BOOKED },
                    newValues: { status: APPOINTMENT_STATUS.CANCELLED, cancellation_reason },
                    ipAddress,
                },
                trx
            );

            return updated;
        });
    }

    /**
     * Reschedule — cancel old + book new in single transaction.
     */
    static async reschedule(appointmentId, { new_slot_id }, userId, ipAddress) {
        return db.transaction(async (trx) => {
            // Lock old appointment
            const oldAppointment = await trx('appointments')
                .where({ id: appointmentId })
                .forUpdate()
                .first();

            if (!oldAppointment) throw new NotFoundError('Appointment');

            if (oldAppointment.status !== APPOINTMENT_STATUS.BOOKED) {
                throw new BadRequestError(`Cannot reschedule an appointment with status '${oldAppointment.status}'`);
            }

            // Lock the new slot
            const newSlot = await trx('slots')
                .where({ id: new_slot_id, is_active: true, deleted_at: null })
                .forUpdate()
                .first();

            if (!newSlot) throw new NotFoundError('New Slot');

            if (newSlot.current_bookings >= newSlot.max_bookings) {
                throw new ConflictError('The new slot is fully booked');
            }

            // Mark old appointment as rescheduled
            await trx('appointments')
                .where({ id: appointmentId })
                .update({
                    status: APPOINTMENT_STATUS.RESCHEDULED,
                    updated_at: trx.fn.now(),
                });

            // Decrement old slot count
            await trx('slots')
                .where({ id: oldAppointment.slot_id })
                .decrement('current_bookings', 1)
                .update({ updated_at: trx.fn.now() });

            // Create new appointment
            const [newAppointment] = await trx('appointments')
                .insert({
                    customer_id: oldAppointment.customer_id,
                    slot_id: new_slot_id,
                    staff_id: oldAppointment.staff_id,
                    status: APPOINTMENT_STATUS.BOOKED,
                    id_document_url: oldAppointment.id_document_url,
                    attachment_url: oldAppointment.attachment_url,
                    rescheduled_from: appointmentId,
                })
                .returning('*');

            // Increment new slot count
            await trx('slots')
                .where({ id: new_slot_id })
                .increment('current_bookings', 1)
                .update({ updated_at: trx.fn.now() });

            // Audit
            await AuditService.log(
                {
                    userId,
                    action: AUDIT_ACTIONS.APPOINTMENT_RESCHEDULED,
                    entityType: 'appointment',
                    entityId: appointmentId,
                    oldValues: { slot_id: oldAppointment.slot_id, status: APPOINTMENT_STATUS.BOOKED },
                    newValues: { new_appointment_id: newAppointment.id, new_slot_id, status: APPOINTMENT_STATUS.RESCHEDULED },
                    ipAddress,
                },
                trx
            );

            return newAppointment;
        });
    }

    /**
     * Mark appointment as completed.
     */
    static async complete(appointmentId, userId, ipAddress) {
        const appointment = await db('appointments').where({ id: appointmentId }).first();
        if (!appointment) throw new NotFoundError('Appointment');

        if (appointment.status !== APPOINTMENT_STATUS.BOOKED) {
            throw new BadRequestError(`Cannot complete an appointment with status '${appointment.status}'`);
        }

        const [updated] = await db('appointments')
            .where({ id: appointmentId })
            .update({ status: APPOINTMENT_STATUS.COMPLETED, updated_at: db.fn.now() })
            .returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.APPOINTMENT_COMPLETED,
            entityType: 'appointment',
            entityId: appointmentId,
            oldValues: { status: APPOINTMENT_STATUS.BOOKED },
            newValues: { status: APPOINTMENT_STATUS.COMPLETED },
            ipAddress,
        });

        return updated;
    }

    /**
     * Mark appointment as no-show.
     */
    static async markNoShow(appointmentId, userId, ipAddress) {
        const appointment = await db('appointments').where({ id: appointmentId }).first();
        if (!appointment) throw new NotFoundError('Appointment');

        if (appointment.status !== APPOINTMENT_STATUS.BOOKED) {
            throw new BadRequestError(`Cannot mark as no-show an appointment with status '${appointment.status}'`);
        }

        const [updated] = await db('appointments')
            .where({ id: appointmentId })
            .update({ status: APPOINTMENT_STATUS.NO_SHOW, updated_at: db.fn.now() })
            .returning('*');

        await AuditService.log({
            userId,
            action: AUDIT_ACTIONS.APPOINTMENT_NO_SHOW,
            entityType: 'appointment',
            entityId: appointmentId,
            oldValues: { status: APPOINTMENT_STATUS.BOOKED },
            newValues: { status: APPOINTMENT_STATUS.NO_SHOW },
            ipAddress,
        });

        return updated;
    }

    /**
     * Get appointment by ID with joins.
     */
    static async findById(id) {
        const appointment = await db('appointments')
            .join('slots', 'appointments.slot_id', 'slots.id')
            .join('branches', 'slots.branch_id', 'branches.id')
            .join('service_types', 'slots.service_type_id', 'service_types.id')
            .join('users as customer', 'appointments.customer_id', 'customer.id')
            .leftJoin('users as staff', 'appointments.staff_id', 'staff.id')
            .select(
                'appointments.*',
                'slots.slot_date',
                'slots.start_time',
                'slots.end_time',
                'branches.name as branch_name',
                'branches.id as branch_id',
                'service_types.name as service_type_name',
                'customer.full_name as customer_name',
                'customer.email as customer_email',
                'staff.full_name as staff_name'
            )
            .where('appointments.id', id)
            .first();

        if (!appointment) throw new NotFoundError('Appointment');
        return appointment;
    }

    /**
     * Query appointments with filters and pagination.
     */
    static async findAll({
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        status,
        customerId,
        slotId,
        branchId,
        dateFrom,
        dateTo,
    }) {
        const query = db('appointments')
            .join('slots', 'appointments.slot_id', 'slots.id')
            .join('branches', 'slots.branch_id', 'branches.id')
            .join('service_types', 'slots.service_type_id', 'service_types.id')
            .join('users as customer', 'appointments.customer_id', 'customer.id')
            .leftJoin('users as staff', 'appointments.staff_id', 'staff.id')
            .select(
                'appointments.*',
                'slots.slot_date',
                'slots.start_time',
                'slots.end_time',
                'branches.name as branch_name',
                'branches.id as branch_id',
                'service_types.name as service_type_name',
                'customer.full_name as customer_name',
                'customer.email as customer_email',
                'staff.full_name as staff_name'
            );

        if (status) query.where('appointments.status', status);
        if (customerId) query.where('appointments.customer_id', customerId);
        if (slotId) query.where('appointments.slot_id', slotId);
        if (branchId) query.where('slots.branch_id', branchId);
        if (dateFrom) query.where('slots.slot_date', '>=', dateFrom);
        if (dateTo) query.where('slots.slot_date', '<=', dateTo);

        const countResult = await query.clone().clearSelect().clearOrder().count('appointments.id as total').first();
        const total = parseInt(countResult.total);
        const offset = (page - 1) * limit;

        const data = await query.orderBy(`appointments.${sortBy}`, sortOrder).limit(limit).offset(offset);

        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}

module.exports = AppointmentService;
