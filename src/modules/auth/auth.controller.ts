import { type Request, type Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";


const registerUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.registerUserIntoDB(req.body);
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "User registered successfully",
            data: result,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        });
    }
};

const loginUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.loginUserIntoDB(req.body);

        const { refreshToken, token, user } = result;

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // In production => true
            sameSite: "lax",
        });

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Login successful",
            data: {
                token,
                user,
            },
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        });
    }
}

const refreshToken = async (req: Request, res: Response) => {
    try {
        const result = await authService.generateRefreshToken(req.cookies.refreshToken);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Access token generated successfully",
            data: result,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        });
    }
};

export const authController = {
    loginUser,
    refreshToken,
    registerUser,
};