import pool from "../config/db.js";
const SYSTEM_CASE_LINK = "SYSTEM_CASE_LINK";

function formatTime(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 5);
  return value;
}

function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return String(value).slice(0, 10);
}

function getTimestampFromIST(dateStr, timeStr) {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const utcDate = Date.UTC(yyyy, mm - 1, dd, hours, minutes);
  return utcDate - 5.5 * 60 * 60 * 1000;
}

function isModificationAllowed(appointDate, appointStartTime) {
  if (!appointDate || !appointStartTime) return true;
  const dateStr = formatDate(appointDate);
  const timeStr = formatTime(appointStartTime);
  const appointmentStart = getTimestampFromIST(dateStr, timeStr);
  const current = Date.now();
  const diffMinutes = (current - appointmentStart) / (1000 * 60);
  return diffMinutes <= 15;
}

function getAppointmentStatus(row) {
  if (row.Appoint_Delete_Flag || row.Appoint_Delete_Flag === 1 || row.deleteFlag || row.Appoint_Delete_Flag === '1') {
    return "deleted";
  }
  const dateStr = formatDate(row.Appoint_Date || row.date);
  const timeStr = formatTime(row.Appoint_Start_Time || row.startTime);
  if (!dateStr || !timeStr) return "scheduled";
  
  const appointmentStart = getTimestampFromIST(dateStr, timeStr);
  const current = Date.now();
  if (current > appointmentStart + 15 * 60 * 1000) {
    return "completed";
  }
  return "scheduled";
}

