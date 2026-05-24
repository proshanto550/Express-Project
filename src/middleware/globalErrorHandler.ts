import type { Request, Response, NextFunction } from "express";

const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // Log the error

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};

export default globalErrorHandler;