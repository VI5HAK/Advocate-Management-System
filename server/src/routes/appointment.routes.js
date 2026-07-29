import { Router } from "express";
import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  listAppointments,
  updateAppointment,
  getAppointmentRemarks,
  addAppointmentRemark,
  getAppointmentReport,
  getClientReport,
  getCaseReport,
} from "../controllers/appointment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/report", requireAdmin, getAppointmentReport);
router.get("/client-report", requireAdmin, getClientReport);
router.get("/case-report", requireAdmin, getCaseReport);
router.get("/", listAppointments);
router.post("/", requireAdmin, createAppointment);
router.get("/:id", getAppointment);
router.put("/:id", requireAdmin, updateAppointment);
router.delete("/:id", requireAdmin, deleteAppointment);
router.get("/:appointmentId/remarks", getAppointmentRemarks);
router.post("/:appointmentId/remarks", addAppointmentRemark);

export default router;
