import express, { type Application, type Request, type Response } from "express";
import { userRoute } from "./modules/users/user.route";
import { issueRoute } from "./modules/issue/issue.route";
import { authRoute } from "./modules/auth/auth.route";
import logger from "./middleware/logger";
import cookieParser from "cookie-parser";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app: Application = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use(cors({
    origin: "http://localhost:3000",
}));

app.get("/", (req: Request, res: Response) => {
    // res.send("Hello World!");
    res.status(200).json({
        "message": "This is Express Project!",
        "author": "Proshanto Kumar Das",
    });
});

app.use("/api/users", userRoute);
app.use("/api/issues", issueRoute);
app.use("/api/auth", authRoute);

app.use(globalErrorHandler);

export default app;