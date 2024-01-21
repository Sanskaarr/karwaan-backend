import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import { addAddress, deleteAddress, getAddress, updateAddress } from "../controller/address";

const router = Router();

// THIS IS USER ID 
router.route('/:id').post(verifyToken, addAddress);
// THIS IS ADDRESS ID 
router.route('/:id').put(verifyToken, updateAddress);

router.route('/:id').put(verifyToken, getAddress);
router.route('/:id').put(verifyToken, deleteAddress);


export default router;