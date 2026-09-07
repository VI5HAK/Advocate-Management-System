import taskRepository from "../repositories/task.repository.js";
import fs from "fs";
import path from "path";

export const taskService = {
  async getAllTasks(search) {
    return await taskRepository.findAll(search);
  },

  async getCompletedTasks(search) {
    return await taskRepository.findCompleted(search);
  },

  async getTaskById(id) {
    const task = await taskRepository.findById(id);
    if (!task) {
      const error = new Error("Task not found.");
      error.statusCode = 404;
      throw error;
    }
    return task;
  },

  async createTask(data, userId) {
    if (!data.name || !data.name.trim()) {
      const error = new Error("Task Name is required.");
      error.statusCode = 400;
      throw error;
    }
    if (!data.catId) {
      const error = new Error("Task Category is required.");
      error.statusCode = 400;
      throw error;
    }
    if (!data.advocateId) {
      const error = new Error("Advocate is required.");
      error.statusCode = 400;
      throw error;
    }
    if (!data.statusId) {
      const error = new Error("Task Status is required.");
      error.statusCode = 400;
      throw error;
    }
    if (!data.startDate) {
      const error = new Error("Task Start Date is required.");
      error.statusCode = 400;
      throw error;
    }

    const statusName = await taskRepository.getStatusNameById(data.statusId);
    data.completeFlag = Boolean(statusName && statusName.trim().toUpperCase() === "COMPLETED");

    const taskId = await taskRepository.create(data, userId);
    return await taskRepository.findById(taskId);
  },

  async updateTask(id, data, userId) {
    await this.getTaskById(id); // Ensure task exists

    if (!data.name || !data.name.trim()) {
      const error = new Error("Task Name is required.");
      error.statusCode = 400;
      throw error;
    }
    if (!data.catId) {
      const error = new Error("Task Category is required.");
      error.statusCode = 400;
      throw error;
    }
    if (!data.advocateId) {
      const error = new Error("Advocate is required.");
      error.statusCode = 400;
      throw error;
    }
    if (!data.statusId) {
      const error = new Error("Task Status is required.");
      error.statusCode = 400;
      throw error;
    }
    if (!data.startDate) {
      const error = new Error("Task Start Date is required.");
      error.statusCode = 400;
      throw error;
    }

    const statusName = await taskRepository.getStatusNameById(data.statusId);
    data.completeFlag = Boolean(statusName && statusName.trim().toUpperCase() === "COMPLETED");

    await taskRepository.update(id, data, userId);
    return await taskRepository.findById(id);
  },

  async deleteTask(id, userId) {
    await this.getTaskById(id);
    return await taskRepository.softDelete(id, userId);
  },

  // Remarks
  async getTaskRemarks(taskId) {
    await this.getTaskById(taskId);
    return await taskRepository.getRemarksByTaskId(taskId);
  },

  async addRemark(taskId, remarkText, user) {
    await this.getTaskById(taskId);

    if (!remarkText || !remarkText.trim()) {
      const error = new Error("Remark text cannot be empty.");
      error.statusCode = 400;
      throw error;
    }

    const userId = user.role === "admin" ? user.id : null;
    const advocateId = user.role === "advocate" ? (user.advocateId || user.id) : null;
    const role = user.role;

    await taskRepository.addRemark({
      taskId,
      remarkText: remarkText.trim(),
      userId,
      advocateId,
      role,
    });

    return await taskRepository.getRemarksByTaskId(taskId);
  },

  // Files
  async getTaskFiles(taskId) {
    await this.getTaskById(taskId);
    return await taskRepository.getFilesByTaskId(taskId);
  },

  async uploadTaskFile(taskId, file, user) {
    await this.getTaskById(taskId);

    if (!file) {
      const error = new Error("No file uploaded.");
      error.statusCode = 400;
      throw error;
    }

    const fileUrl = `/uploads/tasks/task_${taskId}/${file.filename}`;
    const userId = user.role === "admin" ? user.id : null;
    const advocateId = user.role === "advocate" ? (user.advocateId || user.id) : null;
    const role = user.role;

    await taskRepository.addFile({
      taskId,
      fileName: file.originalname,
      fileUrl,
      userId,
      advocateId,
      role,
    });

    return await taskRepository.getFilesByTaskId(taskId);
  },

  async deleteTaskFile(fileId) {
    const fileRecord = await taskRepository.getFileById(fileId);
    if (!fileRecord) {
      const error = new Error("File not found.");
      error.statusCode = 404;
      throw error;
    }

    // Physical file deletion
    if (fileRecord.fileUrl) {
      const relativePath = fileRecord.fileUrl.replace(/^\//, "");
      const fullPath = path.resolve(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          console.error("Failed to delete physical file:", err);
        }
      }
    }

    await taskRepository.deleteFile(fileId);
    return await taskRepository.getFilesByTaskId(fileRecord.taskId);
  },

  async getTaskFileRecord(fileId) {
    const fileRecord = await taskRepository.getFileById(fileId);
    if (!fileRecord) {
      const error = new Error("File not found.");
      error.statusCode = 404;
      throw error;
    }
    return fileRecord;
  },
};

export default taskService;
