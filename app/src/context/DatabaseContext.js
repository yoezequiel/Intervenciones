import React, { createContext, useContext, useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";

const DatabaseContext = createContext(undefined);

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error("useDatabase must be used within a DatabaseProvider");
    }
    return context;
};

export const DatabaseProvider = ({ children }) => {
    const [interventions, setInterventions] = useState([]);
    const [communications, setCommunications] = useState([]);
    const [settingsMap, setSettingsMap] = useState({});
    const [db, setDb] = useState(null);
    const [isDbReady, setIsDbReady] = useState(false);
    const [error, setError] = useState(null);

    const safeJsonParse = (str, defaultValue = []) => {
        try {
            if (!str || str === "null" || str === "undefined") return defaultValue;
            return JSON.parse(str);
        } catch (e) {
            console.warn("Error parsing JSON:", e);
            return defaultValue;
        }
    };

    const initDatabase = async (retryCount = 0) => {
        try {
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const database = await SQLite.openDatabaseAsync("interventions.db");

            if (__DEV__) {
                await database.execAsync("PRAGMA foreign_keys = ON;");
                console.log("SQLite database opened successfully");
            }

            await database.execAsync(`
                CREATE TABLE IF NOT EXISTS interventions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    callTime TEXT,
                    departureTime TEXT,
                    returnTime TEXT,
                    address TEXT,
                    type TEXT,
                    otherServices TEXT,
                    witnesses TEXT,
                    victims TEXT,
                    fieldNotes TEXT,
                    audioNotes TEXT,
                    sketches TEXT,
                    photos TEXT,
                    report TEXT,
                    communicationId INTEGER,
                    latitude REAL,
                    longitude REAL,
                    affectedSurface TEXT,
                    affectedEnvironments TEXT,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                );
            `);

            // Migrations for interventions table
            const interventionInfo = await database.getAllAsync("PRAGMA table_info(interventions)");
            const hasPhotos = interventionInfo.some(col => col.name === 'photos');
            if (!hasPhotos) {
                await database.execAsync("ALTER TABLE interventions ADD COLUMN photos TEXT");
            }
            const hasCommunicationId = interventionInfo.some(col => col.name === 'communicationId');
            if (!hasCommunicationId) {
                await database.execAsync("ALTER TABLE interventions ADD COLUMN communicationId INTEGER");
            }
            const hasLatitude = interventionInfo.some(col => col.name === 'latitude');
            if (!hasLatitude) {
                await database.execAsync("ALTER TABLE interventions ADD COLUMN latitude REAL");
            }
            const hasLongitude = interventionInfo.some(col => col.name === 'longitude');
            if (!hasLongitude) {
                await database.execAsync("ALTER TABLE interventions ADD COLUMN longitude REAL");
            }
            const hasAffectedSurface = interventionInfo.some(col => col.name === 'affectedSurface');
            if (!hasAffectedSurface) {
                await database.execAsync("ALTER TABLE interventions ADD COLUMN affectedSurface TEXT");
            }
            const hasAffectedEnvironments = interventionInfo.some(col => col.name === 'affectedEnvironments');
            if (!hasAffectedEnvironments) {
                await database.execAsync("ALTER TABLE interventions ADD COLUMN affectedEnvironments TEXT");
            }

            await database.execAsync(`
                CREATE TABLE IF NOT EXISTS communications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    callerName TEXT,
                    callerPhone TEXT,
                    time TEXT NOT NULL,
                    address TEXT,
                    incidentType TEXT,
                    status TEXT NOT NULL DEFAULT 'recibido',
                    notes TEXT,
                    interventionId INTEGER,
                    noDispatchReason TEXT,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                );
            `);
            console.log("[DB] Communications table created/verified");

            // Migrations for communications table
            const communicationInfo = await database.getAllAsync("PRAGMA table_info(communications)");
            console.log("[DB] Communications table columns:", communicationInfo);
            const hasNoDispatchReason = communicationInfo.some(col => col.name === 'noDispatchReason');
            if (!hasNoDispatchReason) {
                await database.execAsync("ALTER TABLE communications ADD COLUMN noDispatchReason TEXT");
            }

            await database.execAsync(`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            `);

            await database.execAsync(`
                CREATE TABLE IF NOT EXISTS sync_queue (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_type TEXT NOT NULL,
                    entity_id   INTEGER NOT NULL,
                    operation   TEXT NOT NULL,
                    payload     TEXT,
                    created_at  TEXT NOT NULL,
                    retry_count INTEGER DEFAULT 0
                );
            `);

            // Migration: cloud_synced_at on interventions
            const intInfoFull = await database.getAllAsync("PRAGMA table_info(interventions)");
            if (!intInfoFull.some(col => col.name === 'cloud_synced_at')) {
                await database.execAsync("ALTER TABLE interventions ADD COLUMN cloud_synced_at TEXT");
            }

            // Migration: cloud_synced_at on communications
            const commInfoFull = await database.getAllAsync("PRAGMA table_info(communications)");
            if (!commInfoFull.some(col => col.name === 'cloud_synced_at')) {
                await database.execAsync("ALTER TABLE communications ADD COLUMN cloud_synced_at TEXT");
            }

            // Verify both tables exist
            const allTables = await database.getAllAsync(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            );
            console.log("[DB] All tables in database:", allTables.map(t => t.name));

            setDb(database);
            await loadInterventions(database);
            await loadCommunications(database);
            await loadSettings(database);
            setIsDbReady(true);
        } catch (err) {
            console.error(`Error initializing database (attempt ${retryCount + 1}):`, err);
            if (retryCount < 2) {
                console.log("Retrying database initialization...");
                return await initDatabase(retryCount + 1);
            }
            setError(err);
            setIsDbReady(false);
        }
    };

    useEffect(() => {
        initDatabase();
        return () => {
            if (db) {
                try { db.closeSync(); } catch (e) {}
            }
        };
    }, []);

    const loadInterventions = async (database) => {
        if (!database) return;
        try {
            const result = await database.getAllAsync(
                "SELECT * FROM interventions ORDER BY createdAt DESC"
            );
            console.log(`[DB] Loaded ${result.length} interventions from database`);
            if (__DEV__ && result.length > 0) {
                console.log("[DB] First 3 interventions (newest):", result.slice(0, 3).map(r => ({
                    id: r.id,
                    type: r.type,
                    address: r.address,
                    createdAt: r.createdAt
                })));
            }
            setInterventions(result.map(row => ({
                ...row,
                otherServices: safeJsonParse(row.otherServices, []),
                witnesses: safeJsonParse(row.witnesses, []),
                victims: safeJsonParse(row.victims, []),
                audioNotes: safeJsonParse(row.audioNotes, []),
                sketches: safeJsonParse(row.sketches, []),
                photos: safeJsonParse(row.photos, []),
                affectedEnvironments: safeJsonParse(row.affectedEnvironments, []),
            })));
        } catch (err) {
            console.error("Error loading interventions:", err);
            setInterventions([]);
            throw err;
        }
    };

    const loadCommunications = async (database) => {
        if (!database) return;
        try {
            const result = await database.getAllAsync(
                "SELECT * FROM communications ORDER BY createdAt DESC"
            );
            console.log(`[DB] Loaded ${result.length} communications from database`);
            if (__DEV__ && result.length > 0) {
                console.log("[DB] Communications data:", result);
            }
            setCommunications(result);
        } catch (err) {
            console.error("Error loading communications:", err);
            setCommunications([]);
            throw err;
        }
    };

    const loadSettings = async (database) => {
        if (!database) return;
        try {
            const rows = await database.getAllAsync("SELECT key, value FROM settings");
            const map = {};
            rows.forEach(row => { map[row.key] = row.value; });
            setSettingsMap(map);
        } catch (err) {
            console.error("Error loading settings:", err);
        }
    };

    const refreshInterventions = async () => {
        if (!db) return;
        await loadInterventions(db);
    };

    const refreshCommunications = async () => {
        if (!db) return;
        await loadCommunications(db);
    };

    // ── Interventions CRUD ──────────────────────────────────────────────────

    const addIntervention = async (intervention) => {
        if (!db || !isDbReady) throw new Error("Database not ready");
        const now = new Date().toISOString();
        try {
            console.log("[DB] Adding intervention:", {
                type: intervention.type,
                address: intervention.address,
                createdAt: now
            });
            const result = await db.runAsync(
                `INSERT INTO interventions (
                    callTime, departureTime, returnTime, address, type,
                    otherServices, witnesses, victims, fieldNotes,
                    audioNotes, sketches, photos, communicationId,
                    latitude, longitude, affectedSurface, affectedEnvironments,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                intervention.callTime || null,
                intervention.departureTime || null,
                intervention.returnTime || null,
                intervention.address || null,
                intervention.type || null,
                JSON.stringify(intervention.otherServices || []),
                JSON.stringify(intervention.witnesses || []),
                JSON.stringify(intervention.victims || []),
                intervention.fieldNotes || null,
                JSON.stringify(intervention.audioNotes || []),
                JSON.stringify(intervention.sketches || []),
                JSON.stringify(intervention.photos || []),
                intervention.communicationId || null,
                intervention.latitude ?? null,
                intervention.longitude ?? null,
                intervention.affectedSurface || null,
                JSON.stringify(intervention.affectedEnvironments || []),
                now,
                now
            );
            await loadInterventions(db);
            const newId = result.lastInsertRowId;
            if (settingsMap.firesync_enabled === "true") {
                await enqueueSync("intervention", newId, "create", { ...intervention, id: newId });
            }
            return newId;
        } catch (err) {
            console.error("Error adding intervention:", err);
            throw err;
        }
    };

    const updateIntervention = async (id, updates) => {
        if (!db || !isDbReady) throw new Error("Database not ready");
        const now = new Date().toISOString();
        const fields = Object.keys(updates).filter(key => key !== "id");
        const setClause = fields.map(field => `${field} = ?`).join(", ");
        const values = fields.map(field => {
            const value = updates[field];
            if (["otherServices", "witnesses", "victims", "audioNotes", "sketches", "photos", "affectedEnvironments"].includes(field)) {
                return JSON.stringify(value || []);
            }
            return value ?? null;
        });
        try {
            await db.runAsync(
                `UPDATE interventions SET ${setClause}, updatedAt = ? WHERE id = ?`,
                ...values, now, id
            );
            await loadInterventions(db);
            if (settingsMap.firesync_enabled === "true") {
                await enqueueSync("intervention", id, "update", { ...updates, id, updatedAt: now });
            }
        } catch (err) {
            console.error("Error updating intervention:", err);
            throw err;
        }
    };

    const deleteIntervention = async (id) => {
        if (!db || !isDbReady) throw new Error("Database not ready");
        try {
            await db.runAsync("DELETE FROM interventions WHERE id = ?", id);
            await loadInterventions(db);
            if (settingsMap.firesync_enabled === "true") {
                await enqueueSync("intervention", id, "delete");
            }
        } catch (err) {
            console.error("Error deleting intervention:", err);
            throw err;
        }
    };

    const getIntervention = (id) => {
        if (!id) return null;
        return interventions.find(i => String(i.id) === String(id));
    };

    // ── Communications CRUD ─────────────────────────────────────────────────

    const addCommunication = async (data) => {
        if (!db || !isDbReady) throw new Error("Database not ready");
        const now = new Date().toISOString();
        try {
            console.log("[DB] Attempting to add communication:", data);
            const result = await db.runAsync(
                `INSERT INTO communications (
                    callerName, callerPhone, time, address, incidentType,
                    status, notes, interventionId, noDispatchReason, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                data.callerName || null,
                data.callerPhone || null,
                data.time || now.slice(11, 16),
                data.address || null,
                data.incidentType || null,
                data.status || 'recibido',
                data.notes || null,
                data.interventionId || null,
                data.noDispatchReason || null,
                now,
                now
            );
            console.log("[DB] Communication added with ID:", result.lastInsertRowId);
            await loadCommunications(db);
            const newCommId = result.lastInsertRowId;
            if (settingsMap.firesync_enabled === "true") {
                await enqueueSync("communication", newCommId, "create", { ...data, id: newCommId });
            }
            return newCommId;
        } catch (err) {
            console.error("Error adding communication:", err);
            throw err;
        }
    };

    const updateCommunication = async (id, updates) => {
        if (!db || !isDbReady) throw new Error("Database not ready");
        const now = new Date().toISOString();
        const fields = Object.keys(updates).filter(key => key !== "id");
        const setClause = fields.map(field => `${field} = ?`).join(", ");
        const values = fields.map(field => updates[field] ?? null);
        try {
            await db.runAsync(
                `UPDATE communications SET ${setClause}, updatedAt = ? WHERE id = ?`,
                ...values, now, id
            );
            await loadCommunications(db);
            if (settingsMap.firesync_enabled === "true") {
                await enqueueSync("communication", id, "update", { ...updates, id, updatedAt: now });
            }
        } catch (err) {
            console.error("Error updating communication:", err);
            throw err;
        }
    };

    const deleteCommunication = async (id) => {
        if (!db || !isDbReady) throw new Error("Database not ready");
        try {
            await db.runAsync("DELETE FROM communications WHERE id = ?", id);
            await loadCommunications(db);
            if (settingsMap.firesync_enabled === "true") {
                await enqueueSync("communication", id, "delete");
            }
        } catch (err) {
            console.error("Error deleting communication:", err);
            throw err;
        }
    };

    const getCommunication = (id) => {
        if (!id) return null;
        return communications.find(c => String(c.id) === String(id));
    };

    // ── Sync queue ──────────────────────────────────────────────────────────

    const enqueueSync = async (entityType, entityId, operation, payload = null) => {
        if (!db || !isDbReady) return;
        try {
            await db.runAsync(
                "INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at) VALUES (?, ?, ?, ?, ?)",
                entityType,
                entityId,
                operation,
                payload ? JSON.stringify(payload) : null,
                new Date().toISOString()
            );
        } catch (err) {
            console.error("[DB] Error enqueueing sync operation:", err);
        }
    };

    // ── Settings ────────────────────────────────────────────────────────────

    const getSetting = (key, defaultValue = null) => {
        return settingsMap[key] ?? defaultValue;
    };

    const setSetting = async (key, value) => {
        if (!db || !isDbReady) throw new Error("Database not ready");
        await db.runAsync(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            key,
            String(value)
        );
        setSettingsMap(prev => ({ ...prev, [key]: String(value) }));
    };

    return (
        <DatabaseContext.Provider value={{
            db,
            interventions,
            communications,
            isDbReady,
            error,
            refreshInterventions,
            refreshCommunications,
            addIntervention,
            updateIntervention,
            deleteIntervention,
            getIntervention,
            addCommunication,
            updateCommunication,
            deleteCommunication,
            getCommunication,
            getSetting,
            setSetting,
            enqueueSync,
        }}>
            {children}
        </DatabaseContext.Provider>
    );
};
