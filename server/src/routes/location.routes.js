import { Router } from "express";
import {
  getStates,
  getDistricts,
  getTaluks,
  createState,
  updateState,
  deleteState,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  createTaluk,
  updateTaluk,
  deleteTaluk,
} from "../controllers/location.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/states", getStates);
router.post("/states", createState);
router.put("/states/:code", updateState);
router.delete("/states/:code", deleteState);

router.get("/districts", getDistricts);
router.post("/districts", createDistrict);
router.put("/districts/:code", updateDistrict);
router.delete("/districts/:code", deleteDistrict);

router.get("/taluks", getTaluks);
router.post("/taluks", createTaluk);
router.put("/taluks/:code", updateTaluk);
router.delete("/taluks/:code", deleteTaluk);

export default router;
