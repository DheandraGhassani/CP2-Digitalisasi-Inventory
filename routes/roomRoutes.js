const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// All room routes require authentication and admin role
router.use(isAuthenticated);
router.use(hasRole('admin'));

router.get('/', roomController.listRooms);
router.get('/create', roomController.showCreateForm);
router.post('/create', roomController.createRoom);
router.get('/:id/edit', roomController.showEditForm);
router.post('/:id/edit', roomController.updateRoom);
router.get('/:id/delete', roomController.deleteRoom);

module.exports = router;