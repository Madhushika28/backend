import express from 'express';
import { verifyUser, verifyAdmin } from '../middleware/authMiddleware.js';
import { processPayment, getPaymentStats, getAllPayments, getPendingPayments, markCODPaid, confirmBankDeposit,  } from '../controller/paymentController.js';

const router = express.Router();

router.put('/process/:orderId', verifyUser, processPayment);
router.get('/stats', verifyUser, verifyAdmin, getPaymentStats);
router.get('/', verifyUser, verifyAdmin, getAllPayments);
router.get('/pending', verifyUser, verifyAdmin, getPendingPayments);
router.put('/mark-cod-paid/:orderId', verifyUser, verifyAdmin, markCODPaid);
router.put('/confirm-bank/:orderId', verifyUser, verifyAdmin, confirmBankDeposit);


router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Payment API is working',
        timestamp: new Date().toISOString(),
        endpoints: [
            'PUT /api/payments/process/:orderId',
            'GET /api/payments/stats (admin)',
            'GET /api/payments (admin)'
        ]
    });
});

export default router;