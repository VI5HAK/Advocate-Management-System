import pool from "../config/db.js";
import { getMasterConfig } from "../config/masters.js";

function buildListQuery(config, search) {
  const { table, idColumn, nameColumn, descriptionColumn, deleteFlagColumn } =
    config;

  let sql = `SELECT
      ${idColumn} AS id,
      ${nameColumn} AS name,
      ${descriptionColumn} AS description,
      ${deleteFlagColumn} AS deleteFlag
    FROM ${table}
    WHERE (${deleteFlagColumn} = FALSE OR ${deleteFlagColumn} = 0)`;

  const params = [];

  if (search) {
    sql += ` AND (${nameColumn} LIKE ? OR COALESCE(${descriptionColumn}, '') LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY ${nameColumn} ASC`;

  return { sql, params };
}

export async function listMasters(req, res, next) {
  try {
    const resource = req.params.resource;
    if (resource === "courts") {
      const search = req.query.search?.trim() || "";
      let sql = `
        SELECT
          c.Court_ID AS id,
          c.Court_Name AS name,
          c.Court_Description AS description,
          c.Court_Type AS courtType,
          c.State_ID AS State_ID,
          s.State_Name AS State_Name,
          c.District_ID AS District_ID,
          d.District_Name AS District_Name,
          c.Taluk_ID AS Taluk_ID,
          t.Taluk_Name AS Taluk_Name,
          c.Court_Delete_Flag AS deleteFlag
        FROM Court_Master c
        LEFT JOIN STATES s ON c.State_ID = s.State_ID
        LEFT JOIN DISTRICTS d ON c.District_ID = d.District_ID
        LEFT JOIN TALUKS t ON c.Taluk_ID = t.Taluk_ID
        WHERE (c.Court_Delete_Flag = FALSE OR c.Court_Delete_Flag = 0)
      `;
      const params = [];
      if (search) {
        sql += ` AND (c.Court_Name LIKE ? OR COALESCE(c.Court_Description, '') LIKE ? OR COALESCE(s.State_Name, '') LIKE ? OR COALESCE(d.District_Name, '') LIKE ? OR COALESCE(t.Taluk_Name, '') LIKE ? OR COALESCE(c.Court_Type, '') LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      sql += ` ORDER BY c.Court_Name ASC`;
      const [rows] = await pool.query(sql, params);
      return res.json(rows);
    }

    const config = getMasterConfig(resource);
    const search = req.query.search?.trim() || "";
    const { sql, params } = buildListQuery(config, search);

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function createMaster(req, res, next) {
  try {
    const resource = req.params.resource;
    if (resource === "courts") {
      const { name, description, State_ID, District_ID, Taluk_ID, courtType } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ message: "Name is required." });
      }
      if (!courtType) {
        return res.status(400).json({ message: "Court Type is required." });
      }
      if (!State_ID) {
        return res.status(400).json({ message: "State is required." });
      }
      if (!District_ID) {
        return res.status(400).json({ message: "District is required." });
      }
      if (!Taluk_ID) {
        return res.status(400).json({ message: "Taluk is required." });
      }

      // Check if duplicate court name exists (active record, ignoring spaces/case)
      const [existing] = await pool.query(
        `SELECT 1 FROM Court_Master
         WHERE REPLACE(LOWER(Court_Name), ' ', '') = REPLACE(LOWER(?), ' ', '')
           AND (Court_Delete_Flag = FALSE OR Court_Delete_Flag = 0)
         LIMIT 1`,
        [name.trim()]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Name already exists." });
      }

      const [result] = await pool.query(
        `INSERT INTO Court_Master (Court_Name, Court_Description, Court_Type, State_ID, District_ID, Taluk_ID, Court_Delete_Flag)
         VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
        [name.trim().replace(/\s+/g, ' '), description?.trim() || null, courtType, State_ID, District_ID, Taluk_ID],
      );

      const [rows] = await pool.query(
        `SELECT
           c.Court_ID AS id,
           c.Court_Name AS name,
           c.Court_Description AS description,
           c.Court_Type AS courtType,
           c.State_ID AS State_ID,
           s.State_Name AS State_Name,
           c.District_ID AS District_ID,
           d.District_Name AS District_Name,
           c.Taluk_ID AS Taluk_ID,
           t.Taluk_Name AS Taluk_Name,
           c.Court_Delete_Flag AS deleteFlag
         FROM Court_Master c
         LEFT JOIN STATES s ON c.State_ID = s.State_ID
         LEFT JOIN DISTRICTS d ON c.District_ID = d.District_ID
         LEFT JOIN TALUKS t ON c.Taluk_ID = t.Taluk_ID
         WHERE c.Court_ID = ?`,
        [result.insertId],
      );

      return res.status(201).json(rows[0]);
    }

    const config = getMasterConfig(resource);
    const { table, idColumn, nameColumn, descriptionColumn, deleteFlagColumn } =
      config;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    // Check if duplicate master name exists (active record, ignoring spaces/case)
    const [existing] = await pool.query(
      `SELECT 1 FROM ${table}
       WHERE REPLACE(LOWER(${nameColumn}), ' ', '') = REPLACE(LOWER(?), ' ', '')
         AND (${deleteFlagColumn} = FALSE OR ${deleteFlagColumn} = 0)
       LIMIT 1`,
      [name.trim()]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Name already exists." });
    }

    const [result] = await pool.query(
      `INSERT INTO ${table} (${nameColumn}, ${descriptionColumn}, ${deleteFlagColumn})
       VALUES (?, ?, FALSE)`,
      [name.trim().replace(/\s+/g, ' '), description?.trim() || null],
    );

    const [rows] = await pool.query(
      `SELECT
         ${idColumn} AS id,
         ${nameColumn} AS name,
         ${descriptionColumn} AS description,
         ${deleteFlagColumn} AS deleteFlag
       FROM ${table}
       WHERE ${idColumn} = ?`,
      [result.insertId],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Name already exists." });
    }
    next(err);
  }
}

export async function updateMaster(req, res, next) {
  try {
    const resource = req.params.resource;
    const id = req.params.id;

    if (resource === "courts") {
      const { name, description, State_ID, District_ID, Taluk_ID, courtType } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ message: "Name is required." });
      }
      if (!courtType) {
        return res.status(400).json({ message: "Court Type is required." });
      }
      if (!State_ID) {
        return res.status(400).json({ message: "State is required." });
      }
      if (!District_ID) {
        return res.status(400).json({ message: "District is required." });
      }
      if (!Taluk_ID) {
        return res.status(400).json({ message: "Taluk is required." });
      }

      // Check if duplicate court name exists (excluding current court, ignoring spaces/case)
      const [existing] = await pool.query(
        `SELECT 1 FROM Court_Master
         WHERE REPLACE(LOWER(Court_Name), ' ', '') = REPLACE(LOWER(?), ' ', '')
           AND Court_ID != ?
           AND (Court_Delete_Flag = FALSE OR Court_Delete_Flag = 0)
         LIMIT 1`,
        [name.trim(), id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Name already exists." });
      }

      const [result] = await pool.query(
        `UPDATE Court_Master
         SET Court_Name = ?, Court_Description = ?, Court_Type = ?, State_ID = ?, District_ID = ?, Taluk_ID = ?
         WHERE Court_ID = ? AND (Court_Delete_Flag = FALSE OR Court_Delete_Flag = 0)`,
        [name.trim().replace(/\s+/g, ' '), description?.trim() || null, courtType, State_ID, District_ID, Taluk_ID, id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Record not found." });
      }

      const [rows] = await pool.query(
        `SELECT
           c.Court_ID AS id,
           c.Court_Name AS name,
           c.Court_Description AS description,
           c.Court_Type AS courtType,
           c.State_ID AS State_ID,
           s.State_Name AS State_Name,
           c.District_ID AS District_ID,
           d.District_Name AS District_Name,
           c.Taluk_ID AS Taluk_ID,
           t.Taluk_Name AS Taluk_Name,
           c.Court_Delete_Flag AS deleteFlag
         FROM Court_Master c
         LEFT JOIN STATES s ON c.State_ID = s.State_ID
         LEFT JOIN DISTRICTS d ON c.District_ID = d.District_ID
         LEFT JOIN TALUKS t ON c.Taluk_ID = t.Taluk_ID
         WHERE c.Court_ID = ?`,
         [id],
      );

      return res.json(rows[0]);
    }

    const config = getMasterConfig(resource);
    const { table, idColumn, nameColumn, descriptionColumn, deleteFlagColumn } =
      config;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    // Check if duplicate master name exists (excluding current record, ignoring spaces/case)
    const [existing] = await pool.query(
      `SELECT 1 FROM ${table}
       WHERE REPLACE(LOWER(${nameColumn}), ' ', '') = REPLACE(LOWER(?), ' ', '')
         AND ${idColumn} != ?
         AND (${deleteFlagColumn} = FALSE OR ${deleteFlagColumn} = 0)
       LIMIT 1`,
      [name.trim(), id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Name already exists." });
    }

    const [result] = await pool.query(
      `UPDATE ${table}
       SET ${nameColumn} = ?, ${descriptionColumn} = ?
       WHERE ${idColumn} = ? AND (${deleteFlagColumn} = FALSE OR ${deleteFlagColumn} = 0)`,
      [name.trim().replace(/\s+/g, ' '), description?.trim() || null, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found." });
    }

    const [rows] = await pool.query(
      `SELECT
         ${idColumn} AS id,
         ${nameColumn} AS name,
         ${descriptionColumn} AS description,
         ${deleteFlagColumn} AS deleteFlag
       FROM ${table}
       WHERE ${idColumn} = ?`,
      [id],
    );

    res.json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Name already exists." });
    }
    next(err);
  }
}

const MASTER_REFERENCES = {
  roles: [
    {
      table: "Advocate_Master",
      column: "Advocate_Role_ID",
      deleteFlagColumn: "Advocate_Delete_Flag",
      message: "This role is assigned to one or more advocates.",
    },
  ],
  "client-types": [
    {
      table: "Client_Master",
      column: "Client_Clnt_Type_ID",
      deleteFlagColumn: "Client_Delete_Flag",
      message: "This client type is assigned to one or more clients.",
    },
  ],
  "case-types": [
    {
      table: "Case_Master",
      column: "Case_Case_Type_ID",
      deleteFlagColumn: "Case_Delete_Flag",
      message: "This case type is assigned to one or more cases.",
    },
  ],
  courts: [
    {
      table: "Case_Master",
      column: "Case_Court_ID",
      deleteFlagColumn: "Case_Delete_Flag",
      message: "This court is assigned to one or more cases.",
    },
  ],
  judges: [],
  statuses: [],
};

export async function deleteMaster(req, res, next) {
  try {
    const config = getMasterConfig(req.params.resource);
    const { table, idColumn, deleteFlagColumn } = config;
    const id = req.params.id;

    // Check if the master item is assigned or in use
    const refs = MASTER_REFERENCES[req.params.resource] || [];
    for (const ref of refs) {
      const [rows] = await pool.query(
        `SELECT 1 FROM ${ref.table}
         WHERE ${ref.column} = ?
           AND (${ref.deleteFlagColumn} = FALSE OR ${ref.deleteFlagColumn} = 0)
         LIMIT 1`,
        [id]
      );
      if (rows.length > 0) {
        return res.status(400).json({ message: ref.message || "This master item is in use or assigned." });
      }
    }

    const [result] = await pool.query(
      `UPDATE ${table}
       SET ${deleteFlagColumn} = TRUE
       WHERE ${idColumn} = ? AND (${deleteFlagColumn} = FALSE OR ${deleteFlagColumn} = 0)`,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found." });
    }

    res.json({ message: "Deleted successfully." });
  } catch (err) {
    next(err);
  }
}
