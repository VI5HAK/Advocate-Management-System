import pool from "../config/db.js";

export async function getById(id) {
  const [rows] = await pool.query(
    `SELECT Client_Type_ID AS id, Client_Type_Name AS name
     FROM Client_Type_Master
     WHERE Client_Type_ID = ?
       AND (Client_Type_Delete_Flag = FALSE OR Client_Type_Delete_Flag = 0)`,
    [id]
  );
  return rows[0] || null;
}
