const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Login routes
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Dashboard routes (protected)
router.get('/dashboard', isAuthenticated, authController.dashboard);
router.get('/dashboard/admin', isAuthenticated, authController.adminDashboard);
router.get('/dashboard/kepala-lab', isAuthenticated, authController.kepalaLabDashboard);
router.get('/dashboard/kaprodi', isAuthenticated, authController.kaprodiDashboard);
router.get('/dashboard/staf-admin', isAuthenticated, authController.stafAdminDashboard);
router.get('/dashboard/staf-lab', isAuthenticated, authController.stafLabDashboard);
router.get('/dashboard/default', isAuthenticated, authController.defaultDashboard);

module.exports = router;