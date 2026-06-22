import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const MIN_PASSWORD_LENGTH = 6;

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function validatePasswordPair(password, confirmPassword, label = "Password") {
  if (!password || !confirmPassword) {
    return { error: `${label} and confirm password are required.` };
  }
  if (password !== confirmPassword) {
    return { error: "Password and confirm password do not match." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `${label} must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  return null;
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [adminRows] = await pool.query(
      "SELECT id, email, password_hash, full_name FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    if (adminRows[0]) {
      const admin = adminRows[0];
      const isValid = await bcrypt.compare(password, admin.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const user = {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: "admin",
      };

      return res.json({
        token: signToken({
          id: admin.id,
          email: admin.email,
          role: "admin",
        }),
        user,
      });
    }

    const [advocateRows] = await pool.query(
      `SELECT Advocate_ID, Advocate_Name, Advocate_Email_ID, Advocate_PWD
       FROM Advocate_Master
       WHERE LOWER(Advocate_Email_ID) = ?
         AND Advocate_PWD IS NOT NULL
         AND (Advocate_Delete_Flag = FALSE OR Advocate_Delete_Flag = 0)
       LIMIT 1`,
      [normalizedEmail],
    );

    const advocate = advocateRows[0];
    if (!advocate) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isValid = await bcrypt.compare(password, advocate.Advocate_PWD);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = {
      id: advocate.Advocate_ID,
      advocateId: advocate.Advocate_ID,
      email: advocate.Advocate_Email_ID,
      fullName: advocate.Advocate_Name,
      role: "advocate",
    };

    res.json({
      token: signToken({
        id: advocate.Advocate_ID,
        advocateId: advocate.Advocate_ID,
        email: advocate.Advocate_Email_ID,
        role: "advocate",
      }),
      user,
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    if (req.user.role === "advocate") {
      const [rows] = await pool.query(
        `SELECT Advocate_ID, Advocate_Name, Advocate_Email_ID
         FROM Advocate_Master
         WHERE Advocate_ID = ?
           AND (Advocate_Delete_Flag = FALSE OR Advocate_Delete_Flag = 0)
         LIMIT 1`,
        [req.user.advocateId || req.user.id],
      );

      const advocate = rows[0];
      if (!advocate) {
        return res.status(404).json({ message: "User not found." });
      }

      return res.json({
        id: advocate.Advocate_ID,
        advocateId: advocate.Advocate_ID,
        email: advocate.Advocate_Email_ID,
        fullName: advocate.Advocate_Name,
        role: "advocate",
      });
    }

    const [rows] = await pool.query(
      "SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1",
      [req.user.id],
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: "admin",
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Current password, new password, and confirm password are required.",
      });
    }

    const validationError = validatePasswordPair(
      newPassword,
      confirmPassword,
      "New password",
    );
    if (validationError) {
      return res.status(400).json({ message: validationError.error });
    }

    if (req.user.role === "admin") {
      const [rows] = await pool.query(
        "SELECT id, password_hash FROM users WHERE id = ? LIMIT 1",
        [req.user.id],
      );
      const admin = rows[0];
      if (!admin) {
        return res.status(404).json({ message: "User not found." });
      }

      const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        passwordHash,
        admin.id,
      ]);

      return res.json({ message: "Password updated successfully." });
    }

    if (req.user.role === "advocate") {
      const advocateId = req.user.advocateId || req.user.id;
      const [rows] = await pool.query(
        `SELECT Advocate_ID, Advocate_PWD
         FROM Advocate_Master
         WHERE Advocate_ID = ?
           AND (Advocate_Delete_Flag = FALSE OR Advocate_Delete_Flag = 0)
         LIMIT 1`,
        [advocateId],
      );
      const advocate = rows[0];
      if (!advocate) {
        return res.status(404).json({ message: "User not found." });
      }

      const isValid = await bcrypt.compare(currentPassword, advocate.Advocate_PWD);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await pool.query(
        `UPDATE Advocate_Master
         SET Advocate_PWD = ?, Advocate_Modified_Date = CURDATE()
         WHERE Advocate_ID = ?`,
        [passwordHash, advocateId],
      );

      return res.json({ message: "Password updated successfully." });
    }

    return res.status(403).json({ message: "Access denied." });
  } catch (err) {
    next(err);
  }
}
