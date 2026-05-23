import { type Request, type Response, type NextFunction } from "express";
import fs from "fs";

const logger = (req: Request, res: Response, next: NextFunction) => {
    // console.log('Method - URL - Time:', req.method, req.url, Date.now());
    const log = `\nMethod -> ${req.method} | URL -> ${req.url} | Time -> ${Date.now()}\n`;
    // You can write this log to a file or a logging service
    fs.appendFile("logger.txt", log, (err) => {});
    // console.log(log);
    next();
};

export default logger;