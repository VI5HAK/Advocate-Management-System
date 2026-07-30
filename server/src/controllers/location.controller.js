import pool from "../config/db.js";

export async function getStates(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT STATE_CODE as stateCode, STATE_NAME as stateName FROM STATES ORDER BY STATE_NAME ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getDistricts(req, res, next) {
  try {
    const stateCode = req.query.stateCode;
    if (!stateCode) {
      return res.status(400).json({ message: "stateCode query parameter is required." });
    }
    const [rows] = await pool.query(
      `SELECT DISTRICT_CODE as districtCode, STATE_CODE as stateCode, DISTRICT_NAME as districtName 
       FROM DISTRICTS 
       WHERE STATE_CODE = ? 
       ORDER BY DISTRICT_NAME ASC`,
      [stateCode]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getTaluks(req, res, next) {
  try {
    const districtCode = req.query.districtCode;
    if (!districtCode) {
      return res.status(400).json({ message: "districtCode query parameter is required." });
    }
    const [rows] = await pool.query(
      `SELECT TALUK_CODE as talukCode, DISTRICT_CODE as districtCode, TALUK_NAME as talukName 
       FROM TALUKS 
       WHERE DISTRICT_CODE = ? 
       ORDER BY TALUK_NAME ASC`,
      [districtCode]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function createState(req, res, next) {
  try {
    const { stateName } = req.body;
    if (!stateName || !stateName.trim()) {
      return res.status(400).json({ message: "State name is required." });
    }
    const [result] = await pool.query(
      "INSERT INTO STATES (STATE_NAME) VALUES (?)",
      [stateName.trim()]
    );
    res.status(201).json({ stateCode: result.insertId, stateName: stateName.trim() });
  } catch (err) {
    next(err);
  }
}

export async function updateState(req, res, next) {
  try {
    const { code } = req.params;
    const { stateName } = req.body;
    if (!stateName || !stateName.trim()) {
      return res.status(400).json({ message: "State name is required." });
    }
    await pool.query(
      "UPDATE STATES SET STATE_NAME = ? WHERE STATE_CODE = ?",
      [stateName.trim(), code]
    );
    res.json({ stateCode: Number(code), stateName: stateName.trim() });
  } catch (err) {
    next(err);
  }
}

export async function deleteState(req, res, next) {
  try {
    const { code } = req.params;
    const [districts] = await pool.query(
      "SELECT COUNT(*) as count FROM DISTRICTS WHERE STATE_CODE = ?",
      [code]
    );
    if (districts[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete State because it has mapped Districts."
      });
    }
    await pool.query("DELETE FROM STATES WHERE STATE_CODE = ?", [code]);
    res.json({ message: "State deleted successfully." });
  } catch (err) {
    next(err);
  }
}

export async function createDistrict(req, res, next) {
  try {
    const { stateCode, districtName } = req.body;
    if (!stateCode) {
      return res.status(400).json({ message: "State selection is required." });
    }
    if (!districtName || !districtName.trim()) {
      return res.status(400).json({ message: "District name is required." });
    }
    const [result] = await pool.query(
      "INSERT INTO DISTRICTS (STATE_CODE, DISTRICT_NAME) VALUES (?, ?)",
      [stateCode, districtName.trim()]
    );
    res.status(201).json({ districtCode: result.insertId, stateCode, districtName: districtName.trim() });
  } catch (err) {
    next(err);
  }
}

export async function updateDistrict(req, res, next) {
  try {
    const { code } = req.params;
    const { stateCode, districtName } = req.body;
    if (!stateCode) {
      return res.status(400).json({ message: "State selection is required." });
    }
    if (!districtName || !districtName.trim()) {
      return res.status(400).json({ message: "District name is required." });
    }
    await pool.query(
      "UPDATE DISTRICTS SET STATE_CODE = ?, DISTRICT_NAME = ? WHERE DISTRICT_CODE = ?",
      [stateCode, districtName.trim(), code]
    );
    res.json({ districtCode: Number(code), stateCode, districtName: districtName.trim() });
  } catch (err) {
    next(err);
  }
}

export async function deleteDistrict(req, res, next) {
  try {
    const { code } = req.params;
    const [taluks] = await pool.query(
      "SELECT COUNT(*) as count FROM TALUKS WHERE DISTRICT_CODE = ?",
      [code]
    );
    if (taluks[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete District because it has mapped Taluks."
      });
    }
    await pool.query("DELETE FROM DISTRICTS WHERE DISTRICT_CODE = ?", [code]);
    res.json({ message: "District deleted successfully." });
  } catch (err) {
    next(err);
  }
}

export async function createTaluk(req, res, next) {
  try {
    const { districtCode, talukName } = req.body;
    if (!districtCode) {
      return res.status(400).json({ message: "District selection is required." });
    }
    if (!talukName || !talukName.trim()) {
      return res.status(400).json({ message: "Taluk name is required." });
    }
    const [result] = await pool.query(
      "INSERT INTO TALUKS (DISTRICT_CODE, TALUK_NAME) VALUES (?, ?)",
      [districtCode, talukName.trim()]
    );
    res.status(201).json({ talukCode: result.insertId, districtCode, talukName: talukName.trim() });
  } catch (err) {
    next(err);
  }
}

export async function updateTaluk(req, res, next) {
  try {
    const { code } = req.params;
    const { districtCode, talukName } = req.body;
    if (!districtCode) {
      return res.status(400).json({ message: "District selection is required." });
    }
    if (!talukName || !talukName.trim()) {
      return res.status(400).json({ message: "Taluk name is required." });
    }
    await pool.query(
      "UPDATE TALUKS SET DISTRICT_CODE = ?, TALUK_NAME = ? WHERE TALUK_CODE = ?",
      [districtCode, talukName.trim(), code]
    );
    res.json({ talukCode: Number(code), districtCode, talukName: talukName.trim() });
  } catch (err) {
    next(err);
  }
}

export async function deleteTaluk(req, res, next) {
  try {
    const { code } = req.params;
    await pool.query("DELETE FROM TALUKS WHERE TALUK_CODE = ?", [code]);
    res.json({ message: "Taluk deleted successfully." });
  } catch (err) {
    next(err);
  }
}

