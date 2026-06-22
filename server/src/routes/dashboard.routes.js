import { Router } from "express";
import { getSummary } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.get("/summary", authenticate, requireAdmin, getSummary);

export default router;
