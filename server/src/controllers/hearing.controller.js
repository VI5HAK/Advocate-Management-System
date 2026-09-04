import * as hearingService from "../services/hearing.service.js";

export async function createHearing(req, res, next) {
  try {
    const result = await hearingService.createHearing(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function updateHearing(req, res, next) {
  try {
    const result = await hearingService.updateHearing(req.params.id, req.body, req.user);
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function deleteHearing(req, res, next) {
  try {
    const result = await hearingService.deleteHearing(req.params.id, req.user?.id);
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function listHearings(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
    const hearings = await hearingService.listHearings(search, req.user);
    res.json(hearings);
  } catch (err) {
    next(err);
  }
}

export async function listCompletedHearings(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
    const caseId = req.query.caseId ? Number(req.query.caseId) : null;
    const hearings = await hearingService.listCompletedHearings(search, req.user, caseId);
    res.json(hearings);
  } catch (err) {
    next(err);
  }
}

export async function getHearing(req, res, next) {
  try {
    const hearing = await hearingService.getHearing(req.params.id);
    res.json(hearing);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function getHearingNotes(req, res, next) {
  try {
    const notes = await hearingService.getHearingNotes(req.params.hearingId);
    res.json(notes);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

export async function addHearingNote(req, res, next) {
  try {
    if (req.user.role !== "advocate") {
      return res.status(403).json({ message: "Only advocates can add progress notes." });
    }
    const result = await hearingService.addHearingNote(req.params.hearingId, req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}
