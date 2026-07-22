import { Router } from "express";
import { getStates, getDistricts, getTaluks } from "../controllers/location.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/states", getStates);
router.get("/districts", getDistricts);
router.get("/taluks", getTaluks);

export default router;
