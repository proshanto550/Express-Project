import { type Request, type Response } from "express";
import { userService } from "./user.service";

const createUser = async (req: Request, res: Response) => {

    // console.log(req.body);
    const { name, email, password, age } = req.body;

    try {
        const result = await userService.createUserIntoDB(req.body);
        // console.log(result);

        res.status(201).json({
            success: true,
            "message": "Created successfully",
            "data": result.rows[0],
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    };
}


const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await userService.getAllUsersFromDB();

        res.status(200).json({
            success: true,
            "message": "Users retrieved successfully",
            "data": result.rows,
        });
    } catch (error: any) {
        res.status(500).json({
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
            res.status(404).json({
                success: false,
                "message": "User Not Found",
                "data": {},
            });
        }

        res.status(200).json({
            success: true,
            "message": "User retrieved successfully",
            "data": result.rows[0],
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    };
};


const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password, age, is_active } = req.body;
    // console.log("Id : ", id);
    // console.log("Body : ", req.body);

    try {
        const result = await userService.updateUserFromDB(id as string, req.body);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                "message": "User Not Found",
                "data": {},
            });
        };

        // console.log(result);
        res.status(200).json({
            success: true,
            "message": "User updated successfully",
            "data": result.rows[0],
        });
    } catch (error: any) {
        res.status(500).json({
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
            res.status(404).json({
                success: false,
                "message": "User Not Found",
                "data": {},
            });
        };
        res.status(200).json({
            success: true,
            "message": "User deleted successfully",
            "data": result.rows[0],
        });
    } catch (error: any) {
        res.status(500).json({
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