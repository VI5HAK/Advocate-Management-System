import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pool from "./config/db.js";
import { errorHandler } from "./middleware/error.middleware.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000"
];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/+$/, ""));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      const sanitizedOrigin = origin.replace(/\/+$/, "");
      const isAllowed =
        allowedOrigins.includes(sanitizedOrigin) ||
        sanitizedOrigin.endsWith(".vercel.app") ||
        /^http:\/\/localhost:\d+$/.test(sanitizedOrigin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

// Prevent browser caching of API responses
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use("/api", routes);

app.use(errorHandler);

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to MySQL database.");
  } catch (err) {
    console.error(
      "Could not connect to MySQL. Run `npm run db:init` after starting MySQL.",
    );
    console.error(err.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
}

start();
