import pool from "../config/db.js";
const SYSTEM_CASE_LINK = "SYSTEM_CASE_LINK";

function trimOrNull(value) {
  const s = value?.trim();
  return s || null;
}

function parseOptionalDate(value) {
  const s = value?.trim();
  return s ? s : null;
}

async function assertExists({ table, idColumn, deleteFlagColumn, idValue }) {
  const [rows] = await pool.query(
    `SELECT ${idColumn} AS id
     FROM ${table}
     WHERE ${idColumn} = ?
       AND (${deleteFlagColumn} = FALSE OR ${deleteFlagColumn} = 0)`,
    [idValue],
  );
  return rows.length > 0;
}

async function parseCaseBody(body) {
  const caseNumber = body.caseNumber?.trim();
  const caseTypeId = Number.parseInt(body.caseTypeId, 10);
  const courtId = Number.parseInt(body.courtId, 10);

  let clientIds = [];
  if (Array.isArray(body.clientIds)) {
    clientIds = body.clientIds.map(id => Number.parseInt(id, 10)).filter(id => !Number.isNaN(id));
  } else if (body.clientId) {
    clientIds = [Number.parseInt(body.clientId, 10)];
  }

  let advocateIds = [];
  if (Array.isArray(body.advocateIds)) {
    advocateIds = body.advocateIds.map(id => Number.parseInt(id, 10)).filter(id => !Number.isNaN(id));
  } else if (body.advocateId) {
    advocateIds = [Number.parseInt(body.advocateId, 10)];
  }

  if (clientIds.length === 0) {
    return { error: "At least one client must be selected." };
  }
  if (!caseNumber) {
    return { error: "Case number is required." };
  }
  if (!caseTypeId || Number.isNaN(caseTypeId)) {
    return { error: "Case type is required." };
  }
  if (!courtId || Number.isNaN(courtId)) {
    return { error: "Court name is required." };
  }
  if (advocateIds.length === 0) {
    return { error: "At least one advocate must be selected." };
  }

  for (const cId of clientIds) {
    const ok = await assertExists({
      table: "Client_Master",
      idColumn: "Client_ID",
      deleteFlagColumn: "Client_Delete_Flag",
      idValue: cId,
    });
    if (!ok) return { error: `Invalid client selected.` };
  }

  for (const aId of advocateIds) {
    const ok = await assertExists({
      table: "Advocate_Master",
      idColumn: "Advocate_ID",
      deleteFlagColumn: "Advocate_Delete_Flag",
      idValue: aId,
    });
    if (!ok) return { error: `Invalid advocate selected.` };
  }

  const okCaseType = await assertExists({
    table: "Case_Type_Master",
    idColumn: "Case_Type_ID",
    deleteFlagColumn: "Case_Type_Delete_Flag",
    idValue: caseTypeId,
  });
  if (!okCaseType) return { error: "Invalid case type selected." };

  const okCourt = await assertExists({
    table: "Court_Master",
    idColumn: "Court_ID",
    deleteFlagColumn: "Court_Delete_Flag",
    idValue: courtId,
  });
  if (!okCourt) return { error: "Invalid court selected." };

  const petitionerAdvocate = body.petitionerAdvocate?.trim();
  const respondentAdvocate = body.respondentAdvocate?.trim();
  const filingNum = body.filingNum?.trim();
  const regNum = body.regNum?.trim();
  const cnrNum = body.cnrNum?.trim();
  const efilingNum = body.efilingNum?.trim();

  const alphaSpaceRegex = /^[A-Z ]+$/;
  const alphaNumRegex = /^[A-Z0-9]+$/;
  const alphaNumSpaceRegex = /^[A-Z0-9 \/\\-]+$/;

  if (!petitionerAdvocate || !alphaSpaceRegex.test(petitionerAdvocate)) {
    return { error: "Petitioner advocate is required and must contain only uppercase alphabets and spaces." };
  }
  if (!respondentAdvocate || !alphaSpaceRegex.test(respondentAdvocate)) {
    return { error: "Respondent advocate is required and must contain only uppercase alphabets and spaces." };
  }
  if (!filingNum || !alphaNumSpaceRegex.test(filingNum)) {
    return { error: "Filing number is required and must contain only uppercase alphabets, numbers, spaces, and /, \\, - characters." };
  }
  if (!regNum || !alphaNumSpaceRegex.test(regNum)) {
    return { error: "Registration number is required and must contain only uppercase alphabets, numbers, spaces, and /, \\, - characters." };
  }
  if (!cnrNum || cnrNum.length !== 16 || !alphaNumRegex.test(cnrNum)) {
    return { error: "CNR number is required and must be exactly 16 uppercase alphabets and numbers." };
  }
  if (efilingNum && !alphaNumSpaceRegex.test(efilingNum)) {
    return { error: "E-filing number must contain only uppercase alphabets, numbers, spaces, and /, \\, - characters." };
  }

  return {
    clientIds,
    advocateIds,
    caseValues: [
      caseNumber,
      caseTypeId,
      courtId,
      trimOrNull(body.petitioner),
      trimOrNull(body.petitionerAdvocate),
      trimOrNull(body.respondent),
      trimOrNull(body.respondentAdvocate),
      parseOptionalDate(body.filingDate),
      trimOrNull(body.filingNum),
      parseOptionalDate(body.regDate),
      trimOrNull(body.regNum),
      trimOrNull(body.cnrNum),
      parseOptionalDate(body.efilingDate),
      trimOrNull(body.efilingNum),
      trimOrNull(body.courtName),
    ],
  };
}

