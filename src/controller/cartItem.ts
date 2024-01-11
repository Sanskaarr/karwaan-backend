import { Request, Response } from "express";
import { errorHandler } from "../middleware/errorHandler";
import { CartItemServices } from "../services/CartItemServices";
import { Types, isObjectIdOrHexString } from "mongoose";
import { ResponseData } from "../utils/ResponseData";
// import {ObjectId} from 'mongoose';

export const addItemToCart = errorHandler(async (request: Request, response: Response) => {
    const data = await CartItemServices.addItemToCart(request.body);

    return response.status(data.statusCode).json(data);
});

export const removeItemFromCart = errorHandler(async (request: Request, response: Response) => {
    let data;

    if(!isObjectIdOrHexString(request.params.id)){
        data = new ResponseData("error", 400, "Please enter a valid userId", null);
        return response.status(data.statusCode).json(data);
    }

    const payload = {cartItemId: request.params.id, ...request.body}
    data = await CartItemServices.removeItemFromCart(payload);

    return response.status(data.statusCode).json(data);
});

export const getAllCartItems = errorHandler(async (request: Request, response: Response) => {
    let data: ResponseData;

    if (!isObjectIdOrHexString(request.params.id)) {
        data = new ResponseData("error", 400, "Please enter a valid userId", null);
        return response.status(data.statusCode).json(data);
    }

    const userId = new Types.ObjectId(request.params.id);
    
    data = await CartItemServices.getAllCartItems(userId);
    return response.status(data.statusCode).json(data);
});

export const emptyCart = errorHandler(async (request: Request, response: Response) => {
    const userId = new Types.ObjectId(request.params.id);
    const data = await CartItemServices.emptyCart(userId);
    return response.status(data.statusCode).json(data);
});
