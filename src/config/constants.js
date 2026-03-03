module.exports = {
    ROLES: {
        ADMIN: 'admin',
        BRANCH_MANAGER: 'branch_manager',
        STAFF: 'staff',
        CUSTOMER: 'customer',
    },

    APPOINTMENT_STATUS: {
        BOOKED: 'booked',
        CANCELLED: 'cancelled',
        COMPLETED: 'completed',
        NO_SHOW: 'no_show',
        RESCHEDULED: 'rescheduled',
    },

    AUDIT_ACTIONS: {
        // Auth
        AUTH_LOGIN: 'AUTH_LOGIN',
        AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
        AUTH_PASSWORD_CHANGED: 'AUTH_PASSWORD_CHANGED',

        // Users
        USER_CREATED: 'USER_CREATED',
        USER_UPDATED: 'USER_UPDATED',
        USER_DEACTIVATED: 'USER_DEACTIVATED',
        USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',

        // Branches
        BRANCH_CREATED: 'BRANCH_CREATED',
        BRANCH_UPDATED: 'BRANCH_UPDATED',
        BRANCH_DEACTIVATED: 'BRANCH_DEACTIVATED',

        // Service Types
        SERVICE_TYPE_CREATED: 'SERVICE_TYPE_CREATED',
        SERVICE_TYPE_UPDATED: 'SERVICE_TYPE_UPDATED',

        // Slots
        SLOT_CREATED: 'SLOT_CREATED',
        SLOT_UPDATED: 'SLOT_UPDATED',
        SLOT_DELETED: 'SLOT_DELETED',

        // Appointments
        APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
        APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
        APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
        APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
        APPOINTMENT_NO_SHOW: 'APPOINTMENT_NO_SHOW',

        // Settings
        SETTINGS_UPDATED: 'SETTINGS_UPDATED',

        // Staff Assignment
        STAFF_ASSIGNED: 'STAFF_ASSIGNED',
        STAFF_UNASSIGNED: 'STAFF_UNASSIGNED',
    },

    SYSTEM_SETTINGS_KEYS: {
        SLOT_RETENTION_DAYS: 'slot_retention_days',
    },

    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
    },
};