const CASE_SELECT = `
  SELECT
    cs.Case_ID AS id,
    cs.Case_Num AS caseNumber,
    cs.Case_Case_Type_ID AS caseTypeId,
    ct.Case_Type_Name AS caseTypeName,
    cs.Case_Court_ID AS courtId,
    cs.Case_Petitioner AS petitioner,
    cs.Case_Petitioner_Advocate AS petitionerAdvocate,
    cs.Case_Respodent AS respondent,
    cs.Case_Respondent_Advocate AS respondentAdvocate,
    DATE_FORMAT(cs.Case_Filing_Date, '%Y-%m-%d') AS filingDate,
    cs.Case_Filing_Num AS filingNum,
    DATE_FORMAT(cs.Case_Reg_Date, '%Y-%m-%d') AS regDate,
    cs.Case_Reg_Num AS regNum,
    cs.Case_CNR_Num AS cnrNum,
    DATE_FORMAT(cs.Case_Efiling_Date, '%Y-%m-%d') AS efilingDate,
    cs.Case_Efiling_Num AS efilingNum,
    cs.Case_Court_Name AS courtName,
    d.District_Name AS districtName
  FROM Case_Master cs
  LEFT JOIN Case_Type_Master ct ON cs.Case_Case_Type_ID = ct.Case_Type_ID
  LEFT JOIN Court_Master cm ON cs.Case_Court_ID = cm.Court_ID
  LEFT JOIN DISTRICTS d ON cm.District_ID = d.District_ID
  WHERE cs.Case_ID = ?
    AND (cs.Case_Delete_Flag = FALSE OR cs.Case_Delete_Flag = 0)
`;

export async function getCase(req, res, next) {
  try {
    const [rows] = await pool.query(CASE_SELECT, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Case not found." });
    }
    const mainCase = rows[0];

    const [clientRows] = await pool.query(
      `SELECT Client_ID AS clientId FROM Case_Clients WHERE Case_ID = ?`,
      [req.params.id]
    );

    const [advRows] = await pool.query(
      `SELECT Advocate_ID AS advocateId FROM Case_Advocates WHERE Case_ID = ?`,
      [req.params.id]
    );

    res.json({
      ...mainCase,
      clientIds: clientRows.map(r => r.clientId),
      advocateIds: advRows.map(r => r.advocateId),
    });
  } catch (err) {
    next(err);
  }
}

