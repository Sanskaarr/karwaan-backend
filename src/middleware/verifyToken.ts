import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { ResponseData } from "../utils/ResponseData";

export const verifyToken = (request: Request, response: Response, next: NextFunction) => {
  let data;
  const token = request.header('Authorization');

  if (!token) {
    data = new ResponseData("error", 403, "Unauthorized: Missing token", null);
    return response.status(data.statusCode).json(data);
  }
  
  jwt.verify(token, process.env.JWT_SECRET as string, () => {
    try {
      next();
      return;
    } catch (error: any) {
      next();
      data = new ResponseData("error", 403, error.message, null);
      return response.status(data.statusCode).json(data);
    }
  });
}
