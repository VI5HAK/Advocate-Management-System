import pool from "../config/db.js";

export async function exists(roleId) {
  const [roles] = await pool.query(
    `SELECT Role_ID FROM Role_Master
     WHERE Role_ID = ?
       AND (Role_Delete_Flag = FALSE OR Role_Delete_Flag = 0)`,
    [roleId]
  );
  return roles.length > 0;
}
