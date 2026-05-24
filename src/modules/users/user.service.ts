import { pool } from "../../db";
import type { IUser } from "./user.interface";
import bcrypt from "bcryptjs";


const createUserIntoDB = async (payload: IUser) => {
    const { name, email, password, age, role } = payload;

    const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
    INSERT INTO users(name, email, password, age, role) 
    VALUES($1, $2, $3, $4, COALESCE($5, 'user'))
    RETURNING *`, [name, email, hashPassword, age, role]);

    delete result.rows[0].password;

    return result;
};


const getAllUsersFromDB = async () => {
    const result = await pool.query(`
      SELECT * FROM users`);
    return result;
};


const getSingleUserFromDB = async (id: string) => {
    const result = await pool.query(
        `SELECT * FROM users WHERE id = $1`, [id],
    );
    delete result.rows[0].password;
    return result;
};


const updateUserFromDB = async (id: string, payload: IUser) => {
    const { name, email, password, age, is_active } = payload;

    const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `UPDATE users SET 
        name = COALESCE($1, name), 
        email = COALESCE($2, email), 
        password = COALESCE($3, password), 
        age = COALESCE($4, age), 
        is_active = COALESCE($5, is_active) 

        WHERE id = $6 RETURNING *`,
        [name, email, hashPassword, age, is_active, id],
    );
    delete result.rows[0].password;
    return result;
};


const deleteUserFromDB = async (id: string) => {
    const result = await pool.query(
        `DELETE FROM users WHERE id = $1 RETURNING *`, [id]
    );
    delete result.rows[0].password;
    return result;
};


export const userService = {
    createUserIntoDB,
    getAllUsersFromDB,
    getSingleUserFromDB,
    updateUserFromDB,
    deleteUserFromDB,
};