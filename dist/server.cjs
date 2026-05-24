
        import { createRequire } from 'module';
        const require = createRequire(import.meta.url);
        
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/config/env.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
import_dotenv.default.config({
  path: import_path.default.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  refresh_secret: process.env.JWT_REFRESH_SECRET
};
var env_default = config;

// src/app.ts
var import_express6 = __toESM(require("express"), 1);

// src/modules/issue/issue.route.ts
var import_express2 = require("express");

// src/middleware/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);

// src/utility/db.init.ts
var import_pg = require("pg");
var pool = new import_pg.Pool({
  connectionString: env_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(30),
        email VARCHAR(30) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor',

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )`);
    await pool.query(`
            CREATE TABLE IF NOT EXISTS issues(
                id SERIAL PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                description TEXT NOT NULL,
                type VARCHAR(20) NOT NULL,
                status VARCHAR(20) DEFAULT 'open',
                reporter_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error.message);
  }
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/middleware/auth.ts
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      let token = req.headers.authorization;
      if (typeof token === "string" && token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
      }
      if (!token) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          "message": "Unauthorized Access!"
        });
      }
      const decoded = import_jsonwebtoken.default.verify(
        token,
        env_default.JWT_SECRET_KEY
      );
      const userData = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [decoded.email]
      );
      if (userData.rows.length === 0) {
        return sendResponse_default(res, {
          statusCode: 404,
          success: false,
          "message": "User Not Found!"
        });
      }
      const user = userData.rows[0];
      const normalizedRole = user.role?.trim().toLowerCase();
      const validRoles2 = ["contributor", "maintainer"];
      if (!validRoles2.includes(normalizedRole)) {
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          "message": "Forbidden! User role is not valid."
        });
      }
      if (roles.length && !roles.includes(normalizedRole)) {
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          "message": "Forbidden! User is not authorized to Access."
        });
      }
      req.user = {
        ...decoded,
        role: normalizedRole
      };
      next();
    } catch (err) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Invalid or expired token",
        error: err.message
      });
    }
  };
};
var auth_default = auth;

