import * as advocateService from "../services/advocate.service.js";
import { validateAdvocate } from "../validators/advocate.validator.js";

export async function getAdvocate(req, res, next) {
  try {
    const advocate = await advocateService.getAdvocate(req.params.id);
    res.json(advocate);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function createAdvocate(req, res, next) {
  try {
    const validation = validateAdvocate(req.body, true);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const result = await advocateService.createAdvocate(validation.advocateData, validation.plainPassword);
    res.status(201).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function updateAdvocate(req, res, next) {
  try {
    // Pass false to make password optional during update
    const validation = validateAdvocate(req.body, false);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const result = await advocateService.updateAdvocate(req.params.id, validation.advocateData, validation.plainPassword);
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function listAdvocates(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
    const advocates = await advocateService.listAdvocates(search);
    res.json(advocates);
  } catch (err) {
    next(err);
  }
}

export async function deleteAdvocate(req, res, next) {
  try {
    const result = await advocateService.deleteAdvocate(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}
