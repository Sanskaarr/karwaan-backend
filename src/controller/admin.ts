import { Request, Response } from "express";
import { errorHandler } from "../middleware/errorHandler";
import { ProductServices } from "../services/ProductServices";
import Product from "../model/product";
import Order from "../model/order";
import User from "../model/user";
import { Types, isObjectIdOrHexString } from "mongoose";
import { ResponseData } from "../utils/ResponseData";
import { s3 } from "../server";
import ProductMetaData from "../model/ProductMetaData";

export const addProduct = errorHandler(async (request: Request, response: Response) => {
    let data: ResponseData;
    const uploadedFiles = request.files;
    if(!uploadedFiles){
        data = new ResponseData("error", 400, "Please upload a file to continue", null);
        return response.status(data.statusCode).json(data)
    }
    
    let file;
    for(let keys in uploadedFiles){
        file = uploadedFiles[keys];
    }
    
    if(!file){
        data = new ResponseData("error", 400, "Please upload a file to continue", null);
        return response.status(data.statusCode).json(data)
    }
    
    if(Array.isArray(file)){
        data = new ResponseData("error", 400, "Please upload a single file at a time", null);
        return response.status(data.statusCode).json(data)
    }

    let type: 'image' | 'video' | null;
    
    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp']
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/x-msvideo', 'video/quicktime', 'video/mpeg']

    if(imageMimeTypes.includes(file.mimetype)){
        type = 'image'
    }else if (videoMimeTypes.includes(file.mimetype)){
        type = 'video'
    }else{
        data = new ResponseData("error", 400, "Please enter a valid file", null);
        return response.status(data.statusCode).json(data)
    }
    
    const {userId, name, tags, price, description,  paid} = request.body;
    if (!userId || !name || !tags || !description || !price) {
        data = new ResponseData("error", 400, "Invalid payload", null);
        return response.status(data.statusCode).json(data)
    }

    const newProduct = new Product({
        userId: userId,
        name: name,
        tags: tags, 
        price: price,
        description: description,
        media: {
            data: file?.data.toString('base64'),
            url: null,
            type: type
        }
    });

    await newProduct.save();

    const bucketUploadParams = {
        Bucket: 'karwaan-bucket',
        Key: `${Date.now}_${file.name}`,
        Body: file.data,
        ContentType: file.mimetype,
        ACL: 'public-read',
    }

    s3.upload(bucketUploadParams, async (error: any, data: any) => {
        if(error){
            return console.log(error);
        }
        
        const url = data.Location;
        const newProductMetaData = await ProductMetaData.create({
            productId: newProduct._id,
            url: url
        });

        data = new ResponseData("success", 200, "Product added successfully", {product_data: newProduct, product_metadata: newProductMetaData});
        return response.status(data.statusCode).json(data);
    });
});

export const updateProduct = errorHandler(async (request: Request, response: Response) => {
    let data;

    if(!isObjectIdOrHexString(request.params.id)){
        data = new ResponseData("error", 400, "Please enter a valid userId", null);
        return response.status(data.statusCode).json(data);
    }

    const productId = new Types.ObjectId(request.params.id);
    const payload = {productId, ...request.body};
    
    data = await ProductServices.updateProduct(payload);
    return response.status(data.statusCode).json(data);
});

export const deleteProduct = errorHandler(async (request: Request, response: Response) => {
    let data;

    if(!isObjectIdOrHexString(request.params.id)){
        data = new ResponseData("error", 400, "Please enter a valid userId", null);
        return response.status(data.statusCode).json(data);
    }

    const productId = new Types.ObjectId(request.params.id);
    const payload = {productId, ...request.body};
    data = await ProductServices.deleteProduct(payload);
    return response.status(data.statusCode).json(data);
});

export const getAllCustomer = errorHandler(async(request: Request, response: Response) => {
    const customers = await Order.aggregate([
        {$lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user_details"
        }},
        {$unwind: "$user_details"},
        {$project: {
            user_details: "$user_details",
        }},
    ]);

    const data = new ResponseData("success", 200, "Success", customers);
    return response.status(data.statusCode).json(data);
});

export const getSingleCustomer = errorHandler(async(request: Request, response: Response) => {
    let data;

    if(!isObjectIdOrHexString(request.params.id)){
        data = new ResponseData("error", 400, "Please enter a valid userId", null);
        return response.status(data.statusCode).json(data);
    }
    
    const userId = new Types.ObjectId(request.params.id);
    const user = await User.findById(userId);
    if(!user){
        data = new ResponseData("error", 400, "User not found", null);
        return response.status(data.statusCode).json(data);
    };

    const orders = await Order.aggregate([
        {$match: {userId: userId}},
        {$lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user_details"
        }},
        {$unwind: "$user_details"},
        {$project: {
            user_details: "$user_details",
        }},
    ]);
    data = new ResponseData("success", 200, "Success", orders)
    return response.status(data.statusCode).json(data);
});