export async function createCase(req, res, next) {
  try {
    const parsed = await parseCaseBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const [result] = await pool.query(
      `INSERT INTO Case_Master (
        Case_Num,
        Case_Case_Type_ID,
        Case_Court_ID,
        Case_Petitioner,
        Case_Petitioner_Advocate,
        Case_Respodent,
        Case_Respondent_Advocate,
        Case_Filing_Date,
        Case_Filing_Num,
        Case_Reg_Date,
        Case_Reg_Num,
        Case_CNR_Num,
        Case_Efiling_Date,
        Case_Efiling_Num,
        Case_Court_Name,
        Case_Created_By,
        Case_Created_Date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [...parsed.caseValues, req.user?.id || null],
    );

    const caseId = result.insertId;

    for (const cId of parsed.clientIds) {
      await pool.query(
        `INSERT INTO Case_Clients (Case_ID, Client_ID) VALUES (?, ?)`,
        [caseId, cId]
      );
    }

    for (const aId of parsed.advocateIds) {
      await pool.query(
        `INSERT INTO Case_Advocates (Case_ID, Advocate_ID) VALUES (?, ?)`,
        [caseId, aId]
      );
    }

    res.status(201).json({ id: caseId, message: "Case created." });
  } catch (err) {
    next(err);
  }
}

export async function updateCase(req, res, next) {
  try {
    const parsed = await parseCaseBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const [updateResult] = await pool.query(
      `UPDATE Case_Master SET
        Case_Num = ?,
        Case_Case_Type_ID = ?,
        Case_Court_ID = ?,
        Case_Petitioner = ?,
        Case_Petitioner_Advocate = ?,
        Case_Respodent = ?,
        Case_Respondent_Advocate = ?,
        Case_Filing_Date = ?,
        Case_Filing_Num = ?,
        Case_Reg_Date = ?,
        Case_Reg_Num = ?,
        Case_CNR_Num = ?,
        Case_Efiling_Date = ?,
        Case_Efiling_Num = ?,
        Case_Court_Name = ?,
        Case_Modified_By = ?,
        Case_Modified_Date = CURDATE()
      WHERE Case_ID = ?
        AND (Case_Delete_Flag = FALSE OR Case_Delete_Flag = 0)`,
      [...parsed.caseValues, req.user?.id || null, req.params.id],
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Case not found." });
    }

    await pool.query(`DELETE FROM Case_Clients WHERE Case_ID = ?`, [req.params.id]);
    await pool.query(`DELETE FROM Case_Advocates WHERE Case_ID = ?`, [req.params.id]);

    for (const cId of parsed.clientIds) {
      await pool.query(
        `INSERT INTO Case_Clients (Case_ID, Client_ID) VALUES (?, ?)`,
        [req.params.id, cId]
      );
    }

    for (const aId of parsed.advocateIds) {
      await pool.query(
        `INSERT INTO Case_Advocates (Case_ID, Advocate_ID) VALUES (?, ?)`,
        [req.params.id, aId]
      );
    }

    res.json({ message: "Case updated." });
  } catch (err) {
    next(err);
  }
}

export async function listCases(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
    const filterClientId = req.query.clientId ? Number.parseInt(req.query.clientId, 10) : null;

    let sql = `
      SELECT
        cs.Case_ID AS id,
        cs.Case_Num AS caseNumber,
        cs.Case_Petitioner AS petitioner,
        cs.Case_Respodent AS respondent,
        cs.Case_Filing_Num AS filingNum,
        cs.Case_CNR_Num AS cnrNum,
        (
          SELECT GROUP_CONCAT(DISTINCT cl.Client_Name ORDER BY cl.Client_Name SEPARATOR ', ')
          FROM Case_Clients cc
          INNER JOIN Client_Master cl ON cc.Client_ID = cl.Client_ID
          WHERE cc.Case_ID = cs.Case_ID
            AND (cl.Client_Delete_Flag = FALSE OR cl.Client_Delete_Flag = 0)
        ) AS clientName,
        (
          SELECT COUNT(DISTINCT cc.Client_ID)
          FROM Case_Clients cc
          INNER JOIN Client_Master cl ON cc.Client_ID = cl.Client_ID
          WHERE cc.Case_ID = cs.Case_ID
            AND (cl.Client_Delete_Flag = FALSE OR cl.Client_Delete_Flag = 0)
        ) AS clientCount,
        (
          SELECT GROUP_CONCAT(DISTINCT adv.Advocate_Name ORDER BY adv.Advocate_Name SEPARATOR ', ')
          FROM Case_Advocates ca
          INNER JOIN Advocate_Master adv ON ca.Advocate_ID = adv.Advocate_ID
          WHERE ca.Case_ID = cs.Case_ID
            AND (adv.Advocate_Delete_Flag = FALSE OR adv.Advocate_Delete_Flag = 0)
        ) AS advocateName
      FROM Case_Master cs
    `;
    const params = [];
    const whereClauses = ["(cs.Case_Delete_Flag = FALSE OR cs.Case_Delete_Flag = 0)"];

    if (filterClientId && !Number.isNaN(filterClientId)) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM Case_Clients cc
        WHERE cc.Case_ID = cs.Case_ID
          AND cc.Client_ID = ?
      )`);
      params.push(filterClientId);
    }

    if (search) {
      whereClauses.push(`(
        cs.Case_Num LIKE ?
        OR COALESCE(cs.Case_Petitioner, '') LIKE ?
        OR COALESCE(cs.Case_Respodent, '') LIKE ?
        OR EXISTS (
          SELECT 1 
          FROM Case_Clients cc
          INNER JOIN Client_Master cl ON cc.Client_ID = cl.Client_ID
          WHERE cc.Case_ID = cs.Case_ID
            AND cl.Client_Name LIKE ?
            AND (cl.Client_Delete_Flag = FALSE OR cl.Client_Delete_Flag = 0)
        )
      )`);
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += " WHERE " + whereClauses.join(" AND ") + " ORDER BY cs.Case_Num ASC";

    const [rows] = await pool.query(sql, params);
    const rowsWithClient = rows.map((row) => {
      return {
        ...row,
        clientName: row.clientName ?? "—",
        clientCount: row.clientCount || 0,
        advocateName: row.advocateName ?? "—",
      };
    });

    res.json(rowsWithClient);
  } catch (err) {
    next(err);
  }
}

export async function deleteCase(req, res, next) {
  try {
    const caseId = req.params.id;

    // Check if the case has an appointment scheduled (active appointment)
    const [apptRows] = await pool.query(
      `SELECT 1 FROM Appointment
       WHERE Appoint_Case_ID = ?
         AND (Appoint_Delete_Flag = FALSE OR Appoint_Delete_Flag = 0)
       LIMIT 1`,
      [caseId],
    );

    if (apptRows.length > 0) {
      return res.status(400).json({ message: "This case cannot be deleted because it has a scheduled appointment." });
    }

    const [result] = await pool.query(
      `UPDATE Case_Master
       SET Case_Delete_Flag = TRUE,
           Case_Modified_By = ?,
           Case_Modified_Date = CURDATE()
       WHERE Case_ID = ?
         AND (Case_Delete_Flag = FALSE OR Case_Delete_Flag = 0)`,
      [req.user?.id || null, caseId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Case not found." });
    }

    res.json({ message: "Deleted successfully." });
  } catch (err) {
    next(err);
  }
}
