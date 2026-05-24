import type { Request, Response, NextFunction } from "express";
import sendResponse from "../utility/sendResponse";

const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // Log the error

    sendResponse(res, {
        statusCode: 500,
        success: false,
        message: err.message || "Internal Server Error",
    });
};

export default globalErrorHandler;