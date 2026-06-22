import pool from "../config/db.js";

const ENTITY_COUNTS = [
  { key: "advocates", table: "Advocate_Master", deleteFlag: "Advocate_Delete_Flag" },
  { key: "clients", table: "Client_Master", deleteFlag: "Client_Delete_Flag" },
  { key: "cases", table: "Case_Master", deleteFlag: "Case_Delete_Flag" },
  { key: "appointments", table: "Appointment", deleteFlag: "Appoint_Delete_Flag" },
];

export async function getSummary(req, res, next) {
  try {
    const counts = {};

    for (const { key, table, deleteFlag } of ENTITY_COUNTS) {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS count
         FROM ${table}
         WHERE ${deleteFlag} = FALSE OR ${deleteFlag} = 0`,
      );
      counts[key] = rows[0].count;
    }

    res.json({ counts });
  } catch (err) {
    next(err);
  }
}
