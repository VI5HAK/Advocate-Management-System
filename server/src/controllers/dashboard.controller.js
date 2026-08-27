import pool from "../config/db.js";

const ENTITY_COUNTS = [
  {
    key: "advocates",
    table: "Advocate_Master",
    deleteFlag: "Advocate_Delete_Flag",
  },
  { key: "clients", table: "Client_Master", deleteFlag: "Client_Delete_Flag" },
  { key: "cases", table: "Case_Master", deleteFlag: "Case_Delete_Flag" },
  {
    key: "appointments",
    table: "Appointment",
    deleteFlag: "Appoint_Delete_Flag",
  },
  {
    key: "hearings",
    table: "HEARING_MASTER",
    deleteFlag: "Hearing_Delete_Flag",
  },
];

export async function getSummary(req, res, next) {
  try {
    const counts = {};

    for (const { key, table, deleteFlag } of ENTITY_COUNTS) {
      let sql;
      if (key === "appointments") {
        sql = `
          SELECT COUNT(*) AS count
          FROM Appointment ap
          INNER JOIN Client_Master cl ON ap.Appoint_Client_ID = cl.Client_ID
          LEFT JOIN Case_Master cs ON ap.Appoint_Case_ID = cs.Case_ID
          WHERE (ap.Appoint_Delete_Flag = FALSE OR ap.Appoint_Delete_Flag = 0)
            AND (cl.Client_Delete_Flag = FALSE OR cl.Client_Delete_Flag = 0)
            AND (cs.Case_ID IS NULL OR cs.Case_Delete_Flag = FALSE OR cs.Case_Delete_Flag = 0)
            AND TIMESTAMP(ap.Appoint_Date, ap.Appoint_Start_Time) + INTERVAL 15 MINUTE > NOW()
        `;
      } else if (key === "hearings") {
        sql = `
          SELECT COUNT(*) AS count
          FROM HEARING_MASTER hm
          WHERE (hm.Hearing_Delete_Flag = FALSE OR hm.Hearing_Delete_Flag = 0)
            AND hm.Hearing_Date >= CURDATE()
        `;
      } else {
        sql = `
          SELECT COUNT(*) AS count
          FROM ${table}
          WHERE ${deleteFlag} = FALSE OR ${deleteFlag} = 0
        `;
      }
      const [rows] = await pool.query(sql);
      counts[key] = rows[0].count;
    }

    res.json({ counts });
  } catch (err) {
    next(err);
  }
}
