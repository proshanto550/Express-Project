import { type Request, type Response } from "express";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
    try {
        const reporter_id = req.user?.id;
        if (!reporter_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: reporter information missing",
            });
        }

        const result = await issueService.createIssueIntoDB({
            ...req.body,
            reporter_id,
        });

        res.status(201).json({
            success: true,
            message: "Issue created successfully",
            data: result.rows[0],
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error,
        });
    }
};

export const issueController = {
    createIssue,
};