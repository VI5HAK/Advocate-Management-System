import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const MIN_PASSWORD_LENGTH = 6;

function validatePasswordPair(password, confirmPassword) {
  if (!password || !confirmPassword) {
    return "Password and confirm password are required.";
  }
  if (password !== confirmPassword) {
    return "Password and confirm password do not match.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export async function listAdmins(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, full_name AS fullName FROM users ORDER BY email ASC",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function createAdmin(req, res, next) {
  try {
    const { email, fullName, password, confirmPassword } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const name = fullName?.trim();

    if (!normalizedEmail || !name) {
      return res.status(400).json({ message: "Email and full name are required." });
    }

    const passwordError = validatePasswordPair(password, confirmPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "An admin with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)",
      [normalizedEmail, passwordHash, name],
    );

    res.status(201).json({
      id: result.insertId,
      email: normalizedEmail,
      fullName: name,
      message: "Admin created.",
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdmin(req, res, next) {
  try {
    const adminId = Number.parseInt(req.params.id, 10);
    if (!adminId || Number.isNaN(adminId)) {
      return res.status(400).json({ message: "Invalid admin id." });
    }

    if (adminId === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [adminId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found." });
    }

    res.json({ message: "Admin deleted." });
  } catch (err) {
    next(err);
  }
}
