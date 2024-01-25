import ProductMetaData from "../model/ProductMetaData";
import CartItem from "../model/cartItem";
import Order from "../model/order";
import Product, { ProductInterface } from "../model/product";
import User from "../model/user";
import { ResponseData } from "../utils/ResponseData";
import { PaymentServices } from "./PaymentServices";
import {Types} from 'mongoose';

type CreateOrderPayload = {
    userId: string;
    products: Types.ObjectId[];
}

export class OrderServices {
    static async createOrder(payload: CreateOrderPayload) {
        const {userId, products} = payload;

        if(!userId || !products){
            return new ResponseData("error", 400, "Invalid payload", null);
        }

        if(products.length === 0){
            return new ResponseData("error", 400, "You have selected no products", null);
        }

        const user = await User.findById(userId);

        if(!user){
            return new ResponseData("error", 400, "User not found", null);
        }

        let totalAmount = 0;
        for(let productId of products){
            const product = await Product.findById(productId);
            
            if(!product){
                return new ResponseData("error", 400, "Product not found", null);
            }

            totalAmount += product.price
        }

        let newOrder = await Order.create({
            userId: userId,
            products: products,
            status: 'PAYMENT PENDING',
            amount: totalAmount,
            download_url: null
        });

        const razorpayPayment = await PaymentServices.createPaymentLink(totalAmount, newOrder?._id);
        if(!razorpayPayment){
            return new ResponseData("error", 400, "There was an error while making a payment please try again", null);
        }

        await newOrder.updateOne({
            payment_id: razorpayPayment?.id
        });

        await newOrder.save();

        const returnData = {
            order_details: newOrder, 
            payment_details: razorpayPayment
        }

       return new ResponseData("success", 200, "Order generated", returnData);
    };

    static updateOrderStatus = async (order_id: string) => {
        const order = await Order.findById(order_id);
        if(!order){
            return new ResponseData("error", 400, "Order not found", null);
        }
        
        const payment = await PaymentServices.fetchStandardPaymentLinkById(order.payment_id);
        if(!payment){
            return new ResponseData("error", 400, "No payment details were found", null);
        }

        let updatedOrder;
        if(payment.amount === payment.amount_paid){
            updatedOrder = await Order.findByIdAndUpdate(order_id, {
                $set: {status: 'PAYMENT COMPELTE'}},
                {new: true});
            
            let productMetadatas: any = [];
            const productIds = order.products;
            productIds.map(async (productId) => {
                const productMetaData = await ProductMetaData.findOne({productId: productId});
                productMetadatas = [...productMetadatas, productMetaData];
            });

            await CartItem.deleteMany({userId: order?.userId});

            return new ResponseData("success", 200, "Success", {order_details: updatedOrder, product_metadata: productMetadatas});
        }else{
            updatedOrder = await Order.findByIdAndUpdate(order_id, {
                $set: {status: 'PAYMENT FAILED'}},
                {new: true});
            return new ResponseData("success", 200, "Payment has failed", {order_details: updatedOrder});
        }

    }
}