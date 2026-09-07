import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import { uploadTaskFileMiddleware } from "../middleware/upload.middleware.js";
import {
  getTasks,
  getCompletedTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskRemarks,
  addTaskRemark,
  getTaskFiles,
  uploadTaskFile,
  deleteTaskFile,
  downloadTaskFile,
} from "../controllers/task.controller.js";

const router = Router();

// Protect all task routes with authentication
router.use(authenticate);

// Task CRUD
router.get("/", getTasks);
router.get("/completed", getCompletedTasks);
router.get("/:id", getTaskById);

router.post("/", requireAdmin, createTask);
router.put("/:id", requireAdmin, updateTask);
router.delete("/:id", requireAdmin, deleteTask);

// Task Remarks (Admin & Advocate)
router.get("/:id/remarks", getTaskRemarks);
router.post("/:id/remarks", addTaskRemark);

// Task Files (Admin & Advocate)
router.get("/:id/files", getTaskFiles);
router.get("/:id/files/:fileId/download", downloadTaskFile);
router.post("/:id/files", uploadTaskFileMiddleware.single("file"), uploadTaskFile);
router.delete("/:id/files/:fileId", deleteTaskFile);

export default router;
