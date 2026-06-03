const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const upload = require('../config/multer');

// Receiving + inventory labeling is done by Staf Administrasi (staff_admin)
router.use(isAuthenticated);
router.use(hasRole('staff_admin'));

router.get('/', assetController.listQueue);
router.get('/inventory', assetController.listAssets);
router.get('/items/:id', assetController.showItem);
router.post('/items/:id/receipts', assetController.addReceipt);
router.post('/items/:id/assets', upload.single('qr_code'), assetController.addAsset);

module.exports = router;
