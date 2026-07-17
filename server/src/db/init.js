import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { MASTER_CONFIG } from "../config/masters.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEED_DATA = {
  roles: ["Junior Lawyer", "Senior Lawyer", "ParaLegal"],
  "client-types": ["Individual", "Corporate", "Government"],
  "case-types": ["Civil", "Criminal", "Family"],
  districts: ["Pune", "Solapur", "Kolhapur", "Mumbai"],
};

async function seedMaster(connection, resourceKey, names) {
  const { table, nameColumn } = MASTER_CONFIG[resourceKey];

  for (const name of names) {
    await connection.query(
      `INSERT IGNORE INTO ${table} (${nameColumn}) VALUES (?)`,
      [name],
    );
  }
}

async function run() {
  const dbName = process.env.DB_NAME || "ams";

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  // Create database dynamically
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  // Switch to the target database before running schema
  await connection.changeUser({ database: dbName });

  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await connection.query(schema);

  const passwordHash = await bcrypt.hash("test123", 10);
  await connection.query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       full_name = VALUES(full_name)`,
    ["test@gmail.com", passwordHash, "Test User"],
  );

  for (const [resourceKey, names] of Object.entries(SEED_DATA)) {
    await seedMaster(connection, resourceKey, names);
  }

  await connection.end();
  console.log("Database initialized successfully.");
}

run().catch((err) => {
  console.error("Database initialization failed:", err.message);
  process.exit(1);
});
