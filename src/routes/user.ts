import { Router } from "express";
import { deleteUser, forgotPassword, getUser, resetPassword, sendVerificationEmail, signin, signout, signup, updateEmail, updateUser, validateOtp, verifyEmail } from "../controller/user";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.route('/signup').post(signup);
router.route('/signin').post(signin);
router.route('/signout').post(verifyToken, signout);
router.route('/send-verification-email').post(sendVerificationEmail);
router.route('/verify-email').post(verifyEmail);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').put(resetPassword);
router
.route('/:id')
.get(verifyToken, getUser)
.put(verifyToken, updateUser)
.delete(verifyToken, deleteUser)
router.route('/update-email/:id').put(updateEmail);
router.route('/validate-otp/:id').put(verifyToken, validateOtp);


export default router;