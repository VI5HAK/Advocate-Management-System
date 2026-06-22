import { Router } from "express";
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  updateClient,
} from "../controllers/client.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/", listClients);
router.post("/", createClient);
router.get("/:id", getClient);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;
