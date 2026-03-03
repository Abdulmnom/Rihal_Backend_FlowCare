/**
 * @param {import('knex')} knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('service_types', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('name', 100).notNullable().unique();
        table.text('description');
        table.integer('duration_minutes').notNullable().defaultTo(30);
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('service_types');
};
