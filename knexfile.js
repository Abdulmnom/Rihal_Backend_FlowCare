require('dotenv').config();

const config = require('./src/config');

module.exports = {
    client: 'pg',
    connection: {
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user: config.db.user,
        password: config.db.password,
    },
    pool: {
        min: 2,
        max: 20,
    },
    migrations: {
        directory: './src/database/migrations',
        tableName: 'knex_migrations',
    },
    seeds: {
        directory: './src/database/seeds',
    },
};
