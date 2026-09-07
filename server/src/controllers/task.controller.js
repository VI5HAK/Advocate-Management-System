import taskService from "../services/task.service.js";
import fs from "fs";
import path from "path";

export async function getTasks(req, res, next) {
  try {
    const search = req.query.search || "";
    const tasks = await taskService.getAllTasks(search);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function getCompletedTasks(req, res, next) {
  try {
    const search = req.query.search || "";
    const tasks = await taskService.getCompletedTasks(search);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(req, res, next) {
  try {
    const { id } = req.params;
    const task = await taskService.getTaskById(id);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const userId = req.user.id;
    const task = await taskService.createTask(req.body, userId);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const task = await taskService.updateTask(id, req.body, userId);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await taskService.deleteTask(id, userId);
    res.json({ message: "Task deleted successfully." });
  } catch (err) {
    next(err);
  }
}

// Remarks Controllers
export async function getTaskRemarks(req, res, next) {
  try {
    const { id } = req.params;
    const remarks = await taskService.getTaskRemarks(id);
    res.json(remarks);
  } catch (err) {
    next(err);
  }
}

export async function addTaskRemark(req, res, next) {
  try {
    const { id } = req.params;
    const { remarkText } = req.body;
    const remarks = await taskService.addRemark(id, remarkText, req.user);
    res.status(201).json(remarks);
  } catch (err) {
    next(err);
  }
}

// Files Controllers
export async function getTaskFiles(req, res, next) {
  try {
    const { id } = req.params;
    const files = await taskService.getTaskFiles(id);
    res.json(files);
  } catch (err) {
    next(err);
  }
}

export async function uploadTaskFile(req, res, next) {
  try {
    const { id } = req.params;
    const files = await taskService.uploadTaskFile(id, req.file, req.user);
    res.status(201).json(files);
  } catch (err) {
    next(err);
  }
}

export async function deleteTaskFile(req, res, next) {
  try {
    const { fileId } = req.params;
    const remainingFiles = await taskService.deleteTaskFile(fileId);
    res.json(remainingFiles);
  } catch (err) {
    next(err);
  }
}

export async function downloadTaskFile(req, res, next) {
  try {
    const { fileId } = req.params;
    const fileRecord = await taskService.getTaskFileRecord(fileId);
    const relativePath = fileRecord.fileUrl.replace(/^\//, "");
    const fullPath = path.resolve(process.cwd(), relativePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: "File missing on server." });
    }
    res.download(fullPath, fileRecord.fileName);
  } catch (err) {
    next(err);
  }
}
