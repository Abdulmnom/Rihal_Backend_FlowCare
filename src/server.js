const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const db = require('./database/connection');

const PORT = config.port;

// Test database connection and start server
async function startServer() {
    try {
        // Verify database connection
        await db.raw('SELECT 1');
        logger.info('✅ Database connection established');

        app.listen(PORT, () => {
            logger.info(`🚀 FlowCare API server running on port ${PORT}`);
            logger.info(`📍 Environment: ${config.nodeEnv}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
// process.on('SIGTERM', async () => {
//     logger.info('SIGTERM received. Shutting down gracefully...');
//     await db.destroy();
//     process.exit(0);
// });

// process.on('SIGINT', async () => {
//     logger.info('SIGINT received. Shutting down gracefully...');
//     await db.destroy();
//     process.exit(0);
// });

// process.on('unhandledRejection', (reason, promise) => {
//     logger.error('Unhandled Rejection at:', { promise, reason });
// });

startServer();
