const { BadRequestError } = require('../utils/errors');

/**
 * Joi validation middleware factory.
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against.
 * @param {'body'|'query'|'params'} source - Request property to validate.
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const details = error.details.map((d) => ({
                field: d.path.join('.'),
                message: d.message,
            }));
            return next(new BadRequestError('Validation failed', details));
        }

        // Replace with sanitized values
        req[source] = value;
        next();
    };
};

module.exports = validate;
