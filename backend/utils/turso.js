import { createClient } from "@libsql/client";

let client = null;

export function getTurso() {
    if (!client) {
        if (!process.env.TURSO_URL || !process.env.TURSO_AUTH_TOKEN) {
            throw new Error("TURSO_URL and TURSO_AUTH_TOKEN environment variables are required");
        }
        client = createClient({
            url: process.env.TURSO_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
    }
    return client;
}

export async function initSchema() {
    const db = getTurso();
    await db.executeMultiple(`
        CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            email       TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt        TEXT NOT NULL,
            enc_key     TEXT NOT NULL,
            consent_at  TEXT NOT NULL,
            created_at  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cloud_interventions (
            id              TEXT PRIMARY KEY,
            user_id         TEXT NOT NULL,
            local_id        INTEGER NOT NULL,
            encrypted_data  TEXT NOT NULL,
            updated_at      TEXT NOT NULL,
            deleted         INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_ci_user ON cloud_interventions(user_id);

        CREATE TABLE IF NOT EXISTS cloud_communications (
            id              TEXT PRIMARY KEY,
            user_id         TEXT NOT NULL,
            local_id        INTEGER NOT NULL,
            encrypted_data  TEXT NOT NULL,
            updated_at      TEXT NOT NULL,
            deleted         INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_cc_user ON cloud_communications(user_id);
    `);
}
