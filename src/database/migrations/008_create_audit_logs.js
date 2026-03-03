/**
 * @param {import('knex')} knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('audit_logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
        table.string('action', 50).notNullable();
        table.string('entity_type', 50).notNullable();
        table.uuid('entity_id');
        table.jsonb('old_values');
        table.jsonb('new_values');
        table.string('ip_address', 45);
        table.text('user_agent');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

        table.index(['entity_type', 'entity_id']);
        table.index('created_at');
        table.index('user_id');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('audit_logs');
};
