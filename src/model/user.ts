import mongoose from "mongoose";

export interface UserInterface {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    isEmailValid: boolean;
    phoneNumber: number;
    isPhoneNumberValid: boolean;
    role: 'user' | 'admin';
    image: string;
    passwordResetToken: string;
    passwordResetTokenExpiry: number;
    verifyEmailToken: string;
    verifyEmailTokenExpire: number;
    createdAt: string;
    updatedAt: string;
}

const UserSchema = new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    isEmailValid: {type: Boolean, default: false},
    phoneNumber: {type: Number, default: null},
    isPhoneNumberValid: {type: Boolean, default: null},
    role: {type: String, default: 'user'},
    image: {type: String, default: null},
    passwordResetToken: {type: String, default: null},
    passwordResetTokenExpiry: {type: Number, default: null},
    verifyEmailToken: {type: String, default:null},
    verifyEmailTokenExpire: {type: Number, default: null}
}, {timestamps: true});

const User = mongoose.model<UserInterface>('User', UserSchema);

export default User;