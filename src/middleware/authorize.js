const { ForbiddenError } = require('../utils/errors');

/**
 * Authorization middleware factory.
 * @param  {...string} allowedRoles - Roles permitted to access the route.
 * @returns Express middleware
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('Authentication required before authorization'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError());
        }

        next();
    };
};

/**
 * Branch scope check — ensures branch_manager/staff only access their own branch.
 * Reads branchId from req.params.branchId or req.body.branch_id.
 */
const branchScope = (req, res, next) => {
    const { ROLES } = require('../config/constants');

    // Admin and customers bypass branch scope
    if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.CUSTOMER) {
        return next();
    }

    const targetBranchId = req.params.branchId || req.body.branch_id;
    // to more Security 
    if (targetBranchId && req.user.branch_id && targetBranchId !== req.user.branch_id) {
        return next(new ForbiddenError('You can only access resources within your own branch'));
    }

    next();
};

module.exports = { authorize, branchScope };
