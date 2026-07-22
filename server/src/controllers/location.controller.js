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
