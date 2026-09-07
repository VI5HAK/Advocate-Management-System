import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const taskId = req.params.id || req.body.taskId || "temp";
    const dir = path.resolve(process.cwd(), `uploads/tasks/task_${taskId}`);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    cb(null, uniqueName);
  },
});

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max file size
  },
});

export const uploadTaskFileMiddleware = {
  single: (fieldName) => (req, res, next) => {
    multerUpload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE" || (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE")) {
          return res.status(400).json({
            message: "File size is too large and cannot be over 50mb",
          });
        }
        return res.status(400).json({
          message: err.message || "File upload failed.",
        });
      }
      next();
    });
  },
};
