import { Request, Response } from "express";
import { errorHandler } from "../middleware/errorHandler";
import { UserServices } from "../services/UserServices";
import { ResponseData } from "../utils/ResponseData";
import User from "../model/user";
import {Types} from "mongoose"
import { sendEmail } from "../utils/sendEmail";

export const signup = errorHandler(async(request: Request, response: Response) => {
    const data = await UserServices.registerUser(request.body);
    return response.status(data.statusCode).json(data);
});

export const signin = errorHandler(async(request: Request, response: Response) => {
    const data = await UserServices.loginUser(request.body);    
    return response.status(data.statusCode).json(data);
});

export const signout = errorHandler(async (request: Request, response: Response) => {
    const data = await UserServices.logoutUser();
    return response.status(data.statusCode).json(data);
});

export const sendVerificationEmail = errorHandler(async(request: Request, response: Response) =>{
    const data = await UserServices.storeTokenForEmailVerification(request.body);
    return response.status(data.statusCode).json(data);
});

export const verifyEmail = errorHandler(async(request: Request, response: Response) =>{
    const data = await UserServices.validateVerifyEmailToken(request.body);
    
    return response.status(data.statusCode).json(data);
});

export const forgotPassword = errorHandler(async(request: Request, response: Response) =>{
    const data = await UserServices.forgotPassword(request.body);
    
    return response.status(data.statusCode).json(data);
});

export const resetPassword = errorHandler(async(request: Request, response: Response) =>{
    const payload = {...request.params, ...request.body}
    const data = await UserServices.resetPassword(payload);
    
    return response.status(data.statusCode).json(data);
});

export const sendPhoneNumberVerificationOTP = errorHandler(async (request: Request, response: Response) => {
    const data = await UserServices.sendPhoneNumberVerificationOTP(request.body)
})

export const getUser = errorHandler(async(request: Request, response: Response) =>{
    const data = await UserServices.getUser(request.params.id);
    return response.status(data.statusCode).json(data);
});

export const updateUser = errorHandler(async(request: Request, response: Response) =>{
    const payload = {...request.params, ...request.body}
    const data = await UserServices.updateUser(payload);
    return response.status(data.statusCode).json(data);
});

export const deleteUser = errorHandler(async(request: Request, response: Response) =>{
    const data = await UserServices.deleteUser(request.params.id);
    return response.status(data.statusCode).json(data);
});

export const validateOtp = errorHandler(async(request: Request, response: Response) =>{
    const data = await UserServices.validateOtp(request.body.otp, request.body.id);
    return response.status(data.statusCode).json(data);
});

export const updateEmail = errorHandler(async (request: Request, response: Response) => {
    let data;
    const userId = new Types.ObjectId(request.params.id);
    const {email} = request.body;
    if(!email){
        data = new ResponseData("error", 400, "Invalid payload", null);
        return response.status(data.statusCode).json(data);
    }
    const user = await User.findById(userId);
    if(!user){
        data = new ResponseData("error", 400, "User not found", null);
        return response.status(data.statusCode).json(data);
    };

    await user?.updateOne({
        email: email,
        isEmailValid: false,
    });

    await user?.save();

    const token = UserServices.generateToken();
    const expire = UserServices.getExpireTime();

    await user.updateOne({
        verifyEmailToken: token,
        verifyEmailTokenExpire: expire
    });

    await user.save();

    const verifyUrl = `http://localhost:5500/verify-email?token=${token}&id=${user?._id}`

    await sendEmail(verifyUrl, user.email);

    data = new ResponseData("success", 200, "An email has been sent for email verification.", user);
    return data;


})