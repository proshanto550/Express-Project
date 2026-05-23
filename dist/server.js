import express, {} from "express";
import { Pool } from "pg";
import config from "./config/env";
const app = express();
const port = config.port;
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
const pool = new Pool({
    connectionString: config.connection_string,
});
const initDB = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(30),
      email VARCHAR(30) UNIQUE NOT NULL,
      password VARCHAR(20) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      age INT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      )`);
        console.log("Database connected successfully");
    }
    catch (error) {
        console.log(error.message);
    }
};
initDB();
app.get("/", (req, res) => {
    // res.send("Hello World!");
    res.status(200).json({
        "message": "Hello World!",
        "author": "Proshanto",
    });
});
app.post("/api/users", async (req, res) => {
    // console.log(req.body);
    const { name, email, password, age } = req.body;
    try {
        const result = await pool.query(`
    INSERT INTO users(name, email, password, age) 
    VALUES($1, $2, $3, $4)
    RETURNING *`, [name, email, password, age]);
        // console.log(result);
        res.status(201).json({
            success: true,
            "message": "Created successfully",
            "data": result.rows[0],
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
    ;
});
app.get("/api/users", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT * FROM users`);
        res.status(200).json({
            success: true,
            "message": "Users retrieved successfully",
            "data": result.rows,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
});
app.get("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                "message": "User Not Found",
                "data": {},
            });
        }
        res.status(200).json({
            success: true,
            "message": "User retrieved successfully",
            "data": result.rows[0],
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
    ;
});
app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, password, age, is_active } = req.body;
    // console.log("Id : ", id);
    // console.log("Body : ", req.body);
    try {
        const result = await pool.query(`UPDATE users SET 
      name = COALESCE($1, name), 
      email = COALESCE($2, email), 
      password = COALESCE($3, password), 
      age = COALESCE($4, age), 
      is_active = COALESCE($5, is_active) 

      WHERE id = $6 RETURNING *`, [name, email, password, age, is_active, id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                "message": "User Not Found",
                "data": {},
            });
        }
        ;
        // console.log(result);
        res.status(200).json({
            success: true,
            "message": "User updated successfully",
            "data": result.rows[0],
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
    ;
});
app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING *`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                "message": "User Not Found",
                "data": {},
            });
        }
        ;
        res.status(200).json({
            success: true,
            "message": "User deleted successfully",
            "data": result.rows[0],
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
    ;
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
//# sourceMappingURL=server.js.map