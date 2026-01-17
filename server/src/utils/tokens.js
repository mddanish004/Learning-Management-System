import  jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export function signAccessToken(user){
    return jwt.sign(
        { sub: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
        
    );
}

export function signRefreshToken(sessionId){
    return jwt.sign(
        { sid: sessionId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
}

export function verifyAccessToken(token){
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token){
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

