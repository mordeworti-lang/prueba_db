'use strict';

const UnauthorizedError = require('../exceptions/UnauthorizedError');

/**
 * Factory: returns a middleware that allows only the given roles.
 * Usage: router.delete('/:id', auth, role('admin'), controller.remove)
 */
function role(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return next(new UnauthorizedError('Insufficient permissions'));
        }
        next();
    };
}

module.exports = role;
