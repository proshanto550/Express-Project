import { pool } from "../../db";
import type { IUser } from "./user.interface";
import bcrypt from "bcryptjs";


const createUserIntoDB = async (payload: IUser) => {
    const { name, email, password, role } = payload;

    const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
    INSERT INTO users(name, email, password, role) 
    VALUES($1, $2, $3, COALESCE($4, 'user'))
    RETURNING *`, [name, email, hashPassword, role]);

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
    const { name, email, password } = payload;

    const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `UPDATE users SET 
        name = COALESCE($1, name), 
        email = COALESCE($2, email), 
        password = COALESCE($3, password)

        WHERE id = $6 RETURNING *`,
        [name, email, hashPassword, id],
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