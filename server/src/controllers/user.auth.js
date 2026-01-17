import bcrypt from 'bcrypt'
import { db } from '../db/db.js';
import { users ,sessions } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { encrypt , decrypt} from '../utils/crypto.js';
import { eq } from 'drizzle-orm';


export async function register(req,res){
    const { name, email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 12);


    await db.insert(users).values({
        id: uuid(), 
        name,
        email,
        password_hash: passwordHash,
        role: "learner",

    });

    res.status(201).json({ message: "User created" });
}

export async function registerInstructor(req, res) {
    const { name, email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
        id: uuid(),
        name,
        email,
        password_hash: passwordHash,
        role: "instructor",
    });

    res.status(201).json({ message: "Instructor account created" });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const sessionId = uuid();
  const refreshToken = signRefreshToken(sessionId);

  await db.insert(sessions).values({
    id: sessionId,
    user_id: user.id,
    refresh_token: encrypt(refreshToken),
    user_agent: req.headers["user-agent"],
    ip_address: req.ip,
    expires_at: new Date(Date.now() + 7 * 86400000),
  });

   res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken: signAccessToken(user),
  });
}

export async function refresh(req, res) {
  const refreshToken = req.cookies.refresh_token;
  if(!refreshToken) return res.sendStatus(401);


   let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return res.sendStatus(403);
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, payload.sid),
  });

  if (!session || session.is_revoked) {
    return res.sendStatus(403);
  }

  if (decrypt(session.refresh_token) !== refreshToken) {
    return res.sendStatus(403);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user_id),
  });

  const newRefreshToken = signRefreshToken(session.id);

  await db
    .update(sessions)
    .set({
      refresh_token: encrypt(newRefreshToken),
      last_used_at: new Date(),
    })
    .where(eq(sessions.id, session.id));

    res.cookie("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken: signAccessToken(user),
  });
}

export async function logout(req, res) {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) return res.sendStatus(204);

  try {
    const payload = verifyRefreshToken(refreshToken);

    await db
      .update(sessions)
      .set({ is_revoked: true })
      .where(eq(sessions.id, payload.sid));
  } catch {
  }

  res.clearCookie("refresh_token", {
    path: "/api/auth/refresh",
  });

  res.sendStatus(204);
}
