import jwt from "jsonwebtoken";

const EXPIRY = "30d";

export function signToken(userId) {
    return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: EXPIRY });
}

export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}
