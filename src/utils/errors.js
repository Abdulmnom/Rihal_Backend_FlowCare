/**
 * Custom API Error classes for structured error handling.
 */
class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends AppError {
    constructor(message = 'Bad request', details = null) {
        super(message, 400, details);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 403);
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
};
