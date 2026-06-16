const express = require('express');
const router = express.Router();
const bhpController = require('../controllers/bhpController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

router.use(isAuthenticated);

const canView = hasRole('staff_lab', 'kalab', 'kaprodi');
const canEdit = hasRole('staff_lab');

router.get('/', canView, bhpController.list);
router.get('/new', canEdit, bhpController.showNew);
router.post('/', canEdit, bhpController.create);
router.get('/:id', canView, bhpController.showDetail);
router.get('/:id/edit', canEdit, bhpController.showEdit);
router.post('/:id/edit', canEdit, bhpController.update);
router.post('/:id/delete', canEdit, bhpController.remove);
router.post('/:id/stock-in', canEdit, bhpController.addStockIn);

module.exports = router;
