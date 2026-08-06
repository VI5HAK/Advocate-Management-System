import { Router } from "express";
import {
  createHearing,
  deleteHearing,
  getHearing,
  listHearings,
  listCompletedHearings,
  updateHearing,
  getHearingNotes,
  addHearingNote
} from "../controllers/hearing.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", listHearings);
router.post("/", requireAdmin, createHearing);
router.get("/completed", listCompletedHearings);
router.get("/:id", getHearing);
router.put("/:id", requireAdmin, updateHearing);
router.delete("/:id", requireAdmin, deleteHearing);
router.get("/:hearingId/notes", getHearingNotes);
router.post("/:hearingId/notes", addHearingNote);

export default router;
