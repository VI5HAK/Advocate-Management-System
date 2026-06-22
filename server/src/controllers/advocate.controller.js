import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 12;

function validatePasswordPair(password, confirmPassword, required) {
  if (!password && !confirmPassword) {
    if (required) {
      return { error: "Password and confirm password are required." };
    }
    return { passwordHash: null };
  }

  if (!password || !confirmPassword) {
    return { error: "Password and confirm password are required." };
  }
  if (password !== confirmPassword) {
    return { error: "Password and confirm password do not match." };
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return {
      error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    };
  }

  return { plainPassword: password };
}

async function parseAdvocateBody(body) {
  const advocateName = body.name?.trim();
  const roleIdNum = Number.parseInt(body.roleId, 10);
  const address = body.address?.trim();
  const city = body.city?.trim();
  const state = body.state?.trim();
  const pincode = String(body.Pincode || "").trim();
  const contactNumber = String(body.contactNumber || "").trim();
  const alternateContactNumber = String(body.alternateContactNumber || "").trim();
  const emailId = body.emailId?.trim();
  const panNumber = body.panNumber?.trim()?.toUpperCase();
  const aadhaar = String(body.aadhaarNumber || "").trim();

  if (!advocateName) {
    return { error: "Name is required." };
  }
  if (!roleIdNum || Number.isNaN(roleIdNum)) {
    return { error: "Role is required." };
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
  const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
  if (!panNumber || !panRegex.test(panNumber)) {
    return { error: "PAN number must be 5 alphabets, 4 digits, and 1 alphabet (e.g. ABCDE1234F)." };
  }
  if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
    return { error: "Aadhaar number must be exactly 12 digits." };
  }

  const passwordResult = validatePasswordPair(
    body.password,
    body.confirmPassword,
    true,
  );
  if (passwordResult.error) {
    return { error: passwordResult.error };
  }

  const passwordHash = await bcrypt.hash(passwordResult.plainPassword, 10);

  return {
    values: [
      roleIdNum,
      advocateName,
      address,
      city,
      state,
      Number.parseInt(pincode, 10),
      Number.parseInt(contactNumber, 10),
      Number.parseInt(alternateContactNumber, 10),
      emailId,
      panNumber,
      aadhaar,
    ],
    passwordHash,
  };
}

async function assertRoleExists(roleIdNum) {
  const [roles] = await pool.query(
    `SELECT Role_ID FROM Role_Master
     WHERE Role_ID = ?
       AND (Role_Delete_Flag = FALSE OR Role_Delete_Flag = 0)`,
    [roleIdNum],
  );
  return roles.length > 0;
}

const ADVOCATE_SELECT = `
  SELECT
    a.Advocate_ID AS id,
    a.Advocate_Role_ID AS roleId,
    a.Advocate_Name AS name,
    a.Advocate_Address AS address,
    a.Advocate_City AS city,
    a.Advocate_State AS state,
    a.Advocate_Pin_Code AS Pincode,
    a.Advocate_Cnt_Num AS contactNumber,
    a.Advocate_Alt_Cnt_Num AS alternateContactNumber,
    a.Advocate_Email_ID AS emailId,
    a.Advocate_PAN_Num AS panNumber,
    a.Advocate_Aadhaar_Num AS aadhaarNumber
  FROM Advocate_Master a
  WHERE a.Advocate_ID = ?
    AND (a.Advocate_Delete_Flag = FALSE OR a.Advocate_Delete_Flag = 0)
`;

