import pool from "../config/db.js";

const activeCondition = (alias = "") =>
  `(${alias}Hearing_Delete_Flag = FALSE OR ${alias}Hearing_Delete_Flag = 0)`;

export async function create(hearing, connection = pool) {
  const [result] = await connection.query(
    `INSERT INTO HEARING_MASTER (
      Client_ID,
      Case_ID,
      Advocate_ID,
      Client_Name,
      Case_Name,
      Purpose_Text,
      Hearing_Date,
      Hearing_Time,
      Court_Name,
      Judge_Name,
      Hearing_Created_By,
      Hearing_Created_Date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [
      hearing.clientId,
      hearing.caseId,
      hearing.advocateId,
      hearing.clientName,
      hearing.caseName,
      hearing.purposeText,
      hearing.hearingDate,
      hearing.time,
      hearing.courtName,
      hearing.judgeName,
      hearing.createdBy
    ]
  );
  return result.insertId;
}

export async function getById(id) {
  const [rows] = await pool.query(
    `SELECT
      Hearing_ID AS id,
      Client_ID AS clientId,
      Case_ID AS caseId,
      Advocate_ID AS advocateId,
      Client_Name AS clientName,
      Case_Name AS caseName,
      Purpose_Text AS purposeText,
      Hearing_Date AS hearingDate,
      Hearing_Time AS time,
      Court_Name AS courtName,
      Judge_Name AS judgeName,
      Hearing_Created_By AS createdBy,
      Hearing_Delete_Flag AS deleteFlag
     FROM HEARING_MASTER
     WHERE Hearing_ID = ? AND ${activeCondition()}`,
    [id]
  );
  return rows[0] || null;
}

export async function getRelatedHearingRows(clientId, caseId, date, time) {
  const [rows] = await pool.query(
    `SELECT Hearing_ID AS id, Client_ID AS clientId, Advocate_ID AS advocateId
     FROM HEARING_MASTER
     WHERE Client_ID = ?
       AND Case_ID = ?
       AND DATE(Hearing_Date) = DATE(?)
       AND TIME(Hearing_Time) = TIME(?)
       AND ${activeCondition()}`,
    [clientId, caseId, date, time]
  );
  return rows;
}

export async function checkActiveHearing(caseId, excludeHearingIds = []) {
  let query = `
    SELECT Hearing_ID FROM HEARING_MASTER
    WHERE Case_ID = ?
      AND ${activeCondition()}
      AND TIMESTAMP(Hearing_Date, Hearing_Time) + INTERVAL 15 MINUTE > NOW()
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
    SELECT DISTINCT hm.Advocate_ID, am.Advocate_Name
    FROM HEARING_MASTER hm
    INNER JOIN Advocate_Master am ON hm.Advocate_ID = am.Advocate_ID
    WHERE hm.Advocate_ID IN (?)
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

export async function softDeleteHearingRows(ids, connection = pool) {
  await connection.query(
    `UPDATE HEARING_MASTER SET Hearing_Delete_Flag = TRUE, Hearing_Modified_Date = CURDATE() WHERE Hearing_ID IN (?)`,
    [ids]
  );
}

export async function listHearings(search, advocateId = null) {
  let query = `
    SELECT
      MIN(hm.Hearing_ID) AS id,
      hm.Client_ID AS clientId,
      hm.Case_ID AS caseId,
      hm.Client_Name AS clientName,
      hm.Case_Name AS caseNumber,
      hm.Purpose_Text AS purposeText,
      DATE_FORMAT(hm.Hearing_Date, '%Y-%m-%d') AS date,
      TIME_FORMAT(hm.Hearing_Time, '%H:%i') AS time,
      hm.Court_Name AS courtName,
      hm.Judge_Name AS judgeName,
      (
        SELECT GROUP_CONCAT(DISTINCT a.Advocate_Name ORDER BY a.Advocate_Name SEPARATOR ', ')
        FROM HEARING_MASTER hm2
        INNER JOIN Advocate_Master a ON hm2.Advocate_ID = a.Advocate_ID
        WHERE hm2.Client_ID = hm.Client_ID
          AND hm2.Case_ID = hm.Case_ID
          AND DATE(hm2.Hearing_Date) = DATE(hm.Hearing_Date)
          AND TIME(hm2.Hearing_Time) = TIME(hm.Hearing_Time)
          AND ${activeCondition("hm2.")}
      ) AS advocateName
    FROM HEARING_MASTER hm
    WHERE ${activeCondition("hm.")}
      AND TIMESTAMP(hm.Hearing_Date, hm.Hearing_Time) + INTERVAL 15 MINUTE > NOW()
  `;
  const params = [];
  
  if (advocateId) {
    query += ` AND EXISTS (
      SELECT 1 FROM HEARING_MASTER hm3
      WHERE hm3.Client_ID = hm.Client_ID
        AND hm3.Case_ID = hm.Case_ID
        AND DATE(hm3.Hearing_Date) = DATE(hm.Hearing_Date)
        AND TIME(hm3.Hearing_Time) = TIME(hm.Hearing_Time)
        AND hm3.Advocate_ID = ?
        AND ${activeCondition("hm3.")}
    )`;
    params.push(advocateId);
  }

  if (search) {
    query += ` AND (
      hm.Client_Name LIKE ?
      OR hm.Case_Name LIKE ?
      OR hm.Court_Name LIKE ?
      OR hm.Judge_Name LIKE ?
    )`;
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += `
    GROUP BY hm.Client_ID, hm.Case_ID, hm.Hearing_Date, hm.Hearing_Time, hm.Client_Name, hm.Case_Name, hm.Purpose_Text, hm.Court_Name, hm.Judge_Name
    ORDER BY hm.Hearing_Date ASC, hm.Hearing_Time ASC
  `;

  const [rows] = await pool.query(query, params);
  return rows;
}

export async function listCompletedHearings(search, advocateId = null) {
  let query = `
    SELECT
      MIN(hm.Hearing_ID) AS id,
      hm.Client_ID AS clientId,
      hm.Case_ID AS caseId,
      hm.Client_Name AS clientName,
      hm.Case_Name AS caseNumber,
      hm.Purpose_Text AS purposeText,
      DATE_FORMAT(hm.Hearing_Date, '%Y-%m-%d') AS date,
      TIME_FORMAT(hm.Hearing_Time, '%H:%i') AS time,
      hm.Court_Name AS courtName,
      hm.Judge_Name AS judgeName,
      (
        SELECT GROUP_CONCAT(DISTINCT a.Advocate_Name ORDER BY a.Advocate_Name SEPARATOR ', ')
        FROM HEARING_MASTER hm2
        INNER JOIN Advocate_Master a ON hm2.Advocate_ID = a.Advocate_ID
        WHERE hm2.Client_ID = hm.Client_ID
          AND hm2.Case_ID = hm.Case_ID
          AND DATE(hm2.Hearing_Date) = DATE(hm.Hearing_Date)
          AND TIME(hm2.Hearing_Time) = TIME(hm.Hearing_Time)
          AND ${activeCondition("hm2.")}
      ) AS advocateName
    FROM HEARING_MASTER hm
    WHERE ${activeCondition("hm.")}
      AND TIMESTAMP(hm.Hearing_Date, hm.Hearing_Time) + INTERVAL 15 MINUTE <= NOW()
  `;
  const params = [];

  if (advocateId) {
    query += ` AND EXISTS (
      SELECT 1 FROM HEARING_MASTER hm3
      WHERE hm3.Client_ID = hm.Client_ID
        AND hm3.Case_ID = hm.Case_ID
        AND DATE(hm3.Hearing_Date) = DATE(hm.Hearing_Date)
        AND TIME(hm3.Hearing_Time) = TIME(hm.Hearing_Time)
        AND hm3.Advocate_ID = ?
        AND ${activeCondition("hm3.")}
    )`;
    params.push(advocateId);
  }

  if (search) {
    query += ` AND (
      hm.Client_Name LIKE ?
      OR hm.Case_Name LIKE ?
      OR hm.Court_Name LIKE ?
      OR hm.Judge_Name LIKE ?
    )`;
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += `
    GROUP BY hm.Client_ID, hm.Case_ID, hm.Hearing_Date, hm.Hearing_Time, hm.Client_Name, hm.Case_Name, hm.Purpose_Text, hm.Court_Name, hm.Judge_Name
    ORDER BY hm.Hearing_Date DESC, hm.Hearing_Time DESC
  `;

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
      HN_Created_By,
      HN_Created_Date
    ) VALUES (?, ?, ?, CURDATE())`,
    [note.hearingId, note.text, note.createdBy]
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
