import axios from "axios";

export class SmsServices {
    static async generateOTP(): Promise<number> {
        const otp = Math.floor(1000 + Math.random() * 9000);
        return otp;
    }

    static async sendOtp(payload: number, otp: number) {
        try {
            const options = {
                url: 'https://www.fast2sms.com/dev/bulkV2',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': process.env.FAST2SMS_API_KEY,
                },
                data: {
                    route: 'otp',
                    numbers: payload,
                    variables_values: otp,
                },
            };

            const res = await axios(options);
            return res.data;
        } catch (error) {
            throw error;
        }
        
    }
}
