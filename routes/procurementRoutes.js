const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Procurement drafts are created/managed by Kepala Laboratorium (kalab)
router.use(isAuthenticated);
router.use(hasRole('kalab'));

router.get('/', procurementController.listDrafts);
router.get('/create', procurementController.showCreateForm);
router.post('/create', procurementController.createDraft);

router.get('/:id', procurementController.showDraft);
router.post('/:id/lock', procurementController.lockDraft);
router.get('/:id/delete', procurementController.deleteDraft);

router.get('/:id/items/new', procurementController.showItemForm);
router.post('/:id/items', procurementController.createItem);
router.get('/:id/items/:itemId/edit', procurementController.showEditItemForm);
router.post('/:id/items/:itemId/edit', procurementController.updateItem);
router.get('/:id/items/:itemId/delete', procurementController.deleteItem);

module.exports = router;
