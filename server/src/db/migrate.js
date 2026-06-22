import pool from "../config/db.js";

async function run() {
  try {
    console.log("Starting migration: Adding Appoint_Date to Appointment_Remarks...");

    // Add Appoint_Date column if it doesn't exist
    try {
      await pool.query("ALTER TABLE Appointment_Remarks ADD COLUMN Appoint_Date DATE");
      console.log("Column Appoint_Date added successfully.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("Column Appoint_Date already exists.");
      } else {
        throw err;
      }
    }

    // Populate existing remarks with the appointment's date
    const [result] = await pool.query(`
      UPDATE Appointment_Remarks r
      JOIN Appointment a ON r.Appoint_ID = a.Appoint_ID
      SET r.Appoint_Date = a.Appoint_Date
      WHERE r.Appoint_Date IS NULL
    `);

    console.log(`Updated ${result.affectedRows} existing remark records with their respective appointment dates.`);
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
