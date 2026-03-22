import { verifyAccessToken } from "../utils/tokens.js";

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.split(" ")[1];
  if (!token) return next();

  try {
    req.user = verifyAccessToken(token);
  } catch {
    // invalid token - continue without user
  }
  next();
}
