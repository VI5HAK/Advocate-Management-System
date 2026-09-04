import pool from "../config/db.js";

const activeCondition = (alias = "") =>
  `(${alias}Hearing_Delete_Flag = FALSE OR ${alias}Hearing_Delete_Flag = 0)`;

export async function create(hearing, connection = pool) {
  const [result] = await connection.query(
    `INSERT INTO HEARING_MASTER (
      Case_ID,
      Court_ID,
      Judge_ID,
      Purpose_Text,
      Hearing_Date,
      Hearing_Time,
      Hearing_Created_By,
      Hearing_Created_Date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [
      hearing.caseId,
      hearing.courtId,
      hearing.judgeId,
      hearing.purposeText,
      hearing.hearingDate,
      hearing.time,
      hearing.createdBy
    ]
  );
  return result.insertId;
}

export async function addHearingClients(hearingId, clientIds, connection = pool) {
  for (const clientId of clientIds) {
    await connection.query(
      `INSERT INTO Hearing_Clients (Hearing_ID, Client_ID) VALUES (?, ?)`,
      [hearingId, clientId]
    );
  }
}

export async function addHearingAdvocates(hearingId, advocateIds, connection = pool) {
  for (const advocateId of advocateIds) {
    await connection.query(
      `INSERT INTO Hearing_Advocates (Hearing_ID, Advocate_ID) VALUES (?, ?)`,
      [hearingId, advocateId]
    );
  }
}

export async function deleteHearingClients(hearingId, connection = pool) {
  await connection.query(
    `DELETE FROM Hearing_Clients WHERE Hearing_ID = ?`,
    [hearingId]
  );
}

export async function deleteHearingAdvocates(hearingId, connection = pool) {
  await connection.query(
    `DELETE FROM Hearing_Advocates WHERE Hearing_ID = ?`,
    [hearingId]
  );
}

export async function getById(id) {
  const [rows] = await pool.query(
    `SELECT
      hm.Hearing_ID AS id,
      hm.Case_ID AS caseId,
      cs.Case_Num AS caseName,
      hm.Court_ID AS courtId,
      cm.Court_Name AS courtName,
      hm.Judge_ID AS judgeId,
      jm.Judge_Name AS judgeName,
      hm.Purpose_Text AS purposeText,
      hm.Hearing_Date AS hearingDate,
      hm.Hearing_Time AS time,
      hm.Hearing_Created_By AS createdBy,
      hm.Hearing_Delete_Flag AS deleteFlag
     FROM HEARING_MASTER hm
     LEFT JOIN Case_Master cs ON hm.Case_ID = cs.Case_ID
     LEFT JOIN Court_Master cm ON hm.Court_ID = cm.Court_ID
     LEFT JOIN JUDGE_MASTER jm ON hm.Judge_ID = jm.Judge_ID
     WHERE hm.Hearing_ID = ? AND ${activeCondition("hm.")}`,
    [id]
  );
  return rows[0] || null;
}

export async function getHearingClientIds(hearingId) {
  const [rows] = await pool.query(
    `SELECT Client_ID AS clientId FROM Hearing_Clients WHERE Hearing_ID = ?`,
    [hearingId]
  );
  return rows.map(r => r.clientId);
}

export async function getHearingAdvocateIds(hearingId) {
  const [rows] = await pool.query(
    `SELECT Advocate_ID AS advocateId FROM Hearing_Advocates WHERE Hearing_ID = ?`,
    [hearingId]
  );
  return rows.map(r => r.advocateId);
}

export async function checkActiveHearing(caseId, excludeHearingIds = []) {
  let query = `
    SELECT Hearing_ID FROM HEARING_MASTER
    WHERE Case_ID = ?
      AND ${activeCondition()}
      AND Hearing_Date >= CURDATE()
  `;
  const params = [caseId];
  if (excludeHearingIds.length > 0) {
    query += ` AND Hearing_ID NOT IN (?)`;
    params.push(excludeHearingIds);
  }
  const [rows] = await pool.query(query, params);
  return rows.length > 0;
}

export async function checkAdvocateOverlaps(advocateIds, date, time, excludeHearingIds = []) {
  let query = `
    SELECT DISTINCT ha.Advocate_ID, am.Advocate_Name
    FROM HEARING_MASTER hm
    INNER JOIN Hearing_Advocates ha ON hm.Hearing_ID = ha.Hearing_ID
    INNER JOIN Advocate_Master am ON ha.Advocate_ID = am.Advocate_ID
    WHERE ha.Advocate_ID IN (?)
      AND ABS(TIMESTAMPDIFF(MINUTE, TIMESTAMP(hm.Hearing_Date, hm.Hearing_Time), TIMESTAMP(?, ?))) < 15
      AND ${activeCondition("hm.")}
  `;
  const params = [advocateIds, date, time];
  if (excludeHearingIds.length > 0) {
    query += ` AND hm.Hearing_ID NOT IN (?)`;
    params.push(excludeHearingIds);
  }
  const [rows] = await pool.query(query, params);
  return rows;
}

export async function deleteHearingRows(ids, connection = pool) {
  await connection.query(
    `DELETE FROM HEARING_MASTER WHERE Hearing_ID IN (?)`,
    [ids]
  );
}

export async function softDeleteHearingRows(ids, userId = null, connection = pool) {
  await connection.query(
    `UPDATE HEARING_MASTER SET Hearing_Delete_Flag = TRUE, Hearing_Modified_By = ?, Hearing_Modified_Date = CURDATE() WHERE Hearing_ID IN (?)`,
    [userId, ids]
  );
}

export async function listHearings(search, advocateId = null) {
  let query = `
    SELECT
      hm.Hearing_ID AS id,
      (
        SELECT GROUP_CONCAT(DISTINCT cl.Client_Name ORDER BY cl.Client_Name SEPARATOR ', ')
        FROM Hearing_Clients hc
        INNER JOIN Client_Master cl ON hc.Client_ID = cl.Client_ID
        WHERE hc.Hearing_ID = hm.Hearing_ID
          AND (cl.Client_Delete_Flag = FALSE OR cl.Client_Delete_Flag = 0)
      ) AS clientName,
      cs.Case_Num AS caseNumber,
      hm.Case_ID AS caseId,
      hm.Purpose_Text AS purposeText,
      DATE_FORMAT(hm.Hearing_Date, '%Y-%m-%d') AS date,
      TIME_FORMAT(hm.Hearing_Time, '%H:%i') AS time,
      cm.Court_Name AS courtName,
      jm.Judge_Name AS judgeName,
      (
        SELECT GROUP_CONCAT(DISTINCT a.Advocate_Name ORDER BY a.Advocate_Name SEPARATOR ', ')
        FROM Hearing_Advocates ha
        INNER JOIN Advocate_Master a ON ha.Advocate_ID = a.Advocate_ID
        WHERE ha.Hearing_ID = hm.Hearing_ID
          AND (a.Advocate_Delete_Flag = FALSE OR a.Advocate_Delete_Flag = 0)
      ) AS advocateName
    FROM HEARING_MASTER hm
    LEFT JOIN Case_Master cs ON hm.Case_ID = cs.Case_ID
    LEFT JOIN Court_Master cm ON hm.Court_ID = cm.Court_ID
    LEFT JOIN JUDGE_MASTER jm ON hm.Judge_ID = jm.Judge_ID
    WHERE ${activeCondition("hm.")}
      AND hm.Hearing_Date >= CURDATE()
  `;
  const params = [];
  
  if (advocateId) {
    query += ` AND EXISTS (
      SELECT 1 FROM Hearing_Advocates ha
      WHERE ha.Hearing_ID = hm.Hearing_ID
        AND ha.Advocate_ID = ?
    )`;
    params.push(advocateId);
  }

  if (search) {
    query += ` AND (
      cs.Case_Num LIKE ?
      OR cm.Court_Name LIKE ?
      OR jm.Judge_Name LIKE ?
      OR EXISTS (
        SELECT 1 FROM Hearing_Clients hc
        INNER JOIN Client_Master cl ON hc.Client_ID = cl.Client_ID
        WHERE hc.Hearing_ID = hm.Hearing_ID
          AND cl.Client_Name LIKE ?
      )
    )`;
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += ` ORDER BY hm.Hearing_Date ASC, hm.Hearing_Time ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
}

export async function listCompletedHearings(search, advocateId = null, caseId = null) {
  let query = `
    SELECT
      hm.Hearing_ID AS id,
      (
        SELECT GROUP_CONCAT(DISTINCT cl.Client_Name ORDER BY cl.Client_Name SEPARATOR ', ')
        FROM Hearing_Clients hc
        INNER JOIN Client_Master cl ON hc.Client_ID = cl.Client_ID
        WHERE hc.Hearing_ID = hm.Hearing_ID
          AND (cl.Client_Delete_Flag = FALSE OR cl.Client_Delete_Flag = 0)
      ) AS clientName,
      cs.Case_Num AS caseNumber,
      hm.Case_ID AS caseId,
      hm.Purpose_Text AS purposeText,
      DATE_FORMAT(hm.Hearing_Date, '%Y-%m-%d') AS date,
      TIME_FORMAT(hm.Hearing_Time, '%H:%i') AS time,
      cm.Court_Name AS courtName,
      jm.Judge_Name AS judgeName,
      (
        SELECT GROUP_CONCAT(DISTINCT a.Advocate_Name ORDER BY a.Advocate_Name SEPARATOR ', ')
        FROM Hearing_Advocates ha
        INNER JOIN Advocate_Master a ON ha.Advocate_ID = a.Advocate_ID
        WHERE ha.Hearing_ID = hm.Hearing_ID
          AND (a.Advocate_Delete_Flag = FALSE OR a.Advocate_Delete_Flag = 0)
      ) AS advocateName,
      (
        SELECT DATE_FORMAT(hn.Next_Hearing_Date, '%Y-%m-%d')
        FROM HEARING_NOTES_MASTER hn
        WHERE hn.Hearing_ID = hm.Hearing_ID
          AND hn.Next_Hearing_Date IS NOT NULL
        ORDER BY hn.HN_ID DESC
        LIMIT 1
      ) AS nextHearingDate
    FROM HEARING_MASTER hm
    LEFT JOIN Case_Master cs ON hm.Case_ID = cs.Case_ID
    LEFT JOIN Court_Master cm ON hm.Court_ID = cm.Court_ID
    LEFT JOIN JUDGE_MASTER jm ON hm.Judge_ID = jm.Judge_ID
    WHERE ${activeCondition("hm.")}
      AND hm.Hearing_Date < CURDATE()
  `;
  const params = [];

  if (caseId) {
    query += ` AND hm.Case_ID = ?`;
    params.push(Number(caseId));
  }

  if (advocateId) {
    query += ` AND EXISTS (
      SELECT 1 FROM Hearing_Advocates ha
      WHERE ha.Hearing_ID = hm.Hearing_ID
        AND ha.Advocate_ID = ?
    )`;
    params.push(advocateId);
  }

  if (search) {
    query += ` AND (
      cs.Case_Num LIKE ?
      OR cm.Court_Name LIKE ?
      OR jm.Judge_Name LIKE ?
      OR EXISTS (
        SELECT 1 FROM Hearing_Clients hc
        INNER JOIN Client_Master cl ON hc.Client_ID = cl.Client_ID
        WHERE hc.Hearing_ID = hm.Hearing_ID
          AND cl.Client_Name LIKE ?
      )
    )`;
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += ` ORDER BY hm.Hearing_Date ASC, hm.Hearing_Time ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
}

// Notes Master repository functions
export async function getNotes(hearingId) {
  const [rows] = await pool.query(
    `SELECT
      hn.HN_ID AS id,
      hn.Hearing_ID AS hearingId,
      hn.HN_Text AS remarkText,
      hn.Next_Hearing_Date AS nextHearingDate,
      hn.Next_Hearing_Purpose AS nextHearingPurpose,
      COALESCE(am.Advocate_Name, u.full_name, hn.HN_Created_By) AS createdBy,
      hn.HN_Created_Date AS remarkDate
     FROM HEARING_NOTES_MASTER hn
     LEFT JOIN Advocate_Master am ON hn.HN_Created_By = am.Advocate_Email_ID
     LEFT JOIN users u ON hn.HN_Created_By = u.email
     WHERE hn.Hearing_ID = ?
     ORDER BY hn.HN_ID DESC`,
    [hearingId]
  );
  return rows;
}

export async function addNote(note, connection = pool) {
  const [result] = await connection.query(
    `INSERT INTO HEARING_NOTES_MASTER (
      Hearing_ID,
      HN_Text,
      Next_Hearing_Date,
      Next_Hearing_Purpose,
      HN_Created_By,
      HN_Created_Date
    ) VALUES (?, ?, ?, ?, ?, CURDATE())`,
    [
      note.hearingId,
      note.text,
      note.nextHearingDate || null,
      note.nextHearingPurpose || null,
      note.createdBy
    ]
  );
  return result.insertId;
}

export async function reassociateNotes(oldHearingIds, newHearingId, connection = pool) {
  if (oldHearingIds.length === 0) return;
  await connection.query(
    `UPDATE HEARING_NOTES_MASTER
     SET Hearing_ID = ?
     WHERE Hearing_ID IN (?)`,
    [newHearingId, oldHearingIds]
  );
}
