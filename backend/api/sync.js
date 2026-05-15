import { Router } from "express";
import { getTurso } from "../utils/turso.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { authMiddleware } from "./middleware.js";

const router = Router();

// POST /api/sync/push
router.post("/push", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { interventions = [], communications = [] } = req.body;

    try {
        const db = getTurso();
        const statements = [];

        for (const item of interventions) {
            const cloudId = `${userId}_${item.localId}`;
            if (item.operation === "delete") {
                statements.push({
                    sql: `INSERT INTO cloud_interventions (id, user_id, local_id, encrypted_data, updated_at, deleted)
                          VALUES (?, ?, ?, ?, ?, 1)
                          ON CONFLICT(id) DO UPDATE SET deleted = 1, updated_at = excluded.updated_at`,
                    args: [cloudId, userId, item.localId, "", item.updatedAt],
                });
            } else {
                const encData = encrypt(JSON.stringify(item.payload), userId);
                statements.push({
                    sql: `INSERT INTO cloud_interventions (id, user_id, local_id, encrypted_data, updated_at, deleted)
                          VALUES (?, ?, ?, ?, ?, 0)
                          ON CONFLICT(id) DO UPDATE SET
                            encrypted_data = excluded.encrypted_data,
                            updated_at = excluded.updated_at,
                            deleted = 0
                          WHERE excluded.updated_at > cloud_interventions.updated_at`,
                    args: [cloudId, userId, item.localId, encData, item.updatedAt],
                });
            }
        }

        for (const item of communications) {
            const cloudId = `${userId}_${item.localId}`;
            if (item.operation === "delete") {
                statements.push({
                    sql: `INSERT INTO cloud_communications (id, user_id, local_id, encrypted_data, updated_at, deleted)
                          VALUES (?, ?, ?, ?, ?, 1)
                          ON CONFLICT(id) DO UPDATE SET deleted = 1, updated_at = excluded.updated_at`,
                    args: [cloudId, userId, item.localId, "", item.updatedAt],
                });
            } else {
                const encData = encrypt(JSON.stringify(item.payload), userId);
                statements.push({
                    sql: `INSERT INTO cloud_communications (id, user_id, local_id, encrypted_data, updated_at, deleted)
                          VALUES (?, ?, ?, ?, ?, 0)
                          ON CONFLICT(id) DO UPDATE SET
                            encrypted_data = excluded.encrypted_data,
                            updated_at = excluded.updated_at,
                            deleted = 0
                          WHERE excluded.updated_at > cloud_communications.updated_at`,
                    args: [cloudId, userId, item.localId, encData, item.updatedAt],
                });
            }
        }

        if (statements.length > 0) {
            await db.batch(statements);
        }

        res.json({ synced: statements.length });
    } catch (err) {
        console.error("Sync push error:", err);
        res.status(500).json({ error: "Error al sincronizar" });
    }
});

// GET /api/sync/pull?since=ISO_DATE
router.get("/pull", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const since = req.query.since || "1970-01-01T00:00:00.000Z";

    try {
        const db = getTurso();

        const [intResult, commResult] = await Promise.all([
            db.execute({
                sql: "SELECT local_id, encrypted_data, updated_at, deleted FROM cloud_interventions WHERE user_id = ? AND updated_at > ?",
                args: [userId, since],
            }),
            db.execute({
                sql: "SELECT local_id, encrypted_data, updated_at, deleted FROM cloud_communications WHERE user_id = ? AND updated_at > ?",
                args: [userId, since],
            }),
        ]);

        const decryptRow = (row) => {
            if (row.deleted) return { localId: row.local_id, deleted: true, updatedAt: row.updated_at };
            const payload = JSON.parse(decrypt(row.encrypted_data, userId));
            return { localId: row.local_id, deleted: false, updatedAt: row.updated_at, payload };
        };

        res.json({
            interventions: intResult.rows.map(decryptRow),
            communications: commResult.rows.map(decryptRow),
            pulledAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error("Sync pull error:", err);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

// GET /api/sync/export — portabilidad de datos (RGPD art. 20)
router.get("/export", authMiddleware, async (req, res) => {
    const userId = req.userId;
    try {
        const db = getTurso();
        const [intResult, commResult] = await Promise.all([
            db.execute({
                sql: "SELECT local_id, encrypted_data, updated_at FROM cloud_interventions WHERE user_id = ? AND deleted = 0",
                args: [userId],
            }),
            db.execute({
                sql: "SELECT local_id, encrypted_data, updated_at FROM cloud_communications WHERE user_id = ? AND deleted = 0",
                args: [userId],
            }),
        ]);

        res.json({
            exportedAt: new Date().toISOString(),
            interventions: intResult.rows.map((r) => ({
                localId: r.local_id,
                updatedAt: r.updated_at,
                data: JSON.parse(decrypt(r.encrypted_data, userId)),
            })),
            communications: commResult.rows.map((r) => ({
                localId: r.local_id,
                updatedAt: r.updated_at,
                data: JSON.parse(decrypt(r.encrypted_data, userId)),
            })),
        });
    } catch (err) {
        console.error("Export error:", err);
        res.status(500).json({ error: "Error al exportar datos" });
    }
});

export default router;
