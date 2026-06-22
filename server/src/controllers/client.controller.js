import pool from "../config/db.js";

function isIndividualType(typeName) {
  return typeName?.trim().toLowerCase() === "individual";
}

async function getClientTypeById(clientTypeId) {
  const [rows] = await pool.query(
    `SELECT Client_Type_ID AS id, Client_Type_Name AS name
     FROM Client_Type_Master
     WHERE Client_Type_ID = ?
       AND (Client_Type_Delete_Flag = FALSE OR Client_Type_Delete_Flag = 0)`,
    [clientTypeId],
  );
  return rows[0] || null;
}

async function parseClientBody(body) {
  const clientName = body.name?.trim();
  const clientTypeId = Number.parseInt(body.clientTypeId, 10);
  const address = body.address?.trim();
  const city = body.city?.trim();
  const state = body.state?.trim();
  const pincode = String(body.Pincode || "").trim();
  const contactNumber = String(body.contactNumber || "").trim();
  const alternateContactNumber = String(body.alternateContactNumber || "").trim();
  const emailId = body.emailId?.trim();
  const panNumber = body.panNumber?.trim()?.toUpperCase();
  const gstNumber = body.gstNumber?.trim()?.toUpperCase();
  const aadhaar = String(body.aadhaarNumber || "").trim();
  const contactPerson = body.contactPerson?.trim();

  if (!clientName) {
    return { error: "Client name is required." };
  }
  if (!clientTypeId || Number.isNaN(clientTypeId)) {
    return { error: "Client type is required." };
  }

  const clientType = await getClientTypeById(clientTypeId);
  if (!clientType) {
    return { error: "Invalid client type selected." };
  }

  if (!address) {
    return { error: "Address is required." };
  }
  if (!city) {
    return { error: "City is required." };
  }
  if (!state) {
    return { error: "State is required." };
  }
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return { error: "Pincode must be exactly 6 digits." };
  }
  if (!contactNumber || !/^\d{10}$/.test(contactNumber)) {
    return { error: "Contact number must be exactly 10 digits." };
  }
  if (!alternateContactNumber || !/^\d{10}$/.test(alternateContactNumber)) {
    return { error: "Alternate contact number must be exactly 10 digits." };
  }
  if (!emailId) {
    return { error: "Email is required." };
  }
  if (!contactPerson) {
    return { error: "Contact person name is required." };
  }
  if (contactPerson.length > 50) {
    return { error: "Contact person name must not exceed 50 characters." };
  }

  const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
  if (!panNumber || !panRegex.test(panNumber)) {
    return { error: "PAN number must be 5 alphabets, 4 digits, and 1 alphabet (e.g. ABCDE1234F)." };
  }

  const individual = isIndividualType(clientType.name);
  if (individual) {
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      return { error: "Aadhaar number must be exactly 12 digits." };
    }
  } else {
    const gstRegex = /^[A-Z0-9]{15}$/;
    if (!gstNumber || !gstRegex.test(gstNumber)) {
      return { error: "GST number must be exactly 15 alphanumeric characters." };
    }
  }

  return {
    values: [
      clientTypeId,
      clientName,
      address,
      city,
      state,
      Number.parseInt(pincode, 10),
      Number.parseInt(contactNumber, 10),
      Number.parseInt(alternateContactNumber, 10),
      emailId,
      individual ? null : gstNumber,
      panNumber,
      individual ? aadhaar : null,
      contactPerson,
    ],
  };
}

const CLIENT_SELECT = `
  SELECT
    c.Client_ID AS id,
    c.Client_Clnt_Type_ID AS clientTypeId,
    ct.Client_Type_Name AS clientTypeName,
    c.Client_Name AS name,
    c.Client_Address AS address,
    c.Client_City AS city,
    c.Client_State AS state,
    c.Client_Pin_Code AS Pincode,
    c.Client_Cnt_Num AS contactNumber,
    c.Client_Alt_Cnt_Num AS alternateContactNumber,
    c.Client_Email_ID AS emailId,
    c.Client_GST_Num AS gstNumber,
    c.Client_PAN_Num AS panNumber,
    c.Client_Aadhaar_Num AS aadhaarNumber,
    c.Client_Contact_Person AS contactPerson
  FROM Client_Master c
  INNER JOIN Client_Type_Master ct ON c.Client_Clnt_Type_ID = ct.Client_Type_ID
  WHERE c.Client_ID = ?
    AND (c.Client_Delete_Flag = FALSE OR c.Client_Delete_Flag = 0)
`;

export async function getClient(req, res, next) {
  try {
    const [rows] = await pool.query(CLIENT_SELECT, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Client not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function createClient(req, res, next) {
  try {
    const parsed = await parseClientBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const [result] = await pool.query(
      `INSERT INTO Client_Master (
        Client_Clnt_Type_ID,
        Client_Name,
        Client_Address,
        Client_City,
        Client_State,
        Client_Pin_Code,
        Client_Cnt_Num,
        Client_Alt_Cnt_Num,
        Client_Email_ID,
        Client_GST_Num,
        Client_PAN_Num,
        Client_Aadhaar_Num,
        Client_Contact_Person,
        Client_Created_Date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      parsed.values,
    );

    res.status(201).json({ id: result.insertId, message: "Client created." });
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req, res, next) {
  try {
    const parsed = await parseClientBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const [result] = await pool.query(
      `UPDATE Client_Master SET
        Client_Clnt_Type_ID = ?,
        Client_Name = ?,
        Client_Address = ?,
        Client_City = ?,
        Client_State = ?,
        Client_Pin_Code = ?,
        Client_Cnt_Num = ?,
        Client_Alt_Cnt_Num = ?,
        Client_Email_ID = ?,
        Client_GST_Num = ?,
        Client_PAN_Num = ?,
        Client_Aadhaar_Num = ?,
        Client_Contact_Person = ?,
        Client_Modified_Date = CURDATE()
      WHERE Client_ID = ?
        AND (Client_Delete_Flag = FALSE OR Client_Delete_Flag = 0)`,
      [...parsed.values, req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Client not found." });
    }

    res.json({ message: "Client updated." });
  } catch (err) {
    next(err);
  }
}

export async function listClients(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
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
      WHERE (c.Client_Delete_Flag = FALSE OR c.Client_Delete_Flag = 0)
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
      params.push(term, term, term, term, term);
    }

    sql += " ORDER BY c.Client_Name ASC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(req, res, next) {
  try {
    const clientId = req.params.id;

    // Check if the client is assigned to any active case
    const [caseRows] = await pool.query(
      `SELECT 1 FROM Appointment a
       INNER JOIN Case_Master c ON a.Appoint_Case_ID = c.Case_ID
       WHERE a.Appoint_Client_ID = ?
         AND (a.Appoint_Delete_Flag = FALSE OR a.Appoint_Delete_Flag = 0)
         AND (c.Case_Delete_Flag = FALSE OR c.Case_Delete_Flag = 0)
       LIMIT 1`,
      [clientId]
    );

    if (caseRows.length > 0) {
      return res.status(400).json({ message: "This client cannot be deleted because it is assigned to a case." });
    }

    const [result] = await pool.query(
      `UPDATE Client_Master
       SET Client_Delete_Flag = TRUE
       WHERE Client_ID = ?
         AND (Client_Delete_Flag = FALSE OR Client_Delete_Flag = 0)`,
      [clientId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Client not found." });
    }

    res.json({ message: "Deleted successfully." });
  } catch (err) {
    next(err);
  }
}
