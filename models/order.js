import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderID: {
            type: String,
            required: true,
            unique: true
        },
        items: {
            type: [
                {
                    productID: {
                        type: String,
                        required: true
                    },
                    quantity: {
                        type: Number,
                        required: true
                    },
                    name: {
                        type: String,
                        required: true
                    },
                    price: {
                        type: Number,
                        required: true
                    },
                    image: {
                        type: String,
                        required: true
                    }
                }
            ]
        },
        customerName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true 
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        total: {
            type: Number,
            required: true 
        },
        status: {
            type: String,
            required: true,
            default: "pending",
            enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled']
        },
        date: {
            type: Date,
            default: Date.now
        },
        
        
        paymentMethod: {
            type: String,
            enum: ['credit_card', 'debit_card', 'cod', 'bank_deposit'],
            default: 'cod'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: {
            type: String
        },
        cardLastFour: {
            type: String
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        paidAt: {
            type: Date
        },
        paymentDetails: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true 
    }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;