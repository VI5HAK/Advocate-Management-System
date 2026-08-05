import * as advocateRepository from "../repositories/advocate.repository.js";
import * as roleRepository from "../repositories/role.repository.js";
import { hashPassword } from "../utils/password.js";

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

export class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = 400;
  }
}

export async function createAdvocate(advocateData, plainPassword) {
  const roleExists = await roleRepository.exists(advocateData.roleId);
  if (!roleExists) {
    throw new BadRequestError("Invalid role selected.");
  }

  const emailExists = await advocateRepository.getByEmail(advocateData.emailId);
  if (emailExists) {
    throw new BadRequestError("Email ID already exists.");
  }

  let passwordHash = null;
  if (plainPassword) {
    passwordHash = await hashPassword(plainPassword);
  }

  const insertId = await advocateRepository.create(advocateData, passwordHash);
  return { id: insertId, message: "Advocate created." };
}

export async function updateAdvocate(id, advocateData, plainPassword) {
  const roleExists = await roleRepository.exists(advocateData.roleId);
  if (!roleExists) {
    throw new BadRequestError("Invalid role selected.");
  }

  const emailExists = await advocateRepository.getByEmail(advocateData.emailId, id);
  if (emailExists) {
    throw new BadRequestError("Email ID already exists.");
  }

  let affectedRows;
  if (plainPassword) {
    const passwordHash = await hashPassword(plainPassword);
    affectedRows = await advocateRepository.updateWithPassword(id, advocateData, passwordHash);
  } else {
    affectedRows = await advocateRepository.updateBasic(id, advocateData);
  }

  if (affectedRows === 0) {
    throw new NotFoundError("Advocate not found.");
  }

  return { message: "Advocate updated." };
}

export async function getAdvocate(id) {
  const advocate = await advocateRepository.getById(id);
  if (!advocate) {
    throw new NotFoundError("Advocate not found.");
  }
  return advocate;
}

export async function listAdvocates(search) {
  return advocateRepository.list(search);
}

export async function deleteAdvocate(id) {
  const hasCases = await advocateRepository.checkAssignedCases(id);
  if (hasCases) {
    throw new BadRequestError("This advocate cannot be deleted because it is assigned to a case.");
  }

  const affectedRows = await advocateRepository.deleteById(id);
  if (affectedRows === 0) {
    throw new NotFoundError("Advocate not found.");
  }

  return { message: "Deleted successfully." };
}