function parseOptionalDate(value) {
  const s = value?.trim();
  return s || null;
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

export async function parseAppointmentBody(body, excludeAppointmentId = null) {
  const clientId = Number.parseInt(body.clientId, 10);
  const caseId = body.caseId === "NO_CASE" || !body.caseId ? null : Number.parseInt(body.caseId, 10);

  let advocateIds = [];
  if (Array.isArray(body.advocateIds)) {
    advocateIds = body.advocateIds.map(id => Number.parseInt(id, 10)).filter(id => !Number.isNaN(id));
  } else if (body.advocateId) {
    advocateIds = [Number.parseInt(body.advocateId, 10)];
  }

  const filingDate = parseOptionalDate(body.filingDate);
  const startTime = body.startTime?.trim();
  const endTime = body.endTime?.trim();

  if (!clientId || Number.isNaN(clientId)) {
    return { error: "Client name is required." };
  }
  if (body.caseId === undefined || body.caseId === "") {
    return { error: "Case number is required." };
  }
  if (caseId !== null && Number.isNaN(caseId)) {
    return { error: "Invalid case selected." };
  }
  if (advocateIds.length === 0) {
    return { error: "Advocate is required." };
  }
  if (!filingDate) {
    return { error: "Filing date is required." };
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const partMap = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }
  const todayStr = `${partMap.year}-${partMap.month}-${partMap.day}`;

  if (filingDate < todayStr) {
    return { error: "Appointment date must be today or a future date." };
  }

  if (!excludeAppointmentId && filingDate === todayStr) {
    const currentTimeStr = `${partMap.hour}:${partMap.minute}`;
    if (startTime < currentTimeStr) {
      return { error: "Appointment start time cannot be in the past." };
    }
  }

  if (!startTime) {
    return { error: "Start time is required." };
  }
  if (!endTime) {
    return { error: "End time is required." };
  }

  const getAmPm = (timeStr) => {
    if (!timeStr) return "";
    const [hoursStr] = timeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    if (isNaN(hours)) return "";
    return hours >= 12 ? "PM" : "AM";
  };

  if (getAmPm(startTime) === "PM" && getAmPm(endTime) === "AM") {
    return { error: "If the start time is PM, then the end time can only be PM." };
  }

  if (startTime >= endTime) {
    return { error: "End time must be after start time." };
  }

  const [clientOk, caseOk] = await Promise.all([
    assertExists({
      table: "Client_Master",
      idColumn: "Client_ID",
      deleteFlagColumn: "Client_Delete_Flag",
      idValue: clientId,
    }),
    caseId ? assertExists({
      table: "Case_Master",
      idColumn: "Case_ID",
      deleteFlagColumn: "Case_Delete_Flag",
      idValue: caseId,
    }) : Promise.resolve(true),
  ]);

  if (!clientOk) return { error: "Invalid client selected." };
  if (!caseOk) return { error: "Invalid case selected." };

  for (const advId of advocateIds) {
    const advocateOk = await assertExists({
      table: "Advocate_Master",
      idColumn: "Advocate_ID",
      deleteFlagColumn: "Advocate_Delete_Flag",
      idValue: advId,
    });
    if (!advocateOk) return { error: `Invalid advocate selected.` };
  }

  // Check for overlapping appointments for the selected advocates
  let excludeQuery = "";
  const excludeParams = [];
  if (excludeAppointmentId) {
    excludeQuery = ` AND ap.Appoint_ID != ?`;
    excludeParams.push(excludeAppointmentId);
  }

  const [overlapping] = await pool.query(
    `SELECT DISTINCT am.Advocate_Name
     FROM Appointment ap
     INNER JOIN Appointment_Advocates aa ON ap.Appoint_ID = aa.Appoint_ID
     INNER JOIN Advocate_Master am ON aa.Advocate_ID = am.Advocate_ID
     WHERE aa.Advocate_ID IN (?)
       AND DATE(ap.Appoint_Date) = DATE(?)
       AND TIME(ap.Appoint_Start_Time) < TIME(?)
       AND TIME(ap.Appoint_End_Time) > TIME(?)
       AND (ap.Appoint_Delete_Flag = FALSE OR ap.Appoint_Delete_Flag = 0)
       ${excludeQuery}`,
    [advocateIds, filingDate, endTime, startTime, ...excludeParams]
  );

  if (overlapping.length > 0) {
    const names = overlapping.map(o => o.Advocate_Name).join(", ");
    return { error: `Advocate(s) ${names} has/have an overlapping appointment scheduled during this time.` };
  }

  return {
    clientId,
    caseId,
    advocateIds,
    filingDate,
    startTime,
    endTime,
  };
}

const APPOINTMENT_SELECT = `
  SELECT
    ap.Appoint_ID AS id,
    ap.Appoint_Client_ID AS clientId,
    ap.Appoint_Case_ID AS caseId,
    DATE_FORMAT(ap.Appoint_Date, '%Y-%m-%d') AS filingDate,
    ap.Appoint_Start_Time AS startTime,
    ap.Appoint_End_Time AS endTime
  FROM Appointment ap
  WHERE ap.Appoint_ID = ?
    AND (ap.Appoint_Delete_Flag = FALSE OR ap.Appoint_Delete_Flag = 0)
`;

export async function getAppointment(req, res, next) {
  try {
    const [rows] = await pool.query(APPOINTMENT_SELECT, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }
    const row = rows[0];

    const [advRows] = await pool.query(
      `SELECT Advocate_ID AS advocateId
       FROM Appointment_Advocates
       WHERE Appoint_ID = ?`,
      [row.id]
    );

    res.json({
      ...row,
      filingDate: formatDate(row.filingDate),
      startTime: formatTime(row.startTime),
      endTime: formatTime(row.endTime),
      advocateIds: advRows.map(r => r.advocateId),
      status: getAppointmentStatus({ ...row, date: row.filingDate, startTime: row.startTime }),
    });
  } catch (err) {
    next(err);
  }
}

export async function createAppointment(req, res, next) {
  try {
    const parsed = await parseAppointmentBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const [result] = await pool.query(
      `INSERT INTO Appointment (
        Appoint_Client_ID,
        Appoint_Case_ID,
        Appoint_Date,
        Appoint_Start_Time,
        Appoint_End_Time,
        Appoint_Created_By,
        Appoint_Created_Date
      ) VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        parsed.clientId,
        parsed.caseId,
        parsed.filingDate,
        parsed.startTime,
        parsed.endTime,
        req.user?.id || null,
      ],
    );
    const appointmentId = result.insertId;

    for (const advId of parsed.advocateIds) {
      await pool.query(
        `INSERT INTO Appointment_Advocates (Appoint_ID, Advocate_ID) VALUES (?, ?)`,
        [appointmentId, advId]
      );
    }

    res.status(201).json({ id: appointmentId, message: "Appointment created." });
  } catch (err) {
    next(err);
  }
}

export async function updateAppointment(req, res, next) {
  try {
    const parsed = await parseAppointmentBody(req.body, req.params.id);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const [existingRows] = await pool.query(
      `SELECT Appoint_ID, Appoint_Date, Appoint_Start_Time
       FROM Appointment WHERE Appoint_ID = ? AND (Appoint_Delete_Flag = FALSE OR Appoint_Delete_Flag = 0)`,
      [req.params.id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const appt = existingRows[0];
    if (!isModificationAllowed(appt.Appoint_Date, appt.Appoint_Start_Time)) {
      return res.status(400).json({
        message: "Appointment can only be modified till 15 minutes after the appointment start time."
      });
    }

    await pool.query(
      `UPDATE Appointment SET
        Appoint_Client_ID = ?,
        Appoint_Case_ID = ?,
        Appoint_Date = ?,
        Appoint_Start_Time = ?,
        Appoint_End_Time = ?,
        Appoint_Modified_By = ?,
        Appoint_Modified_Date = CURDATE()
      WHERE Appoint_ID = ?`,
      [
        parsed.clientId,
        parsed.caseId,
        parsed.filingDate,
        parsed.startTime,
        parsed.endTime,
        req.user?.id || null,
        req.params.id
      ]
    );

    await pool.query(
      `DELETE FROM Appointment_Advocates WHERE Appoint_ID = ?`,
      [req.params.id]
    );

    for (const advId of parsed.advocateIds) {
      await pool.query(
        `INSERT INTO Appointment_Advocates (Appoint_ID, Advocate_ID) VALUES (?, ?)`,
        [req.params.id, advId]
      );
    }

    res.json({ message: "Appointment updated." });
  } catch (err) {
    next(err);
  }
}

export async function listAppointments(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
    let sql = `
      SELECT
        ap.Appoint_ID AS id,
        cl.Client_Name AS clientName,
        COALESCE(cs.Case_Num, 'NO CASE') AS caseNumber,
        (
          SELECT GROUP_CONCAT(DISTINCT a2.Advocate_Name ORDER BY a2.Advocate_Name SEPARATOR ', ')
          FROM Appointment_Advocates aa
          INNER JOIN Advocate_Master a2 ON aa.Advocate_ID = a2.Advocate_ID
          WHERE aa.Appoint_ID = ap.Appoint_ID
            AND (a2.Advocate_Delete_Flag = FALSE OR a2.Advocate_Delete_Flag = 0)
        ) AS advocateName,
        (
          SELECT COUNT(DISTINCT aa.Advocate_ID)
          FROM Appointment_Advocates aa
          WHERE aa.Appoint_ID = ap.Appoint_ID
        ) AS advocateCount,
        ap.Appoint_Date AS date,
        ap.Appoint_Start_Time AS startTime,
        ap.Appoint_End_Time AS endTime
      FROM Appointment ap
      INNER JOIN Client_Master cl ON ap.Appoint_Client_ID = cl.Client_ID
      LEFT JOIN Case_Master cs ON ap.Appoint_Case_ID = cs.Case_ID
      WHERE (ap.Appoint_Delete_Flag = FALSE OR ap.Appoint_Delete_Flag = 0)
    `;
    const params = [];

    if (req.user?.role === "advocate") {
      sql += ` AND EXISTS (
        SELECT 1 FROM Appointment_Advocates aa3
        WHERE aa3.Appoint_ID = ap.Appoint_ID
          AND aa3.Advocate_ID = ?
      )`;
      params.push(req.user.advocateId || req.user.id);
    }

    if (search) {
      sql += ` AND (
        cl.Client_Name LIKE ?
        OR COALESCE(cs.Case_Num, 'NO CASE') LIKE ?
        OR EXISTS (
          SELECT 1 FROM Appointment_Advocates aa4
          INNER JOIN Advocate_Master adv4 ON aa4.Advocate_ID = adv4.Advocate_ID
          WHERE aa4.Appoint_ID = ap.Appoint_ID
            AND adv4.Advocate_Name LIKE ?
            AND (adv4.Advocate_Delete_Flag = FALSE OR adv4.Advocate_Delete_Flag = 0)
        )
        OR CAST(ap.Appoint_Date AS CHAR) LIKE ?
        OR CAST(ap.Appoint_Start_Time AS CHAR) LIKE ?
        OR CAST(ap.Appoint_End_Time AS CHAR) LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    sql += " ORDER BY date ASC, startTime ASC";

    const [rows] = await pool.query(sql, params);
    const mapped = rows.map((row) => {
      const date = formatDate(row.date);
      const startTime = formatTime(row.startTime);
      const endTime = formatTime(row.endTime);
      const status = getAppointmentStatus({ ...row, date, startTime });
      return {
        ...row,
        date,
        startTime,
        endTime,
        status,
      };
    });
    const filtered = mapped.filter((item) => item.status === "scheduled");
    res.json(filtered);
  } catch (err) {
    next(err);
  }
}

export async function deleteAppointment(req, res, next) {
  try {
    const [apptRows] = await pool.query(
      `SELECT Appoint_ID, Appoint_Date, Appoint_Start_Time
       FROM Appointment
       WHERE Appoint_ID = ? AND (Appoint_Delete_Flag = FALSE OR Appoint_Delete_Flag = 0)`,
      [req.params.id]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const appt = apptRows[0];
    if (!isModificationAllowed(appt.Appoint_Date, appt.Appoint_Start_Time)) {
      return res.status(400).json({
        message: "Appointment can only be modified or deleted till 15 minutes after the appointment start time."
      });
    }

    await pool.query(
      `UPDATE Appointment SET Appoint_Delete_Flag = TRUE, Appoint_Modified_By = ?, Appoint_Modified_Date = CURDATE() WHERE Appoint_ID = ?`,
      [req.user?.id || null, req.params.id],
    );

    res.json({ message: "Deleted successfully." });
  } catch (err) {
    next(err);
  }
}


export async function getAppointmentRemarks(req, res, next) {
  const { appointmentId } = req.params;
  try {
    // Verify appointment exists
        const [apptRows] = await pool.query(
      `SELECT Appoint_ID, Appoint_Case_ID, Appoint_Date, Appoint_Start_Time
       FROM Appointment
       WHERE Appoint_ID = ? AND (Appoint_Delete_Flag = FALSE OR Appoint_Delete_Flag = 0)`,
      [appointmentId]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const appt = apptRows[0];

    if (req.user.role === "advocate") {
      const advocateId = req.user.advocateId || req.user.id;
      const [authRows] = await pool.query(
        `SELECT 1 FROM Appointment_Advocates
         WHERE Appoint_ID = ? AND Advocate_ID = ?`,
        [appointmentId, advocateId]
      );
      if (authRows.length === 0) {
        return res.status(403).json({ message: "Access denied to this appointment's remarks." });
      }
    }

    let canAddRemark = false;
    let validationMessage = "";

    if (appt.Appoint_Case_ID === null) {
      canAddRemark = false;
      validationMessage = "Remarks cannot be added for a NO CASE appointment.";
    } else {
      const apptDateStr = formatDate(appt.Appoint_Date);
      const todayStr = formatDate(new Date());

      if (apptDateStr > todayStr) {
        canAddRemark = false;
        validationMessage = "Remarks can only be entered once the appointment date has come into effect.";
      } else {
        // Fetch all appointments for the case to check if a newer one has come into effect
        const [allAppts] = await pool.query(
          `SELECT Appoint_ID, Appoint_Date, Appoint_Start_Time
           FROM Appointment
           WHERE Appoint_Case_ID = ?
             AND (Appoint_Delete_Flag = FALSE OR Appoint_Delete_Flag = 0)`,
          [appt.Appoint_Case_ID]
        );

        const apptTimeStr = formatTime(appt.Appoint_Start_Time || "00:00");
        const newerInEffect = allAppts.some(other => {
          if (other.Appoint_ID === appt.Appoint_ID) return false;
          const otherDateStr = formatDate(other.Appoint_Date);
          const otherTimeStr = formatTime(other.Appoint_Start_Time || "00:00");
          const isNewer = otherDateStr > apptDateStr || (otherDateStr === apptDateStr && otherTimeStr > apptTimeStr);
          if (!isNewer) return false;
          const status = getAppointmentStatus(other);
          return status === "completed";
        });

        if (newerInEffect) {
          canAddRemark = false;
          validationMessage = "Remarks can no longer be entered for this appointment as a newer appointment has come into effect.";
        } else {
          canAddRemark = req.user.role === "advocate";
          validationMessage = req.user.role !== "advocate" ? "Only advocates can add remarks." : "";
        }
      }
    }

    // Fetch remarks linked to the same Case ID or specific appointment if NO CASE, preserving the original appointment dates formatted as DD/MM/YYYY
    let remarksQuery;
    let remarksParams;
    if (appt.Appoint_Case_ID === null) {
      remarksQuery = `
        SELECT
           r.Remark_ID AS id,
           r.Appoint_ID AS appointmentId,
           r.Remark_Text AS remarkText,
           r.Remark_Date AS remarkDate,
           r.Remark_Created_By AS createdBy,
           DATE_FORMAT(COALESCE(r.Appoint_Date, ap.Appoint_Date), '%d/%m/%Y') AS appointmentDate
         FROM Appointment_Remarks r
         INNER JOIN Appointment ap ON r.Appoint_ID = ap.Appoint_ID
         WHERE ap.Appoint_ID = ?
         ORDER BY r.Remark_Date DESC
      `;
      remarksParams = [appointmentId];
    } else {
      // Find all distinct appointment dates for the case in ascending order
      const [allDatesRows] = await pool.query(
        `SELECT DISTINCT Appoint_Date
         FROM Appointment
         WHERE Appoint_Case_ID = ?
           AND (Appoint_Delete_Flag = FALSE OR Appoint_Delete_Flag = 0)
         ORDER BY Appoint_Date ASC`,
        [appt.Appoint_Case_ID]
      );

      const apptDateStr = formatDate(appt.Appoint_Date);
      const idx = allDatesRows.findIndex(row => formatDate(row.Appoint_Date) === apptDateStr);

      remarksQuery = `
        SELECT
           r.Remark_ID AS id,
           r.Appoint_ID AS appointmentId,
           r.Remark_Text AS remarkText,
           r.Remark_Date AS remarkDate,
           r.Remark_Created_By AS createdBy,
           DATE_FORMAT(COALESCE(r.Appoint_Date, ap.Appoint_Date), '%d/%m/%Y') AS appointmentDate
         FROM Appointment_Remarks r
         INNER JOIN Appointment ap ON r.Appoint_ID = ap.Appoint_ID
         WHERE ap.Appoint_Case_ID = ?
           AND DATE(r.Remark_Date) >= ?
      `;
      remarksParams = [appt.Appoint_Case_ID, apptDateStr];

      if (idx !== -1 && idx < allDatesRows.length - 1) {
        remarksQuery += ` AND DATE(r.Remark_Date) < ?`;
        remarksParams.push(formatDate(allDatesRows[idx + 1].Appoint_Date));
      }

      remarksQuery += ` ORDER BY r.Remark_Date DESC`;
    }

    const [remarks] = await pool.query(remarksQuery, remarksParams);

    res.json({
      remarks,
      canAddRemark,
      validationMessage,
    });
  } catch (err) {
    next(err);
  }
}

export async function addAppointmentRemark(req, res, next) {
  const { appointmentId } = req.params;
  const { remarkText } = req.body;
  try {
    if (!remarkText || !remarkText.trim()) {
      return res.status(400).json({ message: "Remark text is required." });
    }

    // Verify appointment exists
    const [apptRows] = await pool.query(
      `SELECT Appoint_ID, Appoint_Date, Appoint_Case_ID, Appoint_Start_Time
       FROM Appointment
       WHERE Appoint_ID = ? AND (Appoint_Delete_Flag = FALSE OR Appoint_Delete_Flag = 0)`,
      [appointmentId]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (req.user.role !== "advocate") {
      return res.status(403).json({ message: "Only advocates can add remarks." });
    }

    const appt = apptRows[0];
    if (appt.Appoint_Case_ID === null) {
      return res.status(400).json({ message: "Remarks cannot be added for a NO CASE appointment." });
    }

    const apptDateStr = formatDate(appt.Appoint_Date);
    const todayStr = formatDate(new Date());

    if (apptDateStr > todayStr) {
      return res.status(400).json({
        message: "Remarks can only be entered once the appointment date has come into effect."
      });
    }

    // Fetch all appointments for the case to check if a newer one has come into effect
    const [allAppts] = await pool.query(
      `SELECT Appoint_ID, Appoint_Date, Appoint_Start_Time
       FROM Appointment
       WHERE Appoint_Case_ID = ?
         AND (Appoint_Delete_Flag = FALSE OR Appoint_Delete_Flag = 0)`,
      [appt.Appoint_Case_ID]
    );

    const apptTimeStr = formatTime(appt.Appoint_Start_Time || "00:00");
    const newerInEffect = allAppts.some(other => {
      if (other.Appoint_ID === appt.Appoint_ID) return false;
      const otherDateStr = formatDate(other.Appoint_Date);
      const otherTimeStr = formatTime(other.Appoint_Start_Time || "00:00");
      const isNewer = otherDateStr > apptDateStr || (otherDateStr === apptDateStr && otherTimeStr > apptTimeStr);
      if (!isNewer) return false;
      const status = getAppointmentStatus(other);
      return status === "completed";
    });

    if (newerInEffect) {
      return res.status(400).json({
        message: "Remarks can no longer be entered for this appointment as a newer appointment has come into effect."
      });
    }

    const advocateId = req.user.advocateId || req.user.id;
    const [authRows] = await pool.query(
      `SELECT 1 FROM Appointment_Advocates
       WHERE Appoint_ID = ? AND Advocate_ID = ?`,
      [appointmentId, advocateId]
    );
    if (authRows.length === 0) {
      return res.status(403).json({ message: "Access denied. This appointment is not assigned to you." });
    }

    // Retrieve advocate's name to use as creator
    const [advRows] = await pool.query(
      `SELECT Advocate_Name FROM Advocate_Master WHERE Advocate_ID = ?`,
      [advocateId]
    );
    const creatorName = advRows[0]?.Advocate_Name || req.user.email;

    // Insert remark preserving the current appointment date
    const [result] = await pool.query(
      `INSERT INTO Appointment_Remarks (Appoint_ID, Remark_Text, Remark_Created_By, Appoint_Date)
       SELECT ?, ?, ?, Appoint_Date
       FROM Appointment
       WHERE Appoint_ID = ?`,
      [appointmentId, remarkText.trim(), creatorName, appointmentId]
    );

    res.status(201).json({
      id: result.insertId,
      message: "Remark added successfully.",
    });
  } catch (err) {
    next(err);
  }
}

export async function getAppointmentReport(req, res, next) {
  try {
    const { startDate, endDate, advocateId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and End date are required." });
    }

    let sql = `
      SELECT
        ap.Appoint_ID AS id,
        cl.Client_Name AS clientName,
        COALESCE(cs.Case_Num, 'NO CASE') AS caseNumber,
        (
          SELECT GROUP_CONCAT(DISTINCT a2.Advocate_Name ORDER BY a2.Advocate_Name SEPARATOR ', ')
          FROM Appointment_Advocates aa
          INNER JOIN Advocate_Master a2 ON aa.Advocate_ID = a2.Advocate_ID
          WHERE aa.Appoint_ID = ap.Appoint_ID
            AND (a2.Advocate_Delete_Flag = FALSE OR a2.Advocate_Delete_Flag = 0)
        ) AS advocateName,
        ap.Appoint_Date AS date,
        ap.Appoint_Start_Time AS startTime,
        ap.Appoint_End_Time AS endTime
      FROM Appointment ap
      INNER JOIN Client_Master cl ON ap.Appoint_Client_ID = cl.Client_ID
      LEFT JOIN Case_Master cs ON ap.Appoint_Case_ID = cs.Case_ID
      WHERE (ap.Appoint_Delete_Flag = FALSE OR ap.Appoint_Delete_Flag = 0)
        AND ap.Appoint_Date BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];

    if (advocateId && advocateId !== "all") {
      sql += ` AND EXISTS (
        SELECT 1 FROM Appointment_Advocates aa
        WHERE aa.Appoint_ID = ap.Appoint_ID AND aa.Advocate_ID = ?
      )`;
      params.push(Number(advocateId));
    }

    sql += " ORDER BY ap.Appoint_Date ASC, ap.Appoint_Start_Time ASC";

    const [rows] = await pool.query(sql, params);
    res.json(
      rows.map((row) => {
        const date = formatDate(row.date);
        const startTime = formatTime(row.startTime);
        const endTime = formatTime(row.endTime);
        const status = getAppointmentStatus({ ...row, date, startTime });
        return {
          ...row,
          date,
          startTime,
          endTime,
          status,
        };
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getClientReport(req, res, next) {
  try {
    const { startDate, endDate, clientId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and End date are required." });
    }

    let sql = `
      SELECT
        ap.Appoint_ID AS id,
        cl.Client_Name AS clientName,
        COALESCE(cs.Case_Num, 'NO CASE') AS caseNumber,
        (
          SELECT GROUP_CONCAT(DISTINCT a2.Advocate_Name ORDER BY a2.Advocate_Name SEPARATOR ', ')
          FROM Appointment_Advocates aa
          INNER JOIN Advocate_Master a2 ON aa.Advocate_ID = a2.Advocate_ID
          WHERE aa.Appoint_ID = ap.Appoint_ID
            AND (a2.Advocate_Delete_Flag = FALSE OR a2.Advocate_Delete_Flag = 0)
        ) AS advocateName,
        ap.Appoint_Date AS date,
        ap.Appoint_Start_Time AS startTime,
        ap.Appoint_End_Time AS endTime
      FROM Appointment ap
      INNER JOIN Client_Master cl ON ap.Appoint_Client_ID = cl.Client_ID
      LEFT JOIN Case_Master cs ON ap.Appoint_Case_ID = cs.Case_ID
      WHERE (ap.Appoint_Delete_Flag = FALSE OR ap.Appoint_Delete_Flag = 0)
        AND ap.Appoint_Date BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];

    if (clientId && clientId !== "all") {
      sql += " AND ap.Appoint_Client_ID = ?";
      params.push(Number(clientId));
    }

    sql += " ORDER BY ap.Appoint_Date ASC, ap.Appoint_Start_Time ASC";

    const [rows] = await pool.query(sql, params);
    res.json(
      rows.map((row) => {
        const date = formatDate(row.date);
        const startTime = formatTime(row.startTime);
        const endTime = formatTime(row.endTime);
        const status = getAppointmentStatus({ ...row, date, startTime });
        return {
          ...row,
          date,
          startTime,
          endTime,
          status,
        };
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getCaseReport(req, res, next) {
  try {
    const { startDate, endDate, caseId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and End date are required." });
    }

    let sql = `
      SELECT
        ap.Appoint_ID AS id,
        cl.Client_Name AS clientName,
        COALESCE(cs.Case_Num, 'NO CASE') AS caseNumber,
        cs.Case_ID AS caseId,
        (
          SELECT GROUP_CONCAT(DISTINCT a2.Advocate_Name ORDER BY a2.Advocate_Name SEPARATOR ', ')
          FROM Appointment_Advocates aa
          INNER JOIN Advocate_Master a2 ON aa.Advocate_ID = a2.Advocate_ID
          WHERE aa.Appoint_ID = ap.Appoint_ID
            AND (a2.Advocate_Delete_Flag = FALSE OR a2.Advocate_Delete_Flag = 0)
        ) AS advocateName,
        ap.Appoint_Date AS date,
        ap.Appoint_Start_Time AS startTime,
        ap.Appoint_End_Time AS endTime,
        ap.Appoint_Delete_Flag AS deleteFlag
      FROM Appointment ap
      INNER JOIN Client_Master cl ON ap.Appoint_Client_ID = cl.Client_ID
      LEFT JOIN Case_Master cs ON ap.Appoint_Case_ID = cs.Case_ID
      WHERE ap.Appoint_Date BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];

    if (caseId && caseId !== "all") {
      if (caseId === "NO_CASE") {
        sql += " AND ap.Appoint_Case_ID IS NULL";
      } else {
        sql += " AND ap.Appoint_Case_ID = ?";
        params.push(Number(caseId));
      }
    }

    sql += " ORDER BY caseNumber ASC, ap.Appoint_Date ASC, ap.Appoint_Start_Time ASC";

    const [rows] = await pool.query(sql, params);
    res.json(
      rows.map((row) => {
        const date = formatDate(row.date);
        const startTime = formatTime(row.startTime);
        const endTime = formatTime(row.endTime);
        const status = getAppointmentStatus({ ...row, date, startTime, Appoint_Delete_Flag: row.deleteFlag });
        return {
          ...row,
          date,
          startTime,
          endTime,
          status,
        };
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function listCompletedAppointments(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
    const caseIdParam = req.query.caseId;
    let sql = `
      SELECT
        ap.Appoint_ID AS id,
        cl.Client_Name AS clientName,
        cs.Case_Num AS caseNumber,
        cs.Case_ID AS caseId,
        (
          SELECT GROUP_CONCAT(DISTINCT a2.Advocate_Name ORDER BY a2.Advocate_Name SEPARATOR ', ')
          FROM Appointment_Advocates aa
          INNER JOIN Advocate_Master a2 ON aa.Advocate_ID = a2.Advocate_ID
          WHERE aa.Appoint_ID = ap.Appoint_ID
            AND (a2.Advocate_Delete_Flag = FALSE OR a2.Advocate_Delete_Flag = 0)
        ) AS advocateName,
        ap.Appoint_Date AS date,
        ap.Appoint_Start_Time AS startTime,
        ap.Appoint_End_Time AS endTime
      FROM Appointment ap
      INNER JOIN Client_Master cl ON ap.Appoint_Client_ID = cl.Client_ID
      INNER JOIN Case_Master cs ON ap.Appoint_Case_ID = cs.Case_ID
      WHERE (ap.Appoint_Delete_Flag = FALSE OR ap.Appoint_Delete_Flag = 0)
    `;
    const params = [];

    if (caseIdParam !== undefined && caseIdParam !== null && caseIdParam !== "") {
      sql += ` AND ap.Appoint_Case_ID = ?`;
      params.push(Number(caseIdParam));
    }

    if (req.user?.role === "advocate") {
      sql += ` AND EXISTS (
        SELECT 1 FROM Appointment_Advocates aa3
        WHERE aa3.Appoint_ID = ap.Appoint_ID
          AND aa3.Advocate_ID = ?
      )`;
      params.push(req.user.advocateId || req.user.id);
    }

    if (search) {
      sql += ` AND (
        cl.Client_Name LIKE ?
        OR cs.Case_Num LIKE ?
        OR CAST(ap.Appoint_Date AS CHAR) LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += " ORDER BY date DESC, startTime DESC";

    const [rows] = await pool.query(sql, params);
    const mapped = rows.map((row) => {
      const date = formatDate(row.date);
      const startTime = formatTime(row.startTime);
      const endTime = formatTime(row.endTime);
      const status = getAppointmentStatus({ ...row, date, startTime });
      return {
        ...row,
        date,
        startTime,
        endTime,
        status,
      };
    });
    const filtered = mapped.filter((item) => item.status === "completed");

    if (caseIdParam !== undefined && caseIdParam !== null && caseIdParam !== "") {
      return res.json(filtered);
    }

    // Return summary grouped by case
    const grouped = {};
    for (const item of filtered) {
      const caseKey = item.caseId || "no-case";
      if (!grouped[caseKey]) {
        grouped[caseKey] = {
          caseId: item.caseId,
          caseNumber: item.caseNumber || "NO CASE",
          clientName: item.clientName || "—",
          advocateName: item.advocateName || "—",
          count: 0
        };
      }
      grouped[caseKey].count += 1;
    }
    res.json(Object.values(grouped));
  } catch (err) {
    next(err);
  }
}
