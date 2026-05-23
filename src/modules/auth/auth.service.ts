import { pool } from "../../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/env";

const loginUserIntoDB = async ( payload: { 
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

    if(userData.rowCount === 0) {
        throw new Error("Invalid Credentials");
    }

    const user = userData.rows[0];
    // console.log(user);
    const matchPassword = await bcrypt.compare(password, user.password);
    // console.log(matchPassword);
    if(!matchPassword) {
        throw new Error("Invalid Credentials");
    }

    // Token generation will be here

    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        is_active: user.is_active,
    };

    const accessToken = jwt.sign(jwtPayload, config.JWT_SECRET_KEY as string, {
        expiresIn: "5d",
    });

    return accessToken;
};


export const authService = {
    loginUserIntoDB,
};