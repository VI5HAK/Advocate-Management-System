import pool from "../config/db.js";

const activeCondition = (alias = "") =>
  `(${alias}Client_Delete_Flag = FALSE OR ${alias}Client_Delete_Flag = 0)`;

const CLIENT_COLUMNS = `
  c.Client_ID AS id,
  c.Client_Clnt_Type_ID AS clientTypeId,
  ct.Client_Type_Name AS clientTypeName,
  c.Client_Name AS name,
  c.Client_Address AS address,
  c.state_code AS stateCode,
  c.district_code AS districtCode,
  c.taluk_code AS talukCode,
  c.Client_Pin_Code AS Pincode,
  c.Client_Cnt_Num AS contactNumber,
  c.Client_Alt_Cnt_Num AS alternateContactNumber,
  c.Client_Email_ID AS emailId,
  c.Client_GST_Num AS gstNumber,
  c.Client_PAN_Num AS panNumber,
  c.Client_Aadhaar_Num AS aadhaarNumber,
  c.Client_Contact_Person AS contactPerson
`;

const INSERT_COLUMNS = `
  Client_Clnt_Type_ID,
  Client_Name,
  Client_Address,
  state_code,
  district_code,
  taluk_code,
  Client_Pin_Code,
  Client_Cnt_Num,
  Client_Alt_Cnt_Num,
  Client_Email_ID,
  Client_GST_Num,
  Client_PAN_Num,
  Client_Aadhaar_Num,
  Client_Contact_Person
`;

function clientValues(c) {
  return [
    c.clientTypeId,
    c.name,
    c.address,
    c.stateCode,
    c.districtCode,
    c.talukCode,
    c.pinCode,
    c.contactNumber,
    c.alternateContactNumber,
    c.emailId,
    c.gstNumber,
    c.panNumber,
    c.aadhaarNumber,
    c.contactPerson,
  ];
}

export async function getById(id) {
  const [rows] = await pool.query(
    `SELECT ${CLIENT_COLUMNS}
     FROM Client_Master c
     INNER JOIN Client_Type_Master ct ON c.Client_Clnt_Type_ID = ct.Client_Type_ID
     WHERE c.Client_ID = ?
       AND ${activeCondition("c.")}`,
    [id]
  );
  return rows[0] || null;
}

export async function create(clientData) {
  const [result] = await pool.query(
    `INSERT INTO Client_Master (
      ${INSERT_COLUMNS},
      Client_Created_Date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    clientValues(clientData)
  );
  return result.insertId;
}

export async function update(id, clientData) {
  const sql = `UPDATE Client_Master SET
      Client_Clnt_Type_ID = ?,
      Client_Name = ?,
      Client_Address = ?,
      state_code = ?,
      district_code = ?,
      taluk_code = ?,
      Client_Pin_Code = ?,
      Client_Cnt_Num = ?,
      Client_Alt_Cnt_Num = ?,
      Client_Email_ID = ?,
      Client_GST_Num = ?,
      Client_PAN_Num = ?,
      Client_Aadhaar_Num = ?,
      Client_Contact_Person = ?,
      Client_Modified_Date = CURDATE()
      WHERE Client_ID = ? AND ${activeCondition()}`;
  
  const params = [...clientValues(clientData), id];
  const [result] = await pool.query(sql, params);
  return result.affectedRows;
}

export async function list(search) {
  let sql = `
    SELECT
      c.Client_ID AS id,
      c.Client_Name AS clientName,
      ct.Client_Type_Name AS clientType,
      c.Client_Cnt_Num AS contactNumber,
      c.Client_Email_ID AS emailId,
      c.Client_Contact_Person AS contactPerson
    FROM Client_Master c
    INNER JOIN Client_Type_Master ct ON c.Client_Clnt_Type_ID = ct.Client_Type_ID
    WHERE ${activeCondition("c.")}
  `;
  const params = [];

  if (search) {
    sql += ` AND (
      c.Client_Name LIKE ?
      OR ct.Client_Type_Name LIKE ?
      OR CAST(c.Client_Cnt_Num AS CHAR) LIKE ?
      OR COALESCE(c.Client_Email_ID, '') LIKE ?
      OR COALESCE(c.Client_Contact_Person, '') LIKE ?
    )`;
    const term = `%${search}%`;
    params.push(...Array(5).fill(term));
  }

  sql += " ORDER BY c.Client_Name ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function checkAssignedCases(id) {
  const [rows] = await pool.query(
    `SELECT 1 FROM Appointment a
     INNER JOIN Case_Master c ON a.Appoint_Case_ID = c.Case_ID
     WHERE a.Appoint_Client_ID = ?
       AND (a.Appoint_Delete_Flag = FALSE OR a.Appoint_Delete_Flag = 0)
       AND (c.Case_Delete_Flag = FALSE OR c.Case_Delete_Flag = 0)
     LIMIT 1`,
    [id]
  );
  return rows.length > 0;
}

export async function deleteById(id) {
  const [result] = await pool.query(
    `UPDATE Client_Master
     SET Client_Delete_Flag = TRUE
     WHERE Client_ID = ?
       AND ${activeCondition()}`,
    [id]
  );
  return result.affectedRows;
}
