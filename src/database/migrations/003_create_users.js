/**
 * @param {import('knex')} knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('full_name', 100).notNullable();
        table.string('email', 255).notNullable().unique();
        table.string('phone', 20);
        table.string('password_hash', 255).notNullable();
        table
            .enu('role', ['admin', 'branch_manager', 'staff', 'customer'], {
                useNative: true,
                enumName: 'user_role',
            })
            .notNullable()
            .defaultTo('customer');
        table.uuid('branch_id').references('id').inTable('branches').onDelete('SET NULL');
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users').then(() => {
        return knex.schema.raw('DROP TYPE IF EXISTS user_role');
    });
};
