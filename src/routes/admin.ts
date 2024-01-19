import { Router } from "express";
import { addProduct, deleteProduct, getAllCustomer, getDashboardData, getRevenueGenerated, getSingleCustomer, updateProduct } from "../controller/admin";
import { verifyAdmin } from "../middleware/verifyAdmin";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.route('/create-product').post(verifyToken, verifyAdmin, addProduct);
router.route('/update-product/:id').put(verifyToken, verifyAdmin, updateProduct);
router.route('/delete-product/:id').delete(verifyToken, verifyAdmin, deleteProduct);
router.route('/customer_details').get(verifyToken, verifyAdmin, getAllCustomer);
router.route('/customer_detail/:id').get(verifyToken, verifyAdmin, getSingleCustomer);
router.route('/revenue-generated').get(verifyToken, verifyAdmin, getRevenueGenerated);
router.route('/get-dashboard-data').get(verifyToken, verifyAdmin, getDashboardData);
router.route('/revenue-generated').get(verifyToken, verifyAdmin, getRevenueGenerated);
router.route('/revenue-generated').get(verifyToken, verifyAdmin, getRevenueGenerated);

export default router;