import mongoose from "mongoose";
import Logger from "../utils/Logger";

export const connectDB = async () => {
    try {
        let isConnected = false;

        const MONGO_URI = process.env.NODE_ENV === "development" ? 
            process.env.MONGO_URI_DEV : process.env.MONGO_URI_PROD;
    

        if(!MONGO_URI){
            return Logger.error("Invalid or missing MONGO URI");
        }

        if(isConnected){
            return Logger.info(" 💾 Already connected to the database");
        }

        await mongoose.connect(MONGO_URI);
        return Logger.info(" 💾 Successfully connected to the database");
    } catch (error) {
        throw error;
    }
}