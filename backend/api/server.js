import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import authRouter from "./auth.js";
import syncRouter from "./sync.js";
import { initSchema } from "../utils/turso.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Demasiados intentos. Esperá 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/sync", syncRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

initSchema()
    .then(() => console.log("Turso schema ready"))
    .catch((err) => console.error("Schema init error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FireSync backend running on port ${PORT}`));

export default app;
