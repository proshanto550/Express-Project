import type { Request, Response, NextFunction } from "express";
import config from "../config/env";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db";
import type { ROLES } from "../types";
import sendResponse from "../utility/sendResponse";

const auth = (...roles: ROLES[]) => {

    return async (req: Request, res: Response, next: NextFunction) => {
        // console.log(roles);
        try {
            // console.log("This is Protected Route");
            // console.log(req.headers.authorization);
            let token = req.headers.authorization;
            if (typeof token === "string" && token.startsWith("Bearer ")) {
                token = token.slice(7).trim();
            }

            if (!token) {
                return sendResponse(res, {
                    statusCode: 401,
                    success: false,
                    "message": "Unauthorized Access!",
                });
            }

            const decoded = jwt.verify(
                token as string,
                config.JWT_SECRET_KEY as string
            ) as JwtPayload;

            const userData = await pool.query(
                `SELECT * FROM users WHERE email = $1`,
                [decoded.email]
            );

            if (userData.rows.length === 0) {
                return sendResponse(res, {
                    statusCode: 404,
                    success: false,
                    "message": "User Not Found!",
                });
            }

            const user = userData.rows[0];
            const normalizedRole = user.role?.trim().toLowerCase();
            const validRoles: string[] = ["contributor", "maintainer"];

            if (!validRoles.includes(normalizedRole as string)) {
                return sendResponse(res, {
                    statusCode: 403,
                    success: false,
                    "message": "Forbidden! User role is not valid.",
                });
            }

            if (roles.length && !roles.includes(normalizedRole as any)) {
                return sendResponse(res, {
                    statusCode: 403,
                    success: false,
                    "message": "Forbidden! User is not authorized to Access.",
                });
            }

            req.user = {
                ...decoded,
                role: normalizedRole,
            } as JwtPayload;

            next();
        } catch (err: any) {
            return sendResponse(res, {
                statusCode: 401,
                success: false,
                message: "Invalid or expired token",
                error: err.message,
            });
        }
    };
};

export default auth;