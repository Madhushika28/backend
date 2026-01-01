// file name: controllers/paymentController.js
import Order from '../models/order.js';

export const processPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const paymentData = req.body;
        
        console.log('🔄 Processing payment for order:', orderId);
        
        // Find order by orderID (string)
        const order = await Order.findOne({ orderID: orderId });
        
        if (!order) {
            console.log('❌ Order not found:', orderId);
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }
        
        // Update payment info
        order.paymentMethod = paymentData.paymentMethod || order.paymentMethod;
        order.paymentStatus = paymentData.paymentStatus || 'paid';
        order.transactionId = paymentData.transactionId || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        order.cardLastFour = paymentData.cardLastFour || '';
        order.paidAmount = paymentData.paidAmount || order.total || 0;
        order.paidAt = new Date();
        order.status = 'processing';
        
        // Save payment details
        if (paymentData.paymentDetails) {
            order.paymentDetails = paymentData.paymentDetails;
        }
        
        await order.save();
        
        console.log('✅ Payment processed successfully:', order.orderID);
        
        res.json({
            success: true,
            message: 'Payment processed successfully',
            order: {
                orderID: order.orderID,
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                transactionId: order.transactionId,
                paidAmount: order.paidAmount,
                paidAt: order.paidAt,
                status: order.status
            }
        });
        
    } catch (error) {
        console.error('❌ Payment processing error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error processing payment',
            error: error.message 
        });
    }
};

export const getPaymentStats = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            {
                $match: { paymentStatus: 'paid' }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$paidAmount' },
                    totalTransactions: { $sum: 1 },
                    avgTransaction: { $avg: '$paidAmount' }
                }
            }
        ]);
        
        const dailyStats = await Order.aggregate([
            {
                $match: { 
                    paymentStatus: 'paid',
                    paidAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
                    dailyRevenue: { $sum: '$paidAmount' },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        res.json({
            success: true,
            stats: stats[0] || { totalRevenue: 0, totalTransactions: 0, avgTransaction: 0 },
            dailyStats
        });
        
    } catch (error) {
        console.error('Payment stats error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching payment stats',
            error: error.message 
        });
    }
};

// In paymentController.js, update getAllPayments function:
export const getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', paymentMethod } = req.query;
        const skip = (page - 1) * limit;
        
        // Start with base query for paid orders
        const query = { paymentStatus: 'paid' };
        
        // Add payment method filter if provided
        if (paymentMethod && paymentMethod !== 'all') {
            query.paymentMethod = paymentMethod;
        }
        
        if (search) {
            query.$or = [
                { orderID: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } }
            ];
        }
        
        const orders = await Order.find(query)
            .sort({ paidAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('orderID customerName email phone address total paymentMethod paymentStatus transactionId cardLastFour paidAmount paidAt status items');
        
        const total = await Order.countDocuments(query);
        
        res.json({
            success: true,
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalOrders: total
        });
        
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching payments',
            error: error.message 
        });
    }
};
export const getPendingPayments = async (req, res) => {
    try {
        const orders = await Order.find({
            paymentStatus: 'pending',
            paymentMethod: { $in: ['cod', 'bank_deposit'] }
        })
        .sort({ createdAt: -1 })
        .select('orderID customerName email phone address total paymentMethod status createdAt');
        
        res.json({
            success: true,
            orders
        });
        
    } catch (error) {
        console.error('Get pending payments error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching pending payments',
            error: error.message 
        });
    }
};

// Admin: Confirm COD payment as paid
export const markCODPaid = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findOne({ orderID: orderId });
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }
        
        if (order.paymentMethod !== 'cod') {
            return res.status(400).json({ 
                success: false,
                message: 'This order is not COD' 
            });
        }
        
        order.paymentStatus = 'paid';
        order.paidAmount = order.total;
        order.paidAt = new Date();
        await order.save();
        
        res.json({
            success: true,
            message: 'COD payment marked as paid'
        });
        
    } catch (error) {
        console.error('Mark COD paid error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
};

// Admin: Confirm bank deposit as paid
export const confirmBankDeposit = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findOne({ orderID: orderId });
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }
        
        if (order.paymentMethod !== 'bank_deposit') {
            return res.status(400).json({ 
                success: false,
                message: 'This order is not bank deposit' 
            });
        }
        
        order.paymentStatus = 'paid';
        order.paidAmount = order.total;
        order.paidAt = new Date();
        await order.save();
        
        res.json({
            success: true,
            message: 'Bank deposit confirmed as paid'
        });
        
    } catch (error) {
        console.error('Confirm bank deposit error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
};
