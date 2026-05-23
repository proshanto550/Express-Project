import type { Request, Response, NextFunction } from "express";

const auth = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        // console.log("This is Protected Route");
        // console.log(req.headers.authorization);
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                success: false,
                "message": "Unauthorized Access",
            });
        }
        next();
    };
};

export default auth;