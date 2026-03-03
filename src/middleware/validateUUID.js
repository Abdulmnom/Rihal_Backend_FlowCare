const { BadRequestError } = require('../utils/errors');

/**
 * UUID format regex (v4).
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Middleware to validate that route params are valid UUIDs.
 * @param  {...string} paramNames - Parameter names to validate (default: 'id')
 */
const validateUUID = (...paramNames) => {
    if (paramNames.length === 0) paramNames = ['id'];

    return (req, res, next) => {
        for (const param of paramNames) {
            const value = req.params[param];
            if (value && !UUID_REGEX.test(value)) {
                return next(
                    new BadRequestError(`Invalid UUID format for parameter '${param}': ${value}`)
                );
            }
        }
        next();
    };
};

module.exports = validateUUID;
