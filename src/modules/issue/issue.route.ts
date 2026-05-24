import { Router } from "express";
import auth from "../../middleware/auth";
import { issueController } from "./issue.controller";
import { USER_ROLE } from "../../types";

const router = Router();

router.post("/", auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.agent), issueController.createIssue);

export const issueRoute = router;