import type { Request, Response, NextFunction } from "express";
import config from "../config/env";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db";
import type { ROLES } from "../types";

const auth = (...roles: ROLES[]) => {
    
    return async (req: Request, res: Response, next: NextFunction) => {
        // console.log(roles);
        try {
            // console.log("This is Protected Route");
            // console.log(req.headers.authorization);
            const token = req.headers.authorization;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    "message": "Unauthorized Access!",
                });
            }

            const decoded = jwt.verify(
                token as string,
                config.JWT_SECRET_KEY as string
            ) as JwtPayload;
            // console.log(decoded);
            const userData = await pool.query(
                `SELECT * FROM users WHERE email = $1
            `, [decoded.email]
            );

            // console.log(userData.rows[0]);
            const user = userData.rows[0];

            if (userData.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    "message": "User Not Found!",
                })
            }

            if (!user?.is_active) {
                res.status(403).json({
                    success: false,
                    "message": "Forbidden!",
                })
            }

            // console.log("User Role:", user.role);
            if (roles.length && !roles.includes(user.role)) {
                res.status(403).json({
                    success: false,
                    "message": "Forbidden! User is not authorized to Access.",
                })
            }

            req.user = decoded;

            next();
        } catch (err) {
            next(err);
        }
    };
};

export default auth;