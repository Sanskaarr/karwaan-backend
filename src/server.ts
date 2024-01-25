import express from 'express';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import AWS from 'aws-sdk';
import Razorpay from 'razorpay';
import Logger from './utils/Logger';
import Routes from './routes/_index';
import { connectDB } from './config/connectDB';
import { initializeModel } from './model/_index';
import { globalErrorHandler } from './middleware/globalErrorHandler';

dotenv.config({path: './src/config/.env'});

const app = express();

const PORT = process.env.NODE_ENV === "development" ? 
    process.env.PORT_DEVELOPMENT : process.env.PORT_PRODUCTION
const HOST = process.env.NODE_ENV === "development" ? 
    process.env.HOST_DEVELOPMENT : process.env.HOST_PRODUCTION

initializeModel();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(fileUpload());
app.use(cors({
    origin: ['https://www.karwaanfilms.com', 'https://karwaan-admin-pannel.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

export const s3 = new AWS.S3({
    endpoint: process.env.DIGITAL_OCEAN_BUCKET_ENDPOINT!,
    accessKeyId: process.env.DIGITAL_OCEAN_BUCKET_ACCESS_ID!,
    secretAccessKey: process.env.DIGITAL_OCEAN_BUCKET_SECRET_ACCESS_KEY,
    region: 'ap-south-1',
});

export const razorPayInstance = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID!, 
    key_secret: process.env.RAZOR_PAY_SECRET_KEY!
});

app.listen(PORT, async () => {
    try {
        app.use(Routes);
        app.use('*', globalErrorHandler);
        Logger.info(`⚡Successfully connected to http://${HOST}:${PORT}`); 
        await connectDB();
    } catch (error: any) {
        Logger.error(error.message);
    }
})