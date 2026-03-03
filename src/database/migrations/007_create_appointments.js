/**
 * @param {import('knex')} knex
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('appointments', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.uuid('customer_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
            table.uuid('slot_id').notNullable().references('id').inTable('slots').onDelete('RESTRICT');
            table.uuid('staff_id').references('id').inTable('users').onDelete('SET NULL');
            table
                .enu('status', ['booked', 'cancelled', 'completed', 'no_show', 'rescheduled'], {
                    useNative: true,
                    enumName: 'appointment_status',
                })
                .notNullable()
                .defaultTo('booked');
            table.text('cancellation_reason');
            table.string('attachment_url', 500);
            table.string('id_document_url', 500);
            table.timestamp('booked_at').defaultTo(knex.fn.now());
            table.timestamp('cancelled_at');
            table.uuid('rescheduled_from');
            table.timestamps(true, true);
        })
        .then(() => {
            return knex.schema.raw(`
        CREATE UNIQUE INDEX idx_unique_active_booking
        ON appointments (customer_id, slot_id)
        WHERE status = 'booked';
      `);
        });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('appointments').then(() => {
        return knex.schema.raw('DROP TYPE IF EXISTS appointment_status');
    });
};
