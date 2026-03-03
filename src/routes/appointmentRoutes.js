const express = require('express');
const router = express.Router();
const AppointmentService = require('../services/appointmentService');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const {
    bookAppointmentSchema,
    rescheduleAppointmentSchema,
    cancelAppointmentSchema,
    appointmentQuerySchema,
} = require('../validators/schemas');
const validateUUID = require('../middleware/validateUUID');

// GET /api/v1/appointments
router.get(
    '/',
    authenticate,
    validate(appointmentQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const filters = { ...req.query };

        // Scope based on role
        if (req.user.role === ROLES.CUSTOMER) {
            filters.customerId = req.user.id;
        } else if (req.user.role === ROLES.STAFF) {
            // Staff sees only their assigned appointments in their branch
            filters.branchId = req.user.branch_id;
        } else if (req.user.role === ROLES.BRANCH_MANAGER) {
            filters.branchId = req.user.branch_id;
        }

        const result = await AppointmentService.findAll(filters);
        res.json({ success: true, ...result });
    })
);

// GET /api/v1/appointments/:id
router.get(
    '/:id',
    authenticate,
    validateUUID(),
    asyncHandler(async (req, res) => {
        const appointment = await AppointmentService.findById(req.params.id);

        // Scope check
        if (req.user.role === ROLES.CUSTOMER && appointment.customer_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only view your own appointments' });
        }
        if (
            (req.user.role === ROLES.BRANCH_MANAGER || req.user.role === ROLES.STAFF) &&
            appointment.branch_id !== req.user.branch_id
        ) {
            return res.status(403).json({ success: false, message: 'You can only view appointments in your branch' });
        }

        res.json({ success: true, data: appointment });
    })
);

// POST /api/v1/appointments (book)
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.CUSTOMER),
    validate(bookAppointmentSchema),
    asyncHandler(async (req, res) => {
        const customerId = req.user.role === ROLES.CUSTOMER ? req.user.id : req.body.customer_id || req.user.id;
        const appointment = await AppointmentService.book(req.body, customerId, req.ip);
        res.status(201).json({ success: true, data: appointment });
    })
);

// PUT /api/v1/appointments/:id/cancel
router.put(
    '/:id/cancel',
    authenticate,
    validateUUID(),
    validate(cancelAppointmentSchema),
    asyncHandler(async (req, res) => {
        // Verify ownership for customers
        if (req.user.role === ROLES.CUSTOMER) {
            const appointment = await AppointmentService.findById(req.params.id);
            if (appointment.customer_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'You can only cancel your own appointments' });
            }
        }

        const result = await AppointmentService.cancel(req.params.id, req.user.id, req.body, req.ip);
        res.json({ success: true, data: result });
    })
);

// PUT /api/v1/appointments/:id/reschedule
router.put(
    '/:id/reschedule',
    authenticate,
    validateUUID(),
    validate(rescheduleAppointmentSchema),
    asyncHandler(async (req, res) => {
        // Verify ownership for customers
        if (req.user.role === ROLES.CUSTOMER) {
            const appointment = await AppointmentService.findById(req.params.id);
            if (appointment.customer_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'You can only reschedule your own appointments' });
            }
        }

        const result = await AppointmentService.reschedule(req.params.id, req.body, req.user.id, req.ip);
        res.json({ success: true, data: result });
    })
);

// PUT /api/v1/appointments/:id/complete
router.put(
    '/:id/complete',
    authenticate,
    validateUUID(),
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.STAFF),
    asyncHandler(async (req, res) => {
        const result = await AppointmentService.complete(req.params.id, req.user.id, req.ip);
        res.json({ success: true, data: result });
    })
);

// PUT /api/v1/appointments/:id/no-show
router.put(
    '/:id/no-show',
    authenticate,
    validateUUID(),
    authorize(ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.STAFF),
    asyncHandler(async (req, res) => {
        const result = await AppointmentService.markNoShow(req.params.id, req.user.id, req.ip);
        res.json({ success: true, data: result });
    })
);

module.exports = router;
