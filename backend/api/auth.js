import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";
import { getTurso } from "../utils/turso.js";
import { signToken } from "../utils/jwt.js";
import { authMiddleware } from "./middleware.js";

const router = Router();
const SALT_ROUNDS = 12;

// POST /api/auth/register
router.post("/register", async (req, res) => {
    const { email, password, consent } = req.body;

    if (!email || !password || !consent) {
        return res.status(400).json({ error: "Email, contraseña y consentimiento son requeridos" });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    try {
        const db = getTurso();
        const existing = await db.execute({
            sql: "SELECT id FROM users WHERE email = ?",
            args: [email.toLowerCase()],
        });
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Ya existe una cuenta con ese email" });
        }

        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = uuidv4();
        const encKey = randomBytes(32).toString("hex");
        const now = new Date().toISOString();

        await db.execute({
            sql: `INSERT INTO users (id, email, password_hash, salt, enc_key, consent_at, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [userId, email.toLowerCase(), passwordHash, salt, encKey, now, now],
        });

        const token = signToken(userId);
        res.status(201).json({ token, userId, email: email.toLowerCase() });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    try {
        const db = getTurso();
        const result = await db.execute({
            sql: "SELECT id, password_hash FROM users WHERE email = ?",
            args: [email.toLowerCase()],
        });
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const token = signToken(user.id);
        res.json({ token, userId: user.id, email: email.toLowerCase() });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// DELETE /api/auth/account  — derecho al olvido (RGPD art. 17)
router.delete("/account", authMiddleware, async (req, res) => {
    const userId = req.userId;
    try {
        const db = getTurso();
        await db.batch([
            { sql: "DELETE FROM cloud_interventions WHERE user_id = ?", args: [userId] },
            { sql: "DELETE FROM cloud_communications WHERE user_id = ?", args: [userId] },
            { sql: "DELETE FROM users WHERE id = ?", args: [userId] },
        ]);
        res.json({ message: "Cuenta y todos los datos eliminados permanentemente" });
    } catch (err) {
        console.error("Delete account error:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

export default router;
