import { pool } from "../../utility/db.init";
import type { IssuePayload, IssueQuery, IssueRecord, IssueWithReporter, IssueUpdatePayload, IssueReporter } from "./issue.interface";

const createIssueIntoDB = async (payload: IssuePayload) => {
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

    return result.rows[0];
};


const getAllIssuesFromDB = async (query: IssueQuery = {}) => {
    const conditions: string[] = [];
    const values: any[] = [];

    if (query.type) {
        values.push(query.type);
        conditions.push(`type = $${values.length}`);
    }
    if (query.status) {
        values.push(query.status);
        conditions.push(`status = $${values.length}`);
    }

    let sql = `SELECT * FROM issues`;
    if (conditions.length) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
    }
    sql += query.sort === "oldest" ? ` ORDER BY created_at ASC` : ` ORDER BY created_at DESC`;

    const result = await pool.query(sql, values);
    const issues = result.rows as IssueRecord[];

    if (!issues.length) {
        return [];
    }

    const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
    const reporters = await pool.query(
        `SELECT id, name, role FROM users WHERE id = ANY($1)`,
        [reporterIds],
    );

    const reporterMap = new Map(reporters.rows.map((user: IssueReporter) => [user.id, user]));

    return issues.map((issue) => ({
        ...issue,
        reporter: reporterMap.get(issue.reporter_id) ?? null,
    }));
};


const getSingleIssueFromDB = async (id: string): Promise<IssueWithReporter | null> => {
    const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
        return null;
    }

    const issue = result.rows[0] as IssueRecord;
    const reporterQuery = await pool.query(`SELECT id, name, role FROM users WHERE id = $1`, [issue.reporter_id]);

    return {
        ...issue,
        reporter: reporterQuery.rows[0] ?? null,
    };
};


const updateIssueFromDB = async (id: string, payload: IssueUpdatePayload, user: { id?: number; role?: string }) => {
    const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);

    if (issueResult.rowCount === 0) {
        throw new Error("Issue not found");
    }

    const issue = issueResult.rows[0] as IssueRecord;
    const userId = Number(user?.id);
    const userRole = user?.role;

    if (userRole === "contributor") {
        if (issue.reporter_id !== userId) {
            throw new Error("Forbidden: contributors may only update their own issues");
        }
        if (issue.status !== "open") {
            throw new Error("Cannot update issue unless status is open");
        }
        if (payload.status !== undefined) {
            throw new Error("Contributors cannot update issue status");
        }
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (payload.title !== undefined) {
        if (!payload.title || typeof payload.title !== "string" || payload.title.trim().length === 0) {
            throw new Error("Title is required");
        }
        if (payload.title.length > 150) {
            throw new Error("Title must be 150 characters or fewer");
        }
        values.push(payload.title);
        fields.push(`title = $${values.length}`);
    }

    if (payload.description !== undefined) {
        if (!payload.description || typeof payload.description !== "string" || payload.description.trim().length < 20) {
            throw new Error("Description must be at least 20 characters");
        }
        values.push(payload.description);
        fields.push(`description = $${values.length}`);
    }

    if (payload.type !== undefined) {
        if (!payload.type || !["bug", "feature_request"].includes(payload.type)) {
            throw new Error("Type must be either 'bug' or 'feature_request'");
        }
        values.push(payload.type);
        fields.push(`type = $${values.length}`);
    }

    if (payload.status !== undefined) {
        if (userRole !== "maintainer") {
            throw new Error("Forbidden: only maintainers can update status");
        }
        if (!payload.status || !["open", "in_progress", "resolved"].includes(payload.status)) {
            throw new Error("Status must be one of: open, in_progress, resolved");
        }
        values.push(payload.status);
        fields.push(`status = $${values.length}`);
    }

    if (!fields.length) {
        throw new Error("No valid fields provided for update");
    }

    values.push(id);
    const updated = await pool.query(
        `UPDATE issues SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values,
    );

    return updated.rows[0];
};



const deleteIssueFromDB = async (id: string, user: { role?: string }) => {
    if (user?.role !== "maintainer") {
        throw new Error("Forbidden: only maintainers can delete issues");
    }

    const result = await pool.query(
        `DELETE FROM issues WHERE id = $1 RETURNING *`, [id]
    );

    if (result.rowCount === 0) {
        throw new Error("Issue not found");
    }

    return result.rows[0];
};


export const issueService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
    updateIssueFromDB,
    deleteIssueFromDB,
};