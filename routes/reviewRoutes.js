const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Procurement review is done by Ketua Program Studi (kaprodi)
router.use(isAuthenticated);
router.use(hasRole('kaprodi'));

router.get('/', reviewController.listReview);
router.get('/:id', reviewController.showReview);
router.post('/:id/items/:itemId/decide', reviewController.decideItem);
router.post('/:id/finalize', reviewController.finalize);

module.exports = router;
