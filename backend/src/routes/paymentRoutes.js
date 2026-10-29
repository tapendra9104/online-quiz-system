// ============================================================
// Payment Routes — Payments, Subscriptions & Profile
// ============================================================
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/record', paymentController.recordPayment);
router.get('/history', paymentController.getPaymentHistory);
router.get('/subscriptions', paymentController.getSubscriptions);
router.get('/profile', paymentController.getProfile);

module.exports = router;
