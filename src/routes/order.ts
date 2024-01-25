import { Router } from "express";
import { createOrder, getAllOrders, updateOrderPaymentStatus } from "../controller/order";
import { verifyToken } from "../middleware/verifyToken";
import { verifyCredentials } from "../middleware/verifyCredentials";

const router = Router();

router.route('/').post(verifyToken, verifyCredentials, createOrder);
router.route('/:id').put(verifyToken, verifyCredentials, updateOrderPaymentStatus);
router.route('/checkout/:id').put(verifyToken, verifyCredentials, updateOrderPaymentStatus);
// THIS ID IS USER ID 
router.route('/all-orders/:id').get(verifyToken, verifyCredentials, getAllOrders);

export default router;