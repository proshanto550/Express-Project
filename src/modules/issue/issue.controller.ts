import { type Request, type Response } from "express";
import { issueService } from "./issue.service";
import sendResponse from "../../utility/sendResponse";

const createIssue = async (req: Request, res: Response) => {
    try {
        const reporter_id = Number(req.user?.id);
        if (!reporter_id) {
            return sendResponse(res, {
                statusCode: 401,
                success: false,
                message: "Unauthorized: reporter information missing",
            });
        }

        const issue = await issueService.createIssueIntoDB({
            ...req.body,
            reporter_id,
        });

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "Issue created successfully",
            data: issue,
        });

    } catch (error: any) {
        sendResponse(res, {
            statusCode: error.message.includes("Forbidden") ? 403 : 400,
            success: false,
            message: error.message,
            error: error,
        });
    }
};

const getAllIssues = async (req: Request, res: Response) => {
    try {
        const issues = await issueService.getAllIssuesFromDB({
            sort: req.query.sort as string,
            type: req.query.type as string,
            status: req.query.status as string,
        });
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issues retrieved successfully",
            data: issues,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        });
    }
};

const getSingleIssue = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const issue = await issueService.getSingleIssueFromDB(id as string);
        if (!issue) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "Issue not found",
            });
        }
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue retrieved successfully",
            data: issue,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        });
    }
};

const updateIssue = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const updatedIssue = await issueService.updateIssueFromDB(id as string, req.body, req.user);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue updated successfully",
            data: updatedIssue,
        });
    } catch (error: any) {
        const statusCode = error.message.includes("not found") ? 404 : error.message.includes("Forbidden") ? 403 : 400;
        sendResponse(res, {
            statusCode,
            success: false,
            message: error.message,
            error: error,
        });
    }
};

const deleteIssue = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const issue = await issueService.deleteIssueFromDB(id as string, req.user);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue deleted successfully",
            data: issue,
        });
    } catch (error: any) {
        const statusCode = error.message.includes("not found") ? 404 : error.message.includes("Forbidden") ? 403 : 400;
        sendResponse(res, {
            statusCode,
            success: false,
            message: error.message,
            error: error,
        });
    }
};



export const issueController = {
    createIssue,
    getAllIssues,
    getSingleIssue,
    updateIssue,
    deleteIssue,
};