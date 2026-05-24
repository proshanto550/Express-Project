import { pool } from "../../db";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config/env";


const registerUserIntoDB = async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
}) => {
    const { name, email, password, role } = payload;
    // First check if the user already exists
    const userData = await pool.query(`
    SELECT * FROM users WHERE email = $1
    `, [email]);

    if (userData.rows.length > 0) {
        throw new Error("User already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert the user into the database
    const result = await pool.query(`
        INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *
    `, [name, email, hashedPassword, role]);

    return result.rows[0];
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

    const user = userData.rows[0];
    // console.log(user);
    const matchPassword = await bcrypt.compare(password, user.password);
    // console.log(matchPassword);
    if (!matchPassword) {
        throw new Error("Invalid Credentials");
    }

    // Token generation will be here

    const jwtPayload = {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        is_active: user.is_active,
    };

    const accessToken = jwt.sign(jwtPayload, config.JWT_SECRET_KEY as string, {
        expiresIn: "1d",
    });

    const refreshToken = jwt.sign(jwtPayload, config.refresh_secret as string, {
        expiresIn: "10d",
    });

    return { accessToken, refreshToken };
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

    if (!user?.is_active) {
        throw new Error("Forbidden!");
    }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        is_active: user.is_active,
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