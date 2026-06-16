const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

router.use(isAuthenticated);
router.use(hasRole('staff_lab'));

router.get('/', maintenanceController.list);
router.get('/new', maintenanceController.showNew);
router.post('/', maintenanceController.create);
router.get('/:id', maintenanceController.showDetail);

module.exports = router;
