// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/auth/login');
};

// Role-based authorization middleware
const hasRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.session.returnTo = req.originalUrl;
            return res.redirect('/auth/login');
        }

        const userRole = req.session.user.role_name;
        if (allowedRoles.includes(userRole)) {
            return next();
        }

        res.status(403).render('error', {
            title: '403 - Access Denied',
            message: 'You do not have permission to access this page.',
            backUrl: '/dashboard'
        });
    };
};

// Check if user has specific permission
const hasPermission = (permission) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.session.returnTo = req.originalUrl;
            return res.redirect('/auth/login');
        }

        const userRole = req.session.user.role_name;
        const permissions = {
            'admin': ['*'],
            'kalab': ['create_draft', 'view_draft', 'edit_draft', 'lock_draft'],
            'kaprodi': ['review_draft', 'finalize_draft', 'view_draft'],
            'staff_admin': ['view_draft', 'update_asset', 'input_receipt', 'generate_qr'],
            'staff_lab': ['manage_bhp', 'create_maintenance', 'update_condition']
        };

        const userPermissions = permissions[userRole] || [];
        if (userPermissions.includes('*') || userPermissions.includes(permission)) {
            return next();
        }

        res.status(403).render('error', {
            title: '403 - Access Denied',
            message: 'You do not have permission to perform this action.'
        });
    };
};

module.exports = {
    isAuthenticated,
    hasRole,
    hasPermission
};