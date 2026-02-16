import { verifyAccessToken } from "../utils/tokens.js";
import { AuthError } from '../errors/index.js';


export function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    throw new AuthError('Authentication required');
  }

  const token = header.split(" ")[1];

  if (!token) {
    throw new AuthError('Authentication required');
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}
