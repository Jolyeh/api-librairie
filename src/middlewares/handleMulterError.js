import multer from "multer";
import { sendResponse } from "../utils/response.js";

export function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return sendResponse(res, false, `Erreur Multer : ${err.message}`);
  } else if (err) {
    return sendResponse(res, false, err.message);
  }

  next();
}
