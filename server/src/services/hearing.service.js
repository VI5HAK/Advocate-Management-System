import * as hearingRepository from "../repositories/hearing.repository.js";
import pool from "../config/db.js";

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

export class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = 400;
  }
}

export async function createHearing(body, user) {
  const {
    clientIds,
    caseId,
    advocateIds,
    date,
    time,
    courtId,
    judgeId,
    hearingPurpose
  } = body;

  if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
    throw new BadRequestError("At least one client must be selected.");
  }
  if (!caseId) {
    throw new BadRequestError("Case is required.");
  }
  if (!advocateIds || !Array.isArray(advocateIds) || advocateIds.length === 0) {
    throw new BadRequestError("At least one advocate must be selected.");
  }
  if (!date || !time) {
    throw new BadRequestError("Date and time are required.");
  }
  if (!courtId || !judgeId) {
    throw new BadRequestError("Court and Judge are required.");
  }

  // Future check: date & time must be in the future
  const selectedDateTime = new Date(`${date}T${time}:00`);
  if (isNaN(selectedDateTime.getTime())) {
    throw new BadRequestError("Invalid date or time format.");
  }
  if (selectedDateTime.getTime() <= Date.now()) {
    throw new BadRequestError("Hearing can only be created after the current date and time.");
  }

  // Check unique active hearing for Case_ID
  const hasActive = await hearingRepository.checkActiveHearing(caseId);
  if (hasActive) {
    throw new BadRequestError("There is already a scheduled/active hearing for this Case.");
  }

  // Check advocate overlaps
  const overlapping = await hearingRepository.checkAdvocateOverlaps(advocateIds, date, time);
  if (overlapping.length > 0) {
    const names = overlapping.map(o => o.Advocate_Name).join(", ");
    throw new BadRequestError(`Advocate(s) ${names} has/have an overlapping hearing scheduled during this time.`);
  }

  // Resolve Names
  const [caseRows] = await pool.query("SELECT Case_Num FROM Case_Master WHERE Case_ID = ?", [caseId]);
  if (caseRows.length === 0) throw new BadRequestError("Invalid case selected.");
  const caseName = caseRows[0].Case_Num;

  const [courtRows] = await pool.query("SELECT Court_Name FROM Court_Master WHERE Court_ID = ?", [courtId]);
  if (courtRows.length === 0) throw new BadRequestError("Invalid court selected.");
  const courtName = courtRows[0].Court_Name;

  const [judgeRows] = await pool.query("SELECT Judge_Name FROM JUDGE_MASTER WHERE Judge_ID = ?", [judgeId]);
  if (judgeRows.length === 0) throw new BadRequestError("Invalid judge selected.");
  const judgeName = judgeRows[0].Judge_Name;

  const [clientRows] = await pool.query("SELECT Client_ID, Client_Name FROM Client_Master WHERE Client_ID IN (?)", [clientIds]);
  if (clientRows.length === 0) throw new BadRequestError("Invalid client(s) selected.");

  const [advocateRows] = await pool.query("SELECT Advocate_ID, Advocate_Name FROM Advocate_Master WHERE Advocate_ID IN (?)", [advocateIds]);
  if (advocateRows.length === 0) throw new BadRequestError("Invalid advocate(s) selected.");

  const createdBy = user.email || user.fullName || "admin";
  let firstInsertId = null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const clientRow of clientRows) {
      for (const advocateRow of advocateRows) {
        const insertId = await hearingRepository.create({
          clientId: clientRow.Client_ID,
          caseId,
          advocateId: advocateRow.Advocate_ID,
          clientName: clientRow.Client_Name,
          caseName,
          purposeText: hearingPurpose,
          hearingDate: date,
          time,
          courtName,
          judgeName,
          createdBy
        }, connection);
        if (!firstInsertId) firstInsertId = insertId;
      }
    }

    await connection.commit();
    return { id: firstInsertId, message: "Hearing created." };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updateHearing(id, body, user) {
  const {
    clientIds,
    caseId,
    advocateIds,
    date,
    time,
    courtId,
    judgeId,
    hearingPurpose
  } = body;

  if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
    throw new BadRequestError("At least one client must be selected.");
  }
  if (!caseId) {
    throw new BadRequestError("Case is required.");
  }
  if (!advocateIds || !Array.isArray(advocateIds) || advocateIds.length === 0) {
    throw new BadRequestError("At least one advocate must be selected.");
  }
  if (!date || !time) {
    throw new BadRequestError("Date and time are required.");
  }
  if (!courtId || !judgeId) {
    throw new BadRequestError("Court and Judge are required.");
  }

  // Fetch the existing hearing
  const hearing = await hearingRepository.getById(id);
  if (!hearing) throw new NotFoundError("Hearing not found.");

  // Get all related row IDs (for all clients/advocates on this logical hearing)
  const relatedRows = await hearingRepository.getRelatedHearingRows(hearing.caseId, hearing.hearingDate, hearing.time);
  const existingIds = relatedRows.map(r => r.id);

  // Future check: date & time must be in the future
  const selectedDateTime = new Date(`${date}T${time}:00`);
  if (isNaN(selectedDateTime.getTime())) {
    throw new BadRequestError("Invalid date or time format.");
  }
  if (selectedDateTime.getTime() <= Date.now()) {
    throw new BadRequestError("Hearing can only be created after the current date and time.");
  }

  // Check unique active hearing for Case_ID (excluding current hearing rows)
  const hasActive = await hearingRepository.checkActiveHearing(caseId, existingIds);
  if (hasActive) {
    throw new BadRequestError("There is already a scheduled/active hearing for this Case.");
  }

  // Check advocate overlaps (excluding current hearing rows)
  const overlapping = await hearingRepository.checkAdvocateOverlaps(advocateIds, date, time, existingIds);
  if (overlapping.length > 0) {
    const names = overlapping.map(o => o.Advocate_Name).join(", ");
    throw new BadRequestError(`Advocate(s) ${names} has/have an overlapping hearing scheduled during this time.`);
  }

  // Resolve Names
  const [caseRows] = await pool.query("SELECT Case_Num FROM Case_Master WHERE Case_ID = ?", [caseId]);
  if (caseRows.length === 0) throw new BadRequestError("Invalid case selected.");
  const caseName = caseRows[0].Case_Num;

  const [courtRows] = await pool.query("SELECT Court_Name FROM Court_Master WHERE Court_ID = ?", [courtId]);
  if (courtRows.length === 0) throw new BadRequestError("Invalid court selected.");
  const courtName = courtRows[0].Court_Name;

  const [judgeRows] = await pool.query("SELECT Judge_Name FROM JUDGE_MASTER WHERE Judge_ID = ?", [judgeId]);
  if (judgeRows.length === 0) throw new BadRequestError("Invalid judge selected.");
  const judgeName = judgeRows[0].Judge_Name;

  const [clientRows] = await pool.query("SELECT Client_ID, Client_Name FROM Client_Master WHERE Client_ID IN (?)", [clientIds]);
  if (clientRows.length === 0) throw new BadRequestError("Invalid client(s) selected.");

  const [advocateRows] = await pool.query("SELECT Advocate_ID, Advocate_Name FROM Advocate_Master WHERE Advocate_ID IN (?)", [advocateIds]);
  if (advocateRows.length === 0) throw new BadRequestError("Invalid advocate(s) selected.");

  const modifiedBy = user.email || user.fullName || "admin";
  let firstNewInsertId = null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert new rows
    for (const clientRow of clientRows) {
      for (const advocateRow of advocateRows) {
        const insertId = await hearingRepository.create({
          clientId: clientRow.Client_ID,
          caseId,
          advocateId: advocateRow.Advocate_ID,
          clientName: clientRow.Client_Name,
          caseName,
          purposeText: hearingPurpose,
          hearingDate: date,
          time,
          courtName,
          judgeName,
          createdBy: hearing.createdBy
        }, connection);
        
        // Audit update info on new row
        await connection.query(
          `UPDATE HEARING_MASTER SET Hearing_Modified_By = ?, Hearing_Modified_Date = CURDATE() WHERE Hearing_ID = ?`,
          [modifiedBy, insertId]
        );

        if (!firstNewInsertId) firstNewInsertId = insertId;
      }
    }

    // Re-associate past notes to the new hearing
    await hearingRepository.reassociateNotes(existingIds, firstNewInsertId, connection);

    // Delete old rows
    await hearingRepository.deleteHearingRows(existingIds, connection);

    await connection.commit();
    return { message: "Hearing updated." };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function deleteHearing(id) {
  const hearing = await hearingRepository.getById(id);
  if (!hearing) throw new NotFoundError("Hearing not found.");

  // Get all related rows (same client, case, date, start time)
  const relatedRows = await hearingRepository.getRelatedHearingRows(hearing.caseId, hearing.hearingDate, hearing.time);
  const existingIds = relatedRows.map(r => r.id);

  await hearingRepository.softDeleteHearingRows(existingIds);
  return { message: "Deleted successfully." };
}

