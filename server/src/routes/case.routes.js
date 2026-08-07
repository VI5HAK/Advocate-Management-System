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

router.use(authenticate);
router.get("/", listCases);
router.post("/", requireAdmin, createCase);
router.get("/:id", getCase);
router.put("/:id", requireAdmin, updateCase);
router.delete("/:id", requireAdmin, deleteCase);

export default router;
