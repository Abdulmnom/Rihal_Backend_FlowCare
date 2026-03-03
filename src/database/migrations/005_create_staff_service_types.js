/**
 * @param {import('knex')} knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('staff_service_types', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('staff_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.uuid('service_type_id').notNullable().references('id').inTable('service_types').onDelete('CASCADE');
        table.timestamps(true, true);
        table.unique(['staff_id', 'service_type_id']);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('staff_service_types');
};
