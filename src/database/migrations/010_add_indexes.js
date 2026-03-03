/**
 * @param {import('knex')} knex
 */
exports.up = function (knex) {
  return knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS idx_slot_lookup
    ON slots (branch_id, service_type_id, slot_date, is_active)
    WHERE deleted_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_appointment_customer
    ON appointments (customer_id, status);

    CREATE INDEX IF NOT EXISTS idx_appointment_slot
    ON appointments (slot_id, status);

    CREATE INDEX IF NOT EXISTS idx_user_email
    ON users (email);

    CREATE INDEX IF NOT EXISTS idx_user_branch
    ON users (branch_id)
    WHERE branch_id IS NOT NULL;
  `);
};

// for to Drop All Indexes
exports.down = function (knex) {
  return knex.schema.raw(`
    DROP INDEX IF EXISTS idx_slot_lookup;
    DROP INDEX IF EXISTS idx_appointment_customer;
    DROP INDEX IF EXISTS idx_appointment_slot;
    DROP INDEX IF EXISTS idx_user_email;
    DROP INDEX IF EXISTS idx_user_branch;
  `);
};
