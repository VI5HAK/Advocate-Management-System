import pool from "../config/db.js";

const activeCondition = (alias = "") =>
  `(${alias}Advocate_Delete_Flag = FALSE OR ${alias}Advocate_Delete_Flag = 0)`;

const ADVOCATE_COLUMNS = `
  a.Advocate_ID AS id,
  a.Advocate_Role_ID AS roleId,
  a.Advocate_Name AS name,
  a.Advocate_Address AS address,
  a.State_ID AS State_ID,
  a.District_ID AS District_ID,
  a.Taluk_ID AS Taluk_ID,
  a.Advocate_Pin_Code AS Pincode,
  a.Advocate_Cnt_Num AS contactNumber,
  a.Advocate_Alt_Cnt_Num AS alternateContactNumber,
  a.Advocate_Email_ID AS emailId,
  a.Advocate_PAN_Num AS panNumber,
  a.Advocate_Aadhaar_Num AS aadhaarNumber
`;

const INSERT_COLUMNS = `
  Advocate_Role_ID,
  Advocate_Name,
  Advocate_Address,
  State_ID,
  District_ID,
  Taluk_ID,
  Advocate_Pin_Code,
  Advocate_Cnt_Num,
  Advocate_Alt_Cnt_Num,
  Advocate_Email_ID,
  Advocate_PAN_Num,
  Advocate_Aadhaar_Num
`;

const buildUpdateQuery = (includePassword = false) => `
  UPDATE Advocate_Master SET
      Advocate_Role_ID = ?,
      Advocate_Name = ?,
      Advocate_Address = ?,
      State_ID = ?,
      District_ID = ?,
      Taluk_ID = ?,
      Advocate_Pin_Code = ?,
      Advocate_Cnt_Num = ?,
      Advocate_Alt_Cnt_Num = ?,
      Advocate_Email_ID = ?,
      Advocate_PAN_Num = ?,
      Advocate_Aadhaar_Num = ?
      ${includePassword ? ", Advocate_PWD = ?" : ""}
      , Advocate_Modified_Date = CURDATE()
  WHERE Advocate_ID = ?
    AND ${activeCondition()}
`;

function advocateValues(a) {
  return [
    a.roleId,
    a.name,
    a.address,
    a.State_ID,
    a.District_ID,
    a.Taluk_ID,
    a.pinCode,
    a.contactNumber,
    a.alternateContactNumber,
    a.emailId,
    a.panNumber,
    a.aadhaarNumber,
  ];
}

export async function getById(id) {
  const [rows] = await pool.query(
    `SELECT ${ADVOCATE_COLUMNS}
     FROM Advocate_Master a
     WHERE a.Advocate_ID = ?
       AND ${activeCondition("a.")}`,
    [id]
  );
  return rows[0] || null;
}

export async function create(advocateData, passwordHash) {
  const [result] = await pool.query(
    `INSERT INTO Advocate_Master (
      ${INSERT_COLUMNS},
      Advocate_PWD,
      Advocate_Created_Date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [...advocateValues(advocateData), passwordHash]
  );
  return result.insertId;
}

export async function updateBasic(id, advocateData) {
  const [result] = await pool.query(
    buildUpdateQuery(false),
    [...advocateValues(advocateData), id]
  );
  return result.affectedRows;
}

export async function updateWithPassword(id, advocateData, passwordHash) {
  const [result] = await pool.query(
    buildUpdateQuery(true),
    [...advocateValues(advocateData), passwordHash, id]
  );
  return result.affectedRows;
}

export async function list(search) {
  let sql = `
    SELECT
      a.Advocate_ID AS id,
      a.Advocate_Name AS advocateName,
      r.Role_Name AS roleName,
      a.Advocate_Cnt_Num AS contactNumber,
      a.Advocate_Email_ID AS emailId
    FROM Advocate_Master a
    INNER JOIN Role_Master r ON a.Advocate_Role_ID = r.Role_ID
    WHERE ${activeCondition("a.")}
  `;
  const params = [];

  if (search) {
    sql += ` AND (
      a.Advocate_Name LIKE ?
      OR r.Role_Name LIKE ?
      OR CAST(a.Advocate_Cnt_Num AS CHAR) LIKE ?
      OR COALESCE(a.Advocate_Email_ID, '') LIKE ?
    )`;
    const term = `%${search}%`;
    params.push(...Array(4).fill(term));
  }

  sql += " ORDER BY a.Advocate_Name ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function checkAssignedCases(id) {
  const [rows] = await pool.query(
    `SELECT 1 FROM (
      SELECT Case_ID FROM Case_Master
      WHERE Case_Advocate_ID = ?
        AND (Case_Delete_Flag = FALSE OR Case_Delete_Flag = 0)
      UNION ALL
      SELECT a.Appoint_ID FROM Appointment a
      LEFT JOIN Case_Master c ON a.Appoint_Case_ID = c.Case_ID
      WHERE a.Appoint_Advocate_ID = ?
        AND (a.Appoint_Delete_Flag = FALSE OR a.Appoint_Delete_Flag = 0)
        AND (c.Case_ID IS NULL OR c.Case_Delete_Flag = FALSE OR c.Case_Delete_Flag = 0)
    ) AS assigned_cases
    LIMIT 1`,
    [id, id]
  );
  return rows.length > 0;
}

export async function deleteById(id) {
  const [result] = await pool.query(
    `UPDATE Advocate_Master
     SET Advocate_Delete_Flag = TRUE
     WHERE Advocate_ID = ?
       AND ${activeCondition()}`,
    [id]
  );
  return result.affectedRows;
}
