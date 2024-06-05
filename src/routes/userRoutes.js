import express from "express";
import userController from "../controllers/userController.js";
import checkAuth from "../middlewares/authMiddleware.js";
const router = express.Router();

//public routes
router.route('/register').post(userController.userRegister)
router.route('/login').post(userController.userLogin)
router.route('/getuser').get(userController.getUsers)
router.route('/verifyEmail/:userid/:token').get(userController.verifyEmail)
router.route('/change-forgotten-password').post(userController.sendVerificationEmail) //token should be given
router.route('/reset-password/:userid/:tokens').post(userController.changeForgottenPassword)

//protected routes- uses auth middleware
router.route('/update-user-details').post(checkAuth, userController.updateUserDetails) //token should be given
router.route('/changepassword').post(checkAuth, userController.changePassword) //token should be given

export default router


