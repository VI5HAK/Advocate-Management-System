import { Router } from "express";
import {
  createAdmin,
  deleteAdmin,
  listAdmins,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/", listAdmins);
router.post("/", createAdmin);
router.delete("/:id", deleteAdmin);

export default router;
