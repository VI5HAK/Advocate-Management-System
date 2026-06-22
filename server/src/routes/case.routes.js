import { Router } from "express";
import {
  createCase,
  deleteCase,
  getCase,
  listCases,
  updateCase,
} from "../controllers/case.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/", listCases);
router.post("/", createCase);
router.get("/:id", getCase);
router.put("/:id", updateCase);
router.delete("/:id", deleteCase);

export default router;
