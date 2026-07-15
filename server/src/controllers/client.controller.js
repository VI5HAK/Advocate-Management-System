import * as clientService from "../services/client.service.js";

export async function getClient(req, res, next) {
  try {
    const client = await clientService.getClient(req.params.id);
    res.json(client);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function createClient(req, res, next) {
  try {
    const result = await clientService.createClient(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function updateClient(req, res, next) {
  try {
    const result = await clientService.updateClient(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function listClients(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
    const clients = await clientService.listClients(search);
    res.json(clients);
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(req, res, next) {
  try {
    const result = await clientService.deleteClient(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}
