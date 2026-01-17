import { verifyAccessToken } from "../utils/tokens.js";


export function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.sendStatus(401);

  const token = header.split(" ")[1];

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.sendStatus(403);
  }
}