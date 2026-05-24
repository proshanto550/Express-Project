import { type Request, type Response } from "express";
import { userService } from "./user.service";
import sendResponse from "../../utility/sendResponse";

const createUser = async (req: Request, res: Response) => {

    // console.log(req.body);
    const { name, email, password, age } = req.body;

    try {
        const result = await userService.createUserIntoDB(req.body);
        // console.log(result);

        // res.status(201).json({

        // });

        sendResponse(res, {
            statusCode: 201,
            success: true,
            "message": "Created successfully",
            "data": result.rows[0],
        });

    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error
        });
    };
}


const getAllUsers = async (req: Request, res: Response) => {
    console.log("Controller", req.user);
    try {
        const result = await userService.getAllUsersFromDB();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            "message": "Users retrieved successfully",
            "data": result.rows,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error
        })
    }
};


const getSingleUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await userService.getSingleUserFromDB(id as string);

        if (result.rows.length === 0) {
            sendResponse(res, {
                statusCode: 404,
                success: false,
                "message": "User Not Found",
                "data": {},
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            "message": "User retrieved successfully",
            "data": result.rows[0],
        });

    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error
        });
    };
};


const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password, age } = req.body;
    // console.log("Id : ", id);
    // console.log("Body : ", req.body);

    try {
        const result = await userService.updateUserFromDB(id as string, req.body);

        if (result.rows.length === 0) {
            sendResponse(res, {
                statusCode: 404,
                success: false,
                "message": "User Not Found",
                "data": {},
            });
        };

        // console.log(result);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            "message": "User updated successfully",
            "data": result.rows[0],
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error
        });
    };
};


const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await userService.deleteUserFromDB(id as string);

        if (result.rows.length === 0) {
            sendResponse(res, {
                statusCode: 404,
                success: false,
                "message": "User Not Found",
                "data": {},
            });
        };
        sendResponse(res, {
            statusCode: 200,
            success: true,
            "message": "User deleted successfully",
            "data": result.rows[0],
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error
        });
    };
};


export const userController = {
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser,
};