export async function listHearings(search, user) {
  const advocateId = user.role === "advocate" ? user.id : null;
  return hearingRepository.listHearings(search, advocateId);
}

export async function listCompletedHearings(search, user) {
  const advocateId = user.role === "advocate" ? user.id : null;
  return hearingRepository.listCompletedHearings(search, advocateId);
}

export async function getHearing(id) {
  const hearing = await hearingRepository.getById(id);
  if (!hearing) throw new NotFoundError("Hearing not found.");

  // Fetch all advocate IDs assigned to this logical hearing
  const relatedRows = await hearingRepository.getRelatedHearingRows(hearing.caseId, hearing.hearingDate, hearing.time);
  const advocateIds = relatedRows.map(r => r.advocateId);
  const clientIds = Array.from(new Set(relatedRows.map(r => r.clientId)));

  // Resolve Court and Judge IDs
  const [courtRows] = await pool.query("SELECT Court_ID FROM Court_Master WHERE Court_Name = ?", [hearing.courtName]);
  const [judgeRows] = await pool.query("SELECT Judge_ID FROM JUDGE_MASTER WHERE Judge_Name = ?", [hearing.judgeName]);

  return {
    id: hearing.id,
    clientId: hearing.clientId,
    clientIds,
    caseId: hearing.caseId,
    date: hearing.hearingDate,
    time: hearing.time,
    hearingPurpose: hearing.purposeText,
    courtId: courtRows[0]?.Court_ID || "",
    judgeId: judgeRows[0]?.Judge_ID || "",
    advocateIds
  };
}