export async function getAdvocate(req, res, next) {
  try {
    const [rows] = await pool.query(ADVOCATE_SELECT, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Advocate not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function createAdvocate(req, res, next) {
  try {
    const parsed = await parseAdvocateBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    if (!(await assertRoleExists(parsed.values[0]))) {
      return res.status(400).json({ message: "Invalid role selected." });
    }

    const [result] = await pool.query(
      `INSERT INTO Advocate_Master (
        Advocate_Role_ID,
        Advocate_Name,
        Advocate_Address,
        Advocate_City,
        Advocate_State,
        Advocate_Pin_Code,
        Advocate_Cnt_Num,
        Advocate_Alt_Cnt_Num,
        Advocate_Email_ID,
        Advocate_PAN_Num,
        Advocate_Aadhaar_Num,
        Advocate_PWD,
        Advocate_Created_Date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [...parsed.values, parsed.passwordHash],
    );

    res.status(201).json({ id: result.insertId, message: "Advocate created." });
  } catch (err) {
    next(err);
  }
}

export async function updateAdvocate(req, res, next) {
  try {
    const parsed = await parseAdvocateBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    if (!(await assertRoleExists(parsed.values[0]))) {
      return res.status(400).json({ message: "Invalid role selected." });
    }

    let sql = `UPDATE Advocate_Master SET
        Advocate_Role_ID = ?,
        Advocate_Name = ?,
        Advocate_Address = ?,
        Advocate_City = ?,
        Advocate_State = ?,
        Advocate_Pin_Code = ?,
        Advocate_Cnt_Num = ?,
        Advocate_Alt_Cnt_Num = ?,
        Advocate_Email_ID = ?,
        Advocate_PAN_Num = ?,
        Advocate_Aadhaar_Num = ?,
        Advocate_Modified_Date = CURDATE()`;
    const params = [...parsed.values];

    if (parsed.passwordHash) {
      sql += ", Advocate_PWD = ?";
      params.push(parsed.passwordHash);
    }

    sql += ` WHERE Advocate_ID = ?
        AND (Advocate_Delete_Flag = FALSE OR Advocate_Delete_Flag = 0)`;
    params.push(req.params.id);

    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Advocate not found." });
    }

    res.json({ message: "Advocate updated." });
  } catch (err) {
    next(err);
  }
}

export async function listAdvocates(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
    let sql = `
      SELECT
        a.Advocate_ID AS id,
        a.Advocate_Name AS advocateName,
        r.Role_Name AS roleName,
        a.Advocate_Cnt_Num AS contactNumber,
        a.Advocate_Email_ID AS emailId
      FROM Advocate_Master a
      INNER JOIN Role_Master r ON a.Advocate_Role_ID = r.Role_ID
      WHERE (a.Advocate_Delete_Flag = FALSE OR a.Advocate_Delete_Flag = 0)
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
      params.push(term, term, term, term);
    }

    sql += " ORDER BY a.Advocate_Name ASC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function deleteAdvocate(req, res, next) {
  try {
    const advocateId = req.params.id;

    // Check if the advocate is assigned to any active case
    const [caseRows] = await pool.query(
      `SELECT 1 FROM (
        SELECT Case_ID FROM Case_Master
        WHERE Case_Advocate_ID = ?
          AND (Case_Delete_Flag = FALSE OR Case_Delete_Flag = 0)
        UNION ALL
        SELECT a.Appoint_Case_ID FROM Appointment a
        INNER JOIN Case_Master c ON a.Appoint_Case_ID = c.Case_ID
        WHERE a.Appoint_Advocate_ID = ?
          AND (a.Appoint_Delete_Flag = FALSE OR a.Appoint_Delete_Flag = 0)
          AND (c.Case_Delete_Flag = FALSE OR c.Case_Delete_Flag = 0)
      ) AS assigned_cases
      LIMIT 1`,
      [advocateId, advocateId]
    );

    if (caseRows.length > 0) {
      return res.status(400).json({ message: "This advocate cannot be deleted because it is assigned to a case." });
    }

    const [result] = await pool.query(
      `UPDATE Advocate_Master
       SET Advocate_Delete_Flag = TRUE
       WHERE Advocate_ID = ?
         AND (Advocate_Delete_Flag = FALSE OR Advocate_Delete_Flag = 0)`,
      [advocateId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Advocate not found." });
    }

    res.json({ message: "Deleted successfully." });
  } catch (err) {
    next(err);
  }
}
