const Joi = require('joi');

// ========== AUTH ==========
const registerSchema = Joi.object({
    full_name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().trim().max(20).allow(null, ''),
    password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).max(128).required(),
});

// ========== BRANCHES ==========
const branchSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    address: Joi.string().trim().min(5).max(255).required(),
    city: Joi.string().trim().min(2).max(100).required(),
    phone: Joi.string().trim().max(20).allow(null, ''),
    is_active: Joi.boolean(),
});

const branchUpdateSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    address: Joi.string().trim().min(5).max(255),
    city: Joi.string().trim().min(2).max(100),
    phone: Joi.string().trim().max(20).allow(null, ''),
    is_active: Joi.boolean(),
}).min(1);

// ========== SERVICE TYPES ==========
const serviceTypeSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(500).allow(null, ''),
    duration_minutes: Joi.number().integer().min(5).max(480).required(),
    is_active: Joi.boolean(),
});

const serviceTypeUpdateSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(500).allow(null, ''),
    duration_minutes: Joi.number().integer().min(5).max(480),
    is_active: Joi.boolean(),
}).min(1);

// ========== USERS ==========
const createUserSchema = Joi.object({
    full_name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().trim().max(20).allow(null, ''),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid('admin', 'branch_manager', 'staff', 'customer').required(),
    branch_id: Joi.string().uuid().allow(null),
});

const updateUserSchema = Joi.object({
    full_name: Joi.string().trim().min(2).max(100),
    phone: Joi.string().trim().max(20).allow(null, ''),
    is_active: Joi.boolean(),
    role: Joi.string().valid('admin', 'branch_manager', 'staff', 'customer'),
    branch_id: Joi.string().uuid().allow(null),
}).min(1);

// ========== SLOTS ==========
const slotSchema = Joi.object({
    branch_id: Joi.string().uuid().required(),
    service_type_id: Joi.string().uuid().required(),
    slot_date: Joi.date().iso().required(),
    start_time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .required()
        .messages({ 'string.pattern.base': 'start_time must be in HH:mm format' }),
    end_time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .required()
        .messages({ 'string.pattern.base': 'end_time must be in HH:mm format' }),
    max_bookings: Joi.number().integer().min(1).max(100).default(1),
    is_active: Joi.boolean().default(true),
});

const slotUpdateSchema = Joi.object({
    slot_date: Joi.date().iso(),
    start_time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .messages({ 'string.pattern.base': 'start_time must be in HH:mm format' }),
    end_time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .messages({ 'string.pattern.base': 'end_time must be in HH:mm format' }),
    max_bookings: Joi.number().integer().min(1).max(100),
    is_active: Joi.boolean(),
}).min(1);

// ========== APPOINTMENTS ==========
const bookAppointmentSchema = Joi.object({
    slot_id: Joi.string().uuid().required(),
    staff_id: Joi.string().uuid().allow(null),
    id_document_url: Joi.string().uri().max(500).allow(null, ''),
    attachment_url: Joi.string().uri().max(500).allow(null, ''),
});

const rescheduleAppointmentSchema = Joi.object({
    new_slot_id: Joi.string().uuid().required(),
});

const cancelAppointmentSchema = Joi.object({
    cancellation_reason: Joi.string().trim().max(500).allow(null, ''),
});

// ========== STAFF SERVICE TYPES ==========
const staffServiceTypeSchema = Joi.object({
    staff_id: Joi.string().uuid().required(),
    service_type_id: Joi.string().uuid().required(),
});

// ========== SYSTEM SETTINGS ==========
const systemSettingSchema = Joi.object({
    value: Joi.string().trim().max(500).required(),
    description: Joi.string().trim().max(500).allow(null, ''),
});

// ========== QUERY PARAMS ==========
const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort_by: Joi.string().max(50).default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});

const slotQuerySchema = paginationSchema.keys({
    branch_id: Joi.string().uuid(),
    service_type_id: Joi.string().uuid(),
    date: Joi.date().iso(),
    date_from: Joi.date().iso(),
    date_to: Joi.date().iso(),
    available: Joi.boolean(),
});

const appointmentQuerySchema = paginationSchema.keys({
    status: Joi.string().valid('booked', 'cancelled', 'completed', 'no_show', 'rescheduled'),
    customer_id: Joi.string().uuid(),
    slot_id: Joi.string().uuid(),
    date_from: Joi.date().iso(),
    date_to: Joi.date().iso(),
});

const auditLogQuerySchema = paginationSchema.keys({
    user_id: Joi.string().uuid(),
    action: Joi.string().max(50),
    entity_type: Joi.string().max(50),
    entity_id: Joi.string().uuid(),
    date_from: Joi.date().iso(),
    date_to: Joi.date().iso(),
});

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    branchSchema,
    branchUpdateSchema,
    serviceTypeSchema,
    serviceTypeUpdateSchema,
    createUserSchema,
    updateUserSchema,
    slotSchema,
    slotUpdateSchema,
    bookAppointmentSchema,
    rescheduleAppointmentSchema,
    cancelAppointmentSchema,
    staffServiceTypeSchema,
    systemSettingSchema,
    paginationSchema,
    slotQuerySchema,
    appointmentQuerySchema,
    auditLogQuerySchema,
};