// src/modules/issue/issue.controller.ts
var import_express = require("express");

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (payload) => {
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
var getAllIssuesFromDB = async (query = {}) => {
  const conditions = [];
  const values = [];
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
  const issues = result.rows;
  if (!issues.length) {
    return [];
  }
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const reporters = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  const reporterMap = new Map(reporters.rows.map((user) => [user.id, user]));
  return issues.map((issue) => ({
    ...issue,
    reporter: reporterMap.get(issue.reporter_id) ?? null
  }));
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  if (result.rowCount === 0) {
    return null;
  }
  const issue = result.rows[0];
  const reporterQuery = await pool.query(`SELECT id, name, role FROM users WHERE id = $1`, [issue.reporter_id]);
  return {
    ...issue,
    reporter: reporterQuery.rows[0] ?? null
  };
};
var updateIssueFromDB = async (id, payload, user) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  if (issueResult.rowCount === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  const userId = Number(user?.id);
  const userRole = user?.role;
  if (userRole === "contributor") {
    if (issue.reporter_id !== userId) {
      throw new Error("Forbidden: contributors may only update their own issues");
    }
    if (issue.status !== "open") {
      throw new Error("Cannot update issue unless status is open");
    }
    if (payload.status !== void 0) {
      throw new Error("Contributors cannot update issue status");
    }
  }
  const fields = [];
  const values = [];
  if (payload.title !== void 0) {
    if (!payload.title || typeof payload.title !== "string" || payload.title.trim().length === 0) {
      throw new Error("Title is required");
    }
    if (payload.title.length > 150) {
      throw new Error("Title must be 150 characters or fewer");
    }
    values.push(payload.title);
    fields.push(`title = $${values.length}`);
  }
  if (payload.description !== void 0) {
    if (!payload.description || typeof payload.description !== "string" || payload.description.trim().length < 20) {
      throw new Error("Description must be at least 20 characters");
    }
    values.push(payload.description);
    fields.push(`description = $${values.length}`);
  }
  if (payload.type !== void 0) {
    if (!payload.type || !["bug", "feature_request"].includes(payload.type)) {
      throw new Error("Type must be either 'bug' or 'feature_request'");
    }
    values.push(payload.type);
    fields.push(`type = $${values.length}`);
  }
  if (payload.status !== void 0) {
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
    values
  );
  return updated.rows[0];
};
var deleteIssueFromDB = async (id, user) => {
  if (user?.role !== "maintainer") {
    throw new Error("Forbidden: only maintainers can delete issues");
  }
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id]
  );
  if (result.rowCount === 0) {
    throw new Error("Issue not found");
  }
  return result.rows[0];
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueFromDB,
  deleteIssueFromDB
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const reporter_id = Number(req.user?.id);
    if (!reporter_id) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized: reporter information missing"
      });
    }
    const issue = await issueService.createIssueIntoDB({
      ...req.body,
      reporter_id
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: issue
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: error.message.includes("Forbidden") ? 403 : 400,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const issues = await issueService.getAllIssuesFromDB({
      sort: req.query.sort,
      type: req.query.type,
      status: req.query.status
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: issues
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await issueService.getSingleIssueFromDB(id);
    if (!issue) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: issue
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedIssue = await issueService.updateIssueFromDB(id, req.body, req.user);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("Forbidden") ? 403 : 400;
    sendResponse_default(res, {
      statusCode,
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await issueService.deleteIssueFromDB(id, req.user);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
      data: issue
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("Forbidden") ? 403 : 400;
    sendResponse_default(res, {
      statusCode,
      success: false,
      message: error.message,
      error
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/utility/roleType.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issue/issue.route.ts
var router = (0, import_express2.Router)();
router.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.createIssue);
router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getSingleIssue);
router.patch("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.updateIssue);
router.delete("/:id", auth_default(USER_ROLE.maintainer), issueController.deleteIssue);
var issueRoute = router;

// src/modules/auth/auth.route.ts
var import_express4 = require("express");

// src/modules/auth/auth.controller.ts
var import_express3 = require("express");

// src/modules/auth/auth.service.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var validRoles = ["contributor", "maintainer"];
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const validRoles2 = ["contributor", "maintainer"];
  const normalizedRole = role?.trim().toLowerCase() || "contributor";
  if (!validRoles2.includes(normalizedRole)) {
    throw new Error("Role must be either 'contributor' or 'maintainer'");
  }
  const userData = await pool.query(`
    SELECT * FROM users WHERE email = $1
    `, [email]);
  if (userData.rows.length > 0) {
    throw new Error("User already exists");
  }
  const hashedPassword = await import_bcryptjs.default.hash(password, 12);
  const result = await pool.query(`
        INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *
    `, [name, email, hashedPassword, normalizedRole]);
  const user = result.rows[0];
  delete user.password;
  return user;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`
    SELECT * FROM users WHERE email = $1
    `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }
  const userRecord = userData.rows[0];
  const matchPassword = await import_bcryptjs.default.compare(password, userRecord.password);
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
    role: normalizedRole
  };
  const accessToken = import_jsonwebtoken2.default.sign(jwtPayload, env_default.JWT_SECRET_KEY, {
    expiresIn: "1d"
  });
  const refreshToken2 = import_jsonwebtoken2.default.sign(jwtPayload, env_default.refresh_secret, {
    expiresIn: "10d"
  });
  const user = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: normalizedRole,
    created_at: userRecord.created_at,
    updated_at: userRecord.updated_at
  };
  return { token: accessToken, refreshToken: refreshToken2, user };
};
var generateRefreshToken = async (token) => {
  if (!token) {
    throw new Error("Unauthorized Access!");
  }
  const decoded = import_jsonwebtoken2.default.verify(
    token,
    env_default.refresh_secret
  );
  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1
            `,
    [decoded.email]
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
    email: user.email
  };
  const accessToken = import_jsonwebtoken2.default.sign(jwtPayload, env_default.JWT_SECRET_KEY, {
    expiresIn: "1d"
  });
  return { accessToken };
};
var authService = {
  loginUserIntoDB,
  generateRefreshToken,
  registerUserIntoDB
};

// src/modules/auth/auth.controller.ts
var registerUser = async (req, res) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    const { refreshToken: refreshToken2, token, user } = result;
    res.cookie("refreshToken", refreshToken2, {
      httpOnly: true,
      secure: false,
      // In production => true
      sameSite: "lax"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: {
        token,
        user
      }
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var refreshToken = async (req, res) => {
  try {
    const result = await authService.generateRefreshToken(req.cookies.refreshToken);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Access token generated successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  loginUser,
  refreshToken,
  registerUser
};

// src/modules/auth/auth.route.ts
var router2 = (0, import_express4.Router)();
router2.post("/signup", authController.registerUser);
router2.post("/login", authController.loginUser);
router2.post("/refresh-token", authController.refreshToken);
var authRoute = router2;

// src/middleware/logger.ts
var import_express5 = require("express");
var import_fs = __toESM(require("fs"), 1);
var logger = (req, res, next) => {
  const log = `
Method -> ${req.method} | URL -> ${req.url} | Time -> ${Date.now()}
`;
  import_fs.default.appendFile("logger.txt", log, (err) => {
  });
  next();
};
var logger_default = logger;

// src/app.ts
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_cors = __toESM(require("cors"), 1);

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  sendResponse_default(res, {
    statusCode: 500,
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = (0, import_express6.default)();
app.use((0, import_cookie_parser.default)());
app.use(import_express6.default.json());
app.use(import_express6.default.text());
app.use(import_express6.default.urlencoded({ extended: true }));
app.use(logger_default);
app.use((0, import_cors.default)({
  origin: "http://localhost:3000"
}));
app.get("/", (req, res) => {
  res.status(200).json({
    "message": "This is Express Project!",
    "author": "Proshanto Kumar Das"
  });
});
app.use("/api/issues", issueRoute);
app.use("/api/auth", authRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(env_default.port, () => {
    console.log(`Example app listening on port ${env_default.port}`);
  });
};
main();
//# sourceMappingURL=server.cjs.map