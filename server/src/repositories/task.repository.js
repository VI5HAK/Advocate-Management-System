import pool from "../config/db.js";

export const taskRepository = {
  async findAll(search = "") {
    let query = `
      SELECT 
        t.Task_Mgmt_ID AS id,
        t.Task_Mgmt_Name AS name,
        t.Task_Mgmt_Desc AS description,
        t.Task_Mgmt_Client_ID AS clientId,
        c.Client_Name AS clientName,
        t.Task_Mgmt_Case_ID AS caseId,
        cm.Case_Num AS caseNumber,
        t.Task_Mgmt_Cat_ID AS catId,
        tc.Task_Cat_Name AS catName,
        t.Task_Mgmt_Advocate_ID AS advocateId,
        a.Advocate_Name AS advocateName,
        t.Task_Mgmt_Priority AS priority,
        t.Task_Mgmt_Start_Date AS startDate,
        t.Task_Mgmt_End_Date AS endDate,
        t.Task_Mgmt_Status_ID AS statusId,
        ts.Task_Status_Name AS statusName,
        t.Task_Mgmt_Created_By AS createdBy,
        t.Task_Mgmt_Created_Date AS createdDate,
        t.Task_Mgmt_Modified_By AS modifiedBy,
        t.Task_Mgmt_Modified_Date AS modifiedDate
      FROM Task_Management t
      LEFT JOIN Client_Master c ON t.Task_Mgmt_Client_ID = c.Client_ID
      LEFT JOIN Case_Master cm ON t.Task_Mgmt_Case_ID = cm.Case_ID
      INNER JOIN Task_Category_Master tc ON t.Task_Mgmt_Cat_ID = tc.Task_Cat_ID
      INNER JOIN Advocate_Master a ON t.Task_Mgmt_Advocate_ID = a.Advocate_ID
      INNER JOIN Task_Status_Master ts ON t.Task_Mgmt_Status_ID = ts.Task_Status_ID
      WHERE (t.Task_Mgmt_Delete_Flag = FALSE OR t.Task_Mgmt_Delete_Flag = 0)
    `;

    const params = [];
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += `
        AND (
          t.Task_Mgmt_Name LIKE ? OR
          c.Client_Name LIKE ? OR
          cm.Case_Num LIKE ? OR
          tc.Task_Cat_Name LIKE ? OR
          a.Advocate_Name LIKE ? OR
          ts.Task_Status_Name LIKE ?
        )
      `;
      params.push(term, term, term, term, term, term);
    }

    query += ` ORDER BY t.Task_Mgmt_ID DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT 
        t.Task_Mgmt_ID AS id,
        t.Task_Mgmt_Name AS name,
        t.Task_Mgmt_Desc AS description,
        t.Task_Mgmt_Client_ID AS clientId,
        c.Client_Name AS clientName,
        t.Task_Mgmt_Case_ID AS caseId,
        cm.Case_Num AS caseNumber,
        t.Task_Mgmt_Cat_ID AS catId,
        tc.Task_Cat_Name AS catName,
        t.Task_Mgmt_Advocate_ID AS advocateId,
        a.Advocate_Name AS advocateName,
        t.Task_Mgmt_Priority AS priority,
        t.Task_Mgmt_Start_Date AS startDate,
        t.Task_Mgmt_End_Date AS endDate,
        t.Task_Mgmt_Status_ID AS statusId,
        ts.Task_Status_Name AS statusName,
        t.Task_Mgmt_Created_By AS createdBy,
        t.Task_Mgmt_Created_Date AS createdDate,
        t.Task_Mgmt_Modified_By AS modifiedBy,
        t.Task_Mgmt_Modified_Date AS modifiedDate
      FROM Task_Management t
      LEFT JOIN Client_Master c ON t.Task_Mgmt_Client_ID = c.Client_ID
      LEFT JOIN Case_Master cm ON t.Task_Mgmt_Case_ID = cm.Case_ID
      INNER JOIN Task_Category_Master tc ON t.Task_Mgmt_Cat_ID = tc.Task_Cat_ID
      INNER JOIN Advocate_Master a ON t.Task_Mgmt_Advocate_ID = a.Advocate_ID
      INNER JOIN Task_Status_Master ts ON t.Task_Mgmt_Status_ID = ts.Task_Status_ID
      WHERE t.Task_Mgmt_ID = ?
        AND (t.Task_Mgmt_Delete_Flag = FALSE OR t.Task_Mgmt_Delete_Flag = 0)
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async create(data, userId) {
    const query = `
      INSERT INTO Task_Management (
        Task_Mgmt_Name,
        Task_Mgmt_Desc,
        Task_Mgmt_Client_ID,
        Task_Mgmt_Case_ID,
        Task_Mgmt_Cat_ID,
        Task_Mgmt_Advocate_ID,
        Task_Mgmt_Priority,
        Task_Mgmt_Start_Date,
        Task_Mgmt_End_Date,
        Task_Mgmt_Status_ID,
        Task_Mgmt_Created_By,
        Task_Mgmt_Created_Date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
    `;

    const params = [
      data.name,
      data.description || null,
      data.clientId || null,
      data.caseId || null,
      data.catId,
      data.advocateId,
      data.priority || "Medium",
      data.startDate || null,
      data.endDate || null,
      data.statusId,
      userId,
    ];

    const [result] = await pool.query(query, params);
    return result.insertId;
  },

  async update(id, data, userId) {
    const query = `
      UPDATE Task_Management SET
        Task_Mgmt_Name = ?,
        Task_Mgmt_Desc = ?,
        Task_Mgmt_Client_ID = ?,
        Task_Mgmt_Case_ID = ?,
        Task_Mgmt_Cat_ID = ?,
        Task_Mgmt_Advocate_ID = ?,
        Task_Mgmt_Priority = ?,
        Task_Mgmt_Start_Date = ?,
        Task_Mgmt_End_Date = ?,
        Task_Mgmt_Status_ID = ?,
        Task_Mgmt_Modified_By = ?,
        Task_Mgmt_Modified_Date = CURDATE()
      WHERE Task_Mgmt_ID = ?
        AND (Task_Mgmt_Delete_Flag = FALSE OR Task_Mgmt_Delete_Flag = 0)
    `;

    const params = [
      data.name,
      data.description || null,
      data.clientId || null,
      data.caseId || null,
      data.catId,
      data.advocateId,
      data.priority || "Medium",
      data.startDate || null,
      data.endDate || null,
      data.statusId,
      userId,
      id,
    ];

    const [result] = await pool.query(query, params);
    return result.affectedRows > 0;
  },

  async softDelete(id, userId) {
    const query = `
      UPDATE Task_Management SET
        Task_Mgmt_Delete_Flag = TRUE,
        Task_Mgmt_Modified_By = ?,
        Task_Mgmt_Modified_Date = CURDATE()
      WHERE Task_Mgmt_ID = ?
    `;

    const [result] = await pool.query(query, [userId, id]);
    return result.affectedRows > 0;
  },

  // Remarks
  async getRemarksByTaskId(taskId) {
    const query = `
      SELECT 
        tr.Task_Remark_ID AS id,
        tr.Task_Mgmt_ID AS taskId,
        tr.Task_Remark_Text AS remarkText,
        tr.Created_By_Role AS role,
        tr.Task_Remark_Created_Date AS createdDate,
        COALESCE(u.full_name, am.Advocate_Name, 'Unknown') AS authorName
      FROM Task_Remarks tr
      LEFT JOIN users u ON tr.User_ID = u.id AND tr.Created_By_Role = 'admin'
      LEFT JOIN Advocate_Master am ON tr.Advocate_ID = am.Advocate_ID AND tr.Created_By_Role = 'advocate'
      WHERE tr.Task_Mgmt_ID = ?
      ORDER BY tr.Task_Remark_Created_Date DESC
    `;

    const [rows] = await pool.query(query, [taskId]);
    return rows;
  },

  async addRemark({ taskId, remarkText, userId, advocateId, role }) {
    const query = `
      INSERT INTO Task_Remarks (
        Task_Mgmt_ID,
        Task_Remark_Text,
        User_ID,
        Advocate_ID,
        Created_By_Role
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      taskId,
      remarkText,
      role === "admin" ? userId : null,
      role === "advocate" ? advocateId : null,
      role,
    ]);

    return result.insertId;
  },

  // Files
  async getFilesByTaskId(taskId) {
    const query = `
      SELECT 
        tf.Task_File_ID AS id,
        tf.Task_Mgmt_ID AS taskId,
        tf.Task_File_Name AS fileName,
        tf.Task_File_Url AS fileUrl,
        tf.Uploaded_By_Role AS role,
        tf.Task_File_Uploaded_Date AS uploadedDate,
        COALESCE(u.full_name, am.Advocate_Name, 'Unknown') AS authorName
      FROM Task_Files tf
      LEFT JOIN users u ON tf.User_ID = u.id AND tf.Uploaded_By_Role = 'admin'
      LEFT JOIN Advocate_Master am ON tf.Advocate_ID = am.Advocate_ID AND tf.Uploaded_By_Role = 'advocate'
      WHERE tf.Task_Mgmt_ID = ?
      ORDER BY tf.Task_File_Uploaded_Date DESC
    `;

    const [rows] = await pool.query(query, [taskId]);
    return rows;
  },

  async addFile({ taskId, fileName, fileUrl, userId, advocateId, role }) {
    const query = `
      INSERT INTO Task_Files (
        Task_Mgmt_ID,
        Task_File_Name,
        Task_File_Url,
        User_ID,
        Advocate_ID,
        Uploaded_By_Role
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      taskId,
      fileName,
      fileUrl,
      role === "admin" ? userId : null,
      role === "advocate" ? advocateId : null,
      role,
    ]);

    return result.insertId;
  },

  async getFileById(fileId) {
    const query = `
      SELECT 
        Task_File_ID AS id,
        Task_Mgmt_ID AS taskId,
        Task_File_Name AS fileName,
        Task_File_Url AS fileUrl
      FROM Task_Files
      WHERE Task_File_ID = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [fileId]);
    return rows[0] || null;
  },

  async deleteFile(fileId) {
    const query = `DELETE FROM Task_Files WHERE Task_File_ID = ?`;
    const [result] = await pool.query(query, [fileId]);
    return result.affectedRows > 0;
  },
};

export default taskRepository;
