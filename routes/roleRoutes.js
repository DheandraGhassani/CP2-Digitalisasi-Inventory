const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// All role routes require authentication and admin role
router.use(isAuthenticated);
router.use(hasRole('admin'));

router.get('/', roleController.listRoles);
router.get('/create', roleController.showCreateForm);
router.post('/create', roleController.createRole);
router.get('/:id/edit', roleController.showEditForm);
router.post('/:id/edit', roleController.updateRole);
router.get('/:id/delete', roleController.deleteRole);

module.exports = router;