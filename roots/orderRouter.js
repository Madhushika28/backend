import express from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controller/orderController.js';
import { get } from 'mongoose';

const orderRouter = express.Router();

orderRouter.post('/', createOrder);
orderRouter.get('/', getOrders);
orderRouter.put("/status/:orderID",updateOrderStatus)

export default orderRouter;