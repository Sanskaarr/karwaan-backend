import { pipeline } from "nodemailer/lib/xoauth2";
import CartItem from "../model/cartItem";
import Product, { ProductInterface } from "../model/product";
import User from "../model/user";
import { ResponseData } from "../utils/ResponseData";
import { Types } from "mongoose";
import { OrderServices } from "./OrderServices";

type AddItemToCartPayload = {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
    // productId: string;
    // userId: string;
}

type RemoveItemFromCartPayload = {
    userId: string;
    cartItemId: Types.ObjectId;
}

export class CartItemServices {
    static async addItemToCart (payload: AddItemToCartPayload) {
        let data;

        const {productId, userId} = payload;

        const product = await Product.findById(productId); 
        if(!product){
            data = new ResponseData("error", 400, "Product not found ", null);

            return data;
        }

        const user = await User.findById(userId);
        if(!user){
            data = new ResponseData("error", 400, "User not found", null);

            return data;
        }

        const cartItem = await CartItem.findOne({userId: userId, productId: productId});

        if(cartItem){
            data = new ResponseData("success", 200, "Item is already in cart", cartItem);

            return data;
        }

        const newCartItem = await CartItem.create({
            userId: userId,
            productId: productId
        });

        data = new ResponseData("success", 200, "Item added to cart", newCartItem);

        return data;
    } 

    static async removeItemFromCart (payload: RemoveItemFromCartPayload) {
        let data;
        const {userId, cartItemId} = payload;
        const user = await User.findById(userId);
        if(!user){
            data = new ResponseData("error", 400, "User not found", null); 
            return data;
        }

        
        const cartItem = await CartItem.findById(cartItemId);
        
        if(!cartItem){ 
            data = new ResponseData("error", 400, "Cart Item not found", null)
            return data; 
        }

        if(userId !== cartItem.userId.toString()){
            data = new ResponseData("error", 400, "You cannot remove item from some one else's cart", null);
            return data;
        }

        await cartItem.deleteOne();
        await cartItem.save();

        data =  new ResponseData("success", 200, "Item removed from cart", null);
        return data;
    }

    static async getAllCartItems (payload: Types.ObjectId) {
        let data;

        const user = await User.findById(payload);

        if(!user){
            data = new ResponseData("error", 400, "User not found", null);
            return data;
        }

        const cartItems = await CartItem.aggregate([
            { $match: { userId: payload } },
            {$lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user_details",
            }},
            {$unwind: "$user_details"},
            {$lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "product_details",
            }},
            { $unwind: "$product_details" },
            {$project: {
                _id: 1,
                user_details: "$user_details",
                product_details: "$product_details"
            }},
        ]);

        data = new ResponseData("success", 200, "Success", cartItems);
        return data;
    }

    static async emptyCart(payload: string){
        let data;

        const user = await User.findById(payload);
        if(!user){
            data = new ResponseData("error", 400, "User not found", null);
            return data;
        }

        const cartItems = await CartItem.find({userId: payload});
        if(cartItems.length === 0){
            data = new ResponseData("success", 200, "Your cart is already empty", null);
            return data;
        }

        cartItems.map(async (cartItem) => {
            await cartItem.deleteOne();
            await cartItem.save();
        });

        data = new ResponseData("success", 200, "You cart is now empty", null);
        return data;
    }

    static checkout = async (payload: string) => {
        let data;
        const cartItems = await CartItem.find({userId: payload});
        if(cartItems.length === 0){
            data = new ResponseData("error", 200, "You cart is empty", null);
            return data;
        }

        let products: Types.ObjectId[] = [];
        for(const cartItem of cartItems){
            const product = await Product.findById(cartItem.productId);
            if(!product){
                return new ResponseData("error", 400, "Product not found", null);
            }

            products = [...products, product._id];
        }

        data = await OrderServices.createOrder({userId: payload, products})        
        return data;
    }
}