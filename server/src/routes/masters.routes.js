import { Router } from "express";
import {
  createMaster,
  deleteMaster,
  listMasters,
  updateMaster,
} from "../controllers/masters.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/:resource", listMasters);
router.post("/:resource", createMaster);
router.put("/:resource/:id", updateMaster);
router.delete("/:resource/:id", deleteMaster);

export default router;
