import { verifyToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token requerido" });
    }
    try {
        const payload = verifyToken(header.slice(7));
        req.userId = payload.sub;
        next();
    } catch {
        res.status(401).json({ error: "Token inválido o expirado" });
    }
}
