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
  const timeVal = time || "00:00:00";

  if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
    throw new BadRequestError("At least one client must be selected.");
  }
  if (!caseId) {
    throw new BadRequestError("Case is required.");
  }
  if (!advocateIds || !Array.isArray(advocateIds) || advocateIds.length === 0) {
    throw new BadRequestError("At least one advocate must be selected.");
  }
  if (!date) {
    throw new BadRequestError("Date is required.");
  }
  if (!courtId || !judgeId) {
    throw new BadRequestError("Court and Judge are required.");
  }

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (date < todayStr) {
    throw new BadRequestError("Hearing date must be today or a future date.");
  }

  // Check unique active hearing for Case_ID
  const hasActive = await hearingRepository.checkActiveHearing(caseId);
  if (hasActive) {
    throw new BadRequestError("There is already a scheduled/active hearing for this Case.");
  }

  // Resolve Names and verify existence
  const [caseRows] = await pool.query("SELECT Case_Num FROM Case_Master WHERE Case_ID = ?", [caseId]);
  if (caseRows.length === 0) throw new BadRequestError("Invalid case selected.");

  const [courtRows] = await pool.query("SELECT Court_Name FROM Court_Master WHERE Court_ID = ?", [courtId]);
  if (courtRows.length === 0) throw new BadRequestError("Invalid court selected.");

  const [judgeRows] = await pool.query("SELECT Judge_Name FROM JUDGE_MASTER WHERE Judge_ID = ?", [judgeId]);
  if (judgeRows.length === 0) throw new BadRequestError("Invalid judge selected.");

  const [clientRows] = await pool.query("SELECT Client_ID FROM Client_Master WHERE Client_ID IN (?)", [clientIds]);
  if (clientRows.length === 0) throw new BadRequestError("Invalid client(s) selected.");

  const [advocateRows] = await pool.query("SELECT Advocate_ID FROM Advocate_Master WHERE Advocate_ID IN (?)", [advocateIds]);
  if (advocateRows.length === 0) throw new BadRequestError("Invalid advocate(s) selected.");

  const createdBy = user?.id || null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const hearingId = await hearingRepository.create({
      caseId,
      courtId,
      judgeId,
      purposeText: hearingPurpose,
      hearingDate: date,
      time: timeVal,
      createdBy
    }, connection);

    await hearingRepository.addHearingClients(hearingId, clientIds, connection);
    await hearingRepository.addHearingAdvocates(hearingId, advocateIds, connection);

    await connection.commit();
    return { id: hearingId, message: "Hearing created." };
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
  const timeVal = time || "00:00:00";

  if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
    throw new BadRequestError("At least one client must be selected.");
  }
  if (!caseId) {
    throw new BadRequestError("Case is required.");
  }
  if (!advocateIds || !Array.isArray(advocateIds) || advocateIds.length === 0) {
    throw new BadRequestError("At least one advocate must be selected.");
  }
  if (!date) {
    throw new BadRequestError("Date is required.");
  }
  if (!courtId || !judgeId) {
    throw new BadRequestError("Court and Judge are required.");
  }

  // Fetch the existing hearing
  const hearing = await hearingRepository.getById(id);
  if (!hearing) throw new NotFoundError("Hearing not found.");

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (date < todayStr) {
    throw new BadRequestError("Hearing date must be today or a future date.");
  }

  // Check unique active hearing for Case_ID (excluding current hearing row)
  const hasActive = await hearingRepository.checkActiveHearing(caseId, [id]);
  if (hasActive) {
    throw new BadRequestError("There is already a scheduled/active hearing for this Case.");
  }

  // Verify selections exist
  const [caseRows] = await pool.query("SELECT Case_Num FROM Case_Master WHERE Case_ID = ?", [caseId]);
  if (caseRows.length === 0) throw new BadRequestError("Invalid case selected.");

  const [courtRows] = await pool.query("SELECT Court_Name FROM Court_Master WHERE Court_ID = ?", [courtId]);
  if (courtRows.length === 0) throw new BadRequestError("Invalid court selected.");

  const [judgeRows] = await pool.query("SELECT Judge_Name FROM JUDGE_MASTER WHERE Judge_ID = ?", [judgeId]);
  if (judgeRows.length === 0) throw new BadRequestError("Invalid judge selected.");

  const [clientRows] = await pool.query("SELECT Client_ID FROM Client_Master WHERE Client_ID IN (?)", [clientIds]);
  if (clientRows.length === 0) throw new BadRequestError("Invalid client(s) selected.");

  const [advocateRows] = await pool.query("SELECT Advocate_ID FROM Advocate_Master WHERE Advocate_ID IN (?)", [advocateIds]);
  if (advocateRows.length === 0) throw new BadRequestError("Invalid advocate(s) selected.");

  const modifiedBy = user?.id || null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE HEARING_MASTER SET
        Case_ID = ?,
        Court_ID = ?,
        Judge_ID = ?,
        Purpose_Text = ?,
        Hearing_Date = ?,
        Hearing_Time = ?,
        Hearing_Modified_By = ?,
        Hearing_Modified_Date = CURDATE()
      WHERE Hearing_ID = ?`,
      [
        caseId,
        courtId,
        judgeId,
        hearingPurpose,
        date,
        timeVal,
        modifiedBy,
        id
      ]
    );

    await hearingRepository.deleteHearingClients(id, connection);
    await hearingRepository.deleteHearingAdvocates(id, connection);

    await hearingRepository.addHearingClients(id, clientIds, connection);
    await hearingRepository.addHearingAdvocates(id, advocateIds, connection);

    await connection.commit();
    return { message: "Hearing updated." };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function deleteHearing(id, userId) {
  const hearing = await hearingRepository.getById(id);
  if (!hearing) throw new NotFoundError("Hearing not found.");

  await hearingRepository.softDeleteHearingRows([id], userId);
  return { message: "Deleted successfully." };
}

export async function listHearings(search, user) {
  const advocateId = user.role === "advocate" ? (user.advocateId || user.id) : null;
  return hearingRepository.listHearings(search, advocateId);
}

export async function listCompletedHearings(search, user, caseId = null) {
  const advocateId = user.role === "advocate" ? (user.advocateId || user.id) : null;
  const hearings = await hearingRepository.listCompletedHearings(search, advocateId, caseId);

  if (caseId) {
    return hearings;
  }

  // Group by case to return a summary
  const grouped = {};
  for (const item of hearings) {
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
  return Object.values(grouped);
}

export async function getHearing(id) {
  const hearing = await hearingRepository.getById(id);
  if (!hearing) throw new NotFoundError("Hearing not found.");

  const clientIds = await hearingRepository.getHearingClientIds(id);
  const advocateIds = await hearingRepository.getHearingAdvocateIds(id);

  return {
    id: hearing.id,
    clientId: clientIds[0] || "",
    clientIds,
    caseId: hearing.caseId,
    date: hearing.hearingDate,
    time: hearing.time,
    hearingPurpose: hearing.purposeText,
    courtId: hearing.courtId,
    judgeId: hearing.judgeId,
    advocateIds
  };
}

export async function getHearingNotes(hearingId) {
  const hearing = await hearingRepository.getById(hearingId);
  if (!hearing) throw new NotFoundError("Hearing not found.");

  const notes = await hearingRepository.getNotes(hearingId);

  return {
    remarks: notes,
    canAddRemark: true,
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
