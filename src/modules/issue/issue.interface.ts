export type ISSUE_TYPE = "bug" | "feature_request";
export type ISSUE_STATUS = "open" | "in_progress" | "resolved";

export interface IssuePayload {
    title: string;
    description: string;
    type: ISSUE_TYPE;
    reporter_id: number;
}

export interface IssueUpdatePayload {
    title?: string;
    description?: string;
    type?: ISSUE_TYPE;
    status?: ISSUE_STATUS;
}

export interface IssueQuery {
    sort?: "oldest" | "newest";
    type?: ISSUE_TYPE;
    status?: ISSUE_STATUS;
}

export interface IssueReporter {
    id: number;
    name: string;
    role: "contributor" | "maintainer";
}

export interface IssueRecord {
    id: number;
    title: string;
    description: string;
    type: ISSUE_TYPE;
    status: ISSUE_STATUS;
    reporter_id: number;
    created_at: string;
    updated_at: string;
    reporter?: IssueReporter | null;
}

export type IssueWithReporter = IssueRecord;
