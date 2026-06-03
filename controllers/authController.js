const User = require('../models/User');
const Role = require('../models/Role');

// Show login page
const showLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect('/auth/dashboard');
    }

    const returnTo = req.session.returnTo || '/';
    res.render('auth/login', {
        title: 'Login',
        returnTo,
        error: null,
        email: ''
    });
};

// Process login
const login = async (req, res) => {
    try {
        const { email, password, returnTo = '/' } = req.body;

        // Validate input
        if (!email || !password) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Email and password are required',
                email,
                returnTo
            });
        }

        // Find user by email
        const user = await User.findByEmail(email);

        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
                email,
                returnTo
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Your account has been deactivated. Please contact administrator.',
                email,
                returnTo
            });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password);

        if (!isValidPassword) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
                email,
                returnTo
            });
        }

        // Create session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            roles_id: user.roles_id,
            role_name: user.role_name,
            profile_photo: user.profile_photo
        };

        // Clear returnTo after successful login
        const redirectUrl = returnTo === '/' ? '/auth/dashboard' : returnTo;
        delete req.session.returnTo;

        res.redirect(redirectUrl);

    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'An error occurred during login. Please try again.',
            email: req.body.email,
            returnTo: req.body.returnTo || '/'
        });
    }
};

// Process logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth/login');
    });
};

// Dashboard (temporary redirect based on role)
const dashboard = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    const roleDashboards = {
        'admin': '/auth/dashboard/admin',
        'kalab': '/auth/dashboard/kepala-lab',
        'kaprodi': '/auth/dashboard/kaprodi',
        'staff_admin': '/auth/dashboard/staf-admin',
        'staff_lab': '/auth/dashboard/staf-lab'
    };

    const redirectPath = roleDashboards[req.session.user.role_name] || '/auth/dashboard/default';
    res.redirect(redirectPath);
};

// Role-specific dashboards
const adminDashboard = async (req, res) => {
    try {
        const db = require('../config/database');

        // Get statistics
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_users,
                (SELECT COUNT(*) FROM rooms) as total_rooms,
                (SELECT COUNT(*) FROM bhp_stocks) as total_bhp,
                (SELECT COUNT(*) FROM inventory_assets) as total_assets,
                (SELECT COUNT(*) FROM procurement_drafts) as total_drafts,
                (SELECT COUNT(*) FROM maintenance_logs) as total_maintenance
        `);

        res.render('dashboard/admin', {
            title: 'Admin Dashboard',
            user: req.session.user,
            stats: stats[0]
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load dashboard'
        });
    }
};

const kepalaLabDashboard = async (req, res) => {
    try {
        const db = require('../config/database');

        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM procurement_drafts WHERE users_id = ? AND status != 'finalized') as pending_drafts,
                (SELECT COUNT(*) FROM procurement_drafts WHERE users_id = ? AND status = 'finalized') as finalized_drafts,
                (SELECT COUNT(*) FROM inventory_assets WHERE date_acquired >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_assets
        `, [req.session.user.id, req.session.user.id]);

        res.render('dashboard/kepala-lab', {
            title: 'Kepala Laboratorium Dashboard',
            user: req.session.user,
            stats: stats[0]
        });
    } catch (error) {
        console.error('Error loading kepala lab dashboard:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load dashboard'
        });
    }
};

const kaprodiDashboard = async (req, res) => {
    try {
        const db = require('../config/database');

        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM procurement_drafts WHERE status = 'locked') as pending_review,
                (SELECT COUNT(*) FROM procurement_drafts WHERE status = 'reviewed') as reviewed,
                (SELECT COUNT(*) FROM procurement_drafts WHERE status = 'finalized') as finalized
        `);

        res.render('dashboard/kaprodi', {
            title: 'Ketua Program Studi Dashboard',
            user: req.session.user,
            stats: stats[0]
        });
    } catch (error) {
        console.error('Error loading kaprodi dashboard:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load dashboard'
        });
    }
};

const stafAdminDashboard = async (req, res) => {
    try {
        const db = require('../config/database');

        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM procurement_items WHERE approval_status = 'approved' AND id NOT IN (SELECT procurement_items_id FROM receipt)) as pending_receipt,
                (SELECT COUNT(*) FROM inventory_assets WHERE label_code IS NULL) as pending_labeling,
                (SELECT COUNT(*) FROM receipt WHERE receipt_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as recent_receipts
        `);

        res.render('dashboard/staf-admin', {
            title: 'Staf Administrasi Dashboard',
            user: req.session.user,
            stats: stats[0]
        });
    } catch (error) {
        console.error('Error loading staf admin dashboard:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load dashboard'
        });
    }
};

const stafLabDashboard = async (req, res) => {
    try {
        const db = require('../config/database');

        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM bhp_stocks WHERE current_stock <= minimum_stock) as low_stock,
                (SELECT COUNT(*) FROM maintenance_logs WHERE maintenance_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as recent_maintenance,
                (SELECT COUNT(*) FROM inventory_assets WHERE \`condition\` != 'good') as damaged_assets
        `);

        res.render('dashboard/staf-lab', {
            title: 'Staf Laboratorium Dashboard',
            user: req.session.user,
            stats: stats[0]
        });
    } catch (error) {
        console.error('Error loading staf lab dashboard:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load dashboard'
        });
    }
};

const defaultDashboard = (req, res) => {
    res.render('dashboard/default', {
        title: 'Dashboard',
        user: req.session.user
    });
};

module.exports = {
    showLogin,
    login,
    logout,
    dashboard,
    adminDashboard,
    kepalaLabDashboard,
    kaprodiDashboard,
    stafAdminDashboard,
    stafLabDashboard,
    defaultDashboard
};