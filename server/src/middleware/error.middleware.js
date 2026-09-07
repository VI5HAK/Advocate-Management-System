export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File size is too large and cannot be over 50mb",
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal server error.",
  });
}
