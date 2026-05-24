import { pool } from "../../db";


const createIssueIntoDB = async (payload: any) => {
    const { title, description, type, reporter_id } = payload;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
        throw new Error("Title is required");
    }
    if (title.length > 150) {
        throw new Error("Title must be 150 characters or fewer");
    }
    if (!description || typeof description !== "string" || description.trim().length < 20) {
        throw new Error("Description must be at least 20 characters");
    }
    if (!type || !["bug", "feature_request"].includes(type)) {
        throw new Error("Type must be either 'bug' or 'feature_request'");
    }
    if (!reporter_id) {
        throw new Error("Reporter ID is required");
    }

    const user = await pool.query(`
        SELECT * FROM users WHERE id = $1
    `, [reporter_id]);
    // console.log(user);

    if (user.rowCount === 0) {
        throw new Error("User does not exist");
    }

    const result = await pool.query(`
        INSERT INTO issues (title, description, type, status, reporter_id)
        VALUES ($1, $2, $3, 'open', $4)
        RETURNING *
    `, [title, description, type, reporter_id]);

    return result;
};

export const issueService = {
    createIssueIntoDB,
};