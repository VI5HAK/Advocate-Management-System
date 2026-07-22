import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import advocateRoutes from "./advocate.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import authRoutes from "./auth.routes.js";
import caseRoutes from "./case.routes.js";
import clientRoutes from "./client.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import mastersRoutes from "./masters.routes.js";
import locationRoutes from "./location.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admins", adminRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/masters", mastersRoutes);
router.use("/advocates", advocateRoutes);
router.use("/clients", clientRoutes);
router.use("/cases", caseRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/locations", locationRoutes);

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
