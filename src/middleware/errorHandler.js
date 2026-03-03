const logger = require('../config/logger');
const { AppError } = require('../utils/errors');

/**
 * Global error handling middleware.
 * Catches all errors thrown in route handlers and sends structured JSON response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
    // Default to 500
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let details = err.details || null;

    // Knex / PostgreSQL specific errors
    if (err.code === '23505') {
        // Unique violation
        statusCode = 409;
        message = 'A record with this value already exists';
        details = err.detail;
    } else if (err.code === '23503') {
        // Foreign key violation
        statusCode = 400;
        message = 'Referenced record does not exist';
        details = err.detail;
    } else if (err.code === '23514') {
        // Check constraint violation
        statusCode = 400;
        message = 'Data validation failed at database level';
        details = err.detail;
    }

    // Log error
    if (statusCode >= 500) {
        logger.error(`${statusCode} - ${message}`, {
            error: err.stack,
            path: req.originalUrl,
            method: req.method,
        });
    } else {
        logger.warn(`${statusCode} - ${message}`, {
            path: req.originalUrl,
            method: req.method,
        });
    }

    // Response
    const response = {
        success: false,
        message,
        ...(details && { details }),
    };

    // Include stack trace only in development
    if (process.env.NODE_ENV === 'development' && !(err instanceof AppError)) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
