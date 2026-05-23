import { pool } from "../../db";


const createProfileIntoDB = async(payload: any) => {
    // console.log(payload);
    const { user_id, bio, address, phone, gender } = payload;

    // First check if the user_id exists in users table

    const user = await pool.query(`
        SELECT * FROM users WHERE id = $1
    `, [user_id]);
    // console.log(user);

    if(user.rowCount === 0) {
        throw new Error("User not exists");
    }

    const result = await pool.query(`
        INSERT INTO profiles (user_id, bio, address, phone, gender) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [user_id, bio, address, phone, gender]);

    return result;
};


export const profileService = {
    createProfileIntoDB,
}