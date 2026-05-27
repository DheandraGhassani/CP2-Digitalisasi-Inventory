const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// All user routes require authentication and admin role
router.use(isAuthenticated);
router.use(hasRole('admin'));

router.get('/', userController.listUsers);
router.get('/create', userController.showCreateForm);
router.post('/create', userController.createUser);
router.get('/:id/edit', userController.showEditForm);
router.post('/:id/edit', userController.updateUser);
router.get('/:id/delete', userController.deleteUser);

module.exports = router;