export async function getHearingNotes(hearingId) {
  const hearing = await hearingRepository.getById(hearingId);
  if (!hearing) throw new NotFoundError("Hearing not found.");

  const notes = await hearingRepository.getNotes(hearingId);

  // Return comments structure similar to remarks
  return {
    remarks: notes,
    canAddRemark: true, // both roles can view, let's determine who can add: checking in routes/controllers
    validationMessage: ""
  };
}

export async function addHearingNote(hearingId, body, user) {
  const { remarkText, nextHearingDate, nextHearingPurpose } = body;

  if ((nextHearingDate || nextHearingPurpose) && (!nextHearingDate || !nextHearingPurpose || !nextHearingPurpose.trim())) {
    throw new BadRequestError("Both next hearing date and next hearing purpose must be entered.");
  }

  if ((!remarkText || !remarkText.trim()) && !nextHearingDate && !nextHearingPurpose) {
    throw new BadRequestError("Progress note text or next hearing details are required.");
  }

  const hearing = await hearingRepository.getById(hearingId);
  if (!hearing) throw new NotFoundError("Hearing not found.");

  let createdBy = user.email || user.fullName || "advocate";
  if (user.role === "admin") {
    const [rows] = await pool.query("SELECT full_name FROM users WHERE id = ?", [user.id]);
    if (rows[0]?.full_name) {
      createdBy = rows[0].full_name;
    }
  } else if (user.role === "advocate") {
    const advocateId = user.advocateId || user.id;
    const [rows] = await pool.query("SELECT Advocate_Name FROM Advocate_Master WHERE Advocate_ID = ?", [advocateId]);
    if (rows[0]?.Advocate_Name) {
      createdBy = rows[0].Advocate_Name;
    }
  }
  const noteId = await hearingRepository.addNote({
    hearingId,
    text: remarkText ? remarkText.trim() : "Next hearing details updated",
    nextHearingDate: nextHearingDate || null,
    nextHearingPurpose: nextHearingPurpose || null,
    createdBy
  });

  return { id: noteId, message: "Progress note added successfully." };
}
