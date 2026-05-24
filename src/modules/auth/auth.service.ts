import { pool } from "../../utility/db.init";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config/env";

const validRoles = ["contributor", "maintainer"];

const registerUserIntoDB = async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
}) => {
    const { name, email, password, role } = payload;

    const validRoles = ["contributor", "maintainer"];
    const normalizedRole = role?.trim().toLowerCase() || "contributor";
    if (!validRoles.includes(normalizedRole)) {
        throw new Error("Role must be either 'contributor' or 'maintainer'");
    }

    const userData = await pool.query(`
    SELECT * FROM users WHERE email = $1
    `, [email]);

    if (userData.rows.length > 0) {
        throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(`
        INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *
    `, [name, email, hashedPassword, normalizedRole]);

    const user = result.rows[0];
    delete user.password;
    return user;
};

const loginUserIntoDB = async (payload: {
    email: string;
    password: string
}) => {
    const { email, password } = payload;

    // First check if the user exists
    // Compare the password
    // Gerate a token
    const userData = await pool.query(`
    SELECT * FROM users WHERE email = $1
    `, [email]);

    if (userData.rows.length === 0) {
        throw new Error("Invalid Credentials");
    }

    const userRecord = userData.rows[0];
    // console.log(userRecord);
    const matchPassword = await bcrypt.compare(password, userRecord.password);
    if (!matchPassword) {
        throw new Error("Invalid Credentials");
    }

    const normalizedRole = userRecord.role?.trim().toLowerCase();
    if (!validRoles.includes(normalizedRole)) {
        throw new Error("Invalid user role");
    }

    const jwtPayload = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: normalizedRole,
    };

    const accessToken = jwt.sign(jwtPayload, config.JWT_SECRET_KEY as string, {
        expiresIn: "1d",
    });

    const refreshToken = jwt.sign(jwtPayload, config.refresh_secret as string, {
        expiresIn: "10d",
    });

    const user = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: normalizedRole,
        created_at: userRecord.created_at,
        updated_at: userRecord.updated_at,
    };

    return { token: accessToken, refreshToken, user };
};

const generateRefreshToken = async (token: string) => {

    if (!token) {
        throw new Error("Unauthorized Access!");
    }

    const decoded = jwt.verify(
        token as string,
        config.refresh_secret as string
    ) as JwtPayload;

    const userData = await pool.query(
        `SELECT * FROM users WHERE email = $1
            `, [decoded.email]
    );

    const user = userData.rows[0];

    if (userData.rows.length === 0) {
        throw new Error("User Not Found!");
    }

    const normalizedRole = user.role?.trim().toLowerCase();
    if (!validRoles.includes(normalizedRole)) {
        throw new Error("Invalid user role");
    }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        role: normalizedRole,
        email: user.email,
    };

    const accessToken = jwt.sign(jwtPayload, config.JWT_SECRET_KEY as string, {
        expiresIn: "1d",
    });

    return { accessToken };
}


export const authService = {
    loginUserIntoDB,
    generateRefreshToken,
    registerUserIntoDB,
};