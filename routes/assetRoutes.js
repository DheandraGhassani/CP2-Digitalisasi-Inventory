const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const upload = require('../config/multer');

router.use(isAuthenticated);

// Inventory list readable by kalab, kaprodi, staff_lab, staff_admin, admin
router.get('/inventory', hasRole('staff_admin', 'kalab', 'kaprodi', 'staff_lab', 'admin'), assetController.listAssets);

// Receiving queue and actions: staff_admin only
router.use(hasRole('staff_admin'));
router.get('/', assetController.listQueue);
router.get('/items/:id', assetController.showItem);
router.post('/items/:id/receipts', assetController.addReceipt);
router.post('/items/:id/assets', upload.single('qr_code'), assetController.addAsset);

module.exports = router;
