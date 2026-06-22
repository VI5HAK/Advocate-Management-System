import { Router } from "express";
import {
  createAdvocate,
  deleteAdvocate,
  getAdvocate,
  listAdvocates,
  updateAdvocate,
} from "../controllers/advocate.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/", listAdvocates);
router.post("/", createAdvocate);
router.get("/:id", getAdvocate);
router.put("/:id", updateAdvocate);
router.delete("/:id", deleteAdvocate);

export default router;
