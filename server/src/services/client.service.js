import * as clientRepository from "../repositories/client.repository.js";
import * as clientTypeRepository from "../repositories/client-type.repository.js";
import { validateClient } from "../validators/client.validator.js";

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

export async function createClient(body, userId) {
  const clientType = await clientTypeRepository.getById(body.clientTypeId);
  if (!clientType) {
    throw new BadRequestError("Invalid client type selected.");
  }

  const validation = validateClient(body, clientType.name);
  if (validation.error) {
    throw new BadRequestError(validation.error);
  }

  const insertId = await clientRepository.create(validation.clientData, userId);
  return { id: insertId, message: "Client created." };
}

export async function updateClient(id, body, userId) {
  const clientType = await clientTypeRepository.getById(body.clientTypeId);
  if (!clientType) {
    throw new BadRequestError("Invalid client type selected.");
  }

  const validation = validateClient(body, clientType.name);
  if (validation.error) {
    throw new BadRequestError(validation.error);
  }

  const affectedRows = await clientRepository.update(id, validation.clientData, userId);
  if (affectedRows === 0) {
    throw new NotFoundError("Client not found.");
  }

  return { message: "Client updated." };
}

export async function getClient(id) {
  const client = await clientRepository.getById(id);
  if (!client) {
    throw new NotFoundError("Client not found.");
  }
  return client;
}

export async function listClients(search) {
  return clientRepository.list(search);
}

export async function deleteClient(id, userId) {
  const hasCases = await clientRepository.checkAssignedCases(id);
  if (hasCases) {
    throw new BadRequestError("This client cannot be deleted because it is assigned to a case.");
  }

  const affectedRows = await clientRepository.deleteById(id, userId);
  if (affectedRows === 0) {
    throw new NotFoundError("Client not found.");
  }

  return { message: "Deleted successfully." };
}
