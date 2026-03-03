/**
 * @param {import('knex')} knex
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('slots', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.uuid('branch_id').notNullable().references('id').inTable('branches').onDelete('RESTRICT');
            table.uuid('service_type_id').notNullable().references('id').inTable('service_types').onDelete('RESTRICT');
            table.date('slot_date').notNullable();
            table.time('start_time').notNullable();
            table.time('end_time').notNullable();
            table.integer('max_bookings').notNullable().defaultTo(1);
            table.integer('current_bookings').notNullable().defaultTo(0);
            table.boolean('is_active').notNullable().defaultTo(true);
            table.timestamp('deleted_at').nullable();
            table.timestamps(true, true);

            table.unique(['branch_id', 'service_type_id', 'slot_date', 'start_time']);
        })
        .then(() => {
            return knex.schema.raw(`
        ALTER TABLE slots ADD CONSTRAINT chk_slot_time CHECK (start_time < end_time);
        ALTER TABLE slots ADD CONSTRAINT chk_slot_bookings CHECK (current_bookings >= 0 AND current_bookings <= max_bookings);
      `);
        });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('slots');
};
