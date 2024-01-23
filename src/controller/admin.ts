import { Request, Response, request } from "express";
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
    if (!uploadedFiles) {
        data = new ResponseData("error", 400, "Please upload a file to continue", null);
        return response.status(data.statusCode).json(data)
    }

    let file;
    for (let keys in uploadedFiles) {
        file = uploadedFiles[keys];
    }

    if (!file) {
        data = new ResponseData("error", 400, "Please upload a file to continue", null);
        return response.status(data.statusCode).json(data)
    }

    if (Array.isArray(file)) {
        data = new ResponseData("error", 400, "Please upload a single file at a time", null);
        return response.status(data.statusCode).json(data)
    }

    let type: 'image' | 'video' | null;

    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp']
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/x-msvideo', 'video/quicktime', 'video/mpeg']

    if (imageMimeTypes.includes(file.mimetype)) {
        type = 'image'
    } else if (videoMimeTypes.includes(file.mimetype)) {
        type = 'video'
    } else {
        data = new ResponseData("error", 400, "Please enter a valid file", null);
        return response.status(data.statusCode).json(data)
    }

    const { userId, name, tags, price, description, paid } = request.body;
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
        if (error) {
            return console.log(error);
        }

        const url = data.Location;
        const newProductMetaData = await ProductMetaData.create({
            productId: newProduct._id,
            url: url
        });

        data = new ResponseData("success", 200, "Product added successfully", { product_data: newProduct, product_metadata: newProductMetaData });
        return response.status(data.statusCode).json(data);
    });
});

export const updateProduct = errorHandler(async (request: Request, response: Response) => {
    let data;

    if (!isObjectIdOrHexString(request.params.id)) {
        data = new ResponseData("error", 400, "Please enter a valid userId", null);
        return response.status(data.statusCode).json(data);
    }

    const productId = new Types.ObjectId(request.params.id);
    const payload = { productId, ...request.body };

    data = await ProductServices.updateProduct(payload);
    return response.status(data.statusCode).json(data);
});

export const deleteProduct = errorHandler(async (request: Request, response: Response) => {
    let data;

    if (!isObjectIdOrHexString(request.params.id)) {
        data = new ResponseData("error", 400, "Please enter a valid userId", null);
        return response.status(data.statusCode).json(data);
    }

    const productId = new Types.ObjectId(request.params.id);
    const payload = { productId, ...request.body };
    data = await ProductServices.deleteProduct(payload);
    return response.status(data.statusCode).json(data);
});

export const getAllUsers = errorHandler(async (request: Request, response: Response) => {
    const users = await User.find();
    const data = new ResponseData("success", 200, "Success", users);
    return response.status(data.statusCode).json(data);
});

export const getAllAdmin = errorHandler(async (request: Request, response: Response) => {
    const users = await User.find({ role: "admin" });
    const data = new ResponseData("success", 200, "Success", users);
    return response.status(data.statusCode).json(data);
});

export const getDashboardData = errorHandler(async (request: Request, response: Response) => {
    const products = await Product.find();
    const users = await User.find()
    const orders = await Order.find({ status: 'PAYMENT COMPELTE' });

    let totalRevenue = 0;
    let customersArray: string[] = [];
    for (let key in orders) {
        const order = orders[key];
        totalRevenue += order.amount;

        if (!customersArray.includes(order.userId)) {
            customersArray.push(order.userId);
        }
    }
    const responseObj = {
        products_count: products.length,
        users_count: users.length,
        orders_count: orders.length,
        total_revenue: totalRevenue,
        customers_count: customersArray.length
    }

    const data = new ResponseData("success", 200, "Success", responseObj);
    return response.status(data.statusCode).json(data);
})

export const getAllCustomer = errorHandler(async (request: Request, response: Response) => {
    const customers = await Order.aggregate([
        {
            $match: {
                status: "PAYMENT COMPLETED",
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user_details"
            }
        },
        { $unwind: "$user_details" },
        {
            $project: {
                firstName: "$user_details.firstName",
                createdAt:"$user_details.createdAt",
                email:"$user_details.email",
                image:"$user_details.image",
                lastName:"$user_details.lastName",
                phoneNumber:"$user_details.phoneNumber",
                _id:"$user_details._id"

            }
        },
    ]);

    const data = new ResponseData("success", 200, "Success", customers);
    return response.status(data.statusCode).json(data);
});

export const getSingleCustomer = errorHandler(async (request: Request, response: Response) => {
    let data;

    if (!isObjectIdOrHexString(request.params.id)) {
        data = new ResponseData("error", 400, "Please enter a valid userId", null);
        return response.status(data.statusCode).json(data);
    }

    const userId = new Types.ObjectId(request.params.id);
    const user = await User.findById(userId);
    if (!user) {
        data = new ResponseData("error", 400, "User not found", null);
        return response.status(data.statusCode).json(data);
    };

    const orders = await Order.aggregate([
        { $match: { userId: userId } },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user_details"
            }
        },
        { $unwind: "$user_details" },
        {
            $project: {
                user_details: "$user_details",
            }
        },
    ]);
    data = new ResponseData("success", 200, "Success", orders)
    return response.status(data.statusCode).json(data);
});

export const getRevenueGenerated = errorHandler(async (request: Request, response: Response) => {
    let totalRevenue = 0;
    const orders = await Order.find({ status: 'PAYMENT COMPLETED' });
    for (let key in orders) {
        const order = orders[key];
        totalRevenue += order.amount;
    }
    const data = new ResponseData("success", 200, "Success", { revenue_generated: totalRevenue })
    return response.status(data.statusCode).json(data);
});

export const getTopProducts = errorHandler(async (request: Request, response: Response) => {
    const result = await Order.aggregate([
        { $match: { status: 'PAYMENT COMPLETED' } },
        { $unwind: '$products' },
        {
            $group: {
                _id: '$products',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 3 },
        {
            $lookup: { // Use $lookup if you need to fetch data from another collection
                from: 'products', // Change 'products' to the actual name of your products collection
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $project: {
                media: '$product.media',
                price: '$product.price',
                name: '$product.name',
                tags: '$product.tags',
                count: { $sum: 1 }

            }
        }
    ]);

    const topProducts = result.map((item) => {
        return {
            media: item.media,
            price: item.price,
            name: item.name,
            tags: item.tags,
            count: item.count
        };
    });

    const data = new ResponseData("success", 200, "Success", topProducts);
    return response.status(data.statusCode).json(data);
});

export const getWorstProducts = errorHandler(async (Request: Request, response:Response) => {
    const result = await Order.aggregate([
        { $match: { status: 'PAYMENT COMPLETED' } },
        { $unwind: '$products' },
        { $group: { _id: '$products', count: { $sum: 1 } } },
        { $limit: 3 }
      ]);
      
      const worstProducts = result.map(({ _id, count }) => {
        const { media, price } = _id; // Assuming _id has media and price properties
      
        return {
          productId: _id,
          media,
          price,
          count
        };
      });
      
    const data = new ResponseData("success", 200, "Success", worstProducts);
    return response.status(data.statusCode).json(data);
});

export const getSaleReports = errorHandler(async (request: Request, response: Response) => {
    const {query} = request.query;
    let result;
    if(query === "daily"){
        const currentDate = new Date();
        const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

        result = await Order.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        });
    }else if(query === "weekly"){

    }else if(query === "monthly"){

    }else if(query === "yearly"){

    }else{

    }
})