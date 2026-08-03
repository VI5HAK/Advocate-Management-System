import pool from "../config/db.js";

export async function getStates(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT State_ID, State_Name FROM STATES ORDER BY State_Name ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getDistricts(req, res, next) {
  try {
    const State_ID = req.query.State_ID || req.query.stateCode;
    if (!State_ID) {
      return res.status(400).json({ message: "State_ID query parameter is required." });
    }
    const [rows] = await pool.query(
      `SELECT District_ID, State_ID, District_Name 
       FROM DISTRICTS 
       WHERE State_ID = ? 
       ORDER BY District_Name ASC`,
      [State_ID]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getTaluks(req, res, next) {
  try {
    const District_ID = req.query.District_ID || req.query.districtCode;
    if (!District_ID) {
      return res.status(400).json({ message: "District_ID query parameter is required." });
    }
    const [rows] = await pool.query(
      `SELECT Taluk_ID, District_ID, Taluk_Name 
       FROM TALUKS 
       WHERE District_ID = ? 
       ORDER BY Taluk_Name ASC`,
      [District_ID]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function createState(req, res, next) {
  try {
    const { State_Name } = req.body;
    if (!State_Name || !State_Name.trim()) {
      return res.status(400).json({ message: "State name is required." });
    }
    const [result] = await pool.query(
      "INSERT INTO STATES (State_Name, State_Created_By, State_Created_Date) VALUES (?, ?, CURDATE())",
      [State_Name.trim(), req.user?.id || null]
    );
    res.status(201).json({ State_ID: result.insertId, State_Name: State_Name.trim() });
  } catch (err) {
    next(err);
  }
}

export async function updateState(req, res, next) {
  try {
    const { code } = req.params;
    const { State_Name } = req.body;
    if (!State_Name || !State_Name.trim()) {
      return res.status(400).json({ message: "State name is required." });
    }
    await pool.query(
      "UPDATE STATES SET State_Name = ?, State_Modified_By = ?, State_Modified_Date = CURDATE() WHERE State_ID = ?",
      [State_Name.trim(), req.user?.id || null, code]
    );
    res.json({ State_ID: Number(code), State_Name: State_Name.trim() });
  } catch (err) {
    next(err);
  }
}

export async function deleteState(req, res, next) {
  try {
    const { code } = req.params;
    const [districts] = await pool.query(
      "SELECT COUNT(*) as count FROM DISTRICTS WHERE State_ID = ?",
      [code]
    );
    if (districts[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete State because it has mapped Districts."
      });
    }
    await pool.query("DELETE FROM STATES WHERE State_ID = ?", [code]);
    res.json({ message: "State deleted successfully." });
  } catch (err) {
    next(err);
  }
}

export async function createDistrict(req, res, next) {
  try {
    const { State_ID, District_Name } = req.body;
    if (!State_ID) {
      return res.status(400).json({ message: "State selection is required." });
    }
    if (!District_Name || !District_Name.trim()) {
      return res.status(400).json({ message: "District name is required." });
    }
    const [result] = await pool.query(
      "INSERT INTO DISTRICTS (State_ID, District_Name, District_Created_By, District_Created_Date) VALUES (?, ?, ?, CURDATE())",
      [State_ID, District_Name.trim(), req.user?.id || null]
    );
    res.status(201).json({ District_ID: result.insertId, State_ID, District_Name: District_Name.trim() });
  } catch (err) {
    next(err);
  }
}

export async function updateDistrict(req, res, next) {
  try {
    const { code } = req.params;
    const { State_ID, District_Name } = req.body;
    if (!State_ID) {
      return res.status(400).json({ message: "State selection is required." });
    }
    if (!District_Name || !District_Name.trim()) {
      return res.status(400).json({ message: "District name is required." });
    }
    await pool.query(
      "UPDATE DISTRICTS SET State_ID = ?, District_Name = ?, District_Modified_By = ?, District_Modified_Date = CURDATE() WHERE District_ID = ?",
      [State_ID, District_Name.trim(), req.user?.id || null, code]
    );
    res.json({ District_ID: Number(code), State_ID, District_Name: District_Name.trim() });
  } catch (err) {
    next(err);
  }
}

export async function deleteDistrict(req, res, next) {
  try {
    const { code } = req.params;
    const [taluks] = await pool.query(
      "SELECT COUNT(*) as count FROM TALUKS WHERE District_ID = ?",
      [code]
    );
    if (taluks[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete District because it has mapped Taluks."
      });
    }
    await pool.query("DELETE FROM DISTRICTS WHERE District_ID = ?", [code]);
    res.json({ message: "District deleted successfully." });
  } catch (err) {
    next(err);
  }
}

export async function createTaluk(req, res, next) {
  try {
    const { District_ID, Taluk_Name } = req.body;
    if (!District_ID) {
      return res.status(400).json({ message: "District selection is required." });
    }
    if (!Taluk_Name || !Taluk_Name.trim()) {
      return res.status(400).json({ message: "Taluk name is required." });
    }
    const [result] = await pool.query(
      "INSERT INTO TALUKS (District_ID, Taluk_Name, Taluk_Created_By, Taluk_Created_Date) VALUES (?, ?, ?, CURDATE())",
      [District_ID, Taluk_Name.trim(), req.user?.id || null]
    );
    res.status(201).json({ Taluk_ID: result.insertId, District_ID, Taluk_Name: Taluk_Name.trim() });
  } catch (err) {
    next(err);
  }
}

export async function updateTaluk(req, res, next) {
  try {
    const { code } = req.params;
    const { District_ID, Taluk_Name } = req.body;
    if (!District_ID) {
      return res.status(400).json({ message: "District selection is required." });
    }
    if (!Taluk_Name || !Taluk_Name.trim()) {
      return res.status(400).json({ message: "Taluk name is required." });
    }
    await pool.query(
      "UPDATE TALUKS SET District_ID = ?, Taluk_Name = ?, Taluk_Modified_By = ?, Taluk_Modified_Date = CURDATE() WHERE Taluk_ID = ?",
      [District_ID, Taluk_Name.trim(), req.user?.id || null, code]
    );
    res.json({ Taluk_ID: Number(code), District_ID, Taluk_Name: Taluk_Name.trim() });
  } catch (err) {
    next(err);
  }
}

export async function deleteTaluk(req, res, next) {
  try {
    const { code } = req.params;
    await pool.query("DELETE FROM TALUKS WHERE Taluk_ID = ?", [code]);
    res.json({ message: "Taluk deleted successfully." });
  } catch (err) {
    next(err);
  }
}
