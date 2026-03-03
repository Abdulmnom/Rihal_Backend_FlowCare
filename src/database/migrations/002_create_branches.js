/**
 * @param {import('knex')} knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('branches', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('name', 100).notNullable().unique();
        table.string('address', 255).notNullable();
        table.string('city', 100).notNullable();
        table.string('phone', 20);
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('branches');
};
